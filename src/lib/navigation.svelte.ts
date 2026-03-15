import type { ProgramUnit, Activity } from './types';

let currentView = $state<'home' | 'unit-detail' | 'activity-slide'>('home');
let selectedUnit = $state<ProgramUnit | null>(null);
let selectedActivity = $state<Activity | null>(null);

export function getView() { return currentView; }
export function getSelectedUnit() { return selectedUnit; }
export function getSelectedActivity() { return selectedActivity; }

export function navigateToUnit(unit: ProgramUnit) {
  selectedUnit = unit;
  selectedActivity = null;
  currentView = 'unit-detail';
}

export function navigateToActivity(activity: Activity) {
  selectedActivity = activity;
  currentView = 'activity-slide';
}

export function navigateBackToUnit() {
  selectedActivity = null;
  currentView = 'unit-detail';
}

export function navigateHome() {
  currentView = 'home';
  selectedUnit = null;
  selectedActivity = null;
}
