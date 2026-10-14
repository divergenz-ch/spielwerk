import type { DesignState, Dimensions, Frame, ToolAdapter } from '../engine/contracts';
import type { Parameters } from '../workspace/storage';
import { adapter as maze, evaluateMaze } from '../tools/arrow-maze';
import { adapter as poster } from '../tools/arrow-poster';
import { adapter as comb } from '../tools/arrow-comb';
import { adapter as field } from '../tools/arrow-field';
import { adapter as switchboard } from '../tools/switchboard';
import { adapter as tiles } from '../tools/truchet-tiles';
import { adapter as imprint } from '../tools/imprint';
import { adapter as stripe } from '../tools/stripe-marquee';
import { PlaybackClock, type PlaybackOptions } from './playback';
import { observeSize, fitSvg, type Fit } from './resize';

type VisualScene = { svg: string; staticSvg: string };
export const adapters: Record<string, ToolAdapter<Parameters, VisualScene>> = Object.fromEntries(
  [maze, poster, comb, field, switchboard, tiles, imprint, stripe].map(adapter => [adapter.id, adapter]),
);
export type EmbedOptions = PlaybackOptions & { fit?: Fit; cell?: number };

/** Independent visual consumer: no workspace mount or visitor interaction handlers. */
export class EmbedRuntime {
  private design: DesignState<Parameters>;
  private box?: Dimensions;
  private stopResize: () => void;
  private intersection: IntersectionObserver;
  private media = matchMedia('(prefers-reduced-motion: reduce)');
  private clock: PlaybackClock;
  private raf = 0;
  private revision = 0;
  private disposed = false;
  private surface: HTMLDivElement;
  private visual: ShadowRoot;
  private initialStyle: { position: string; overflow: string; aspectRatio: string };
  frame?: Frame<VisualScene>;
  constructor(private host: HTMLElement, design: DesignState<Parameters>, private options: EmbedOptions = {}) {
    this.design = design;
    this.clock = new PlaybackClock(options.playback ?? this.defaultPlayback(), options);
    this.clock.reducedMotion(this.media.matches);
    this.initialStyle = { position: host.style.position, overflow: host.style.overflow, aspectRatio: host.style.aspectRatio };
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.style.overflow = 'hidden';
    this.surface = document.createElement('div');
    this.surface.style.pointerEvents = 'none';
    this.surface.setAttribute('aria-hidden', 'true');
    this.visual = this.surface.attachShadow({ mode: 'open' });
    host.append(this.surface);
    this.stopResize = observeSize(host, design.artboard.dimensions, size => {
      this.box = size; void this.redraw();
    });
    this.intersection = new IntersectionObserver(([entry]) => {
      this.clock.visibility(entry.isIntersecting); void this.redraw();
    });
    this.intersection.observe(host);
    this.media.addEventListener('change', this.motionChanged);
  }
  private defaultPlayback() {
    const motion = this.design.params.motion;
    return !adapters[this.design.toolId].capabilities.motion || !motion || motion === 'none' ? 'static'
      : motion === 'draw in' || motion === 'grow in' ? 'once' : 'loop';
  }
  private motionChanged = () => { this.clock.reducedMotion(this.media.matches); void this.redraw(); };
  private get fit(): Fit { return this.design.toolId === maze.id ? this.options.fit ?? 'regenerate' : 'regenerate'; }
  private input(timeSeconds: number) {
    const params = { ...this.design.params };
    if (this.clock.static) params.motion = 'none';
    else if (this.design.toolId === maze.id) params.motion = this.clock.mode === 'loop' ? 'draw loop' : 'draw in';
    if (this.design.toolId === maze.id) {
      params.wpx = this.design.artboard.dimensions.width;
      params.hpx = this.design.artboard.dimensions.height;
    }
    const dimensions = this.fit === 'regenerate' ? this.box! : this.design.artboard.dimensions;
    return { design: { ...this.design, params, artboard: { mode: 'responsive' as const, dimensions } }, timeSeconds };
  }
  async redraw() {
    cancelAnimationFrame(this.raf);
    const revision = ++this.revision;
    if (this.disposed || !this.box) return;
    const time = this.clock.frameTime();
    const input = this.input(time);
    const frame = this.design.toolId === maze.id && this.fit === 'regenerate'
      ? await evaluateMaze(input, this.options.cell ?? 0)
      : await adapters[this.design.toolId].evaluate(input);
    if (this.disposed || revision !== this.revision) return;
    this.clock.setDuration(frame.durationSeconds);
    this.frame = frame;
    this.visual.innerHTML = frame.scene.svg;
    const svg = this.visual.querySelector('svg')!;
    // Explicit engine frames, never a second autonomous SMIL clock.
    svg.querySelectorAll('animate, animateTransform, animateMotion, set').forEach(node => node.remove());
    fitSvg(svg, this.fit, frame.dimensions);
    this.host.dispatchEvent(new CustomEvent('spielwerk:frame', { detail: frame }));
    if (this.clock.active) this.raf = requestAnimationFrame(() => { void this.redraw(); });
    return frame;
  }
  play() { this.clock.play(); return this.redraw(); }
  pause() { this.clock.pause(); return this.redraw(); }
  seek(seconds: number) { this.clock.seek(seconds); return this.redraw(); }
  restart() { this.clock.restart(); return this.redraw(); }
  setConfig(design: DesignState<Parameters>) {
    this.stopResize();
    this.design = design;
    this.clock.mode = this.options.playback ?? this.defaultPlayback();
    this.clock.duration = 0;
    this.clock.restart();
    this.host.style.aspectRatio = this.initialStyle.aspectRatio;
    this.stopResize = observeSize(this.host, design.artboard.dimensions, size => { this.box = size; void this.redraw(); });
    return this.redraw();
  }
  destroy() {
    this.disposed = true; ++this.revision;
    cancelAnimationFrame(this.raf); this.stopResize(); this.intersection.disconnect();
    this.media.removeEventListener('change', this.motionChanged);
    this.surface.remove(); Object.assign(this.host.style, this.initialStyle);
  }
}
