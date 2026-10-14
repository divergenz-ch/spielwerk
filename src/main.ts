import { mount } from 'svelte';
import App from './workspace/App.svelte';

import { tools } from './workspace/registry';
import { arrowMaze, artwork } from './tools/arrow-maze';
import { arrowPoster, artwork as posterArtwork } from './tools/arrow-poster';
import { arrowComb, artwork as combArtwork } from './tools/arrow-comb';
import { arrowField, artwork as fieldArtwork } from './tools/arrow-field';
import { switchboard, artwork as switchboardArtwork } from './tools/switchboard';

import { truchetTiles, artwork as truchetArtwork } from './tools/truchet-tiles';
import { imprint, artwork as imprintArtwork } from './tools/imprint';
import { stripeMarquee, artwork as stripeArtwork } from './tools/stripe-marquee';

mount(App, { target: document.getElementById('app')!, props: {
  catalog: tools.map(tool => [arrowMaze, arrowPoster, arrowComb, arrowField, switchboard, truchetTiles, imprint, stripeMarquee].find(ready => ready.id === tool.id) ?? tool),
  exporters: { 'arrow-maze': artwork, 'arrow-poster': posterArtwork, 'arrow-comb': combArtwork, 'arrow-field': fieldArtwork, switchboard: switchboardArtwork, 'truchet-tiles': truchetArtwork, imprint: imprintArtwork, 'stripe-marquee': stripeArtwork },
} });
