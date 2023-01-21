import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import { ClientWalletProvider } from "../context/walletProivder";
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <ClientWalletProvider>
        <Component {...pageProps} />
      </ClientWalletProvider>
    </>
  );
}

export default MyApp;
