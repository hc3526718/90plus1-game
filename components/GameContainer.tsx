'use client';

import { useState, useEffect } from 'react';
import { GameState } from '@/lib/types';
import { createNewPlayer, createInitialWeek, generateTeammates } from '@/lib/gameEngine';
import { CLUBS } from '@/lib/gameData';
import { saveGame, loadGame, hasSavedGame } from '@/lib/storage';

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
    // Check for saved game on mount (client-side only)
    const checkSave = hasSavedGame();
    setHasSave(checkSave);
    
    if (checkSave) {
      const loaded = loadGame();
      if (loaded) {
        setGameState(loaded);
      }
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    // Auto-save whenever game state changes
    if (gameState && initialized) {
      saveGame(gameState);
    }
  }, [gameState, initialized]);

  const startNewGame = () => {
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
  };

  const continueGame = () => {
    const loaded = loadGame();
    if (loaded) {
      setGameState(loaded);
    }
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
      />
    );
  }

  const renderScreen = () => {
    switch (gameState.gameScreen) {
      case 'create-player':
        return <CreatePlayerScreen gameState={gameState} setGameState={setGameState} />;
      case 'weekly-briefing':
        return <WeeklyBriefingScreen gameState={gameState} setGameState={setGameState} />;
      case 'day-planner':
        return <DayPlannerScreen gameState={gameState} setGameState={setGameState} />;
      case 'match':
        return <MatchScreen gameState={gameState} setGameState={setGameState} />;
      case 'minigame':
        return <MinigameScreen gameState={gameState} setGameState={setGameState} />;
      case 'post-match':
        return <PostMatchScreen gameState={gameState} setGameState={setGameState} />;
      case 'transfer-decision':
        return <TransferDecisionScreen gameState={gameState} setGameState={setGameState} />;
      default:
        return <StartScreen hasSave={false} onNewGame={startNewGame} onContinue={() => {}} />;
    }
  };

  return <div className="game-container">{renderScreen()}</div>;
}
