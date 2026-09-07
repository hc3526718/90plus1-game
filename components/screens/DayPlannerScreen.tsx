import { useState } from 'react';
import { GameState, DayActivity } from '@/lib/types';
import { applyDayActivity, simulateMatch, checkTransferOffers } from '@/lib/gameEngine';

interface DayPlannerScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

export default function DayPlannerScreen({ gameState, setGameState }: DayPlannerScreenProps) {
  const [currentDay, setCurrentDay] = useState(0);
  const [activityMessage, setActivityMessage] = useState('');

  const { player, currentWeek, partner } = gameState;
  const isMatchDay = currentDay === currentWeek.matchDay;
  const currentDayPlan = currentWeek.days[currentDay];

  const handleActivity = (activity: DayActivity) => {
    if (currentDayPlan.completed || !activity) return;

    const result = applyDayActivity(player, activity, partner);
    
    // Update game state
    const newWeek = { ...currentWeek };
    newWeek.days[currentDay] = { activity, completed: true };

    setGameState({
      ...gameState,
      player: result.player,
      partner: result.partner,
      currentWeek: newWeek,
    });

    setActivityMessage(result.message);
  };

  const handleNextDay = () => {
    setActivityMessage('');
    
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
      // Week complete, check for transfers and loop
      const offers = checkTransferOffers(gameState.player);
      
      if (offers.length > 0) {
        setGameState({
          ...gameState,
          transferOffers: offers,
          gameScreen: 'transfer-decision',
        });
      } else {
        // Start new week
        const newWeek = { ...currentWeek };
        newWeek.weekNumber += 1;
        newWeek.days = Array(7).fill(null).map(() => ({ activity: null, completed: false }));
        
        setGameState({
          ...gameState,
          currentWeek: newWeek,
          gameScreen: 'weekly-briefing',
        });
      }
    } else {
      setCurrentDay(currentDay + 1);
    }
  };

  const canProgress = currentDayPlan.completed || currentDayPlan.activity === null;

  const getDayName = (day: number) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[day];
  };

  return (
    <div className="screen day-planner-screen">
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
          <p>Time to play!</p>
        </div>
      ) : (
        <div className="activity-choices">
          <h3>Choose Activity</h3>
          {activityMessage && (
            <div className="activity-message">{activityMessage}</div>
          )}
          
          {!currentDayPlan.completed ? (
            <div className="activity-buttons">
              <button 
                className="activity-btn train"
                onClick={() => handleActivity('train')}
              >
                <div className="activity-icon">🏋️</div>
                <div className="activity-name">TRAIN</div>
                <div className="activity-desc">-20 energy, +trust, +attributes</div>
              </button>

              <button 
                className="activity-btn rest"
                onClick={() => handleActivity('rest')}
              >
                <div className="activity-icon">😴</div>
                <div className="activity-name">REST</div>
                <div className="activity-desc">+30 energy</div>
              </button>

              <button 
                className="activity-btn personal"
                onClick={() => handleActivity('personal')}
              >
                <div className="activity-icon">💝</div>
                <div className="activity-name">PERSONAL</div>
                <div className="activity-desc">-5 energy, +relationship</div>
              </button>

              <button 
                className="activity-btn media"
                onClick={() => handleActivity('media')}
              >
                <div className="activity-icon">📰</div>
                <div className="activity-name">MEDIA</div>
                <div className="activity-desc">-10 energy, +media heat</div>
              </button>

              <button 
                className="activity-btn skip"
                onClick={() => {
                  const newWeek = { ...currentWeek };
                  newWeek.days[currentDay] = { activity: null, completed: true };
                  setGameState({ ...gameState, currentWeek: newWeek });
                  setActivityMessage('Day passed quietly.');
                }}
              >
                <div className="activity-icon">⏭️</div>
                <div className="activity-name">SKIP</div>
                <div className="activity-desc">Light rest</div>
              </button>
            </div>
          ) : (
            <div className="day-complete">
              <p>✓ Activity complete</p>
            </div>
          )}
        </div>
      )}

      {canProgress && (
        <button className="menu-btn primary" onClick={handleNextDay}>
          {isMatchDay ? 'GO TO MATCH' : currentDay >= 6 ? 'FINISH WEEK' : 'NEXT DAY'}
        </button>
      )}
    </div>
  );
}
