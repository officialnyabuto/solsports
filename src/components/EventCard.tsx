import React from 'react';
import { Clock, Trophy } from 'lucide-react';
import { SportEvent } from '../types/betting';

interface EventCardProps {
  event: SportEvent;
  onPlaceBet: (team: 'home' | 'away' | 'draw', odds: number) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPlaceBet }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

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
          <button
            onClick={() => onPlaceBet('home', event.odds.home)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Bet Home ({event.odds.home}x)
          </button>
        </div>

        <div className="text-center mx-4">
          <span className="text-2xl font-bold">VS</span>
          {event.odds.draw && (
            <button
              onClick={() => onPlaceBet('draw', event.odds.draw)}
              className="block mt-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Draw ({event.odds.draw}x)
            </button>
          )}
        </div>

        <div className="text-center flex-1">
          <h3 className="font-bold text-xl mb-2">{event.teams[1]}</h3>
          <button
            onClick={() => onPlaceBet('away', event.odds.away)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Bet Away ({event.odds.away}x)
          </button>
        </div>
      </div>
    </div>
  );
};