import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaSportsBetting } from "../target/types/solana_sports_betting";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";

describe("solana-sports-betting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaSportsBetting as Program<SolanaSportsBetting>;
  
  let bettingPool: anchor.web3.Keypair;
  let mint: PublicKey;
  let poolTokenAccount: PublicKey;
  let userTokenAccount: PublicKey;

  before(async () => {
    // Create betting pool
    bettingPool = anchor.web3.Keypair.generate();

    // Create token mint
    mint = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      6
    );

    // Create pool token account
    poolTokenAccount = await createAccount(
      provider.connection,
      provider.wallet.payer,
      mint,
      bettingPool.publicKey
    );

    // Create user token account
    userTokenAccount = await createAccount(
      provider.connection,
      provider.wallet.payer,
      mint,
      provider.wallet.publicKey
    );

    // Mint some tokens to user
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mint,
      userTokenAccount,
      provider.wallet.publicKey,
      1000000000
    );
  });

  it("Initializes betting pool", async () => {
    const eventId = "TEST_EVENT_1";
    const homeTeam = "Team A";
    const awayTeam = "Team B";
    const startTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const homeOdds = 200; // 2.00x
    const awayOdds = 150; // 1.50x
    const drawOdds = 300; // 3.00x

    await program.methods
      .initializeBettingPool(
        eventId,
        homeTeam,
        awayTeam,
        new anchor.BN(startTime),
        new anchor.BN(homeOdds),
        new anchor.BN(awayOdds),
        new anchor.BN(drawOdds)
      )
      .accounts({
        bettingPool: bettingPool.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettingPool])
      .rpc();

    const pool = await program.account.bettingPool.fetch(bettingPool.publicKey);
    assert.equal(pool.eventId, eventId);
    assert.equal(pool.homeTeam, homeTeam);
    assert.equal(pool.awayTeam, awayTeam);
    assert.equal(pool.startTime.toNumber(), startTime);
    assert.equal(pool.homeOdds.toNumber(), homeOdds);
    assert.equal(pool.awayOdds.toNumber(), awayOdds);
    assert.equal(pool.drawOdds.toNumber(), drawOdds);
  });

  // Add more tests for placing bets, settling events, and claiming winnings
});