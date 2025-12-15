// Dynamic Token Registry - Auto-discover and track any Solana token
// No more hard-coded token lists!

import { config } from "../config";
import { getJupiterTokenList, JupiterToken } from "./jupiter";

// ============================================================================
// Types
// ============================================================================

export interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  
  // Discovery metadata
  discoveredAt: string;
  lastSeen: string;
  source: "jupiter" | "dexscreener" | "user" | "helius";
  
  // Market data (cached)
  priceUsd?: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  liquidity?: number;
  
  // Social data (cached)
  twitterHandle?: string;
  website?: string;
  
  // Verification status
  verified: boolean;
  tags?: string[];
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  pairCreatedAt: number;
  info?: {
    imageUrl?: string;
    websites?: Array<{ url: string }>;
    socials?: Array<{ type: string; url: string }>;
  };
}

export interface DexScreenerResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[] | null;
}

// ============================================================================
// In-Memory Cache (would use Redis in production)
// ============================================================================

const tokenCache = new Map<string, { data: TokenInfo; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for token info
const MARKET_DATA_TTL = 30 * 1000; // 30 seconds for market data

// Jupiter verified tokens (loaded once)
let jupiterTokens: Map<string, JupiterToken> | null = null;
let jupiterTokensExpiry = 0;

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get token info - the main entry point
 * Automatically discovers token from multiple sources
 */
export async function getTokenInfo(mint: string): Promise<TokenInfo | null> {
  // Check cache first
  const cached = tokenCache.get(mint);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  // Try to discover from multiple sources
  let tokenInfo: TokenInfo | null = null;
  
  // 1. Try Jupiter (verified tokens)
  tokenInfo = await discoverFromJupiter(mint);
  
  // 2. If not in Jupiter, try DexScreener
  if (!tokenInfo) {
    tokenInfo = await discoverFromDexScreener(mint);
  }
  
  // 3. If still not found, try on-chain metadata
  if (!tokenInfo) {
    tokenInfo = await discoverFromChain(mint);
  }
  
  // Cache the result (even null results to avoid repeated lookups)
  if (tokenInfo) {
    tokenCache.set(mint, {
      data: tokenInfo,
      expires: Date.now() + CACHE_TTL,
    });
  }
  
  return tokenInfo;
}

/**
 * Get token with fresh market data
 */
export async function getTokenWithMarketData(mint: string): Promise<TokenInfo | null> {
  const token = await getTokenInfo(mint);
  if (!token) return null;
  
  // Fetch fresh market data from DexScreener
  const marketData = await fetchDexScreenerData(mint);
  
  if (marketData) {
    token.priceUsd = parseFloat(marketData.priceUsd);
    token.marketCap = marketData.fdv;
    token.volume24h = marketData.volume.h24;
    token.priceChange24h = marketData.priceChange.h24;
    token.liquidity = marketData.liquidity.usd;
    
    // Update cache
    tokenCache.set(mint, {
      data: token,
      expires: Date.now() + MARKET_DATA_TTL,
    });
  }
  
  return token;
}

/**
 * Search for tokens by symbol
 */
export async function searchTokensBySymbol(symbol: string): Promise<TokenInfo[]> {
  const results: TokenInfo[] = [];
  
  // Search Jupiter list
  await loadJupiterTokens();
  if (jupiterTokens) {
    for (const [mint, token] of jupiterTokens) {
      if (token.symbol.toLowerCase().includes(symbol.toLowerCase())) {
        results.push(jupiterTokenToInfo(token));
      }
    }
  }
  
  // Search DexScreener
  try {
    const response = await fetch(
      `${config.dexScreener.apiUrl}/latest/dex/search?q=${encodeURIComponent(symbol)}`,
      {
        headers: { "Accept": "application/json" },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.pairs) {
        for (const pair of data.pairs.slice(0, 10)) {
          if (pair.chainId === "solana") {
            const info = dexScreenerPairToInfo(pair);
            // Avoid duplicates
            if (!results.find(r => r.mint === info.mint)) {
              results.push(info);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("DexScreener search error:", error);
  }
  
  return results;
}

/**
 * Get trending/new tokens from DexScreener
 */
export async function getTrendingTokens(): Promise<TokenInfo[]> {
  try {
    const response = await fetch(
      `${config.dexScreener.apiUrl}/token-boosts/top/v1`,
      {
        headers: { "Accept": "application/json" },
      }
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    const solanaTokens = data.filter((t: { chainId: string }) => t.chainId === "solana");
    
    // Get full info for each token
    const results: TokenInfo[] = [];
    for (const token of solanaTokens.slice(0, 20)) {
      const info = await getTokenInfo(token.tokenAddress);
      if (info) {
        results.push(info);
      }
    }
    
    return results;
    
  } catch (error) {
    console.error("Error fetching trending tokens:", error);
    return [];
  }
}

/**
 * Get new token launches
 */
export async function getNewTokens(limit: number = 20): Promise<TokenInfo[]> {
  try {
    const response = await fetch(
      `${config.dexScreener.apiUrl}/token-boosts/latest/v1`,
      {
        headers: { "Accept": "application/json" },
      }
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    const solanaTokens = data.filter((t: { chainId: string }) => t.chainId === "solana");
    
    const results: TokenInfo[] = [];
    for (const token of solanaTokens.slice(0, limit)) {
      const info = await getTokenInfo(token.tokenAddress);
      if (info) {
        results.push(info);
      }
    }
    
    return results;
    
  } catch (error) {
    console.error("Error fetching new tokens:", error);
    return [];
  }
}

// ============================================================================
// Discovery Functions
// ============================================================================

async function loadJupiterTokens(): Promise<void> {
  if (jupiterTokens && jupiterTokensExpiry > Date.now()) {
    return;
  }
  
  const tokens = await getJupiterTokenList();
  jupiterTokens = new Map(tokens.map(t => [t.address, t]));
  jupiterTokensExpiry = Date.now() + 3600000; // 1 hour
}

async function discoverFromJupiter(mint: string): Promise<TokenInfo | null> {
  await loadJupiterTokens();
  
  const token = jupiterTokens?.get(mint);
  if (!token) return null;
  
  return jupiterTokenToInfo(token);
}

async function discoverFromDexScreener(mint: string): Promise<TokenInfo | null> {
  const pair = await fetchDexScreenerData(mint);
  if (!pair) return null;
  
  return dexScreenerPairToInfo(pair);
}

async function discoverFromChain(mint: string): Promise<TokenInfo | null> {
  try {
    // Use Helius to get token metadata
    const response = await fetch(
      `https://api.helius.xyz/v0/token-metadata?api-key=${config.helius.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mintAccounts: [mint] }),
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const metadata = data[0];
    
    if (!metadata) return null;
    
    return {
      mint,
      symbol: metadata.onChainMetadata?.symbol || metadata.offChainMetadata?.symbol || "UNKNOWN",
      name: metadata.onChainMetadata?.name || metadata.offChainMetadata?.name || "Unknown Token",
      decimals: metadata.decimals || 9,
      logoURI: metadata.offChainMetadata?.image,
      discoveredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      source: "helius",
      verified: false,
    };
    
  } catch (error) {
    console.error("Error discovering from chain:", error);
    return null;
  }
}

async function fetchDexScreenerData(mint: string): Promise<DexScreenerPair | null> {
  try {
    const response = await fetch(
      `${config.dexScreener.apiUrl}/latest/dex/tokens/${mint}`,
      {
        headers: { "Accept": "application/json" },
      }
    );
    
    if (!response.ok) return null;
    
    const data: DexScreenerResponse = await response.json();
    
    // Get the most liquid pair
    if (data.pairs && data.pairs.length > 0) {
      return data.pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
    }
    
    return null;
    
  } catch (error) {
    console.error("DexScreener fetch error:", error);
    return null;
  }
}

// ============================================================================
// Conversion Helpers
// ============================================================================

function jupiterTokenToInfo(token: JupiterToken): TokenInfo {
  return {
    mint: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: token.logoURI,
    discoveredAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    source: "jupiter",
    verified: true,
    tags: token.tags,
  };
}

function dexScreenerPairToInfo(pair: DexScreenerPair): TokenInfo {
  const isBaseToken = pair.baseToken.address.length > 20; // Base token is usually the non-SOL token
  const token = isBaseToken ? pair.baseToken : pair.quoteToken;
  
  // Extract social links
  let twitterHandle: string | undefined;
  let website: string | undefined;
  
  if (pair.info?.socials) {
    const twitter = pair.info.socials.find(s => s.type === "twitter");
    if (twitter) {
      twitterHandle = twitter.url.replace("https://twitter.com/", "").replace("https://x.com/", "");
    }
  }
  
  if (pair.info?.websites && pair.info.websites.length > 0) {
    website = pair.info.websites[0].url;
  }
  
  return {
    mint: token.address,
    symbol: token.symbol,
    name: token.name,
    decimals: 9, // Default, would need chain lookup for actual
    logoURI: pair.info?.imageUrl,
    discoveredAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    source: "dexscreener",
    verified: false,
    priceUsd: parseFloat(pair.priceUsd),
    marketCap: pair.fdv,
    volume24h: pair.volume.h24,
    priceChange24h: pair.priceChange.h24,
    liquidity: pair.liquidity.usd,
    twitterHandle,
    website,
  };
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Get info for multiple tokens efficiently
 */
export async function getMultipleTokenInfo(mints: string[]): Promise<Map<string, TokenInfo>> {
  const results = new Map<string, TokenInfo>();
  const toFetch: string[] = [];
  
  // Check cache first
  for (const mint of mints) {
    const cached = tokenCache.get(mint);
    if (cached && cached.expires > Date.now()) {
      results.set(mint, cached.data);
    } else {
      toFetch.push(mint);
    }
  }
  
  // Fetch remaining in parallel
  const promises = toFetch.map(async (mint) => {
    const info = await getTokenInfo(mint);
    if (info) {
      results.set(mint, info);
    }
  });
  
  await Promise.all(promises);
  return results;
}

/**
 * Register a user-submitted token
 */
export function registerToken(info: Partial<TokenInfo> & { mint: string; symbol: string }): TokenInfo {
  const { mint, symbol, ...rest } = info;
  const token: TokenInfo = {
    mint,
    symbol,
    name: info.name || symbol,
    decimals: info.decimals || 9,
    logoURI: info.logoURI,
    discoveredAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    source: "user",
    verified: false,
    ...rest,
  };
  
  tokenCache.set(info.mint, {
    data: token,
    expires: Date.now() + CACHE_TTL,
  });
  
  return token;
}

/**
 * Clear token cache
 */
export function clearCache(): void {
  tokenCache.clear();
  jupiterTokens = null;
  jupiterTokensExpiry = 0;
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; jupiterLoaded: boolean } {
  return {
    size: tokenCache.size,
    jupiterLoaded: jupiterTokens !== null && jupiterTokensExpiry > Date.now(),
  };
}
