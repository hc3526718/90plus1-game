import { GameState } from '@/lib/types';
import { updatePlayerAfterMatch, createInitialWeek, checkTransferOffers } from '@/lib/gameEngine';
import { getClubById } from '@/lib/gameData';

interface PostMatchScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onReturnToMenu?: () => void;
}

export default function PostMatchScreen({ gameState, setGameState, onReturnToMenu }: PostMatchScreenProps) {
  const handleReturnToMenuSafe = () => {
    if (onReturnToMenu) {
      onReturnToMenu();
    } else {
      setGameState({...gameState, matchState: null, gameScreen: 'start'});
    }
  };

  // Defensive: ensure matchState exists
  if (!gameState.matchState) {
    return (
      <div className="screen post-match-screen">
        <div className="screen-header">
          <h2>MATCH ERROR</h2>
        </div>
        <p>Match data unavailable.</p>
        <button className="menu-btn primary" onClick={handleReturnToMenuSafe}>
          RETURN TO MENU
        </button>
      </div>
    );
  }

  const matchState = gameState.matchState;
  const playerClub = getClubById(gameState.player.currentClubId);

  // Defensive: if club lookup fails, provide escape hatch
  if (!playerClub) {
    return (
      <div className="screen post-match-screen">
        <div className="screen-header">
          <h2>ERROR</h2>
        </div>
        <p>Club data unavailable.</p>
        <button className="menu-btn primary" onClick={handleReturnToMenuSafe}>
          RETURN TO MENU
        </button>
      </div>
    );
  }

  const playerScore = matchState.isPlayerHome ? matchState.homeScore : matchState.awayScore;
  const opponentScore = matchState.isPlayerHome ? matchState.awayScore : matchState.homeScore;
  
  const won = playerScore > opponentScore;
  const drew = playerScore === opponentScore;
  const lost = !won && !drew;

  const handleContinue = () => {
    // Update player stats
    const updatedPlayer = updatePlayerAfterMatch(gameState.player, matchState, won, drew);
    
    // Check for transfer offers
    const offers = checkTransferOffers(updatedPlayer);
    
    // Create new week
    const newWeek = createInitialWeek(updatedPlayer.currentClubId, gameState.currentWeek.weekNumber + 1);
    
    if (offers.length > 0) {
      setGameState({
        ...gameState,
        player: updatedPlayer,
        currentWeek: newWeek,
        matchState: null,
        transferOffers: offers,
        gameScreen: 'transfer-decision',
      });
    } else {
      setGameState({
        ...gameState,
        player: updatedPlayer,
        currentWeek: newWeek,
        matchState: null,
        gameScreen: 'weekly-briefing',
      });
    }
  };

  const handleReturnToMenu = () => {
    if (onReturnToMenu) {
      onReturnToMenu();
    } else {
      setGameState({
        ...gameState,
        matchState: null,
        gameScreen: 'start',
      });
    }
  };

  const getResultClass = () => {
    if (won) return 'result-win';
    if (drew) return 'result-draw';
    return 'result-loss';
  };

  const getResultText = () => {
    if (won) return 'VICTORY!';
    if (drew) return 'DRAW';
    return 'DEFEAT';
  };

  const getManagerComment = () => {
    if (matchState.playerRating >= 8) {
      return won 
        ? "Brilliant performance! You're becoming essential to this team."
        : "Outstanding effort from you. Unlucky with the result.";
    } else if (matchState.playerRating >= 6.5) {
      return won
        ? "Solid contribution. Keep it up."
        : "Decent performance, but we needed more today.";
    } else {
      return lost
        ? "Not good enough. I expect better."
        : "You got away with that one. Shape up.";
    }
  };

  return (
    <div className="screen post-match-screen">
      {onReturnToMenu && (
        <button className="menu-escape" onClick={handleReturnToMenu}>
          ← MENU
        </button>
      )}
      <div className="screen-header">
        <h2>FULL TIME</h2>
      </div>

      <div className={`match-result ${getResultClass()}`}>
        <div className="result-header">{getResultText()}</div>
        <div className="result-score">
          {matchState.homeTeam} {matchState.homeScore} - {matchState.awayScore} {matchState.awayTeam}
        </div>
      </div>

      <div className="player-performance">
        <h3>Your Performance</h3>
        <div className="perf-grid">
          <div className="perf-stat">
            <span className="perf-label">Rating</span>
            <span className={`perf-value rating-${Math.floor(matchState.playerRating)}`}>
              {matchState.playerRating.toFixed(1)}
            </span>
          </div>
          <div className="perf-stat">
            <span className="perf-label">Goals</span>
            <span className="perf-value">{matchState.playerGoals}</span>
          </div>
          <div className="perf-stat">
            <span className="perf-label">Assists</span>
            <span className="perf-value">{matchState.playerAssists}</span>
          </div>
        </div>
      </div>

      <div className="manager-reaction">
        <h3>Manager's Reaction</h3>
        <p className="manager-quote">"{getManagerComment()}"</p>
      </div>

      <div className="match-impact">
        <h3>Impact</h3>
        <div className="impact-list">
          {matchState.playerRating >= 8 && (
            <div className="impact-item positive">+ Form and Trust improved significantly</div>
          )}
          {matchState.playerRating < 6.5 && (
            <div className="impact-item negative">- Form and Trust decreased</div>
          )}
          {won && (
            <div className="impact-item positive">+ Team morale boost from win</div>
          )}
          <div className="impact-item neutral">Energy depleted from match</div>
        </div>
      </div>

      <div className="post-match-actions">
        <button className="menu-btn primary" onClick={handleContinue}>
          CONTINUE TO NEXT WEEK
        </button>
        <button className="menu-btn secondary" onClick={handleReturnToMenu}>
          RETURN TO MENU
        </button>
      </div>
    </div>
  );
}
