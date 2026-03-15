<script lang="ts">
  import type { ProgramData } from '../lib/types';
  import { isEmulatorActive, toggleEmulator } from '../lib/emulator.svelte';
  import { getTheme } from '../lib/theme.svelte';

  interface Props {
    program: ProgramData;
  }

  let { program }: Props = $props();

  const theme = $derived(getTheme());
  const on = $derived(isEmulatorActive());

  function handleToggle() {
    toggleEmulator(program);
  }
</script>

<button
  class="emu-toggle"
  class:on
  onclick={handleToggle}
  title={on ? 'Desactivar emulador' : 'Activar emulador'}
  style:--emu-text={theme.text.secondary}
  style:--emu-bg={on ? 'rgba(59,130,246,0.2)' : 'rgba(128,128,128,0.12)'}
  style:--emu-border={on ? 'rgba(96,165,250,0.5)' : 'rgba(128,128,128,0.2)'}
  style:--emu-knob={on ? '#3b82f6' : '#6b7280'}
  style:--emu-track={on ? 'rgba(59,130,246,0.3)' : 'rgba(128,128,128,0.2)'}
>
  <span class="emu-label">EMU</span>
  <span class="emu-track">
    <span class="emu-knob"></span>
  </span>
</button>

<style>
  .emu-toggle {
    position: fixed;
    bottom: 12px;
    right: 12px;
    z-index: 200;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px 4px 8px;
    border: 1px solid var(--emu-border);
    border-radius: 14px;
    background: var(--emu-bg);
    cursor: pointer;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: background 0.2s, border-color 0.2s;
    outline: none;
  }

  .emu-toggle:hover {
    background: rgba(128,128,128,0.2);
  }

  .emu-label {
    font: 600 10px/1 'Rubik', system-ui, sans-serif;
    letter-spacing: 0.5px;
    color: var(--emu-text);
    user-select: none;
  }

  .emu-track {
    position: relative;
    width: 28px;
    height: 14px;
    border-radius: 7px;
    background: var(--emu-track);
    transition: background 0.2s;
  }

  .emu-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--emu-knob);
    transition: transform 0.2s, background 0.2s;
  }

  .on .emu-knob {
    transform: translateX(14px);
  }
</style>
