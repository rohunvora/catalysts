import { NextRequest, NextResponse } from "next/server";
import { getTokenInsight, isInsightsAvailable } from "@/lib/services/token-insights";

/**
 * Token Insights API
 * 
 * GET /api/insights?mint=<contract_address>
 * 
 * Returns an AI-generated summary of what a token is and where it came from.
 * Inspired by Jupiter's "Chain Insights" feature.
 */

import { TokenInsight } from "@/lib/services/token-insights";

// Simple cache to avoid repeated Grok calls
const cache = new Map<string, { data: TokenInsight; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mint = searchParams.get("mint");
  const skipCache = searchParams.get("refresh") === "true";
  
  // Validate input
  if (!mint) {
    return NextResponse.json(
      { 
        error: "Missing 'mint' parameter",
        usage: "GET /api/insights?mint=<solana_contract_address>"
      },
      { status: 400 }
    );
  }
  
  // Validate mint format
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) {
    return NextResponse.json(
      { error: "Invalid mint address format" },
      { status: 400 }
    );
  }
  
  // Check if Grok is configured
  if (!isInsightsAvailable()) {
    return NextResponse.json(
      { 
        error: "Token insights not available",
        reason: "GROK_API_KEY or XAI_API_KEY not configured"
      },
      { status: 503 }
    );
  }
  
  // Check cache
  if (!skipCache) {
    const cached = cache.get(mint);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
      });
    }
  }
  
  try {
    console.log(`Generating insight for ${mint}...`);
    
    const insight = await getTokenInsight(mint);
    
    if (!insight) {
      return NextResponse.json(
        { 
          error: "Failed to generate insight",
          mint,
        },
        { status: 500 }
      );
    }
    
    // Cache the result
    cache.set(mint, {
      data: insight,
      expires: Date.now() + CACHE_TTL,
    });
    
    return NextResponse.json(insight);
    
  } catch (error) {
    console.error("Insight generation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate insight",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
