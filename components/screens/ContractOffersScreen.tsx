import { GameState } from '@/lib/types';
import { getClubById } from '@/lib/gameData';
import { createInitialWeek } from '@/lib/gameEngine';

interface ContractOffersScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onReturnToMenu?: () => void;
}

export default function ContractOffersScreen({ gameState, setGameState, onReturnToMenu }: ContractOffersScreenProps) {
  // Calculate total trial score
  const totalScore = gameState.trialResults.reduce((sum, result) => sum + result.score, 0);
  const maxScore = gameState.trialResults.length * 10;
  const passedTrials = gameState.trialResults.filter(r => r.passed).length;
  
  // Generate contract offers based on performance
  // Poor performance: only non-league
  // Decent: choice of non-league clubs
  // Good: league two option
  const offers: { clubId: string; wage: number; tier: number }[] = [];
  
  if (passedTrials >= 2) {
    // Passed at least 2 trials - get non-league offers
    offers.push({ clubId: 'heath-united', wage: 200, tier: 0 });
    offers.push({ clubId: 'riverside-fc', wage: 220, tier: 0 });
  }
  
  if (passedTrials >= 3 && totalScore >= 18) {
    // Good performance - get League Two offer
    offers.push({ clubId: 'port-city', wage: 400, tier: 1 });
  }
  
  if (offers.length === 0) {
    // Failed trials - restart or get basic offer
    offers.push({ clubId: 'heath-united', wage: 150, tier: 0 });
  }

  const handleAcceptOffer = (clubId: string, wage: number, tier: number) => {
    const updatedPlayer = {
      ...gameState.player,
      currentClubId: clubId,
      currentTier: tier,
      weeklyWage: wage,
    };

    setGameState({
      ...gameState,
      player: updatedPlayer,
      currentWeek: createInitialWeek(clubId, 1),
      gameScreen: 'weekly-briefing',
    });
  };

  return (
    <div className="screen contract-offers-screen">
      {onReturnToMenu && (
        <button className="menu-escape" onClick={onReturnToMenu}>
          ← MENU
        </button>
      )}
      <div className="screen-header">
        <h2>📄 CONTRACT OFFERS</h2>
        <p>Based on your trial performance</p>
      </div>

      <div className="trial-summary">
        <h3>Your Results:</h3>
        {gameState.trialResults.map((result, idx) => (
          <div key={idx} className="trial-result-item">
            <span>{result.type}: </span>
            <span className={result.passed ? 'pass' : 'fail'}>
              {result.score}/10 {result.passed ? '✅' : '❌'}
            </span>
          </div>
        ))}
      </div>

      <div className="offers-container">
        <h3>Available Contracts:</h3>
        {offers.map((offer, idx) => {
          const club = getClubById(offer.clubId);
          if (!club) return null;
          
          const tierName = offer.tier === 0 ? 'Non-League' : offer.tier === 1 ? 'League Two' : `Tier ${offer.tier}`;
          
          return (
            <div key={idx} className="offer-card">
              <h4>{club.name}</h4>
              <p className="offer-tier">{tierName}</p>
              <p className="offer-wage">£{offer.wage}/week</p>
              <button 
                className="menu-btn primary"
                onClick={() => handleAcceptOffer(offer.clubId, offer.wage, offer.tier)}
              >
                SIGN CONTRACT
              </button>
            </div>
          );
        })}
      </div>

      {passedTrials < 2 && (
        <div className="poor-performance">
          <p>⚠️ Your trial performance was weak. Work hard to prove yourself!</p>
        </div>
      )}
    </div>
  );
}
