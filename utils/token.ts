import {
  PublicKey,
  Connection,
  Transaction,
  clusterApiUrl,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from "@solana/spl-token";

export const sendSPL = async (
  mint: string,
  fromPubKey: PublicKey,
  toPubKey: PublicKey,
  amount: number,
  connection: Connection
) => {
  try {
    console.log(mint, fromPubKey, toPubKey, amount);

    const token = new PublicKey(mint);
    const fromTokenAccount = await getAssociatedTokenAddress(token, fromPubKey);
    const toTokenAccount = await getAssociatedTokenAddress(token, toPubKey);
    const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount);
    const ix: TransactionInstruction[] = [];
    // Add create token account instruction if source account not created
    if (!toTokenAccountInfo) {
      ix.push(
        createAssociatedTokenAccountInstruction(
          fromPubKey,
          toTokenAccount,
          toPubKey,
          token
        )
      );
    }

    ix.push(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPubKey,
        Number(amount) * 1000000
      )
    );
    // const { blockhash } = await connection.getLatestBlockhash();
    // transaction.recentBlockhash = blockhash;
    // transaction.feePayer = fromPubKey;

    return ix;
  } catch (e) {
    console.log("Error in Send SPL function:", e);
  }
};
export const sendSOL = async (
  fromPubKey: PublicKey,
  toPubKey: PublicKey,
  amount: number
) => {
  const solTransfer = SystemProgram.transfer({
    fromPubkey: fromPubKey,
    toPubkey: toPubKey,
    lamports: LAMPORTS_PER_SOL * amount,
  });
  return solTransfer;
};
