use crate::Dimensions;
use serde::{Deserialize, Serialize};
use serde_json::Value;

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
pub struct Arrow {
    pub id: usize,
    pub profile: String,
    pub points: Vec<[f64; 2]>, // tail to head base, in artboard coordinates
    pub widths: Vec<f64>,      // half-width at each centerline sample
    pub polygon: Vec<[f64; 2]>,
    pub head_length: f64,
    pub head_width: f64,
    pub phase: f64,
    pub progress: f64,
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Scene {
    pub svg: String,
    pub static_svg: String,
    pub motion_svg: String,
    pub arrows: Vec<Arrow>,
    pub order: Vec<usize>,
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Frame {
    pub dimensions: Dimensions,
    pub time_seconds: f64,
    pub duration_seconds: f64,
    pub scene: Scene,
}
pub fn number(p: &Value, key: &str, default: f64, min: f64, max: f64) -> f64 {
    p[key]
        .as_f64()
        .filter(|v| v.is_finite())
        .unwrap_or(default)
        .clamp(min, max)
}
pub fn text<'a>(p: &'a Value, key: &str, default: &'a str) -> &'a str {
    p[key].as_str().unwrap_or(default)
}
pub fn color(p: &Value, key: &str, default: &str) -> String {
    let s = text(p, key, default);
    if s.len() == 7 && s.starts_with('#') && s[1..].bytes().all(|c| c.is_ascii_hexdigit()) {
        s.into()
    } else {
        default.into()
    }
}
pub fn esc(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}
pub fn validate(input: &Input) -> Result<(), &'static str> {
    if !(100..=8000).contains(&input.dimensions.width)
        || !(100..=8000).contains(&input.dimensions.height)
        || !input.time_seconds.is_finite()
        || input.time_seconds < 0.0
    {
        Err("Invalid arrow-path dimensions or time")
    } else {
        Ok(())
    }
}
pub struct Rng(pub u32);
impl Rng {
    pub fn next(&mut self) -> f64 {
        self.0 = self.0.wrapping_add(0x6d2b79f5);
        let mut t = (self.0 ^ (self.0 >> 15)).wrapping_mul(self.0 | 1);
        t ^= t.wrapping_add((t ^ (t >> 7)).wrapping_mul(t | 61));
        (t ^ (t >> 14)) as f64 / 4294967296.0
    }
}
pub struct Motion {
    pub moving: bool,
    pub looping: bool,
    pub speed: f64,
    pub hold: f64,
    pub stagger: f64,
    pub timing: String,
}
impl Motion {
    pub fn new(p: &Value) -> Self {
        Self {
            moving: text(p, "motion", "none") != "none",
            looping: text(p, "motion", "none") == "draw loop",
            speed: number(p, "speed", 3.0, 0.5, 20.0),
            hold: 1.0 - number(p, "hold", 35.0, 0.0, 90.0) / 100.0,
            stagger: number(p, "stagger", 50.0, 0.0, 100.0) / 100.0,
            timing: text(p, "timing", "ease out").into(),
        }
    }
    pub fn duration(&self) -> f64 {
        if !self.moving {
            0.0
        } else if self.looping {
            self.speed
        } else {
            self.speed * (1.0 + self.stagger)
        }
    }
    pub fn progress(&self, phase: f64, time: f64) -> f64 {
        if !self.moving {
            return 1.0;
        }
        let c = if self.looping {
            (time / self.speed + phase).rem_euclid(1.0)
        } else {
            (time / self.speed - phase).clamp(0.0, 1.0)
        };
        let x = (c / self.hold).clamp(0.0, 1.0);
        match self.timing.as_str() {
            "linear" => x,
            "snap" => {
                if x >= 1.0 {
                    1.0
                } else {
                    0.0
                }
            }
            _ => 1.0 - (1.0 - x).powi(3),
        }
    }
    fn timeline(&self, phase: f64) -> Vec<(f64, f64)> {
        let start = if self.looping {
            0.0
        } else {
            phase * self.speed / self.duration()
        };
        let end = if self.looping {
            self.hold
        } else {
            ((phase + self.hold) * self.speed / self.duration()).min(1.0)
        };
        let mut knots = vec![(0.0, 0.0)];
        if start > 0.0 {
            knots.push((start, 0.0));
        }
        knots.push((end, 1.0));
        if end < 1.0 {
            knots.push((1.0, 1.0));
        }
        knots
    }
    fn smil(&self, phase: f64) -> String {
        // Omit zero-duration wait/hold segments so keyTimes are strictly increasing.
        let knots = self.timeline(phase);
        let times: Vec<_> = knots.iter().map(|(t, _)| *t).collect();
        let segments: Vec<_> = knots
            .windows(2)
            .map(|pair| pair[0].1 != pair[1].1)
            .collect();
        let calc = if self.timing == "snap" {
            " calcMode=\"discrete\"".into()
        } else {
            let spline = if self.timing == "linear" {
                "0 0 1 1"
            } else {
                "0.333333333333 1 0.666666666667 1"
            };
            format!(
                " calcMode=\"spline\" keySplines=\"{}\"",
                segments
                    .iter()
                    .map(|reveal| if *reveal { spline } else { "0 0 1 1" })
                    .collect::<Vec<_>>()
                    .join(";")
            )
        };
        format!(
            " keyTimes=\"{}\" dur=\"{}s\" begin=\"{}s\" {}{}",
            times
                .iter()
                .map(|x| x.to_string())
                .collect::<Vec<_>>()
                .join(";"),
            self.duration(),
            if self.looping {
                -phase * self.speed
            } else {
                0.0
            },
            if self.looping {
                "repeatCount=\"indefinite\""
            } else {
                "fill=\"freeze\""
            },
            calc
        )
    }
}
pub fn polygon(points: &[[f64; 2]], widths: &[f64]) -> Vec<[f64; 2]> {
    let mut left = Vec::new();
    let mut right = Vec::new();
    for (i, p) in points.iter().enumerate() {
        let a = points[i.saturating_sub(1)];
        let b = points[(i + 1).min(points.len() - 1)];
        let dx = b[0] - a[0];
        let dy = b[1] - a[1];
        let len = dx.hypot(dy).max(0.001);
        left.push([p[0] - dy / len * widths[i], p[1] + dx / len * widths[i]]);
        right.push([p[0] + dy / len * widths[i], p[1] - dx / len * widths[i]]);
    }
    left.extend(right.into_iter().rev());
    left
}
pub fn path(points: &[[f64; 2]], close: bool) -> String {
    format!(
        "M{}{}",
        points
            .iter()
            .map(|p| format!("{} {}", p[0], p[1]))
            .collect::<Vec<_>>()
            .join("L"),
        if close { "Z" } else { "" }
    )
}
fn pose(points: &[[f64; 2]], progress: f64) -> (f64, String) {
    let lengths: Vec<_> = points
        .windows(2)
        .map(|p| (p[1][0] - p[0][0]).hypot(p[1][1] - p[0][1]))
        .collect();
    let total: f64 = lengths.iter().sum();
    let mut target = total * progress;
    for (i, len) in lengths.iter().enumerate() {
        if target <= *len || i == lengths.len() - 1 {
            let t = (target / len.max(0.001)).clamp(0.0, 1.0);
            let a = points[i];
            let b = points[i + 1];
            return (
                total,
                format!(
                    "translate({} {}) rotate({})",
                    a[0] + (b[0] - a[0]) * t,
                    a[1] + (b[1] - a[1]) * t,
                    (b[1] - a[1]).atan2(b[0] - a[0]).to_degrees()
                ),
            );
        }
        target -= len;
    }
    (total, String::new())
}
fn arrow_svg(
    a: &Arrow,
    motion: &Motion,
    ink: &str,
    rings: &[(String, f64)],
    animated: bool,
    full: bool,
) -> String {
    let (length, transform) = pose(&a.points, if full { 1.0 } else { a.progress });
    let moving = motion.moving && !full;
    let d = path(&a.points, false);
    let shaft = path(&a.polygon, true);
    let head = format!(
        "M-0.5 {}L{} 0L-0.5 {}Z",
        -a.head_width / 2.0,
        a.head_length,
        a.head_width / 2.0
    );
    let outer = rings.iter().map(|(_, w)| *w).fold(0.0, f64::max);
    let width = a.widths.iter().copied().fold(0.0, f64::max) * 2.0 + outer * 2.0 + 2.0;
    let mut defs = String::new();
    let mut head_motion = String::new();
    let mut head_attr = format!(" transform=\"{}\"", transform);
    if moving {
        let mut reveal = String::new();
        let mut offset = length * (1.0 - a.progress);
        if animated {
            let smil = motion.smil(a.phase);
            let knots = motion.timeline(a.phase);
            let values = knots
                .iter()
                .map(|(_, r)| (length * (1.0 - r)).to_string())
                .collect::<Vec<_>>()
                .join(";");
            let points = knots
                .iter()
                .map(|(_, r)| r.to_string())
                .collect::<Vec<_>>()
                .join(";");
            reveal =
                format!("<animate attributeName=\"stroke-dashoffset\" values=\"{values}\"{smil}/>");
            head_motion = format!(
                "<animateMotion path=\"{d}\" rotate=\"auto\" keyPoints=\"{points}\"{smil}/>"
            );
            head_attr.clear();
            offset = length;
        }
        defs = format!("<defs><mask id=\"a{}\" maskUnits=\"userSpaceOnUse\" x=\"-16000\" y=\"-16000\" width=\"32000\" height=\"32000\"><path d=\"{d}\" fill=\"none\" stroke=\"white\" stroke-width=\"{width}\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-dasharray=\"{length} {length}\" stroke-dashoffset=\"{offset}\">{reveal}</path></mask></defs>", a.id);
    }
    let mask = if moving {
        format!(" mask=\"url(#a{})\"", a.id)
    } else {
        String::new()
    };
    let mut parts = String::new();
    for (c, w) in rings.iter().chain(std::iter::once(&(ink.into(), 0.0))) {
        let stroke = if *w > 0.0 {
            format!(
                " stroke=\"{c}\" stroke-width=\"{}\" stroke-linejoin=\"round\"",
                w * 2.0
            )
        } else {
            String::new()
        };
        parts += &format!("<path d=\"{shaft}\" fill=\"{c}\"{stroke}{mask}/><g{head_attr}>{head_motion}<path d=\"{head}\" fill=\"{c}\"{stroke}/></g>");
    }
    format!(
        "<g data-arrow=\"{}\" data-profile=\"{}\">{defs}{parts}</g>",
        a.id,
        esc(&a.profile)
    )
}
pub fn frame(
    input: Input,
    arrows: Vec<Arrow>,
    order: Vec<usize>,
    ink: String,
    paper: String,
    rings: Vec<(String, f64)>,
    text_svg: String,
) -> Frame {
    let motion = Motion::new(&input.params);
    let render = |animated, full| {
        let content = order
            .iter()
            .map(|i| arrow_svg(&arrows[*i], &motion, &ink, &rings, animated, full))
            .collect::<String>();
        format!("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{}\" height=\"{}\" viewBox=\"0 0 {} {}\"><rect width=\"100%\" height=\"100%\" fill=\"{paper}\"/>{content}{text_svg}</svg>", input.dimensions.width, input.dimensions.height, input.dimensions.width, input.dimensions.height)
    };
    Frame {
        scene: Scene {
            svg: render(false, false),
            static_svg: render(false, true),
            motion_svg: render(true, false),
            arrows,
            order,
        },
        duration_seconds: motion.duration(),
        dimensions: input.dimensions,
        time_seconds: input.time_seconds,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn no_hold_smil_has_no_zero_length_segments() {
        for motion in ["draw in", "draw loop"] {
            let m = Motion::new(&serde_json::json!({"motion":motion,"hold":0,"stagger":0}));
            assert!(m.smil(0.0).contains("keyTimes=\"0;1\""));
            assert!(!m.smil(0.0).contains("0;1;1"));
        }
    }
    #[test]
    fn explicit_timing_and_smil_agree_for_each_timing() {
        for timing in ["linear", "ease out", "snap"] {
            let m = Motion::new(
                &serde_json::json!({"motion":"draw loop","speed":2,"hold":50,"timing":timing}),
            );
            let expected = match timing {
                "linear" => 0.5,
                "snap" => 0.0,
                _ => 0.875,
            };
            assert_eq!(m.progress(0.0, 0.5), expected);
            assert_eq!(m.progress(0.0, 2.5), expected);
            assert_eq!(m.progress(0.0, 1.5), 1.0);
            assert!(m.smil(0.0).contains("keyTimes=\"0;0.5;1\""));
        }
        let m =
            Motion::new(&serde_json::json!({"motion":"draw in","speed":2,"stagger":100,"hold":50}));
        assert_eq!(m.duration(), 4.0);
        assert_eq!(m.progress(0.5, 0.5), 0.0);
        assert_eq!(m.progress(0.5, 10.0), 1.0);
    }
}
