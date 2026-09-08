'use client';

import { useState, useEffect } from 'react';
import { GameState } from '@/lib/types';
import { createNewPlayer, createInitialWeek, generateTeammates } from '@/lib/gameEngine';
import { CLUBS } from '@/lib/gameData';
import { saveGame, loadGame, hasSavedGame, deleteSave, validateSave } from '@/lib/storage';

import StartScreen from './screens/StartScreen';
import CreatePlayerScreen from './screens/CreatePlayerScreen';
import WeeklyBriefingScreen from './screens/WeeklyBriefingScreen';
import DayPlannerScreen from './screens/DayPlannerScreen';
import MatchScreen from './screens/MatchScreen';
import MinigameScreen from './screens/MinigameScreen';
import PostMatchScreen from './screens/PostMatchScreen';
import TransferDecisionScreen from './screens/TransferDecisionScreen';

export default function GameContainer() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    // NEVER auto-load on boot - always show title screen
    // User must explicitly click Continue
    const checkSave = hasSavedGame();
    setHasSave(checkSave);
    setInitialized(true);
  }, []);

  useEffect(() => {
    // Auto-save whenever game state changes
    if (gameState && initialized && gameState.gameScreen !== 'start') {
      saveGame(gameState);
    }
  }, [gameState, initialized]);

  const startNewGame = () => {
    // Clear any old saves before starting fresh
    deleteSave();
    setGameState({
      player: createNewPlayer('', 'right'),
      clubs: CLUBS,
      currentWeek: createInitialWeek('heath-united', 1),
      partner: null,
      teammates: generateTeammates(5),
      agent: { satisfaction: 50 },
      transferOffers: [],
      matchState: null,
      minigameState: null,
      gameScreen: 'create-player',
    });
    setHasSave(false);
  };

  const continueGame = () => {
    const loaded = loadGame();
    if (loaded && validateSave(loaded)) {
      setGameState(loaded);
    } else {
      // Save is corrupted - show error and stay on title
      alert('Save data is corrupted. Please start a new game.');
      deleteSave();
      setHasSave(false);
    }
  };

  const handleDeleteSave = () => {
    if (confirm('Delete your saved game? This cannot be undone.')) {
      deleteSave();
      setHasSave(false);
      setGameState(null);
    }
  };

  const handleReturnToMenu = () => {
    setGameState(null);
  };

  if (!initialized) {
    return (
      <div className="game-container loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!gameState) {
    return (
      <StartScreen
        hasSave={hasSave}
        onNewGame={startNewGame}
        onContinue={continueGame}
        onDeleteSave={handleDeleteSave}
      />
    );
  }

  const renderScreen = () => {
    // Add onReturnToMenu prop to all screens for global escape
    const screenProps = {
      gameState,
      setGameState,
      onReturnToMenu: handleReturnToMenu,
    };

    switch (gameState.gameScreen) {
      case 'start':
        return <StartScreen hasSave={hasSave} onNewGame={startNewGame} onContinue={continueGame} onDeleteSave={handleDeleteSave} />;
      case 'create-player':
        return <CreatePlayerScreen {...screenProps} />;
      case 'weekly-briefing':
        return <WeeklyBriefingScreen {...screenProps} />;
      case 'day-planner':
        return <DayPlannerScreen {...screenProps} />;
      case 'match':
        return <MatchScreen {...screenProps} />;
      case 'minigame':
        return <MinigameScreen {...screenProps} />;
      case 'post-match':
        return <PostMatchScreen {...screenProps} />;
      case 'transfer-decision':
        return <TransferDecisionScreen {...screenProps} />;
      default:
        return <StartScreen hasSave={hasSave} onNewGame={startNewGame} onContinue={continueGame} onDeleteSave={handleDeleteSave} />;
    }
  };

  return <div className="game-container">{renderScreen()}</div>;
}
