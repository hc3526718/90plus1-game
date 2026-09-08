'use client';

import { useState, useEffect } from 'react';
import { GameState } from '@/lib/types';
import { createNewPlayer, createInitialWeek, generateTeammates, createStarterAgent } from '@/lib/gameEngine';
import { CLUBS } from '@/lib/gameData';
import { saveGame, loadGame, hasSavedGame, deleteSave, validateSave } from '@/lib/storage';

import StartScreen from './screens/StartScreen';
import SettingsScreen from './screens/SettingsScreen';
import CreatePlayerScreen from './screens/CreatePlayerScreen';
import SkillTrialsScreen from './screens/SkillTrialsScreen';
import ContractOffersScreen from './screens/ContractOffersScreen';
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
      currentWeek: createInitialWeek('heath-united', 1), // Placeholder, will be recreated after contract
      partner: null,
      teammates: generateTeammates(5),
      agent: createStarterAgent(),
      transferOffers: [],
      matchState: null,
      minigameState: null,
      trialResults: [],
      trialsCompleted: false,
      gameScreen: 'create-player', // First: create player, then: skill-trials, then: contract-offers
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

  const handleSettings = () => {
    if (gameState) {
      setGameState({
        ...gameState,
        gameScreen: 'settings',
      });
    } else {
      // Create a minimal state just for settings
      setGameState({
        player: createNewPlayer('', 'right'),
        clubs: CLUBS,
        currentWeek: createInitialWeek('heath-united', 1),
        partner: null,
        teammates: [],
        agent: createStarterAgent(),
        transferOffers: [],
        matchState: null,
        minigameState: null,
        trialResults: [],
        trialsCompleted: false,
        gameScreen: 'settings',
      });
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
        onDeleteSave={handleDeleteSave}
        onSettings={handleSettings}
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
      case 'settings':
        return <SettingsScreen gameState={gameState} setGameState={setGameState} onReturnToMenu={handleReturnToMenu} />;
      case 'create-player':
        return <CreatePlayerScreen {...screenProps} />;
      case 'skill-trials':
        return <SkillTrialsScreen {...screenProps} />;
      case 'contract-offers':
        return <ContractOffersScreen {...screenProps} />;
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
        return <StartScreen hasSave={hasSave} onNewGame={startNewGame} onContinue={continueGame} onDeleteSave={handleDeleteSave} onSettings={handleSettings} />;
    }
  };

  return <div className="game-container">{renderScreen()}</div>;
}
