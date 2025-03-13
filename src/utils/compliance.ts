import { PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';

interface BetLimits {
  maxBetAmount: number;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
}

interface UserActivity {
  bettor: PublicKey;
  bets: Array<{
    amount: number;
    timestamp: number;
  }>;
}

export class ComplianceService {
  private betLimits: BetLimits = {
    maxBetAmount: 10000, // $10,000 per bet
    dailyLimit: 25000,   // $25,000 per day
    weeklyLimit: 100000, // $100,000 per week
    monthlyLimit: 250000 // $250,000 per month
  };

  private userActivities: Map<string, UserActivity> = new Map();

  async validateBet(
    bettor: PublicKey,
    amount: number,
    timestamp: number = Date.now()
  ): Promise<boolean> {
    try {
      // Check single bet limit
      if (amount > this.betLimits.maxBetAmount) {
        toast.error(`Bet exceeds maximum allowed amount of $${this.betLimits.maxBetAmount}`);
        return false;
      }

      // Get or create user activity record
      const userKey = bettor.toString();
      let activity = this.userActivities.get(userKey);
      if (!activity) {
        activity = { bettor, bets: [] };
        this.userActivities.set(userKey, activity);
      }

      // Check time-based limits
      const dailyTotal = this.calculatePeriodTotal(activity.bets, timestamp, 24);
      if (dailyTotal + amount > this.betLimits.dailyLimit) {
        toast.error(`Daily betting limit of $${this.betLimits.dailyLimit} would be exceeded`);
        return false;
      }

      const weeklyTotal = this.calculatePeriodTotal(activity.bets, timestamp, 168);
      if (weeklyTotal + amount > this.betLimits.weeklyLimit) {
        toast.error(`Weekly betting limit of $${this.betLimits.weeklyLimit} would be exceeded`);
        return false;
      }

      const monthlyTotal = this.calculatePeriodTotal(activity.bets, timestamp, 720);
      if (monthlyTotal + amount > this.betLimits.monthlyLimit) {
        toast.error(`Monthly betting limit of $${this.betLimits.monthlyLimit} would be exceeded`);
        return false;
      }

      // Record the bet if all checks pass
      activity.bets.push({ amount, timestamp });
      this.userActivities.set(userKey, activity);

      return true;
    } catch (error) {
      console.error('Error in compliance validation:', error);
      toast.error('Error validating bet compliance');
      return false;
    }
  }

  private calculatePeriodTotal(
    bets: Array<{ amount: number; timestamp: number }>,
    currentTime: number,
    hours: number
  ): number {
    const periodStart = currentTime - (hours * 60 * 60 * 1000);
    return bets
      .filter(bet => bet.timestamp >= periodStart)
      .reduce((total, bet) => total + bet.amount, 0);
  }

  async generateComplianceReport(bettor: PublicKey): Promise<{
    totalBets: number;
    dailyVolume: number;
    weeklyVolume: number;
    monthlyVolume: number;
    isCompliant: boolean;
  }> {
    const activity = this.userActivities.get(bettor.toString());
    if (!activity) {
      return {
        totalBets: 0,
        dailyVolume: 0,
        weeklyVolume: 0,
        monthlyVolume: 0,
        isCompliant: true
      };
    }

    const now = Date.now();
    const dailyVolume = this.calculatePeriodTotal(activity.bets, now, 24);
    const weeklyVolume = this.calculatePeriodTotal(activity.bets, now, 168);
    const monthlyVolume = this.calculatePeriodTotal(activity.bets, now, 720);

    return {
      totalBets: activity.bets.length,
      dailyVolume,
      weeklyVolume,
      monthlyVolume,
      isCompliant: 
        dailyVolume <= this.betLimits.dailyLimit &&
        weeklyVolume <= this.betLimits.weeklyLimit &&
        monthlyVolume <= this.betLimits.monthlyLimit
    };
  }

  setBetLimits(limits: Partial<BetLimits>): void {
    this.betLimits = {
      ...this.betLimits,
      ...limits
    };
  }
}