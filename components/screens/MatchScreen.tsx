import { useState, useEffect } from 'react';
import { GameState, MatchEvent } from '@/lib/types';

interface MatchScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onReturnToMenu?: () => void;
}

export default function MatchScreen({ gameState, setGameState, onReturnToMenu }: MatchScreenProps) {
  const matchState = gameState.matchState!;
  
  // Defensive: ensure displayedUpTo is within bounds
  const safeDisplayedUpTo = Math.min(
    Math.max(0, matchState.displayedUpTo),
    matchState.events.length
  );
  
  const [displayedEvents, setDisplayedEvents] = useState<MatchEvent[]>(
    () => matchState.events.slice(0, safeDisplayedUpTo).filter(e => e !== undefined && e !== null)
  );
  const [currentEventIndex, setCurrentEventIndex] = useState(safeDisplayedUpTo);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    // Defensive: check bounds and ensure we have events
    if (!isPlaying || !matchState.events || currentEventIndex >= matchState.events.length) {
      setIsPlaying(false);
      return;
    }

    const nextEvent = matchState.events[currentEventIndex];
    
    // Defensive: ensure nextEvent exists before accessing properties
    if (!nextEvent) {
      console.warn(`Match event at index ${currentEventIndex} is undefined, skipping`);
      setCurrentEventIndex(prev => prev + 1);
      return;
    }
    
    // Check if this is a player chance - pause for minigame
    if (nextEvent.playerInvolved && nextEvent.type === 'chance') {
      setIsPlaying(false);
      
      // Update displayedUpTo to mark we've shown events up to this point
      const updatedMatchState = {
        ...matchState,
        displayedUpTo: currentEventIndex,
      };
      
      // Create minigame
      const difficulty = nextEvent.minute >= 90 ? 0.8 : 0.5; // Tighter in injury time
      const minigameType = Math.random() > 0.7 ? 'penalty' : 'shot';
      
      setGameState({
        ...gameState,
        matchState: updatedMatchState,
        minigameState: {
          type: minigameType,
          startTime: Date.now(),
          difficulty,
          completed: false,
          success: false,
        },
        gameScreen: 'minigame',
      });
      return;
    }

    // Display event and continue
    const timer = setTimeout(() => {
      setDisplayedEvents(prev => [...prev, nextEvent]);
      setCurrentEventIndex(prev => prev + 1);
    }, 800); // Speed up commentary

    return () => clearTimeout(timer);
  }, [currentEventIndex, isPlaying, matchState.events, gameState, setGameState]);

  const handleFinishMatch = () => {
    setGameState({
      ...gameState,
      gameScreen: 'post-match',
    });
  };

  const allEventsDisplayed = currentEventIndex >= matchState.events.length;

  return (
    <div className="screen match-screen">
      {onReturnToMenu && (
        <button className="menu-escape" onClick={onReturnToMenu}>
          ← MENU
        </button>
      )}
      <div className="match-header">
        <div className="team-score">
          <span className="team-name">{matchState.homeTeam}</span>
          <span className="score">{matchState.homeScore}</span>
        </div>
        <div className="vs-separator">-</div>
        <div className="team-score">
          <span className="score">{matchState.awayScore}</span>
          <span className="team-name">{matchState.awayTeam}</span>
        </div>
      </div>

      <div className="match-stats">
        <div className="player-match-stat">
          <span>Your Rating:</span>
          <span className="rating-value">{matchState.playerRating.toFixed(1)}</span>
        </div>
        <div className="player-match-stat">
          <span>Goals:</span>
          <span className="goals-value">{matchState.playerGoals}</span>
        </div>
        <div className="player-match-stat">
          <span>Assists:</span>
          <span className="assists-value">{matchState.playerAssists}</span>
        </div>
      </div>

      <div className="commentary-feed">
        {displayedEvents
          .filter(event => event !== undefined && event !== null)
          .map((event, index) => (
            <div 
              key={index} 
              className={`commentary-line ${event.type || 'commentary'} ${event.playerInvolved ? 'player-involved' : ''}`}
            >
              <span className="minute">{event.minute || 0}'</span>
              <span className="description">{event.description || 'Event'}</span>
            </div>
          ))}
      </div>

      {allEventsDisplayed && (
        <button className="menu-btn primary" onClick={handleFinishMatch}>
          FULL TIME
        </button>
      )}
    </div>
  );
}
