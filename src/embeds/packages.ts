import type { ToolAdapter } from '../engine/contracts';
import type { EditorTool } from '../workspace/view';
import type { ExportHandlers } from '../workspace/exports';
import runtimeFiles from './pkg/files';
import { templates } from './templates';
import { zip } from './zip';

export async function packageEmbed({ input, progress }: Parameters<NonNullable<ExportHandlers['embed']>>[0]) {
  const design = input.design;
  progress('Collecting embed runtime and fonts…');
  const files = await Promise.all(runtimeFiles.map(async ({ name, url }) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Embed asset unavailable: ${name} (${response.status})`);
    return { name, bytes: new Uint8Array(await response.arrayBuffer()) };
  }));
  const assets = design.assets.map((asset, i) => {
    const url = `fonts/${i}.bin`;
    files.push({ name: url, bytes: asset.bytes });
    const { bytes: _bytes, ...metadata } = asset;
    return { ...metadata, url };
  });
  const { demo, snippet, instructions } = templates(design, assets);
  const encoder = new TextEncoder();
  files.push(...Object.entries({ 'index.html': demo, 'snippet.html': snippet, 'README.txt': instructions }).map(([name, text]) => ({ name, bytes: encoder.encode(text) })));
  progress('Packaging website embed…');
  return { name: `${design.toolId}-${design.seed}-embed.zip`, blob: zip(files) };
}

/** Only delivered generator registrations opt into the portable export handler. */
export function withEmbed(tool: EditorTool): EditorTool {
  const adapter: ToolAdapter<any, any> = { ...tool.adapter, capabilities: { ...tool.adapter.capabilities, formats: [...tool.adapter.capabilities.formats, 'embed'] } };
  return { ...tool, adapter };
}
