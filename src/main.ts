import { mount } from 'svelte';
import App from './workspace/App.svelte';

import { tools } from './workspace/registry';
import { arrowMaze, artwork } from './tools/arrow-maze';

mount(App, { target: document.getElementById('app')!, props: {
  catalog: tools.map(tool => tool.id === arrowMaze.id ? arrowMaze : tool),
  exporters: { 'arrow-maze': artwork },
} });
