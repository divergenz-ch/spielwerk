import type { EvaluationInput, Frame, OutputFormat, ToolAdapter } from '../engine/contracts';

export type ExportFile = { name: string; blob: Blob };
/** Encoders preserve embedded/baked asset appearance; geometry and timing come from evaluate. */
export type ExportContext<P = any, Scene = any> = {
  input: EvaluationInput<P>;
  frame: Frame<Scene>;
  evaluate(timeSeconds: number): Promise<Frame<Scene>>;
  progress(message: string): void;
};
export type ExportHandlers<P = any, Scene = any> = Partial<Record<OutputFormat, (context: ExportContext<P, Scene>) => Promise<ExportFile>>>;
export type Exporters = Record<string, ExportHandlers>;

export function supportedFormats(adapter: ToolAdapter<any, any>, handlers: ExportHandlers) {
  return adapter.capabilities.formats.filter(format => typeof handlers[format] === 'function');
}

export async function exportArtwork<P, Scene>(adapter: ToolAdapter<P, Scene>, handlers: ExportHandlers<P, Scene>, format: OutputFormat, request: EvaluationInput<P>, progress: (message: string) => void): Promise<ExportFile> {
  const encode = handlers[format];
  if (!adapter.capabilities.formats.includes(format) || !encode) throw new Error('This output format is not available.');
  const input = structuredClone(request);
  const evaluate = (timeSeconds: number) => adapter.evaluate(structuredClone({ ...input, timeSeconds }));
  progress('Evaluating artwork…');
  const frame = await evaluate(input.timeSeconds);
  progress('Encoding artwork…');
  return encode({ input: structuredClone(input), frame, evaluate, progress });
}

type Directory = {
  name: string;
  getFileHandle(name: string, options: { create: true }): Promise<{
    createWritable(): Promise<{ write(blob: Blob): Promise<void>; close(): Promise<void> }>;
  }>;
};
type Picker = (options: { id: string; mode: 'readwrite' }) => Promise<Directory>;

/** Session-only destination, shared across tools. Cancelling never replaces it. */
export function exportDestination() {
  let directory: Directory | null = null;
  const picker = (window as Window & { showDirectoryPicker?: Picker }).showDirectoryPicker;
  return {
    canPick: Boolean(picker),
    get name() { return directory?.name ?? null; },
    async pick() {
      if (!picker) throw new Error('Folder selection is unavailable; using browser downloads.');
      try { directory = await picker.call(window, { id: 'spielwerk-export', mode: 'readwrite' }); }
      catch (error) { if ((error as DOMException).name !== 'AbortError') throw error; }
      return directory?.name ?? null;
    },
    async save({ name, blob }: ExportFile): Promise<{ destination: string; warning?: string }> {
      let warning: string | undefined;
      if (directory) {
        try {
          const file = await directory.getFileHandle(name, { create: true });
          const writable = await file.createWritable();
          await writable.write(blob);
          await writable.close();
          return { destination: directory.name };
        } catch (error) { warning = `Folder output failed: ${String(error)}. Used browser download instead.`; }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return { destination: 'browser downloads', warning };
    },
  };
}
export type ExportDestination = ReturnType<typeof exportDestination>;
