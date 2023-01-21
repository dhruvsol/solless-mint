import { Connection, Keypair, TransactionInstruction } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import {
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { encode, decode } from "bs58";
import {
  createCreateMasterEditionV3Instruction,
  createCreateMetadataAccountV2Instruction,
  DataV2,
} from "@metaplex-foundation/mpl-token-metadata";
import { RPC_ENDPOINT } from "./contants";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
export const createMint = async (userKey: String) => {
  const connection = new Connection(RPC_ENDPOINT);
  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );
  const adminKeypair = Keypair.fromSecretKey(
    decode(process.env.NEXT_PUBLIC_KEY as string)
  );

  const adminWallet = new NodeWallet(adminKeypair);

  const user = new anchor.web3.PublicKey(userKey);

  const mintKey = anchor.web3.Keypair.generate();

  const lamports = await connection.getMinimumBalanceForRentExemption(
    MINT_SIZE
  );

  let wallet_ata = await getAssociatedTokenAddress(mintKey.publicKey, user);

  const data: DataV2 = {
    name: "Test",
    symbol: "abc",
    uri: "https://ipfs.io/ipfs/QmXkixwBfUdVujPvk3JW1nn9akg7EaYXiNBBdQKAeGfpim",
    sellerFeeBasisPoints: 10000,
    creators: [
      {
        address: adminWallet.publicKey,
        verified: true,
        share: 100,
      },
    ],
    collection: null,
    uses: null,
  };

  const args = {
    data,
    isMutable: true,
  };
  const [metadatakey] = await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintKey.publicKey.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  const [masterKey] = await anchor.web3.PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintKey.publicKey.toBuffer(),
      Buffer.from("edition"),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );

  const instructions: TransactionInstruction[] = [];

  instructions.push(
    ...[
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: adminWallet.publicKey,
        newAccountPubkey: mintKey.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(mintKey.publicKey, 0, user, user),
      createAssociatedTokenAccountInstruction(
        adminWallet.publicKey,
        wallet_ata,
        user,
        mintKey.publicKey
      ),
      createMintToInstruction(mintKey.publicKey, wallet_ata, user, 1),
    ]
  );

  const createMetadataV2 = createCreateMetadataAccountV2Instruction(
    {
      metadata: metadatakey,
      mint: mintKey.publicKey,
      mintAuthority: user,
      payer: adminWallet.publicKey,
      updateAuthority: adminWallet.publicKey,
    },
    {
      createMetadataAccountArgsV2: args,
    }
  );
  instructions.push(createMetadataV2);

  const createMasterEditionV3 = createCreateMasterEditionV3Instruction(
    {
      edition: masterKey,
      mint: mintKey.publicKey,
      updateAuthority: adminWallet.publicKey,
      mintAuthority: user,
      payer: adminWallet.publicKey,
      metadata: metadatakey,
    },
    {
      createMasterEditionArgs: {
        maxSupply: new anchor.BN(0),
      },
    }
  );

  instructions.push(createMasterEditionV3);
  return {
    instructions,
    mintKey,
    adminKeypair,
  };
};
