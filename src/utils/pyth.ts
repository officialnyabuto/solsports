import { PythConnection, getPythProgramKeyForCluster, PythHttpClient, PriceStatus } from "@pythnetwork/client";
import { Connection, PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

export class PythService {
  private connection: Connection;
  private pythConnection: PythConnection;
  private pythHttpClient: PythHttpClient;

  constructor(connection: Connection) {
    this.connection = connection;
    const pythProgramKey = getPythProgramKeyForCluster("devnet");
    this.pythConnection = new PythConnection(connection, pythProgramKey);
    this.pythHttpClient = new PythHttpClient(connection, pythProgramKey);
  }

  async getEventOutcome(eventId: string): Promise<{
    winner: 'home' | 'away' | 'draw';
    score: { home: number; away: number };
    confidence: number;
  }> {
    try {
      // Get price feeds for the event
      const priceFeeds = await this.pythHttpClient.getLatestPriceFeeds();
      const eventFeed = priceFeeds?.find(feed => 
        feed.id === eventId && 
        feed.price && 
        feed.confidence
      );

      if (!eventFeed || eventFeed.status !== PriceStatus.TRADING) {
        throw new Error("No valid price feed found for event");
      }

      // Calculate outcome based on price movement
      const price = eventFeed.price;
      const confidence = eventFeed.confidence;
      
      // Normalize the price to determine winner
      // Positive price means home team won, negative means away team won
      // Price near zero (within confidence interval) means draw
      const normalizedPrice = price / confidence;
      
      let winner: 'home' | 'away' | 'draw';
      if (Math.abs(normalizedPrice) < 0.1) {
        winner = 'draw';
      } else {
        winner = normalizedPrice > 0 ? 'home' : 'away';
      }

      // Calculate synthetic scores based on price movement magnitude
      const scoreDiff = Math.abs(Math.round(normalizedPrice));
      const homeScore = winner === 'home' ? scoreDiff : scoreDiff - 1;
      const awayScore = winner === 'away' ? scoreDiff : scoreDiff - 1;

      return {
        winner,
        score: {
          home: Math.max(0, homeScore),
          away: Math.max(0, awayScore)
        },
        confidence: confidence
      };
    } catch (error) {
      console.error('Error getting event outcome:', error);
      toast.error('Failed to fetch event outcome from oracle');
      throw error;
    }
  }

  async subscribeToEventUpdates(
    eventId: string,
    callback: (outcome: { 
      winner: 'home' | 'away' | 'draw'; 
      score: { home: number; away: number };
      confidence: number;
    }) => void
  ): Promise<() => void> {
    try {
      // Subscribe to price feed updates
      const unsubscribe = this.pythConnection.onPriceChange((product, price) => {
        if (product.id === eventId && price.price && price.confidence) {
          const normalizedPrice = price.price / price.confidence;
          
          let winner: 'home' | 'away' | 'draw';
          if (Math.abs(normalizedPrice) < 0.1) {
            winner = 'draw';
          } else {
            winner = normalizedPrice > 0 ? 'home' : 'away';
          }

          const scoreDiff = Math.abs(Math.round(normalizedPrice));
          const homeScore = winner === 'home' ? scoreDiff : scoreDiff - 1;
          const awayScore = winner === 'away' ? scoreDiff : scoreDiff - 1;

          callback({
            winner,
            score: {
              home: Math.max(0, homeScore),
              away: Math.max(0, awayScore)
            },
            confidence: price.confidence
          });
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to event updates:', error);
      toast.error('Failed to subscribe to event updates');
      throw error;
    }
  }

  async validateEventData(eventId: string): Promise<boolean> {
    try {
      const priceFeeds = await this.pythHttpClient.getLatestPriceFeeds();
      const eventFeed = priceFeeds?.find(feed => feed.id === eventId);
      
      return !!(eventFeed && 
        eventFeed.status === PriceStatus.TRADING && 
        eventFeed.price && 
        eventFeed.confidence);
    } catch (error) {
      console.error('Error validating event data:', error);
      return false;
    }
  }
}