// Local storage utilities for save/load

import { GameState } from './types';

// Version 3: Post-match fix + JfG rebuild
// v3 prevents loading broken v1/v2 saves that could soft-lock
const STORAGE_KEY = 'ninetyplus1-save-v3';
const LEGACY_KEYS = ['90plus1-save', 'ninetyplus1-save-v2'];

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
    // Also clean up legacy saves
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Failed to delete save:', error);
  }
}

export function hasAnySave(): boolean {
  if (!isBrowser) return false;
  
  try {
    // Check current version
    if (localStorage.getItem(STORAGE_KEY) !== null) return true;
    // Check legacy versions
    return LEGACY_KEYS.some(key => localStorage.getItem(key) !== null);
  } catch (error) {
    return false;
  }
}

// Validate save is not corrupted
export function validateSave(state: GameState): boolean {
  try {
    // Check required fields exist
    if (!state.player || !state.clubs || !state.currentWeek) return false;
    if (!state.player.name || !state.player.attributes) return false;
    
    // Check gameScreen is valid
    const validScreens = ['start', 'settings', 'create-player', 'skill-trials', 'contract-offers', 'weekly-briefing', 'day-planner', 'match', 'minigame', 'post-match', 'transfer-decision', 'lifestyle-shop'];
    if (!validScreens.includes(state.gameScreen)) return false;
    
    // If in post-match, ensure matchState exists
    if (state.gameScreen === 'post-match' && !state.matchState) return false;
    
    return true;
  } catch {
    return false;
  }
}
