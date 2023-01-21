import type { NextPage } from "next";
import { createMint } from "../utils/mint";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection } from "@solana/web3.js";
import { RPC_ENDPOINT } from "../utils/contants";
import * as anchor from "@project-serum/anchor";
const Home: NextPage = () => {
  const { publicKey, signTransaction } = useWallet();

  const getIx = async () => {
    const connection = new Connection(RPC_ENDPOINT);
    const { instructions, mintKey, adminKeypair } = await createMint(
      publicKey?.toBase58() as string
    );
    const transaction = new anchor.web3.Transaction();

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = adminKeypair.publicKey;
    transaction.add(...instructions);
    transaction.partialSign(mintKey, adminKeypair);
    const signedTx = await signTransaction!(transaction);
    const serialized_transaction = signedTx.serialize();
    const sig = await connection.sendRawTransaction(serialized_transaction);
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
