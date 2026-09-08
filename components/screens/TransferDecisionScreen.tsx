import { GameState } from '@/lib/types';
import { getClubById } from '@/lib/gameData';

interface TransferDecisionScreenProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onReturnToMenu?: () => void;
}

export default function TransferDecisionScreen({ gameState, setGameState, onReturnToMenu }: TransferDecisionScreenProps) {
  const offer = gameState.transferOffers[0]; // For v1, just handle first offer
  const currentClub = getClubById(gameState.player.currentClubId)!;
  const offeringClub = getClubById(offer.fromClubId)!;

  const handleAccept = () => {
    const updatedPlayer = {
      ...gameState.player,
      currentClubId: offer.fromClubId,
      currentTier: offer.tier,
      weeklyWage: offer.offeredWage, // Update wage
      managerTrust: 60, // Reset trust at new club
      mediaHeat: Math.min(100, gameState.player.mediaHeat + 20), // Transfer news
      consecutiveTraining: 0, // Fresh start
    };

    setGameState({
      ...gameState,
      player: updatedPlayer,
      transferOffers: [],
      gameScreen: 'weekly-briefing',
    });
  };

  const handleReject = () => {
    setGameState({
      ...gameState,
      transferOffers: [],
      gameScreen: 'weekly-briefing',
    });
  };

  const getTierName = (tier: number) => {
    if (tier === 0) return 'Non-League';
    if (tier === 1) return 'League Two';
    if (tier === 2) return 'League One';
    return `Tier ${tier}`;
  };

  return (
    <div className="screen transfer-decision-screen">
      {onReturnToMenu && (
        <button className="menu-escape" onClick={onReturnToMenu}>
          ← MENU
        </button>
      )}
      <div className="screen-header">
        <h2>📋 TRANSFER OFFER</h2>
      </div>

      <div className="transfer-offer-card">
        <div className="offer-notice">
          A club from a higher division is interested in signing you!
        </div>

        <div className="club-comparison">
          <div className="current-club">
            <h3>Current Club</h3>
            <div className="club-name">{currentClub.name}</div>
            <div className="club-tier">{getTierName(currentClub.tier)}</div>
            <div className="club-strength">Strength: {currentClub.strength}</div>
          </div>

          <div className="arrow">→</div>

          <div className="offering-club">
            <h3>Offering Club</h3>
            <div className="club-name highlight">{offeringClub.name}</div>
            <div className="club-tier">{getTierName(offeringClub.tier)}</div>
            <div className="club-strength">Strength: {offeringClub.strength}</div>
          </div>
        </div>

        <div className="offer-details">
          <h3>Offer Details</h3>
          <div className="offer-item">
            <span>Weekly Wage:</span>
            <span className="wage-value">£{offer.offeredWage}</span>
          </div>
          <div className="offer-item">
            <span>Competition Level:</span>
            <span className={offeringClub.tier > currentClub.tier ? 'positive' : ''}>
              {offeringClub.tier > currentClub.tier ? 'Higher' : 'Same'}
            </span>
          </div>
        </div>

        <div className="agent-advice">
          <h3>Agent's Advice</h3>
          <p>
            {offeringClub.strength > currentClub.strength + 5
              ? "This is a significant step up. Great opportunity to develop at a stronger club."
              : "A good move up the pyramid. You've earned this chance."}
          </p>
        </div>

        <div className="decision-note">
          <p><strong>Note:</strong> Accepting will reset your Manager Trust at the new club.</p>
        </div>
      </div>

      <div className="decision-buttons">
        <button className="menu-btn primary accept-btn" onClick={handleAccept}>
          ACCEPT OFFER
        </button>
        <button className="menu-btn secondary reject-btn" onClick={handleReject}>
          STAY AT {currentClub.name.toUpperCase()}
        </button>
      </div>
    </div>
  );
}
