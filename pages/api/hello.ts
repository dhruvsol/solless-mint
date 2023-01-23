// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  Connection,
  Keypair,
  NonceAccount,
  SystemProgram,
} from "@solana/web3.js";
import type { NextApiRequest, NextApiResponse } from "next";
import { RPC_ENDPOINT } from "../../utils/contants";
import * as anchor from "@project-serum/anchor";
import { sendSPL } from "../../utils/token";
import createDurableNonce from "../../utils/nonce";
import { decode, encode } from "bs58";
type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = req.body;
  const connection = new Connection(RPC_ENDPOINT, "finalized");
  const adminKeypair = Keypair.fromSecretKey(
    decode(process.env.NEXT_PUBLIC_KEY as string)
  );
  const trx = await sendSPL(
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    new anchor.web3.PublicKey(address),
    new anchor.web3.PublicKey("GSSLu9CqY2GSoTs7Tx4247WXiHiaofobtwfJN5qcu4hA"),
    10,
    connection
  );
  const { nonceAccount, nonceAccountAuth } = await createDurableNonce(
    adminKeypair
  );
  const ixx = SystemProgram.nonceAdvance({
    noncePubkey: nonceAccount.publicKey,
    authorizedPubkey: nonceAccountAuth.publicKey,
  });
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
  const transaction = new anchor.web3.Transaction();

  transaction.recentBlockhash = nonce;
  transaction.feePayer = adminKeypair.publicKey;
  transaction.add(...(trx as any));
  transaction.add(ixx);

  console.log(nonceAccountAuth.publicKey.toBase58(), "--nonce account auth");

  transaction.partialSign(adminKeypair, nonceAccountAuth);
  const txnserialized = encode(transaction.serializeMessage());
  const sigs = transaction.signatures.map((s) => {
    console.log(s.signature);

    return {
      key: s.publicKey.toBase58(),
      signature: s.signature ? encode(s.signature) : null,
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
}
