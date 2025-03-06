import React from 'react';
import { WalletBalance as WalletBalanceType } from '../types/betting';

interface WalletBalanceProps {
  balance: WalletBalanceType;
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ balance }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-lg font-semibold mb-2">Wallet Balance</h2>
      <div className="flex space-x-4">
        <div>
          <p className="text-sm text-gray-600">SOL</p>
          <p className="font-bold">{balance.sol}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">USDC</p>
          <p className="font-bold">{balance.usdc}</p>
        </div>
      </div>
    </div>
  );
};