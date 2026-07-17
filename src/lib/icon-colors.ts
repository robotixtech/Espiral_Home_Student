import type { UnitIcon } from './types';

/**
 * Fixed brand colors for the custom design-asset icons (2026-07 designer handoff).
 * UnitIcon.svelte ignores the `color` prop for these keys and always renders in this
 * color — anything that needs to visually match the icon (e.g. sphere number text)
 * reads from here too, so both stay in sync.
 */
export const ICON_COLORS: Partial<Record<UnitIcon, string>> = {
  u0:      '#143c26',
  terra:   '#a23a2a',
  aqua:    '#127993',
  aire:    '#3a55b8',
  candado: '#606060',
  ia:      '#000000',
  quanta:  '#000000',
};
