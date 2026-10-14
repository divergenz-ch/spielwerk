import { mount } from 'svelte';
import App from './workspace/App.svelte';
import { packageEmbed, withEmbed } from './embeds/packages';

import { tools } from './workspace/registry';
import { arrowMaze, artwork } from './tools/arrow-maze';
import { arrowPoster, artwork as posterArtwork } from './tools/arrow-poster';
import { arrowComb, artwork as combArtwork } from './tools/arrow-comb';
import { arrowField, artwork as fieldArtwork } from './tools/arrow-field';
import { switchboard, artwork as switchboardArtwork } from './tools/switchboard';

import { truchetTiles, artwork as truchetArtwork } from './tools/truchet-tiles';
import { imprint, artwork as imprintArtwork } from './tools/imprint';
import { stripeMarquee, artwork as stripeArtwork } from './tools/stripe-marquee';

const generators = [arrowMaze, arrowPoster, arrowComb, arrowField, switchboard, truchetTiles, imprint, stripeMarquee].map(withEmbed);
const artworkHandlers = { 'arrow-maze': artwork, 'arrow-poster': posterArtwork, 'arrow-comb': combArtwork, 'arrow-field': fieldArtwork, switchboard: switchboardArtwork, 'truchet-tiles': truchetArtwork, imprint: imprintArtwork, 'stripe-marquee': stripeArtwork };
mount(App, { target: document.getElementById('app')!, props: {
  catalog: tools.map(tool => generators.find(ready => ready.id === tool.id) ?? tool),
  exporters: Object.fromEntries(Object.entries(artworkHandlers).map(([id, handlers]) => [id, { ...handlers, embed: packageEmbed }])),
} });
