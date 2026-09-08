import { useState } from 'react';
import { GameState } from '@/lib/types';
import { deleteSave } from '@/lib/storage';

interface SettingsScreenProps {
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;
  onReturnToMenu?: () => void;
}

export default function SettingsScreen({ gameState, setGameState, onReturnToMenu }: SettingsScreenProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteSave = () => {
    deleteSave();
    setGameState(null);
    setShowDeleteConfirm(false);
    if (onReturnToMenu) {
      onReturnToMenu();
    }
  };

  const handleBack = () => {
    if (onReturnToMenu) {
      onReturnToMenu();
    } else if (gameState) {
      // Return to previous screen
      setGameState({
        ...gameState,
        gameScreen: 'start',
      });
    }
  };

  return (
    <div className="screen settings-screen">
      <button className="menu-escape" onClick={handleBack}>
        ← BACK
      </button>

      <div className="screen-header">
        <h2>⚙️ SETTINGS</h2>
      </div>

      <div className="settings-content">
        {/* Sound Settings */}
        <div className="settings-section">
          <h3>Sound</h3>
          <div className="setting-item">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="setting-checkbox"
              />
              <span>Enable Sound Effects</span>
            </label>
            <p className="setting-description">
              (Sound effects coming soon - Flash-era nostalgia bleeps!)
            </p>
          </div>
        </div>

        {/* Save Management */}
        <div className="settings-section">
          <h3>Save Data</h3>
          {!showDeleteConfirm ? (
            <div className="setting-item">
              <button 
                className="menu-btn danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                DELETE SAVE & RESTART
              </button>
              <p className="setting-description">
                Wipe your career and start fresh from the trials.
              </p>
            </div>
          ) : (
            <div className="delete-confirm">
              <p className="warning-text">⚠️ Are you sure? This cannot be undone!</p>
              <div className="confirm-buttons">
                <button 
                  className="menu-btn danger"
                  onClick={handleDeleteSave}
                >
                  YES, DELETE EVERYTHING
                </button>
                <button 
                  className="menu-btn secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Credits */}
        <div className="settings-section credits-section">
          <h3>Credits</h3>
          <div className="credits-text">
            <p><strong>90+1</strong></p>
            <p>A spiritual successor to Jumpers for Goalposts</p>
            <p className="credit-line">Inspired by the Flash classics from Beautiful Games</p>
            <p className="credit-line">Built with Next.js, TypeScript, and nostalgia</p>
            <p className="version">Version 1.5 - Activity Deck Edition</p>
          </div>
        </div>

        {/* Controls Guide */}
        <div className="settings-section">
          <h3>Controls</h3>
          <div className="controls-guide">
            <p><strong>During Minigames:</strong></p>
            <p>SPACE - Shoot / Confirm action</p>
            <p>Power bar fills automatically - time it right!</p>
            <p className="tip">💡 Green zone = perfect shot</p>
          </div>
        </div>
      </div>
    </div>
  );
}
