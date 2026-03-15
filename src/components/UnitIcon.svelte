<script lang="ts">
  import type { UnitIcon } from '../lib/types';

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
    <path d="M7 3h10v8c0 2.8-2.2 5-5 5s-5-2.2-5-5V3z" opacity="0.9"/>
    <!-- Left handle -->
    <path d="M7 5H5.5C4.1 5 3 6.3 3 8s1.1 3 2.5 3H7" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round"/>
    <!-- Right handle -->
    <path d="M17 5h1.5C19.9 5 21 6.3 21 8s-1.1 3-2.5 3H17" fill="none" stroke={color} stroke-width="1.8" stroke-linecap="round"/>
    <!-- Stem -->
    <path d="M10 16h4v2H10z" opacity="0.8"/>
    <!-- Base -->
    <rect x="8" y="18" width="8" height="2.5" rx="1" opacity="0.7"/>
    <!-- Star -->
    <path d="M12 6l1.1 2.2 2.4.3-1.7 1.7.4 2.4L12 11.4l-2.2 1.2.4-2.4-1.7-1.7 2.4-.3z" fill="rgba(255,255,255,0.85)" stroke="none"/>
    <!-- Sparkles -->
    <circle cx="15.5" cy="5.5" r="0.7" fill="rgba(255,255,255,0.7)"/>
    <circle cx="16.5" cy="7.5" r="0.5" fill="rgba(255,255,255,0.5)"/>
  </svg>
{/if}
