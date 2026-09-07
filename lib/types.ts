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

export type DayActivity = 'train' | 'rest' | 'personal' | 'media' | null;

export interface DayPlan {
  activity: DayActivity;
  completed: boolean;
}

export interface Week {
  weekNumber: number;
  days: DayPlan[];
  hasMatch: boolean;
  matchDay: number;       // 0-6 for which day the match is
  opponentId: string;
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
