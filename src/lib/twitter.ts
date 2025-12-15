// Twitter/X API integration for catalyst generation

import { RawNewsItem } from "./catalyst-generator";

// Twitter API credentials - set via environment variables or fallback for demo
const TWITTER_API_KEY = process.env.TWITTER_API_KEY ?? "kkmCpEkhUqlR43WBB9REHQT2b";
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET ?? "nmsTQ9b4wxaceOsicQKD0NAg5LyI5m2zmS4JZr9S37VtNpfU3I";

// Cache bearer token
let bearerToken: string | null = null;
let tokenExpiry: number = 0;

// Get OAuth 2.0 Bearer Token
async function getBearerToken(): Promise<string> {
  // Return cached token if valid
  if (bearerToken && Date.now() < tokenExpiry) {
    return bearerToken;
  }
  
  const credentials = Buffer.from(`${TWITTER_API_KEY}:${TWITTER_API_SECRET}`).toString("base64");
  
  const response = await fetch("https://api.twitter.com/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: "grant_type=client_credentials",
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error("Twitter auth error:", error);
    throw new Error(`Twitter authentication failed: ${response.status}`);
  }
  
  const data = await response.json();
  bearerToken = data.access_token;
  tokenExpiry = Date.now() + 3600000; // 1 hour
  
  return bearerToken!;
}

export interface Tweet {
  id: string;
  text: string;
  author_id: string;
  author_username?: string;
  author_name?: string;
  created_at: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    quote_count: number;
  };
  entities?: {
    urls?: Array<{ expanded_url: string }>;
    mentions?: Array<{ username: string }>;
    hashtags?: Array<{ tag: string }>;
  };
}

export interface TwitterSearchResult {
  tweets: Tweet[];
  error?: string;
}

// Search Twitter for tweets mentioning a contract address or token
export async function searchTwitter(
  query: string,
  maxResults: number = 20
): Promise<TwitterSearchResult> {
  try {
    const token = await getBearerToken();
    
    // Build search query - exclude retweets for cleaner results
    const searchQuery = `${query} -is:retweet lang:en`;
    
    const params = new URLSearchParams({
      query: searchQuery,
      max_results: Math.min(maxResults, 100).toString(),
      "tweet.fields": "created_at,public_metrics,entities,author_id",
      "user.fields": "username,name",
      expansions: "author_id",
    });
    
    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error("Twitter search error:", error);
      
      // Handle rate limiting
      if (response.status === 429) {
        return { tweets: [], error: "Twitter rate limit exceeded. Try again later." };
      }
      
      return { tweets: [], error: `Twitter API error: ${response.status}` };
    }
    
    const data = await response.json();
    
    if (!data.data) {
      return { tweets: [], error: undefined }; // No results
    }
    
    // Map author info to tweets
    const users = new Map<string, { username: string; name: string }>();
    if (data.includes?.users) {
      for (const user of data.includes.users) {
        users.set(user.id, { username: user.username, name: user.name });
      }
    }
    
    const tweets: Tweet[] = data.data.map((tweet: Tweet) => ({
      ...tweet,
      author_username: users.get(tweet.author_id)?.username,
      author_name: users.get(tweet.author_id)?.name,
    }));
    
    return { tweets };
    
  } catch (error) {
    console.error("Twitter search failed:", error);
    return { 
      tweets: [], 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// Convert tweets to RawNewsItem format for catalyst generation
export function tweetsToNewsItems(tweets: Tweet[]): RawNewsItem[] {
  return tweets.map(tweet => ({
    title: tweet.text.substring(0, 100) + (tweet.text.length > 100 ? "..." : ""),
    snippet: tweet.text,
    url: `https://x.com/${tweet.author_username || "i"}/status/${tweet.id}`,
    source: tweet.author_username ? `@${tweet.author_username}` : "Twitter",
    date: tweet.created_at,
  }));
}

// Filter tweets by engagement (signal vs noise)
export function filterHighSignalTweets(tweets: Tweet[], minEngagement: number = 5): Tweet[] {
  return tweets.filter(tweet => {
    const metrics = tweet.public_metrics;
    if (!metrics) return true; // Keep if no metrics
    
    const totalEngagement = 
      metrics.like_count + 
      metrics.retweet_count * 2 + 
      metrics.reply_count + 
      metrics.quote_count * 2;
    
    return totalEngagement >= minEngagement;
  });
}

// Comprehensive spam/scam filter
export function filterSpamTweets(tweets: Tweet[]): Tweet[] {
  // Spam/scam patterns to reject
  const rejectPatterns = [
    // Giveaway/airdrop scams
    /\b(giveaway|airdrop)\b.*\b(follow|retweet|like|rt)\b/i,
    /\b(free)\s+(tokens?|coins?|crypto|nft)/i,
    /claim\s+(your|free|now)/i,
    
    // Pump signals / guaranteed returns
    /\b(guaranteed|100x|1000x|10000x|easy\s*money)\b/i,
    /\b(pump|moon|lambo)\s*(soon|incoming|alert)/i,
    /next\s+(100|1000)x/i,
    /\b(get\s+rich|millionaire)\b/i,
    
    // DM scams
    /\b(DM|dm|message)\s*(me|us|for|to)\b/i,
    /check\s*(my|the)\s*(bio|link|pinned)/i,
    
    // Send crypto scams
    /send\s*\d+\s*(sol|eth|btc|usdt|usdc)/i,
    /send\s*(to|me)\s*(this|my)\s*(address|wallet)/i,
    
    // Presale/whitelist urgency scams
    /\b(presale|whitelist|wl)\b.*\b(limited|spots|ending|hurry|fast)\b/i,
    /\b(last\s+chance|final\s+call|ending\s+soon)\b/i,
    /only\s+\d+\s+(spots|slots)\s+(left|remaining)/i,
    
    // Fake verification / impersonation
    /\b(verify|verified)\s*(your|account|wallet)/i,
    /connect\s*(your)?\s*wallet/i,
    
    // Bot-like patterns
    /^(rt|retweet)\s*@/i,
    /follow\s+(me|us|back)/i,
    /\b(f4f|follow4follow|followback)\b/i,
    
    // Suspicious links
    /bit\.ly|tinyurl|t\.co.*t\.co/i, // Multiple shortened links
    /\b(telegram|discord)\s*(link|group|channel)\b.*\b(join|click)\b/i,
    
    // Price prediction spam
    /price\s+prediction.*\$\d+/i,
    /will\s+(hit|reach)\s+\$\d+/i,
    
    // Generic spam
    /\b(win|winner|congratulations)\b.*\b(click|claim|dm)\b/i,
    /\b(urgent|act\s+now|don't\s+miss)\b/i,
    
    // Excessive emojis (more than 10)
    /([\u{1F300}-\u{1F9FF}].*){10,}/u,
    
    // Excessive hashtags (more than 5)
    /(#\w+\s*){6,}/,
    
    // Asking for engagement
    /like\s*(and|&|\+)\s*(rt|retweet|share)/i,
    /rt\s*(and|&|\+)\s*like/i,
  ];
  
  // Keywords that are red flags when combined
  const redFlagCombos = [
    { words: ["free", "token"], threshold: 2 },
    { words: ["send", "wallet", "address"], threshold: 2 },
    { words: ["guaranteed", "profit", "return"], threshold: 2 },
    { words: ["airdrop", "claim", "eligible"], threshold: 2 },
  ];
  
  return tweets.filter(tweet => {
    const text = tweet.text.toLowerCase();
    
    // Check reject patterns
    if (rejectPatterns.some(pattern => pattern.test(tweet.text))) {
      return false;
    }
    
    // Check red flag combos
    for (const combo of redFlagCombos) {
      const matchCount = combo.words.filter(word => text.includes(word)).length;
      if (matchCount >= combo.threshold) {
        return false;
      }
    }
    
    // Check for suspicious username patterns (bot-like)
    const username = tweet.author_username?.toLowerCase() || "";
    if (/\d{6,}$/.test(username)) { // Ends with 6+ digits
      return false;
    }
    if (/(bot|alert|signal|pump|gem|call)s?$/i.test(username)) {
      // Allow legitimate accounts like "whalewatchalert" but filter generic ones
      const metrics = tweet.public_metrics;
      if (!metrics || metrics.like_count < 10) {
        return false;
      }
    }
    
    return true;
  });
}

// Filter for crypto relevance - reject tweets that aren't about THIS token
export function filterForCryptoRelevance(tweets: Tweet[], symbol: string): Tweet[] {
  const cleanSymbol = symbol.replace(/^\$/, "").toLowerCase();
  
  // Crypto-related keywords that indicate the tweet is about crypto
  const cryptoKeywords = [
    "token", "coin", "crypto", "blockchain", "solana", "sol", 
    "wallet", "trade", "trading", "buy", "sell", "hold", "hodl",
    "market", "price", "chart", "pump", "dump", "dex", "cex",
    "liquidity", "lp", "swap", "mint", "burn", "stake", "airdrop",
    "whale", "bullish", "bearish", "ath", "mcap", "volume",
    "binance", "coinbase", "jupiter", "raydium", "orca",
    "$", "usd", "usdt", "usdc", "btc", "eth",
  ];
  
  return tweets.filter(tweet => {
    const text = tweet.text.toLowerCase();
    
    // MUST mention the specific token symbol in the tweet text
    // Use regex to find symbol as a word (not part of another word)
    const symbolRegex = new RegExp(`(^|\\s|\\$)${cleanSymbol}($|\\s|[.,!?:;])`, 'i');
    const mentionsSymbol = symbolRegex.test(tweet.text);
    
    if (!mentionsSymbol) {
      // Doesn't mention our specific token - reject
      console.log(`Filtered out (no symbol): ${tweet.text.substring(0, 50)}...`);
      return false;
    }
    
    // If tweet has contract address, it's definitely crypto
    if (/[1-9A-HJ-NP-Za-km-z]{32,44}/.test(tweet.text)) {
      return true;
    }
    
    // Check if tweet has crypto context keywords
    const hasCryptoContext = cryptoKeywords.some(kw => text.includes(kw));
    if (!hasCryptoContext) {
      // No crypto context - likely false positive
      return false;
    }
    
    // Check if tweet is primarily about a DIFFERENT token
    // Count cashtags in the tweet
    const cashtagMatches = tweet.text.match(/\$[A-Za-z]{2,10}/g) || [];
    const otherCashtags = cashtagMatches.filter(tag => 
      tag.toLowerCase() !== `$${cleanSymbol}`
    );
    
    // If more other cashtags than our symbol, it's probably about something else
    if (otherCashtags.length > 1) {
      return false;
    }
    
    // Check for "I called X" pattern where X is different token
    if (/i called \$?[a-z]{2,10}/i.test(text) && !text.includes(cleanSymbol)) {
      return false;
    }
    
    return true;
  });
}

// Additional filter: prioritize credible sources
export function filterByCredibility(tweets: Tweet[]): Tweet[] {
  // Known credible crypto accounts (partial list)
  const credibleAccounts = new Set([
    "solaboratory", "bonaboratory", "jupiterexchange", "aboratory",
    "solana", "solana_devs", "phantom", "magic_eden",
    "waboratory", "orca_so", "raaboratory",
    "coindesk", "theblock__", "caboratory",
  ]);
  
  return tweets.map(tweet => {
    const username = tweet.author_username?.toLowerCase() || "";
    const isCredible = credibleAccounts.has(username);
    const metrics = tweet.public_metrics;
    
    // Boost score for credible accounts
    return {
      tweet,
      score: (isCredible ? 100 : 0) + 
             (metrics?.like_count || 0) + 
             (metrics?.retweet_count || 0) * 2
    };
  })
  .sort((a, b) => b.score - a.score)
  .map(item => item.tweet);
}

// Search for token by contract address and symbol
export async function searchTokenTweets(
  contractAddress: string,
  symbol: string,
  name?: string
): Promise<RawNewsItem[]> {
  // Clean symbol (remove leading $ if present)
  const cleanSymbol = symbol.replace(/^\$/, "");
  
  // Build search queries (cashtag $ not supported on Basic tier)
  const queries = [
    cleanSymbol.length >= 3 ? `"${cleanSymbol}" crypto` : null, // Symbol + crypto context
    cleanSymbol.length >= 3 ? `"${cleanSymbol}" solana` : null, // Symbol + solana context
  ].filter(Boolean) as string[];
  
  // If we have a name different from symbol, add it too
  if (name && name.length > 4 && name.toLowerCase() !== cleanSymbol.toLowerCase()) {
    queries.push(`"${name}"`);
  }
  
  const allTweets: Tweet[] = [];
  const seenIds = new Set<string>();
  
  // Search with each query
  for (const query of queries.slice(0, 2)) { // Limit to 2 queries to save rate limit
    const result = await searchTwitter(query, 15);
    
    if (result.error) {
      console.warn(`Twitter search warning for "${query}":`, result.error);
      continue;
    }
    
    // Dedupe tweets
    for (const tweet of result.tweets) {
      if (!seenIds.has(tweet.id)) {
        seenIds.add(tweet.id);
        allTweets.push(tweet);
      }
    }
  }
  
  // Filter pipeline: spam → strict relevance → engagement → credibility sort
  // (spam first because it's the cheapest filter)
  const afterSpam = filterSpamTweets(allTweets);
  // Use the stricter filter that catches different CAs and requires name match
  const afterRelevance = filterForStrictRelevance(afterSpam, cleanSymbol, name);
  const afterEngagement = filterHighSignalTweets(afterRelevance, 2); // Lower threshold
  const sorted = filterByCredibility(afterEngagement);
  
  console.log(`Twitter filter: ${allTweets.length} raw → ${afterSpam.length} spam-free → ${afterRelevance.length} relevant → ${afterEngagement.length} engagement → ${sorted.length} sorted`);
  
  return tweetsToNewsItems(sorted);
}

// Get tweets from a specific user (for official accounts)
export async function getUserTweets(
  username: string,
  maxResults: number = 10
): Promise<RawNewsItem[]> {
  const query = `from:${username} -is:retweet`;
  const result = await searchTwitter(query, maxResults);
  
  if (result.error || !result.tweets.length) {
    return [];
  }
  
  return tweetsToNewsItems(result.tweets);
}

// Search Twitter and return RAW tweets (for LLM analysis)
// Less aggressive filtering - keep more context for narrative extraction
export async function searchTwitterRaw(
  symbol: string,
  name: string | undefined,
  maxResults: number = 30
): Promise<TwitterSearchResult> {
  const cleanSymbol = symbol.replace(/^\$/, "");
  
  // Build search queries - prioritize full name for multi-word names
  const queries: string[] = [];
  
  // For multi-word names like "Franklin The Turtle", ONLY search the exact full name
  // This prevents false positives from generic word matches
  if (name && name.includes(" ") && name.length > 8) {
    queries.push(`"${name}"`);
    // Also try key unique words from the name
    const nameWords = name.split(/\s+/).filter(w => w.length > 3);
    if (nameWords.length >= 2) {
      // For "Franklin The Turtle", search "Franklin Turtle" 
      queries.push(`"${nameWords.join(" ")}" solana`);
    }
  } else if (cleanSymbol.length >= 4) {
    // For longer symbols, search with crypto context
    queries.push(`"$${cleanSymbol}" solana`);
    queries.push(`"${cleanSymbol}" solana token`);
  }
  
  // If no good queries, fall back to symbol + crypto context
  if (queries.length === 0 && cleanSymbol.length >= 3) {
    queries.push(`"${cleanSymbol}" crypto solana`);
  }
  
  const allTweets: Tweet[] = [];
  const seenIds = new Set<string>();
  
  for (const query of queries.slice(0, 2)) {
    console.log(`Twitter raw search query: "${query}"`);
    const result = await searchTwitter(query, Math.ceil(maxResults / 2));
    
    if (result.error) {
      console.warn(`Raw search warning for "${query}":`, result.error);
      continue;
    }
    
    for (const tweet of result.tweets) {
      if (!seenIds.has(tweet.id)) {
        seenIds.add(tweet.id);
        allTweets.push(tweet);
      }
    }
  }
  
  // Apply spam filter + strict relevance filter
  const afterSpam = filterSpamTweets(allTweets);
  const afterRelevance = filterForStrictRelevance(afterSpam, cleanSymbol, name);
  
  // Sort by engagement to prioritize quality
  const sorted = afterRelevance.sort((a, b) => {
    const aScore = (a.public_metrics?.like_count || 0) + (a.public_metrics?.retweet_count || 0) * 2;
    const bScore = (b.public_metrics?.like_count || 0) + (b.public_metrics?.retweet_count || 0) * 2;
    return bScore - aScore;
  });
  
  console.log(`Raw Twitter search: ${allTweets.length} found → ${afterSpam.length} spam-free → ${sorted.length} relevant`);
  
  return { tweets: sorted.slice(0, maxResults) };
}

// Strict relevance filter - rejects tweets about OTHER tokens with similar names
function filterForStrictRelevance(tweets: Tweet[], symbol: string, name?: string): Tweet[] {
  const cleanSymbol = symbol.toLowerCase().replace(/^\$/, "");
  const nameWords = name?.toLowerCase().split(/\s+/).filter(w => w.length > 3) || [];
  const distinctiveWords = nameWords.filter(w => !['the', 'of', 'a', 'an'].includes(w));
  
  return tweets.filter(tweet => {
    const text = tweet.text.toLowerCase();
    const originalText = tweet.text;
    
    // STRONG REJECT: Any tweet containing "CA" or "Contract" followed by any address
    // These are almost always promoting a specific token
    if (/\b(ca|contract|address)[:\s]+[1-9a-z]{20,}/i.test(originalText)) {
      console.log(`[Strict] Rejected (CA promotion): ${text.substring(0, 60)}...`);
      return false;
    }
    
    // STRONG REJECT: Tweets that look like token promotions with marketcap/price mentions
    if (/\b(marketcap|mcap|market cap)\b.*\d+k/i.test(text) || /\d+k\s*(marketcap|mcap|market cap)/i.test(text)) {
      const hasOurCashtag = text.includes(`$${cleanSymbol}`);
      if (!hasOurCashtag) {
        console.log(`[Strict] Rejected (marketcap promotion): ${text.substring(0, 60)}...`);
        return false;
      }
    }
    
    // REJECT: "I called X" or "calling X" patterns (shills)
    if (/\b(called|calling)\b.*\$[a-z]/i.test(text)) {
      console.log(`[Strict] Rejected (call pattern): ${text.substring(0, 50)}...`);
      return false;
    }
    
    // REJECT: Too many cashtags (portfolio posts)
    const allCashtags = originalText.match(/\$[A-Za-z]{2,10}/g) || [];
    if (allCashtags.length > 2) {
      console.log(`[Strict] Rejected (too many cashtags): ${text.substring(0, 50)}...`);
      return false;
    }
    
    // REQUIRE: Must clearly reference our token
    if (nameWords.length >= 2) {
      // For multi-word names like "Franklin The Turtle"
      // Must have the cashtag OR multiple distinctive words
      const matchingWords = distinctiveWords.filter(word => text.includes(word));
      const hasCashtag = text.includes(`$${cleanSymbol}`);
      
      if (matchingWords.length < Math.min(2, distinctiveWords.length) && !hasCashtag) {
        console.log(`[Strict] Rejected (name mismatch: ${matchingWords.join(',')}): ${text.substring(0, 50)}...`);
        return false;
      }
    } else {
      // For single-word names, require cashtag or strong match
      const hasCashtag = text.includes(`$${cleanSymbol}`);
      const hasSymbol = new RegExp(`\\b${cleanSymbol}\\b`, 'i').test(text);
      const hasCryptoContext = ['solana', 'token', 'coin', 'crypto'].some(kw => text.includes(kw));
      
      if (!hasCashtag && !(hasSymbol && hasCryptoContext)) {
        console.log(`[Strict] Rejected (weak match): ${text.substring(0, 50)}...`);
        return false;
      }
    }
    
    return true;
  });
}

