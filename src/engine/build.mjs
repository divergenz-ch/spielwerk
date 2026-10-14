import { execFileSync } from 'node:child_process';
import { build } from 'vite';
import { readdir, writeFile } from 'node:fs/promises';

const version = execFileSync('wasm-bindgen', ['--version'], { encoding: 'utf8' }).trim();
if (version !== 'wasm-bindgen 0.2.129') {
  throw new Error('Install wasm-bindgen-cli 0.2.129: npm run setup:engine');
}
execFileSync('cargo', ['build', '--locked', '--release', '--target', 'wasm32-unknown-unknown'], {
  cwd: 'crates/spielwerk-engine', stdio: 'inherit',
});
execFileSync('wasm-bindgen', [
  'crates/spielwerk-engine/target/wasm32-unknown-unknown/release/spielwerk_engine.wasm',
  '--target', 'web', '--out-dir', 'src/engine/pkg',
], { stdio: 'inherit' });
// A separate entry tree-shakes editor registrations, renderers and artwork encoders.
await build({
  configFile: false,
  base: './',
  experimental: { renderBuiltUrl: () => ({ relative: true }) },
  build: {
    outDir: 'src/embeds/pkg',
    assetsInlineLimit: 0,
    rolldownOptions: {
      preserveEntrySignatures: 'strict',
      treeshake: { propertyReadSideEffects: false },
      input: 'src/embeds/element.ts',
      output: { entryFileNames: 'runtime.js', chunkFileNames: 'assets/[name]-[hash].js' },
    },
  },
});
const files = ['runtime.js', ...(await readdir('src/embeds/pkg/assets')).map(name => `assets/${name}`)];
await writeFile('src/embeds/pkg/files.ts', files.map((name, i) =>
  `import url${i} from ${JSON.stringify('./' + name + '?url')};`).join('\n') +
  '\nexport default [' + files.map((name, i) => `{ name: ${JSON.stringify(name)}, url: url${i} }`).join(',') + '];\n');
if (!process.argv.includes('--wasm-only')) {
  await build({
    build: {
      assetsInlineLimit: 0,
      rolldownOptions: {
        input: { workspace: 'index.html', engine: 'src/engine/probe.html' },
      },
    },
  });
}
