// Local storage utilities for save/load

import { GameState } from './types';

const STORAGE_KEY = '90plus1-save';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

export function saveGame(state: GameState): void {
  if (!isBrowser) return;
  
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save game:', error);
  }
}

export function loadGame(): GameState | null {
  if (!isBrowser) return null;
  
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
  if (!isBrowser) return false;
  
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    return false;
  }
}

export function deleteSave(): void {
  if (!isBrowser) return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to delete save:', error);
  }
}
