import { CHAIN_ID_SOLANA, attestFromSolana, createWrappedOnSolana } from "@certusone/wormhole-sdk";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";

export class WormholeService {
  private connection: Connection;
  private wallet: AnchorWallet;

  constructor(connection: Connection, wallet: AnchorWallet) {
    this.connection = connection;
    this.wallet = wallet;
  }

  async wrapToken(
    sourceChainTokenAddress: string,
    amount: number
  ) {
    try {
      // Create wrapped version of the token on Solana
      const wrappedTokenAddress = await createWrappedOnSolana(
        this.connection,
        CHAIN_ID_SOLANA,
        this.wallet.publicKey.toString(),
        sourceChainTokenAddress
      );

      // Attest the token
      const attestTx = await attestFromSolana(
        this.connection,
        this.wallet.publicKey.toString(),
        new PublicKey(sourceChainTokenAddress)
      );

      // Sign and send the transaction
      const transaction = Transaction.from(attestTx.transaction);
      const signature = await this.wallet.signTransaction(transaction);
      await this.connection.sendRawTransaction(signature.serialize());

      return wrappedTokenAddress;
    } catch (error) {
      console.error("Error wrapping token:", error);
      throw error;
    }
  }
}