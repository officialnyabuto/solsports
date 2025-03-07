import React from 'react';
import { Coins } from 'lucide-react';

export interface Token {
  symbol: string;
  name: string;
  logo?: string;
  chainId: string;
}

const SUPPORTED_TOKENS: Token[] = [
  { symbol: 'USDC', name: 'USD Coin', chainId: 'solana' },
  { symbol: 'wBTC', name: 'Wrapped Bitcoin', chainId: 'bitcoin' },
  { symbol: 'wETH', name: 'Wrapped Ethereum', chainId: 'ethereum' },
];

interface TokenSelectorProps {
  selectedToken: Token;
  onTokenSelect: (token: Token) => void;
  disabled?: boolean;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onTokenSelect,
  disabled
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center space-x-2 bg-white border rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
      >
        <Coins className="w-5 h-5" />
        <span>{selectedToken.symbol}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-48 bg-white border rounded-lg shadow-lg z-50">
          {SUPPORTED_TOKENS.map((token) => (
            <button
              key={token.symbol}
              onClick={() => {
                onTokenSelect(token);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5" />
                <div>
                  <div className="font-medium">{token.symbol}</div>
                  <div className="text-sm text-gray-500">{token.name}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};