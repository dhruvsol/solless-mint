/* eslint-disable react/no-unescaped-entities */
import type { NextPage } from "next";
import { createMint } from "../utils/mint";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  Connection,
  Keypair,
  Message,
  NonceAccount,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import axios from "axios";
import { RPC_ENDPOINT } from "../utils/contants";
import * as anchor from "@project-serum/anchor";
import { sendSPL } from "../utils/token";
import createDurableNonce from "../utils/nonce";
import { toast, Toaster } from "react-hot-toast";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  Link,
  Text,
  Toast,
} from "@chakra-ui/react";
import { useState } from "react";
const Home: NextPage = () => {
  const { publicKey, signTransaction } = useWallet();
  const [signature, setSignature] = useState<string>("");
  const getIx = async (token: string, amount: number) => {
    const connection = new Connection(RPC_ENDPOINT, "finalized");
    const { instructions, mintKey, adminKeypair } = await createMint(
      publicKey?.toBase58() as string
    );

    const trx = await sendSPL(
      token,
      publicKey as anchor.web3.PublicKey,
      new anchor.web3.PublicKey("GSSLu9CqY2GSoTs7Tx4247WXiHiaofobtwfJN5qcu4hA"),
      amount,
      connection
    );

    const transaction = new anchor.web3.Transaction();
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = adminKeypair.publicKey;
    transaction.add(...(trx as any));
    transaction.add(...instructions);
    transaction.partialSign(mintKey, adminKeypair);

    const signedTx = await signTransaction!(transaction);
    const serialized_transaction = signedTx.serialize();
    const sig = await connection.sendRawTransaction(serialized_transaction, {
      skipPreflight: false,
    });
    if (sig) {
      setSignature(sig);
      toast.success(
        <Flex gap="0.5rem" align="center" justify="center">
          <Link
            fontSize="1rem"
            color="#558FFF"
            href={`https://solscan.io/tx/${sig}`}
            isExternal
          >
            View on Solscan
          </Link>
        </Flex>
      );
    }
  };

  return (
    <>
      <Box height={"100vh"} w="full" bg={"black"}>
        <Box display={"flex"} px={10} py={6} justifyContent="space-between">
          <Text color={"whiteAlpha.800"} fontWeight={700} fontSize={"2rem"}>
            Solless <span style={{ color: "#31d1bf" }}>Mint</span>
          </Text>
          <WalletMultiButton />
        </Box>
        <Box
          display={"flex"}
          justifyContent="center"
          flexDir={"column"}
          alignItems={"center"}
        >
          <Text
            fontSize={"6rem"}
            align="center"
            fontWeight={600}
            color={"white"}
          >
            Don't have SOL
            <br />
            <span
              style={{
                color: "#31d1bf",
                paddingRight: "0.5rem",
                paddingLeft: "0.5rem",
              }}
            >
              Mint
            </span>
            <br />
            on Solless
          </Text>
          <Alert
            w="30rem"
            rounded={"md"}
            mb="1.5rem"
            bg="#261526"
            status="error"
          >
            <AlertIcon color="#DB79DB" />
            <AlertDescription fontSize="sm" color="#DEDEDE">
              The wallet doesnt need to have any sol in them you can mint with
              anything. Currently we have msol, bsol & BONK in the house
            </AlertDescription>
          </Alert>
          <Box display={"flex"} gap={6}>
            <Button
              onClick={() => {
                getIx("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", 0.01);
              }}
            >
              Try it out with 0.01 msol
            </Button>
            <Button
              onClick={() => {
                getIx("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", 100);
              }}
            >
              Try it out with 10 BONK
            </Button>
            <Button
              onClick={() => {
                getIx("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1", 0.01);
              }}
            >
              Try it out with 0.01 bsol
            </Button>
          </Box>
        </Box>
        <Toaster />
      </Box>
    </>
  );
};
export default Home;
