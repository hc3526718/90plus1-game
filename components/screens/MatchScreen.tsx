import { useState, useEffect } from 'react';
import { GameState, MatchEvent } from '@/lib/types';

interface MatchScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

export default function MatchScreen({ gameState, setGameState }: MatchScreenProps) {
  const [displayedEvents, setDisplayedEvents] = useState<MatchEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const matchState = gameState.matchState!;

  useEffect(() => {
    if (!isPlaying || currentEventIndex >= matchState.events.length) {
      setIsPlaying(false);
      return;
    }

    const nextEvent = matchState.events[currentEventIndex];
    
    // Check if this is a player chance - pause for minigame
    if (nextEvent.playerInvolved && nextEvent.type === 'chance') {
      setIsPlaying(false);
      
      // Create minigame
      const difficulty = nextEvent.minute >= 90 ? 0.8 : 0.5; // Tighter in injury time
      const minigameType = Math.random() > 0.7 ? 'penalty' : 'shot';
      
      setGameState({
        ...gameState,
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
        {displayedEvents.map((event, index) => (
          <div 
            key={index} 
            className={`commentary-line ${event.type} ${event.playerInvolved ? 'player-involved' : ''}`}
          >
            <span className="minute">{event.minute}'</span>
            <span className="description">{event.description}</span>
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
