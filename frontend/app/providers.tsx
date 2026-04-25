"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import {
  InterwovenKitProvider,
  TESTNET,
  initiaPrivyWalletConnector,
  injectStyles,
} from "@initia/interwovenkit-react";
import styles from "@initia/interwovenkit-react/styles.js";
import { kelvinChainId } from "@/lib/initia";

const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1_500,
      refetchInterval: 2_000,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // InterwovenKit's injectStyles touches `document`, and several wallet
  // connectors poke at `window`. Defer the whole subtree until after
  // hydration so SSR doesn't try to render any of it.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    injectStyles(styles);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider
          {...TESTNET}
          defaultChainId="initiation-2"
        >
          {children}
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
