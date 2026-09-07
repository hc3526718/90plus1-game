import { GameState } from '@/lib/types';
import { getClubById } from '@/lib/gameData';

interface WeeklyBriefingScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
}

export default function WeeklyBriefingScreen({ gameState, setGameState }: WeeklyBriefingScreenProps) {
  const { player, currentWeek, partner } = gameState;
  const playerClub = getClubById(player.currentClubId);
  const opponent = getClubById(currentWeek.opponentId);

  const handleContinue = () => {
    setGameState({
      ...gameState,
      gameScreen: 'day-planner',
    });
  };

  const getFormLabel = (form: number) => {
    if (form >= 80) return 'Excellent';
    if (form >= 60) return 'Good';
    if (form >= 40) return 'Average';
    return 'Poor';
  };

  const getTrustLabel = (trust: number) => {
    if (trust >= 80) return 'High';
    if (trust >= 60) return 'Solid';
    if (trust >= 40) return 'Shaky';
    return 'Low';
  };

  return (
    <div className="screen briefing-screen">
      <div className="screen-header">
        <h2>WEEK {currentWeek.weekNumber} BRIEFING</h2>
        <p className="club-name">{playerClub?.name}</p>
      </div>

      <div className="briefing-content">
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Energy</div>
            <div className="stat-bar">
              <div 
                className="stat-fill energy" 
                style={{ width: `${player.energy}%` }}
              />
            </div>
            <div className="stat-value">{player.energy}/100</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Form</div>
            <div className="stat-bar">
              <div 
                className="stat-fill form" 
                style={{ width: `${player.form}%` }}
              />
            </div>
            <div className="stat-value">{getFormLabel(player.form)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Manager Trust</div>
            <div className="stat-bar">
              <div 
                className="stat-fill trust" 
                style={{ width: `${player.managerTrust}%` }}
              />
            </div>
            <div className="stat-value">{getTrustLabel(player.managerTrust)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Media Heat</div>
            <div className="stat-bar">
              <div 
                className="stat-fill media" 
                style={{ width: `${player.mediaHeat}%` }}
              />
            </div>
            <div className="stat-value">{player.mediaHeat}/100</div>
          </div>
        </div>

        {partner && (
          <div className="relationship-summary">
            <h3>Personal</h3>
            <p>{partner.name}: {partner.mood >= 70 ? '😊 Happy' : partner.mood >= 40 ? '😐 Neutral' : '😔 Unhappy'}</p>
          </div>
        )}

        <div className="match-preview">
          <h3>This Week's Match</h3>
          <p className="fixture">
            {playerClub?.name} <span className="vs">vs</span> {opponent?.name}
          </p>
          <p className="match-day">Match Day: Sunday</p>
        </div>

        <div className="career-stats">
          <h3>Career Stats</h3>
          <div className="stats-row">
            <span>Appearances: {player.careerStats.appearances}</span>
            <span>Goals: {player.careerStats.goals}</span>
            <span>Assists: {player.careerStats.assists}</span>
          </div>
        </div>
      </div>

      <button className="menu-btn primary" onClick={handleContinue}>
        CONTINUE TO WEEK
      </button>
    </div>
  );
}
