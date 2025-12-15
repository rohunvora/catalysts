import { NextRequest, NextResponse } from "next/server";
import { 
  HeliusWebhookPayload, 
  analyzeTransaction, 
  analysisToCatalystCard,
  EnhancedTransaction 
} from "@/lib/services/helius";
import { getTokenInfo } from "@/lib/services/token-registry";
import { getTokenPrice } from "@/lib/services/jupiter";
import { bufferCatalyst } from "@/lib/services/correlation";

// Store recent webhook events for debugging
const recentEvents: Array<{ timestamp: string; type: string; signature: string }> = [];
const MAX_RECENT_EVENTS = 100;

/**
 * Helius Enhanced Webhook Handler
 * 
 * This endpoint receives real-time transaction notifications from Helius.
 * Set up webhooks at https://dev.helius.xyz/dashboard/webhooks
 * 
 * Webhook URL: {YOUR_DOMAIN}/api/webhooks/helius
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the webhook payload
    const payload: HeliusWebhookPayload[] = await request.json();
    
    if (!Array.isArray(payload)) {
      console.error("Invalid webhook payload format");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    
    console.log(`Received ${payload.length} webhook events`);
    
    const processedCatalysts: string[] = [];
    
    for (const event of payload) {
      try {
        // Log event for debugging
        recentEvents.unshift({
          timestamp: new Date().toISOString(),
          type: event.type,
          signature: event.signature,
        });
        
        // Keep recent events list manageable
        if (recentEvents.length > MAX_RECENT_EVENTS) {
          recentEvents.pop();
        }
        
        // Convert to EnhancedTransaction format
        const tx: EnhancedTransaction = {
          signature: event.signature,
          slot: event.slot,
          timestamp: event.timestamp,
          type: event.type,
          source: event.source,
          fee: event.fee,
          feePayer: event.feePayer,
          description: "", // Would need parsing
          accountData: event.accountData,
          nativeTransfers: event.nativeTransfers,
          tokenTransfers: event.tokenTransfers,
          events: event.events,
        };
        
        // Process token transfers
        if (event.tokenTransfers && event.tokenTransfers.length > 0) {
          for (const transfer of event.tokenTransfers) {
            // Get token info
            const tokenInfo = await getTokenInfo(transfer.mint);
            if (!tokenInfo) continue;
            
            // Get current price for USD valuation
            const priceData = await getTokenPrice(transfer.mint);
            const priceUsd = priceData?.price;
            
            // Analyze the transaction
            const analysis = analyzeTransaction(tx, priceUsd);
            
            if (analysis && analysis.isCatalyst) {
              // Convert to catalyst card
              const catalyst = analysisToCatalystCard(
                analysis,
                tx,
                { symbol: tokenInfo.symbol, name: tokenInfo.name }
              );
              
              // Add to correlation buffer
              bufferCatalyst(catalyst);
              
              processedCatalysts.push(catalyst.id);
              
              console.log(`Generated catalyst: ${catalyst.headline}`);
            }
          }
        }
        
      } catch (eventError) {
        console.error(`Error processing event ${event.signature}:`, eventError);
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: payload.length,
      catalysts_generated: processedCatalysts.length,
      catalyst_ids: processedCatalysts,
    });
    
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check webhook status and recent events
 */
export async function GET() {
  return NextResponse.json({
    status: "active",
    recent_events: recentEvents.slice(0, 20),
    total_events_received: recentEvents.length,
    webhook_url: "/api/webhooks/helius",
    setup_instructions: {
      step1: "Go to https://dev.helius.xyz/dashboard/webhooks",
      step2: "Create a new webhook with your deployed URL + /api/webhooks/helius",
      step3: "Select transaction types: TRANSFER, SWAP, etc.",
      step4: "Add account addresses to monitor (CEX wallets, specific tokens)",
    },
  });
}

