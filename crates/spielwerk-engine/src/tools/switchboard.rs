use super::arrow_maze::Outline;
use super::arrow_path::{color, esc, number, text, validate, Input as Design, Rng};
use crate::Dimensions;
use serde::{Deserialize, Serialize};
use serde_json::Value;

const FAMILIES: [&[&str]; 4] = [
    &[
        "button",
        "toggle",
        "checkbox",
        "radio",
        "segmented",
        "stepper",
    ],
    &["slider", "range", "knob", "gauge"],
    &["led", "meter", "vu", "counter", "progress"],
    &["chip", "badge", "field", "dropdown"],
];
fn binary(kind: &str) -> bool {
    matches!(
        kind,
        "button" | "toggle" | "checkbox" | "led" | "chip" | "field" | "dropdown"
    )
}
#[derive(Clone, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum Action {
    Click { id: usize },
    Swap { id: usize, x: f64, y: f64 },
}
#[derive(Clone, Deserialize)]
pub struct Input {
    #[serde(flatten)]
    pub design: Design,
    pub action: Option<Action>,
}
#[derive(Debug, Serialize, PartialEq)]
pub struct Cell {
    pub id: usize,
    pub kind: String,
    pub x: f64,
    pub y: f64,
    pub state: f64,
    pub influence: f64,
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Scene {
    pub svg: String,
    pub static_svg: String,
    pub motion_svg: String,
    pub cells: Vec<Cell>,
    pub links: Vec<[usize; 2]>,
    pub states: Vec<f64>,
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
fn enabled(p: &Value, key: &str) -> bool {
    p[key].as_bool().unwrap_or(true)
}
fn mix(a: &str, b: &str, t: f64) -> String {
    let mut out = String::from("#");
    for i in [1, 3, 5] {
        let a = u8::from_str_radix(&a[i..i + 2], 16).unwrap() as f64;
        let b = u8::from_str_radix(&b[i..i + 2], 16).unwrap() as f64;
        out.push_str(&format!("{:02x}", (a + (b - a) * t).round() as u8));
    }
    out
}
fn rect(x: f64, y: f64, w: f64, h: f64, fill: &str, radius: f64) -> String {
    format!(
        "<rect x=\"{x}\" y=\"{y}\" width=\"{}\" height=\"{}\" rx=\"{radius}\" fill=\"{fill}\"/>",
        w.max(0.0),
        h.max(0.0)
    )
}
fn circle(x: f64, y: f64, r: f64, fill: &str) -> String {
    format!(
        "<circle cx=\"{x}\" cy=\"{y}\" r=\"{}\" fill=\"{fill}\"/>",
        r.max(0.0)
    )
}
fn line(x: f64, y: f64, xx: f64, yy: f64) -> String {
    format!("<path d=\"M{x} {y}L{xx} {yy}\" fill=\"none\"/>")
}
fn label(
    s: &str,
    x: f64,
    y: f64,
    size: f64,
    max_width: f64,
    face: Option<&ttf_parser::Face>,
) -> String {
    if let Some(face) = face {
        let units = face.units_per_em() as f64;
        let advance: f64 = s
            .chars()
            .filter_map(|c| face.glyph_index(c))
            .map(|g| face.glyph_hor_advance(g).unwrap_or(0) as f64)
            .sum();
        let scale = (size / units).min(max_width / advance.max(1.0));
        let mut outline = Outline {
            d: String::new(),
            x: x - advance * scale / 2.0,
            y: y + (face.ascender() as f64 + face.descender() as f64) * scale / 2.0,
            scale,
        };
        for c in s.chars() {
            if let Some(g) = face.glyph_index(c) {
                face.outline_glyph(g, &mut outline);
                outline.x += face.glyph_hor_advance(g).unwrap_or(0) as f64 * scale;
            }
        }
        format!("<path d=\"{}\" stroke=\"none\"/>", outline.d)
    } else {
        let size = size.min(max_width / (s.chars().count().max(1) as f64 * 0.7));
        format!("<text x=\"{x}\" y=\"{y}\" font-family=\"Arial, sans-serif\" font-weight=\"700\" font-size=\"{size}\" stroke=\"none\" text-anchor=\"middle\" dominant-baseline=\"central\">{}</text>", esc(s))
    }
}
struct Paint<'a> {
    ink: &'a str,
    paper: &'a str,
    on: &'a str,
    radius: f64,
    shadow: f64,
    stroke: f64,
    face: Option<&'a ttf_parser::Face<'a>>,
}
impl Paint<'_> {
    fn box_at(&self, x: f64, y: f64, w: f64, h: f64, fill: &str, radius: f64) -> String {
        rect(x + self.shadow, y + self.shadow, w, h, self.ink, radius)
            + &rect(x, y, w, h, fill, radius)
    }
    fn widget(&self, kind: &str, bw: f64, bh: f64, st: f64, labels: &[&str], fill: &str) -> String {
        let fit = |a: f64| {
            let w = bw.min(bh * a);
            (w, w / a)
        };
        let text = |s: &str, x, y, size, width| {
            format!(
                "<g fill=\"{}\">{}</g>",
                self.ink,
                label(s, x, y, size, width, self.face)
            )
        };
        let box_ =
            |w: f64, h: f64, fill: &str, r: f64| self.box_at(-w / 2.0, -h / 2.0, w, h, fill, r);
        let disc = |r, fill: &str| {
            circle(self.shadow, self.shadow, r, self.ink) + &circle(0.0, 0.0, r, fill)
        };
        let num = format!("{:02}", (st * 99.0).round() as u32);
        match kind {
            "toggle" => {
                let (w, h) = fit(2.0);
                box_(w, h, fill, h / 2.0)
                    + &circle(
                        (if st > 0.5 { 1.0 } else { -1.0 }) * (w - h) / 2.0,
                        0.0,
                        (h / 2.0 - self.stroke).max(h * 0.2),
                        if st > 0.5 { self.ink } else { self.paper },
                    )
            }
            "checkbox" => {
                let (w, h) = fit(1.0);
                box_(w, h, fill, self.radius)
                    + &if st > 0.5 {
                        format!(
                            "<path d=\"M{} 0L{} {}L{} {}\" fill=\"none\"/>",
                            -w * 0.3,
                            -w * 0.08,
                            h * 0.25,
                            w * 0.32,
                            -h * 0.28
                        )
                    } else {
                        String::new()
                    }
            }
            "radio" => {
                let d = bh.min(bw / 3.6);
                (0..3)
                    .map(|j| {
                        let x = (j as f64 - 1.0) * d * 1.2;
                        let selected = j == (st * 3.0).floor().min(2.0) as usize;
                        circle(x, 0.0, d / 2.0, if selected { self.on } else { fill })
                            + &if selected {
                                circle(x, 0.0, d / 5.0, self.ink)
                            } else {
                                String::new()
                            }
                    })
                    .collect()
            }
            "slider" | "range" => {
                let (w, h) = fit(4.0);
                let x =
                    -w / 2.0 + h / 2.0 + st * (w - h) * if kind == "range" { 0.65 } else { 1.0 };
                let mut s = rect(-w / 2.0, -h * 0.18, w, h * 0.36, fill, h * 0.18);
                s += &rect(
                    if kind == "range" { x } else { -w / 2.0 },
                    -h * 0.18,
                    if kind == "range" {
                        (w - h) * 0.35
                    } else {
                        x + w / 2.0
                    },
                    h * 0.36,
                    self.on,
                    h * 0.18,
                );
                s += &self.box_at(x - h * 0.3, -h / 2.0, h * 0.6, h, self.paper, self.radius);
                if kind == "range" {
                    s += &self.box_at(
                        x + (w - h) * 0.35 - h * 0.3,
                        -h / 2.0,
                        h * 0.6,
                        h,
                        self.paper,
                        self.radius,
                    );
                }
                s
            }
            "knob" | "gauge" => {
                let r = bw.min(bh) / 2.0;
                let a = if kind == "knob" {
                    (-225.0 + 270.0 * st).to_radians()
                } else {
                    std::f64::consts::PI * (1.0 + st)
                };
                let base = if kind == "knob" {
                    disc(r, fill)
                } else {
                    format!(
                        "<path d=\"M{} 0A{r} {r} 0 0 1 {r} 0Z\" fill=\"{fill}\"/>",
                        -r
                    )
                };
                base + &line(0.0, 0.0, a.cos() * r * 0.8, a.sin() * r * 0.8)
                    + &circle(0.0, 0.0, r * 0.1, self.on)
            }
            "led" => disc(bw.min(bh) * 0.35, if st > 0.5 { self.on } else { fill }),
            "meter" | "vu" => {
                let (w, h) = fit(1.6);
                let mut s = if kind == "meter" {
                    box_(w, h, fill, self.radius)
                } else {
                    String::new()
                };
                for j in 0..6 {
                    let hh = if kind == "vu" {
                        h * (0.3 + 0.7 * j as f64 / 5.0)
                    } else {
                        h * 0.7
                    };
                    s += &rect(
                        -w / 2.0 + (j as f64 + 0.15) * w / 6.0,
                        h / 2.0 - hh - h * 0.15,
                        w / 6.0 * 0.7,
                        hh,
                        if (j as f64 + 0.5) / 6.0 <= st {
                            self.on
                        } else {
                            self.paper
                        },
                        0.0,
                    );
                }
                s
            }
            "segmented" => {
                let (w, h) = fit(3.0);
                let mut s = box_(w, h, fill, self.radius);
                for j in 0..3 {
                    let x = -w / 2.0 + j as f64 * w / 3.0;
                    if j == (st * 3.0).floor().min(2.0) as usize {
                        s += &rect(x, -h / 2.0, w / 3.0, h, self.on, self.radius);
                    }
                    if j > 0 {
                        s += &line(x, -h / 2.0, x, h / 2.0);
                    }
                    s += &text(labels[j], x + w / 6.0, 0.0, h * 0.35, w / 3.5);
                }
                s
            }
            "stepper" => {
                let (w, h) = fit(3.4);
                box_(w, h, fill, self.radius)
                    + &line(-w / 6.0, -h / 2.0, -w / 6.0, h / 2.0)
                    + &line(w / 6.0, -h / 2.0, w / 6.0, h / 2.0)
                    + &text("−", -w / 3.0, 0.0, h * 0.4, w / 4.0)
                    + &text(&num, 0.0, 0.0, h * 0.4, w / 4.0)
                    + &text("+", w / 3.0, 0.0, h * 0.4, w / 4.0)
            }
            _ => {
                let (w, h) = fit(if kind == "progress" { 3.5 } else { 2.4 });
                let radius = if matches!(kind, "chip" | "badge") {
                    h / 2.0
                } else {
                    self.radius
                };
                let mut s = if kind == "button" && st > 0.5 {
                    rect(
                        -w / 2.0 + self.shadow,
                        -h / 2.0 + self.shadow,
                        w,
                        h,
                        fill,
                        radius,
                    )
                } else {
                    box_(w, h, fill, radius)
                };
                if kind == "progress" {
                    s += &rect(-w / 2.0, -h / 2.0, w * st, h, self.on, radius);
                }
                let content = match kind {
                    "counter" => num.clone(),
                    "progress" => format!("{num}%"),
                    _ => labels[0].to_string(),
                };
                let offset = if kind == "button" && st > 0.5 {
                    self.shadow
                } else {
                    0.0
                };
                s += &text(
                    &content,
                    offset,
                    offset,
                    h * 0.4,
                    if matches!(kind, "badge" | "dropdown" | "field") {
                        w * 0.6
                    } else {
                        w * 0.85
                    },
                );
                if kind == "badge" {
                    s += &circle(w * 0.35, 0.0, h * 0.27, self.on);
                    s += &text(
                        &format!("{}", (st * 9.0).round()),
                        w * 0.35,
                        0.0,
                        h * 0.28,
                        h * 0.4,
                    );
                }
                if kind == "field" && st > 0.5 {
                    s += &rect(w * 0.38, -h * 0.25, self.stroke, h * 0.5, self.on, 0.0);
                }
                if kind == "dropdown" {
                    let x = w * 0.38;
                    let y = if st > 0.5 { -h * 0.1 } else { h * 0.1 };
                    s += &line(x - h * 0.1, -y, x, y);
                    s += &line(x, y, x + h * 0.1, -y);
                }
                s
            }
        }
    }
}

// A depth-first traversal with a visited set gives deterministic cycle/branch ownership.
fn propagate(
    states: &mut [f64],
    links: &[[usize; 2]],
    source: usize,
    invert: bool,
    seen: &mut [bool],
) {
    seen[source] = true;
    for &[a, b] in links {
        if a == source && !seen[b] {
            states[b] = if invert { 1.0 - states[a] } else { states[a] };
            propagate(states, links, b, invert, seen);
        }
    }
}
pub fn evaluate(input: Input, font: &[u8]) -> Result<Frame, &'static str> {
    validate(&input.design)?;
    let face = if font.is_empty() {
        None
    } else {
        Some(ttf_parser::Face::parse(font, 0).map_err(|_| "Invalid OpenType font")?)
    };
    let d = input.design;
    let p = &d.params;
    let w = d.dimensions.width as f64;
    let h = d.dimensions.height as f64;
    let cols = number(p, "cols", 5.0, 2.0, 12.0) as usize;
    let rows = number(p, "rows", 7.0, 2.0, 16.0) as usize;
    let n = cols * rows;
    let cw = w / cols as f64;
    let ch = h / rows as f64;
    let mut kinds: Vec<_> = ["buttons", "dials", "lights", "form"]
        .iter()
        .zip(FAMILIES)
        .filter(|(key, _)| enabled(p, key))
        .flat_map(|(_, family)| family.iter().copied())
        .collect();
    if kinds.is_empty() {
        kinds = FAMILIES.into_iter().flatten().copied().collect();
    }
    let mut labels: Vec<_> = text(p, "labels", "ON,OFF,SEND,OK,RUN,A,B,MUTE,ARM,SYNC")
        .split(',')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .collect();
    if labels.is_empty() {
        labels.push("ON");
    }
    let mut rng = Rng(d.seed);
    let mut cells = Vec::new();
    let mut decoration = Vec::new();
    let mut states: Vec<f64> = (0..n)
        .map(|i| {
            p["st"][i]
                .as_f64()
                .filter(|s| s.is_finite())
                .unwrap_or(0.0)
                .clamp(0.0, 1.0)
        })
        .collect();
    let mut order = Vec::new();
    if let Some(saved) = p["order"].as_array() {
        for v in saved {
            if let Some(i) = v.as_u64().filter(|i| *i < n as u64) {
                if !order.contains(&(i as usize)) {
                    order.push(i as usize);
                }
            }
        }
    }
    for i in 0..n {
        if !order.contains(&i) {
            order.push(i);
        }
    }
    for id in 0..n {
        let kind = kinds[(rng.next() * kinds.len() as f64) as usize];
        let l1 = (rng.next() * labels.len() as f64) as usize;
        let size = 1.0 - rng.next() * number(p, "jitter", 0.0, 0.0, 100.0) / 100.0 * 0.6;
        let l2 = (rng.next() * labels.len() as f64) as usize;
        let l3 = (rng.next() * labels.len() as f64) as usize;
        cells.push(Cell {
            id,
            kind: kind.into(),
            x: 0.0,
            y: 0.0,
            state: states[id],
            influence: 0.0,
        });
        decoration.push((size, [labels[l1], labels[l2], labels[l3]]));
    }
    let mut rng = Rng(d.seed ^ 0x9e37);
    let mut links = Vec::new();
    for _ in 0..number(p, "links", 12.0, 0.0, 60.0) as usize {
        let a = (rng.next() * n as f64) as usize;
        let b = (rng.next() * n as f64) as usize;
        if a != b && !links.contains(&[a, b]) {
            links.push([a, b]);
        }
    }
    match input.action {
        Some(Action::Click { id }) if id < n => {
            states[id] = if binary(&cells[id].kind) {
                if states[id] > 0.5 {
                    0.0
                } else {
                    1.0
                }
            } else {
                (states[id] + 0.25) % 1.25
            };
            let mode = text(p, "propagate", "copy");
            if mode != "none" {
                propagate(
                    &mut states,
                    &links,
                    id,
                    mode == "invert",
                    &mut vec![false; n],
                );
            }
        }
        Some(Action::Swap { id, x, y })
            if id < n
                && x.is_finite()
                && y.is_finite()
                && x >= 0.0
                && y >= 0.0
                && x < w
                && y < h =>
        {
            let to = (y / ch).floor() as usize * cols + (x / cw).floor() as usize;
            let from = order.iter().position(|i| *i == id).unwrap();
            order.swap(from, to);
        }
        _ => {}
    }
    for (slot, &id) in order.iter().enumerate() {
        cells[id].x = (slot % cols) as f64 * cw + cw / 2.0;
        cells[id].y = (slot / cols) as f64 * ch + ch / 2.0;
        cells[id].state = states[id];
    }
    let strength = number(p, "strength", 70.0, 0.0, 100.0) / 100.0;
    for b in 0..n {
        let sources: Vec<_> = links
            .iter()
            .filter(|l| l[1] == b)
            .map(|l| states[l[0]])
            .collect();
        if !sources.is_empty() {
            cells[b].influence = sources.iter().sum::<f64>() / sources.len() as f64 * strength;
        }
    }
    let ink = color(p, "ink", "#111111");
    let paper = color(p, "paper", "#f4f1ea");
    let on = color(p, "on", "#ffd400");
    let accent = color(p, "accent", "#ff4d2e");
    // Cap absolute decoration at the current cell size so extreme responsive boards stay valid.
    let unit = cw.min(ch);
    let stroke = (w * number(p, "stroke", 0.4, 0.01, 1.6) / 100.0).min(unit * 0.08);
    let paint = Paint {
        ink: &ink,
        paper: &paper,
        on: &on,
        radius: (w * number(p, "radius", 0.53, 0.0, 4.0) / 100.0).min(unit * 0.2),
        shadow: (w * number(p, "shadow", 0.67, 0.0, 2.67) / 100.0).min(unit * 0.1),
        stroke,
        face: face.as_ref(),
    };
    let secs = number(p, "secs", 4.0, 1.0, 20.0);
    let moving = text(p, "motion", "flow") == "flow";
    let wirepx = (w * number(p, "wirepx", 0.27, 0.01, 1.33) / 100.0).min(unit * 0.1);
    let period = wirepx * 6.0;
    let wires = |animated: bool| {
        let mut s = String::new();
        if enabled(p, "wires") {
            for &[a, b] in &links {
                let a = &cells[a];
                let b = &cells[b];
                let path = match text(p, "wire", "curve") {
                    "straight" => format!("M{} {}L{} {}", a.x, a.y, b.x, b.y),
                    "elbow" => format!("M{} {}H{}V{}", a.x, a.y, b.x, b.y),
                    _ => format!(
                        "M{} {}Q{} {} {} {}",
                        a.x,
                        a.y,
                        (a.x + b.x) / 2.0 - (b.y - a.y) * 0.3,
                        (a.y + b.y) / 2.0 + (b.x - a.x) * 0.3,
                        b.x,
                        b.y
                    ),
                };
                let active = a.state > 0.5;
                let offset = if moving && !animated {
                    -(d.time_seconds % secs) / secs * period * 4.0
                } else {
                    0.0
                };
                s += &format!(
                    "<path d=\"{path}\" fill=\"none\" stroke=\"{}\" stroke-width=\"{wirepx}\"",
                    if active { &on } else { &ink }
                );
                if active {
                    s += &format!(
                        " stroke-dasharray=\"{} {}\" stroke-dashoffset=\"{offset}\"",
                        period / 2.0,
                        period / 2.0
                    );
                }
                s += ">";
                if active && moving && animated {
                    s += &format!("<animate attributeName=\"stroke-dashoffset\" from=\"0\" to=\"{}\" dur=\"{secs}s\" repeatCount=\"indefinite\"/>",-period*4.0);
                }
                s += "</path>";
            }
        }
        s
    };
    let mut widgets = String::new();
    let gap = number(p, "gap", 24.0, 0.0, 60.0) / 100.0;
    for c in &cells {
        let (size, labels) = decoration[c.id];
        let base = if binary(&c.kind) && c.state > 0.5 {
            &on
        } else {
            &paper
        };
        let effect = text(p, "effect", "colour + size");
        let fill = if effect != "size" {
            mix(base, &accent, c.influence)
        } else {
            base.clone()
        };
        let scale = if effect != "colour" {
            1.0 + 0.4 * c.influence
        } else {
            1.0
        };
        widgets += &format!(
            "<g data-widget=\"{}\" transform=\"translate({} {}) scale({scale})\">{}</g>",
            c.id,
            c.x,
            c.y,
            paint.widget(
                &c.kind,
                cw * (1.0 - gap) * size * 0.85,
                ch * (1.0 - gap) * size * 0.85,
                c.state,
                &labels,
                &fill
            )
        );
    }
    let wrap = |wire: String, editing: bool| {
        let body=format!("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{w}\" height=\"{h}\" viewBox=\"0 0 {w} {h}\"><rect width=\"{w}\" height=\"{h}\" fill=\"{paper}\"/>{wire}<g stroke=\"{ink}\" fill=\"{ink}\" stroke-width=\"{stroke}\" stroke-linecap=\"round\" stroke-linejoin=\"round\">{widgets}</g></svg>");
        if editing {
            body
        } else {
            let mut body = body;
            for id in 0..n {
                body = body.replace(&format!(" data-widget=\"{id}\""), "");
            }
            body
        }
    };
    let svg = wrap(wires(false), true);
    Ok(Frame {
        dimensions: d.dimensions,
        time_seconds: d.time_seconds,
        duration_seconds: if moving { secs } else { 0.0 },
        scene: Scene {
            static_svg: wrap(wires(false), false),
            motion_svg: wrap(wires(true), false),
            svg,
            cells,
            links,
            states,
            order,
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
                    width: 600,
                    height: 800,
                },
                seed: 42,
                params: serde_json::json!({"cols":12,"rows":16,"links":60}),
                time_seconds: 0.0,
            },
            action: None,
        }
    }
    #[test]
    fn all_widgets_transition_and_links_propagate() {
        let first = evaluate(input(), &[]).unwrap();
        assert_eq!(first, evaluate(input(), &[]).unwrap());
        let mut kinds = std::collections::HashSet::new();
        for c in &first.scene.cells {
            kinds.insert(&c.kind);
            let mut value = input();
            value.action = Some(Action::Click { id: c.id });
            let frame = evaluate(value, &[]).unwrap();
            let state = if binary(&c.kind) { 1.0 } else { 0.25 };
            assert_eq!(frame.scene.states[c.id], state);
            let mut value = input();
            let mut states = vec![0.0; first.scene.cells.len()];
            states[c.id] = 0.75;
            value.design.params["st"] = states.into();
            value.action = Some(Action::Click { id: c.id });
            let full = evaluate(value, &[]).unwrap();
            assert_eq!(
                full.scene.states[c.id],
                if binary(&c.kind) { 0.0 } else { 1.0 }
            );
            assert_ne!(
                first.scene.svg,
                if binary(&c.kind) {
                    &frame.scene.svg
                } else {
                    &full.scene.svg
                }
                .clone()
            );
            for &[a, b] in &frame.scene.links {
                if a == c.id {
                    assert_eq!(frame.scene.states[b], state);
                }
            }
        }
        assert_eq!(kinds.len(), 19);
        let mut states = vec![0.0; 4];
        states[0] = 1.0;
        propagate(
            &mut states,
            &[[0, 1], [1, 2], [2, 0], [0, 3]],
            0,
            true,
            &mut [false; 4],
        );
        assert_eq!(states, vec![1.0, 0.0, 1.0, 0.0]);
    }
    #[test]
    fn state_cycles_modes_and_wire_styles() {
        let first = evaluate(input(), &[]).unwrap();
        for kind in FAMILIES.into_iter().flatten() {
            let id = first
                .scene
                .cells
                .iter()
                .find(|c| c.kind == *kind)
                .unwrap()
                .id;
            let mut value = input();
            value.design.params["propagate"] = "none".into();
            for step in 1..=5 {
                value.action = Some(Action::Click { id });
                let frame = evaluate(value.clone(), &[]).unwrap();
                let expected = if binary(kind) {
                    (step % 2) as f64
                } else {
                    (step % 5) as f64 / 4.0
                };
                assert_eq!(frame.scene.states[id], expected, "{kind} step {step}");
                assert!(frame
                    .scene
                    .states
                    .iter()
                    .enumerate()
                    .all(|(i, s)| i == id || *s == 0.0));
                value.design.params["st"] = frame.scene.states.into();
            }
        }
        let [a, b] = first.scene.links[0];
        for mode in ["copy", "invert", "none"] {
            let mut value = input();
            value.design.params["propagate"] = mode.into();
            value.action = Some(Action::Click { id: a });
            let f = evaluate(value, &[]).unwrap();
            assert_eq!(
                f.scene.states[b],
                match mode {
                    "copy" => f.scene.states[a],
                    "invert" => 1.0 - f.scene.states[a],
                    _ => 0.0,
                }
            );
        }
        let mut paths = Vec::new();
        for wire in ["straight", "elbow", "curve"] {
            let mut value = input();
            value.design.params["wire"] = wire.into();
            value.design.params["motion"] = "none".into();
            value.design.params["st"] = vec![1.0; 192].into();
            let f = evaluate(value.clone(), &[]).unwrap();
            value.design.time_seconds = 0.5;
            assert_eq!(f.scene.svg, evaluate(value, &[]).unwrap().scene.svg);
            assert_eq!(f.duration_seconds, 0.0);
            assert!(!f.scene.motion_svg.contains("<animate"));
            paths.push(f.scene.svg);
        }
        assert!(paths[0] != paths[1] && paths[1] != paths[2] && paths[0] != paths[2]);
        let mut value = input();
        value.design.seed = 99;
        assert_ne!(first.scene.links, evaluate(value, &[]).unwrap().scene.links);
    }
    #[test]
    fn swap_normalization_motion_and_boundaries() {
        let first = evaluate(input(), &[]).unwrap();
        let mut value = input();
        value.action = Some(Action::Swap {
            id: 0,
            x: 75.0,
            y: 25.0,
        });
        let swap = evaluate(value, &[]).unwrap();
        assert_eq!(&swap.scene.order[..2], &[1, 0]);
        assert_eq!(swap.scene.cells[0].x, first.scene.cells[1].x);
        for x in [-1.0, 600.0, f64::NAN] {
            let mut value = input();
            value.action = Some(Action::Swap { id: 0, x, y: 25.0 });
            assert_eq!(evaluate(value, &[]).unwrap(), first);
        }
        let mut value = input();
        value.design.params["order"] = serde_json::json!([0, 0, 999, -1, 2]);
        let f = evaluate(value, &[]).unwrap();
        assert_eq!(f.scene.order.len(), 192);
        assert_eq!(
            f.scene
                .order
                .iter()
                .collect::<std::collections::HashSet<_>>()
                .len(),
            192
        );
        let mut value = input();
        value.design.params["st"] = vec![1.0; 192].into();
        let f = evaluate(value.clone(), &[]).unwrap();
        value.design.time_seconds = 0.3;
        let later = evaluate(value.clone(), &[]).unwrap();
        assert_ne!(f.scene.svg, later.scene.svg);
        assert_eq!(f.scene.motion_svg, later.scene.motion_svg);
        assert!(f.scene.motion_svg.contains("<animate"));
        assert!(!f.scene.motion_svg.contains("data-widget"));
        value.design.time_seconds = 4.0;
        assert_eq!(f.scene.svg, evaluate(value, &[]).unwrap().scene.svg);
        for (w, h) in [(100, 8000), (8000, 100)] {
            let mut value = input();
            value.design.dimensions = Dimensions {
                width: w,
                height: h,
            };
            let f = evaluate(value, &[]).unwrap();
            assert_eq!(f.scene.cells.len(), 192);
            assert!(!f.scene.svg.contains("NaN"));
        }
        for w in [99, 8001] {
            let mut value = input();
            value.design.dimensions.width = w;
            assert!(evaluate(value, &[]).is_err());
        }
        let mut value = input();
        value.design.time_seconds = -1.0;
        assert!(evaluate(value, &[]).is_err());
        assert!(evaluate(input(), &[0, 1, 2]).is_err());
    }
    #[test]
    fn font_labels_are_baked_and_family_filters_work() {
        let font = include_bytes!("../../../../tests/generators/fixtures/outline.ttf");
        let mut value = input();
        value.design.params = serde_json::json!({"buttons":false,"dials":false,"lights":false,"form":true,"labels":"A"});
        let f = evaluate(value, font).unwrap();
        assert!(f
            .scene
            .cells
            .iter()
            .all(|c| FAMILIES[3].contains(&c.kind.as_str())));
        assert!(!f.scene.svg.contains("<text"));
        assert!(f.scene.svg.contains("<path d=\"M"));
    }
}
