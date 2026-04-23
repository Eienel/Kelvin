"use client";
import { useCallback } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { encodeFunctionData, type Abi, type Address } from "viem";
import { kelvinChainId } from "./initia";

/**
 * Hook: send an EVM tx to a Kelvin contract via InterwovenKit.
 *
 * Uses `submitTxBlock` — no wallet popup when the user has an active
 * auto-sign session on `kelvinChainId`. Falls back to `requestTxBlock`
 * (drawer confirmation) when no session is active.
 *
 * This is the single chokepoint for writes in the app. All pages
 * go through it so the session UX stays consistent.
 */
export function useKelvinTx() {
  const kit = useInterwovenKit() as any;
  const { submitTxBlock, requestTxBlock, autoSign, initiaAddress, estimateGas } =
    kit;

  const sessionActive: boolean =
    autoSign?.expiredAtByChain?.[kelvinChainId] != null &&
    autoSign.expiredAtByChain[kelvinChainId] > Date.now();

  const send = useCallback(
    async (opts: {
      to: Address;
      abi: Abi;
      functionName: string;
      args: readonly unknown[];
      value?: bigint;
    }) => {
      const input = encodeFunctionData({
        abi: opts.abi,
        functionName: opts.functionName,
        args: opts.args as any,
      });

      const messages = [
        {
          typeUrl: "/minievm.evm.v1.MsgCall",
          value: {
            sender: initiaAddress,
            contractAddr: opts.to,
            input,
            value: opts.value ?? 0n,
          },
        },
      ];

      try {
        const gas: bigint = await estimateGas({ messages });
        const fee = {
          amount: [
            {
              denom: "uinit",
              amount: String((gas * 18n) / 10n), // ~1.8x headroom
            },
          ],
          gas: String((gas * 14n) / 10n),
        };
        if (sessionActive) {
          return await submitTxBlock({ messages, fee });
        }
        return await requestTxBlock({ messages, fee });
      } catch (e) {
        // Final fallback: let the drawer confirm.
        return await requestTxBlock({ messages });
      }
    },
    [submitTxBlock, requestTxBlock, estimateGas, initiaAddress, sessionActive]
  );

  return { send, sessionActive };
}
