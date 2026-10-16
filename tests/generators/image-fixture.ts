import type { Page } from '@playwright/test';

/** Asymmetric raster with transparency makes orientation, fitting and alpha observable. */
export async function rasterFile(page: Page, type = 'image/png', width = 64, height = 32) {
  const dataURL = await page.evaluate(({ type, width, height }) => {
    const canvas = Object.assign(document.createElement('canvas'), { width, height });
    const context = canvas.getContext('2d')!;
    for (const [color, x, y] of [['#ff0000', 0, 0], ['#00ff00', 1, 0], ['#0000ff', 0, 1], ['#ffffff', 1, 1]] as const) {
      context.fillStyle = color;
      context.fillRect(x * width / 2, y * height / 2, width / 2, height / 2);
    }
    context.clearRect(width / 2 - 4, height / 2 - 4, 8, 8);
    return canvas.toDataURL(type);
  }, { type, width, height });
  return { name: `source.${type === 'image/jpeg' ? 'jpg' : type.split('/')[1]}`, mimeType: type, buffer: Buffer.from(dataURL.split(',')[1], 'base64') };
}
