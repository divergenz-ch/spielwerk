import { execFileSync } from 'node:child_process';
import { build } from 'vite';

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
