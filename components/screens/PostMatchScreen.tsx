import { useState } from 'react';
import { GameState } from '@/lib/types';
import { updatePlayerAfterMatch, createInitialWeek, checkTransferOffers } from '@/lib/gameEngine';
import { getClubById } from '@/lib/gameData';

type CardValue = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'J' | 'Q' | 'K' | 'A';

const CARD_DECK: CardValue[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];

function getCardNumericValue(card: CardValue): number {
  if (typeof card === 'number') return card;
  if (card === 'J') return 11;
  if (card === 'Q') return 12;
  if (card === 'K') return 13;
  return 14; // Ace
}

interface PostMatchScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onReturnToMenu?: () => void;
}

export default function PostMatchScreen({ gameState, setGameState, onReturnToMenu }: PostMatchScreenProps) {
  // Bus gambling state
  const [isGambling, setIsGambling] = useState(false);
  const [currentCard, setCurrentCard] = useState<CardValue | null>(null);
  const [nextCard, setNextCard] = useState<CardValue | null>(null);
  const [gamblingStreak, setGamblingStreak] = useState(0);
  const [gamblingMessage, setGamblingMessage] = useState('');
  const [playerMoney, setPlayerMoney] = useState(gameState.player.money);

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
    // Update player stats (including gambling money changes)
    const updatedPlayer = updatePlayerAfterMatch(gameState.player, matchState, won, drew);
    updatedPlayer.money = playerMoney; // Apply gambling results
    
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

  // Bus gambling functions
  const startGambling = () => {
    if (playerMoney < 50) {
      setGamblingMessage('Not enough money to gamble!');
      return;
    }
    setIsGambling(true);
    setGamblingStreak(0);
    const firstCard = CARD_DECK[Math.floor(Math.random() * CARD_DECK.length)];
    setCurrentCard(firstCard);
    setNextCard(null);
    setGamblingMessage(`Your card: ${firstCard}. Higher or Lower?`);
  };

  const guess = (guessHigher: boolean) => {
    if (!currentCard) return;
    
    const newCard = CARD_DECK[Math.floor(Math.random() * CARD_DECK.length)];
    setNextCard(newCard);
    
    const currentValue = getCardNumericValue(currentCard);
    const nextValue = getCardNumericValue(newCard);
    
    const correct = (guessHigher && nextValue > currentValue) || (!guessHigher && nextValue < currentValue) || nextValue === currentValue;
    
    if (correct) {
      const winnings = 50 * (1 + gamblingStreak);
      setPlayerMoney(prev => prev + winnings);
      setGamblingStreak(prev => prev + 1);
      setGamblingMessage(`✅ Correct! Won £${winnings}. Streak: ${gamblingStreak + 1}`);
      
      // Continue or cash out
      setTimeout(() => {
        setCurrentCard(newCard);
        setNextCard(null);
        setGamblingMessage(`Your card: ${newCard}. Higher or Lower?`);
      }, 2000);
    } else {
      const loss = 50 + (gamblingStreak * 50);
      setPlayerMoney(prev => prev - loss);
      setGamblingMessage(`❌ Wrong! Lost £${loss}. Game over.`);
      
      setTimeout(() => {
        setIsGambling(false);
        setGamblingStreak(0);
        setCurrentCard(null);
        setNextCard(null);
      }, 2000);
    }
  };

  const cashOut = () => {
    const winnings = gamblingStreak * 50;
    setGamblingMessage(`Cashed out with £${winnings}!`);
    setTimeout(() => {
      setIsGambling(false);
      setGamblingStreak(0);
      setCurrentCard(null);
      setNextCard(null);
    }, 1500);
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

      {/* Bus Gambling (JfG2 feature) */}
      <div className="bus-gambling">
        <h3>🚌 Bus Journey Home</h3>
        {!isGambling ? (
          <div className="gambling-intro">
            <p>The lads are playing cards on the bus. Fancy a game?</p>
            <p className="money-display">Your money: £{playerMoney}</p>
            <button 
              className="menu-btn secondary"
              onClick={startGambling}
              disabled={playerMoney < 50}
            >
              PLAY HIGHER/LOWER (£50)
            </button>
          </div>
        ) : (
          <div className="gambling-active">
            <div className="card-display">
              {currentCard && (
                <div className="card current-card">
                  <span className="card-value">{currentCard}</span>
                </div>
              )}
              {nextCard && (
                <div className="card next-card">
                  <span className="card-value">{nextCard}</span>
                </div>
              )}
            </div>
            <p className="gambling-prompt">{gamblingMessage}</p>
            <p className="money-display">Money: £{playerMoney} | Streak: {gamblingStreak}</p>
            {!nextCard && currentCard && (
              <div className="gambling-buttons">
                <button className="menu-btn primary" onClick={() => guess(true)}>
                  HIGHER
                </button>
                <button className="menu-btn secondary" onClick={() => guess(false)}>
                  LOWER
                </button>
                {gamblingStreak > 0 && (
                  <button className="menu-btn" onClick={cashOut}>
                    CASH OUT (£{gamblingStreak * 50})
                  </button>
                )}
              </div>
            )}
          </div>
        )}
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
