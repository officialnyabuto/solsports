import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaSportsBetting } from "../target/types/solana_sports_betting";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { assert } from "chai";

describe("solana-sports-betting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolanaSportsBetting as Program<SolanaSportsBetting>;
  
  let bettingPool: anchor.web3.Keypair;
  let usdcMint: PublicKey;
  let wbtcMint: PublicKey;
  let poolUsdcAccount: PublicKey;
  let poolWbtcAccount: PublicKey;
  let userUsdcAccount: PublicKey;
  let userWbtcAccount: PublicKey;
  let mockOracleFeed: anchor.web3.Keypair;

  before(async () => {
    // Create betting pool
    bettingPool = anchor.web3.Keypair.generate();
    mockOracleFeed = anchor.web3.Keypair.generate();

    // Create USDC mint
    usdcMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      6
    );

    // Create wBTC mint
    wbtcMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      provider.wallet.publicKey,
      null,
      8
    );

    // Create pool token accounts
    poolUsdcAccount = await createAccount(
      provider.connection,
      provider.wallet.payer,
      usdcMint,
      bettingPool.publicKey
    );

    poolWbtcAccount = await createAccount(
      provider.connection,
      provider.wallet.payer,
      wbtcMint,
      bettingPool.publicKey
    );

    // Create user token accounts
    userUsdcAccount = await createAccount(
      provider.connection,
      provider.wallet.payer,
      usdcMint,
      provider.wallet.publicKey
    );

    userWbtcAccount = await createAccount(
      provider.connection,
      provider.wallet.payer,
      wbtcMint,
      provider.wallet.publicKey
    );

    // Mint tokens to user
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      usdcMint,
      userUsdcAccount,
      provider.wallet.publicKey,
      1000000000
    );

    await mintTo(
      provider.connection,
      provider.wallet.payer,
      wbtcMint,
      userWbtcAccount,
      provider.wallet.publicKey,
      100000000
    );
  });

  it("Initializes betting pool with multiple tokens", async () => {
    const eventId = "TEST_EVENT_1";
    const homeTeam = "Team A";
    const awayTeam = "Team B";
    const startTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const homeOdds = 200; // 2.00x
    const awayOdds = 150; // 1.50x
    const drawOdds = 300; // 3.00x

    const acceptedTokens = [
      { mint: usdcMint, decimals: 6 },
      { mint: wbtcMint, decimals: 8 }
    ];

    await program.methods
      .initializeBettingPool(
        eventId,
        homeTeam,
        awayTeam,
        new anchor.BN(startTime),
        new anchor.BN(homeOdds),
        new anchor.BN(awayOdds),
        new anchor.BN(drawOdds),
        acceptedTokens
      )
      .accounts({
        bettingPool: bettingPool.publicKey,
        authority: provider.wallet.publicKey,
        oraclePriceFeed: mockOracleFeed.publicKey,
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
    assert.equal(pool.acceptedTokens.length, 2);
    assert.equal(pool.acceptedTokens[0].mint.toBase58(), usdcMint.toBase58());
    assert.equal(pool.acceptedTokens[1].mint.toBase58(), wbtcMint.toBase58());
  });

  it("Places bet with USDC", async () => {
    const bet = anchor.web3.Keypair.generate();
    const amount = new anchor.BN(100000000); // 100 USDC

    await program.methods
      .placeBet(amount, { home: {} }, 0)
      .accounts({
        bettingPool: bettingPool.publicKey,
        bet: bet.publicKey,
        bettor: provider.wallet.publicKey,
        betTokenMint: usdcMint,
        bettorTokenAccount: userUsdcAccount,
        poolTokenAccount: poolUsdcAccount,
        oraclePriceFeed: mockOracleFeed.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([bet])
      .rpc();

    const betAccount = await program.account.bet.fetch(bet.publicKey);
    assert.equal(betAccount.amount.toNumber(), amount.toNumber());
    assert.equal(betAccount.tokenIndex, 0);
  });

  it("Places bet with wBTC", async () => {
    const bet = anchor.web3.Keypair.generate();
    const amount = new anchor.BN(1000000); // 0.01 BTC

    await program.methods
      .placeBet(amount, { away: {} }, 1)
      .accounts({
        bettingPool: bettingPool.publicKey,
        bet: bet.publicKey,
        bettor: provider.wallet.publicKey,
        betTokenMint: wbtcMint,
        bettorTokenAccount: userWbtcAccount,
        poolTokenAccount: poolWbtcAccount,
        oraclePriceFeed: mockOracleFeed.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([bet])
      .rpc();

    const betAccount = await program.account.bet.fetch(bet.publicKey);
    assert.equal(betAccount.amount.toNumber(), amount.toNumber());
    assert.equal(betAccount.tokenIndex, 1);
  });

  it("Settles event using oracle data", async () => {
    await program.methods
      .settleEvent()
      .accounts({
        bettingPool: bettingPool.publicKey,
        authority: provider.wallet.publicKey,
        oraclePriceFeed: mockOracleFeed.publicKey,
      })
      .rpc();

    const pool = await program.account.bettingPool.fetch(bettingPool.publicKey);
    assert.isTrue(pool.isSettled);
  });
});