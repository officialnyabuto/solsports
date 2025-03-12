import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiter for betting actions
export const bettingLimiter = new RateLimiterMemory({
  points: 5, // Number of bets
  duration: 60, // Per minute
});

// Rate limiter for general API calls
export const apiLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per minute
});

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export async function checkBettingLimit(userId: string): Promise<void> {
  try {
    await bettingLimiter.consume(userId);
  } catch (error) {
    throw new RateLimitError('Betting limit exceeded. Please try again later.');
  }
}

export async function checkApiLimit(userId: string): Promise<void> {
  try {
    await apiLimiter.consume(userId);
  } catch (error) {
    throw new RateLimitError('Too many requests. Please try again later.');
  }
}