import axios from 'axios';

const ODDS_API_KEY = import.meta.env.VITE_ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4/sports';

export interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

export class OddsApiService {
  async getUpcomingEvents(): Promise<OddsApiEvent[]> {
    try {
      const response = await axios.get(`${BASE_URL}/upcoming/odds`, {
        params: {
          apiKey: ODDS_API_KEY,
          regions: 'us',
          markets: 'h2h',
          oddsFormat: 'decimal'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching odds:', error);
      throw error;
    }
  }

  async getSportEvents(sportKey: string): Promise<OddsApiEvent[]> {
    try {
      const response = await axios.get(`${BASE_URL}/${sportKey}/odds`, {
        params: {
          apiKey: ODDS_API_KEY,
          regions: 'us',
          markets: 'h2h',
          oddsFormat: 'decimal'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching sport events:', error);
      throw error;
    }
  }
}