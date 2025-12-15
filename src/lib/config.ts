// Centralized environment configuration
// All API keys and settings should be accessed through this module

export const config = {
  // Helius - Solana RPC & Webhooks
  helius: {
    apiKey: process.env.HELIUS_API_KEY || "",
    rpcUrl: `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ""}`,
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/helius`,
  },
  
  // Twitter/X API
  twitter: {
    apiKey: process.env.TWITTER_API_KEY || "",
    apiSecret: process.env.TWITTER_API_SECRET || "",
  },
  
  // Jupiter API
  jupiter: {
    apiKey: process.env.JUPITER_API_KEY || "",
    priceApiUrl: "https://price.jup.ag/v6",
    quoteApiUrl: "https://quote-api.jup.ag/v6",
    tokenListUrl: "https://token.jup.ag",
  },
  
  // LunarCrush
  lunarCrush: {
    apiKey: process.env.LUNARCRUSH_API_KEY || "",
    apiUrl: "https://lunarcrush.com/api4/public",
  },
  
  // Grok/xAI - Real-time X search + LLM
  grok: {
    apiKey: process.env.GROK_API_KEY || process.env.XAI_API_KEY || "",
    apiUrl: "https://api.x.ai/v1",
  },
  
  // DexScreener (free, no key needed)
  dexScreener: {
    apiUrl: "https://api.dexscreener.com",
  },
  
  // App settings
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    isDev: process.env.NODE_ENV === "development",
  },
} as const;

// Validation helper
export function validateConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!config.helius.apiKey) missing.push("HELIUS_API_KEY");
  if (!config.twitter.apiKey) missing.push("TWITTER_API_KEY");
  if (!config.twitter.apiSecret) missing.push("TWITTER_API_SECRET");
  if (!config.jupiter.apiKey) missing.push("JUPITER_API_KEY");
  if (!config.lunarCrush.apiKey) missing.push("LUNARCRUSH_API_KEY");
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

// Helper to check if a specific service is configured
export function isServiceConfigured(service: keyof typeof config): boolean {
  switch (service) {
    case "helius":
      return !!config.helius.apiKey;
    case "twitter":
      return !!config.twitter.apiKey && !!config.twitter.apiSecret;
    case "jupiter":
      return !!config.jupiter.apiKey;
    case "lunarCrush":
      return !!config.lunarCrush.apiKey;
    case "grok":
      return !!config.grok.apiKey;
    case "dexScreener":
      return true; // Always available (no key needed)
    case "app":
      return true;
    default:
      return false;
  }
}

