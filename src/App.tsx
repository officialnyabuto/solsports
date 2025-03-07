import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletContextProvider } from './components/WalletProvider';
import { EventCard } from './components/EventCard';
import { BettingModal } from './components/BettingModal';
import { WalletBalance } from './components/WalletBalance';
import { SportEvent, Bet, WalletBalance as WalletBalanceType } from './types/betting';
import { useProgramService } from './hooks/useProgramService';
import { PublicKey } from '@solana/web3.js';

function App() {
  const { connected, publicKey } = useWallet();
  const programService = useProgramService();
  
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [selectedBet, setSelectedBet] = useState<{
    eventId: string;
    team: 'home' | 'away' | 'draw';
    odds: number;
    poolPubkey: PublicKey;
  } | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [balance, setBalance] = useState<WalletBalanceType>({
    sol: 0,
    usdc: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (connected && programService) {
      fetchBettingPools();
      fetchUserBets();
    }
  }, [connected, programService]);

  const fetchBettingPools = async () => {
    if (!programService) return;
    
    try {
      setLoading(true);
      const pools = await programService.fetchBettingPools();
      const mappedEvents: SportEvent[] = pools.map(pool => ({
        id: pool.eventId,
        sport: 'Soccer', // You might want to add sport type to your program state
        teams: [pool.homeTeam, pool.awayTeam],
        startTime: new Date(pool.startTime.toNumber() * 1000),
        odds: {
          home: pool.homeOdds.toNumber() / 100,
          away: pool.awayOdds.toNumber() / 100,
          draw: pool.drawOdds ? pool.drawOdds.toNumber() / 100 : undefined,
        },
        poolPubkey: pool.pubkey,
      }));
      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching betting pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBets = async () => {
    if (!programService || !publicKey) return;
    
    try {
      const userBets = await programService.fetchUserBets(publicKey);
      const mappedBets: Bet[] = userBets.map(bet => ({
        eventId: bet.eventId,
        amount: bet.amount.toNumber(),
        selectedTeam: bet.betType.home ? 'home' : bet.betType.away ? 'away' : 'draw',
        odds: bet.odds.toNumber() / 100,
        timestamp: new Date(),
        betPubkey: bet.pubkey,
      }));
      setBets(mappedBets);
    } catch (error) {
      console.error('Error fetching user bets:', error);
    }
  };

  const handlePlaceBet = (eventId: string, team: 'home' | 'away' | 'draw', odds: number, poolPubkey: PublicKey) => {
    setSelectedBet({ eventId, team, odds, poolPubkey });
  };

  const handleConfirmBet = async (amount: number) => {
    if (!selectedBet || !programService) return;

    try {
      setLoading(true);
      await programService.placeBet(
        selectedBet.poolPubkey,
        amount * 100, // Convert to program's decimal representation
        selectedBet.team
      );
      
      // Refresh user bets
      await fetchUserBets();
      
      setSelectedBet(null);
    } catch (error) {
      console.error('Error placing bet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimWinnings = async (betPubkey: PublicKey, poolPubkey: PublicKey) => {
    if (!programService) return;

    try {
      setLoading(true);
      await programService.claimWinnings(poolPubkey, betPubkey);
      await fetchUserBets(); // Refresh bets after claiming
    } catch (error) {
      console.error('Error claiming winnings:', error);
    } finally {
      setLoading(false);
    }
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
                {loading ? (
                  <div className="text-center py-8">Loading events...</div>
                ) : (
                  events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onPlaceBet={(team, odds) => 
                        handlePlaceBet(event.id, team, odds, event.poolPubkey)
                      }
                    />
                  ))
                )}
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
                        {bet.betPubkey && (
                          <button
                            onClick={() => handleClaimWinnings(bet.betPubkey, events.find(e => e.id === bet.eventId)?.poolPubkey!)}
                            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                          >
                            Claim Winnings
                          </button>
                        )}
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
            loading={loading}
          />
        )}
      </div>
    </WalletContextProvider>
  );
}

export default App;