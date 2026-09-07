// Core game types for 90+1

export type PreferredFoot = 'left' | 'right' | 'both';

export interface PlayerAttributes {
  finishing: number;      // 1-20
  composure: number;      // 1-20
  pace: number;           // 1-20
  stamina: number;        // 1-20
  awareness: number;      // 1-20
}

export interface Player {
  name: string;
  preferredFoot: PreferredFoot;
  attributes: PlayerAttributes;
  energy: number;         // 0-100
  form: number;           // 0-100
  managerTrust: number;   // 0-100
  mediaHeat: number;      // 0-100
  currentClubId: string;
  currentTier: number;    // 0 = non-league, 1 = league two, 2 = league one, etc.
  careerStats: {
    appearances: number;
    goals: number;
    assists: number;
  };
  money: number;          // Career savings
  weeklyWage: number;     // Current wage
  consecutiveTraining: number;  // Track training spam for diminishing returns/injury
  recentPurchases: string[];    // Track lifestyle purchases for unlocks
}

export interface Club {
  id: string;
  name: string;
  tier: number;
  strength: number;       // 40-90 (affects match outcomes)
}

export interface Partner {
  name: string;
  mood: number;           // 0-100
  relationshipStrength: number; // 0-100
}

export interface Teammate {
  name: string;
  reputation: number;     // 0-100
  relationship: number;   // 0-100
}

// Activity Deck types
export type ActivityCategory = 
  | 'training'
  | 'rest'
  | 'partner'
  | 'teammate'
  | 'shopping'
  | 'media'
  | 'manager'
  | 'agent'
  | 'story';

export type TrainingType = 
  | 'shooting-drill'
  | 'fitness'
  | 'tactical'
  | 'free-kicks'
  | 'conditioning';

export interface ActivityOption {
  id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  energyCost: number;
  unlocked: boolean;
  effects?: {
    energy?: number;
    form?: number;
    trust?: number;
    media?: number;
    partnerMood?: number;
    money?: number;
    attributeChance?: keyof PlayerAttributes;
  };
  metadata?: {
    trainingType?: TrainingType;
    injuryRisk?: number;
    partnerEvent?: string;
    teammateEvent?: string;
    itemCost?: number;
  };
}

export interface DayPlan {
  activities: ActivityOption[];  // 2-4 invitations per day
  selectedActivity: ActivityOption | null;
  completed: boolean;
  trainingCount: number;  // Track training spam for diminishing returns
}

export type SeasonPhase = 'preseason' | 'early-season' | 'midseason' | 'run-in' | 'summer';

export interface Week {
  weekNumber: number;
  seasonPhase: SeasonPhase;
  days: DayPlan[];
  hasMatch: boolean;
  matchDay: number;       // 0-6 for which day the match is
  opponentId: string;
  matchType: 'league' | 'cup' | 'friendly';  // Match variety
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'miss' | 'save' | 'chance' | 'commentary';
  description: string;
  playerInvolved?: boolean;
}

export interface MatchState {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  currentMinute: number;
  isPlayerHome: boolean;
  events: MatchEvent[];
  playerRating: number;   // 0-10
  playerGoals: number;
  playerAssists: number;
  displayedUpTo: number;  // Track which events have been displayed (for resuming after minigames)
}

export type MinigameType = 'shot' | 'penalty';

export interface MinigameState {
  type: MinigameType;
  startTime: number;
  difficulty: number;     // 0-1, higher = harder
  completed: boolean;
  success: boolean;
}

export interface TransferOffer {
  fromClubId: string;
  offeredWage: number;
  tier: number;
}

export interface GameState {
  player: Player;
  clubs: Club[];
  currentWeek: Week;
  partner: Partner | null;
  teammates: Teammate[];
  agent: {
    satisfaction: number; // 0-100
  };
  transferOffers: TransferOffer[];
  matchState: MatchState | null;
  minigameState: MinigameState | null;
  gameScreen: 'start' | 'create-player' | 'weekly-briefing' | 'day-planner' | 'match' | 'minigame' | 'post-match' | 'transfer-decision';
}
