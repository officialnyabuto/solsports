import {
  ChainId,
  TokenId,
  WormholeConnect,
  MAINNET_CHAINS,
  MAINNET_TOKENS
} from "@wormhole-foundation/connect-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";

export class WormholeService {
  private wormhole: WormholeConnect;
  private connection: Connection;
  private wallet: AnchorWallet;

  constructor(connection: Connection, wallet: AnchorWallet) {
    this.connection = connection;
    this.wallet = wallet;
    this.wormhole = new WormholeConnect();
  }

  async transferToken(
    sourceChain: ChainId,
    sourceToken: TokenId,
    amount: bigint,
    destinationAddress: string
  ) {
    try {
      const transfer = await this.wormhole.transfer({
        source: {
          chain: sourceChain,
          token: sourceToken,
          amount: amount,
        },
        destination: {
          chain: MAINNET_CHAINS.solana,
          address: destinationAddress,
        },
        route: "bridge",
      });

      const receipt = await transfer.wait();
      return receipt;
    } catch (error) {
      console.error("Error in token transfer:", error);
      throw error;
    }
  }

  async getWrappedToken(sourceChain: ChainId, sourceToken: TokenId) {
    try {
      const wrappedToken = await this.wormhole.getWrappedToken({
        sourceChain,
        sourceToken,
        destinationChain: MAINNET_CHAINS.solana,
      });
      return wrappedToken;
    } catch (error) {
      console.error("Error getting wrapped token:", error);
      throw error;
    }
  }

  async getTokenBalance(tokenAddress: string) {
    try {
      const tokenPublicKey = new PublicKey(tokenAddress);
      const balance = await this.connection.getTokenAccountBalance(tokenPublicKey);
      return balance.value;
    } catch (error) {
      console.error("Error getting token balance:", error);
      throw error;
    }
  }

  getSupportedTokens() {
    return MAINNET_TOKENS;
  }
}