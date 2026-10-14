use crate::Dimensions;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Input {
    pub dimensions: Dimensions,
    pub seed: u32,
    pub params: Value,
    pub time_seconds: f64,
    #[serde(default)]
    pub metrics: BTreeMap<String, [f64; 4]>,
}
#[derive(Debug, Serialize, PartialEq)]
pub struct Panel {
    pub bounds: [f64; 4],
    pub inverted: bool,
}
#[derive(Debug, Serialize, PartialEq)]
pub struct Arrow {
    pub cells: Vec<usize>,
    pub parent: Option<usize>,
    pub points: Vec<[f64; 2]>,
    pub progress: f64,
    pub panel: usize,
}
#[derive(Debug, Serialize, PartialEq)]
pub struct Word {
    pub text: String,
    pub bounds: [f64; 4],
    pub center: [f64; 2],
    pub size: f64,
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Scene {
    pub svg: String,
    pub static_svg: String,
    pub columns: usize,
    pub rows: usize,
    pub cell: f64,
    pub clearance: f64,
    pub panels: Vec<Panel>,
    pub arrows: Vec<Arrow>,
    pub words: Vec<Word>,
    pub unplaced: Vec<String>,
}
#[derive(Debug, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Frame {
    pub dimensions: Dimensions,
    pub time_seconds: f64,
    pub duration_seconds: f64,
    pub scene: Scene,
}
fn number(p: &Value, key: &str, default: f64, min: f64, max: f64) -> f64 {
    p[key]
        .as_f64()
        .filter(|n| n.is_finite())
        .unwrap_or(default)
        .clamp(min, max)
}
fn text<'a>(p: &'a Value, key: &str, default: &'a str) -> &'a str {
    p[key].as_str().unwrap_or(default)
}
fn color(p: &Value, key: &str, default: &str) -> String {
    let c = text(p, key, default);
    if c.len() == 7 && c.starts_with('#') && c[1..].bytes().all(|b| b.is_ascii_hexdigit()) {
        c.to_string()
    } else {
        default.to_string()
    }
}
fn esc(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}
struct Rng(u32);
impl Rng {
    fn next(&mut self, n: usize) -> usize {
        self.0 = self.0.wrapping_add(0x6d2b79f5);
        let mut t = (self.0 ^ (self.0 >> 15)).wrapping_mul(self.0 | 1);
        t ^= t.wrapping_add((t ^ (t >> 7)).wrapping_mul(t | 61));
        ((t ^ (t >> 14)) as usize) % n
    }
}
fn overlaps(a: [f64; 4], b: [f64; 4]) -> bool {
    a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1]
}
struct Outline {
    d: String,
    x: f64,
    y: f64,
    scale: f64,
}
impl ttf_parser::OutlineBuilder for Outline {
    fn move_to(&mut self, x: f32, y: f32) {
        self.d += &format!(
            "M{} {}",
            self.x + x as f64 * self.scale,
            self.y - y as f64 * self.scale
        );
    }
    fn line_to(&mut self, x: f32, y: f32) {
        self.d += &format!(
            "L{} {}",
            self.x + x as f64 * self.scale,
            self.y - y as f64 * self.scale
        );
    }
    fn quad_to(&mut self, x1: f32, y1: f32, x: f32, y: f32) {
        self.d += &format!(
            "Q{} {} {} {}",
            self.x + x1 as f64 * self.scale,
            self.y - y1 as f64 * self.scale,
            self.x + x as f64 * self.scale,
            self.y - y as f64 * self.scale
        );
    }
    fn curve_to(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x: f32, y: f32) {
        self.d += &format!(
            "C{} {} {} {} {} {}",
            self.x + x1 as f64 * self.scale,
            self.y - y1 as f64 * self.scale,
            self.x + x2 as f64 * self.scale,
            self.y - y2 as f64 * self.scale,
            self.x + x as f64 * self.scale,
            self.y - y as f64 * self.scale
        );
    }
    fn close(&mut self) {
        self.d.push('Z');
    }
}
fn measure(
    s: &str,
    face: Option<&ttf_parser::Face>,
    metrics: &BTreeMap<String, [f64; 4]>,
) -> [f64; 4] {
    if let Some(f) = face {
        let scale = 100.0 / f.units_per_em() as f64;
        let mut advance = 0.0;
        let mut left = f64::INFINITY;
        let mut right: f64 = 0.0;
        let mut top: f64 = 0.0;
        let mut bottom: f64 = 0.0;
        for c in s.chars() {
            if let Some(g) = f.glyph_index(c) {
                if let Some(b) = f.glyph_bounding_box(g) {
                    left = left.min(advance + b.x_min as f64 * scale);
                    right = right.max(advance + b.x_max as f64 * scale);
                    top = top.max(b.y_max as f64 * scale);
                    bottom = bottom.max(-b.y_min as f64 * scale);
                }
                advance += f.glyph_hor_advance(g).unwrap_or(0) as f64 * scale;
            }
        }
        let inset = if left.is_finite() {
            -left.min(0.0)
        } else {
            0.0
        };
        return [advance.max(right) + inset, top, bottom, inset];
    }
    metrics
        .get(s)
        .copied()
        .unwrap_or([s.chars().count() as f64 * 60.0, 80.0, 20.0, 0.0])
}
fn points(cells: &[usize], cols: usize, cell: f64, ox: f64, oy: f64, arc: bool) -> Vec<[f64; 2]> {
    let raw: Vec<_> = cells
        .iter()
        .map(|k| {
            [
                ox + (*k % cols) as f64 * cell + cell / 2.0,
                oy + (*k / cols) as f64 * cell + cell / 2.0,
            ]
        })
        .collect();
    if !arc {
        return raw;
    }
    let mut out = vec![raw[0]];
    for i in 1..raw.len() - 1 {
        let a = raw[i - 1];
        let b = raw[i];
        let c = raw[i + 1];
        let u = [(b[0] - a[0]) / cell, (b[1] - a[1]) / cell];
        let v = [(c[0] - b[0]) / cell, (c[1] - b[1]) / cell];
        if u == v {
            out.push(b);
            continue;
        }
        let r = cell * 0.25;
        let start = [b[0] - u[0] * r, b[1] - u[1] * r];
        let center = [start[0] + v[0] * r, start[1] + v[1] * r];
        let angle = (start[1] - center[1]).atan2(start[0] - center[0]);
        let sign = u[0] * v[1] - u[1] * v[0];
        for j in 0..=8 {
            let t = angle + sign * std::f64::consts::FRAC_PI_2 * j as f64 / 8.0;
            out.push([center[0] + r * t.cos(), center[1] + r * t.sin()]);
        }
    }
    out.push(*raw.last().unwrap());
    out
}
fn cut(points: &[[f64; 2]], progress: f64) -> Vec<[f64; 2]> {
    let distance = |a: [f64; 2], b: [f64; 2]| (a[0] - b[0]).hypot(a[1] - b[1]);
    let length: f64 = points.windows(2).map(|p| distance(p[0], p[1])).sum();
    let mut left = length * progress;
    let mut out = vec![points[0]];
    for p in points.windows(2) {
        let len = distance(p[0], p[1]);
        if left >= len {
            out.push(p[1]);
            left -= len;
        } else {
            let t = left / len;
            out.push([
                p[0][0] + (p[1][0] - p[0][0]) * t,
                p[0][1] + (p[1][1] - p[0][1]) * t,
            ]);
            break;
        }
    }
    out
}
pub fn evaluate(input: Input, font: &[u8], accent: &[u8]) -> Result<Frame, &'static str> {
    let w = input.dimensions.width as f64;
    let h = input.dimensions.height as f64;
    if !(100..=8000).contains(&input.dimensions.width)
        || !(100..=8000).contains(&input.dimensions.height)
        || !input.time_seconds.is_finite()
        || input.time_seconds < 0.0
    {
        return Err("Invalid Arrow Maze dimensions or time");
    }
    let face = if font.is_empty() {
        None
    } else {
        Some(ttf_parser::Face::parse(font, 0).map_err(|_| "Invalid OpenType font")?)
    };
    let accent_face = if accent.is_empty() {
        None
    } else {
        Some(ttf_parser::Face::parse(accent, 0).map_err(|_| "Invalid OpenType font")?)
    };
    let p = &input.params;
    let density = number(p, "cols", 14.0, 2.0, 60.0);
    let margin = number(p, "margin", 2.0, 0.0, 40.0) * (w * h).sqrt() / 100.0;
    let margin = margin.min((w.min(h) - 50.0) / 2.0);
    let gw = w - 2.0 * margin;
    let gh = h - 2.0 * margin;
    let cols = (density * (gw / gh).sqrt()).round().max(2.0) as usize;
    let rows = (density * (gh / gw).sqrt()).round().max(2.0) as usize;
    let cell = (gw / cols as f64).min(gh / rows as f64);
    let ox = (w - cols as f64 * cell) / 2.0;
    let oy = (h - rows as f64 * cell) / 2.0;
    let shaft = number(p, "shaft", 40.0, 10.0, 60.0) / 100.0 * cell;
    let clearance = (cell - shaft.max(cell * 0.7)) / 2.0;
    let mut rng = Rng(input.seed);
    let mut boxes = vec![[0usize, 0usize, cols, rows]];
    for _ in 1..number(p, "panels", 4.0, 1.0, 32.0) as usize {
        let Some((i, b)) = boxes
            .iter()
            .enumerate()
            .filter(|(_, b)| b[2] > 1 || b[3] > 1)
            .max_by_key(|(_, b)| b[2] * b[3])
            .map(|(i, b)| (i, *b))
        else {
            break;
        };
        let vertical = b[2] > b[3] || b[3] == 1;
        let span = if vertical { b[2] } else { b[3] };
        let n = 1 + rng.next(span - 1);
        let mut other = b;
        if vertical {
            boxes[i][2] = n;
            other[0] += n;
            other[2] -= n;
        } else {
            boxes[i][3] = n;
            other[1] += n;
            other[3] -= n;
        }
        boxes.push(other);
    }
    let panels: Vec<_> = boxes
        .iter()
        .map(|b| Panel {
            bounds: [
                ox + b[0] as f64 * cell,
                oy + b[1] as f64 * cell,
                b[2] as f64 * cell,
                b[3] as f64 * cell,
            ],
            inverted: rng.next(100) < number(p, "invert", 40.0, 0.0, 100.0) as usize,
        })
        .collect();
    let mut pid = vec![0; cols * rows];
    for (i, b) in boxes.iter().enumerate() {
        for y in b[1]..b[1] + b[3] {
            for x in b[0]..b[0] + b[2] {
                pid[y * cols + x] = i;
            }
        }
    }
    let mut occupied = vec![false; cols * rows];
    let mut words = Vec::new();
    let mut unplaced = Vec::new();
    let mut word_shapes = Vec::new();
    let blocking = p["tblock"].as_bool().unwrap_or(true);
    // Manual placement is reconciled first on every evaluation; no renderer-only design state.
    let entries: Vec<_> = text(p, "words", "")
        .split('|')
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .collect();
    let place_words = |manual_only: bool,
                       occupied: &mut Vec<bool>,
                       words: &mut Vec<Word>,
                       unplaced: &mut Vec<String>,
                       word_shapes: &mut Vec<String>| {
        for &entry in &entries {
            if p["nodes"][entry]["x"]
                .as_f64()
                .zip(p["nodes"][entry]["y"].as_f64())
                .is_some()
                != manual_only
            {
                continue;
            }
            let node = &p["nodes"][entry];
            let f = if node["acc"].as_bool().unwrap_or(false) {
                accent_face.as_ref().or(face.as_ref())
            } else {
                face.as_ref()
            };
            let base = cell * number(node, "size", 65.0, 10.0, 300.0) / 100.0;
            let manual = node["x"].as_f64().zip(node["y"].as_f64());
            let gap = cell * number(p, "tgap", 15.0, 0.0, 100.0) / 100.0 + clearance;
            let explicit: Vec<_> = entry
                .split('/')
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(str::to_string)
                .collect();
            let mut wraps = vec![explicit];
            if !entry.contains('/') && entry.split_whitespace().count() > 1 {
                wraps.push(entry.split_whitespace().map(str::to_string).collect());
            }
            let mut placed = None;
            'search: for step in 0..=9 {
                let scale = 1.0 - step as f64 / 10.0;
                if scale + 1e-9 < number(p, "textmin", 40.0, 10.0, 100.0) / 100.0 {
                    break;
                }
                if manual.is_some() && step > 0 {
                    break;
                }
                let size = base * scale;
                for lines in &wraps {
                    let metrics: Vec<_> = lines
                        .iter()
                        .map(|s| measure(s, f, &input.metrics))
                        .collect();
                    let width = metrics
                        .iter()
                        .map(|m| m[0] * size / 100.0)
                        .fold(0.0, f64::max);
                    let ascent = metrics
                        .iter()
                        .map(|m| m[1] * size / 100.0)
                        .fold(0.0, f64::max);
                    let descent = metrics
                        .iter()
                        .map(|m| m[2] * size / 100.0)
                        .fold(0.0, f64::max);
                    let height = ascent + descent + (lines.len() - 1) as f64 * size * 1.1;
                    let bw = width + gap * 2.0;
                    let bh = height + gap * 2.0;
                    if let Some((x, y)) = manual {
                        let x = (x.clamp(0.0, 1.0) * w)
                            .clamp(ox + bw / 2.0, (w - ox - bw / 2.0).max(ox + bw / 2.0));
                        let y = (y.clamp(0.0, 1.0) * h)
                            .clamp(oy + bh / 2.0, (h - oy - bh / 2.0).max(oy + bh / 2.0));
                        if bw <= cols as f64 * cell && bh <= rows as f64 * cell {
                            placed = Some((
                                [x - bw / 2.0, y - bh / 2.0, bw, bh],
                                size,
                                lines.clone(),
                                ascent,
                                gap,
                            ));
                            break 'search;
                        }
                    } else {
                        for panel in &panels {
                            let b = panel.bounds;
                            let nx = ((b[2] - bw) / (cell / 2.0)).floor() as i32;
                            let ny = ((b[3] - bh) / (cell / 2.0)).floor() as i32;
                            for iy in 0..=ny {
                                for ix in 0..=nx {
                                    let candidate = [
                                        b[0] + ix as f64 * cell / 2.0,
                                        b[1] + iy as f64 * cell / 2.0,
                                        bw,
                                        bh,
                                    ];
                                    let x0 = ((candidate[0] - ox) / cell).floor().max(0.0) as usize;
                                    let y0 = ((candidate[1] - oy) / cell).floor().max(0.0) as usize;
                                    let x1 = (((candidate[0] + candidate[2] - ox) / cell).ceil()
                                        as usize)
                                        .min(cols);
                                    let y1 = (((candidate[1] + candidate[3] - oy) / cell).ceil()
                                        as usize)
                                        .min(rows);
                                    let blocked = blocking
                                        && (y0..y1)
                                            .any(|y| (x0..x1).any(|x| occupied[y * cols + x]));
                                    if !blocked
                                        && !words
                                            .iter()
                                            .any(|word: &Word| overlaps(candidate, word.bounds))
                                    {
                                        placed =
                                            Some((candidate, size, lines.clone(), ascent, gap));
                                        break 'search;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            let Some((bounds, size, lines, ascent, gap)) = placed else {
                unplaced.push(entry.to_string());
                continue;
            };
            let center = [bounds[0] + bounds[2] / 2.0, bounds[1] + bounds[3] / 2.0];
            let mut shape = String::new();
            for (i, line) in lines.iter().enumerate() {
                let m = measure(line, f, &input.metrics);
                let x = center[0] - m[0] * size / 200.0 + m[3] * size / 100.0;
                let baseline = bounds[1] + gap + ascent + i as f64 * size * 1.1;
                if let Some(face) = f {
                    let mut builder = Outline {
                        d: String::new(),
                        x,
                        y: baseline,
                        scale: size / face.units_per_em() as f64,
                    };
                    for c in line.chars() {
                        if let Some(g) = face.glyph_index(c) {
                            face.outline_glyph(g, &mut builder);
                            builder.x +=
                                face.glyph_hor_advance(g).unwrap_or(0) as f64 * builder.scale;
                        }
                    }
                    shape += &format!("<path d=\"{}\"/>", builder.d);
                } else {
                    shape+=&format!("<text x=\"{x}\" y=\"{baseline}\" font-family=\"Arial, sans-serif\" font-weight=\"700\" font-size=\"{size}\">{}</text>",esc(line));
                }
            }
            if blocking {
                for k in 0..occupied.len() {
                    let b = [
                        ox + (k % cols) as f64 * cell,
                        oy + (k / cols) as f64 * cell,
                        cell,
                        cell,
                    ];
                    if overlaps(bounds, b) {
                        occupied[k] = true;
                    }
                }
            }
            words.push(Word {
                text: entry.to_string(),
                bounds,
                center,
                size,
            });
            word_shapes.push(shape);
        }
    };
    place_words(
        true,
        &mut occupied,
        &mut words,
        &mut unplaced,
        &mut word_shapes,
    );
    let manual_occupied = occupied.clone();
    let mut starts: Vec<_> = (0..occupied.len()).collect();
    for i in (1..starts.len()).rev() {
        let j = rng.next(i + 1);
        starts.swap(i, j);
    }
    let mut arrows: Vec<Arrow> = Vec::new();
    let amount = number(p, "amount", 75.0, 5.0, 100.0) as usize;
    let max_length = number(p, "length", 14.0, 2.0, 80.0) as usize;
    let delta = [(1isize, 0isize), (0, 1), (-1, 0), (0, -1)];
    for start in starts {
        if occupied[start] {
            continue;
        }
        let mut cells = vec![start];
        let mut direction = rng.next(4);
        for _ in 1..max_length {
            let k = *cells.last().unwrap();
            let mut directions = vec![direction, (direction + 1) % 4, (direction + 3) % 4];
            if rng.next(100) < number(p, "turn", 40.0, 0.0, 100.0) as usize {
                directions.rotate_left(1);
            }
            let next = directions.into_iter().find_map(|d| {
                let (dx, dy) = delta[d];
                let x = (k % cols) as isize + dx;
                let y = (k / cols) as isize + dy;
                if x < 0 || y < 0 || x >= cols as isize || y >= rows as isize {
                    return None;
                }
                let n = y as usize * cols + x as usize;
                if occupied[n] || cells.contains(&n) || pid[n] != pid[start] {
                    None
                } else {
                    Some((n, d))
                }
            });
            let Some((n, d)) = next else { break };
            cells.push(n);
            direction = d;
            occupied[n] = true;
        }
        if cells.len() < 2 {
            continue;
        }
        occupied[start] = true;
        let parent = arrows.len();
        let panel = pid[start];
        arrows.push(Arrow {
            points: points(&cells, cols, cell, ox, oy, text(p, "style", "arc") == "arc"),
            cells: cells.clone(),
            parent: None,
            progress: 1.0,
            panel,
        });
        if cells.len() > 4 && rng.next(100) < number(p, "fork", 30.0, 0.0, 100.0) as usize {
            let at = cells[1 + rng.next(cells.len() - 3)];
            for (dx, dy) in delta {
                let x = (at % cols) as isize + dx;
                let y = (at / cols) as isize + dy;
                if x < 0 || y < 0 || x >= cols as isize || y >= rows as isize {
                    continue;
                }
                let n = y as usize * cols + x as usize;
                if !occupied[n] && pid[n] == panel {
                    occupied[n] = true;
                    let branch = vec![at, n];
                    arrows.push(Arrow {
                        points: points(&branch, cols, cell, ox, oy, false),
                        cells: branch,
                        parent: Some(parent),
                        progress: 1.0,
                        panel,
                    });
                    break;
                }
            }
        }
    }
    let roots = arrows.iter().filter(|a| a.parent.is_none()).count();
    let keep = ((roots * amount) as f64 / 100.0).round().max(1.0) as usize;
    let mut root = 0;
    let end = arrows
        .iter()
        .position(|a| {
            if a.parent.is_none() {
                root += 1;
            }
            root > keep
        })
        .unwrap_or(arrows.len());
    arrows.truncate(end);
    occupied = manual_occupied;
    for arrow in &arrows {
        for &k in &arrow.cells {
            occupied[k] = true;
        }
    }
    place_words(
        false,
        &mut occupied,
        &mut words,
        &mut unplaced,
        &mut word_shapes,
    );
    let motion = text(p, "motion", "none");
    let speed = number(p, "speed", 3.0, 0.5, 20.0);
    let stagger = number(p, "stagger", 50.0, 0.0, 100.0) / 100.0;
    let reveal = 1.0 - number(p, "hold", 35.0, 0.0, 90.0) / 100.0;
    let duration = if motion == "none" {
        0.0
    } else if motion == "draw loop" {
        speed
    } else {
        speed * (1.0 + stagger + reveal)
    };
    let mut phases = Vec::new();
    for (i, a) in arrows.iter_mut().enumerate() {
        let phase = if let Some(parent) = a.parent {
            phases[parent] + reveal * 0.5
        } else {
            stagger * (i % 8) as f64 / 8.0
        };
        phases.push(phase);
        let c = input.time_seconds / speed - phase;
        let c = if motion == "draw loop" {
            c.rem_euclid(1.0)
        } else {
            c.clamp(0.0, 1.0)
        };
        let t = (c / reveal).clamp(0.0, 1.0);
        a.progress = if motion == "none" {
            1.0
        } else {
            match text(p, "timing", "ease out") {
                "linear" => t,
                "snap" => {
                    if t >= 1.0 {
                        1.0
                    } else {
                        0.0
                    }
                }
                _ => 1.0 - (1.0 - t).powi(3),
            }
        };
    }
    let paper = color(p, "paper", "#f4f1ea");
    let ink = color(p, "ink", "#111111");
    let arrow_color = color(p, "arrow", "#111111");
    let render = |finished: bool| {
        let mut layers = BTreeMap::new();
        layers.insert(
            "paper",
            format!("<rect width=\"{w}\" height=\"{h}\" fill=\"{paper}\"/>"),
        );
        let mut ps = String::new();
        for q in &panels {
            let b = q.bounds;
            let fill = if q.inverted { &ink } else { &paper };
            ps += &format!(
                "<rect x=\"{}\" y=\"{}\" width=\"{}\" height=\"{}\" fill=\"{fill}\"/>",
                b[0], b[1], b[2], b[3]
            );
        }
        layers.insert("panels", ps);
        let mut paths = String::new();
        for (i, a) in arrows.iter().enumerate() {
            let r = if finished { 1.0 } else { a.progress };
            if r <= 0.0 {
                continue;
            }
            let pts = cut(&a.points, r);
            let d = pts
                .iter()
                .enumerate()
                .map(|(i, p)| format!("{}{} {}", if i == 0 { "M" } else { "L" }, p[0], p[1]))
                .collect::<String>();
            let end = pts[pts.len() - 1];
            let prev = pts[pts.len() - 2];
            let angle = (end[1] - prev[1]).atan2(end[0] - prev[0]);
            let transform = |x: f64, y: f64| {
                [
                    end[0] + x * angle.cos() - y * angle.sin(),
                    end[1] + x * angle.sin() + y * angle.cos(),
                ]
            };
            let triangle = [
                transform(-cell * 0.25, cell * 0.35),
                transform(cell * 0.3, 0.0),
                transform(-cell * 0.25, -cell * 0.35),
            ];
            let fill = if panels[a.panel].inverted {
                &paper
            } else {
                &arrow_color
            };
            paths+=&format!("<g data-arrow=\"{i}\"><path d=\"{d}\" fill=\"none\" stroke=\"{fill}\" stroke-width=\"{shaft}\" stroke-linejoin=\"round\"/><path d=\"M{} {}L{} {}L{} {}Z\" fill=\"{fill}\"/></g>",triangle[0][0],triangle[0][1],triangle[1][0],triangle[1][1],triangle[2][0],triangle[2][1]);
        }
        layers.insert("arrows", paths);
        let mut texts = String::new();
        for (i, (word, shape)) in words.iter().zip(&word_shapes).enumerate() {
            let panel = panels.iter().find(|q| overlaps(word.bounds, q.bounds));
            let fill = if panel.is_some_and(|q| q.inverted) {
                &paper
            } else {
                &ink
            };
            texts += &format!("<g data-word=\"{i}\" fill=\"{fill}\">{shape}</g>");
        }
        layers.insert("text", texts);
        let default = serde_json::json!([{"id":"paper","on":true},{"id":"panels","on":true},{"id":"arrows","on":true},{"id":"text","on":true}]);
        let ls = p["layers"]
            .as_array()
            .unwrap_or(default.as_array().unwrap());
        let mut body = String::new();
        for l in ls {
            let id = text(l, "id", "");
            if l["on"].as_bool() == Some(false) || p[format!("show_{id}")].as_bool() == Some(false)
            {
                continue;
            }
            let opacity = number(l, "opacity", 100.0, 0.0, 100.0) / 100.0;
            let blend = match text(l, "blend", "normal") {
                "multiply" => "multiply",
                "screen" => "screen",
                "overlay" => "overlay",
                "difference" => "difference",
                _ => "normal",
            };
            if let Some(content) = layers.get(id) {
                body+=&format!("<g id=\"{id}\" opacity=\"{opacity}\" style=\"mix-blend-mode:{blend}\">{content}</g>");
            }
        }
        format!("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{w}\" height=\"{h}\" viewBox=\"0 0 {w} {h}\">{body}</svg>")
    };
    let svg = render(false);
    let static_svg = render(true);
    Ok(Frame {
        dimensions: input.dimensions,
        time_seconds: input.time_seconds,
        duration_seconds: duration,
        scene: Scene {
            svg,
            static_svg,
            columns: cols,
            rows,
            cell,
            clearance,
            panels,
            arrows,
            words,
            unplaced,
        },
    })
}

#[cfg(test)]
mod tools {
    use super::*;
    fn input() -> Input {
        Input {
            dimensions: Dimensions {
                width: 600,
                height: 400,
            },
            seed: 42,
            time_seconds: 0.75,
            params: serde_json::json!({"fork":100,"words":"hello | extraordinarilylongunbreakablewordextraordinarilylongunbreakablewordextraordinarilylongunbreakablewordextraordinarilylongunbreakablewordextraordinarilylongunbreakablewordextraordinarilylongunbreakableword","style":"arc","motion":"draw loop"}),
            metrics: BTreeMap::new(),
        }
    }
    #[test]
    fn seeded_clearance_branch_panel_text_and_explicit_time() {
        for style in ["bend", "arc"] {
            for invert in [0, 100] {
                let mut i = input();
                i.params["style"] = style.into();
                i.params["invert"] = invert.into();
                let f = evaluate(i.clone(), &[], &[]).unwrap();
                assert_eq!(f, evaluate(i.clone(), &[], &[]).unwrap());
                i.seed = 7;
                assert_ne!(f.scene.arrows, evaluate(i, &[], &[]).unwrap().scene.arrows);
                if style == "arc" {
                    assert!(f
                        .scene
                        .arrows
                        .iter()
                        .any(|a| a.points.len() > a.cells.len()));
                } else {
                    assert!(f
                        .scene
                        .arrows
                        .iter()
                        .all(|a| a.points.len() == a.cells.len()));
                }
                assert!(!f.scene.arrows.is_empty());
                assert!(f.scene.arrows.iter().any(|a| a.parent.is_some()));
                assert!(!f.scene.words.is_empty());
                assert!(!f.scene.unplaced.is_empty());
                assert!(f.scene.clearance > 0.0);
                for (n, a) in f.scene.arrows.iter().enumerate() {
                    for (previous, b) in f.scene.arrows[..n].iter().enumerate() {
                        let shared: Vec<_> =
                            a.cells.iter().filter(|c| b.cells.contains(c)).collect();
                        assert!(shared.is_empty() || a.parent == Some(previous));
                        if !shared.is_empty() {
                            assert_eq!(shared.len(), 1);
                            assert_eq!(*shared[0], a.cells[0]);
                        }
                    }
                    for c in &a.cells {
                        let x = *c % f.scene.columns;
                        let y = *c / f.scene.columns;
                        let q = f.scene.panels[a.panel].bounds;
                        let ox = (600.0 - f.scene.columns as f64 * f.scene.cell) / 2.0;
                        let oy = (400.0 - f.scene.rows as f64 * f.scene.cell) / 2.0;
                        assert!(ox + x as f64 * f.scene.cell >= q[0] - 1e-8);
                        assert!(oy + y as f64 * f.scene.cell >= q[1] - 1e-8);
                        assert!(ox + (x + 1) as f64 * f.scene.cell <= q[0] + q[2] + 1e-8);
                        assert!(oy + (y + 1) as f64 * f.scene.cell <= q[1] + q[3] + 1e-8);
                        for word in &f.scene.words {
                            assert!(!overlaps(
                                word.bounds,
                                [
                                    ox + x as f64 * f.scene.cell,
                                    oy + y as f64 * f.scene.cell,
                                    f.scene.cell,
                                    f.scene.cell
                                ]
                            ));
                        }
                    }
                }
                assert_ne!(f.scene.svg, f.scene.static_svg);
            }
        }
    }
    #[test]
    fn dimensions_relayout_manual_word_layers_and_boundaries() {
        let first = evaluate(input(), &[], &[]).unwrap();
        let mut dense = input();
        dense.params["amount"] = 100.into();
        let dense = evaluate(dense, &[], &[]).unwrap();
        assert!(dense.scene.arrows.len() > first.scene.arrows.len());
        assert!(dense.scene.unplaced.contains(&"hello".to_string()));
        for (w, h) in [(100, 100), (8000, 100), (100, 8000), (900, 400)] {
            let mut i = input();
            i.dimensions = Dimensions {
                width: w,
                height: h,
            };
            let f = evaluate(i, &[], &[]).unwrap();
            assert_eq!(f.dimensions.width, w);
            assert_ne!(
                (f.scene.columns, f.scene.rows, f.scene.cell),
                (first.scene.columns, first.scene.rows, first.scene.cell)
            );
        }
        let mut i = input();
        i.params = serde_json::json!({"words":"hello","nodes":{"hello":{"x":0.5,"y":0.5}},"layers":[{"id":"text","on":true,"opacity":40}]});
        let f = evaluate(i, &[], &[]).unwrap();
        assert_eq!(f.scene.words[0].center, [300.0, 200.0]);
        assert!(f.scene.svg.contains("opacity=\"0.4\""));
        assert!(!f.scene.svg.contains("data-arrow"));
        for (width, time) in [(99, 0.0), (8001, 0.0), (600, -1.0), (600, f64::NAN)] {
            let mut i = input();
            i.dimensions.width = width;
            i.time_seconds = time;
            assert!(evaluate(i, &[], &[]).is_err());
        }
        assert!(evaluate(input(), &[1, 2], &[]).is_err());
    }
}
