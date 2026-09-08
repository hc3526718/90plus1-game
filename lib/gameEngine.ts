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
  GameState
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
    money: 1000, // Starting savings
    weeklyWage: 200, // Non-league wages
    consecutiveTraining: 0,
    recentPurchases: [],
  };
}

function getSeasonPhase(weekNumber: number): import('./types').SeasonPhase {
  // Simple season phase logic (52 weeks = 1 year)
  if (weekNumber <= 4) return 'preseason';
  if (weekNumber <= 15) return 'early-season';
  if (weekNumber <= 35) return 'midseason';
  if (weekNumber <= 46) return 'run-in';
  return 'summer';
}

export function createInitialWeek(playerClubId: string, weekNumber: number): Week {
  // Find an opponent from the same tier
  const playerClub = getClubById(playerClubId);
  const opponents = CLUBS.filter(
    c => c.tier === playerClub?.tier && c.id !== playerClubId
  );
  const opponent = opponents[Math.floor(Math.random() * opponents.length)];
  
  const phase = getSeasonPhase(weekNumber);
  
  // Determine match type (mostly league, occasional cup)
  let matchType: 'league' | 'cup' | 'friendly' = 'league';
  if (phase === 'preseason') matchType = 'friendly';
  else if (Math.random() > 0.85) matchType = 'cup';

  return {
    weekNumber,
    seasonPhase: phase,
    days: Array(7).fill(null).map(() => ({ 
      activities: [],
      selectedActivity: null,
      completed: false,
      trainingCount: 0,
    })),
    hasMatch: phase !== 'summer', // No matches in summer
    matchDay: 6, // Sunday
    opponentId: opponent.id,
    matchType,
  };
}

export function applyActivity(
  player: Player,
  activity: import('./types').ActivityOption,
  partner: Partner | null
): { player: Player; partner: Partner | null; message: string; gamblingResult?: { won: boolean; amount: number } } {
  const newPlayer = { ...player };
  let newPartner = partner ? { ...partner } : null;
  let message = '';
  let gamblingResult: { won: boolean; amount: number } | undefined;

  // Apply activity effects
  if (activity.effects) {
    const { energy, form, trust, media, partnerMood, money, attributeChance } = activity.effects;
    
    if (energy) newPlayer.energy = Math.max(0, Math.min(100, newPlayer.energy + energy));
    if (form) newPlayer.form = Math.max(0, Math.min(100, newPlayer.form + form));
    if (trust) newPlayer.managerTrust = Math.max(0, Math.min(100, newPlayer.managerTrust + trust));
    if (media) newPlayer.mediaHeat = Math.max(0, Math.min(100, newPlayer.mediaHeat + media));
    if (money) newPlayer.money += money;
    
    if (partnerMood && newPartner) {
      newPartner.mood = Math.max(0, Math.min(100, newPartner.mood + partnerMood));
    }
    
    // Attribute improvement chance (training activities)
    if (attributeChance && newPlayer.attributes[attributeChance] < 20) {
      // Diminishing returns based on consecutive training
      const improvementChance = 0.7 - (newPlayer.consecutiveTraining * 0.1);
      if (Math.random() < improvementChance) {
        newPlayer.attributes[attributeChance] += 1;
        message = `✨ ${activity.title}: ${attributeChance} improved!`;
      } else {
        message = `${activity.title} completed.`;
      }
    } else {
      message = `${activity.title} completed.`;
    }
  }
  
  // Category-specific logic
  if (activity.category === 'training') {
    newPlayer.consecutiveTraining += 1;
    
    // Injury risk
    const injuryRisk = activity.metadata?.injuryRisk || 0;
    if (Math.random() < injuryRisk) {
      newPlayer.energy = Math.max(0, newPlayer.energy - 15);
      message = `⚠️ Overtraining! You're fatigued.`;
    }
    
    // Partner mood impact
    if (newPartner) {
      newPartner.mood = Math.max(0, newPartner.mood - 3);
    }
  } else {
    // Reset consecutive training if doing something else
    newPlayer.consecutiveTraining = 0;
  }
  
  // Shopping: track purchases
  if (activity.category === 'shopping') {
    newPlayer.recentPurchases.push(activity.id);
    if (newPlayer.recentPurchases.length > 5) {
      newPlayer.recentPurchases.shift(); // Keep last 5
    }
  }
  
  // Partner activities: meet someone if don't have partner
  if (activity.category === 'partner' && !newPartner) {
    newPartner = {
      name: PARTNER_NAMES[Math.floor(Math.random() * PARTNER_NAMES.length)],
      mood: 60,
      relationshipStrength: 40,
    };
    message = `You met ${newPartner.name}!`;
  }
  
  // Gambling: run the minigame
  if (activity.metadata?.teammateEvent === 'gambling') {
    const stake = activity.metadata.itemCost || 50;
    // Simple higher-lower: 50% chance to win 2x
    const won = Math.random() > 0.5;
    const amount = won ? stake : -stake;
    newPlayer.money += amount;
    gamblingResult = { won, amount };
    message = won 
      ? `🎰 Won £${stake} on the bus!`
      : `Lost £${stake} on the bus.`;
  }

  return { player: newPlayer, partner: newPartner, message, gamblingResult };
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

  // Calculate player chances based on relative strength
  // Formula: base chances scaled by strength ratio, with floor and ceiling
  // Strength ratio > 1 = stronger team, < 1 = weaker team
  const strengthRatio = playerTeamStrength / opponentStrength;
  
  // Base chances: 3, scaled by ratio
  // Floor: 1-2 chances even vs strong opponents
  // Ceiling: 5-6 chances even vs weak opponents
  let targetPlayerChances = Math.round(3 * strengthRatio);
  targetPlayerChances = Math.max(1, Math.min(6, targetPlayerChances));
  
  const rng = new SeededRandom(Date.now());
  const events: MatchEvent[] = [];
  
  let homeScore = 0;
  let awayScore = 0;
  let playerRating = 6.0;
  let playerGoals = 0;
  let playerAssists = 0;
  let playerChancesGenerated = 0;

  // Generate match events
  events.push({
    minute: 0,
    type: 'commentary',
    description: `Kick-off! ${homeTeam} vs ${awayTeam}`,
  });

  // Pre-determine when player chances will occur (distributed across match)
  const playerChanceMinutes: number[] = [];
  const halfChances = Math.floor(targetPlayerChances / 2);
  const secondHalfChances = targetPlayerChances - halfChances;
  
  // First half player chances (spread between 5-42 minutes)
  for (let i = 0; i < halfChances; i++) {
    const min = 5 + Math.floor(rng.next() * 37);
    playerChanceMinutes.push(min);
  }
  
  // Second half player chances (spread between 50-87 minutes)
  for (let i = 0; i < secondHalfChances; i++) {
    const min = 50 + Math.floor(rng.next() * 37);
    playerChanceMinutes.push(min);
  }
  
  // Possibly add injury time chance (if not at ceiling)
  if (targetPlayerChances < 6 && rng.next() > 0.6) {
    const injuryMin = 90 + Math.floor(rng.next() * 3) + 1;
    playerChanceMinutes.push(injuryMin);
  }
  
  playerChanceMinutes.sort((a, b) => a - b);

  // Track which chances have been added (to prevent duplicates)
  const usedChanceMinutes = new Set<number>();

  // Simulate first half
  for (let min = 1; min <= 45; min += Math.floor(rng.next() * 15) + 5) {
    // Check if we've passed any player chance minutes that haven't been used yet
    const pendingChances = playerChanceMinutes.filter(
      chanceMin => chanceMin <= min && chanceMin >= 1 && chanceMin <= 45 && !usedChanceMinutes.has(chanceMin)
    );
    
    if (pendingChances.length > 0) {
      // Add the first pending chance
      const chanceMin = pendingChances[0];
      events.push({
        minute: chanceMin,
        type: 'chance',
        description: `${player.name} with a chance!`,
        playerInvolved: true,
      });
      usedChanceMinutes.add(chanceMin);
      playerChancesGenerated++;
    } else if (rng.next() > 0.7) {
      // Other team chances and goals
      const isPlayerTeamChance = rng.next() < (playerTeamStrength / (playerTeamStrength + opponentStrength));
      
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

  events.push({
    minute: 45,
    type: 'commentary',
    description: 'Half-time',
  });

  // Simulate second half
  for (let min = 46; min <= 90; min += Math.floor(rng.next() * 15) + 5) {
    // Check if we've passed any player chance minutes that haven't been used yet
    const pendingChances = playerChanceMinutes.filter(
      chanceMin => chanceMin <= min && chanceMin >= 46 && chanceMin <= 90 && !usedChanceMinutes.has(chanceMin)
    );
    
    if (pendingChances.length > 0) {
      // Add the first pending chance
      const chanceMin = pendingChances[0];
      events.push({
        minute: chanceMin,
        type: 'chance',
        description: `${player.name} with a chance!`,
        playerInvolved: true,
      });
      usedChanceMinutes.add(chanceMin);
      playerChancesGenerated++;
    } else if (rng.next() > 0.7) {
      // Other team chances and goals
      const isPlayerTeamChance = rng.next() < (playerTeamStrength / (playerTeamStrength + opponentStrength));
      
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

  // Injury time player chances if scheduled
  playerChanceMinutes.forEach(min => {
    if (min > 90 && !usedChanceMinutes.has(min)) {
      events.push({
        minute: min,
        type: 'chance',
        description: `Last gasp chance for ${player.name}!`,
        playerInvolved: true,
      });
      usedChanceMinutes.add(min);
      playerChancesGenerated++;
    }
  });

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
    displayedUpTo: 0,
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
