import { useState } from 'react';
import { GameState, PreferredFoot } from '@/lib/types';
import { createNewPlayer, createInitialWeek } from '@/lib/gameEngine';

interface CreatePlayerScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onReturnToMenu?: () => void;
}

export default function CreatePlayerScreen({ gameState, setGameState, onReturnToMenu }: CreatePlayerScreenProps) {
  const [name, setName] = useState('');
  const [foot, setFoot] = useState<PreferredFoot>('right');

  const handleCreate = () => {
    if (!name.trim()) return;
    
    const player = createNewPlayer(name.trim(), foot);
    
    setGameState({
      ...gameState,
      player,
      gameScreen: 'skill-trials', // JfG flow: name → trials → contracts → career
    });
  };

  return (
    <div className="screen create-player-screen">
      {onReturnToMenu && (
        <button className="menu-escape" onClick={onReturnToMenu}>
          ← MENU
        </button>
      )}
      <div className="screen-header">
        <h2>CREATE YOUR PLAYER</h2>
      </div>
      
      <div className="form-container">
        <div className="form-group">
          <label htmlFor="player-name">PLAYER NAME</label>
          <input
            id="player-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            maxLength={30}
            className="text-input"
          />
        </div>
        
        <div className="form-group">
          <label>PREFERRED FOOT</label>
          <div className="button-group">
            <button
              className={`choice-btn ${foot === 'left' ? 'active' : ''}`}
              onClick={() => setFoot('left')}
            >
              LEFT
            </button>
            <button
              className={`choice-btn ${foot === 'right' ? 'active' : ''}`}
              onClick={() => setFoot('right')}
            >
              RIGHT
            </button>
            <button
              className={`choice-btn ${foot === 'both' ? 'active' : ''}`}
              onClick={() => setFoot('both')}
            >
              BOTH
            </button>
          </div>
        </div>
        
        <div className="starting-attributes">
          <h3>STARTING ATTRIBUTES</h3>
          <div className="attribute-list">
            <div className="attribute-item">
              <span>Finishing</span>
              <span className="attr-value">8/20</span>
            </div>
            <div className="attribute-item">
              <span>Composure</span>
              <span className="attr-value">7/20</span>
            </div>
            <div className="attribute-item">
              <span>Pace</span>
              <span className="attr-value">10/20</span>
            </div>
            <div className="attribute-item">
              <span>Stamina</span>
              <span className="attr-value">12/20</span>
            </div>
            <div className="attribute-item">
              <span>Awareness</span>
              <span className="attr-value">6/20</span>
            </div>
          </div>
        </div>
        
        <button 
          className="menu-btn primary" 
          onClick={handleCreate}
          disabled={!name.trim()}
        >
          START CAREER
        </button>
      </div>
    </div>
  );
}
