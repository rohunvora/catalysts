"use client";

import { useState } from "react";
import Link from "next/link";
import { SAMPLE_CATALYSTS } from "@/data/catalysts";
import { copyToClipboard } from "@/lib/utils";
import { EVENT_TYPE_META } from "@/types/catalyst";

export default function DocsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  
  const handleCopy = async (id: string, text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  };
  
  // Get example cards for documentation
  const exampleCards = SAMPLE_CATALYSTS.slice(0, 3);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-elevated">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-accent-primary flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="font-mono font-bold text-lg text-foreground tracking-tight">
                    Catalyst Cards
                  </h1>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
                    API Documentation
                  </p>
                </div>
              </Link>
            </div>
            
            <Link 
              href="/"
              className="text-sm font-mono text-foreground-muted hover:text-foreground transition-colors"
            >
              ← Back to Demo
            </Link>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Overview */}
        <section className="mb-12">
          <h2 className="text-xl font-mono font-bold text-foreground mb-4">Overview</h2>
          <p className="text-foreground-muted leading-relaxed mb-4">
            Catalyst Cards delivers a JSON feed of source-linked crypto events optimized for 
            trading terminals. Each card answers: <em>why now, is it real, can I get trapped, what&apos;s next</em>.
          </p>
          <div className="p-4 border border-border bg-background-card text-sm">
            <p className="font-mono text-foreground-muted">
              <strong className="text-foreground">Provenance Rule:</strong> No factual claim without evidence. 
              Every card includes at least one primary source link (on-chain tx, official post, or repo commit).
            </p>
          </div>
        </section>
        
        {/* Endpoints */}
        <section className="mb-12">
          <h2 className="text-xl font-mono font-bold text-foreground mb-4">Endpoints</h2>
          <div className="space-y-4">
            <EndpointBlock
              method="GET"
              path="/v1/catalysts"
              description="List catalysts with optional filters"
              params={[
                { name: "chain", type: "string", description: "Filter by chain (e.g., 'solana')" },
                { name: "mint", type: "string", description: "Filter by token mint address" },
                { name: "event_type", type: "string", description: "Filter by event type" },
                { name: "severity", type: "string", description: "Filter by severity (LOW, MED, HIGH)" },
                { name: "since", type: "string", description: "ISO timestamp - only return events after this time" },
                { name: "limit", type: "number", description: "Max results (default: 50, max: 200)" }
              ]}
            />
            
            <EndpointBlock
              method="GET"
              path="/v1/catalysts/latest"
              description="Get most recent catalysts across all tokens"
              params={[
                { name: "limit", type: "number", description: "Max results (default: 20, max: 100)" }
              ]}
            />
            
            <EndpointBlock
              method="GET"
              path="/v1/catalysts/{id}"
              description="Get a specific catalyst by ID"
              params={[]}
            />
          </div>
        </section>
        
        {/* Schema */}
        <section className="mb-12">
          <h2 className="text-xl font-mono font-bold text-foreground mb-4">Schema</h2>
          <div className="space-y-6">
            <SchemaField 
              name="id" 
              type="string" 
              description="Unique identifier. Format: {chain}:{symbol}:{timestamp}:{event_type}"
              example='"solana:BONK:2025-12-14T13:01:00Z:WHALE_FLOW"'
            />
            <SchemaField 
              name="dedupe_key" 
              type="string" 
              description="Stable key for deduplication. Same event with updated numbers keeps the same dedupe_key."
              example='"bonk-whale-cex-transfer-dec14"'
            />
            <SchemaField 
              name="asset" 
              type="object" 
              description="Token information"
              example='{ "chain": "solana", "mint": "DezXAZ...", "symbol": "BONK" }'
            />
            <SchemaField 
              name="ts" 
              type="string" 
              description="ISO timestamp of the event"
              example='"2025-12-14T13:01:00Z"'
            />
            <SchemaField 
              name="first_seen" 
              type="string" 
              description="When we first detected this event"
              example='"2025-12-14T13:01:00Z"'
            />
            <SchemaField 
              name="updated_at" 
              type="string?" 
              description="If the card was updated with new information"
              example='"2025-12-14T14:30:00Z"'
            />
            <SchemaField 
              name="event_type" 
              type="enum" 
              description="One of the 8 event types"
              example='"WHALE_FLOW"'
            />
            <SchemaField 
              name="severity" 
              type="enum" 
              description="Impact level: LOW, MED, HIGH"
              example='"HIGH"'
            />
            <SchemaField 
              name="time_horizon" 
              type="enum" 
              description="Relevance window: INTRADAY, SWING, LONGER"
              example='"INTRADAY"'
            />
            <SchemaField 
              name="direction" 
              type="enum?" 
              description="Price direction hint: BULLISH, BEARISH, NEUTRAL (optional)"
              example='"BEARISH"'
            />
            <SchemaField 
              name="headline" 
              type="string" 
              description="Short, scannable headline (under 100 chars)"
              example='"2.1T BONK transferred to Binance hot wallet"'
            />
            <SchemaField 
              name="key_numbers" 
              type="array" 
              description="Extracted numeric data with labels and units"
              example='[{ "label": "amount", "value": 2100000000000, "unit": "BONK" }]'
            />
            <SchemaField 
              name="so_what" 
              type="array" 
              description="2 bullets max explaining why this matters"
              example='["Large CEX deposit often precedes sell pressure..."]'
            />
            <SchemaField 
              name="confidence" 
              type="number" 
              description="Confidence score 0-1 based on evidence quality"
              example="0.94"
            />
            <SchemaField 
              name="source_count" 
              type="number" 
              description="Number of evidence items"
              example="2"
            />
            <SchemaField 
              name="evidence" 
              type="array" 
              description="Proof links with kind, ref, explorer_url, and label"
              example='[{ "kind": "onchain_tx", "explorer_url": "https://solscan.io/tx/...", "label": "Solscan tx" }]'
            />
            <SchemaField 
              name="entities" 
              type="array?" 
              description="Wallets, programs, or venues involved (optional)"
              example='[{ "type": "wallet", "address": "...", "label": "Binance Hot Wallet" }]'
            />
            <SchemaField 
              name="simulated" 
              type="boolean?" 
              description="True if this is demo/simulated data"
              example="true"
            />
          </div>
        </section>
        
        {/* Event Types */}
        <section className="mb-12">
          <h2 className="text-xl font-mono font-bold text-foreground mb-4">Event Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(EVENT_TYPE_META).map(([key, meta]) => (
              <div key={key} className="p-3 border border-border bg-background-card">
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="font-mono text-sm font-medium text-foreground">{key}</span>
                </div>
                <p className="text-xs text-foreground-muted">{meta.description}</p>
              </div>
            ))}
          </div>
        </section>
        
        {/* Example Payloads */}
        <section className="mb-12">
          <h2 className="text-xl font-mono font-bold text-foreground mb-4">Example Payloads</h2>
          <div className="space-y-4">
            {exampleCards.map((card, i) => (
              <div key={card.id} className="border border-border">
                <div className="flex items-center justify-between px-3 py-2 bg-background-elevated border-b border-border">
                  <span className="text-xs font-mono text-foreground-muted">
                    Example {i + 1}: {card.event_type}
                  </span>
                  <button
                    onClick={() => handleCopy(`example-${i}`, JSON.stringify(card, null, 2))}
                    className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                      copied === `example-${i}`
                        ? "border-accent-success text-accent-success bg-accent-success/10"
                        : "border-border text-foreground-muted hover:text-foreground"
                    }`}
                  >
                    {copied === `example-${i}` ? "Copied!" : "Copy"}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto max-h-64 bg-background">
                  <code className="text-foreground-muted">
                    {JSON.stringify(card, null, 2)}
                  </code>
                </pre>
              </div>
            ))}
          </div>
        </section>
        
        {/* Deduplication */}
        <section className="mb-12">
          <h2 className="text-xl font-mono font-bold text-foreground mb-4">Deduplication</h2>
          <div className="p-4 border border-border bg-background-card space-y-3">
            <p className="text-sm text-foreground-muted">
              Use the <code className="px-1 py-0.5 bg-background text-foreground font-mono text-xs">dedupe_key</code> field 
              to handle updates to the same event. When an event evolves (e.g., more evidence found, numbers updated), 
              we issue a new card with the same <code className="px-1 py-0.5 bg-background text-foreground font-mono text-xs">dedupe_key</code> but 
              a new <code className="px-1 py-0.5 bg-background text-foreground font-mono text-xs">id</code> and <code className="px-1 py-0.5 bg-background text-foreground font-mono text-xs">updated_at</code> timestamp.
            </p>
            <div className="text-xs font-mono text-foreground-subtle">
              <p>Recommended approach:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-foreground-muted">
                <li>Store cards keyed by <code>dedupe_key</code></li>
                <li>When receiving a card, check if <code>dedupe_key</code> exists</li>
                <li>If exists and new <code>updated_at</code> is newer, replace</li>
                <li>Use <code>id</code> for unique card identification in alerts</li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* Rate Limits */}
        <section className="mb-12">
          <h2 className="text-xl font-mono font-bold text-foreground mb-4">Rate Limits</h2>
          <div className="p-4 border border-border bg-background-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-foreground-subtle font-mono text-xs uppercase tracking-wider">
                  <th className="pb-2">Tier</th>
                  <th className="pb-2">Requests/min</th>
                  <th className="pb-2">Webhooks</th>
                </tr>
              </thead>
              <tbody className="text-foreground-muted">
                <tr className="border-t border-border-subtle">
                  <td className="py-2 font-mono">Pilot</td>
                  <td className="py-2">100</td>
                  <td className="py-2">—</td>
                </tr>
                <tr className="border-t border-border-subtle">
                  <td className="py-2 font-mono">Standard</td>
                  <td className="py-2">500</td>
                  <td className="py-2">Included</td>
                </tr>
                <tr className="border-t border-border-subtle">
                  <td className="py-2 font-mono">Enterprise</td>
                  <td className="py-2">Custom</td>
                  <td className="py-2">Priority</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        
        {/* CTA */}
        <section className="text-center py-8 border-t border-border">
          <h2 className="text-lg font-mono font-bold text-foreground mb-2">Ready to integrate?</h2>
          <p className="text-sm text-foreground-muted mb-4">
            Request pilot access to get API credentials and start building.
          </p>
          <a
            href="mailto:pilot@catalystcards.io?subject=Catalyst%20Cards%20API%20Access"
            className="inline-block px-6 py-3 bg-accent-primary text-white font-mono font-medium hover:bg-accent-primary/90 transition-colors"
          >
            Request Pilot Access
          </a>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between text-xs font-mono text-foreground-subtle">
            <span>© 2024 Catalyst Cards</span>
            <Link href="/" className="hover:text-foreground transition-colors">
              Back to Demo
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper components
function EndpointBlock({ 
  method, 
  path, 
  description, 
  params 
}: { 
  method: string; 
  path: string; 
  description: string;
  params: { name: string; type: string; description: string }[];
}) {
  return (
    <div className="border border-border">
      <div className="flex items-center gap-3 px-4 py-3 bg-background-elevated border-b border-border">
        <span className="px-2 py-0.5 text-xs font-mono font-bold bg-accent-primary text-white">
          {method}
        </span>
        <code className="font-mono text-sm text-foreground">{path}</code>
      </div>
      <div className="p-4">
        <p className="text-sm text-foreground-muted mb-3">{description}</p>
        {params.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
              Parameters
            </span>
            <div className="space-y-1">
              {params.map(p => (
                <div key={p.name} className="flex items-start gap-2 text-xs">
                  <code className="font-mono text-foreground whitespace-nowrap">{p.name}</code>
                  <span className="text-foreground-subtle">({p.type})</span>
                  <span className="text-foreground-muted">— {p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SchemaField({ 
  name, 
  type, 
  description, 
  example 
}: { 
  name: string; 
  type: string; 
  description: string; 
  example: string;
}) {
  return (
    <div className="pb-4 border-b border-border-subtle">
      <div className="flex items-center gap-2 mb-1">
        <code className="font-mono text-sm font-medium text-foreground">{name}</code>
        <span className="text-xs text-foreground-subtle font-mono">{type}</span>
      </div>
      <p className="text-sm text-foreground-muted mb-2">{description}</p>
      <code className="text-xs font-mono text-foreground-subtle bg-background px-2 py-1 block overflow-x-auto">
        {example}
      </code>
    </div>
  );
}

