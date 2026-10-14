use super::arrow_path::{color, number, text, Rng};
use crate::Dimensions;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use ttf_parser::OutlineBuilder;

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    pub dimensions: Dimensions,
    pub seed: u32,
    pub params: Value,
    pub time_seconds: f64,
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Scene {
    pub svg: String,
    pub static_svg: String,
    pub columns: usize,
    pub tile: [f64; 2],
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Frame {
    pub dimensions: Dimensions,
    pub time_seconds: f64,
    pub duration_seconds: f64,
    pub scene: Scene,
}
#[derive(Default)]
struct Outline {
    edges: Vec<([f64; 2], [f64; 2])>,
    at: [f64; 2],
    start: [f64; 2],
    offset: f64,
}
impl Outline {
    fn line(&mut self, end: [f64; 2]) {
        self.edges.push((self.at, end));
        self.at = end;
    }
}
impl OutlineBuilder for Outline {
    fn move_to(&mut self, x: f32, y: f32) {
        self.at = [x as f64 + self.offset, y as f64];
        self.start = self.at;
    }
    fn line_to(&mut self, x: f32, y: f32) {
        self.line([x as f64 + self.offset, y as f64]);
    }
    fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
        let a = self.at;
        let b = [x1 as f64 + self.offset, y1 as f64];
        let c = [x as f64 + self.offset, y as f64];
        for i in 1..=16 {
            let t = i as f64 / 16.0;
            self.line(std::array::from_fn(|k| {
                (1.0 - t).powi(2) * a[k] + 2.0 * (1.0 - t) * t * b[k] + t * t * c[k]
            }));
        }
    }
    fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
        let a = self.at;
        let b = [x1 as f64 + self.offset, y1 as f64];
        let c = [x2 as f64 + self.offset, y2 as f64];
        let d = [x as f64 + self.offset, y as f64];
        for i in 1..=24 {
            let t = i as f64 / 24.0;
            self.line(std::array::from_fn(|k| {
                (1.0 - t).powi(3) * a[k]
                    + 3.0 * (1.0 - t).powi(2) * t * b[k]
                    + 3.0 * (1.0 - t) * t * t * c[k]
                    + t.powi(3) * d[k]
            }));
        }
    }
    fn close(&mut self) {
        self.line(self.start);
    }
}
// Built-in 5×7 face keeps default lettering independent of host-installed fonts.
fn bitmap(c: char) -> [u8; 7] {
    match c.to_ascii_uppercase() {
        'A' => [14, 17, 17, 31, 17, 17, 17],
        'B' => [30, 17, 17, 30, 17, 17, 30],
        'C' => [14, 17, 16, 16, 16, 17, 14],
        'D' => [30, 17, 17, 17, 17, 17, 30],
        'E' => [31, 16, 16, 30, 16, 16, 31],
        'F' => [31, 16, 16, 30, 16, 16, 16],
        'G' => [14, 17, 16, 23, 17, 17, 14],
        'H' => [17, 17, 17, 31, 17, 17, 17],
        'I' => [31, 4, 4, 4, 4, 4, 31],
        'J' => [7, 2, 2, 2, 18, 18, 12],
        'K' => [17, 18, 20, 24, 20, 18, 17],
        'L' => [16, 16, 16, 16, 16, 16, 31],
        'M' => [17, 27, 21, 21, 17, 17, 17],
        'N' => [17, 25, 21, 19, 17, 17, 17],
        'O' => [14, 17, 17, 17, 17, 17, 14],
        'P' => [30, 17, 17, 30, 16, 16, 16],
        'Q' => [14, 17, 17, 17, 21, 18, 13],
        'R' => [30, 17, 17, 30, 20, 18, 17],
        'S' => [15, 16, 16, 14, 1, 1, 30],
        'T' => [31, 4, 4, 4, 4, 4, 4],
        'U' => [17, 17, 17, 17, 17, 17, 14],
        'V' => [17, 17, 17, 17, 17, 10, 4],
        'W' => [17, 17, 17, 21, 21, 21, 10],
        'X' => [17, 17, 10, 4, 10, 17, 17],
        'Y' => [17, 17, 10, 4, 4, 4, 4],
        'Z' => [31, 1, 2, 4, 8, 16, 31],
        '0' => [14, 17, 19, 21, 25, 17, 14],
        '1' => [4, 12, 4, 4, 4, 4, 14],
        '2' => [14, 17, 1, 2, 4, 8, 31],
        '3' => [30, 1, 1, 14, 1, 1, 30],
        '4' => [2, 6, 10, 18, 31, 2, 2],
        '5' => [31, 16, 16, 30, 1, 1, 30],
        '6' => [14, 16, 16, 30, 17, 17, 14],
        '7' => [31, 1, 2, 4, 8, 8, 8],
        '8' => [14, 17, 17, 14, 17, 17, 14],
        '9' => [14, 17, 17, 15, 1, 1, 14],
        ' ' => [0; 7],
        '-' => [0, 0, 0, 31, 0, 0, 0],
        '.' => [0, 0, 0, 0, 0, 12, 12],
        _ => [31, 17, 1, 2, 4, 0, 4],
    }
}
struct Mask {
    data: Vec<f64>,
    width: usize,
    height: usize,
    adv: f64,
    lh: f64,
    pin: [f64; 2],
}
impl Mask {
    fn at(&self, x: f64, y: f64) -> f64 {
        let u = ((x + self.pin[0]) / self.adv).rem_euclid(1.0);
        let v = ((y + self.pin[1]) / self.lh).rem_euclid(1.0);
        self.data[(v * self.height as f64) as usize * self.width + (u * self.width as f64) as usize]
    }
}
fn mask(p: &Value, width: f64, height: f64, font: &[u8]) -> Result<Mask, &'static str> {
    let face = if font.is_empty() {
        None
    } else {
        Some(ttf_parser::Face::parse(font, 0).map_err(|_| "Invalid OpenType font")?)
    };
    let em = face.as_ref().map_or(7.0, |f| f.units_per_em() as f64);
    let ascent = face.as_ref().map_or(7.0, |f| f.ascender() as f64);
    let mut outline = Outline::default();
    let tracking = number(p, "track", 0.0, -20.0, 200.0) / 100.0 * em;
    let chars: Vec<_> = text(p, "text", "NEXUM").chars().take(512).collect();
    let mut advance = 0.0;
    for (i, c) in chars.iter().enumerate() {
        outline.offset = advance;
        if let Some(f) = &face {
            if let Some(g) = f.glyph_index(*c) {
                f.outline_glyph(g, &mut outline);
                advance += f.glyph_hor_advance(g).unwrap_or(0) as f64;
            }
        } else {
            for (y, row) in bitmap(*c).iter().enumerate() {
                for x in 0..5 {
                    if row & (1 << (4 - x)) != 0 {
                        let a = [advance + x as f64, (6 - y) as f64];
                        outline.move_to(a[0] as f32 - advance as f32, a[1] as f32);
                        outline.line([a[0] + 1.0, a[1]]);
                        outline.line([a[0] + 1.0, a[1] + 1.0]);
                        outline.line([a[0], a[1] + 1.0]);
                        outline.close();
                    }
                }
            }
            advance += 6.0;
        }
        if i + 1 < chars.len() {
            advance += tracking;
        }
    }
    let sx = number(p, "xscale", 100.0, 1.0, 400.0) / 100.0;
    let sy = number(p, "yscale", 100.0, 1.0, 400.0) / 100.0;
    // Relative lengths resolve once here against artboard width.
    let fs = if text(p, "fit", "free") == "fit width" {
        width * em / (advance.max(1.0) * sx)
    } else {
        width * number(p, "fontsize", 20.0, 0.01, 4000.0) / 100.0
    };
    let adv = ((advance / em + number(p, "gapx", 40.0, 0.0, 300.0) / 100.0) * fs * sx)
        .max(width * 0.0001);
    let lh = (fs * sy * number(p, "lineh", 110.0, 20.0, 400.0) / 100.0).max(height * 0.0001);
    let mw = 512;
    let mh = ((mw as f64 * lh / adv).round() as usize).clamp(1, 2048);
    let mut data = vec![0.0; mw * mh];
    let scale = [fs * sx / em, fs * sy / em];
    // Nonzero-winding scan conversion preserves counters and overlapping contours.
    for row in 0..mh {
        let y = (row as f64 + 0.5) / mh as f64 * lh;
        let mut crossings = Vec::new();
        for (a, b) in &outline.edges {
            let a = [a[0] * scale[0], (ascent - a[1]) * scale[1]];
            let b = [b[0] * scale[0], (ascent - b[1]) * scale[1]];
            for wrap_y in -1..=1 {
                let q = y + wrap_y as f64 * lh;
                if (a[1] <= q && b[1] > q) || (b[1] <= q && a[1] > q) {
                    let x = a[0] + (q - a[1]) * (b[0] - a[0]) / (b[1] - a[1]);
                    crossings.push((x, if b[1] > a[1] { 1 } else { -1 }));
                }
            }
        }
        crossings.sort_by(|a, b| a.0.total_cmp(&b.0));
        let mut winding = 0;
        let mut start = 0.0;
        for (x, delta) in crossings {
            if winding == 0 {
                start = x;
            }
            winding += delta;
            if winding == 0 {
                for wrap in -1..=1 {
                    let lo = ((start + wrap as f64 * adv) / adv * mw as f64)
                        .floor()
                        .max(0.0) as usize;
                    let hi = ((x + wrap as f64 * adv) / adv * mw as f64).ceil().max(0.0) as usize;
                    for col in lo.min(mw)..hi.min(mw) {
                        data[row * mw + col] = 1.0;
                    }
                }
            }
        }
    }
    Ok(Mask {
        data,
        width: mw,
        height: mh,
        adv,
        lh,
        pin: [
            -number(p, "basex", 0.0, -100.0, 100.0) / 100.0 * width,
            ascent * scale[1] - number(p, "basey", 0.0, -100.0, 100.0) / 100.0 * height,
        ],
    })
}
fn split(
    cuts: &mut Vec<(f64, f64, usize)>,
    rng: &mut Rng,
    a: f64,
    b: f64,
    depth: usize,
    jitter: f64,
    min: f64,
) {
    let t = 0.5 + (rng.next() - 0.5) * jitter;
    if depth == 0 || b - a <= min * 2.0 {
        cuts.push((a, b, (rng.next() * 3.0) as usize));
    } else {
        let mid = a + (b - a) * t;
        split(cuts, rng, a, mid, depth - 1, jitter, min);
        split(cuts, rng, mid, b, depth - 1, jitter, min);
    }
}
fn round(x: f64) -> f64 {
    (x * 100.0).round() / 100.0
}
// Prototype row lag is horizontal sampling drift, even for vertical scrolling.
fn sample_scroll(direction: [f64; 2], tile: [f64; 2], phase: f64, row_lag: f64) -> [f64; 2] {
    let period = if direction[0] != 0.0 {
        tile[0]
    } else {
        tile[1]
    };
    [
        -direction[0] * period * phase + row_lag * period * phase,
        -direction[1] * period * phase,
    ]
}
pub fn evaluate(input: Input, font: &[u8]) -> Result<Frame, &'static str> {
    let w = input.dimensions.width as f64;
    let h = input.dimensions.height as f64;
    if !(100..=8000).contains(&input.dimensions.width)
        || !(100..=8000).contains(&input.dimensions.height)
        || !input.time_seconds.is_finite()
        || input.time_seconds < 0.0
    {
        return Err("Invalid Stripe Marquee dimensions or time");
    }
    let p = &input.params;
    let m = mask(p, w, h, font)?;
    let mut cuts = Vec::new();
    split(
        &mut cuts,
        &mut Rng(input.seed),
        0.0,
        w,
        number(p, "depth", 7.0, 1.0, 9.0) as usize,
        number(p, "jitter", 45.0, 0.0, 95.0) / 100.0,
        w * number(p, "minw", 0.2666666667, 0.01, 80.0) / 100.0,
    );
    let rows = number(p, "rows", 64.0, 1.0, 240.0) as usize;
    let rh = h / rows as f64;
    let bh = rh * (1.0 - number(p, "rowgap", 0.0, 0.0, 70.0) / 100.0);
    let shear = number(p, "skew", 8.0, -60.0, 60.0).to_radians().tan() * rh;
    let direction = match text(p, "motion", "up") {
        "up" => [0.0, -1.0],
        "down" => [0.0, 1.0],
        "left" => [-1.0, 0.0],
        "right" => [1.0, 0.0],
        _ => [0.0, 0.0],
    };
    let duration = if direction == [0.0, 0.0] {
        0.0
    } else {
        number(p, "secs", 12.0, 1.0, 40.0)
    };
    let phase = if duration == 0.0 {
        0.0
    } else {
        (input.time_seconds / duration).rem_euclid(1.0)
    };
    let points = |r: usize, a: f64, b: f64, phase: f64, k: f64| {
        let slot = b - a;
        let cx = (a + b) / 2.0;
        let cy = r as f64 * rh + bh / 2.0;
        let scroll = sample_scroll(
            direction,
            [m.adv, m.lh],
            phase,
            r as f64 * number(p, "rowlag", 0.0, -100.0, 100.0) / 100.0,
        );
        let off = (r as f64 * number(p, "stagger", 0.0, 0.0, 100.0) / 100.0).rem_euclid(1.0) * w;
        let sy = r as f64 * number(p, "rowphase", 0.0, -100.0, 100.0) / 100.0 * m.lh;
        let mut acc = 0.0;
        for i in -1..=1 {
            for j in -1..=1 {
                acc += m.at(
                    cx + shear / 2.0 + off + scroll[0] + i as f64 * slot / 3.0,
                    cy + scroll[1] + sy + j as f64 * bh / 3.0,
                );
            }
        }
        let mut tone = (acc / 9.0).powf(100.0 / number(p, "contrast", 150.0, 20.0, 400.0));
        let levels = number(p, "levels", 1.0, 1.0, 8.0);
        if levels > 1.0 {
            tone = (tone * (levels - 1.0)).round() / (levels - 1.0);
        }
        let ink = (number(p, "ink0", 12.0, 0.0, 200.0)
            + (number(p, "ink1", 95.0, 0.0, 200.0) - number(p, "ink0", 12.0, 0.0, 200.0)) * tone)
            / 100.0;
        let thick = (if text(p, "scale", "uniform") == "uniform" {
            w / cuts.len() as f64
        } else {
            slot
        }) * ink;
        let thick = thick.min(slot * 0.98);
        let x0 = cx - thick / 2.0 + off + k;
        let x1 = cx + thick / 2.0 + off + k;
        format!(
            "{},{} {},{} {},{} {},{}",
            round(x0 + shear),
            round(r as f64 * rh),
            round(x1 + shear),
            round(r as f64 * rh),
            round(x1),
            round(r as f64 * rh + bh),
            round(x0),
            round(r as f64 * rh + bh)
        )
    };
    let pal = [
        color(p, "c1", "#e8112d"),
        color(p, "c2", "#ff2ec4"),
        color(p, "c3", "#e8112d"),
    ];
    let render = |phase: f64| {
        let mut polygons = String::new();
        for r in 0..rows {
            for &(a, b, c) in &cuts {
                for k in if number(p, "stagger", 0.0, 0.0, 100.0) == 0.0 {
                    vec![0.0]
                } else {
                    vec![0.0, -w]
                } {
                    let pts = points(r, a, b, phase, k);
                    polygons += &format!("<polygon points=\"{pts}\" fill=\"{}\"/>", pal[c]);
                }
            }
        }
        let blend = match text(p, "blend", "normal") {
            "multiply" => "multiply",
            "screen" => "screen",
            "difference" => "difference",
            _ => "normal",
        };
        format!("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{w}\" height=\"{h}\" viewBox=\"0 0 {w} {h}\"><rect width=\"100%\" height=\"100%\" fill=\"{}\"/><g style=\"mix-blend-mode:{blend}\">{polygons}</g></svg>",color(p,"paper","#000000"))
    };
    let svg = render(phase);
    Ok(Frame {
        dimensions: input.dimensions,
        time_seconds: input.time_seconds,
        duration_seconds: duration,
        scene: Scene {
            static_svg: svg.clone(),
            svg,
            columns: cuts.len(),
            tile: [m.adv, m.lh],
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn input() -> Input {
        Input {
            dimensions: Dimensions {
                width: 400,
                height: 300,
            },
            seed: 42,
            params: serde_json::json!({"text":"A","depth":5,"rows":40,"secs":1,"fps":5}),
            time_seconds: 0.0,
        }
    }
    #[test]
    fn font_lettering_controls_and_reproducible_time() {
        let font = include_bytes!("../../../../tests/generators/fixtures/outline.ttf");
        let first = evaluate(input(), font).unwrap();
        assert_eq!(first, evaluate(input(), font).unwrap());
        assert!(!first.scene.svg.contains("<text"));
        assert!(!first.scene.svg.contains("<clipPath"));
        for (key, value) in [
            ("text", serde_json::json!("")),
            ("depth", serde_json::json!(3)),
            ("skew", serde_json::json!(-20)),
            ("xscale", serde_json::json!(150)),
        ] {
            let mut v = input();
            v.params[key] = value;
            assert_ne!(
                first.scene.svg,
                evaluate(v, font).unwrap().scene.svg,
                "{key}"
            );
        }
        for motion in ["up", "down", "left", "right"] {
            let mut v = input();
            v.params["motion"] = serde_json::json!(motion);
            v.time_seconds = 0.4;
            let later = evaluate(v.clone(), font).unwrap();
            assert_ne!(first.scene.svg, later.scene.svg);
            v.time_seconds = 1.4;
            assert_eq!(later.scene.svg, evaluate(v, font).unwrap().scene.svg);
        }
        let mut v = input();
        v.dimensions.width = 800;
        let wide = evaluate(v, font).unwrap();
        assert_ne!(first.scene.tile, wide.scene.tile);
        assert_ne!(first.scene.svg, evaluate(input(), &[]).unwrap().scene.svg);
    }
    #[test]
    fn row_lag_has_prototype_axis_period_and_phase_progression() {
        for (direction, at_half) in [
            ([0.0, -1.0], [10.0, 40.0]),
            ([0.0, 1.0], [10.0, -40.0]),
            ([-1.0, 0.0], [125.0, 0.0]),
            ([1.0, 0.0], [-75.0, 0.0]),
        ] {
            assert_eq!(
                sample_scroll(direction, [200.0, 80.0], 0.0, 0.25),
                [0.0, 0.0]
            );
            assert_eq!(sample_scroll(direction, [200.0, 80.0], 0.5, 0.25), at_half);
            assert_eq!(
                sample_scroll(direction, [200.0, 80.0], 0.25, 0.25),
                at_half.map(|v| v / 2.0)
            );
        }
    }
    #[test]
    fn row_lag_starts_at_zero_and_still_preserves_the_field() {
        for motion in ["up", "down", "left", "right", "none"] {
            let mut baseline = input();
            baseline.params["motion"] = serde_json::json!(motion);
            let mut lagged = baseline.clone();
            lagged.params["rowlag"] = serde_json::json!(17);
            assert_eq!(
                evaluate(baseline.clone(), &[]).unwrap().scene,
                evaluate(lagged.clone(), &[]).unwrap().scene,
                "row lag must vanish at phase zero: {motion}"
            );
            baseline.time_seconds = 0.35;
            lagged.time_seconds = 0.35;
            if motion == "none" {
                assert_eq!(
                    evaluate(baseline, &[]).unwrap().scene,
                    evaluate(lagged, &[]).unwrap().scene
                );
            } else {
                let frame = evaluate(lagged.clone(), &[]).unwrap();
                assert_ne!(evaluate(baseline, &[]).unwrap().scene, frame.scene);
                lagged.time_seconds = 1.35;
                assert_eq!(frame.scene, evaluate(lagged, &[]).unwrap().scene);
            }
        }
    }
    #[test]
    fn boundary_and_still_geometry() {
        for size in [99, 8001] {
            let mut v = input();
            v.dimensions.width = size;
            assert!(evaluate(v, &[]).is_err());
        }
        for size in [100, 8000] {
            let mut v = input();
            v.dimensions = Dimensions {
                width: size,
                height: size,
            };
            assert!(evaluate(v, &[]).is_ok());
        }
        for t in [-1.0, f64::NAN] {
            let mut v = input();
            v.time_seconds = t;
            assert!(evaluate(v, &[]).is_err());
        }
        assert!(evaluate(input(), &[1, 2, 3]).is_err());
        let mut v = input();
        v.params["motion"] = serde_json::json!("none");
        assert_eq!(evaluate(v, &[]).unwrap().duration_seconds, 0.0);
    }
}
