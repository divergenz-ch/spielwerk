# Divergenz — split, not return

Six exploratory symbols, constructed as single editable SVG contours.

- `divergenz-iterations.svg` — comparison sheet: large symbols, consistent type pairing, 24/16 px-high tests, and reversed marks.
- `divergenz-iterations.png` — raster preview of the sheet.
- `a01-open-split.svg` — symmetrical, explicit arrows, 60-degree spread.
- `a02-compact-split.svg` — symmetrical, 90-degree spread, shorter body.
- `a03-quiet-fork.svg` — symmetrical branching without arrow shoulders.
- `b01-departure.svg` — horizontal route plus a 45-degree departure.
- `b02-unequal-paths.svg` — horizontal route plus a steeper, lighter departure.
- `b03-open-incision.svg` — deeper diagonal opening, no upper arrow shoulders.

Start by comparing **B01** (clearest asymmetric branching) and **A03** (simplest silhouette). These explore the divergence reading; the D is deliberately secondary. Recognition and distinctiveness still need testing.

Individual symbols have transparent backgrounds and one filled path: no fonts, strokes, masks, linked images, or dependencies. Change the path's `fill` to recolour. Open directly in Illustrator to edit anchors. The comparison sheet uses live Helvetica/Arial text as a provisional pairing, not a final wordmark.

Regenerate the SVGs with `python3 explorations/divergenz/generate.py` from the project root. The generator uses only the Python standard library; the PNG is a separately rendered preview.
