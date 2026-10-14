use super::arrow_maze::Outline;
use super::arrow_path::*;
use std::f64::consts::PI;

fn text_row(
    text: &str,
    y: f64,
    height: f64,
    width: f64,
    size: f64,
    face: Option<&ttf_parser::Face>,
    ink: &str,
) -> String {
    let segments: Vec<_> = text
        .split('|')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .collect();
    let mut result = format!("<g data-text=\"row\" fill=\"{ink}\">");
    for (i, segment) in segments.iter().enumerate() {
        let anchor = if i == 0 {
            "start"
        } else if i == segments.len() - 1 {
            "end"
        } else {
            "middle"
        };
        let x = if i == 0 {
            width * 0.03
        } else {
            width * 0.03 + width * 0.94 * i as f64 / (segments.len() - 1) as f64
        };
        if let Some(face) = face {
            let scale = size / face.units_per_em() as f64;
            let advance: f64 = segment
                .chars()
                .filter_map(|c| face.glyph_index(c))
                .map(|g| face.glyph_hor_advance(g).unwrap_or(0) as f64 * scale)
                .sum();
            let x = x - if anchor == "end" {
                advance
            } else if anchor == "middle" {
                advance / 2.0
            } else {
                0.0
            };
            let baseline =
                y + height / 2.0 + (face.ascender() as f64 + face.descender() as f64) * scale / 2.0;
            let mut outline = Outline {
                d: String::new(),
                x,
                y: baseline,
                scale,
            };
            for c in segment.chars() {
                if let Some(g) = face.glyph_index(c) {
                    face.outline_glyph(g, &mut outline);
                    outline.x += face.glyph_hor_advance(g).unwrap_or(0) as f64 * scale;
                }
            }
            result += &format!("<path d=\"{}\"/>", outline.d);
        } else {
            result += &format!("<text x=\"{x}\" y=\"{}\" font-family=\"Arial, sans-serif\" font-weight=\"700\" font-size=\"{size}\" text-anchor=\"{anchor}\" dominant-baseline=\"central\">{}</text>", y + height / 2.0, esc(segment));
        }
    }
    result + "</g>"
}
pub fn evaluate(input: Input, font: &[u8]) -> Result<Frame, &'static str> {
    validate(&input)?;
    let face = if font.is_empty() {
        None
    } else {
        Some(ttf_parser::Face::parse(font, 0).map_err(|_| "Invalid OpenType font")?)
    };
    let p = &input.params;
    let width = input.dimensions.width as f64;
    let height = input.dimensions.height as f64;
    let bands = number(p, "bands", 4.0, 1.0, 8.0) as usize;
    let count = number(p, "count", 22.0, 4.0, 60.0);
    let size = number(p, "size", 100.0, 25.0, 400.0) / 100.0;
    let variety = number(p, "variety", 35.0, 0.0, 100.0) / 100.0;
    let mut rng = Rng(input.seed);
    let motion = Motion::new(p);
    let directions = ["up", "down", "left", "right"];
    let dirs: Vec<_> = p["dirs"]
        .as_array()
        .map(|a| {
            a.iter()
                .filter_map(|s| s.as_str())
                .filter(|s| directions.contains(s))
                .collect()
        })
        .filter(|a: &Vec<_>| !a.is_empty())
        .unwrap_or(vec!["up", "down"]);
    let profile = text(p, "profile", "mixed");
    let weights: Vec<_> = (0..bands).map(|_| 0.6 + rng.next() * 0.9).collect();
    let total: f64 = weights.iter().sum();
    let rows = [
        text(p, "textTop", "29.11.25|09–17h"),
        text(p, "textMid", "Arrow|Comb|2026"),
        text(p, "textBot", ""),
    ];
    let text_count = rows.iter().filter(|s| !s.trim().is_empty()).count();
    let text_size = width * number(p, "textpx", 12.0, 1.0, 24.0) / 100.0;
    // Reserve arrow space even at the minimum responsive height with all text rows enabled.
    let row_height = (text_size * 1.4).min(height * 0.5 / text_count.max(1) as f64);
    let text_size = text_size.min(row_height / 1.4);
    let available = height - text_count as f64 * row_height;
    let ink = color(p, "ink", "#111111");
    let paper = color(p, "paper", "#ffffff");
    let mut y = 0.0;
    let mut text_svg = String::new();
    let mut arrows = Vec::new();
    if !rows[0].trim().is_empty() {
        text_svg += &text_row(
            rows[0],
            y,
            row_height,
            width,
            text_size,
            face.as_ref(),
            &ink,
        );
        y += row_height;
    }
    for (bi, weight) in weights.iter().enumerate() {
        let bh = available * weight / total;
        let dir = dirs[(rng.next() * dirs.len() as f64) as usize];
        let kind = if ["fan", "wave", "swirl"].contains(&profile) {
            profile
        } else {
            ["fan", "wave", "swirl"][(rng.next() * 3.0) as usize]
        };
        let phase = rng.next();
        let freq = [0.5, 1.0, 1.5][(rng.next() * 3.0) as usize];
        let sign = if rng.next() < 0.5 { -1.0 } else { 1.0 };
        let len_jitter = 1.0 + (rng.next() * 2.0 - 1.0) * variety * 0.4;
        let mut edges = vec![dir];
        for d in &dirs {
            if *d != dir
                && (kind == "swirl"
                    || (["left", "right"].contains(d) == ["left", "right"].contains(&dir)))
                && rng.next() < number(p, "nest", 60.0, 0.0, 100.0) / 100.0
            {
                edges.push(d);
            }
        }
        for direction in edges {
            let horizontal = ["left", "right"].contains(&direction);
            let across = if horizontal { bh } else { width };
            let depth = if horizontal { width } else { bh };
            let off = if ["down", "left"].contains(&direction) {
                0.5
            } else {
                0.0
            };
            let map = |u: f64, d: f64| match direction {
                "down" => [u, y + bh - d],
                "left" => [d, y + u],
                "right" => [width - d, y + u],
                _ => [u, y + d],
            };
            let spacing = width / count;
            let n = (across / spacing).round().max(1.0) as usize;
            let scale = spacing * size;
            let head_length = scale * number(p, "headL", 85.0, 20.0, 200.0) / 100.0;
            let head_width = scale * number(p, "headW", 95.0, 30.0, 200.0) / 100.0;
            let thick = scale * number(p, "thick", 40.0, 5.0, 100.0) / 100.0;
            let swing = number(p, "swing", 100.0, 0.0, 170.0).to_radians();
            for i in 0..n {
                // A half-spacing nesting offset cannot displace a band's only anchor.
                let q = if n == 1 {
                    0.5
                } else {
                    (i as f64 + 0.5 + off) / n as f64
                };
                if q >= 1.0 {
                    continue;
                }
                let u0 = q * across;
                let prof = if kind == "fan" {
                    2.0 * q - 1.0
                } else {
                    (2.0 * PI * (freq * q + phase)).sin()
                };
                let length = (depth * number(p, "len", 85.0, 20.0, 160.0) / 100.0
                    * size
                    * len_jitter
                    * (1.0 + 0.8 * prof.abs()))
                .max(head_length);
                let d0 = head_length * 0.8;
                let mut samples = vec![map(u0, d0)];
                let mut u = u0;
                let mut d = d0;
                let corner = if (off > 0.0) ^ (sign < 0.0) {
                    across
                } else {
                    0.0
                };
                let radius = (u0 - corner).abs().max(1.0);
                let theta = swing.min(length / radius);
                for k in 1..=22 {
                    if kind == "swirl" {
                        let a = theta * k as f64 / 22.0;
                        u = corner + (u0 - corner) * a.cos();
                        d = d0 + radius * a.sin();
                    } else {
                        let a = swing
                            * sign
                            * prof
                            * ((k as f64 - 0.5) / 22.0).powf(number(p, "curve", 1.8, 0.5, 4.0));
                        u += a.sin() * length / 22.0;
                        d += a.cos() * length / 22.0;
                    }
                    if k > 2 && d > depth {
                        break;
                    }
                    samples.push(map(u, d));
                }
                // Reverse to tail→head so width grows from zero and head follows the reveal.
                samples.reverse();
                let widths: Vec<_> = (0..samples.len())
                    .map(|k| {
                        thick / 2.0
                            * (k as f64 / (samples.len() - 1) as f64)
                                .powf(number(p, "taper", 1.0, 0.3, 3.0))
                    })
                    .collect();
                let phase = motion.stagger * (bi as f64 + q) / bands as f64;
                arrows.push(Arrow {
                    id: arrows.len(),
                    profile: kind.into(),
                    polygon: polygon(&samples, &widths),
                    points: samples,
                    widths,
                    head_length,
                    head_width,
                    phase,
                    progress: motion.progress(phase, input.time_seconds),
                });
            }
        }
        y += bh;
        if bi == bands.div_ceil(2) - 1 && !rows[1].trim().is_empty() {
            text_svg += &text_row(
                rows[1],
                y,
                row_height,
                width,
                text_size,
                face.as_ref(),
                &ink,
            );
            y += row_height;
        }
    }
    if !rows[2].trim().is_empty() {
        text_svg += &text_row(
            rows[2],
            y,
            row_height,
            width,
            text_size,
            face.as_ref(),
            &ink,
        );
    }
    let order = (0..arrows.len()).collect();
    Ok(frame(
        input,
        arrows,
        order,
        ink,
        paper,
        Vec::new(),
        text_svg,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    fn input() -> Input {
        Input {
            dimensions: crate::Dimensions {
                width: 600,
                height: 800,
            },
            seed: 42,
            params: serde_json::json!({"motion":"draw loop","nest":0}),
            time_seconds: 0.8,
        }
    }
    #[test]
    fn profiles_taper_text_seed_and_time() {
        let first = evaluate(input(), &[]).unwrap();
        assert_eq!(first, evaluate(input(), &[]).unwrap());
        let mut profiles = Vec::new();
        for profile in ["fan", "wave", "swirl"] {
            let mut value = input();
            value.params["profile"] = serde_json::json!(profile);
            let frame = evaluate(value, &[]).unwrap();
            assert!(frame.scene.svg.contains("data-text"));
            assert!(frame.scene.arrows.iter().all(|a| a.profile == profile
                && a.widths[0] == 0.0
                && a.widths.last().unwrap() > &0.0));
            profiles.push(frame.scene.arrows[0].points.clone());
        }
        assert_ne!(profiles[0], profiles[1]);
        assert_ne!(profiles[1], profiles[2]);
        let mut changed = input();
        changed.seed = 99;
        assert_ne!(
            first.scene.arrows,
            evaluate(changed, &[]).unwrap().scene.arrows
        );
        let mut changed = input();
        changed.time_seconds = 0.1;
        assert_ne!(first.scene.svg, evaluate(changed, &[]).unwrap().scene.svg);
        let mut changed = input();
        changed.params["taper"] = serde_json::json!(3);
        assert_ne!(
            first.scene.arrows[0].widths,
            evaluate(changed, &[]).unwrap().scene.arrows[0].widths
        );
        let mut changed = input();
        changed.dimensions.width = 900;
        assert_ne!(
            first.scene.arrows[0].points,
            evaluate(changed, &[]).unwrap().scene.arrows[0].points
        );
    }
    #[test]
    fn narrow_single_arrow_bands_keep_an_interior_anchor() {
        for direction in ["left", "right", "up", "down"] {
            let mut value = input();
            value.dimensions = if ["left", "right"].contains(&direction) {
                crate::Dimensions {
                    width: 8000,
                    height: 100,
                }
            } else {
                crate::Dimensions {
                    width: 100,
                    height: 8000,
                }
            };
            value.params["count"] = serde_json::json!(4);
            value.params["dirs"] = serde_json::json!([direction]);
            let frame = evaluate(value, &[]).unwrap();
            assert!(
                !frame.scene.arrows.is_empty(),
                "{direction} bands must retain arrows"
            );
            assert!(frame.scene.svg.contains("data-arrow="));
        }
    }
    #[test]
    fn font_rows_are_baked_and_boundaries_hold() {
        let value = input();
        let font = include_bytes!("../../../../tests/generators/fixtures/outline.ttf");
        let frame = evaluate(value, font).unwrap();
        assert!(!frame.scene.svg.contains("<text"));
        assert!(frame.scene.svg.contains("<path d=\"M"));
        assert!(evaluate(input(), &[0, 1, 2]).is_err());
        for size in [99, 8001] {
            let mut value = input();
            value.dimensions.height = size;
            assert!(evaluate(value, &[]).is_err());
        }
        for size in [100, 8000] {
            let mut value = input();
            value.dimensions = crate::Dimensions {
                width: size,
                height: size,
            };
            assert!(evaluate(value, &[]).is_ok());
        }
        for time in [-1.0, f64::NAN] {
            let mut value = input();
            value.time_seconds = time;
            assert!(evaluate(value, &[]).is_err());
        }
    }
}
