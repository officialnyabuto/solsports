import React, { useState } from 'react';
import { X, Coins } from 'lucide-react';
import Decimal from 'decimal.js';
import { TokenSelector, Token } from './TokenSelector';

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  selectedTeam: string;
  odds: number;
  onConfirmBet: (amount: number, token: Token) => void;
  loading: boolean;
}

export const BettingModal: React.FC<BettingModalProps> = ({
  isOpen,
  onClose,
  selectedTeam,
  odds,
  onConfirmBet,
  loading,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<Token>({
    symbol: 'USDC',
    name: 'USD Coin',
    chainId: 'solana'
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const handleSubmit = () => {
    if (!amount || new Decimal(amount).lessThanOrEqualTo(0)) {
      setError('Please enter a valid amount');
      return;
    }
    onConfirmBet(parseFloat(amount), selectedToken);
  };

  if (!isOpen) return null;

  const potentialWinnings = amount ? new Decimal(amount).times(odds).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Place Bet</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50" 
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">Selected: {selectedTeam}</p>
          <p className="text-gray-600 mb-4">Odds: {odds}x</p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Token
            </label>
            <TokenSelector
              selectedToken={selectedToken}
              onTokenSelect={setSelectedToken}
              disabled={loading}
            />
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bet Amount ({selectedToken.symbol})
          </label>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
            placeholder="Enter amount"
            disabled={loading}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Potential Winnings:</p>
            <p className="text-xl font-bold text-green-600">{potentialWinnings} {selectedToken.symbol}</p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !amount || error !== ''}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Confirm Bet'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};