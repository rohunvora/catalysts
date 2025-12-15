// Helius API Service - On-chain transaction monitoring & parsing
// Docs: https://docs.helius.dev/

import { config } from "../config";
import { CatalystCard, EventType, Severity, Direction } from "@/types/catalyst";

// ============================================================================
// Types
// ============================================================================

export interface HeliusWebhookPayload {
  accountData: AccountData[];
  signature: string;
  slot: number;
  timestamp: number;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  nativeTransfers: NativeTransfer[];
  tokenTransfers: TokenTransfer[];
  instructions: Instruction[];
  events: TransactionEvent;
}

export interface AccountData {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: TokenBalanceChange[];
}

export interface TokenBalanceChange {
  mint: string;
  rawTokenAmount: {
    tokenAmount: string;
    decimals: number;
  };
  tokenAccount: string;
  userAccount: string;
}

export interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

export interface TokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  fromTokenAccount: string;
  toTokenAccount: string;
  tokenAmount: number;
  mint: string;
  tokenStandard: string;
}

export interface Instruction {
  accounts: string[];
  data: string;
  programId: string;
  innerInstructions: Instruction[];
}

export interface TransactionEvent {
  swap?: SwapEvent;
  nft?: NFTEvent;
  compressed?: CompressedEvent;
}

export interface SwapEvent {
  nativeInput?: { account: string; amount: string };
  nativeOutput?: { account: string; amount: string };
  tokenInputs: Array<{ mint: string; tokenAmount: number; userAccount: string }>;
  tokenOutputs: Array<{ mint: string; tokenAmount: number; userAccount: string }>;
  tokenFees: Array<{ mint: string; tokenAmount: number; userAccount: string }>;
  innerSwaps: Array<{
    tokenInputs: Array<{ mint: string; tokenAmount: number }>;
    tokenOutputs: Array<{ mint: string; tokenAmount: number }>;
    programInfo: { source: string; account: string; programName: string };
  }>;
}

export interface NFTEvent {
  type: string;
  source: string;
  amount: number;
  fee: number;
  buyer: string;
  seller: string;
  nfts: Array<{ mint: string; tokenStandard: string }>;
}

export interface CompressedEvent {
  type: string;
  treeId: string;
  assetId: string;
  leafIndex: number;
  newLeafOwner: string;
  oldLeafOwner: string;
}

// Enhanced transaction from Helius
export interface EnhancedTransaction {
  signature: string;
  slot: number;
  timestamp: number;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  description: string;
  accountData: AccountData[];
  nativeTransfers: NativeTransfer[];
  tokenTransfers: TokenTransfer[];
  events: TransactionEvent;
}

// Webhook configuration
export interface WebhookConfig {
  webhookURL: string;
  transactionTypes: TransactionType[];
  accountAddresses?: string[];
  webhookType: "enhanced" | "raw" | "rawDevnet";
  authHeader?: string;
}

export type TransactionType = 
  | "UNKNOWN"
  | "NFT_BID"
  | "NFT_GLOBAL_BID"
  | "NFT_GLOBAL_BID_CANCELLED"
  | "NFT_BID_CANCELLED"
  | "NFT_LISTING"
  | "NFT_CANCEL_LISTING"
  | "NFT_SALE"
  | "NFT_MINT"
  | "NFT_AUCTION_CREATED"
  | "NFT_AUCTION_UPDATED"
  | "NFT_AUCTION_CANCELLED"
  | "NFT_PARTICIPATION_REWARD"
  | "NFT_MINT_REJECTED"
  | "CREATE_STORE"
  | "WHITELIST_CREATOR"
  | "ADD_TO_WHITELIST"
  | "REMOVE_FROM_WHITELIST"
  | "AUCTION_MANAGER_CLAIM_BID"
  | "EMPTY_PAYMENT_ACCOUNT"
  | "UPDATE_PRIMARY_SALE_METADATA"
  | "ADD_TOKEN_TO_VAULT"
  | "ACTIVATE_VAULT"
  | "INIT_VAULT"
  | "INIT_BANK"
  | "INIT_STAKE"
  | "MERGE_STAKE"
  | "SPLIT_STAKE"
  | "SET_BANK_FLAGS"
  | "SET_VAULT_LOCK"
  | "UPDATE_VAULT_OWNER"
  | "UPDATE_BANK_MANAGER"
  | "RECORD_RARITY_POINTS"
  | "ADD_RARITIES_TO_BANK"
  | "INIT_FARM"
  | "INIT_FARMER"
  | "REFRESH_FARMER"
  | "UPDATE_FARM"
  | "AUTHORIZE_FUNDER"
  | "DEAUTHORIZE_FUNDER"
  | "FUND_REWARD"
  | "CANCEL_REWARD"
  | "LOCK_REWARD"
  | "PAYOUT"
  | "VALIDATE_SAFETY_DEPOSIT_BOX_V2"
  | "SET_AUTHORITY"
  | "INIT_AUCTION_MANAGER_V2"
  | "UPDATE_EXTERNAL_PRICE_ACCOUNT"
  | "AUCTION_HOUSE_CREATE"
  | "CLOSE_ESCROW_ACCOUNT"
  | "WITHDRAW"
  | "DEPOSIT"
  | "TRANSFER"
  | "BURN"
  | "BURN_NFT"
  | "PLATFORM_FEE"
  | "LOAN"
  | "REPAY_LOAN"
  | "ADD_TO_POOL"
  | "REMOVE_FROM_POOL"
  | "CLOSE_POSITION"
  | "UNLABELED"
  | "CLOSE_ACCOUNT"
  | "WITHDRAW_GEM"
  | "DEPOSIT_GEM"
  | "STAKE_TOKEN"
  | "UNSTAKE_TOKEN"
  | "STAKE_SOL"
  | "UNSTAKE_SOL"
  | "CLAIM_REWARDS"
  | "BUY_SUBSCRIPTION"
  | "SWAP"
  | "INIT_SWAP"
  | "CANCEL_SWAP"
  | "REJECT_SWAP"
  | "INITIALIZE_ACCOUNT"
  | "TOKEN_MINT"
  | "CREATE_APPARAISAL"
  | "FUSE"
  | "DEPOSIT_FRACTIONAL_POOL"
  | "FRACTIONALIZE"
  | "CREATE_RAFFLE"
  | "BUY_TICKETS"
  | "UPDATE_ITEM"
  | "LIST_ITEM"
  | "DELIST_ITEM"
  | "ADD_ITEM"
  | "CLOSE_ITEM"
  | "BUY_ITEM"
  | "FILL_ORDER"
  | "UPDATE_ORDER"
  | "CREATE_ORDER"
  | "CLOSE_ORDER"
  | "CANCEL_ORDER"
  | "KICK_ITEM"
  | "UPGRADE_FOX"
  | "UPGRADE_FOX_REQUEST"
  | "LOAN_FOX"
  | "BORROW_FOX"
  | "SWITCH_FOX_REQUEST"
  | "SWITCH_FOX"
  | "CREATE_ESCROW"
  | "ACCEPT_REQUEST_ARTIST"
  | "CANCEL_ESCROW"
  | "ACCEPT_ESCROW_ARTIST"
  | "ACCEPT_ESCROW_USER"
  | "PLACE_BET"
  | "PLACE_SOL_BET"
  | "CREATE_BET"
  | "COMPRESSED_NFT_MINT"
  | "COMPRESSED_NFT_TRANSFER"
  | "COMPRESSED_NFT_BURN"
  | "COMPRESS_NFT"
  | "DECOMPRESS_NFT"
  | "COMPRESSED_NFT_DELEGATE";

// ============================================================================
// Known Addresses Database
// ============================================================================

// CEX hot wallets (expanded list)
export const CEX_WALLETS: Record<string, string> = {
  // Binance
  "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9": "Binance",
  "9WzDXwBbmPdCBoccQQgUPv3RJQvfNzXPbGJUsKqnT2Hd": "Binance 2",
  "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S": "Binance 3",
  
  // Coinbase
  "H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS": "Coinbase",
  "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE": "Coinbase Prime",
  
  // Kraken
  "ASTyfSima4LLAdDgoFGkgqoKowG1LZFDr9fAQrg7iaJZ": "Kraken",
  
  // OKX
  "3yFwqXBfZY4jBVUafQ1YEXw189y2dN3V5KQq9uzBDy1E": "OKX",
  "5VCwKtCXgCJ6kit5FybXjvriW3xELsFDhYrPSqtJNmcD": "OKX 2",
  
  // Bybit
  "AC5RDfQFmDS1deWZos921JfqscXdByf8BKHs5ACWjtW2": "Bybit",
  
  // KuCoin
  "BmFdpraQhkiDQE6SnfG5omcA1VwzqfXrwtNYBwWTymy6": "KuCoin",
  
  // Gate.io
  "u6PJ8DtQuPFnfmwHbGFULQ4u4EgjDiyYKjVEsynXq2w": "Gate.io",
  
  // Crypto.com
  "AobVSwdW9BbpMdJvTqeCN4hPAmh4rHm7vwLnQ5ATSyrS": "Crypto.com",
};

// DEX program IDs
export const DEX_PROGRAMS: Record<string, string> = {
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium AMM",
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK": "Raydium CLMM",
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc": "Orca Whirlpools",
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP": "Orca v1",
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4": "Jupiter v6",
  "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB": "Jupiter v4",
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo": "Meteora DLMM",
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB": "Meteora Pools",
  "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY": "Phoenix",
  "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EQBh8": "Openbook v2",
  "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX": "Openbook v1",
};

// Token programs
export const TOKEN_PROGRAMS: Record<string, string> = {
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "SPL Token",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb": "Token-2022",
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL": "Associated Token",
};

// ============================================================================
// Helius API Functions
// ============================================================================

/**
 * Parse a transaction using Helius Enhanced API
 */
export async function parseTransaction(signature: string): Promise<EnhancedTransaction | null> {
  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/transactions/?api-key=${config.helius.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactions: [signature],
        }),
      }
    );
    
    if (!response.ok) {
      console.error(`Helius parse error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data[0] || null;
    
  } catch (error) {
    console.error("Error parsing transaction:", error);
    return null;
  }
}

/**
 * Get parsed transaction history for an address
 */
export async function getTransactionHistory(
  address: string,
  options: {
    limit?: number;
    before?: string;
    type?: TransactionType;
  } = {}
): Promise<EnhancedTransaction[]> {
  try {
    const params = new URLSearchParams({
      "api-key": config.helius.apiKey,
    });
    
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.before) params.set("before", options.before);
    if (options.type) params.set("type", options.type);
    
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${address}/transactions?${params}`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      console.error(`Helius history error: ${response.status}`);
      return [];
    }
    
    return await response.json();
    
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return [];
  }
}

/**
 * Get token balances for an address
 */
export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  tokenAccount: string;
}

export async function getTokenBalances(address: string): Promise<TokenBalance[]> {
  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${config.helius.apiKey}`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      console.error(`Helius balances error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.tokens || [];
    
  } catch (error) {
    console.error("Error fetching token balances:", error);
    return [];
  }
}

// ============================================================================
// Webhook Management
// ============================================================================

/**
 * Create a new webhook
 */
export async function createWebhook(webhookConfig: WebhookConfig): Promise<{ webhookID: string } | null> {
  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/webhooks?api-key=${config.helius.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookConfig),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error(`Helius webhook creation error: ${response.status}`, error);
      return null;
    }
    
    return await response.json();
    
  } catch (error) {
    console.error("Error creating webhook:", error);
    return null;
  }
}

/**
 * List all webhooks
 */
export async function listWebhooks(): Promise<Array<{ webhookID: string; webhookURL: string; transactionTypes: string[] }>> {
  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/webhooks?api-key=${config.helius.apiKey}`,
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      console.error(`Helius list webhooks error: ${response.status}`);
      return [];
    }
    
    return await response.json();
    
  } catch (error) {
    console.error("Error listing webhooks:", error);
    return [];
  }
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(webhookId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.helius.xyz/v0/webhooks/${webhookId}?api-key=${config.helius.apiKey}`,
      {
        method: "DELETE",
      }
    );
    
    return response.ok;
    
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return false;
  }
}

// ============================================================================
// Event Analysis & Catalyst Generation
// ============================================================================

/**
 * Identify wallet type from address
 */
export function identifyWallet(address: string): { type: "cex" | "dex" | "token_program" | "unknown"; label: string } {
  if (CEX_WALLETS[address]) {
    return { type: "cex", label: CEX_WALLETS[address] };
  }
  if (DEX_PROGRAMS[address]) {
    return { type: "dex", label: DEX_PROGRAMS[address] };
  }
  if (TOKEN_PROGRAMS[address]) {
    return { type: "token_program", label: TOKEN_PROGRAMS[address] };
  }
  return { type: "unknown", label: "Unknown" };
}

/**
 * Analyze a transaction and determine if it's catalyst-worthy
 */
export interface TransactionAnalysis {
  isCatalyst: boolean;
  eventType: EventType;
  severity: Severity;
  direction: Direction;
  headline: string;
  details: {
    tokenMint?: string;
    tokenSymbol?: string;
    amount?: number;
    amountUsd?: number;
    fromWallet?: { address: string; label: string };
    toWallet?: { address: string; label: string };
    program?: string;
  };
}

export function analyzeTransaction(tx: EnhancedTransaction, tokenPriceUsd?: number): TransactionAnalysis | null {
  // Check for large token transfers
  if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
    for (const transfer of tx.tokenTransfers) {
      const fromWallet = identifyWallet(transfer.fromUserAccount);
      const toWallet = identifyWallet(transfer.toUserAccount);
      
      // CEX deposit (potential sell pressure)
      if (toWallet.type === "cex") {
        const amountUsd = tokenPriceUsd ? transfer.tokenAmount * tokenPriceUsd : undefined;
        
        // Only flag large transfers (>$50k or unknown price)
        if (!amountUsd || amountUsd > 50000) {
          return {
            isCatalyst: true,
            eventType: "WHALE_FLOW",
            severity: amountUsd && amountUsd > 500000 ? "HIGH" : amountUsd && amountUsd > 100000 ? "MED" : "LOW",
            direction: "BEARISH",
            headline: `Large transfer to ${toWallet.label} detected`,
            details: {
              tokenMint: transfer.mint,
              amount: transfer.tokenAmount,
              amountUsd,
              fromWallet: { address: transfer.fromUserAccount, label: fromWallet.label },
              toWallet: { address: transfer.toUserAccount, label: toWallet.label },
            },
          };
        }
      }
      
      // CEX withdrawal (potential accumulation)
      if (fromWallet.type === "cex") {
        const amountUsd = tokenPriceUsd ? transfer.tokenAmount * tokenPriceUsd : undefined;
        
        if (!amountUsd || amountUsd > 50000) {
          return {
            isCatalyst: true,
            eventType: "WHALE_FLOW",
            severity: amountUsd && amountUsd > 500000 ? "HIGH" : amountUsd && amountUsd > 100000 ? "MED" : "LOW",
            direction: "BULLISH",
            headline: `Large withdrawal from ${fromWallet.label} detected`,
            details: {
              tokenMint: transfer.mint,
              amount: transfer.tokenAmount,
              amountUsd,
              fromWallet: { address: transfer.fromUserAccount, label: fromWallet.label },
              toWallet: { address: transfer.toUserAccount, label: toWallet.label },
            },
          };
        }
      }
    }
  }
  
  // Check for swaps
  if (tx.events?.swap) {
    const swap = tx.events.swap;
    // Large swap detection could be added here
  }
  
  // Check for authority changes (would need more specific instruction parsing)
  if (tx.type === "SET_AUTHORITY") {
    return {
      isCatalyst: true,
      eventType: "PRIVILEGE_CHANGE",
      severity: "HIGH",
      direction: "NEUTRAL",
      headline: "Token authority changed",
      details: {
        program: tx.source,
      },
    };
  }
  
  return null;
}

/**
 * Convert transaction analysis to a CatalystCard
 */
export function analysisToCatalystCard(
  analysis: TransactionAnalysis,
  tx: EnhancedTransaction,
  tokenInfo?: { symbol: string; name: string }
): CatalystCard {
  const symbol = tokenInfo?.symbol || analysis.details.tokenSymbol || "UNKNOWN";
  const mint = analysis.details.tokenMint || "";
  
  return {
    id: `solana:${symbol}:${new Date(tx.timestamp * 1000).toISOString()}:${analysis.eventType}`,
    dedupe_key: `${symbol.toLowerCase()}-${analysis.eventType.toLowerCase()}-${tx.signature.slice(0, 16)}`,
    asset: {
      chain: "solana",
      mint,
      symbol,
      name: tokenInfo?.name,
    },
    ts: new Date(tx.timestamp * 1000).toISOString(),
    first_seen: new Date().toISOString(),
    event_type: analysis.eventType,
    severity: analysis.severity,
    time_horizon: analysis.eventType === "WHALE_FLOW" ? "INTRADAY" : "SWING",
    direction: analysis.direction,
    headline: analysis.headline,
    key_numbers: analysis.details.amountUsd ? [
      { label: "amount", value: analysis.details.amount || 0, unit: symbol },
      { label: "usd_value", value: analysis.details.amountUsd, unit: "USD" },
    ] : [],
    so_what: [
      analysis.direction === "BEARISH" 
        ? "Large CEX deposit often precedes sell pressure; watch order book depth."
        : "Large CEX withdrawal suggests accumulation; potential bullish signal.",
      "Monitor for follow-up transactions from this wallet.",
    ],
    confidence: 0.85,
    source_count: 1,
    evidence: [
      {
        kind: "onchain_tx",
        ref: tx.signature,
        explorer_url: `https://solscan.io/tx/${tx.signature}`,
        label: "Solscan tx",
      },
    ],
    entities: [
      ...(analysis.details.fromWallet ? [{
        type: "wallet" as const,
        address: analysis.details.fromWallet.address,
        label: analysis.details.fromWallet.label,
      }] : []),
      ...(analysis.details.toWallet ? [{
        type: "wallet" as const,
        address: analysis.details.toWallet.address,
        label: analysis.details.toWallet.label,
      }] : []),
    ],
    simulated: false,
  };
}

