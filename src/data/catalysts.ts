import { CatalystCard } from "@/types/catalyst";

// Sample catalyst cards with real token mints and realistic evidence
// Cards marked with simulated: true should be treated as demo examples
// Real production data would have verified tx signatures

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const SAMPLE_CATALYSTS: CatalystCard[] = [
  // BONK Cards
  {
    id: "solana:BONK:2025-12-14T08:23:00Z:WHALE_FLOW",
    dedupe_key: "bonk-whale-cex-transfer-dec14",
    asset: {
      chain: "solana",
      mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      symbol: "BONK",
      name: "Bonk"
    },
    ts: hoursAgo(4),
    first_seen: hoursAgo(4),
    event_type: "WHALE_FLOW",
    severity: "HIGH",
    time_horizon: "INTRADAY",
    direction: "BEARISH",
    headline: "2.1T BONK transferred to Binance hot wallet",
    key_numbers: [
      { label: "amount", value: 2100000000000, unit: "BONK" },
      { label: "usd_value", value: 58200000, unit: "USD" },
      { label: "pct_supply", value: 2.24, unit: "%" }
    ],
    so_what: [
      "Large CEX deposit often precedes sell pressure; watch for order book absorption.",
      "Sender wallet accumulated over 30 days—potential profit-taking after rally."
    ],
    confidence: 0.94,
    source_count: 2,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi",
        explorer_url: "https://solscan.io/tx/4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi",
        label: "Solscan tx"
      },
      {
        kind: "api_source",
        ref: "binance-deposit-address",
        explorer_url: "https://solscan.io/account/5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9",
        label: "Binance hot wallet"
      }
    ],
    entities: [
      { type: "wallet", address: "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9", label: "Binance Hot Wallet" },
      { type: "venue", address: "binance", label: "Binance" }
    ],
    calcs: { "usd_value": "2.1T BONK × $0.0000277 spot" },
    simulated: true
  },
  {
    id: "solana:BONK:2025-12-13T19:45:00Z:LIQUIDITY_CHANGE",
    dedupe_key: "bonk-lp-removal-raydium-dec13",
    asset: {
      chain: "solana",
      mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      symbol: "BONK",
      name: "Bonk"
    },
    ts: hoursAgo(17),
    first_seen: hoursAgo(17),
    event_type: "LIQUIDITY_CHANGE",
    severity: "MED",
    time_horizon: "INTRADAY",
    direction: "BEARISH",
    headline: "LP removed: Raydium BONK/SOL depth down 34%",
    key_numbers: [
      { label: "lp_removed", value: 892000, unit: "USD" },
      { label: "depth_change", value: -34, unit: "%" },
      { label: "new_depth", value: 1720000, unit: "USD" }
    ],
    so_what: [
      "Slippage on $50K+ orders now significantly higher—thin liquidity = volatility.",
      "LP removal without announcement; may indicate early smart money exit."
    ],
    confidence: 0.91,
    source_count: 1,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "3Ks8VJ2jqDQhfUvhV9xkMqN9ZcMpK2vBnHkLm4wXpG7D",
        explorer_url: "https://solscan.io/tx/3Ks8VJ2jqDQhfUvhV9xkMqN9ZcMpK2vBnHkLm4wXpG7D",
        label: "Solscan tx"
      }
    ],
    entities: [
      { type: "program", address: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", label: "Raydium AMM" }
    ],
    calcs: { "depth_change": "($2.61M → $1.72M) / $2.61M" },
    simulated: true
  },
  {
    id: "solana:BONK:2025-12-12T14:30:00Z:SUPPLY_FLOAT",
    dedupe_key: "bonk-burn-dec12",
    asset: {
      chain: "solana",
      mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      symbol: "BONK",
      name: "Bonk"
    },
    ts: daysAgo(2),
    first_seen: daysAgo(2),
    event_type: "SUPPLY_FLOAT",
    severity: "MED",
    time_horizon: "LONGER",
    direction: "BULLISH",
    headline: "100B BONK burned via official burn portal",
    key_numbers: [
      { label: "burned", value: 100000000000, unit: "BONK" },
      { label: "pct_supply", value: 0.11, unit: "%" },
      { label: "total_burned_ytd", value: 6900000000000, unit: "BONK" }
    ],
    so_what: [
      "Cumulative burns reducing circulating supply; deflationary pressure building.",
      "Single burn event small but signals continued community commitment."
    ],
    confidence: 0.98,
    source_count: 2,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "2xPqZfJK8vMn5TgZhF9mN8kVqR3wLpY7sD4hJ6fG9aBc",
        explorer_url: "https://solscan.io/tx/2xPqZfJK8vMn5TgZhF9mN8kVqR3wLpY7sD4hJ6fG9aBc",
        label: "Burn tx"
      },
      {
        kind: "official_post",
        ref: "1867234567890123456",
        explorer_url: "https://x.com/bonaboratory/status/1867234567890123456",
        label: "X post"
      }
    ],
    simulated: true
  },

  // JUP Cards
  {
    id: "solana:JUP:2025-12-14T11:15:00Z:SUPPLY_FLOAT",
    dedupe_key: "jup-unlock-dec14",
    asset: {
      chain: "solana",
      mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
      symbol: "JUP",
      name: "Jupiter"
    },
    ts: hoursAgo(1),
    first_seen: hoursAgo(1),
    event_type: "SUPPLY_FLOAT",
    severity: "HIGH",
    time_horizon: "SWING",
    direction: "BEARISH",
    headline: "50M JUP unlocked from team vesting",
    key_numbers: [
      { label: "unlocked", value: 50000000, unit: "JUP" },
      { label: "usd_value", value: 45500000, unit: "USD" },
      { label: "float_increase", value: 3.7, unit: "%" }
    ],
    so_what: [
      "Scheduled vesting unlock; team historically has not dumped immediately.",
      "Watch for transfers to exchanges over next 7 days—key tell for sell intent."
    ],
    confidence: 0.97,
    source_count: 2,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "5hK9VqMn3xLpW2jF8gH4rT6yNbC7dE9vAs2mK4pQ8wZx",
        explorer_url: "https://solscan.io/tx/5hK9VqMn3xLpW2jF8gH4rT6yNbC7dE9vAs2mK4pQ8wZx",
        label: "Unlock tx"
      },
      {
        kind: "api_source",
        ref: "jupiter-vesting-schedule",
        explorer_url: "https://vote.jup.ag/dao/jup",
        label: "JUP DAO"
      }
    ],
    entities: [
      { type: "wallet", address: "9WzDXwBbmPdCBoccQQgUPv3RJQvfNzXPbGJUsKqnT2Hd", label: "Team Vesting" }
    ],
    simulated: true
  },
  {
    id: "solana:JUP:2025-12-14T06:30:00Z:TEAM_SHIP",
    dedupe_key: "jup-perps-upgrade-dec14",
    asset: {
      chain: "solana",
      mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
      symbol: "JUP",
      name: "Jupiter"
    },
    ts: hoursAgo(6),
    first_seen: hoursAgo(6),
    event_type: "TEAM_SHIP",
    severity: "MED",
    time_horizon: "SWING",
    direction: "BULLISH",
    headline: "Jupiter Perps v2 launched with 50x leverage",
    key_numbers: [
      { label: "max_leverage", value: 50, unit: "x" },
      { label: "new_pairs", value: 12, unit: "pairs" },
      { label: "tvl_day1", value: 23400000, unit: "USD" }
    ],
    so_what: [
      "Major product expansion; perps fee revenue now accrues to JUP stakers.",
      "Competitive with GMX/dYdX positioning—watch volume metrics for traction."
    ],
    confidence: 0.99,
    source_count: 3,
    evidence: [
      {
        kind: "official_post",
        ref: "1867456789012345678",
        explorer_url: "https://x.com/JupiterExchange/status/1867456789012345678",
        label: "X announcement"
      },
      {
        kind: "repo_commit",
        ref: "a3b4c5d6e7f8",
        explorer_url: "https://github.com/jup-ag/jupiter-perps/releases/tag/v2.0.0",
        label: "GitHub release"
      },
      {
        kind: "onchain_tx",
        ref: "4nL8WxYz2vKp6jM9qR3tF5gH7dS8aE1bC0mN4oP2kQrT",
        explorer_url: "https://solscan.io/tx/4nL8WxYz2vKp6jM9qR3tF5gH7dS8aE1bC0mN4oP2kQrT",
        label: "Deploy tx"
      }
    ],
    simulated: true
  },
  {
    id: "solana:JUP:2025-12-13T22:00:00Z:WHALE_FLOW",
    dedupe_key: "jup-accumulation-dec13",
    asset: {
      chain: "solana",
      mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
      symbol: "JUP",
      name: "Jupiter"
    },
    ts: hoursAgo(14),
    first_seen: hoursAgo(14),
    event_type: "WHALE_FLOW",
    severity: "MED",
    time_horizon: "SWING",
    direction: "BULLISH",
    headline: "Fresh wallet accumulated 8.2M JUP via DCA over 3 days",
    key_numbers: [
      { label: "accumulated", value: 8200000, unit: "JUP" },
      { label: "avg_price", value: 0.87, unit: "USD" },
      { label: "total_cost", value: 7134000, unit: "USD" }
    ],
    so_what: [
      "DCA pattern suggests conviction buyer, not airdrop farmer.",
      "Wallet has no prior activity—possible institutional or whale entry."
    ],
    confidence: 0.86,
    source_count: 1,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "2kP7VwXz3nLp8jM5qR9tF1gH6dS4aE2bC8mN0oP3kQsU",
        explorer_url: "https://solscan.io/account/7hK2MqWn4xLpY3jF9gH5rT7yNbC8dE0vAs3mK5pQ9wYz",
        label: "Wallet activity"
      }
    ],
    entities: [
      { type: "wallet", address: "7hK2MqWn4xLpY3jF9gH5rT7yNbC8dE0vAs3mK5pQ9wYz", label: "Fresh Wallet" }
    ],
    simulated: true
  },

  // WIF Cards
  {
    id: "solana:WIF:2025-12-14T09:45:00Z:PRIVILEGE_CHANGE",
    dedupe_key: "wif-freeze-authority-dec14",
    asset: {
      chain: "solana",
      mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
      symbol: "WIF",
      name: "dogwifhat"
    },
    ts: hoursAgo(3),
    first_seen: hoursAgo(3),
    event_type: "PRIVILEGE_CHANGE",
    severity: "LOW",
    time_horizon: "LONGER",
    direction: "NEUTRAL",
    headline: "WIF freeze authority confirmed null (safe)",
    key_numbers: [
      { label: "freeze_auth", value: 0, unit: "null" },
      { label: "mint_auth", value: 0, unit: "null" }
    ],
    so_what: [
      "Token contract has no freeze or mint authority—cannot be rugged via auth abuse.",
      "Routine check confirms no changes since last audit."
    ],
    confidence: 1.0,
    source_count: 1,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "token-metadata-check",
        explorer_url: "https://solscan.io/token/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
        label: "Token metadata"
      }
    ],
    simulated: true
  },
  {
    id: "solana:WIF:2025-12-14T02:30:00Z:WHALE_FLOW",
    dedupe_key: "wif-whale-buy-dec14",
    asset: {
      chain: "solana",
      mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
      symbol: "WIF",
      name: "dogwifhat"
    },
    ts: hoursAgo(10),
    first_seen: hoursAgo(10),
    event_type: "WHALE_FLOW",
    severity: "HIGH",
    time_horizon: "INTRADAY",
    direction: "BULLISH",
    headline: "Known whale bought 4.8M WIF ($14.2M) via Jupiter",
    key_numbers: [
      { label: "amount", value: 4800000, unit: "WIF" },
      { label: "usd_value", value: 14200000, unit: "USD" },
      { label: "slippage", value: 1.2, unit: "%" }
    ],
    so_what: [
      "Wallet has 73% historical win rate on meme trades over $5M.",
      "Buy absorbed significant depth—likely expects near-term catalyst."
    ],
    confidence: 0.92,
    source_count: 2,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "3xQ8VyWz4nMp7kL2qS0tG5hI9dT6bF3cA1mO8pR4jUsV",
        explorer_url: "https://solscan.io/tx/3xQ8VyWz4nMp7kL2qS0tG5hI9dT6bF3cA1mO8pR4jUsV",
        label: "Buy tx"
      },
      {
        kind: "api_source",
        ref: "whale-tracker",
        explorer_url: "https://solscan.io/account/9kL3NqYz5xMp8jW2rT6gH4dS7aE0bC9mN1oP5kQtVwXy",
        label: "Whale wallet"
      }
    ],
    entities: [
      { type: "wallet", address: "9kL3NqYz5xMp8jW2rT6gH4dS7aE0bC9mN1oP5kQtVwXy", label: "Known Whale" },
      { type: "program", address: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", label: "Jupiter v6" }
    ],
    simulated: true
  },
  {
    id: "solana:WIF:2025-12-13T16:20:00Z:LISTING_STATUS",
    dedupe_key: "wif-robinhood-listing-dec13",
    asset: {
      chain: "solana",
      mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
      symbol: "WIF",
      name: "dogwifhat"
    },
    ts: hoursAgo(20),
    first_seen: hoursAgo(20),
    event_type: "LISTING_STATUS",
    severity: "HIGH",
    time_horizon: "SWING",
    direction: "BULLISH",
    headline: "Robinhood lists WIF for US trading",
    key_numbers: [
      { label: "new_users", value: 23000000, unit: "potential" },
      { label: "price_impact_1h", value: 18.4, unit: "%" }
    ],
    so_what: [
      "Major retail onramp; historically listings drive 24-72h momentum.",
      "Robinhood adds significant fiat liquidity—expect increased volume."
    ],
    confidence: 1.0,
    source_count: 2,
    evidence: [
      {
        kind: "official_post",
        ref: "1867123456789012345",
        explorer_url: "https://x.com/RobinhoodApp/status/1867123456789012345",
        label: "Robinhood announcement"
      },
      {
        kind: "official_post",
        ref: "1867123456789012346",
        explorer_url: "https://x.com/dogwifcoin/status/1867123456789012346",
        label: "WIF confirmation"
      }
    ],
    entities: [
      { type: "venue", address: "robinhood", label: "Robinhood" }
    ],
    simulated: true
  },

  // ORCA Cards
  {
    id: "solana:ORCA:2025-12-14T07:00:00Z:TEAM_SHIP",
    dedupe_key: "orca-concentrated-liq-dec14",
    asset: {
      chain: "solana",
      mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
      symbol: "ORCA",
      name: "Orca"
    },
    ts: hoursAgo(5),
    first_seen: hoursAgo(5),
    event_type: "TEAM_SHIP",
    severity: "MED",
    time_horizon: "SWING",
    direction: "BULLISH",
    headline: "Orca deploys concentrated liquidity v2 pools",
    key_numbers: [
      { label: "gas_savings", value: 40, unit: "%" },
      { label: "capital_efficiency", value: 4, unit: "x" },
      { label: "new_pools", value: 8, unit: "pools" }
    ],
    so_what: [
      "Infrastructure upgrade attracts LP capital; ORCA fees may increase.",
      "Direct competition with Raydium CLMM—watch TVL migration."
    ],
    confidence: 0.96,
    source_count: 2,
    evidence: [
      {
        kind: "official_post",
        ref: "1867345678901234567",
        explorer_url: "https://x.com/orca_so/status/1867345678901234567",
        label: "X announcement"
      },
      {
        kind: "onchain_tx",
        ref: "6mR9WzXy5oNp4kL3qT2gH8dS1aE7bF0cB6mN9oP2jQsU",
        explorer_url: "https://solscan.io/tx/6mR9WzXy5oNp4kL3qT2gH8dS1aE7bF0cB6mN9oP2jQsU",
        label: "Deploy tx"
      }
    ],
    simulated: true
  },
  {
    id: "solana:ORCA:2025-12-13T12:45:00Z:LIQUIDITY_CHANGE",
    dedupe_key: "orca-tvl-spike-dec13",
    asset: {
      chain: "solana",
      mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
      symbol: "ORCA",
      name: "Orca"
    },
    ts: hoursAgo(24),
    first_seen: hoursAgo(24),
    event_type: "LIQUIDITY_CHANGE",
    severity: "MED",
    time_horizon: "SWING",
    direction: "BULLISH",
    headline: "Orca whirlpools TVL up 28% in 24h ($340M added)",
    key_numbers: [
      { label: "tvl_added", value: 340000000, unit: "USD" },
      { label: "tvl_change", value: 28, unit: "%" },
      { label: "total_tvl", value: 1560000000, unit: "USD" }
    ],
    so_what: [
      "TVL inflow suggests LP confidence; fee revenue for ORCA stakers rising.",
      "May be related to upcoming concentrated liquidity launch."
    ],
    confidence: 0.93,
    source_count: 1,
    evidence: [
      {
        kind: "api_source",
        ref: "defillama-orca",
        explorer_url: "https://defillama.com/protocol/orca",
        label: "DefiLlama"
      }
    ],
    simulated: true
  },
  {
    id: "solana:ORCA:2025-12-12T18:30:00Z:SOCIAL_MATERIAL",
    dedupe_key: "orca-tokenomics-update-dec12",
    asset: {
      chain: "solana",
      mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
      symbol: "ORCA",
      name: "Orca"
    },
    ts: daysAgo(2),
    first_seen: daysAgo(2),
    updated_at: daysAgo(1),
    event_type: "SOCIAL_MATERIAL",
    severity: "MED",
    time_horizon: "LONGER",
    direction: "BULLISH",
    headline: "Orca announces fee switch proposal for Q1 2025",
    key_numbers: [
      { label: "proposed_share", value: 30, unit: "%" },
      { label: "est_annual_rev", value: 12000000, unit: "USD" }
    ],
    so_what: [
      "Fee revenue to stakers would fundamentally change token value accrual.",
      "Governance vote required—watch participation and sentiment."
    ],
    confidence: 0.88,
    source_count: 1,
    evidence: [
      {
        kind: "official_post",
        ref: "1866987654321098765",
        explorer_url: "https://x.com/orca_so/status/1866987654321098765",
        label: "X announcement"
      }
    ],
    simulated: true
  },

  // POPCAT Cards
  {
    id: "solana:POPCAT:2025-12-14T10:30:00Z:WHALE_FLOW",
    dedupe_key: "popcat-whale-exit-dec14",
    asset: {
      chain: "solana",
      mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
      symbol: "POPCAT",
      name: "Popcat"
    },
    ts: hoursAgo(2),
    first_seen: hoursAgo(2),
    event_type: "WHALE_FLOW",
    severity: "HIGH",
    time_horizon: "INTRADAY",
    direction: "BEARISH",
    headline: "Top 5 holder sold 12M POPCAT ($8.4M) into bid",
    key_numbers: [
      { label: "sold", value: 12000000, unit: "POPCAT" },
      { label: "usd_value", value: 8400000, unit: "USD" },
      { label: "price_impact", value: -6.2, unit: "%" }
    ],
    so_what: [
      "Significant holder exit; wallet held since $0.02—taking 30x profit.",
      "Order book thinned post-sale; expect continued volatility."
    ],
    confidence: 0.95,
    source_count: 2,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "7nS0XzYy6pOp5mL4rU3hI2dT8cG9bE4dC7nO1pS3kRtW",
        explorer_url: "https://solscan.io/tx/7nS0XzYy6pOp5mL4rU3hI2dT8cG9bE4dC7nO1pS3kRtW",
        label: "Sell tx"
      },
      {
        kind: "api_source",
        ref: "holder-analysis",
        explorer_url: "https://solscan.io/account/8mL4OqZz7xNp6kM5sV4hJ3dU9dH0bF5eD8nP2qT4lSwX",
        label: "Seller wallet"
      }
    ],
    entities: [
      { type: "wallet", address: "8mL4OqZz7xNp6kM5sV4hJ3dU9dH0bF5eD8nP2qT4lSwX", label: "Top 5 Holder" }
    ],
    simulated: true
  },
  {
    id: "solana:POPCAT:2025-12-13T21:15:00Z:INCIDENT",
    dedupe_key: "popcat-fake-twitter-dec13",
    asset: {
      chain: "solana",
      mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
      symbol: "POPCAT",
      name: "Popcat"
    },
    ts: hoursAgo(15),
    first_seen: hoursAgo(15),
    event_type: "INCIDENT",
    severity: "MED",
    time_horizon: "INTRADAY",
    direction: "NEUTRAL",
    headline: "Fake POPCAT Twitter account suspended after scam links",
    key_numbers: [
      { label: "fake_followers", value: 45000, unit: "accounts" },
      { label: "scam_txs", value: 23, unit: "txs" }
    ],
    so_what: [
      "Scam account removed—no impact on real token or contracts.",
      "Reminder: verify official account (@Popcatsolana) before clicking links."
    ],
    confidence: 0.97,
    source_count: 2,
    evidence: [
      {
        kind: "official_post",
        ref: "1867234567890123457",
        explorer_url: "https://x.com/Popcatsolana/status/1867234567890123457",
        label: "Official warning"
      },
      {
        kind: "api_source",
        ref: "twitter-suspension",
        explorer_url: "https://x.com/suspendedacct",
        label: "Suspended account"
      }
    ],
    simulated: true
  },
  {
    id: "solana:POPCAT:2025-12-13T14:00:00Z:LIQUIDITY_CHANGE",
    dedupe_key: "popcat-lp-lock-dec13",
    asset: {
      chain: "solana",
      mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
      symbol: "POPCAT",
      name: "Popcat"
    },
    ts: hoursAgo(22),
    first_seen: hoursAgo(22),
    event_type: "LIQUIDITY_CHANGE",
    severity: "LOW",
    time_horizon: "LONGER",
    direction: "BULLISH",
    headline: "Community LP locked for additional 6 months",
    key_numbers: [
      { label: "lp_locked", value: 2100000, unit: "USD" },
      { label: "lock_period", value: 180, unit: "days" },
      { label: "pct_of_total", value: 34, unit: "%" }
    ],
    so_what: [
      "Extended lock reduces rug risk; 34% of LP now time-locked.",
      "Signals community confidence in longer-term holding."
    ],
    confidence: 0.94,
    source_count: 1,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "9pT1YzZz8qPp7nM6sW5iK4eV0fI1bG6fE9oQ3rU5mTvY",
        explorer_url: "https://solscan.io/tx/9pT1YzZz8qPp7nM6sW5iK4eV0fI1bG6fE9oQ3rU5mTvY",
        label: "Lock tx"
      }
    ],
    simulated: true
  },
  {
    id: "solana:POPCAT:2025-12-12T20:45:00Z:SOCIAL_MATERIAL",
    dedupe_key: "popcat-exchange-tease-dec12",
    asset: {
      chain: "solana",
      mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
      symbol: "POPCAT",
      name: "Popcat"
    },
    ts: daysAgo(2),
    first_seen: daysAgo(2),
    event_type: "SOCIAL_MATERIAL",
    severity: "MED",
    time_horizon: "SWING",
    direction: "BULLISH",
    headline: "POPCAT hints at 'major CEX announcement' this week",
    key_numbers: [],
    so_what: [
      "Unconfirmed—treat as speculation until official listing announced.",
      "If Binance/Coinbase, historically drives 50-200% moves on memes."
    ],
    confidence: 0.45,
    source_count: 1,
    evidence: [
      {
        kind: "official_post",
        ref: "1866876543210987654",
        explorer_url: "https://x.com/Popcatsolana/status/1866876543210987654",
        label: "X tease"
      }
    ],
    simulated: true
  },

  // More varied events across tokens
  {
    id: "solana:BONK:2025-12-11T23:30:00Z:PRIVILEGE_CHANGE",
    dedupe_key: "bonk-upgrade-authority-dec11",
    asset: {
      chain: "solana",
      mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      symbol: "BONK",
      name: "Bonk"
    },
    ts: daysAgo(3),
    first_seen: daysAgo(3),
    event_type: "PRIVILEGE_CHANGE",
    severity: "LOW",
    time_horizon: "LONGER",
    direction: "NEUTRAL",
    headline: "BONK staking program upgrade authority → multisig",
    key_numbers: [
      { label: "signers_required", value: 3, unit: "of 5" }
    ],
    so_what: [
      "Staking contract now controlled by 3-of-5 multisig—reduced single-point risk.",
      "Standard security improvement; no immediate trading impact."
    ],
    confidence: 0.99,
    source_count: 2,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "1qA2WsXz3oNp4kL5mT6hI7dU8cG9bE0dC1nO2pS4kRuV",
        explorer_url: "https://solscan.io/tx/1qA2WsXz3oNp4kL5mT6hI7dU8cG9bE0dC1nO2pS4kRuV",
        label: "Authority change tx"
      },
      {
        kind: "official_post",
        ref: "1866543210987654321",
        explorer_url: "https://x.com/bonaboratory/status/1866543210987654321",
        label: "X confirmation"
      }
    ],
    entities: [
      { type: "program", address: "BonKBonKBonKBonKBonKBonKBonKBonKBonKBonKBonK", label: "BONK Staking" }
    ],
    simulated: true
  },
  {
    id: "solana:JUP:2025-12-11T15:00:00Z:INCIDENT",
    dedupe_key: "jup-rpc-degraded-dec11",
    asset: {
      chain: "solana",
      mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
      symbol: "JUP",
      name: "Jupiter"
    },
    ts: daysAgo(3),
    first_seen: daysAgo(3),
    updated_at: daysAgo(3) + "T16:30:00Z",
    event_type: "INCIDENT",
    severity: "MED",
    time_horizon: "INTRADAY",
    direction: "NEUTRAL",
    headline: "Jupiter API degraded for 90 minutes (resolved)",
    key_numbers: [
      { label: "downtime", value: 90, unit: "minutes" },
      { label: "affected_routes", value: 34, unit: "%" }
    ],
    so_what: [
      "Brief API issue caused some swap failures—now fully resolved.",
      "No funds at risk; all pending transactions processed after recovery."
    ],
    confidence: 1.0,
    source_count: 1,
    evidence: [
      {
        kind: "official_post",
        ref: "1866432109876543210",
        explorer_url: "https://x.com/JupiterExchange/status/1866432109876543210",
        label: "Status update"
      }
    ],
    simulated: true
  },
  {
    id: "solana:WIF:2025-12-11T08:20:00Z:SUPPLY_FLOAT",
    dedupe_key: "wif-staking-launch-dec11",
    asset: {
      chain: "solana",
      mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
      symbol: "WIF",
      name: "dogwifhat"
    },
    ts: daysAgo(3),
    first_seen: daysAgo(3),
    event_type: "SUPPLY_FLOAT",
    severity: "MED",
    time_horizon: "SWING",
    direction: "BULLISH",
    headline: "WIF staking live: 180M WIF staked in first 24h",
    key_numbers: [
      { label: "staked", value: 180000000, unit: "WIF" },
      { label: "pct_supply", value: 18.2, unit: "%" },
      { label: "apy", value: 12.4, unit: "%" }
    ],
    so_what: [
      "18% of supply locked in staking—reduces sellable float significantly.",
      "12.4% APY attractive; expect more staking as word spreads."
    ],
    confidence: 0.96,
    source_count: 2,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "2rB3XtYy4pOq6mL7nU8iJ5eW1gH2bF3fD4oP5qS6lTwX",
        explorer_url: "https://solscan.io/tx/2rB3XtYy4pOq6mL7nU8iJ5eW1gH2bF3fD4oP5qS6lTwX",
        label: "Staking program deploy"
      },
      {
        kind: "official_post",
        ref: "1866321098765432109",
        explorer_url: "https://x.com/dogwifcoin/status/1866321098765432109",
        label: "X announcement"
      }
    ],
    simulated: true
  },
  {
    id: "solana:ORCA:2025-12-10T19:30:00Z:WHALE_FLOW",
    dedupe_key: "orca-institution-entry-dec10",
    asset: {
      chain: "solana",
      mint: "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
      symbol: "ORCA",
      name: "Orca"
    },
    ts: daysAgo(4),
    first_seen: daysAgo(4),
    event_type: "WHALE_FLOW",
    severity: "MED",
    time_horizon: "SWING",
    direction: "BULLISH",
    headline: "Wallet linked to Jump Trading accumulated 2.1M ORCA",
    key_numbers: [
      { label: "accumulated", value: 2100000, unit: "ORCA" },
      { label: "usd_value", value: 8200000, unit: "USD" },
      { label: "pct_supply", value: 2.1, unit: "%" }
    ],
    so_what: [
      "Jump-linked wallet suggests institutional interest in Solana DeFi.",
      "ORCA fee switch proposal may be catalyst for position."
    ],
    confidence: 0.78,
    source_count: 1,
    evidence: [
      {
        kind: "api_source",
        ref: "wallet-attribution",
        explorer_url: "https://solscan.io/account/JumpjTv8z3qLbs2rPqfJ4FGmKfvpQWdRqxCLnE7nrKz",
        label: "Jump-linked wallet"
      }
    ],
    entities: [
      { type: "wallet", address: "JumpjTv8z3qLbs2rPqfJ4FGmKfvpQWdRqxCLnE7nrKz", label: "Jump Trading" }
    ],
    calcs: { "attribution": "Based on historical fund flow patterns" },
    simulated: true
  },
  {
    id: "solana:BONK:2025-12-10T11:00:00Z:LISTING_STATUS",
    dedupe_key: "bonk-coinbase-intl-dec10",
    asset: {
      chain: "solana",
      mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
      symbol: "BONK",
      name: "Bonk"
    },
    ts: daysAgo(4),
    first_seen: daysAgo(4),
    event_type: "LISTING_STATUS",
    severity: "MED",
    time_horizon: "SWING",
    direction: "BULLISH",
    headline: "Coinbase International lists BONK perpetual futures",
    key_numbers: [
      { label: "max_leverage", value: 20, unit: "x" },
      { label: "volume_24h", value: 45000000, unit: "USD" }
    ],
    so_what: [
      "Perp listing enables hedging and leverage—increases institutional access.",
      "High initial volume suggests demand; funding rates may signal sentiment."
    ],
    confidence: 1.0,
    source_count: 2,
    evidence: [
      {
        kind: "official_post",
        ref: "1866210987654321098",
        explorer_url: "https://x.com/CoinbaseIntExch/status/1866210987654321098",
        label: "Coinbase announcement"
      },
      {
        kind: "official_post",
        ref: "1866210987654321099",
        explorer_url: "https://x.com/bonaboratory/status/1866210987654321099",
        label: "BONK confirmation"
      }
    ],
    entities: [
      { type: "venue", address: "coinbase-intl", label: "Coinbase International" }
    ],
    simulated: true
  },
  {
    id: "solana:JUP:2025-12-10T04:45:00Z:LIQUIDITY_CHANGE",
    dedupe_key: "jup-meteora-pool-dec10",
    asset: {
      chain: "solana",
      mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
      symbol: "JUP",
      name: "Jupiter"
    },
    ts: daysAgo(4),
    first_seen: daysAgo(4),
    event_type: "LIQUIDITY_CHANGE",
    severity: "LOW",
    time_horizon: "SWING",
    direction: "BULLISH",
    headline: "New JUP/USDC Meteora DLMM pool: $4.2M TVL in 12h",
    key_numbers: [
      { label: "tvl", value: 4200000, unit: "USD" },
      { label: "fee_tier", value: 0.25, unit: "%" },
      { label: "bin_step", value: 25, unit: "bps" }
    ],
    so_what: [
      "DLMM pools offer better capital efficiency—may attract LP migration.",
      "Additional venue for JUP trading; depth improving across ecosystem."
    ],
    confidence: 0.91,
    source_count: 1,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "3sC4YuZz5qPr8oM9tX0jK6fV2hI3bG4gE5pQ6rT7mUxY",
        explorer_url: "https://solscan.io/tx/3sC4YuZz5qPr8oM9tX0jK6fV2hI3bG4gE5pQ6rT7mUxY",
        label: "Pool creation tx"
      }
    ],
    entities: [
      { type: "program", address: "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo", label: "Meteora DLMM" }
    ],
    simulated: true
  },
  {
    id: "solana:WIF:2025-12-09T22:00:00Z:TEAM_SHIP",
    dedupe_key: "wif-nft-collection-dec09",
    asset: {
      chain: "solana",
      mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
      symbol: "WIF",
      name: "dogwifhat"
    },
    ts: daysAgo(5),
    first_seen: daysAgo(5),
    event_type: "TEAM_SHIP",
    severity: "LOW",
    time_horizon: "LONGER",
    direction: "NEUTRAL",
    headline: "dogwifhat NFT collection sells out in 8 minutes",
    key_numbers: [
      { label: "supply", value: 5000, unit: "NFTs" },
      { label: "mint_price", value: 2.5, unit: "SOL" },
      { label: "raised", value: 12500, unit: "SOL" }
    ],
    so_what: [
      "NFT revenue goes to community treasury—not directly WIF price relevant.",
      "Demonstrates strong community engagement and brand strength."
    ],
    confidence: 0.94,
    source_count: 2,
    evidence: [
      {
        kind: "official_post",
        ref: "1865876543210987654",
        explorer_url: "https://x.com/dogwifcoin/status/1865876543210987654",
        label: "X announcement"
      },
      {
        kind: "onchain_tx",
        ref: "4tD5ZvAz6rQs9pN0uY1kL7gW3iH4cG5hF6qR8sU9nVyZ",
        explorer_url: "https://solscan.io/tx/4tD5ZvAz6rQs9pN0uY1kL7gW3iH4cG5hF6qR8sU9nVyZ",
        label: "Mint tx"
      }
    ],
    simulated: true
  },
  {
    id: "solana:POPCAT:2025-12-09T16:30:00Z:PRIVILEGE_CHANGE",
    dedupe_key: "popcat-lp-burned-dec09",
    asset: {
      chain: "solana",
      mint: "7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr",
      symbol: "POPCAT",
      name: "Popcat"
    },
    ts: daysAgo(5),
    first_seen: daysAgo(5),
    event_type: "PRIVILEGE_CHANGE",
    severity: "MED",
    time_horizon: "LONGER",
    direction: "BULLISH",
    headline: "POPCAT LP tokens burned (permanent liquidity lock)",
    key_numbers: [
      { label: "lp_burned", value: 100, unit: "%" },
      { label: "locked_value", value: 3400000, unit: "USD" }
    ],
    so_what: [
      "Burned LP = liquidity can never be removed—strongest possible lock.",
      "Eliminates rug risk from LP removal vector entirely."
    ],
    confidence: 1.0,
    source_count: 2,
    evidence: [
      {
        kind: "onchain_tx",
        ref: "5uE6AwBz7sSt0qO1vZ2mM8hX4jI5dH6iG7rS9tV0oWzA",
        explorer_url: "https://solscan.io/tx/5uE6AwBz7sSt0qO1vZ2mM8hX4jI5dH6iG7rS9tV0oWzA",
        label: "Burn tx"
      },
      {
        kind: "official_post",
        ref: "1865765432109876543",
        explorer_url: "https://x.com/Popcatsolana/status/1865765432109876543",
        label: "X confirmation"
      }
    ],
    simulated: true
  }
];

// Helper to get catalysts by token
export function getCatalystsByMint(mint: string): CatalystCard[] {
  return SAMPLE_CATALYSTS.filter(c => c.asset.mint === mint);
}

// Helper to get catalysts by event type
export function getCatalystsByEventType(eventType: string): CatalystCard[] {
  return SAMPLE_CATALYSTS.filter(c => c.event_type === eventType);
}

// Get most recent catalysts
export function getRecentCatalysts(limit: number = 10): CatalystCard[] {
  return [...SAMPLE_CATALYSTS]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, limit);
}

// Get unique tokens in the dataset
export function getUniqueTokens(): string[] {
  return [...new Set(SAMPLE_CATALYSTS.map(c => c.asset.mint))];
}

