import type { BeerRecipe } from './recipe'

/** Готовые рецепты для баннера и кнопки «случайный рецепт» не нужны — это витрина */
export const SAMPLE_BEERS: BeerRecipe[] = [
  { malt: 'pils', hops: ['saaz'], yeast: 'lager', extra: null, name: 'ПИЛЬЗНЕР', label: 'bone' },
  { malt: 'smoked', hops: ['magnum'], yeast: 'lager', extra: null, name: 'КОПЧЁНЫЙ', label: 'ember' },
  { malt: 'chocolate', hops: ['cascade'], yeast: 'ale', extra: 'coffee', name: 'СТАУТ', label: 'moss' },
]
