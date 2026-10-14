import type { Dimensions } from '../engine/contracts';
export type Fit = 'regenerate' | 'contain' | 'cover' | 'fixed';

export function observeSize(host: HTMLElement, artboard: Dimensions, changed: (size: Dimensions) => void) {
  const observer = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width > 0 && !height) {
      host.style.aspectRatio = `${artboard.width} / ${artboard.height}`;
      return;
    }
    if (width > 0 && height > 0) changed({ width: Math.round(width), height: Math.round(height) });
  });
  observer.observe(host);
  return () => observer.disconnect();
}

export function fitSvg(svg: SVGSVGElement, fit: Fit, size: Dimensions) {
  svg.style.width = fit === 'fixed' ? `${size.width}px` : '100%';
  svg.style.height = fit === 'fixed' ? `${size.height}px` : '100%';
  svg.style.display = 'block';
  svg.style.position = 'absolute';
  svg.style.left = '50%'; svg.style.top = '50%';
  svg.style.transform = 'translate(-50%, -50%)';
  svg.setAttribute('preserveAspectRatio', fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet');
}
