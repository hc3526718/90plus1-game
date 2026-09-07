// Core game engine logic

import { 
  Player, 
  PlayerAttributes, 
  Club, 
  Week, 
  DayPlan, 
  MatchState, 
  MatchEvent,
  MinigameState,
  Partner,
  Teammate,
  TransferOffer,
  GameState,
  DayActivity
} from './types';
import { CLUBS, getClubById, getRandomName, PARTNER_NAMES } from './gameData';

// Seeded random for deterministic outcomes
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

export function createNewPlayer(name: string, preferredFoot: 'left' | 'right' | 'both'): Player {
  return {
    name,
    preferredFoot,
    attributes: {
      finishing: 8,
      composure: 7,
      pace: 10,
      stamina: 12,
      awareness: 6,
    },
    energy: 100,
    form: 50,
    managerTrust: 50,
    mediaHeat: 20,
    currentClubId: 'heath-united', // Start at first non-league club
    currentTier: 0,
    careerStats: {
      appearances: 0,
      goals: 0,
      assists: 0,
    },
  };
}

export function createInitialWeek(playerClubId: string, weekNumber: number): Week {
  // Find an opponent from the same tier
  const playerClub = getClubById(playerClubId);
  const opponents = CLUBS.filter(
    c => c.tier === playerClub?.tier && c.id !== playerClubId
  );
  const opponent = opponents[Math.floor(Math.random() * opponents.length)];

  return {
    weekNumber,
    days: Array(7).fill(null).map(() => ({ activity: null, completed: false })),
    hasMatch: true,
    matchDay: 6, // Sunday
    opponentId: opponent.id,
  };
}

export function applyDayActivity(
  player: Player,
  activity: DayActivity,
  partner: Partner | null
): { player: Player; partner: Partner | null; message: string } {
  const newPlayer = { ...player };
  let newPartner = partner ? { ...partner } : null;
  let message = '';

  switch (activity) {
    case 'train':
      newPlayer.energy = Math.max(0, newPlayer.energy - 20);
      newPlayer.managerTrust = Math.min(100, newPlayer.managerTrust + 3);
      
      // Random attribute improvement (small)
      const attrs = ['finishing', 'composure', 'pace', 'stamina', 'awareness'] as const;
      const attrToImprove = attrs[Math.floor(Math.random() * attrs.length)];
      if (newPlayer.attributes[attrToImprove] < 20 && Math.random() > 0.7) {
        newPlayer.attributes[attrToImprove] += 1;
        message = `Training improved your ${attrToImprove}!`;
      } else {
        message = 'Good training session.';
      }
      
      if (newPartner) {
        newPartner.mood = Math.max(0, newPartner.mood - 2);
      }
      break;

    case 'rest':
      newPlayer.energy = Math.min(100, newPlayer.energy + 30);
      message = 'You feel refreshed.';
      break;

    case 'personal':
      newPlayer.energy = Math.max(0, newPlayer.energy - 5);
      
      if (!newPartner) {
        // Chance to meet someone
        if (Math.random() > 0.6) {
          newPartner = {
            name: PARTNER_NAMES[Math.floor(Math.random() * PARTNER_NAMES.length)],
            mood: 60,
            relationshipStrength: 40,
          };
          message = `You met ${newPartner.name}!`;
        } else {
          message = 'A quiet day off.';
        }
      } else {
        // Improve relationship
        newPartner.mood = Math.min(100, newPartner.mood + 15);
        newPartner.relationshipStrength = Math.min(100, newPartner.relationshipStrength + 10);
        newPlayer.mediaHeat = Math.min(100, newPlayer.mediaHeat + 5);
        message = `Quality time with ${newPartner.name}.`;
      }
      break;

    case 'media':
      newPlayer.energy = Math.max(0, newPlayer.energy - 10);
      newPlayer.mediaHeat = Math.min(100, newPlayer.mediaHeat + 15);
      newPlayer.managerTrust = Math.max(0, newPlayer.managerTrust - 2);
      message = 'Press coverage increased.';
      
      if (newPartner) {
        newPartner.mood = Math.max(0, newPartner.mood - 5);
      }
      break;

    default:
      message = 'Day passed.';
  }

  return { player: newPlayer, partner: newPartner, message };
}

export function simulateMatch(
  player: Player,
  playerClubId: string,
  opponentId: string
): MatchState {
  const playerClub = getClubById(playerClubId)!;
  const opponent = getClubById(opponentId)!;
  
  const isHome = Math.random() > 0.5;
  const [homeTeam, awayTeam] = isHome 
    ? [playerClub.name, opponent.name]
    : [opponent.name, playerClub.name];

  const playerTeamStrength = playerClub.strength + (player.form / 10) + (player.energy / 10);
  const opponentStrength = opponent.strength;

  const rng = new SeededRandom(Date.now());
  const events: MatchEvent[] = [];
  
  let homeScore = 0;
  let awayScore = 0;
  let playerRating = 6.0;
  let playerGoals = 0;
  let playerAssists = 0;

  // Generate match events
  events.push({
    minute: 0,
    type: 'commentary',
    description: `Kick-off! ${homeTeam} vs ${awayTeam}`,
  });

  // Simulate first half
  for (let min = 1; min <= 45; min += Math.floor(rng.next() * 15) + 5) {
    if (rng.next() > 0.7) {
      const isPlayerTeamChance = rng.next() < (playerTeamStrength / (playerTeamStrength + opponentStrength));
      
      if (isPlayerTeamChance && rng.next() > 0.5) {
        // Player gets the chance - this will trigger a minigame
        events.push({
          minute: min,
          type: 'chance',
          description: `${player.name} with a chance!`,
          playerInvolved: true,
        });
      } else {
        // Other player scores/misses
        if (rng.next() > 0.65) {
          if (isPlayerTeamChance) {
            if (isHome) homeScore++; else awayScore++;
            events.push({
              minute: min,
              type: 'goal',
              description: `GOAL! ${isHome ? homeTeam : awayTeam} ${isHome ? homeScore : awayScore} - ${!isHome ? homeScore : awayScore} ${!isHome ? homeTeam : awayTeam}`,
            });
          } else {
            if (isHome) awayScore++; else homeScore++;
            events.push({
              minute: min,
              type: 'goal',
              description: `GOAL! ${!isHome ? homeTeam : awayTeam} ${!isHome ? homeScore : awayScore} - ${isHome ? homeScore : awayScore} ${isHome ? homeTeam : awayTeam}`,
            });
          }
        } else {
          events.push({
            minute: min,
            type: 'miss',
            description: `Chance goes begging for ${isPlayerTeamChance ? (isHome ? homeTeam : awayTeam) : (!isHome ? homeTeam : awayTeam)}`,
          });
        }
      }
    }
  }

  events.push({
    minute: 45,
    type: 'commentary',
    description: 'Half-time',
  });

  // Simulate second half
  for (let min = 46; min <= 90; min += Math.floor(rng.next() * 15) + 5) {
    if (rng.next() > 0.7) {
      const isPlayerTeamChance = rng.next() < (playerTeamStrength / (playerTeamStrength + opponentStrength));
      
      if (isPlayerTeamChance && rng.next() > 0.5) {
        events.push({
          minute: min,
          type: 'chance',
          description: `${player.name} with a chance!`,
          playerInvolved: true,
        });
      } else {
        if (rng.next() > 0.65) {
          if (isPlayerTeamChance) {
            if (isHome) homeScore++; else awayScore++;
            events.push({
              minute: min,
              type: 'goal',
              description: `GOAL! ${isHome ? homeTeam : awayTeam} ${isHome ? homeScore : awayScore} - ${!isHome ? homeScore : awayScore} ${!isHome ? homeTeam : awayTeam}`,
            });
          } else {
            if (isHome) awayScore++; else homeScore++;
            events.push({
              minute: min,
              type: 'goal',
              description: `GOAL! ${!isHome ? homeTeam : awayTeam} ${!isHome ? homeScore : awayScore} - ${isHome ? homeScore : awayScore} ${isHome ? homeTeam : awayTeam}`,
            });
          }
        } else {
          events.push({
            minute: min,
            type: 'miss',
            description: `Chance goes begging for ${isPlayerTeamChance ? (isHome ? homeTeam : awayTeam) : (!isHome ? homeTeam : awayTeam)}`,
          });
        }
      }
    }
  }

  // Injury time chances (tighter windows)
  if (rng.next() > 0.6) {
    const injuryMin = 90 + Math.floor(rng.next() * 3) + 1;
    const isPlayerTeamChance = rng.next() < (playerTeamStrength / (playerTeamStrength + opponentStrength));
    
    if (isPlayerTeamChance && rng.next() > 0.5) {
      events.push({
        minute: injuryMin,
        type: 'chance',
        description: `Last gasp chance for ${player.name}!`,
        playerInvolved: true,
      });
    }
  }

  events.push({
    minute: 90,
    type: 'commentary',
    description: 'Full-time',
  });

  return {
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    currentMinute: 0,
    isPlayerHome: isHome,
    events,
    playerRating,
    playerGoals,
    playerAssists,
  };
}

export function evaluateMinigameSuccess(
  type: 'shot' | 'penalty',
  timing: number,  // 0-1, where 0.5 is perfect
  aim: { x: number; y: number },  // normalized coords
  player: Player
): { success: boolean; quality: 'perfect' | 'good' | 'poor' } {
  const timingScore = 1 - Math.abs(timing - 0.5) * 2; // 0-1, 1 is perfect
  
  // Shot quality based on finishing attribute
  const finishingBonus = player.attributes.finishing / 20;
  const composureBonus = player.attributes.composure / 20;
  
  const finalScore = (timingScore * 0.5) + (finishingBonus * 0.3) + (composureBonus * 0.2);
  
  let quality: 'perfect' | 'good' | 'poor';
  if (finalScore > 0.75) quality = 'perfect';
  else if (finalScore > 0.5) quality = 'good';
  else quality = 'poor';
  
  const success = finalScore > 0.4 + (Math.random() * 0.2);
  
  return { success, quality };
}

export function checkTransferOffers(player: Player): TransferOffer[] {
  const offers: TransferOffer[] = [];
  
  // If form and trust are high, chance of offers from higher tier
  if (player.form > 70 && player.managerTrust > 60 && player.careerStats.goals > 5) {
    const higherTierClubs = CLUBS.filter(c => c.tier === player.currentTier + 1);
    
    if (higherTierClubs.length > 0 && Math.random() > 0.6) {
      const offeringClub = higherTierClubs[Math.floor(Math.random() * higherTierClubs.length)];
      offers.push({
        fromClubId: offeringClub.id,
        offeredWage: 1000 + (offeringClub.tier * 500),
        tier: offeringClub.tier,
      });
    }
  }
  
  return offers;
}

export function generateTeammates(count: number): Teammate[] {
  return Array(count).fill(null).map(() => ({
    name: getRandomName(),
    reputation: 40 + Math.floor(Math.random() * 30),
    relationship: 50 + Math.floor(Math.random() * 20),
  }));
}

export function updatePlayerAfterMatch(
  player: Player,
  matchState: MatchState,
  won: boolean,
  drew: boolean
): Player {
  const newPlayer = { ...player };
  
  // Update stats
  newPlayer.careerStats.appearances += 1;
  newPlayer.careerStats.goals += matchState.playerGoals;
  newPlayer.careerStats.assists += matchState.playerAssists;
  
  // Update form based on performance
  if (matchState.playerRating >= 8) {
    newPlayer.form = Math.min(100, newPlayer.form + 15);
    newPlayer.managerTrust = Math.min(100, newPlayer.managerTrust + 10);
  } else if (matchState.playerRating >= 6.5) {
    newPlayer.form = Math.min(100, newPlayer.form + 5);
    newPlayer.managerTrust = Math.min(100, newPlayer.managerTrust + 3);
  } else {
    newPlayer.form = Math.max(0, newPlayer.form - 10);
    newPlayer.managerTrust = Math.max(0, newPlayer.managerTrust - 5);
  }
  
  // Result impact
  if (won) {
    newPlayer.form = Math.min(100, newPlayer.form + 5);
  } else if (!drew) {
    newPlayer.form = Math.max(0, newPlayer.form - 5);
  }
  
  // Energy depletion
  newPlayer.energy = Math.max(20, newPlayer.energy - 30);
  
  return newPlayer;
}
