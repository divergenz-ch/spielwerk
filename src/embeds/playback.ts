export type Playback = 'loop' | 'once' | 'in-view' | 'static';
export type PlaybackOptions = { playback?: Playback; pauseOffscreen?: boolean; reducedMotion?: 'respect' | 'ignore' };

/** Browser clock only. The adapter owns duration and frame calculation. */
export class PlaybackClock {
  private at = 0;
  private origin = performance.now();
  private running = false;
  private requested = true;
  private visible = true;
  private reduced = false;
  duration = 0;
  constructor(public mode: Playback, private options: PlaybackOptions) {}
  get static() { return this.mode === 'static' || (this.reduced && this.options.reducedMotion !== 'ignore'); }
  get active() { return this.running; }
  get time() { return this.at + (this.running ? (performance.now() - this.origin) / 1000 : 0); }
  private reconcile() {
    const time = this.time;
    this.at = time; this.origin = performance.now();
    this.running = this.requested && !this.static && this.duration > 0
      && (this.visible || this.options.pauseOffscreen === false)
      && (!(this.mode === 'once' || this.mode === 'in-view') || time < this.duration);
  }
  setDuration(seconds: number) { this.duration = seconds; this.reconcile(); }
  play() { this.requested = true; this.reconcile(); }
  pause() { this.requested = false; this.reconcile(); }
  seek(seconds: number) { this.at = seconds; this.origin = performance.now(); this.reconcile(); }
  restart() { this.seek(0); }
  visibility(on: boolean) {
    if (on && !this.visible && this.mode === 'in-view') this.restart();
    this.visible = on; this.reconcile();
  }
  reducedMotion(on: boolean) { this.reduced = on; this.reconcile(); }
  frameTime() {
    if (this.static) return 0;
    const time = this.time;
    if (this.duration > 0 && (this.mode === 'once' || this.mode === 'in-view') && time >= this.duration) {
      this.at = this.duration; this.running = false;
      return this.duration;
    }
    return time;
  }
}
