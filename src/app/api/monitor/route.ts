import { NextRequest, NextResponse } from "next/server";
import { 
  runCorrelationCycle, 
  priceAlertToCatalystCard,
  getBufferStats,
  PriceAlert 
} from "@/lib/services/correlation";
import { getTrendingTokens, getNewTokens } from "@/lib/services/token-registry";

/**
 * Price Monitoring & Correlation API
 * 
 * This endpoint monitors tokens for price movements and correlates them
 * with recent catalysts to answer "why is this pumping/dumping?"
 * 
 * GET /api/monitor - Get status and buffer stats
 * POST /api/monitor - Run correlation cycle on specified tokens
 */

// Store recent alerts
const recentAlerts: PriceAlert[] = [];
const MAX_ALERTS = 50;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");
  
  // Get buffer stats
  if (action === "stats") {
    const stats = getBufferStats();
    const statsObj: Record<string, number> = {};
    for (const [mint, count] of stats) {
      statsObj[mint] = count;
    }
    
    return NextResponse.json({
      buffer_stats: statsObj,
      total_catalysts_buffered: Array.from(stats.values()).reduce((a, b) => a + b, 0),
      recent_alerts_count: recentAlerts.length,
    });
  }
  
  // Get recent alerts
  if (action === "alerts") {
    return NextResponse.json({
      alerts: recentAlerts.slice(0, 20).map(alert => ({
        summary: alert.summary,
        confidence: alert.confidence,
        movement: alert.movement,
        top_catalyst: alert.topCatalyst ? {
          headline: alert.topCatalyst.catalyst.headline,
          correlation_score: alert.topCatalyst.correlationScore,
          lag_minutes: alert.topCatalyst.lagMinutes,
        } : null,
      })),
    });
  }
  
  // Get trending tokens to monitor
  if (action === "trending") {
    try {
      const trending = await getTrendingTokens();
      return NextResponse.json({
        trending: trending.slice(0, 20).map(t => ({
          mint: t.mint,
          symbol: t.symbol,
          name: t.name,
          price_usd: t.priceUsd,
          price_change_24h: t.priceChange24h,
          volume_24h: t.volume24h,
        })),
      });
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch trending tokens" }, { status: 500 });
    }
  }
  
  // Get new token launches
  if (action === "new") {
    try {
      const newTokens = await getNewTokens(20);
      return NextResponse.json({
        new_tokens: newTokens.map(t => ({
          mint: t.mint,
          symbol: t.symbol,
          name: t.name,
          price_usd: t.priceUsd,
          discovered_at: t.discoveredAt,
        })),
      });
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch new tokens" }, { status: 500 });
    }
  }
  
  // Default: return status
  return NextResponse.json({
    status: "active",
    endpoints: {
      "GET /api/monitor": "This status page",
      "GET /api/monitor?action=stats": "Get catalyst buffer statistics",
      "GET /api/monitor?action=alerts": "Get recent price alerts",
      "GET /api/monitor?action=trending": "Get trending tokens",
      "GET /api/monitor?action=new": "Get new token launches",
      "POST /api/monitor": "Run correlation cycle on tokens",
    },
    recent_alerts_count: recentAlerts.length,
    usage: {
      description: "POST with JSON body containing tokens array",
      example: {
        tokens: [
          { mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", symbol: "BONK" },
          { mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", symbol: "JUP" },
        ],
        price_threshold: 10,
        refresh_catalysts: true,
      },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokens, price_threshold, refresh_catalysts } = body;
    
    if (!tokens || !Array.isArray(tokens)) {
      return NextResponse.json(
        { error: "Missing 'tokens' array in request body" },
        { status: 400 }
      );
    }
    
    // Validate tokens
    const validTokens = tokens.filter(t => t.mint && t.symbol);
    
    if (validTokens.length === 0) {
      return NextResponse.json(
        { error: "No valid tokens provided. Each token needs 'mint' and 'symbol'" },
        { status: 400 }
      );
    }
    
    console.log(`Running correlation cycle for ${validTokens.length} tokens...`);
    
    // Run correlation cycle
    const alerts = await runCorrelationCycle(validTokens, {
      priceThreshold: price_threshold || 10,
      refreshCatalysts: refresh_catalysts !== false,
    });
    
    // Store alerts
    for (const alert of alerts) {
      recentAlerts.unshift(alert);
    }
    
    // Trim alerts list
    while (recentAlerts.length > MAX_ALERTS) {
      recentAlerts.pop();
    }
    
    // Convert alerts to catalyst cards
    const catalystCards = alerts.map(alert => priceAlertToCatalystCard(alert));
    
    return NextResponse.json({
      success: true,
      tokens_monitored: validTokens.length,
      alerts_generated: alerts.length,
      alerts: alerts.map(alert => ({
        summary: alert.summary,
        confidence: alert.confidence,
        movement: {
          symbol: alert.movement.symbol,
          price_change: alert.movement.priceChange,
          direction: alert.movement.direction,
          magnitude: alert.movement.magnitude,
        },
        top_catalyst: alert.topCatalyst ? {
          headline: alert.topCatalyst.catalyst.headline,
          event_type: alert.topCatalyst.catalyst.event_type,
          correlation_score: alert.topCatalyst.correlationScore,
          lag_minutes: alert.topCatalyst.lagMinutes,
          reasoning: alert.topCatalyst.reasoning,
        } : null,
        correlated_catalysts_count: alert.correlatedCatalysts.length,
      })),
      catalyst_cards: catalystCards,
    });
    
  } catch (error) {
    console.error("Monitor error:", error);
    return NextResponse.json(
      { error: "Failed to run correlation cycle" },
      { status: 500 }
    );
  }
}
