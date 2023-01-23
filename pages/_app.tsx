import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ChakraProvider } from "@chakra-ui/react";
import { ClientWalletProvider } from "../context/walletProivder";
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <ChakraProvider>
        <ClientWalletProvider>
          <Component {...pageProps} />
        </ClientWalletProvider>
      </ChakraProvider>
    </>
  );
}

export default MyApp;
