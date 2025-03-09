import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from '@solana/web3.js';
import { assert } from "chai";
import { WormholeService } from "../src/utils/wormhole-service";
import { MAINNET_CHAINS, MAINNET_TOKENS } from "@wormhole-foundation/connect-sdk";

describe("Wormhole Integration Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  let wormholeService: WormholeService;
  
  before(() => {
    wormholeService = new WormholeService(
      provider.connection,
      provider.wallet as any
    );
  });

  it("should get wrapped token address", async () => {
    const sourceToken = MAINNET_TOKENS.ETH;
    const wrappedToken = await wormholeService.getWrappedToken(
      MAINNET_CHAINS.ethereum,
      sourceToken
    );
    
    assert.ok(wrappedToken);
    assert.ok(wrappedToken.address);
  });

  it("should transfer tokens cross-chain", async () => {
    const sourceToken = MAINNET_TOKENS.USDC;
    const amount = BigInt(1000000); // 1 USDC
    const destinationAddress = provider.wallet.publicKey.toString();

    const receipt = await wormholeService.transferToken(
      MAINNET_CHAINS.ethereum,
      sourceToken,
      amount,
      destinationAddress
    );
    
    assert.ok(receipt);
    assert.ok(receipt.status === "completed");
  });

  it("should handle failed transfers gracefully", async () => {
    const sourceToken = MAINNET_TOKENS.USDC;
    const invalidAmount = BigInt(0);
    const destinationAddress = provider.wallet.publicKey.toString();

    try {
      await wormholeService.transferToken(
        MAINNET_CHAINS.ethereum,
        sourceToken,
        invalidAmount,
        destinationAddress
      );
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert.ok(error);
    }
  });
});