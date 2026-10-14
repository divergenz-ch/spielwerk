use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
pub mod tools;

#[wasm_bindgen]
pub fn evaluate_arrow_maze(
    input_json: &str,
    font: &[u8],
    accent: &[u8],
) -> Result<String, JsValue> {
    let input =
        serde_json::from_str(input_json).map_err(|error| JsValue::from_str(&error.to_string()))?;
    let frame = tools::arrow_maze::evaluate(input, font, accent).map_err(JsValue::from_str)?;
    serde_json::to_string(&frame).map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen]
pub fn evaluate_arrow_poster(input_json: &str) -> Result<String, JsValue> {
    let input = serde_json::from_str(input_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let frame = tools::arrow_poster::evaluate(input).map_err(JsValue::from_str)?;
    serde_json::to_string(&frame).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub fn evaluate_arrow_comb(input_json: &str, font: &[u8]) -> Result<String, JsValue> {
    let input = serde_json::from_str(input_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let frame = tools::arrow_comb::evaluate(input, font).map_err(JsValue::from_str)?;
    serde_json::to_string(&frame).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
pub struct Dimensions {
    pub width: u32,
    pub height: u32,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FixtureInput {
    pub dimensions: Dimensions,
    pub seed: u32,
    pub cell_size: u32,
    pub time_seconds: f64,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct Rectangle {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

#[derive(Debug, Serialize, PartialEq)]
pub struct FixtureScene {
    columns: u32,
    rows: u32,
    phase: f64,
    rectangles: Vec<Rectangle>,
}

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Frame {
    dimensions: Dimensions,
    time_seconds: f64,
    duration_seconds: f64,
    scene: FixtureScene,
}

pub fn fixture(input: FixtureInput) -> Result<Frame, &'static str> {
    if !(16..=4096).contains(&input.dimensions.width)
        || !(16..=4096).contains(&input.dimensions.height)
        || !(8..=256).contains(&input.cell_size)
        || !input.time_seconds.is_finite()
        || input.time_seconds < 0.0
    {
        return Err("Invalid fixture dimensions, cell size, or time");
    }
    let columns = input.dimensions.width / input.cell_size;
    let rows = input.dimensions.height / input.cell_size;
    let phase = (input.time_seconds % 2.0) / 2.0;
    let cell = f64::from(input.cell_size);
    let rectangles = (0..rows * columns)
        .map(|index| {
            let jitter = f64::from(
                input
                    .seed
                    .wrapping_add(index)
                    .wrapping_mul(747796405)
                    .rotate_left(13)
                    % 5,
            );
            Rectangle {
                x: f64::from(index % columns) * cell + phase * cell / 4.0,
                y: f64::from(index / columns) * cell + jitter * cell / 20.0,
                width: cell / 2.0,
                height: cell / 2.0,
            }
        })
        .collect();
    Ok(Frame {
        dimensions: input.dimensions,
        time_seconds: input.time_seconds,
        duration_seconds: 2.0,
        scene: FixtureScene {
            columns,
            rows,
            phase,
            rectangles,
        },
    })
}

#[wasm_bindgen]
pub fn evaluate_fixture(input_json: &str) -> Result<String, JsValue> {
    let input =
        serde_json::from_str(input_json).map_err(|error| JsValue::from_str(&error.to_string()))?;
    let frame = fixture(input).map_err(JsValue::from_str)?;
    serde_json::to_string(&frame).map_err(|error| JsValue::from_str(&error.to_string()))
}

#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FontInfo {
    units_per_em: u16,
    glyph_count: u16,
}

pub fn font_info(bytes: &[u8]) -> Result<FontInfo, &'static str> {
    let face = ttf_parser::Face::parse(bytes, 0).map_err(|_| "Invalid OpenType font")?;
    Ok(FontInfo {
        units_per_em: face.units_per_em(),
        glyph_count: face.number_of_glyphs(),
    })
}

#[wasm_bindgen]
pub fn inspect_font(bytes: &[u8]) -> Result<String, JsValue> {
    let info = font_info(bytes).map_err(JsValue::from_str)?;
    serde_json::to_string(&info).map_err(|error| JsValue::from_str(&error.to_string()))
}

#[cfg(test)]
mod workspace {
    use super::*;

    fn input() -> FixtureInput {
        FixtureInput {
            dimensions: Dimensions {
                width: 120,
                height: 80,
            },
            seed: 7,
            cell_size: 40,
            time_seconds: 0.5,
        }
    }

    #[test]
    fn deterministic_geometry_explicit_time_and_responsive_layout() {
        let first = fixture(input()).unwrap();
        assert_eq!(first, fixture(input()).unwrap());
        assert_eq!(first.scene.rectangles.len(), 6);
        assert_eq!(first.scene.rectangles[0].x, 2.5);
        let mut changed = input();
        changed.dimensions.width = 200;
        let resized = fixture(changed).unwrap();
        assert_eq!(resized.scene.rectangles.len(), 10);
        assert_eq!(
            resized.scene.rectangles[0].width,
            first.scene.rectangles[0].width
        );
        let mut changed = input();
        changed.time_seconds = 1.0;
        let later = fixture(changed).unwrap();
        assert_eq!(later.scene.phase, 0.5);
        assert_eq!(later.scene.rectangles[0].x, 5.0);
        let mut changed = input();
        changed.seed = u32::MAX;
        assert_ne!(fixture(changed).unwrap().scene, first.scene);
    }

    #[test]
    fn rejects_invalid_fixture_inputs() {
        for (width, cell, time) in [
            (0, 40, 0.0),
            (4097, 40, 0.0),
            (120, 0, 0.0),
            (120, 257, 0.0),
            (120, 40, -1.0),
            (120, 40, f64::NAN),
        ] {
            let mut value = input();
            value.dimensions.width = width;
            value.cell_size = cell;
            value.time_seconds = time;
            assert!(fixture(value).is_err());
        }
    }

    #[test]
    fn font_input_uses_rust_parser() {
        assert_eq!(
            font_info(include_bytes!("../tests/fixtures/metrics.ttf")).unwrap(),
            FontInfo {
                units_per_em: 1000,
                glyph_count: 1
            }
        );
        assert_eq!(font_info(&[0, 1, 2]), Err("Invalid OpenType font"));
    }
}
