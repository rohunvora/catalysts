import { Token } from "@/types/catalyst";

// Real Solana token mints - verified addresses
export const TOKENS: Token[] = [
  {
    chain: "solana",
    mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    symbol: "BONK",
    name: "Bonk",
    logo: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I"
  },
  {
    chain: "solana",
    mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    symbol: "JUP",
    name: "Jupiter",
    logo: "https://static.jup.ag/jup/icon.png"
  },
  {
    chain: "solana",
    mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    symbol: "WIF",
    name: "dogwifhat",
    logo: "https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betiez7kzdgp7ol53v7ue.ipfs.nftstorage.link"
  },
  {
    chain: "solana",
    mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    symbol: "ORCA",
    name: "Orca",
    logo: "https://arweave.net/vBJVb-hLVIaEIXq3GCj3BvFIK1xRk2q1AMQ3XugS6rk"
  },
  {
    chain: "solana",
    mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
    symbol: "POPCAT",
    name: "Popcat",
    logo: "https://bafkreidvkvuzyslw5jh5z242lgzwzhbi2kxxnpkic5wsvyno5ikvpr7reu.ipfs.nftstorage.link"
  }
];

export const TOKEN_MAP = new Map(TOKENS.map(t => [t.mint, t]));

export function getTokenByMint(mint: string): Token | undefined {
  return TOKEN_MAP.get(mint);
}

export function getTokenBySymbol(symbol: string): Token | undefined {
  return TOKENS.find(t => t.symbol.toLowerCase() === symbol.toLowerCase());
}

