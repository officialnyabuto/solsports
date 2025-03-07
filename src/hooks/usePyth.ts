import { useConnection } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { PythService } from '../utils/pyth';

export function usePyth() {
  const { connection } = useConnection();

  const pythService = useMemo(() => {
    return new PythService(connection);
  }, [connection]);

  return pythService;
}