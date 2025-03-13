import { PublicKey } from '@solana/web3.js';
import { AnalyticsService } from '../src/utils/analytics';
import { assert } from 'chai';

describe('Analytics Service Tests', () => {
  let analyticsService: AnalyticsService;
  const mockBettor = new PublicKey('11111111111111111111111111111111');

  beforeEach(() => {
    analyticsService = new AnalyticsService();
  });

  it('should track bets correctly', async () => {
    const mockBet = {
      eventId: 'TEST_EVENT_1',
      bettor: mockBettor,
      amount: 100,
      odds: 2.5,
      timestamp: Date.now(),
      token: 'USDC'
    };

    await analyticsService.trackBet(mockBet);
    const analytics = analyticsService.getAnalytics();

    assert.equal(analytics.totalBets, 1);
    assert.equal(analytics.totalVolume, 100);
    assert.equal(analytics.avgBetSize, 100);
  });

  it('should track settlements correctly', async () => {
    const mockSettlement = {
      eventId: 'TEST_EVENT_1',
      winner: 'home' as const,
      totalPayout: 250,
      timestamp: Date.now()
    };

    await analyticsService.trackSettlement(mockSettlement);
    const analytics = analyticsService.getAnalytics();

    assert.equal(analytics.settlementsCount, 1);
  });

  it('should calculate correct average bet size', async () => {
    const bets = [
      {
        eventId: 'TEST_EVENT_1',
        bettor: mockBettor,
        amount: 100,
        odds: 2.0,
        timestamp: Date.now(),
        token: 'USDC'
      },
      {
        eventId: 'TEST_EVENT_1',
        bettor: mockBettor,
        amount: 200,
        odds: 1.5,
        timestamp: Date.now(),
        token: 'USDC'
      }
    ];

    for (const bet of bets) {
      await analyticsService.trackBet(bet);
    }

    const analytics = analyticsService.getAnalytics();
    assert.equal(analytics.totalBets, 2);
    assert.equal(analytics.totalVolume, 300);
    assert.equal(analytics.avgBetSize, 150);
  });
});