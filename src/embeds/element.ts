import type { Asset, DesignState } from '../engine/contracts';
import type { Parameters } from '../workspace/storage';
import { EmbedRuntime, type EmbedOptions } from './runtime';
export { EmbedRuntime } from './runtime';

type Configuration = Omit<DesignState<Parameters>, 'assets'> & { assets: (Omit<Asset, 'bytes'> & { url: string })[] };

/** Fonts resolve beside the runtime, even when a snippet is placed on another page. */
export class SpielwerkArtwork extends HTMLElement {
  private runtime?: EmbedRuntime;
  private revision = 0;
  ready?: Promise<void>;
  get frame() { return this.runtime?.frame; }
  connectedCallback() { this.ready = this.load(++this.revision); }
  disconnectedCallback() { ++this.revision; this.runtime?.destroy(); this.runtime = undefined; }
  private async load(revision: number) {
    const source = this.getAttribute('config-src');
    // Each reusable snippet keeps its module immediately before its artwork.
    // Custom-element registration is shared across packages, but font bases aren't.
    const script = this.previousElementSibling;
    const runtimeUrl = script instanceof HTMLScriptElement && script.type === 'module' && script.src
      ? script.src : import.meta.url;
    const base = source ? new URL(source, document.baseURI).href : runtimeUrl;
    const config: Configuration = source
      ? await (await fetch(base)).json()
      : JSON.parse(this.querySelector('script[type="application/json"]')!.textContent!);
    const assets = await Promise.all(config.assets.map(async asset => {
      const response = await fetch(new URL(asset.url, base));
      if (!response.ok) throw new Error(`Font asset unavailable: ${response.status}`);
      const { url: _url, ...metadata } = asset;
      return { ...metadata, bytes: new Uint8Array(await response.arrayBuffer()) };
    }));
    if (!this.isConnected || revision !== this.revision) return;
    const options: EmbedOptions = {
      fit: (this.getAttribute('fit') ?? undefined) as EmbedOptions['fit'],
      playback: (this.getAttribute('playback') ?? undefined) as EmbedOptions['playback'],
      cell: this.hasAttribute('cell') ? Number(this.getAttribute('cell')) : undefined,
      pauseOffscreen: this.getAttribute('pause-offscreen') !== 'false',
      reducedMotion: this.getAttribute('reduced-motion') === 'ignore' ? 'ignore' : undefined,
    };
    this.runtime = new EmbedRuntime(this, { ...config, assets }, options);
    await new Promise<void>(resolve => this.addEventListener('spielwerk:frame', () => resolve(), { once: true }));
  }
  play() { return this.runtime?.play(); }
  pause() { return this.runtime?.pause(); }
  restart() { return this.runtime?.restart(); }
  seek(seconds: number) { return this.runtime?.seek(seconds); }
  setConfig(design: DesignState<Parameters>) { return this.runtime?.setConfig(design); }
}
if (!customElements.get('spielwerk-artwork')) customElements.define('spielwerk-artwork', SpielwerkArtwork);
