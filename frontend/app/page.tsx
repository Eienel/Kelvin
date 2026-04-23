import { PoolList } from "@/components/PoolList";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="grid-bg rounded border border-border p-6 sm:p-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="text-accent">Kelvin</span> — DLMM on Initia
        </h1>
        <p className="mt-4 max-w-3xl text-muted leading-relaxed">
          A bin-based dynamic liquidity market maker deployed as its own Initia
          appchain. Concentrated liquidity with 100 ms block times, popup-free
          rebalancing via auto-signing, and LP positions named by{" "}
          <span className="text-accent">.init</span> handle.
        </p>
        <p className="mt-2 max-w-3xl text-muted text-sm">
          The first DLMM where the AMM, the chain, and the LP are all the same
          thing.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Pools</h2>
        <PoolList />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          {
            k: "Concentrated",
            v: "Bin-based liquidity. LPs pick a price range; swappers get deeper markets there.",
          },
          {
            k: "Session UX",
            v: "One drawer, many txs. Rebalance and collect without popups for the life of the session.",
          },
          {
            k: ".init LPs",
            v: "Positions resolve to human-readable handles. Leaderboards turn into identity.",
          },
        ].map((x) => (
          <div
            key={x.k}
            className="rounded border border-border bg-panel p-4 text-sm"
          >
            <div className="text-accent mb-1 font-semibold">{x.k}</div>
            <div className="text-muted">{x.v}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
