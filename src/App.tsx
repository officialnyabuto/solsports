import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletContextProvider } from './components/WalletProvider';
import { EventCard } from './components/EventCard';
import { BettingModal } from './components/BettingModal';
import { WalletBalance } from './components/WalletBalance';
import { SportEvent, Bet, WalletBalance as WalletBalanceType } from './types/betting';

// Mock data - replace with actual data from your Solana program
const mockEvents: SportEvent[] = [
  {
    id: '1',
    sport: 'Soccer',
    teams: ['Manchester United', 'Liverpool'],
    startTime: new Date(Date.now() + 86400000),
    odds: { home: 2.1, away: 3.2, draw: 3.0 },
  },
  {
    id: '2',
    sport: 'Basketball',
    teams: ['Lakers', 'Warriors'],
    startTime: new Date(Date.now() + 172800000),
    odds: { home: 1.9, away: 1.8 },
  },
];

function App() {
  const { connected } = useWallet();
  const [events] = useState<SportEvent[]>(mockEvents);
  const [selectedBet, setSelectedBet] = useState<{
    eventId: string;
    team: 'home' | 'away' | 'draw';
    odds: number;
  } | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [balance, setBalance] = useState<WalletBalanceType>({
    sol: 0,
    usdc: 0,
  });

  useEffect(() => {
    if (connected) {
      // Mock balance - replace with actual wallet balance fetch
      setBalance({
        sol: 1.5,
        usdc: 100,
      });
    }
  }, [connected]);

  const handlePlaceBet = (eventId: string, team: 'home' | 'away' | 'draw', odds: number) => {
    setSelectedBet({ eventId, team, odds });
  };

  const handleConfirmBet = (amount: number) => {
    if (selectedBet) {
      const newBet: Bet = {
        eventId: selectedBet.eventId,
        amount,
        selectedTeam: selectedBet.team,
        odds: selectedBet.odds,
        timestamp: new Date(),
      };
      setBets([...bets, newBet]);
      // Here you would interact with your Solana program to place the bet
    }
    setSelectedBet(null);
  };

  return (
    <WalletContextProvider>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-600">Solana Sports Betting</h1>
              <WalletMultiButton />
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {connected ? (
            <>
              <WalletBalance balance={balance} />
              
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Available Events</h2>
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPlaceBet={handlePlaceBet}
                  />
                ))}
              </div>

              {bets.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Your Bets</h2>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    {bets.map((bet, index) => (
                      <div
                        key={index}
                        className="border-b last:border-0 py-4"
                      >
                        <p className="font-semibold">
                          Event: {events.find(e => e.id === bet.eventId)?.teams.join(' vs ')}
                        </p>
                        <p>Amount: {bet.amount} USDC</p>
                        <p>Potential Win: {(bet.amount * bet.odds).toFixed(2)} USDC</p>
                        <p className="text-sm text-gray-600">
                          Placed: {bet.timestamp.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Welcome to Solana Sports Betting</h2>
              <p className="text-gray-600 mb-8">Connect your wallet to start betting</p>
            </div>
          )}
        </main>

        {selectedBet && (
          <BettingModal
            isOpen={true}
            onClose={() => setSelectedBet(null)}
            eventId={selectedBet.eventId}
            selectedTeam={selectedBet.team}
            odds={selectedBet.odds}
            onConfirmBet={handleConfirmBet}
          />
        )}
      </div>
    </WalletContextProvider>
  );
}

export default App;