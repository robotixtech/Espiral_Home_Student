import type { ProgramUnit } from './types';

let currentView = $state<'home' | 'unit-detail'>('home');
let selectedUnit = $state<ProgramUnit | null>(null);

export function getView() { return currentView; }
export function getSelectedUnit() { return selectedUnit; }

export function navigateToUnit(unit: ProgramUnit) {
  selectedUnit = unit;
  currentView = 'unit-detail';
}

export function navigateHome() {
  currentView = 'home';
  selectedUnit = null;
}
