import { PublicKey } from '@solana/web3.js';
import { RateLimiterMemory } from 'rate-limiter-flexible';

interface BetEvent {
  eventId: string;
  bettor: PublicKey;
  amount: number;
  odds: number;
  timestamp: number;
  token: string;
}

interface SettlementEvent {
  eventId: string;
  winner: 'home' | 'away' | 'draw';
  totalPayout: number;
  timestamp: number;
}

export class AnalyticsService {
  private betEvents: BetEvent[] = [];
  private settlements: SettlementEvent[] = [];
  private rateLimiter: RateLimiterMemory;

  constructor() {
    this.rateLimiter = new RateLimiterMemory({
      points: 100,
      duration: 60,
    });
  }

  async trackBet(bet: BetEvent): Promise<void> {
    try {
      await this.rateLimiter.consume(bet.bettor.toString());
      this.betEvents.push(bet);
      
      // Calculate risk metrics
      this.calculateRiskMetrics(bet.eventId);
      
      // Track user behavior
      this.updateUserProfile(bet.bettor);
    } catch (error) {
      console.error('Error tracking bet:', error);
    }
  }

  async trackSettlement(settlement: SettlementEvent): Promise<void> {
    try {
      this.settlements.push(settlement);
      
      // Update platform statistics
      this.updatePlatformStats(settlement);
    } catch (error) {
      console.error('Error tracking settlement:', error);
    }
  }

  private calculateRiskMetrics(eventId: string): void {
    const eventBets = this.betEvents.filter(bet => bet.eventId === eventId);
    
    // Calculate exposure
    const totalExposure = eventBets.reduce((acc, bet) => 
      acc + (bet.amount * bet.odds), 0);
    
    // Alert if exposure is too high
    if (totalExposure > 1000000) { // 1M threshold
      console.warn(`High exposure alert for event ${eventId}`);
    }
  }

  private updateUserProfile(bettor: PublicKey): void {
    const userBets = this.betEvents.filter(bet => 
      bet.bettor.equals(bettor)
    );
    
    // Calculate user statistics
    const totalBets = userBets.length;
    const totalAmount = userBets.reduce((acc, bet) => acc + bet.amount, 0);
    
    // Store user profile
    // This would typically go to a database
    console.log(`User ${bettor.toString()} profile updated:`, {
      totalBets,
      totalAmount
    });
  }

  private updatePlatformStats(settlement: SettlementEvent): void {
    // Calculate platform metrics
    const totalSettlements = this.settlements.length;
    const totalPayouts = this.settlements.reduce((acc, s) => 
      acc + s.totalPayout, 0);
    
    // Store platform statistics
    // This would typically go to a database
    console.log('Platform stats updated:', {
      totalSettlements,
      totalPayouts
    });
  }

  getAnalytics(): {
    totalBets: number;
    totalVolume: number;
    avgBetSize: number;
    settlementsCount: number;
  } {
    const totalBets = this.betEvents.length;
    const totalVolume = this.betEvents.reduce((acc, bet) => 
      acc + bet.amount, 0);
    
    return {
      totalBets,
      totalVolume,
      avgBetSize: totalVolume / totalBets || 0,
      settlementsCount: this.settlements.length
    };
  }
}