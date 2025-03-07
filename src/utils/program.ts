import { Program, AnchorProvider, web3, utils, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import idl from '../idl/solana_sports_betting.json';

export const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');

export class ProgramService {
  program: Program;
  wallet: AnchorWallet;
  connection: Connection;

  constructor(wallet: AnchorWallet, connection: Connection) {
    this.wallet = wallet;
    this.connection = connection;
    
    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    
    this.program = new Program(idl, PROGRAM_ID, provider);
  }

  async initializeBettingPool(
    eventId: string,
    homeTeam: string,
    awayTeam: string,
    startTime: number,
    homeOdds: number,
    awayOdds: number,
    drawOdds?: number
  ) {
    const bettingPool = Keypair.generate();
    
    try {
      const tx = await this.program.methods
        .initializeBettingPool(
          eventId,
          homeTeam,
          awayTeam,
          new BN(startTime),
          new BN(homeOdds),
          new BN(awayOdds),
          drawOdds ? new BN(drawOdds) : null
        )
        .accounts({
          bettingPool: bettingPool.publicKey,
          authority: this.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([bettingPool])
        .rpc();

      return { tx, bettingPool: bettingPool.publicKey };
    } catch (error) {
      console.error('Error initializing betting pool:', error);
      throw error;
    }
  }

  async placeBet(
    bettingPoolPubkey: PublicKey,
    amount: number,
    betType: 'home' | 'away' | 'draw'
  ) {
    const bet = Keypair.generate();
    const userTokenAccount = await utils.token.associatedAddress({
      mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC mint
      owner: this.wallet.publicKey
    });
    
    const poolTokenAccount = await utils.token.associatedAddress({
      mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC mint
      owner: bettingPoolPubkey
    });

    try {
      const tx = await this.program.methods
        .placeBet(
          new BN(amount),
          { [betType]: {} }
        )
        .accounts({
          bettingPool: bettingPoolPubkey,
          bet: bet.publicKey,
          bettor: this.wallet.publicKey,
          bettorTokenAccount: userTokenAccount,
          poolTokenAccount: poolTokenAccount,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([bet])
        .rpc();

      return { tx, bet: bet.publicKey };
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  async fetchBettingPools() {
    try {
      const pools = await this.program.account.bettingPool.all();
      return pools.map(pool => ({
        pubkey: pool.publicKey,
        ...pool.account,
      }));
    } catch (error) {
      console.error('Error fetching betting pools:', error);
      throw error;
    }
  }

  async fetchUserBets(userPubkey: PublicKey) {
    try {
      const bets = await this.program.account.bet.all([
        {
          memcmp: {
            offset: 8, // Discriminator size
            bytes: userPubkey.toBase58(),
          },
        },
      ]);
      return bets.map(bet => ({
        pubkey: bet.publicKey,
        ...bet.account,
      }));
    } catch (error) {
      console.error('Error fetching user bets:', error);
      throw error;
    }
  }

  async claimWinnings(
    bettingPoolPubkey: PublicKey,
    betPubkey: PublicKey
  ) {
    const poolTokenAccount = await utils.token.associatedAddress({
      mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC mint
      owner: bettingPoolPubkey
    });
    
    const winnerTokenAccount = await utils.token.associatedAddress({
      mint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC mint
      owner: this.wallet.publicKey
    });

    try {
      const tx = await this.program.methods
        .claimWinnings()
        .accounts({
          bettingPool: bettingPoolPubkey,
          bet: betPubkey,
          poolTokenAccount: poolTokenAccount,
          winnerTokenAccount: winnerTokenAccount,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        })
        .rpc();

      return tx;
    } catch (error) {
      console.error('Error claiming winnings:', error);
      throw error;
    }
  }
}