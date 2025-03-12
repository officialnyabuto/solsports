import React from 'react';
import { Clock, Trophy } from 'lucide-react';
import { SportEvent } from '../types/betting';

interface EventCardProps {
  event: SportEvent;
  onPlaceBet: (team: 'home' | 'away' | 'draw', odds: number) => void;
  loading?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPlaceBet, loading }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const BetButton: React.FC<{ team: 'home' | 'away' | 'draw'; odds: number; label: string }> = ({ team, odds, label }) => (
    <button
      onClick={() => onPlaceBet(team, odds)}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={loading}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        `Bet ${label} (${odds}x)`
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Trophy className="w-6 h-6 text-blue-600 mr-2" />
          <span className="text-lg font-semibold">{event.sport}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="w-5 h-5 mr-1" />
          <span>{formatDate(event.startTime)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="text-center flex-1">
          <h3 className="font-bold text-xl mb-2">{event.teams[0]}</h3>
          <BetButton team="home" odds={event.odds.home} label="Home" />
        </div>

        <div className="text-center mx-4">
          <span className="text-2xl font-bold">VS</span>
          {event.odds.draw && (
            <div className="mt-2">
              <BetButton team="draw" odds={event.odds.draw} label="Draw" />
            </div>
          )}
        </div>

        <div className="text-center flex-1">
          <h3 className="font-bold text-xl mb-2">{event.teams[1]}</h3>
          <BetButton team="away" odds={event.odds.away} label="Away" />
        </div>
      </div>
    </div>
  );
};