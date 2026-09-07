// Local storage utilities for save/load

import { GameState } from './types';

const STORAGE_KEY = '90plus1-save';

export function saveGame(state: GameState): void {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save game:', error);
  }
}

export function loadGame(): GameState | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized) as GameState;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export function deleteSave(): void {
  localStorage.removeItem(STORAGE_KEY);
}
