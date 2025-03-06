import React, { useState } from 'react';
import { X } from 'lucide-react';
import Decimal from 'decimal.js';

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  selectedTeam: string;
  odds: number;
  onConfirmBet: (amount: number) => void;
}

export const BettingModal: React.FC<BettingModalProps> = ({
  isOpen,
  onClose,
  selectedTeam,
  odds,
  onConfirmBet,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

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
    onConfirmBet(parseFloat(amount));
    onClose();
  };

  if (!isOpen) return null;

  const potentialWinnings = amount ? new Decimal(amount).times(odds).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Place Bet</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">Selected: {selectedTeam}</p>
          <p className="text-gray-600 mb-4">Odds: {odds}x</p>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bet Amount (USDC)
          </label>
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter amount"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Potential Winnings:</p>
            <p className="text-xl font-bold text-green-600">{potentialWinnings} USDC</p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Confirm Bet
          </button>
        </div>
      </div>
    </div>
  );
};