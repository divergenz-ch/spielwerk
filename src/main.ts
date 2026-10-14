import { mount } from 'svelte';
import App from './workspace/App.svelte';

import { tools } from './workspace/registry';
import { arrowMaze, artwork } from './tools/arrow-maze';
import { arrowPoster, artwork as posterArtwork } from './tools/arrow-poster';
import { arrowComb, artwork as combArtwork } from './tools/arrow-comb';

mount(App, { target: document.getElementById('app')!, props: {
  catalog: tools.map(tool => [arrowMaze, arrowPoster, arrowComb].find(ready => ready.id === tool.id) ?? tool),
  exporters: { 'arrow-maze': artwork, 'arrow-poster': posterArtwork, 'arrow-comb': combArtwork },
} });
