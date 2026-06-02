<script lang="ts">
  import type { ProgramUnit, Activity } from '../lib/types';
  import { getTheme } from '../lib/theme.svelte';
  import UnitIcon from './UnitIcon.svelte';

  interface Props {
    unit: ProgramUnit;
    activities: Activity[];
    onClose: () => void;
    onActivitySelected: (activity: Activity) => void;
  }

  let { unit, activities, onClose, onActivitySelected }: Props = $props();
  const t = $derived(getTheme());

  function handleRow(act: Activity) {
    if (act.status === 'locked') return;
    onActivitySelected(act);
  }

  // Status colours & labels – friendly for kids
  function statusColor(s: Activity['status']) {
    if (s === 'completed')   return '#22c55e';
    if (s === 'in-progress') return '#3b82f6';
    return '#475569';
  }
</script>

<!-- Backdrop — tapping it closes the panel -->
<button class="backdrop" onclick={onClose} aria-label="Cerrar panel"></button>

<aside class="panel">

  <!-- ── Header ── -->
  <div class="panel-header">
    <div class="unit-icon-wrap">
      <svg width="28" height="28" viewBox="0 0 24 24" overflow="visible">
        <UnitIcon icon={unit.icon} size={28} color="#ffffff" />
      </svg>
    </div>
    <div class="unit-name">{unit.label}</div>
    <button class="close-btn" onclick={onClose} aria-label="Cerrar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>

  <!-- ── Activity list ── -->
  <ul class="activity-list">
    {#each activities as act (act.id)}
      {@const sc = statusColor(act.status)}
      <li>
        <button
          class="activity-row"
          class:is-locked={act.status === 'locked'}
          class:is-clickable={act.status !== 'locked'}
          onclick={() => handleRow(act)}
          disabled={act.status === 'locked'}
          style:--sc={sc}
        >
          <!-- Status dot -->
          <span class="status-dot" style:background={sc}></span>

          <!-- Text -->
          <div class="act-text">
            <span class="act-label">{act.label}</span>
          </div>

          <!-- Arrow for clickable rows -->
          {#if act.status !== 'locked'}
            <svg class="row-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
</aside>

<style>
  /* ── Backdrop ── */
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.35);
    border: none;
    cursor: default;
    z-index: 40;
  }

  /* ── Panel shell ── */
  .panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 310px;
    z-index: 50;
    display: flex;
    flex-direction: column;
    background: rgba(4, 10, 30, 0.97);
    border-left: 2px solid rgba(100, 160, 255, 0.25);
    box-shadow: -8px 0 40px rgba(0,0,80,0.6);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    animation: slideIn 0.35s cubic-bezier(0.34, 1.4, 0.64, 1) both;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0.4; }
    to   { transform: translateX(0);   opacity: 1; }
  }

  /* ── Header ── */
  .panel-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 16px 16px;
    border-bottom: 1px solid rgba(100,160,255,0.15);
    flex-shrink: 0;
  }

  .unit-icon-wrap {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #1e3a8a, #6d28d9);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 14px rgba(109,40,217,0.5);
  }

  .unit-name {
    flex: 1;
    font: 700 17px/1.25 'Rubik', system-ui, sans-serif;
    color: #f1f5f9;
    letter-spacing: 0.1px;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.07);
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;
  }
  .close-btn:hover {
    background: rgba(255,255,255,0.14);
    color: #f1f5f9;
  }

  /* ── Activity list ── */
  .activity-list {
    list-style: none;
    overflow-y: auto;
    flex: 1;
    padding: 10px 0 20px;
    scrollbar-width: thin;
    scrollbar-color: rgba(100,160,255,0.3) transparent;
  }

  /* ── Activity row ── */
  .activity-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: none;
    border: none;
    text-align: left;
    cursor: default;
    transition: background 0.15s;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .activity-row.is-clickable {
    cursor: pointer;
  }
  .activity-row.is-clickable:hover {
    background: rgba(100,160,255,0.08);
  }
  .activity-row.is-locked {
    opacity: 0.45;
  }

  /* Status dot */
  .status-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 0 10px color-mix(in srgb, var(--sc) 50%, transparent);
  }

  /* Text block */
  .act-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }

  .act-label {
    font: 600 15px/1.2 'Rubik', system-ui, sans-serif;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Arrow */
  .row-arrow {
    color: #475569;
    flex-shrink: 0;
    transition: color 0.15s, transform 0.15s;
  }
  .activity-row.is-clickable:hover .row-arrow {
    color: #94a3b8;
    transform: translateX(2px);
  }
</style>
