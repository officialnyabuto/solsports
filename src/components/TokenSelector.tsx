import React, { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { MAINNET_TOKENS } from "@wormhole-foundation/connect-sdk";
import { useWormhole } from '../hooks/useWormhole';

export interface Token {
  symbol: string;
  name: string;
  logo?: string;
  chainId: string;
  address: string;
  decimals: number;
}

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
  const [isOpen, setIsOpen] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const wormhole = useWormhole();

  useEffect(() => {
    const loadTokens = async () => {
      if (!wormhole) return;
      
      const supportedTokens = wormhole.getSupportedTokens();
      const tokenList = Object.values(supportedTokens).map(token => ({
        symbol: token.symbol,
        name: token.name,
        chainId: token.chain,
        address: token.address,
        decimals: token.decimals
      }));
      
      setTokens(tokenList);
    };

    loadTokens();
  }, [wormhole]);

  useEffect(() => {
    const loadBalances = async () => {
      if (!wormhole) return;
      
      const newBalances: Record<string, string> = {};
      for (const token of tokens) {
        try {
          const balance = await wormhole.getTokenBalance(token.address);
          newBalances[token.address] = balance.uiAmount?.toString() || '0';
        } catch (error) {
          console.error(`Error loading balance for ${token.symbol}:`, error);
          newBalances[token.address] = '0';
        }
      }
      
      setBalances(newBalances);
    };

    if (tokens.length > 0) {
      loadBalances();
    }
  }, [tokens, wormhole]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
      >
        <div className="flex items-center space-x-2">
          <Coins className="w-5 h-5" />
          <span>{selectedToken.symbol}</span>
        </div>
        <span className="text-sm text-gray-500">
          {balances[selectedToken.address] || '0'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {tokens.map((token) => (
            <button
              key={`${token.chainId}-${token.address}`}
              onClick={() => {
                onTokenSelect(token);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Coins className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-gray-500">{token.name}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {balances[token.address] || '0'}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Chain: {token.chainId}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};