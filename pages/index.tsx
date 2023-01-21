import type { NextPage } from "next";
import { createMint } from "../utils/mint";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, TransactionInstruction } from "@solana/web3.js";
import { RPC_ENDPOINT } from "../utils/contants";
import * as anchor from "@project-serum/anchor";
import { sendSPL } from "../utils/token";
const Home: NextPage = () => {
  const { publicKey, signTransaction } = useWallet();

  const getIx = async () => {
    const connection = new Connection(RPC_ENDPOINT);
    const { instructions, mintKey, adminKeypair } = await createMint(
      publicKey?.toBase58() as string
    );
    const trx = await sendSPL(
      "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      publicKey as anchor.web3.PublicKey,
      new anchor.web3.PublicKey("GSSLu9CqY2GSoTs7Tx4247WXiHiaofobtwfJN5qcu4hA"),
      100,
      connection
    );
    const transaction = new anchor.web3.Transaction();
    // instructions.push(trx as any);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = adminKeypair.publicKey;
    transaction.add(...(trx as any));
    // transaction.add(...instructions);
    // transaction.partialSign(mintKey, adminKeypair);
    transaction.partialSign(adminKeypair);
    const signedTx = await signTransaction!(transaction);
    const serialized_transaction = signedTx.serialize();
    const sig = await connection.sendRawTransaction(serialized_transaction, {
      skipPreflight: true,
    });
    console.log(sig);
  };
  return (
    <>
      <WalletMultiButton />

      <button onClick={getIx}>Click to mint</button>
    </>
  );
};
export default Home;
