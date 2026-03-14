/** Centralized theme system — dark (space) and light (sky) modes */

export type ThemeMode = 'dark' | 'light';

export interface UnitStatusColors {
  g1: string; g2: string;
  ring: string; glow: string; icon: string;
  lBg: string; lBorder: string; lText: string;
}

export interface ThemeColors {
  mode: ThemeMode;
  // Canvas
  bg: { center: string; mid: string; edge: string };
  body: string;
  text: { primary: string; secondary: string };
  // Cosmic
  star: string;
  nebula: { c1: string; o1: string; c2: string; o2: string };
  moon: { light: string; mid: string; dark: string };
  // Spiral
  orbit: string;
  spiral: string;
  progress: { stroke: string; glow: string; glowOpacity: string };
  // Sun
  sun: {
    g1: string; g2: string; g3: string; g4: string;
    glow: string; glowOpacity: string;
    pulse: string; icon: string; label: string;
    highlight: string;
  };
  // Unit nodes
  unit: {
    completed: UnitStatusColors;
    inProgress: UnitStatusColors;
    locked: UnitStatusColors;
    finalProject: UnitStatusColors;
  };
  // Badge (completed check)
  badge: { fill: string; stroke: string };
  progressRingBg: string;
  // UI chrome
  title: { main: string; sub: string; line: string; glow: string };
  legend: { completed: string; active: string; locked: string; text: string };
  wrapperShadow: string;
  // Toggle button
  toggleBg: string;
  toggleIcon: string;
}

const DARK: ThemeColors = {
  mode: 'dark',
  bg: { center: '#151a2e', mid: '#0d1020', edge: '#080a14' },
  body: '#0b0e1a',
  text: { primary: '#e2e8f0', secondary: '#94a3b8' },
  star: '#c8d6e5',
  nebula: { c1: '#94a3b8', o1: '0.06', c2: '#cbd5e1', o2: '0.04' },
  moon: { light: '#d1d5db', mid: '#9ca3af', dark: '#4b5563' },
  orbit: 'rgba(148,163,184,0.07)',
  spiral: 'rgba(148,163,184,0.13)',
  progress: { stroke: '#7c6cf7', glow: '#7c6cf7', glowOpacity: '0.45' },
  sun: {
    g1: '#fef3c7', g2: '#fbbf24', g3: '#f59e0b', g4: '#d97706',
    glow: '#f59e0b', glowOpacity: '0.3',
    pulse: '#fbbf24', icon: '#78350f', label: '#fef3c7',
    highlight: 'rgba(254,243,199,0.3)',
  },
  unit: {
    completed: {
      g1: '#34d399', g2: '#059669', ring: '#34d399', glow: '#10b981',
      icon: '#fff', lBg: 'rgba(16,185,129,0.25)', lBorder: 'rgba(52,211,153,0.4)', lText: '#a7f3d0',
    },
    inProgress: {
      g1: '#60a5fa', g2: '#2563eb', ring: '#60a5fa', glow: '#3b82f6',
      icon: '#fff', lBg: 'rgba(59,130,246,0.3)', lBorder: 'rgba(96,165,250,0.5)', lText: '#bfdbfe',
    },
    locked: {
      g1: '#374151', g2: '#1f2937', ring: '#4b5563', glow: 'transparent',
      icon: '#6b7280', lBg: 'rgba(75,85,99,0.2)', lBorder: 'rgba(75,85,99,0.3)', lText: '#6b7280',
    },
    finalProject: {
      g1: '#a855f7', g2: '#7c3aed', ring: '#c084fc', glow: '#a855f7',
      icon: '#fff', lBg: 'rgba(168,85,247,0.3)', lBorder: 'rgba(168,85,247,0.5)', lText: '#e9d5ff',
    },
  },
  badge: { fill: '#059669', stroke: '#0d1020' },
  progressRingBg: 'rgba(255,255,255,0.12)',
  title: { main: '#f1f5f9', sub: '#64748b', line: 'rgba(148,163,184,0.2)', glow: 'rgba(124,108,247,0.4)' },
  legend: { completed: '#34d399', active: '#60a5fa', locked: '#4b5563', text: '#94a3b8' },
  wrapperShadow: '0 0 80px rgba(108,92,231,0.1), 0 0 160px rgba(59,130,246,0.05), inset 0 0 80px rgba(0,0,0,0.3)',
  toggleBg: 'rgba(148,163,184,0.15)',
  toggleIcon: '#f1f5f9',
};

const LIGHT: ThemeColors = {
  mode: 'light',
  bg: { center: '#f0f4ff', mid: '#e4e9f4', edge: '#d4dbe8' },
  body: '#eef2f9',
  text: { primary: '#1e293b', secondary: '#475569' },
  star: '#94a3b8',
  nebula: { c1: '#a5b4c8', o1: '0.08', c2: '#b0bdd0', o2: '0.06' },
  moon: { light: '#e2e8f0', mid: '#cbd5e1', dark: '#94a3b8' },
  orbit: 'rgba(71,85,105,0.08)',
  spiral: 'rgba(71,85,105,0.12)',
  progress: { stroke: '#6d5edb', glow: '#6d5edb', glowOpacity: '0.3' },
  sun: {
    g1: '#fef9c3', g2: '#fbbf24', g3: '#f59e0b', g4: '#d97706',
    glow: '#f59e0b', glowOpacity: '0.2',
    pulse: '#fbbf24', icon: '#92400e', label: '#92400e',
    highlight: 'rgba(254,243,199,0.4)',
  },
  unit: {
    completed: {
      g1: '#34d399', g2: '#059669', ring: '#059669', glow: '#10b981',
      icon: '#fff', lBg: 'rgba(16,185,129,0.12)', lBorder: 'rgba(5,150,105,0.3)', lText: '#065f46',
    },
    inProgress: {
      g1: '#60a5fa', g2: '#2563eb', ring: '#2563eb', glow: '#3b82f6',
      icon: '#fff', lBg: 'rgba(37,99,235,0.1)', lBorder: 'rgba(37,99,235,0.3)', lText: '#1e40af',
    },
    locked: {
      g1: '#cbd5e1', g2: '#94a3b8', ring: '#94a3b8', glow: 'transparent',
      icon: '#64748b', lBg: 'rgba(100,116,139,0.1)', lBorder: 'rgba(100,116,139,0.2)', lText: '#64748b',
    },
    finalProject: {
      g1: '#c084fc', g2: '#9333ea', ring: '#9333ea', glow: '#a855f7',
      icon: '#fff', lBg: 'rgba(147,51,234,0.1)', lBorder: 'rgba(147,51,234,0.3)', lText: '#6b21a8',
    },
  },
  badge: { fill: '#059669', stroke: '#ffffff' },
  progressRingBg: 'rgba(0,0,0,0.08)',
  title: { main: '#1e293b', sub: '#64748b', line: 'rgba(71,85,105,0.2)', glow: 'rgba(109,94,219,0.2)' },
  legend: { completed: '#059669', active: '#2563eb', locked: '#94a3b8', text: '#475569' },
  wrapperShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
  toggleBg: 'rgba(71,85,105,0.1)',
  toggleIcon: '#334155',
};

// --- Reactive state ---

function getInitialMode(): ThemeMode {
  try {
    const stored = localStorage.getItem('spiral-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch { /* iframe/cross-origin — ignore */ }
  return 'dark';
}

let mode = $state<ThemeMode>(getInitialMode());

/** Get the current theme colors. Must be called in a reactive context ($derived, $effect, template). */
export function getTheme(): ThemeColors {
  return mode === 'dark' ? DARK : LIGHT;
}

export function toggleTheme(): void {
  mode = mode === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('spiral-theme', mode); } catch { /* ignore */ }
}
