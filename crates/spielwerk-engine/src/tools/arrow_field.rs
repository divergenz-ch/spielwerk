use super::arrow_path::{color, number, text, validate, Input as Design, Rng};
use crate::Dimensions;
use serde::{Deserialize, Serialize};
use std::f64::consts::TAU;

#[derive(Clone, Deserialize)]
pub struct Input {
    #[serde(flatten)]
    pub design: Design,
    pub pointer: Option<[f64; 2]>,
}
#[derive(Debug, Serialize, PartialEq)]
pub struct Cell {
    pub x: f64,
    pub y: f64,
    pub angle: f64,
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Scene {
    pub svg: String,
    pub static_svg: String,
    pub motion_svg: String,
    pub cells: Vec<Cell>,
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Frame {
    pub dimensions: Dimensions,
    pub time_seconds: f64,
    pub duration_seconds: f64,
    pub scene: Scene,
}
fn hash(x: i32, y: i32, seed: u32) -> f64 {
    let h = (x as u32).wrapping_mul(374761393)
        ^ (y as u32).wrapping_mul(668265263)
        ^ seed.wrapping_mul(2246822519);
    let h = (h ^ (h >> 13)).wrapping_mul(1274126177);
    (h ^ (h >> 16)) as f64 / 4294967296.0
}
fn noise(x: f64, y: f64, seed: u32) -> f64 {
    let xi = x.floor() as i32;
    let yi = y.floor() as i32;
    let smooth = |t: f64| t * t * (3.0 - 2.0 * t);
    let u = smooth(x - x.floor());
    let v = smooth(y - y.floor());
    let top = hash(xi, yi, seed) * (1.0 - u) + hash(xi + 1, yi, seed) * u;
    let bottom = hash(xi, yi + 1, seed) * (1.0 - u) + hash(xi + 1, yi + 1, seed) * u;
    top * (1.0 - v) + bottom * v
}
pub fn evaluate(input: Input) -> Result<Frame, &'static str> {
    validate(&input.design)?;
    if input
        .pointer
        .is_some_and(|p| p.iter().any(|v| !v.is_finite()))
    {
        return Err("Invalid field pointer");
    }
    let design = input.design;
    let p = &design.params;
    let w = design.dimensions.width as f64;
    let h = design.dimensions.height as f64;
    let cols = number(p, "cols", 14.0, 2.0, 60.0) as usize;
    let side = w / cols as f64;
    let rows = (h / side).round().max(1.0) as usize;
    let len = side * number(p, "len", 55.0, 20.0, 140.0) / 100.0;
    let stroke = (side * number(p, "stroke", 12.0, 2.0, 40.0) / 100.0).max(0.5);
    let head = len * number(p, "head", 40.0, 0.0, 80.0) / 200.0;
    let half = stroke / 2.0;
    let hw = (half * 1.8).max(head * 0.8);
    let xh = len / 2.0 - head;
    let solid = text(p, "shape", "solid") == "solid" && head > 0.0;
    let path = if solid {
        format!(
            "M{} {} L{xh} {} L{xh} {} L{} 0 L{xh} {hw} L{xh} {half} L{} {half} Z",
            -len / 2.0,
            -half,
            -half,
            -hw,
            len / 2.0,
            -len / 2.0
        )
    } else {
        let mut path = format!("M{} 0 H{}", -len / 2.0, len / 2.0);
        if head > 0.0 {
            path.push_str(&format!(
                " M{xh} {} L{} 0 L{xh} {}",
                -hw * 0.9,
                len / 2.0,
                hw * 0.9
            ));
        }
        path
    };
    let ink = color(p, "ink", "#ffffff");
    let ink2 = color(p, "ink2", "#e84f5e");
    let paper = color(p, "paper", "#0d0d0d");
    let wrap = |parts: String| {
        format!("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{w}\" height=\"{h}\" viewBox=\"0 0 {w} {h}\"><rect width=\"{w}\" height=\"{h}\" fill=\"{paper}\"/>{parts}</svg>")
    };
    let motion = text(p, "motion", "wave");
    let moving = motion != "none";
    let secs = number(p, "secs", 8.0, 1.0, 30.0);
    let mut rng = Rng(design.seed);
    let mut cells = Vec::new();
    let mut baked = String::new();
    let mut animated = String::new();
    for row in 0..rows {
        for col in 0..cols {
            let duo = rng.next();
            let jx = rng.next();
            let jy = rng.next();
            let random = rng.next();
            let field = text(p, "field", "noise");
            let scale = number(p, "scale", 8.0, 1.0, 40.0);
            let mut turns = match field {
                "swirl" | "radial" => {
                    (row as f64 - rows as f64 / 2.0).atan2(col as f64 - cols as f64 / 2.0) / TAU
                        + if field == "swirl" { 0.25 } else { 0.0 }
                }
                "grid" => 0.0,
                _ => {
                    noise(col as f64 / scale, row as f64 / scale, design.seed)
                        * number(p, "turns", 2.0, 1.0, 8.0)
                }
            };
            let snap = number(p, "snap", 0.0, 0.0, 12.0);
            if snap > 0.0 {
                turns = (turns * snap).round() / snap;
            }
            let jitter = number(p, "jitter", 0.0, 0.0, 100.0) / 100.0 * side / 2.0;
            let x = (col as f64 + 0.5) * side + (jx * 2.0 - 1.0) * jitter;
            let y = (row as f64 + 0.5) * side + (jy * 2.0 - 1.0) * jitter;
            let phase = match motion {
                "wave" => turns.rem_euclid(1.0),
                "random" => random,
                _ => 0.0,
            };
            let base = turns * 360.0;
            let angle = base
                + if moving {
                    (design.time_seconds / secs + phase).rem_euclid(1.0) * 360.0
                } else {
                    0.0
                };
            let pull = number(p, "pull", 100.0, -100.0, 100.0);
            let correction = input.pointer.map_or(0.0, |pointer| {
                let dx = pointer[0] - x;
                let dy = pointer[1] - y;
                let radius = number(p, "reach", 70.0, 5.0, 200.0) / 100.0 * w.max(h) / 2.0;
                let falloff = (1.0 - dx.hypot(dy) / radius)
                    .max(0.0)
                    .powf(number(p, "grav", 100.0, 20.0, 400.0) / 100.0);
                let target = dy.atan2(dx).to_degrees() + if pull < 0.0 { 180.0 } else { 0.0 };
                let delta = (target - angle + 180.0).rem_euclid(360.0) - 180.0;
                delta * falloff * pull.abs() / 100.0
            });
            let color = if duo < number(p, "duo", 0.0, 0.0, 100.0) / 100.0 {
                &ink2
            } else {
                &ink
            };
            let paint = if solid {
                format!("fill=\"{color}\"")
            } else {
                format!("fill=\"none\" stroke=\"{color}\" stroke-width=\"{stroke}\" stroke-linecap=\"round\" stroke-linejoin=\"round\"")
            };
            let id = cells.len();
            baked.push_str(&format!("<g data-arrow=\"{id}\" transform=\"translate({x} {y})\"><path d=\"{path}\" {paint} transform=\"rotate({})\"/></g>", angle + correction));
            // Portable SMIL is computed without preview pointer state.
            let animation = if moving {
                format!("<animateTransform attributeName=\"transform\" type=\"rotate\" from=\"{base}\" to=\"{}\" dur=\"{secs}s\" begin=\"{}s\" repeatCount=\"indefinite\"/>", base + 360.0, -phase * secs)
            } else {
                String::new()
            };
            animated.push_str(&format!("<g data-arrow=\"{id}\" transform=\"translate({x} {y})\"><path d=\"{path}\" {paint} transform=\"rotate({base})\">{animation}</path></g>"));
            cells.push(Cell {
                x,
                y,
                angle: angle + correction,
            });
        }
    }
    let svg = wrap(baked);
    Ok(Frame {
        dimensions: design.dimensions,
        time_seconds: design.time_seconds,
        duration_seconds: if moving { secs } else { 0.0 },
        scene: Scene {
            static_svg: svg.clone(),
            svg,
            motion_svg: wrap(animated),
            cells,
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn input() -> Input {
        Input {
            design: Design {
                dimensions: Dimensions {
                    width: 400,
                    height: 300,
                },
                seed: 42,
                params: serde_json::json!({"motion":"wave"}),
                time_seconds: 0.5,
            },
            pointer: None,
        }
    }
    #[test]
    fn arrangements_seed_time_rotation_and_responsive_layout() {
        let first = evaluate(input()).unwrap();
        assert_eq!(first, evaluate(input()).unwrap());
        assert_eq!(first.scene.cells.len(), 14 * 11);
        assert!(first.scene.motion_svg.contains("animateTransform"));
        assert!(!first.scene.svg.contains("animateTransform"));
        let mut changed = input();
        changed.design.seed = 99;
        assert_ne!(first.scene.cells, evaluate(changed).unwrap().scene.cells);
        let mut changed = input();
        changed.design.time_seconds = 1.0;
        assert_ne!(first.scene.cells, evaluate(changed).unwrap().scene.cells);
        let mut changed = input();
        changed.design.time_seconds += 8.0;
        let looped = evaluate(changed).unwrap();
        for (a, b) in first.scene.cells.iter().zip(looped.scene.cells) {
            assert!((a.angle - b.angle).abs() < 1e-10);
        }
        let mut layouts = Vec::new();
        for field in ["noise", "swirl", "radial", "grid"] {
            let mut changed = input();
            changed.design.params["field"] = field.into();
            layouts.push(evaluate(changed).unwrap().scene.cells);
        }
        for i in 0..layouts.len() {
            for j in 0..i {
                assert_ne!(layouts[i], layouts[j]);
            }
        }
        let mut changed = input();
        changed.design.dimensions.height = 500;
        let tall = evaluate(changed).unwrap();
        assert!(tall.scene.cells.len() > first.scene.cells.len());
        assert_eq!(tall.scene.cells[0].x, first.scene.cells[0].x);
        let mut changed = input();
        changed.design.params = serde_json::json!({"motion":"none", "snap":4});
        assert!(evaluate(changed)
            .unwrap()
            .scene
            .cells
            .iter()
            .all(|c| (c.angle / 90.0).fract().abs() < 1e-10));
    }
    #[test]
    fn preview_attraction_repulsion_reach_and_portable_motion() {
        let mut value = input();
        value.design.params = serde_json::json!({"field":"grid", "motion":"none"});
        let plain = evaluate(value.clone()).unwrap();
        value.pointer = Some([200.0, 100.0]);
        let attracted = evaluate(value.clone()).unwrap();
        value.design.params["pull"] = (-100).into();
        let repelled = evaluate(value.clone()).unwrap();
        assert_ne!(plain.scene.cells, attracted.scene.cells);
        assert_ne!(attracted.scene.cells, repelled.scene.cells);
        assert_eq!(plain.scene.motion_svg, attracted.scene.motion_svg);
        assert_eq!(plain.scene.motion_svg, repelled.scene.motion_svg);
        value.pointer = Some([10000.0, 10000.0]);
        assert_eq!(plain.scene.svg, evaluate(value.clone()).unwrap().scene.svg);
        value.pointer = Some([200.0, 100.0]);
        value.design.params["pull"] = 0.into();
        assert_eq!(plain.scene.svg, evaluate(value).unwrap().scene.svg);
    }
    #[test]
    fn boundaries_and_line_headless_palette() {
        for (w, h) in [(99, 300), (400, 8001)] {
            let mut value = input();
            value.design.dimensions = Dimensions {
                width: w,
                height: h,
            };
            assert!(evaluate(value).is_err());
        }
        for time in [-1.0, f64::NAN] {
            let mut value = input();
            value.design.time_seconds = time;
            assert!(evaluate(value).is_err());
        }
        let mut value = input();
        value.pointer = Some([f64::NAN, 0.0]);
        assert!(evaluate(value).is_err());
        for (w, h) in [(100, 8000), (8000, 100)] {
            let mut value = input();
            value.design.dimensions = Dimensions {
                width: w,
                height: h,
            };
            value.design.params =
                serde_json::json!({"cols":2, "head":0, "shape":"line", "duo":100});
            let frame = evaluate(value).unwrap();
            assert!(!frame.scene.cells.is_empty());
            assert!(frame.scene.svg.contains("stroke=\"#e84f5e\""));
        }
    }
}
