import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { WormholeService } from '../utils/wormhole';

export function useWormhole() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const wormholeService = useMemo(() => {
    if (!wallet) return null;
    return new WormholeService(connection, wallet);
  }, [wallet, connection]);

  return wormholeService;
}