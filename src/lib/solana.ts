// Solana token data fetching utilities

export interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  supply: number;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  isInitialized: boolean;
}

export interface TokenHolder {
  address: string;
  balance: number;
  percentage: number;
}

// Known CEX wallet addresses (simplified - would be more comprehensive in production)
export const KNOWN_CEX_WALLETS: Record<string, string> = {
  "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9": "Binance",
  "9WzDXwBbmPdCBoccQQgUPv3RJQvfNzXPbGJUsKqnT2Hd": "Coinbase",
  "H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS": "FTX (defunct)",
  "ASTyfSima4LLAdDgoFGkgqoKowG1LZFDr9fAQrg7iaJZ": "Kraken",
  "3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E": "OKX",
};

// Known DeFi program addresses
export const KNOWN_PROGRAMS: Record<string, string> = {
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium AMM",
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc": "Orca Whirlpools",
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4": "Jupiter v6",
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo": "Meteora DLMM",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "SPL Token",
};

// Fetch token metadata from Solana (using public RPC)
export async function fetchTokenMetadata(mint: string): Promise<TokenMetadata | null> {
  try {
    // Using Solana public RPC - in production use Helius/QuickNode
    const response = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getAccountInfo",
        params: [
          mint,
          { encoding: "jsonParsed" }
        ]
      })
    });
    
    const data = await response.json();
    
    if (data.result?.value?.data?.parsed?.info) {
      const info = data.result.value.data.parsed.info;
      return {
        mint,
        symbol: "", // Need to fetch from metadata
        name: "",
        decimals: info.decimals,
        supply: parseInt(info.supply) / Math.pow(10, info.decimals),
        mintAuthority: info.mintAuthority,
        freezeAuthority: info.freezeAuthority,
        isInitialized: info.isInitialized,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching token metadata:", error);
    return null;
  }
}

// Fetch token info from DexScreener API (symbol, name)
export async function fetchTokenInfo(mint: string): Promise<{ symbol: string; name: string; logoURI?: string } | null> {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {
      headers: {
        "Accept": "application/json",
      },
    });
    
    if (!response.ok) {
      console.error(`DexScreener API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // DexScreener returns pairs, get token info from the first pair
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      // Check if our mint is the base or quote token
      const token = pair.baseToken.address === mint ? pair.baseToken : pair.quoteToken;
      return {
        symbol: token.symbol || "UNKNOWN",
        name: token.name || "Unknown Token",
        logoURI: pair.info?.imageUrl,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching token info:", error);
    return null;
  }
}

// Build Solscan URL for a transaction
export function solscanTxUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}`;
}

// Build Solscan URL for an account
export function solscanAccountUrl(address: string): string {
  return `https://solscan.io/account/${address}`;
}

// Build Solscan URL for a token
export function solscanTokenUrl(mint: string): string {
  return `https://solscan.io/token/${mint}`;
}

// Check if an address is a known CEX
export function identifyWallet(address: string): { type: "cex" | "program" | "unknown"; label: string } {
  if (KNOWN_CEX_WALLETS[address]) {
    return { type: "cex", label: KNOWN_CEX_WALLETS[address] };
  }
  if (KNOWN_PROGRAMS[address]) {
    return { type: "program", label: KNOWN_PROGRAMS[address] };
  }
  return { type: "unknown", label: "Unknown" };
}

