import useSWR from 'swr';
import { OddsApiService, OddsApiEvent } from '../utils/odds-api';

const oddsApiService = new OddsApiService();

export function useOddsApi() {
  const { data: events, error, mutate } = useSWR<OddsApiEvent[]>(
    'upcoming-events',
    () => oddsApiService.getUpcomingEvents(),
    {
      refreshInterval: 300000, // Refresh every 5 minutes
      revalidateOnFocus: true
    }
  );

  return {
    events,
    error,
    loading: !events && !error,
    refresh: mutate
  };
}