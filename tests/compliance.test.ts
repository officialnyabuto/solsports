import { PublicKey } from '@solana/web3.js';
import { ComplianceService } from '../src/utils/compliance';
import { assert } from 'chai';

describe('Compliance Service Tests', () => {
  let complianceService: ComplianceService;
  const mockBettor = new PublicKey('11111111111111111111111111111111');

  beforeEach(() => {
    complianceService = new ComplianceService();
  });

  it('should validate single bet amount limit', async () => {
    const validAmount = 5000;
    const invalidAmount = 15000;

    const validResult = await complianceService.validateBet(mockBettor, validAmount);
    const invalidResult = await complianceService.validateBet(mockBettor, invalidAmount);

    assert.isTrue(validResult);
    assert.isFalse(invalidResult);
  });

  it('should enforce daily betting limits', async () => {
    const timestamp = Date.now();
    const amount = 10000;

    // First bet should pass
    const firstBet = await complianceService.validateBet(mockBettor, amount, timestamp);
    assert.isTrue(firstBet);

    // Second bet should pass
    const secondBet = await complianceService.validateBet(mockBettor, amount, timestamp + 1000);
    assert.isTrue(secondBet);

    // Third bet should fail (exceeds daily limit)
    const thirdBet = await complianceService.validateBet(mockBettor, amount, timestamp + 2000);
    assert.isFalse(thirdBet);
  });

  it('should generate accurate compliance reports', async () => {
    const timestamp = Date.now();
    await complianceService.validateBet(mockBettor, 5000, timestamp);
    await complianceService.validateBet(mockBettor, 3000, timestamp + 1000);

    const report = await complianceService.generateComplianceReport(mockBettor);

    assert.equal(report.totalBets, 2);
    assert.equal(report.dailyVolume, 8000);
    assert.isTrue(report.isCompliant);
  });

  it('should handle custom bet limits', async () => {
    complianceService.setBetLimits({
      maxBetAmount: 5000,
      dailyLimit: 10000
    });

    const validAmount = 4000;
    const invalidAmount = 6000;

    const validResult = await complianceService.validateBet(mockBettor, validAmount);
    const invalidResult = await complianceService.validateBet(mockBettor, invalidAmount);

    assert.isTrue(validResult);
    assert.isFalse(invalidResult);
  });
});