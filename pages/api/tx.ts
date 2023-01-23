import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  NonceAccount,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import base58 from "bs58";
import type { NextApiRequest, NextApiResponse } from "next";
import { RPC_ENDPOINT } from "../../utils/contants";
import createDurableNonce from "../../utils/nonce";

type Data = {
  result: "success" | "error";
  message:
    | {
        tx: string;
        signatures: ({ key: string; signature: string | null } | null)[];
      }
    | { error: Error };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { address } = req.body;
  const mint = Keypair.generate();
  const connection = new Connection(RPC_ENDPOINT, "finalized");
  const wallet = Keypair.fromSecretKey(
    base58.decode(process.env.NEXT_PUBLIC_KEY!)
  );

  const user = new PublicKey(address);
  const { nonceAccount, nonceAccountAuth } = await createDurableNonce(wallet);

  let ata = await getAssociatedTokenAddress(
    mint.publicKey, // mint
    user // owner
  );
  const txn = new Transaction().add(
    SystemProgram.nonceAdvance({
      noncePubkey: nonceAccount.publicKey,
      authorizedPubkey: nonceAccountAuth.publicKey,
    }),
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mint.publicKey,
      space: MINT_SIZE,
      lamports: await getMinimumBalanceForRentExemptMint(connection),
      programId: TOKEN_PROGRAM_ID,
    }),
    // init mint account
    createInitializeMintInstruction(
      mint.publicKey, // mint pubkey
      0, // decimals
      wallet.publicKey, // mint authority
      wallet.publicKey // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
    ),
    createAssociatedTokenAccountInstruction(
      wallet.publicKey, // payer
      ata, // ata
      user, // owner
      mint.publicKey // mint
    ),
    createMintToCheckedInstruction(
      mint.publicKey, // mint
      ata, // receiver (should be a token account)
      wallet.publicKey, // mint authority
      1, // amount. if your decimals is 8, you mint 10^8 for 1 token.
      0 // decimals
      // [signer1, signer2 ...], // only multisig account will use
    )
  );
  let nonce: string | null = null;
  while (nonce === null) {
    const connection = new Connection(RPC_ENDPOINT!, "recent");
    let nonceAccountInfo = await connection.getAccountInfo(
      nonceAccount.publicKey,
      {
        commitment: "recent",
      }
    );
    console.log(nonceAccountInfo);
    if (nonceAccountInfo === null) {
      continue;
    } else {
      let nonceAccountNonce = NonceAccount.fromAccountData(
        nonceAccountInfo?.data
      );
      nonce = nonceAccountNonce.nonce;
    }
  }

  console.log(
    "check",
    user.toBase58(),
    ata.toBase58(),
    mint.publicKey.toBase58(),
    nonce
  );

  if (!txn) res.json({ result: "error", message: { error: Error("no txn") } });
  if (!process.env.NEXT_PUBLIC_KEY)
    res
      .status(200)
      .json({ result: "error", message: { error: Error("no wallet env") } });
  try {
    txn.recentBlockhash = nonce;
    console.log("recent", txn.recentBlockhash);
    txn.feePayer = wallet.publicKey;

    txn.partialSign(mint, wallet, nonceAccountAuth);

    const txnserialized = base58.encode(txn.serializeMessage());

    const sigs = txn.signatures.map((s) => {
      return {
        key: s.publicKey.toBase58(),
        signature: s.signature ? base58.encode(s.signature) : null,
      };
    });
    console.log(sigs);
    res.json({
      result: "success",
      message: {
        tx: txnserialized,
        signatures: sigs,
      },
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ result: "error", message: { error: error as Error } });
  }
}
