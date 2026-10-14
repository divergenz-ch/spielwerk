import type { Capabilities, ToolAdapter } from '../engine/contracts';

/** Intended capabilities are not availability; sibling engines must supply adapters. */
export type PendingTool = {
  id: string;
  name: string;
  description: string;
  owner: 'generators' | 'extrusion' | 'fonts';
  status: 'pending';
  intendedCapabilities: Capabilities;
  adapter: null;
};

const generator = (
  id: string, name: string, description: string, motion = true, gif = true,
): PendingTool => ({
  id, name, description, owner: 'generators', status: 'pending', adapter: null,
  intendedCapabilities: {
    responsive: true, motion,
    formats: gif ? ['svg', 'png', 'gif', 'embed'] : ['svg', 'png', 'embed'],
  },
});

export const tools: readonly PendingTool[] = [
  generator('arrow-maze', 'Arrow Maze', 'Interlocking arrows on a grid, with text and draw-in motion.'),
  generator('arrow-poster', 'Arrow Poster', 'Parametric arrow compositions with stacked contours and draw-in motion.'),
  generator('arrow-comb', 'Arrow Comb', 'Bands of combed arrows with curved tails and optional text rows.'),
  generator('switchboard', 'Switchboard', 'Seeded widgets connected by animated wires.'),
  generator('truchet-tiles', 'Truchet Tiles', 'Square-grid tilings with arcs, triangles, and diagonals.', false, false),
  generator('arrow-field', 'Arrow Field', 'Arrows steered by a flow field with looping rotation.'),
  generator('imprint', 'Imprint', 'Embossed ray bursts with relief light, shadow, and optional grow-in motion.', true, false),
  {
    id: 'logo-extruder', name: 'Logo Extruder',
    description: 'Extrude an uploaded logo with materials, lighting, and motion.',
    owner: 'extrusion', status: 'pending', adapter: null,
    intendedCapabilities: { responsive: false, motion: true, formats: ['png', 'gif'] },
  },
  generator('stripe-marquee', 'Stripe Marquee', 'Uploaded type rendered as scrolling line-screen stripes.'),
  {
    id: 'font-remixer', name: 'Font Remixer',
    description: 'Transform font outlines or skeletons, with font and artwork output.',
    owner: 'fonts', status: 'pending', adapter: null,
    intendedCapabilities: {
      responsive: false, motion: false, formats: ['svg', 'png', 'otf', 'variable-font'],
    },
  },
];

/** A delivered registration requires real limits, defaults, controls, and Rust evaluation. */
export type ReadyTool<Params, Scene> = Omit<PendingTool, 'status' | 'adapter'> & {
  status: 'ready';
  adapter: ToolAdapter<Params, Scene>;
};
