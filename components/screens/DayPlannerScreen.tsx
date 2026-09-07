import { useState, useEffect } from 'react';
import { GameState, ActivityOption } from '@/lib/types';
import { applyActivity, simulateMatch, checkTransferOffers } from '@/lib/gameEngine';
import { generateDayActivities, getRestActivity } from '@/lib/activityDeck';

interface DayPlannerScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

export default function DayPlannerScreen({ gameState, setGameState }: DayPlannerScreenProps) {
  const [currentDay, setCurrentDay] = useState(0);
  const [activityMessage, setActivityMessage] = useState('');
  const [gamblingMessage, setGamblingMessage] = useState('');

  const { player, currentWeek, partner, teammates } = gameState;
  const isMatchDay = currentDay === currentWeek.matchDay;
  const currentDayPlan = currentWeek.days[currentDay];
  
  // Generate activities for this day if not already generated
  useEffect(() => {
    if (!isMatchDay && currentDayPlan.activities.length === 0 && !currentDayPlan.completed) {
      const activities = generateDayActivities(
        player,
        partner,
        teammates,
        currentWeek.seasonPhase,
        currentWeek.weekNumber
      );
      
      const newWeek = { ...currentWeek };
      newWeek.days[currentDay] = {
        ...currentDayPlan,
        activities,
      };
      
      setGameState({
        ...gameState,
        currentWeek: newWeek,
      });
    }
  }, [currentDay, isMatchDay]);

  const handleActivity = (activity: ActivityOption) => {
    if (currentDayPlan.completed) return;

    const result = applyActivity(player, activity, partner);
    
    // Pay weekly wage on completion of week
    const updatedPlayer = { ...result.player };
    
    // Update game state
    const newWeek = { ...currentWeek };
    newWeek.days[currentDay] = { 
      ...currentDayPlan,
      selectedActivity: activity,
      completed: true,
      trainingCount: activity.category === 'training' ? currentDayPlan.trainingCount + 1 : currentDayPlan.trainingCount,
    };

    setGameState({
      ...gameState,
      player: updatedPlayer,
      partner: result.partner,
      currentWeek: newWeek,
    });

    setActivityMessage(result.message);
    
    if (result.gamblingResult) {
      setGamblingMessage(result.gamblingResult.won 
        ? `Won £${Math.abs(result.gamblingResult.amount)}!`
        : `Lost £${Math.abs(result.gamblingResult.amount)}`
      );
    }
  };

  const handleNextDay = () => {
    setActivityMessage('');
    setGamblingMessage('');
    
    if (currentDay === currentWeek.matchDay) {
      // Start match
      const matchState = simulateMatch(
        gameState.player,
        gameState.player.currentClubId,
        currentWeek.opponentId
      );
      
      setGameState({
        ...gameState,
        matchState,
        gameScreen: 'match',
      });
    } else if (currentDay >= 6) {
      // Week complete - pay wage
      const updatedPlayer = { ...gameState.player };
      updatedPlayer.money += updatedPlayer.weeklyWage;
      
      // Check for transfers
      const offers = checkTransferOffers(updatedPlayer);
      
      if (offers.length > 0) {
        setGameState({
          ...gameState,
          player: updatedPlayer,
          transferOffers: offers,
          gameScreen: 'transfer-decision',
        });
      } else {
        // Start new week
        const newWeek = { ...currentWeek };
        newWeek.weekNumber += 1;
        newWeek.days = Array(7).fill(null).map(() => ({ 
          activities: [],
          selectedActivity: null,
          completed: false,
          trainingCount: 0,
        }));
        
        setGameState({
          ...gameState,
          player: updatedPlayer,
          currentWeek: newWeek,
          gameScreen: 'weekly-briefing',
        });
      }
    } else {
      setCurrentDay(currentDay + 1);
    }
  };

  const canProgress = currentDayPlan.completed;

  const getDayName = (day: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[day];
  };

  const restActivity = getRestActivity();
  const availableActivities = [...currentDayPlan.activities, restActivity];

  return (
    <div className="screen day-planner-screen">
      <div className="screen-header">
        <h2>{getDayName(currentDay)}</h2>
        <p>Week {currentWeek.weekNumber} - Day {currentDay + 1} - {currentWeek.seasonPhase.replace('-', ' ')}</p>
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
        {partner && (
          <div className="mini-stat">
            <span>{partner.name}:</span>
            <span className="value">{partner.mood >= 70 ? '😊' : partner.mood >= 40 ? '😐' : '😔'}</span>
          </div>
        )}
      </div>

      {isMatchDay ? (
        <div className="match-day-notice">
          <h3>⚽ MATCH DAY</h3>
          <p>{currentWeek.matchType === 'cup' ? 'Cup Match!' : currentWeek.matchType === 'friendly' ? 'Friendly' : 'League Match'}</p>
        </div>
      ) : (
        <div className="activity-deck">
          <h3>Today's Activities</h3>
          {activityMessage && (
            <div className="activity-message">{activityMessage}</div>
          )}
          {gamblingMessage && (
            <div className="gambling-message">{gamblingMessage}</div>
          )}
          
          {!currentDayPlan.completed ? (
            <div className="activity-cards">
              {availableActivities.map((activity, index) => (
                <button 
                  key={activity.id + index}
                  className={`activity-card ${activity.category}`}
                  onClick={() => handleActivity(activity)}
                  disabled={player.energy < activity.energyCost || (!!activity.metadata?.itemCost && player.money < activity.metadata.itemCost)}
                >
                  <div className="activity-card-title">{activity.title}</div>
                  <div className="activity-card-desc">{activity.description}</div>
                  <div className="activity-card-cost">
                    {activity.energyCost > 0 && `⚡ -${activity.energyCost} energy`}
                    {activity.metadata?.itemCost && ` | £${activity.metadata.itemCost}`}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="day-complete">
              <p>✓ {currentDayPlan.selectedActivity?.title || 'Activity complete'}</p>
            </div>
          )}
        </div>
      )}

      {canProgress && (
        <button className="menu-btn primary" onClick={handleNextDay}>
          {isMatchDay ? 'GO TO MATCH' : currentDay >= 6 ? 'FINISH WEEK (+£' + player.weeklyWage + ' wage)' : 'NEXT DAY'}
        </button>
      )}
    </div>
  );
}
