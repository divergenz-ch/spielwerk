import { packageEmbed, withEmbed } from '../embeds/packages';
import { arrowMaze, artwork as mazeArtwork } from './arrow-maze';
import { arrowPoster, artwork as posterArtwork } from './arrow-poster';
import { arrowComb, artwork as combArtwork } from './arrow-comb';
import { arrowField, artwork as fieldArtwork } from './arrow-field';
import { switchboard, artwork as switchboardArtwork } from './switchboard';
import { truchetTiles, artwork as truchetArtwork } from './truchet-tiles';
import { imprint, artwork as imprintArtwork } from './imprint';
import { stripeMarquee, artwork as stripeArtwork } from './stripe-marquee';

/** Delivered editor registrations; independent embeds import computation adapters only. */
export const generators = [arrowMaze, arrowPoster, arrowComb, arrowField, switchboard, truchetTiles, imprint, stripeMarquee].map(withEmbed);
const artwork = {
  'arrow-maze': mazeArtwork, 'arrow-poster': posterArtwork, 'arrow-comb': combArtwork,
  'arrow-field': fieldArtwork, switchboard: switchboardArtwork,
  'truchet-tiles': truchetArtwork, imprint: imprintArtwork, 'stripe-marquee': stripeArtwork,
};
export const exporters = Object.fromEntries(Object.entries(artwork).map(([id, handlers]) => [id, { ...handlers, embed: packageEmbed }]));
