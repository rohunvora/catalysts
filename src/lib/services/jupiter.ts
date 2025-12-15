// Jupiter API Service - Real-time Solana token prices
// Docs: https://station.jup.ag/docs/apis/price-api

import { config } from "../config";

export interface JupiterPrice {
  id: string;           // Token mint address
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
  timeTaken?: number;
}

export interface JupiterPriceResponse {
  data: Record<string, JupiterPrice>;
  timeTaken: number;
}

export interface TokenPriceData {
  mint: string;
  symbol: string;
  price: number;
  priceChange24h?: number;
  volume24h?: number;
  lastUpdated: string;
}

export interface PriceHistory {
  mint: string;
  prices: Array<{
    timestamp: number;
    price: number;
  }>;
}

// In-memory price cache with TTL
const priceCache = new Map<string, { data: TokenPriceData; expires: number }>();
const CACHE_TTL = 30000; // 30 seconds

/**
 * Get current price for a single token
 */
export async function getTokenPrice(mint: string): Promise<TokenPriceData | null> {
  // Check cache first
  const cached = priceCache.get(mint);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  try {
    const response = await fetch(
      `${config.jupiter.priceApiUrl}/price?ids=${mint}&vsToken=USDC`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      console.error(`Jupiter price API error: ${response.status}`);
      return null;
    }
    
    const data: JupiterPriceResponse = await response.json();
    const priceInfo = data.data[mint];
    
    if (!priceInfo) {
      return null;
    }
    
    const tokenData: TokenPriceData = {
      mint,
      symbol: priceInfo.mintSymbol,
      price: priceInfo.price,
      lastUpdated: new Date().toISOString(),
    };
    
    // Cache the result
    priceCache.set(mint, {
      data: tokenData,
      expires: Date.now() + CACHE_TTL,
    });
    
    return tokenData;
    
  } catch (error) {
    console.error("Error fetching Jupiter price:", error);
    return null;
  }
}

/**
 * Get prices for multiple tokens at once (more efficient)
 */
export async function getMultipleTokenPrices(mints: string[]): Promise<Map<string, TokenPriceData>> {
  const results = new Map<string, TokenPriceData>();
  const mintsToFetch: string[] = [];
  
  // Check cache for each mint
  for (const mint of mints) {
    const cached = priceCache.get(mint);
    if (cached && cached.expires > Date.now()) {
      results.set(mint, cached.data);
    } else {
      mintsToFetch.push(mint);
    }
  }
  
  // Fetch remaining mints
  if (mintsToFetch.length === 0) {
    return results;
  }
  
  try {
    const response = await fetch(
      `${config.jupiter.priceApiUrl}/price?ids=${mintsToFetch.join(",")}&vsToken=USDC`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      console.error(`Jupiter price API error: ${response.status}`);
      return results;
    }
    
    const data: JupiterPriceResponse = await response.json();
    
    for (const mint of mintsToFetch) {
      const priceInfo = data.data[mint];
      if (priceInfo) {
        const tokenData: TokenPriceData = {
          mint,
          symbol: priceInfo.mintSymbol,
          price: priceInfo.price,
          lastUpdated: new Date().toISOString(),
        };
        
        results.set(mint, tokenData);
        priceCache.set(mint, {
          data: tokenData,
          expires: Date.now() + CACHE_TTL,
        });
      }
    }
    
  } catch (error) {
    console.error("Error fetching Jupiter prices:", error);
  }
  
  return results;
}

/**
 * Get token list from Jupiter (verified tokens)
 */
export interface JupiterToken {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
  tags?: string[];
  extensions?: Record<string, string>;
}

let tokenListCache: JupiterToken[] | null = null;
let tokenListExpiry = 0;
const TOKEN_LIST_TTL = 3600000; // 1 hour

export async function getJupiterTokenList(strict: boolean = true): Promise<JupiterToken[]> {
  // Check cache
  if (tokenListCache && tokenListExpiry > Date.now()) {
    return tokenListCache;
  }
  
  try {
    const endpoint = strict ? "strict" : "all";
    const response = await fetch(`${config.jupiter.tokenListUrl}/${endpoint}`, {
      headers: {
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      console.error(`Jupiter token list error: ${response.status}`);
      return tokenListCache || [];
    }
    
    const tokens: JupiterToken[] = await response.json();
    tokenListCache = tokens;
    tokenListExpiry = Date.now() + TOKEN_LIST_TTL;
    
    return tokens;
    
  } catch (error) {
    console.error("Error fetching Jupiter token list:", error);
    return tokenListCache || [];
  }
}

/**
 * Search for a token by symbol in Jupiter's list
 */
export async function findTokenBySymbol(symbol: string): Promise<JupiterToken | null> {
  const tokens = await getJupiterTokenList();
  const upperSymbol = symbol.toUpperCase();
  
  return tokens.find(t => t.symbol.toUpperCase() === upperSymbol) || null;
}

/**
 * Get swap quote (useful for detecting large trades)
 */
export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
}

export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50
): Promise<SwapQuote | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
    });
    
    const response = await fetch(
      `${config.jupiter.quoteApiUrl}/quote?${params}`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      console.error(`Jupiter quote API error: ${response.status}`);
      return null;
    }
    
    return await response.json();
    
  } catch (error) {
    console.error("Error fetching Jupiter quote:", error);
    return null;
  }
}

/**
 * Calculate price impact for a given trade size
 * Useful for detecting if a large trade could move the market
 */
export async function calculatePriceImpact(
  mint: string,
  tradeAmountUsd: number
): Promise<{ priceImpactPct: number; feasible: boolean } | null> {
  // USDC mint
  const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  
  // Convert USD to USDC amount (6 decimals)
  const usdcAmount = Math.floor(tradeAmountUsd * 1_000_000);
  
  const quote = await getSwapQuote(USDC_MINT, mint, usdcAmount);
  
  if (!quote) {
    return null;
  }
  
  const priceImpactPct = parseFloat(quote.priceImpactPct);
  
  return {
    priceImpactPct,
    feasible: priceImpactPct < 5, // <5% slippage is generally acceptable
  };
}

/**
 * Detect price anomalies by comparing current price to recent average
 */
export interface PriceAnomaly {
  mint: string;
  symbol: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  isAnomaly: boolean;
  direction: "pump" | "dump" | "stable";
  detectedAt: string;
}

// Store recent prices for anomaly detection
const recentPrices = new Map<string, Array<{ price: number; timestamp: number }>>();
const MAX_PRICE_HISTORY = 60; // Keep last 60 data points

export function recordPrice(mint: string, price: number): void {
  const history = recentPrices.get(mint) || [];
  history.push({ price, timestamp: Date.now() });
  
  // Keep only recent history
  if (history.length > MAX_PRICE_HISTORY) {
    history.shift();
  }
  
  recentPrices.set(mint, history);
}

export function detectPriceAnomaly(
  mint: string, 
  symbol: string,
  currentPrice: number,
  thresholdPercent: number = 10
): PriceAnomaly | null {
  const history = recentPrices.get(mint);
  
  if (!history || history.length < 5) {
    // Not enough data
    recordPrice(mint, currentPrice);
    return null;
  }
  
  // Calculate average of last 5 prices
  const recentAvg = history.slice(-5).reduce((sum, p) => sum + p.price, 0) / 5;
  const changePercent = ((currentPrice - recentAvg) / recentAvg) * 100;
  
  recordPrice(mint, currentPrice);
  
  const isAnomaly = Math.abs(changePercent) >= thresholdPercent;
  
  let direction: "pump" | "dump" | "stable" = "stable";
  if (changePercent >= thresholdPercent) direction = "pump";
  else if (changePercent <= -thresholdPercent) direction = "dump";
  
  return {
    mint,
    symbol,
    currentPrice,
    previousPrice: recentAvg,
    changePercent,
    isAnomaly,
    direction,
    detectedAt: new Date().toISOString(),
  };
}

/**
 * Clear caches (useful for testing)
 */
export function clearCaches(): void {
  priceCache.clear();
  tokenListCache = null;
  tokenListExpiry = 0;
  recentPrices.clear();
}

