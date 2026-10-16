use super::arrow_path::{color, number, text, Input, Rng};
use crate::Dimensions;
use serde::Serialize;

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Scene {
    kind: &'static str,
    scale: f64,
    distortion: f64,
    softness: f64,
    grain: f64,
    image_mix: f64,
    image_fit: &'static str,
    offset: [f64; 2],
    orbit: [f64; 2],
    colors: [[f64; 3]; 4],
}

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Frame {
    dimensions: Dimensions,
    time_seconds: f64,
    duration_seconds: f64,
    scene: Scene,
}

/// Rust owns validation, random draws and time. The GPU shades these uniforms.
pub fn evaluate(input: Input) -> Result<Frame, &'static str> {
    if !(1..=4096).contains(&input.dimensions.width)
        || !(1..=4096).contains(&input.dimensions.height)
        || !input.time_seconds.is_finite()
        || input.time_seconds < 0.0
    {
        return Err("Invalid Liquid Gradients dimensions or time (maximum 4096 px)");
    }
    let p = &input.params;
    let duration = if text(p, "motion", "loop") == "none" {
        0.0
    } else {
        24.0 / number(p, "speed", 1.0, 0.1, 3.0)
    };
    let phase = if duration > 0.0 {
        (input.time_seconds % duration) / duration * std::f64::consts::TAU
    } else {
        0.0
    };
    let mut rng = Rng(input.seed);
    let colors = ["#4329a8", "#ff6b81", "#ffc48d", "#f8e9ca"].map(|default| default.to_string());
    let colors = std::array::from_fn(|i| {
        let hex = color(p, &format!("c{}", i + 1), &colors[i]);
        std::array::from_fn(|channel| {
            u8::from_str_radix(&hex[1 + channel * 2..3 + channel * 2], 16).unwrap() as f64 / 255.0
        })
    });
    Ok(Frame {
        dimensions: input.dimensions,
        time_seconds: input.time_seconds,
        duration_seconds: duration,
        scene: Scene {
            kind: "liquid-gradients",
            scale: number(p, "scale", 1.2, 0.3, 4.0),
            distortion: number(p, "distortion", 0.85, 0.0, 2.0),
            softness: number(p, "softness", 0.65, 0.1, 1.0),
            grain: number(p, "grain", 2.0, 0.0, 20.0) / 100.0,
            image_mix: number(p, "imageMix", 100.0, 0.0, 100.0) / 100.0,
            image_fit: if text(p, "imageFit", "cover") == "contain" {
                "contain"
            } else {
                "cover"
            },
            offset: [rng.next() * 64.0, rng.next() * 64.0],
            orbit: [phase.cos(), phase.sin()],
            colors,
        },
    })
}

#[cfg(test)]
mod workspace_liquid_gradients {
    use super::*;
    use serde_json::json;

    fn input() -> Input {
        Input {
            dimensions: Dimensions {
                width: 400,
                height: 300,
            },
            seed: 42,
            params: json!({}),
            time_seconds: 0.0,
        }
    }

    #[test]
    fn deterministic_seeded_loop_and_static_time() {
        let first = evaluate(input()).unwrap();
        assert_eq!(first, evaluate(input()).unwrap());
        let mut next = input();
        next.time_seconds = first.duration_seconds;
        assert_eq!(first.scene, evaluate(next.clone()).unwrap().scene);
        next.time_seconds = 3.0;
        assert_ne!(first.scene, evaluate(next.clone()).unwrap().scene);
        next.time_seconds = 0.0;
        next.seed = 99;
        assert_ne!(
            first.scene.offset,
            evaluate(next.clone()).unwrap().scene.offset
        );
        next.params = json!({"motion":"none"});
        let still = evaluate(next.clone()).unwrap();
        next.time_seconds = 99.0;
        assert_eq!(still.duration_seconds, 0.0);
        assert_eq!(still.scene, evaluate(next).unwrap().scene);
    }

    #[test]
    fn bounded_uniforms_palette_and_speed() {
        let mut next = input();
        next.params = json!({"scale":99,"distortion":-1,"grain":100,"softness":0,"speed":2,"c1":"bad","c2":"#00ff80"});
        let frame = evaluate(next).unwrap();
        assert_eq!(frame.duration_seconds, 12.0);
        assert_eq!(frame.scene.scale, 4.0);
        assert_eq!(frame.scene.distortion, 0.0);
        assert_eq!(frame.scene.grain, 0.2);
        assert_eq!(frame.scene.softness, 0.1);
        assert_eq!(
            frame.scene.colors[0],
            evaluate(input()).unwrap().scene.colors[0]
        );
        assert_eq!(frame.scene.colors[1], [0.0, 1.0, 128.0 / 255.0]);
    }

    #[test]
    fn bounded_image_controls() {
        let defaults = evaluate(input()).unwrap().scene;
        assert_eq!(defaults.image_mix, 1.0);
        assert_eq!(defaults.image_fit, "cover");
        for (mix, expected) in [(-10.0, 0.0), (35.0, 0.35), (120.0, 1.0)] {
            let mut next = input();
            next.params = json!({"imageMix":mix,"imageFit":"contain"});
            let scene = evaluate(next).unwrap().scene;
            assert_eq!(scene.image_mix, expected);
            assert_eq!(scene.image_fit, "contain");
        }
        let mut next = input();
        next.params = json!({"imageFit":"unknown"});
        assert_eq!(evaluate(next).unwrap().scene.image_fit, "cover");
    }

    #[test]
    fn invalid_dimensions_and_time() {
        for (width, height, time) in [
            (0, 300, 0.0),
            (4097, 300, 0.0),
            (400, 4097, 0.0),
            (400, 0, 0.0),
            (400, 300, -1.0),
            (400, 300, f64::NAN),
        ] {
            let mut next = input();
            next.dimensions = Dimensions { width, height };
            next.time_seconds = time;
            assert!(evaluate(next).is_err());
        }
        let mut next = input();
        next.dimensions = Dimensions {
            width: 1,
            height: 4096,
        };
        assert!(evaluate(next).is_ok());
    }
}
