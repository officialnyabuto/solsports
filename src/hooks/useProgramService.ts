import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { ProgramService } from '../utils/program';

export function useProgramService() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const programService = useMemo(() => {
    if (!wallet) return null;
    return new ProgramService(wallet, connection);
  }, [wallet, connection]);

  return programService;
}