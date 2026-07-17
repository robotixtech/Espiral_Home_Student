<script lang="ts">
  import type { UnitIcon } from '../lib/types';
  import { ICON_COLORS } from '../lib/icon-colors';

  interface Props {
    icon: UnitIcon;
    size?: number;
    color?: string;
  }

  let { icon, size = 28, color = 'currentColor' }: Props = $props();
</script>

{#if icon === 'flag'}
  <!-- Rocket icon for launch -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
{:else if icon === 'gear'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
{:else if icon === 'power'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
    <line x1="12" y1="2" x2="12" y2="12"/>
  </svg>
{:else if icon === 'car'}
  <!-- Simple Mars rover -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <!-- Body -->
    <rect x="4" y="10" width="16" height="5" rx="2"/>
    <!-- Mast + camera -->
    <line x1="8" y1="10" x2="8" y2="6"/>
    <circle cx="8" cy="5" r="1.5"/>
    <!-- Wheels -->
    <circle cx="7" cy="18" r="2.5"/>
    <circle cx="17" cy="18" r="2.5"/>
    <!-- Axles -->
    <line x1="7" y1="15" x2="7" y2="15.5"/>
    <line x1="17" y1="15" x2="17" y2="15.5"/>
  </svg>
{:else if icon === 'tunnel'}
  <!-- Tunnel: semicircular entrance with road vanishing point -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <!-- Outer arch -->
    <path d="M2 20V10a10 10 0 0 1 20 0v10"/>
    <!-- Inner arch -->
    <path d="M6 20V11a6 6 0 0 1 12 0v9"/>
    <!-- Road lines converging to center -->
    <line x1="8" y1="20" x2="11" y2="13"/>
    <line x1="16" y1="20" x2="13" y2="13"/>
    <!-- Center dashes -->
    <line x1="12" y1="20" x2="12" y2="14" stroke-dasharray="1.5 1.5"/>
    <!-- Ground line -->
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
{:else if icon === 'search'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
{:else if icon === 'signal'}
  <!-- Ultrasonic waves radiating upward -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <g transform="rotate(270, 12, 12)">
    <circle cx="4" cy="12" r="1.5" fill={color} stroke="none"/>
    <path d="M9 6c3.5 2 3.5 10 0 12"/>
    <path d="M13 3c5.5 3 5.5 15 0 18"/>
    <path d="M17 0.5c7 4 7 19 0 23"/>
    </g>
  </svg>
{:else if icon === 'alert'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
{:else if icon === 'trophy'}
  <!-- Trophy with star and sparkles -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
    <!-- Cup body -->
    <path d="M7 3h10v8c0 2.8-2.2 5-5 5s-5-2.2-5-5V3z" fill-opacity="0.9"/>
    <!-- Left handle -->
    <path d="M7 5H5.5C4.1 5 3 6.3 3 8s1.1 3 2.5 3H7" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round"/>
    <!-- Right handle -->
    <path d="M17 5h1.5C19.9 5 21 6.3 21 8s-1.1 3-2.5 3H17" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round"/>
    <!-- Stem -->
    <path d="M10 16h4v2H10z" fill-opacity="0.8"/>
    <!-- Base -->
    <rect x="8" y="18" width="8" height="2.5" rx="1" fill-opacity="0.7"/>
    <!-- Star -->
    <path d="M12 6l1.1 2.2 2.4.3-1.7 1.7.4 2.4L12 11.4l-2.2 1.2.4-2.4-1.7-1.7 2.4-.3z" fill="rgba(255,255,255,0.85)" stroke="none"/>
    <!-- Sparkles -->
    <circle cx="15.5" cy="5.5" r="0.7" fill="rgba(255,255,255,0.7)"/>
    <circle cx="16.5" cy="7.5" r="0.5" fill="rgba(255,255,255,0.5)"/>
  </svg>
{:else if icon === 'rocket'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
{:else if icon === 'snowflake'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="2" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    <line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/>
    <line x1="12" y1="2" x2="9" y2="5"/><line x1="12" y1="2" x2="15" y2="5"/>
    <line x1="12" y1="22" x2="9" y2="19"/><line x1="12" y1="22" x2="15" y2="19"/>
    <line x1="2" y1="12" x2="5" y2="9"/><line x1="2" y1="12" x2="5" y2="15"/>
    <line x1="22" y1="12" x2="19" y2="9"/><line x1="22" y1="12" x2="19" y2="15"/>
  </svg>
{:else if icon === 'binoculars'}
  <!-- Telescope on tripod -->
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <!-- Eyepiece (small rectangle at top-left) -->
    <rect x="2" y="5" width="3.5" height="2.5" rx="0.8" transform="rotate(-35 3.75 6.25)"/>
    <!-- Main tube -->
    <rect x="5" y="3.5" width="12" height="4" rx="1.2" transform="rotate(-35 11 5.5)"/>
    <!-- Lens hood (front cap) -->
    <rect x="16" y="1" width="3" height="5" rx="1" transform="rotate(-35 17.5 3.5)"/>
    <!-- Finder circle -->
    <circle cx="15.5" cy="5.5" r="1.2"/>
    <!-- Tripod mount point -->
    <circle cx="10.5" cy="10.5" r="1"/>
    <!-- Tripod legs -->
    <line x1="10.5" y1="11.5" x2="6" y2="21"/>
    <line x1="10.5" y1="11.5" x2="15" y2="21"/>
    <line x1="10.5" y1="11.5" x2="18" y2="15"/>
    <!-- Tripod crossbar -->
    <line x1="7.5" y1="17.5" x2="13.5" y2="17.5"/>
  </svg>
{:else if icon === 'u0'}
  <!-- Fixed brand color (#143c26) regardless of the color prop. Same fix as TERRA below:
       U0's artwork is wider than tall (viewBox 49.67×37.84) — sizing the viewport at its own
       native aspect ratio (height = size, width scaled) removes the letterboxing so its
       height matches U1/U2's TERRA icon (2026-07-17 feedback). x re-centres it within the
       nominal size×size slot every caller positions against. -->
  <svg x={-(size * (49.67 / 37.84 - 1)) / 2} width={size * (49.67 / 37.84)} height={size} viewBox="0 0 49.67 37.84" fill="none" stroke={ICON_COLORS.u0} stroke-width="2.37" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1.18,36.66h47.3"/>
    <path d="M13.01,36.66c0-6.53,5.29-11.83,11.83-11.83s11.83,5.29,11.83,11.83"/>
    <path d="M24.83,16.56V1.18"/>
    <path d="M17.5,18.45l-4.49-12.06"/>
    <path d="M32.17,18.45l4.49-12.06"/>
    <path d="M12.06,23.65L4.02,14.66"/>
    <path d="M37.61,23.65l8.04-8.99"/>
    <path d="M8.75,29.56l-7.1-3.31"/>
    <path d="M40.92,29.56l7.1-3.31"/>
  </svg>
{:else if icon === 'terra'}
  <!-- Fixed brand color (#a23a2a) regardless of the color prop. TERRA's artwork is wider than
       tall (viewBox 52.98×37.27); rendering it into a square box like the other icons would
       letterbox it down to ~70% height, reading visibly smaller than U3's AQUA icon. Sizing
       the viewport at its own native aspect ratio (width scaled, height = size) removes the
       letterboxing so its height matches every other icon's, at the cost of a wider box
       (2026-07-17 feedback: make U1/U2 read the same size as U3). -->
  <!-- x re-centres it within the nominal size×size slot every caller positions against,
       since its rendered width is now wider than `size`. -->
  <svg x={-(size * (52.98 / 37.27 - 1)) / 2} width={size * (52.98 / 37.27)} height={size} viewBox="0 0 52.98 37.27" fill="none" stroke={ICON_COLORS.terra} stroke-width="2.34" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1.17,36.1h49.9"/>
    <path d="M1.17,36.1L17.39,1.17l16.22,34.93"/>
    <path d="M28.87,25.87l8.48-17.22,13.72,27.45"/>
    <path d="M13.4,9.9l2,2.99,2-2.5,2,2.5,2-2.99"/>
  </svg>
{:else if icon === 'aqua'}
  <!-- Fixed brand color (#127993) regardless of the color prop -->
  <svg width={size} height={size} viewBox="0 0 34.7 45.84" fill="none" stroke={ICON_COLORS.aqua} stroke-width="2.18" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17.35,44.76c8.98,0,16.26-7.28,16.26-16.26,0-4.65-2.32-9.06-6.97-12.77S18.51,6.9,17.35,1.09c-1.16,5.81-4.65,10.92-9.29,14.63S1.09,23.85,1.09,28.5c0,8.98,7.28,16.26,16.26,16.26Z"/>
    <path d="M9.68,33.37c1.02,2.46,2.93,4.45,5.34,5.57"/>
  </svg>
{:else if icon === 'aire'}
  <!-- Fixed brand color (#3a55b8) regardless of the color prop -->
  <svg width={size} height={size} viewBox="0 0 45.92 37.27" fill="none" stroke={ICON_COLORS.aire} stroke-width="2.06" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17.75,2.35c1.7-1.74,4.49-1.76,6.22-.06,1.74,1.7,1.76,4.49.06,6.22-.84.86-2,1.34-3.2,1.32H1.03"/>
    <path d="M35.58,9.17c2.19-2.11,5.67-2.04,7.78.15,2.11,2.19,2.04,5.67-.15,7.78-.99.95-2.3,1.5-3.67,1.54H1.03"/>
    <path d="M24.35,34.92c1.7,1.74,4.49,1.76,6.22.06,1.74-1.7,1.76-4.49.06-6.22-.84-.86-2-1.34-3.2-1.32H1.03"/>
  </svg>
{:else if icon === 'candado'}
  <!-- Fixed brand color (#606060) regardless of the color prop -->
  <svg width={size} height={size} viewBox="0 0 36.79 37.17" fill={ICON_COLORS.candado} fill-rule="evenodd" stroke="none">
    <path d="M5.75,20.31v-7.66C5.75,5.65,11.4,0,18.4,0s12.65,5.65,12.65,12.65v7.66h-5.37v-7.66c0-4.02-3.26-7.28-7.28-7.28s-7.28,3.26-7.28,7.28v7.66h-5.37Z"/>
    <path d="M6.13,13.41h24.53c3.39,0,6.13,2.74,6.13,6.13v11.5c0,3.39-2.74,6.13-6.13,6.13H6.13c-3.39,0-6.13-2.74-6.13-6.13v-11.5c0-3.39,2.74-6.13,6.13-6.13ZM21.08,27.02l1.53,5.94h-8.43l1.53-5.94c-1.8-1.48-2.05-4.14-.57-5.94s4.14-2.05,5.94-.57,2.05,4.14.57,5.94c-.17.21-.36.4-.57.57Z"/>
  </svg>
{:else if icon === 'ia'}
  <!-- Fixed brand color (#000000) regardless of the color prop -->
  <svg width={size} height={size} viewBox="0 0 38.91 38.91" fill="none" stroke={ICON_COLORS.ia} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9.1" y="8.14" width="22.11" height="22.11" rx="4" ry="4"/>
    <path d="M14.03,1v6.85"/>
    <path d="M19.46,1v6.85"/>
    <path d="M24.88,1v6.7"/>
    <path d="M14.03,30.68v7.23"/>
    <path d="M19.46,30.83v7.08"/>
    <path d="M24.88,31.13v6.78"/>
    <path d="M1,14.03h7.6"/>
    <path d="M1,19.46h7.75"/>
    <path d="M1,24.88h7.91"/>
    <path d="M31.58,14.03h6.33"/>
    <path d="M31.58,19.46h6.33"/>
    <path d="M31.58,24.88h6.33"/>
  </svg>
{:else if icon === 'quanta'}
  <!-- Fixed brand color (#000000) regardless of the color prop -->
  <svg width={size} height={size} viewBox="0 0 27.95 40.52" fill="none" stroke={ICON_COLORS.quanta} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M13.97,1c4.46,3.24,7.1,9.33,7.1,16.22v15.2H6.88v-15.2c0-6.89,2.64-12.97,7.1-16.22Z"/>
    <path d="M9.11,9.72h9.73"/>
    <circle cx="13.97" cy="18.23" r="4.26"/>
    <path d="M6.88,23.3c-3.65,2.03-5.88,5.88-5.88,10.14v6.08c2.84-1.22,4.87-3.04,5.88-5.47"/>
    <path d="M21.07,23.3c3.65,2.03,5.88,5.88,5.88,10.14v6.08c-2.84-1.22-4.87-3.04-5.88-5.47"/>
    <path d="M13.97,27.15c-1.82,0-3.04,1.42-3.04,3.45v8.92h6.08v-8.92c0-2.03-1.22-3.45-3.04-3.45h0Z"/>
  </svg>
{/if}
