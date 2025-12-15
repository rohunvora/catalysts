# Catalysts

A Solana token catalyst feed and insights platform. **Status: Abandoned (learning project)**

## What This Is

An attempt to build a real-time catalyst detection system for Solana tokens - something that could explain *why* a token is pumping or dumping by linking price movements to on-chain events, social activity, and news.

The project includes:
- A Next.js frontend with a catalyst card feed UI
- Multiple API integrations (Helius, Jupiter, DexScreener, Grok/xAI, LunarCrush)
- Services for token discovery, price monitoring, and AI-powered insights

## Screenshot

The main UI displays "catalyst cards" - structured events with severity, time horizon, and evidence links:

```
┌─────────────────────────────────────────────────────────────┐
│  🐸 PEPE                                    HIGH SEVERITY   │
│  Whale Movement                             SHORT-TERM      │
│                                                             │
│  Large holder transferred 2.5M tokens to Binance deposit    │
│  address. Historical pattern suggests sell pressure within  │
│  24-48 hours.                                               │
│                                                             │
│  Evidence: [Solscan] [Arkham]                              │
│  Direction: BEARISH                                         │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **APIs**: Helius (on-chain), Jupiter (prices), DexScreener (market data), Grok/xAI (AI insights), LunarCrush (social)
- **Architecture**: Service-based with caching, correlation engine, webhook support

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── catalysts/      # Main catalyst feed endpoint
│   │   ├── insights/       # AI-powered token insights
│   │   ├── monitor/        # Price monitoring & alerts
│   │   └── webhooks/       # Helius webhook receiver
│   ├── lookup/             # Token lookup page
│   └── page.tsx            # Main catalyst feed UI
├── components/             # React components (cards, filters, etc.)
├── lib/
│   ├── services/
│   │   ├── token-registry.ts   # Dynamic token discovery
│   │   ├── jupiter.ts          # Price & market data
│   │   ├── helius.ts           # On-chain events
│   │   ├── lunarcrush.ts       # Social metrics
│   │   ├── grok.ts             # AI narrative extraction
│   │   ├── token-insights.ts   # Jupiter-style insights
│   │   └── correlation.ts      # Price-catalyst correlation
│   └── config.ts           # Environment configuration
├── data/                   # Sample/mock data
└── types/                  # TypeScript definitions
```

## What Was Built

### 1. Catalyst Card Data Model
A structured format for crypto events with fields for severity, time horizon, direction, evidence links, and key metrics. Designed to answer: *why now, is it real, can I get trapped, what's next?*

### 2. Service Integrations
- **Helius**: On-chain event parsing (whale transfers, LP changes, authority changes)
- **Jupiter/DexScreener**: Real-time price and market data with caching
- **LunarCrush**: Social sentiment and engagement metrics
- **Grok/xAI**: AI-powered search for token narratives on X/Twitter

### 3. Token Insights Feature
An attempt to replicate Jupiter's "Chain Insights" - AI-generated summaries explaining what a token is and where it came from.

### 4. Correlation Engine
A system to buffer price movements and attempt to match them with detected catalysts.

---

## Why It Was Stopped

### The Core Problem

**We were trying to automate what good crypto traders do manually - and that's not a tractable problem.**

### Key Realizations

#### 1. Jupiter Already Solved the "What Is This Token" Problem
We discovered that Jupiter's Chain Insights works by reading **on-chain metadata** that token creators provide at launch - not by AI searching Twitter. The creator literally puts the origin tweet URL in the token's metadata.

```json
// PFE token metadata (on-chain)
{
  "website": "https://x.com/solanadevor/status/2000353186503094601",
  "twitter": "https://x.com/solanadevor/status/2000353186503094601"
}
```

Jupiter just reads this and summarizes it. Simple, reliable, fast. We were overcomplicating it.

#### 2. Real-Time Catalyst Detection is Fundamentally Unreliable
We tried using Grok to search X/Twitter for "why is this token pumping?" Results:
- Found wrong accounts (different @username than actual origin)
- Generic summaries instead of specific catalysts
- Can't verify AI claims without on-chain data
- By the time you detect + analyze + display, the move is often over

The best catalyst detection is humans - CT accounts with sources, relationships, and tribal knowledge that no AI can replicate.

#### 3. No Clear Differentiation
- DexScreener does price/charts well
- Birdeye does analytics well
- Jupiter does swapping + insights well
- What would THIS do better? Nothing clear.

#### 4. Practice Project Without a Real Problem
The honest motivation was "crypto is hot, should build something" rather than "I have this problem I need to solve." Without a burning problem, direction is arbitrary.

---

## Lessons Learned

### 1. Research Before Building
We built complex AI search pipelines before discovering that Jupiter just reads on-chain metadata. 30 minutes of research would have revealed this.

### 2. Data-First, Not AI-First
On-chain data is reliable (immutable, verifiable). AI interpretation is unreliable (hallucinations, wrong sources). Build on reliable foundations.

### 3. Understand the Competitive Landscape
Jupiter, Birdeye, DexScreener already exist with teams, users, and data advantages. A side project can't compete on their turf.

### 4. "Practice" Needs Scope
"Build something in crypto" is too vague. Better: "Learn Helius webhooks by building X" or "Practice Next.js API routes with Y". Specific learning goals > vague product ideas.

### 5. Know When to Stop
Pivoting 3 times in one session is a sign there's no clear direction. Better to stop, reflect, and come back with a real problem to solve.

---

## What Could Be Salvageable

If you want to continue this project, the most promising directions:

1. **Token Safety Scanner** - "Should I ape this?" Check mint authority, freeze authority, LP locked, creator history. On-chain data = reliable.

2. **Dev Tracker** - Find token creator wallet, show all their previous launches and outcomes. Useful alpha, verifiable data.

3. **Personal Alerts** - "Notify me when whale X buys anything" or "Alert when my bags move 20%". Helius webhooks make this easy.

---

## Running Locally

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

- `GET /api/catalysts` - Fetch catalyst feed (mostly sample data)
- `GET /api/insights?mint=<address>` - Get AI insights for a token
- `GET /api/monitor` - Check monitoring status
- `POST /api/webhooks/helius` - Receive Helius webhook events

---

## Final Thoughts

This project taught more through its failures than a successful launch would have. The crypto tooling space is crowded, the problems are hard, and "AI + crypto" doesn't automatically equal value.

The code is reasonably clean and the integrations work. Maybe it'll be useful as reference for a future project with clearer direction.

*December 2024*
