use super::arrow_path::{color, number, text, validate, Input, Rng};
use crate::Dimensions;
use serde::Serialize;
use std::f64::consts::TAU;

#[derive(Debug, Serialize, PartialEq)]
pub struct Ray {
    pub start: [f64; 2],
    pub end: [f64; 2],
    pub width: f64,
    pub progress: f64,
    pub main: bool,
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Scene {
    pub svg: String,
    pub static_svg: String,
    pub motion_svg: String,
    pub rays: Vec<Ray>,
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Frame {
    pub dimensions: Dimensions,
    pub time_seconds: f64,
    pub duration_seconds: f64,
    pub scene: Scene,
}
fn spline(x: f64, a: f64, b: f64, c: f64, d: f64) -> f64 {
    let bez = |t: f64, a: f64, b: f64| {
        3.0 * (1.0 - t).powi(2) * t * a + 3.0 * (1.0 - t) * t * t * b + t.powi(3)
    };
    let (mut lo, mut hi) = (0.0, 1.0);
    for _ in 0..32 {
        let mid = (lo + hi) / 2.0;
        if bez(mid, a, c) < x {
            lo = mid;
        } else {
            hi = mid;
        }
    }
    bez((lo + hi) / 2.0, b, d)
}
fn wander(
    base: f64,
    amp: f64,
    rng: &mut Rng,
    time: f64,
    duration: f64,
    stagger: f64,
    attr: &str,
) -> (f64, String) {
    let values = [
        base,
        base + (rng.next() * 2.0 - 1.0) * amp,
        base + (rng.next() * 2.0 - 1.0) * amp,
        base,
    ];
    let phase = rng.next() * stagger;
    let t = (time / duration + phase).rem_euclid(1.0);
    let (i, f) = if t < 0.33 {
        (0, t / 0.33)
    } else if t < 0.66 {
        (1, (t - 0.33) / 0.33)
    } else {
        (2, (t - 0.66) / 0.34)
    };
    let value = values[i] + (values[i + 1] - values[i]) * spline(f, 0.4, 0.0, 0.6, 1.0);
    (value, format!("<animate attributeName=\"{attr}\" values=\"{};{};{};{}\" keyTimes=\"0;0.33;0.66;1\" calcMode=\"spline\" keySplines=\".4 0 .6 1;.4 0 .6 1;.4 0 .6 1\" dur=\"{duration}s\" begin=\"{}s\" repeatCount=\"indefinite\"/>", values[0],values[1],values[2],values[3],-phase*duration))
}
pub fn evaluate(input: Input) -> Result<Frame, &'static str> {
    validate(&input)?;
    let p = &input.params;
    let w = input.dimensions.width as f64;
    let h = input.dimensions.height as f64;
    let basis = w;
    let stroke = basis * number(p, "stroke", 0.2, 0.0001, 12.0) / 100.0;
    let depth = basis * number(p, "depth", 2.0 / 15.0, 0.0, 8.0) / 100.0;
    let soften = basis * number(p, "soften", 1.0 / 15.0, 0.0, 6.0) / 100.0;
    let radius = w.min(h) / 2.0;
    let count = number(p, "rays", 14.0, 3.0, 40.0) as usize;
    let light = number(p, "light", 225.0, 0.0, 360.0).to_radians();
    let sign = if text(p, "relief", "raised") == "pressed" {
        -1.0
    } else {
        1.0
    };
    let dx = light.cos() * depth * sign;
    let dy = light.sin() * depth * sign;
    let shadow = color(p, "shadow", "#000000");
    let glow = color(p, "glow", "#ffffff");
    let paper = color(p, "paper", "#e9e7e3");
    let line = color(p, "line", "#f1efeb");
    let so = number(p, "shadowO", 20.0, 0.0, 100.0) / 100.0;
    let go = number(p, "glowO", 55.0, 0.0, 100.0) / 100.0;
    let halo = number(p, "halo", 35.0, 0.0, 100.0) / 100.0 * 0.14;
    let defs = format!("<defs><filter id=\"emb\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feDropShadow dx=\"{:.2}\" dy=\"{:.2}\" stdDeviation=\"{soften:.2}\" flood-color=\"{shadow}\" flood-opacity=\"{so}\"/><feDropShadow dx=\"{dx:.2}\" dy=\"{dy:.2}\" stdDeviation=\"{soften:.2}\" flood-color=\"{glow}\" flood-opacity=\"{go}\"/></filter><filter id=\"soft\" x=\"-100%\" y=\"-100%\" width=\"300%\" height=\"300%\"><feGaussianBlur stdDeviation=\"{:.2}\"/></filter></defs>",-dx,-dy,radius*0.02);
    let motion = text(p, "motion", "drift");
    let secs = number(p, "speed", 6.0, 0.5, 20.0);
    let stagger = number(p, "stagger", 60.0, 0.0, 100.0) / 100.0;
    let amp = if motion == "drift" {
        radius * 0.12 * number(p, "drift", 40.0, 0.0, 100.0) / 100.0
    } else {
        0.0
    };
    let growing = motion == "grow in" || motion == "grow loop";
    let looping = motion == "grow loop";
    let mut rng = Rng(input.seed);
    let mut motion_rng = Rng(input.seed.wrapping_mul(31).wrapping_add(7));
    let mut rays = Vec::new();
    let (mut halos, mut strokes, mut animated_halos, mut animated_strokes) =
        (String::new(), String::new(), String::new(), String::new());
    for i in 0..count {
        let angle = i as f64 / count as f64 * TAU
            + (rng.next() - 0.5) * TAU * number(p, "scatter", 60.0, 0.0, 100.0) / 100.0;
        let len = radius * number(p, "length", 78.0, 20.0, 100.0) / 100.0
            * (1.0 - rng.next() * number(p, "vary", 45.0, 0.0, 90.0) / 100.0);
        let r0 = radius * 0.02 * rng.next();
        let sw = stroke * (0.6 + rng.next() * 0.8);
        let paired = rng.next() < number(p, "pairs", 45.0, 0.0, 100.0) / 100.0;
        let companion = (
            angle + (rng.next() - 0.5) * 0.06,
            r0 + len * 0.15 * rng.next(),
            len * (0.5 + rng.next() * 0.45),
            sw * 0.8,
            (rng.next() - 0.5) * stroke * 6.0,
        );
        for (j, (a, start, end, width, off)) in [(angle, r0, len, sw, 0.0), companion]
            .into_iter()
            .enumerate()
        {
            let enabled = j == 0 || paired;
            let x1 = w / 2.0 + a.cos() * start - a.sin() * off;
            let y1 = h / 2.0 + a.sin() * start + a.cos() * off;
            let x2 = w / 2.0 + a.cos() * end - a.sin() * off;
            let y2 = h / 2.0 + a.sin() * end + a.cos() * off;
            let length = (x2 - x1).hypot(y2 - y1);
            let (tx, ax) = wander(
                x2,
                amp,
                &mut motion_rng,
                input.time_seconds,
                secs,
                stagger,
                "x2",
            );
            let (ty, ay) = wander(
                y2,
                amp,
                &mut motion_rng,
                input.time_seconds,
                secs,
                stagger,
                "y2",
            );
            let delay = motion_rng.next() * stagger;
            let phase = if looping {
                (input.time_seconds / secs + delay).rem_euclid(1.0)
            } else {
                (input.time_seconds / secs - delay).clamp(0.0, 1.0)
            };
            let progress = if growing {
                spline((phase / 0.6).min(1.0), 0.16, 1.0, 0.3, 1.0)
            } else {
                1.0
            };
            let anim = if growing {
                format!("<animate attributeName=\"stroke-dashoffset\" values=\"{length};0;0\" keyTimes=\"0;0.6;1\" calcMode=\"spline\" keySplines=\".16 1 .3 1;0 0 1 1\" dur=\"{secs}s\" begin=\"{}s\" {}/>", delay*secs*if looping {-1.0} else {1.0}, if looping {"repeatCount=\"indefinite\""} else {"fill=\"freeze\""})
            } else if amp > 0.0 {
                ax + &ay
            } else {
                String::new()
            };
            if !enabled {
                continue;
            }
            let draw = |x: f64, y: f64, animated: bool, is_halo: bool| {
                let paint = if is_halo {
                    format!(
                        "stroke=\"{glow}\" stroke-width=\"{:.2}\" opacity=\"{halo}\"",
                        width * 12.0
                    )
                } else {
                    format!("stroke=\"{line}\" stroke-width=\"{width:.2}\"")
                };
                let dash = if growing && !is_halo {
                    format!(
                        " stroke-dasharray=\"{length}\" stroke-dashoffset=\"{}\"",
                        if animated {
                            length
                        } else {
                            length * (1.0 - progress)
                        }
                    )
                } else {
                    String::new()
                };
                format!("<line x1=\"{x1:.2}\" y1=\"{y1:.2}\" x2=\"{x:.2}\" y2=\"{y:.2}\" {paint}{dash}>{}</line>",if animated && (!is_halo || !growing) {&anim} else {""})
            };
            strokes.push_str(&draw(tx, ty, false, false));
            animated_strokes.push_str(&draw(x2, y2, true, false));
            if j == 0 && halo > 0.0 {
                halos.push_str(&draw(tx, ty, false, true));
                animated_halos.push_str(&draw(x2, y2, true, true));
            }
            rays.push(Ray {
                start: [x1, y1],
                end: [tx, ty],
                width,
                progress,
                main: j == 0,
            });
        }
    }
    let centers = [
        [0.0, 0.0],
        [
            (motion_rng.next() * 2.0 - 1.0) * amp * 0.6,
            (motion_rng.next() * 2.0 - 1.0) * amp * 0.6,
        ],
        [
            (motion_rng.next() * 2.0 - 1.0) * amp * 0.6,
            (motion_rng.next() * 2.0 - 1.0) * amp * 0.6,
        ],
        [0.0, 0.0],
    ];
    let t = (input.time_seconds / (secs * 1.7)).rem_euclid(1.0);
    let (i, f) = if t < 0.33 {
        (0, t / 0.33)
    } else if t < 0.66 {
        (1, (t - 0.33) / 0.33)
    } else {
        (2, (t - 0.66) / 0.34)
    };
    let ease = spline(f, 0.4, 0.0, 0.6, 1.0);
    let cx = centers[i][0] + (centers[i + 1][0] - centers[i][0]) * ease;
    let cy = centers[i][1] + (centers[i + 1][1] - centers[i][1]) * ease;
    let center_anim = if amp > 0.0 {
        format!("<animateTransform attributeName=\"transform\" type=\"translate\" values=\"0 0;{} {};{} {};0 0\" keyTimes=\"0;0.33;0.66;1\" calcMode=\"spline\" keySplines=\".4 0 .6 1;.4 0 .6 1;.4 0 .6 1\" dur=\"{}s\" repeatCount=\"indefinite\"/>",centers[1][0],centers[1][1],centers[2][0],centers[2][1],secs*1.7)
    } else {
        String::new()
    };
    let center_anim = format!("<g>{center_anim}<g filter=\"url(#soft)\">{animated_halos}</g><g filter=\"url(#emb)\">{animated_strokes}</g></g>");
    let wrap = |body: String| {
        format!("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{w}\" height=\"{h}\" viewBox=\"0 0 {w} {h}\">{defs}<rect width=\"{w}\" height=\"{h}\" fill=\"{paper}\"/>{body}</svg>")
    };
    let svg = wrap(format!("<g transform=\"translate({cx:.2} {cy:.2})\"><g filter=\"url(#soft)\">{halos}</g><g filter=\"url(#emb)\">{strokes}</g></g>"));
    Ok(Frame {
        dimensions: input.dimensions,
        time_seconds: input.time_seconds,
        duration_seconds: if motion == "none" {
            0.0
        } else if motion == "grow in" {
            secs * (1.0 + stagger)
        } else {
            secs
        },
        scene: Scene {
            static_svg: svg.clone(),
            svg,
            motion_svg: wrap(center_anim),
            rays,
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn relief_light_halo_growth_drift_relayout_and_bounds() {
        let mut input = Input {
            dimensions: Dimensions {
                width: 600,
                height: 800,
            },
            seed: 42,
            params: json!({"motion":"none"}),
            time_seconds: 0.0,
        };
        let base = evaluate(input.clone()).unwrap();
        assert_eq!(base, evaluate(input.clone()).unwrap());
        assert!(base.scene.rays.len() >= 14);
        assert!(base.scene.svg.contains("filter=\"url(#soft)\""));
        for (key, value) in [
            ("relief", json!("pressed")),
            ("light", json!(90)),
            ("halo", json!(0)),
            ("shadowO", json!(80)),
            ("glowO", json!(0)),
        ] {
            let mut changed = input.clone();
            changed.params[key] = value;
            assert_ne!(base.scene.svg, evaluate(changed).unwrap().scene.svg);
        }
        for motion in ["drift", "grow in", "grow loop"] {
            input.params["motion"] = json!(motion);
            let first = evaluate(input.clone()).unwrap();
            input.time_seconds = 2.0;
            let later = evaluate(input.clone()).unwrap();
            assert_ne!(first.scene.rays, later.scene.rays);
            assert!(later.scene.motion_svg.contains("<animate"));
            input.time_seconds = 0.0;
        }
        input.dimensions = Dimensions {
            width: 800,
            height: 600,
        };
        let wide = evaluate(input.clone()).unwrap();
        assert_ne!(base.scene.rays[0].start, wide.scene.rays[0].start);
        input.dimensions.width = 99;
        assert!(evaluate(input.clone()).is_err());
        input.dimensions.width = 8001;
        assert!(evaluate(input.clone()).is_err());
        input.dimensions.width = 600;
        input.time_seconds = f64::NAN;
        assert!(evaluate(input).is_err());
    }
}
