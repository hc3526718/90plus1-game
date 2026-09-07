// Static game data - clubs, names, etc.

import { Club } from './types';

export const CLUBS: Club[] = [
  // Tier 0 - Non-League
  { id: 'heath-united', name: 'Heath United', tier: 0, strength: 45 },
  { id: 'riverside-town', name: 'Riverside Town', tier: 0, strength: 47 },
  { id: 'manor-fc', name: 'Manor FC', tier: 0, strength: 42 },
  { id: 'parkside-rangers', name: 'Parkside Rangers', tier: 0, strength: 48 },
  { id: 'valley-athletic', name: 'Valley Athletic', tier: 0, strength: 44 },
  
  // Tier 1 - League Two-ish
  { id: 'northbridge-city', name: 'Northbridge City', tier: 1, strength: 55 },
  { id: 'eastgate-wanderers', name: 'Eastgate Wanderers', tier: 1, strength: 58 },
  { id: 'marlton-united', name: 'Marlton United', tier: 1, strength: 52 },
  { id: 'oakwood-town', name: 'Oakwood Town', tier: 1, strength: 56 },
  { id: 'redhill-fc', name: 'Redhill FC', tier: 1, strength: 54 },
  { id: 'southport-rovers', name: 'Southport Rovers', tier: 1, strength: 53 },
  
  // Tier 2 - League One-ish
  { id: 'millbrook-city', name: 'Millbrook City', tier: 2, strength: 65 },
  { id: 'westford-athletic', name: 'Westford Athletic', tier: 2, strength: 68 },
  { id: 'hartley-town', name: 'Hartley Town', tier: 2, strength: 62 },
  { id: 'ashfield-united', name: 'Ashfield United', tier: 2, strength: 67 },
  { id: 'bromley-wanderers', name: 'Bromley Wanderers', tier: 2, strength: 64 },
  { id: 'kingston-rangers', name: 'Kingston Rangers', tier: 2, strength: 66 },
];

export const FIRST_NAMES = [
  'James', 'Jack', 'Oliver', 'Harry', 'Charlie', 'Thomas', 'George', 'Oscar',
  'William', 'Noah', 'Alfie', 'Joshua', 'Muhammad', 'Henry', 'Leo', 'Archie',
  'Ethan', 'Joseph', 'Freddie', 'Samuel', 'Alexander', 'Logan', 'Max', 'Lucas'
];

export const LAST_NAMES = [
  'Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies',
  'Robinson', 'Wright', 'Thompson', 'Evans', 'Walker', 'White', 'Roberts', 'Green',
  'Hall', 'Wood', 'Jackson', 'Clarke', 'Hughes', 'Edwards', 'Hill', 'Moore'
];

export const PARTNER_NAMES = [
  'Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Skyler'
];

export function getRandomName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function getClubById(id: string): Club | undefined {
  return CLUBS.find(c => c.id === id);
}

export function getClubsByTier(tier: number): Club[] {
  return CLUBS.filter(c => c.tier === tier);
}
