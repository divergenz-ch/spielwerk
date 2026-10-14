import { mount } from 'svelte';
import App from './workspace/App.svelte';
import { tools } from './workspace/registry';
import { generators, exporters } from './tools/registry';

mount(App, { target: document.getElementById('app')!, props: {
  catalog: tools.map(tool => generators.find(ready => ready.id === tool.id) ?? tool),
  exporters,
} });
