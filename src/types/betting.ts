export interface SportEvent {
  id: string;
  sport: string;
  teams: [string, string];
  startTime: Date;
  odds: {
    home: number;
    away: number;
    draw?: number;
  };
}

export interface Bet {
  eventId: string;
  amount: number;
  selectedTeam: 'home' | 'away' | 'draw';
  odds: number;
  timestamp: Date;
}

export interface WalletBalance {
  sol: number;
  usdc: number;
}