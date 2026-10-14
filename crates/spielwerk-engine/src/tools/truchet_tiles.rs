use super::arrow_path::{color, number, text, validate, Input, Rng};
use crate::Dimensions;
use serde::Serialize;

#[derive(Debug, Serialize, PartialEq)]
pub struct Tile {
    pub style: String,
    pub turn: u32,
    pub ink: String,
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Scene {
    pub svg: String,
    pub static_svg: String,
    pub tiles: Vec<Tile>,
    pub columns: usize,
    pub rows: usize,
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Frame {
    pub dimensions: Dimensions,
    pub time_seconds: f64,
    pub duration_seconds: f64,
    pub scene: Scene,
}
pub fn evaluate(input: Input) -> Result<Frame, &'static str> {
    validate(&input)?;
    let p = &input.params;
    let w = input.dimensions.width as f64;
    let h = input.dimensions.height as f64;
    let cols = number(p, "cols", 8.0, 2.0, 40.0) as usize;
    let side = w / cols as f64;
    let rows = (h / side).round().max(1.0) as usize;
    let lines = number(p, "lines", 1.0, 1.0, 5.0) as usize;
    let stroke = side / (lines + 1) as f64 * number(p, "stroke", 40.0, 5.0, 95.0) / 100.0;
    let mut arcs = String::new();
    for i in 1..=lines {
        let r = side * i as f64 / (lines + 1) as f64;
        arcs.push_str(&format!("M{r:.2} 0 A{r:.2} {r:.2} 0 0 1 0 {r:.2} M{:.2} {side:.2} A{r:.2} {r:.2} 0 0 1 {side:.2} {:.2}", side-r, side-r));
    }
    let tri = format!("M0 0 L{side:.2} 0 L0 {side:.2} Z");
    let diag = format!("M0 0 L{side:.2} {side:.2}");
    let mut rng = Rng(input.seed);
    let mut tiles = Vec::new();
    let mut body = String::new();
    for row in 0..rows {
        for col in 0..cols {
            let rs = rng.next();
            let rt = rng.next();
            let rt2 = rng.next();
            let rd = rng.next();
            let selected = text(p, "style", "arcs");
            let style = if selected == "mix" {
                ["arcs", "triangles", "10 PRINT"][(rs * 3.0) as usize]
            } else {
                selected
            };
            let turn = u32::from(rt >= number(p, "bias", 50.0, 0.0, 100.0) / 100.0)
                + if style == "triangles" && rt2 < 0.5 {
                    2
                } else {
                    0
                };
            let ink = if rd < number(p, "duo", 0.0, 0.0, 100.0) / 100.0 {
                color(p, "ink2", "#e84f5e")
            } else {
                color(p, "ink", "#1c1c1c")
            };
            let path = match style {
                "triangles" => &tri,
                "10 PRINT" => &diag,
                _ => &arcs,
            };
            let paint = if style == "triangles" {
                format!("fill=\"{ink}\"")
            } else {
                format!("fill=\"none\" stroke=\"{ink}\" stroke-width=\"{stroke:.2}\"")
            };
            body.push_str(&format!("<path transform=\"translate({:.2} {:.2}) rotate({} {:.2} {:.2})\" d=\"{path}\" {paint}/>", col as f64*side, row as f64*side, turn*90, side/2.0, side/2.0));
            tiles.push(Tile {
                style: style.into(),
                turn,
                ink,
            });
        }
    }
    let paper = color(p, "paper", "#f4f1ea");
    let svg = format!("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{w}\" height=\"{h}\" viewBox=\"0 0 {w} {h}\"><rect width=\"{w}\" height=\"{h}\" fill=\"{paper}\"/>{body}</svg>");
    Ok(Frame {
        dimensions: input.dimensions,
        time_seconds: input.time_seconds,
        duration_seconds: 0.0,
        scene: Scene {
            static_svg: svg.clone(),
            svg,
            tiles,
            columns: cols,
            rows,
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    #[test]
    fn styles_strands_inks_seed_and_relayout() {
        let mut input = Input {
            dimensions: Dimensions {
                width: 600,
                height: 800,
            },
            seed: 42,
            params: json!({"lines": 3, "duo": 50}),
            time_seconds: 0.0,
        };
        let base = evaluate(input.clone()).unwrap();
        assert_eq!(base, evaluate(input.clone()).unwrap());
        assert_eq!(
            base.scene.svg.matches(" A").count(),
            base.scene.tiles.len() * 6
        );
        assert!(base.scene.tiles.iter().any(|t| t.ink == "#e84f5e"));
        assert!(base.scene.tiles.iter().any(|t| t.ink == "#1c1c1c"));
        for style in ["arcs", "triangles", "10 PRINT", "mix"] {
            input.params["style"] = json!(style);
            let f = evaluate(input.clone()).unwrap();
            if style == "mix" {
                for s in ["arcs", "triangles", "10 PRINT"] {
                    assert!(f.scene.tiles.iter().any(|t| t.style == s));
                }
            } else {
                assert!(f.scene.tiles.iter().all(|t| t.style == style));
            }
        }
        input.dimensions = Dimensions {
            width: 800,
            height: 600,
        };
        assert_ne!(base.scene.rows, evaluate(input.clone()).unwrap().scene.rows);
        input.dimensions.width = 99;
        assert!(evaluate(input.clone()).is_err());
        input.dimensions.width = 8001;
        assert!(evaluate(input.clone()).is_err());
        input.dimensions.width = 600;
        input.time_seconds = -1.0;
        assert!(evaluate(input).is_err());
    }
}
