"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import {
  InterwovenKitProvider,
  TESTNET,
  initiaPrivyWalletConnector,
  injectStyles,
} from "@initia/interwovenkit-react";
// The package ships its CSS as a string; injectStyles mounts it once.
// @ts-expect-error — shipped as a raw string module.
import styles from "@initia/interwovenkit-react/styles.js";
import { kelvinChainId } from "@/lib/initia";

injectStyles(styles);

// Wagmi is required by InterwovenKit even though we don't use its
// mainnet connector. `initiaPrivyWalletConnector` drives Google / social
// login; it appears as a connector in the wagmi config.
const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Initia blocks tick at ~100ms. A 1.5s stale time keeps the UI
      // lively without hammering the RPC; tx-sensitive reads override.
      staleTime: 1_500,
      refetchInterval: 2_000,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider
          {...TESTNET}
          defaultChainId={kelvinChainId}
          // Auto-sign is scoped to the Kelvin rollup + EVM MsgCall.
          // Any direct transfer, staking, or outbound bridge tx still
          // pops a confirmation — sessions only cover in-app rebalancing.
          enableAutoSign={{ [kelvinChainId]: ["/minievm.evm.v1.MsgCall"] }}
          autoSignFeePolicy={{
            [kelvinChainId]: {
              allowedFeeDenoms: ["uinit"],
              gasMultiplier: 1.2,
            },
          }}
        >
          {children}
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
