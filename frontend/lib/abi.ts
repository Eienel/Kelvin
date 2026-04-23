// Minimal ABI fragments for the Kelvin UI.
// Full ABIs are emitted by `forge build` into contracts/evm/out/ — here we
// copy only the methods/events we actually call.

export const positionManagerAbi = [
  {
    type: "function",
    name: "mintPosition",
    stateMutability: "nonpayable",
    inputs: [
      { name: "pair", type: "address" },
      { name: "amountX", type: "uint128" },
      { name: "amountY", type: "uint128" },
      { name: "liquidityConfigs", type: "bytes32[]" },
      { name: "to", type: "address" },
      { name: "name", type: "string" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "burnPosition",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "to", type: "address" },
    ],
    outputs: [
      { name: "amountX", type: "uint128" },
      { name: "amountY", type: "uint128" },
    ],
  },
  {
    type: "function",
    name: "collectFees",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "to", type: "address" },
    ],
    outputs: [
      { name: "feesX", type: "uint128" },
      { name: "feesY", type: "uint128" },
    ],
  },
  {
    type: "function",
    name: "rebalance",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "newConfigs", type: "bytes32[]" },
    ],
    outputs: [
      { name: "newX", type: "uint128" },
      { name: "newY", type: "uint128" },
    ],
  },
  {
    type: "function",
    name: "setName",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "name", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "pendingFees",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "feesX", type: "uint128" },
      { name: "feesY", type: "uint128" },
    ],
  },
  {
    type: "function",
    name: "getPosition",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "pair", type: "address" },
          { name: "binIds", type: "uint24[]" },
          { name: "liquidity", type: "uint256[]" },
          { name: "principalX", type: "uint128" },
          { name: "principalY", type: "uint128" },
          { name: "feesCollectedX", type: "uint128" },
          { name: "feesCollectedY", type: "uint128" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "initName",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenOfOwnerByIndex",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "event",
    name: "FeesCollected",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "feesX", type: "uint128", indexed: false },
      { name: "feesY", type: "uint128", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PositionMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "pair", type: "address", indexed: true },
      { name: "amountX", type: "uint128", indexed: false },
      { name: "amountY", type: "uint128", indexed: false },
    ],
  },
] as const;

export const lbPairAbi = [
  {
    type: "function",
    name: "getTokenX",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "getTokenY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "getActiveId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint24" }],
  },
  {
    type: "function",
    name: "getBinStep",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint16" }],
  },
  {
    type: "function",
    name: "getBin",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint24" }],
    outputs: [
      { name: "reserveX", type: "uint128" },
      { name: "reserveY", type: "uint128" },
    ],
  },
  {
    type: "function",
    name: "getReserves",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "reserveX", type: "uint128" },
      { name: "reserveY", type: "uint128" },
    ],
  },
  {
    type: "function",
    name: "swap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "swapForY", type: "bool" },
      { name: "to", type: "address" },
    ],
    outputs: [{ name: "amountsOut", type: "bytes32" }],
  },
  {
    type: "event",
    name: "Swap",
    inputs: [
      { name: "sender", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "id", type: "uint24", indexed: false },
      { name: "amountsIn", type: "bytes32", indexed: false },
      { name: "amountsOut", type: "bytes32", indexed: false },
      { name: "volatilityAccumulator", type: "uint24", indexed: false },
      { name: "totalFees", type: "bytes32", indexed: false },
      { name: "protocolFees", type: "bytes32", indexed: false },
    ],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
