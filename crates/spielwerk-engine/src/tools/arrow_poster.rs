use super::arrow_path::*;
use std::f64::consts::PI;

pub fn evaluate(input: Input) -> Result<Frame, &'static str> {
    validate(&input)?;
    let p = &input.params;
    let count = number(p, "count", 6.0, 1.0, 15.0) as usize;
    let cols = number(p, "cols", 2.0, 1.0, 5.0) as usize;
    let rows = number(p, "rows", 3.0, 1.0, 6.0) as usize;
    let cw = input.dimensions.width as f64 / cols as f64;
    let ch = input.dimensions.height as f64 / rows as f64;
    let mut rng = Rng(input.seed);
    let mut cells: Vec<_> = (0..cols * rows).collect();
    for i in (1..cells.len()).rev() {
        let j = (rng.next() * (i + 1) as f64) as usize;
        cells.swap(i, j);
    }
    let motion = Motion::new(p);
    let kinds: Vec<_> = p["kinds"]
        .as_array()
        .map(|a| {
            a.iter()
                .filter_map(|s| s.as_str())
                .filter(|s| ["block", "round", "roof", "tri", "hook"].contains(s))
                .collect()
        })
        .filter(|a: &Vec<_>| !a.is_empty())
        .unwrap_or(vec!["block", "round", "roof", "tri", "hook"]);
    let mut arrows = Vec::new();
    for i in 0..count {
        let cell = cells[i % cells.len()];
        let jitter = number(p, "jitter", 20.0, 0.0, 100.0) / 100.0;
        let x = (cell % cols) as f64 * cw + cw * (0.5 + (rng.next() - 0.5) * jitter);
        let y = (cell / cols) as f64 * ch + ch * (0.5 + (rng.next() - 0.5) * jitter);
        let scale =
            cw.min(ch) * (0.4 + rng.next() * 0.25) * number(p, "size", 100.0, 40.0, 200.0) / 100.0;
        let mut angle = rng.next() * 360.0;
        let snap = text(p, "snap", "45°");
        if snap != "free" {
            let step = if snap == "90°" { 90.0 } else { 45.0 };
            angle = (angle / step).round() * step;
        }
        let angle = angle.to_radians();
        let kind = kinds[(rng.next() * kinds.len() as f64) as usize];
        let v = number(p, "variety", 25.0, 0.0, 100.0) / 100.0;
        let mut varied = |key, default, min, max| {
            number(p, key, default, min, max) / 100.0 * (1.0 + (rng.next() * 2.0 - 1.0) * v)
        };
        let hw = varied("headW", 95.0, 20.0, 130.0).clamp(0.2, 1.4);
        let hl = varied("headL", 40.0, 15.0, 85.0).clamp(0.15, 0.85);
        let sw = varied("shaftW", 42.0, 8.0, 90.0).clamp(0.08, hw * 0.92);
        let sl = varied("shaftL", 100.0, 10.0, 500.0).clamp(0.1, 5.0);
        let base = -1.0 + 2.0 * hl;
        let mut points = Vec::new();
        let (head_length, head_width) = match kind {
            "hook" => {
                points.push([0.95 * sl, 0.6]);
                points.push([0.0, 0.6]);
                for k in 1..=32 {
                    let a = PI / 2.0 + PI / 2.0 * k as f64 / 32.0;
                    points.push([0.6 * a.cos(), 0.6 * a.sin()]);
                }
                (0.7 * hw, 1.1 * hw)
            }
            "tri" => {
                points.extend([[0.0, 2.7], [0.0, 0.8]]);
                (1.9, hw * 2.0)
            }
            "roof" => {
                points.extend([[0.0, base + 0.4 * sl], [0.0, base]]);
                (2.0 * hl, hw * 4.0)
            }
            _ => {
                points.extend([[0.0, base + (1.0 - base) * sl], [0.0, base]]);
                (2.0 * hl, hw * 2.0)
            }
        };
        let points: Vec<_> = points
            .iter()
            .map(|pt| {
                [
                    x + scale * (pt[0] * angle.cos() - pt[1] * angle.sin()),
                    y + scale * (pt[0] * angle.sin() + pt[1] * angle.cos()),
                ]
            })
            .collect();
        let widths = vec![if kind == "tri" { 0.0 } else { sw * scale }; points.len()];
        let mut shape = polygon(&points, &widths);
        // Round cap differs from a block while preserving the centerline used by motion.
        if kind == "round" {
            let a = points[0];
            let b = points[1];
            let direction = (a[1] - b[1]).atan2(a[0] - b[0]);
            shape = vec![shape[1], shape[2]];
            for k in 0..=16 {
                let theta = direction - PI / 2.0 + PI * k as f64 / 16.0;
                shape.push([
                    a[0] + sw * scale * theta.cos(),
                    a[1] + sw * scale * theta.sin(),
                ]);
            }
        }
        let phase = motion.stagger * (rng.next() * 8.0).round() / 8.0;
        arrows.push(Arrow {
            id: i,
            profile: kind.into(),
            polygon: shape,
            points,
            widths,
            head_length: head_length * scale,
            head_width: head_width * scale,
            phase,
            progress: motion.progress(phase, input.time_seconds),
        });
    }
    let mut order = Vec::new();
    if let Some(saved) = p["zorder"].as_array() {
        for value in saved {
            if let Some(i) = value.as_u64().filter(|i| *i < count as u64) {
                if !order.contains(&(i as usize)) {
                    order.push(i as usize);
                }
            }
        }
    }
    for i in 0..count {
        if !order.contains(&i) {
            order.push(i);
        }
    }
    let width = input.dimensions.width as f64 * number(p, "cwidth", 0.67, 0.0, 3.0) / 100.0;
    let steps = number(p, "steps", 4.0, 1.0, 8.0) as usize;
    let a = color(p, "gradA", "#f3b7c0");
    let b = color(p, "gradB", "#654fa0");
    let mut rings = Vec::new();
    for i in (0..steps).rev() {
        let t = if steps == 1 {
            0.5
        } else {
            i as f64 / (steps - 1) as f64
        };
        let channels: Vec<_> = [1, 3, 5]
            .iter()
            .map(|k| {
                let x = u8::from_str_radix(&a[*k..*k + 2], 16).unwrap() as f64;
                let y = u8::from_str_radix(&b[*k..*k + 2], 16).unwrap() as f64;
                (x + (y - x) * t).round() as u8
            })
            .collect();
        if width > 0.0 {
            rings.push((
                format!("#{:02x}{:02x}{:02x}", channels[0], channels[1], channels[2]),
                width * (i + 1) as f64,
            ));
        }
    }
    let ink = color(p, "color", "#e84f5e");
    let paper = color(p, "paper", "#f4f1ea");
    Ok(frame(
        input,
        arrows,
        order,
        ink,
        paper,
        rings,
        String::new(),
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
            params: serde_json::json!({"motion":"draw loop"}),
            time_seconds: 0.8,
        }
    }
    #[test]
    fn seeded_grid_contours_shapes_order_and_time() {
        let first = evaluate(input()).unwrap();
        assert_eq!(first, evaluate(input()).unwrap());
        assert_eq!(first.scene.arrows.len(), 6);
        assert!(first.scene.svg.contains("stroke-width"));
        assert!(first.scene.motion_svg.contains("animateMotion"));
        assert!(!first.scene.svg.contains("animateMotion"));
        let mut changed = input();
        changed.seed = 99;
        assert_ne!(first.scene.arrows, evaluate(changed).unwrap().scene.arrows);
        let mut changed = input();
        changed.params["zorder"] = serde_json::json!([2, 2, 20, 0]);
        assert_eq!(
            evaluate(changed).unwrap().scene.order,
            vec![2, 0, 1, 3, 4, 5]
        );
        for kind in ["block", "round", "roof", "tri", "hook"] {
            let mut changed = input();
            changed.params["kinds"] = serde_json::json!([kind]);
            assert!(evaluate(changed)
                .unwrap()
                .scene
                .arrows
                .iter()
                .all(|a| a.profile == kind));
        }
        let mut changed = input();
        changed.time_seconds = 0.2;
        assert_ne!(first.scene.svg, evaluate(changed).unwrap().scene.svg);
        let mut changed = input();
        changed.dimensions.width = 900;
        assert_ne!(
            first.scene.arrows[0].points,
            evaluate(changed).unwrap().scene.arrows[0].points
        );
    }
    #[test]
    fn input_boundaries() {
        for size in [99, 8001] {
            let mut changed = input();
            changed.dimensions.width = size;
            assert!(evaluate(changed).is_err());
        }
        for time in [-1.0, f64::NAN] {
            let mut changed = input();
            changed.time_seconds = time;
            assert!(evaluate(changed).is_err());
        }
        for size in [100, 8000] {
            let mut changed = input();
            changed.dimensions = crate::Dimensions {
                width: size,
                height: size,
            };
            assert!(evaluate(changed).is_ok());
        }
    }
}
