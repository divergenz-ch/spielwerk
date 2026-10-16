import { evaluateLiquidGradients } from '../engine/client';
import { decodeImage } from '../engine/images';
import type { ToolAdapter } from '../engine/contracts';
import type { EditorTool } from '../workspace/view';
import type { Parameters } from '../workspace/storage';
import type { ExportHandlers } from '../workspace/exports';
import { numeric, choice, artboard } from './arrow-path';
import { liquidRenderer, type LiquidScene } from './liquid-renderer';

export const adapter: ToolAdapter<Parameters, LiquidScene> = {
  id: 'liquid-gradients',
  defaults: {
    // Broad, slow-moving pools of ultramarine, coral and warm light.
    scale: 0.65, distortion: 0.65, softness: 0.75, grain: 3, seed: 42,
    c1: '#2516a6', c2: '#ff583d', c3: '#ff98c6', c4: '#ffe9b5',
    motion: 'loop', speed: 0.6, wpx: 800, hpx: 800, imageMix: 100, imageFit: 'cover',
  },
  dimensions: { width: { min: 1, max: 4096 }, height: { min: 1, max: 4096 } },
  capabilities: { responsive: true, motion: true, formats: ['png'] },
  controls: [
    numeric('scale', 'Scale', 'Liquid', 0.3, 4, 0.05),
    numeric('distortion', 'Distortion', 'Liquid', 0, 2, 0.01),
    numeric('softness', 'Softness', 'Liquid', 0.1, 1, 0.01),
    numeric('grain', 'Grain %', 'Liquid', 0, 20, 0.5),
    numeric('seed', 'Seed', 'Liquid', 1, 9999),
    numeric('imageMix', 'Image mix %', 'Liquid', 0, 100),
    choice('imageFit', 'Image fit', 'Liquid', ['cover', 'contain']),
    ...['c1', 'c2', 'c3', 'c4'].map((key, i) => ({ key, label: `Color ${i + 1}`, group: 'Palette', type: 'color' as const })),
    choice('motion', 'Motion', 'Motion', ['loop', 'none']),
    numeric('speed', 'Speed', 'Motion', 0.1, 3, 0.1),
  ],
  async evaluate(input) {
    const frame = await evaluateLiquidGradients(input);
    const asset = input.design.assets.find(asset => asset.role === 'image');
    // Rust owns the uniforms; the browser only decodes the optional raster asset.
    if (asset) frame.scene.image = await decodeImage(asset);
    return frame;
  },
};

export const liquidGradients: EditorTool = {
  id: adapter.id, name: 'Liquid Gradients',
  description: 'Flowing colors or liquid-warped images, rendered on the GPU.',
  status: 'ready', adapter, renderer: liquidRenderer,
  artboard: { ...artboard, initial: { width: 800, height: 800 }, presets: ['1:1', '4:5', '3:4', '16:9', '9:16'] },
  accent: false, typefaces: false, image: true, playback: true,
};

export const artwork: ExportHandlers<Parameters, LiquidScene> = {
  async png({ input, frame }) {
    // Render the immutable export frame independently; never capture a stale preview.
    const target = document.createElement('div');
    try {
      liquidRenderer.render(frame, target);
      const canvas = target.querySelector('canvas')!;
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed.')), 'image/png',
      ));
      return { name: `liquid-gradients-${input.design.seed}.png`, blob };
    } finally { liquidRenderer.dispose?.(target); }
  },
};
