import { useState, useEffect } from 'react';
import { GameState, ActivityOption } from '@/lib/types';
import { applyActivity, simulateMatch, checkTransferOffers } from '@/lib/gameEngine';
import { generateDayActivities, getRestActivity } from '@/lib/activityDeck';

interface DayPlannerScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onReturnToMenu?: () => void;
}

export default function DayPlannerScreen({ gameState, setGameState, onReturnToMenu }: DayPlannerScreenProps) {
  const [currentDay, setCurrentDay] = useState(0);
  const [activityMessage, setActivityMessage] = useState('');
  const [specialEvent, setSpecialEvent] = useState<ActivityOption | null>(null);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [dayCompleted, setDayCompleted] = useState(false);

  const { player, currentWeek, partner, teammates } = gameState;
  const isMatchDay = currentDay === currentWeek.matchDay;
  const currentDayPlan = currentWeek.days[currentDay];
  
  // Check for special event on day start (RARE - 15% chance)
  useEffect(() => {
    if (!isMatchDay && !currentDayPlan.completed && !dayCompleted) {
      const shouldShowEvent = Math.random() < 0.15; // RARE: 15% chance
      
      if (shouldShowEvent) {
        // Generate ONE special event
        const events = generateDayActivities(
          player,
          partner,
          teammates,
          currentWeek.seasonPhase,
          currentWeek.weekNumber
        );
        
        if (events.length > 0) {
          const event = events[0]; // Just take the first one
          setSpecialEvent(event);
          setShowEventPopup(true);
        } else {
          // No valid events, default to training
          autoTrain();
        }
      } else {
        // No event - DEFAULT to training
        autoTrain();
      }
    }
  }, [currentDay]);

  // AUTO-TRAIN (default/inferred training)
  const autoTrain = () => {
    if (currentDayPlan.completed || dayCompleted) return;

    const trainingActivity: ActivityOption = {
      id: 'auto-train',
      category: 'training',
      title: 'Training Session',
      description: 'Standard training day',
      energyCost: 20,
      unlocked: true,
      effects: {
        energy: -20,
        form: 5,
        trust: 2,
      },
    };

    const result = applyActivity(player, trainingActivity, partner);
    
    const updatedPlayer = { ...result.player };
    
    const newWeek = { ...currentWeek };
    newWeek.days[currentDay] = { 
      ...currentDayPlan,
      selectedActivity: trainingActivity,
      completed: true,
      trainingCount: currentDayPlan.trainingCount + 1,
    };

    setGameState({
      ...gameState,
      player: updatedPlayer,
      partner: result.partner,
      currentWeek: newWeek,
    });

    setDayCompleted(true);
    setActivityMessage('✓ Training complete');
  };

  // Handle accepting a special event
  const acceptEvent = () => {
    if (!specialEvent) return;

    const result = applyActivity(player, specialEvent, partner);
    
    const updatedPlayer = { ...result.player };
    
    const newWeek = { ...currentWeek };
    newWeek.days[currentDay] = { 
      ...currentDayPlan,
      selectedActivity: specialEvent,
      completed: true,
      trainingCount: 0, // Missed training
    };

    setGameState({
      ...gameState,
      player: updatedPlayer,
      partner: result.partner,
      currentWeek: newWeek,
    });

    setShowEventPopup(false);
    setDayCompleted(true);
    setActivityMessage(`✓ ${specialEvent.title}: ${result.message}`);
  };

  // Handle declining event (train instead)
  const declineEvent = () => {
    setShowEventPopup(false);
    setSpecialEvent(null);
    autoTrain();
  };

  const handleNextDay = () => {
    setActivityMessage('');
    setDayCompleted(false);
    setSpecialEvent(null);
    setShowEventPopup(false);
    
    if (isMatchDay) {
      // Start match
      const match = simulateMatch(player, player.currentClubId, currentWeek.opponentId);
      setGameState({
        ...gameState,
        matchState: match,
        gameScreen: 'match',
      });
    } else if (currentDay >= 6) {
      // Week complete - pay wage and check transfers
      const updatedPlayer = {
        ...player,
        money: player.money + player.weeklyWage,
      };

      const offers = checkTransferOffers(updatedPlayer);
      
      if (offers.length > 0) {
        setGameState({
          ...gameState,
          player: updatedPlayer,
          transferOffers: offers,
          gameScreen: 'transfer-decision',
        });
      } else {
        // New week
        const newWeek = {
          weekNumber: currentWeek.weekNumber + 1,
          seasonPhase: currentWeek.seasonPhase,
          days: Array(7).fill(null).map(() => ({ 
            activities: [],
            selectedActivity: null,
            completed: false,
            trainingCount: 0,
          })),
          hasMatch: true,
          matchDay: 6,
          opponentId: currentWeek.opponentId,
          matchType: 'league' as const,
        };

        setGameState({
          ...gameState,
          player: updatedPlayer,
          currentWeek: newWeek,
          gameScreen: 'weekly-briefing',
        });
      }
    } else {
      // Next day
      setCurrentDay(currentDay + 1);
    }
  };

  const getDayName = (day: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[day];
  };

  return (
    <div className="screen day-planner-screen">
      {onReturnToMenu && (
        <button className="menu-escape" onClick={onReturnToMenu}>
          ← MENU
        </button>
      )}
      <div className="screen-header">
        <h2>{getDayName(currentDay)}</h2>
        <p>Week {currentWeek.weekNumber} - Day {currentDay + 1}</p>
      </div>

      <div className="player-status">
        <div className="mini-stat">
          <span>Energy:</span>
          <span className="value">{player.energy}/100</span>
        </div>
        <div className="mini-stat">
          <span>Form:</span>
          <span className="value">{player.form}/100</span>
        </div>
        <div className="mini-stat">
          <span>Money:</span>
          <span className="value">£{player.money}</span>
        </div>
      </div>

      {isMatchDay ? (
        <div className="match-day-notice">
          <h3>⚽ MATCH DAY</h3>
          <p>{currentWeek.matchType === 'cup' ? 'Cup Match!' : currentWeek.matchType === 'friendly' ? 'Friendly' : 'League Match'}</p>
        </div>
      ) : (
        <>
          {/* Special Event Popup (RARE) */}
          {showEventPopup && specialEvent && (
            <div className="event-popup-overlay">
              <div className="event-popup-card">
                <h3>Special Event!</h3>
                <div className="event-content">
                  <div className="event-icon">{getEventIcon(specialEvent.category)}</div>
                  <h4>{specialEvent.title}</h4>
                  <p>{specialEvent.description}</p>
                  {specialEvent.metadata?.itemCost && (
                    <p className="event-cost">Cost: £{specialEvent.metadata.itemCost}</p>
                  )}
                  {specialEvent.energyCost > 0 && (
                    <p className="event-energy">Energy: -{specialEvent.energyCost}</p>
                  )}
                </div>
                <div className="event-buttons">
                  <button 
                    className="menu-btn primary"
                    onClick={acceptEvent}
                    disabled={player.energy < specialEvent.energyCost || (!!specialEvent.metadata?.itemCost && player.money < specialEvent.metadata.itemCost)}
                  >
                    ACCEPT (miss training)
                  </button>
                  <button 
                    className="menu-btn secondary"
                    onClick={declineEvent}
                  >
                    DECLINE (train instead)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Normal Training Day */}
          {!showEventPopup && (
            <div className="training-day">
              <h3>Training Day</h3>
              {activityMessage ? (
                <p className="day-summary">{activityMessage}</p>
              ) : (
                <p className="training-description">
                  Working on fitness, tactics, and skills...
                </p>
              )}
            </div>
          )}
        </>
      )}

      {(dayCompleted || isMatchDay) && (
        <button className="menu-btn primary" onClick={handleNextDay}>
          {isMatchDay ? 'GO TO MATCH' : currentDay >= 6 ? 'FINISH WEEK (+£' + player.weeklyWage + ' wage)' : 'NEXT DAY'}
        </button>
      )}
    </div>
  );
}

function getEventIcon(category: string): string {
  switch (category) {
    case 'partner': return '❤️';
    case 'teammate': return '🎲';
    case 'shopping': return '🛍️';
    case 'media': return '📸';
    case 'manager': return '👔';
    case 'agent': return '💼';
    default: return '⭐';
  }
}
