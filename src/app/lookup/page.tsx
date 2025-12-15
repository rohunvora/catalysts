"use client";

import { useState } from "react";
import Link from "next/link";
import { CatalystCard as CatalystCardType } from "@/types/catalyst";
import { CatalystCard } from "@/components/CatalystCard";

interface APIResponse {
  mint: string;
  symbol?: string;
  name?: string;
  catalysts: CatalystCardType[];
  catalyst_count?: number;
  message?: string;
  error?: string;
  solscan_url?: string;
  sources?: {
    twitter?: number;
  };
}

export default function LookupPage() {
  const [mint, setMint] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<APIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // For manual text input
  const [rawText, setRawText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  
  const handleLookup = async () => {
    if (!mint.trim()) {
      setError("Please enter a contract address");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch(`/api/catalysts?mint=${encodeURIComponent(mint.trim())}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Failed to fetch catalysts. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleParseText = async () => {
    if (!mint.trim() || !rawText.trim()) {
      setError("Please enter both a contract address and text to parse");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/catalysts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mint: mint.trim(),
          raw_text: rawText.trim(),
          source_url: sourceUrl.trim() || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        // Add the new catalyst to results
        setResult(prev => ({
          ...prev,
          mint: data.mint,
          symbol: data.symbol,
          catalysts: [...(prev?.catalysts || []), data.catalyst],
          catalyst_count: (prev?.catalyst_count || 0) + 1,
        }));
        setRawText("");
        setSourceUrl("");
      }
    } catch (err) {
      setError("Failed to parse text. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Example addresses for quick testing
  const exampleAddresses = [
    { symbol: "BONK", mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
    { symbol: "JUP", mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" },
    { symbol: "WIF", mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
  ];
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-elevated">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
                  Contract Lookup
                </p>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="text-sm font-mono text-foreground-muted hover:text-foreground transition-colors"
              >
                Demo
              </Link>
              <Link 
                href="/docs"
                className="text-sm font-mono text-foreground-muted hover:text-foreground transition-colors"
              >
                API Docs
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Lookup Form */}
        <section className="mb-8">
          <h2 className="text-xl font-mono font-bold text-foreground mb-4">
            Generate Catalysts for Any Token
          </h2>
          <p className="text-sm text-foreground-muted mb-6">
            Enter a Solana contract address to automatically search for and generate catalyst cards.
          </p>
          
          <div className="space-y-4">
            {/* Contract address input */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-foreground-subtle mb-2">
                Contract Address (Mint)
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={mint}
                  onChange={(e) => setMint(e.target.value)}
                  placeholder="Enter Solana token mint address..."
                  className="flex-1 px-4 py-3 bg-background border border-border text-foreground font-mono text-sm placeholder:text-foreground-subtle focus:outline-none focus:border-accent-primary"
                />
                <button
                  onClick={handleLookup}
                  disabled={loading}
                  className="px-6 py-3 bg-accent-primary text-white font-mono font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Searching..." : "Lookup"}
                </button>
              </div>
            </div>
            
            {/* Quick examples */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-foreground-subtle font-mono">Try:</span>
              {exampleAddresses.map(({ symbol, mint: addr }) => (
                <button
                  key={addr}
                  onClick={() => setMint(addr)}
                  className="px-2 py-1 border border-border text-foreground-muted hover:text-foreground hover:border-foreground-subtle font-mono transition-colors"
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        </section>
        
        {/* Manual text parsing */}
        <section className="mb-8 p-4 border border-border bg-background-elevated">
          <h3 className="text-sm font-mono font-bold text-foreground mb-3">
            Manual: Parse Tweet/News Text
          </h3>
          <p className="text-xs text-foreground-muted mb-4">
            Paste raw text from Twitter, news articles, or announcements to generate a catalyst card.
          </p>
          
          <div className="space-y-3">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste tweet or news text here..."
              rows={4}
              className="w-full px-4 py-3 bg-background border border-border text-foreground font-mono text-sm placeholder:text-foreground-subtle focus:outline-none focus:border-accent-primary resize-none"
            />
            
            <input
              type="text"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Source URL (optional) - e.g., https://x.com/..."
              className="w-full px-4 py-3 bg-background border border-border text-foreground font-mono text-sm placeholder:text-foreground-subtle focus:outline-none focus:border-accent-primary"
            />
            
            <button
              onClick={handleParseText}
              disabled={loading || !mint.trim() || !rawText.trim()}
              className="px-4 py-2 bg-foreground text-background font-mono text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              Generate Catalyst from Text
            </button>
          </div>
        </section>
        
        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 border border-accent-danger bg-accent-danger/10 text-accent-danger text-sm font-mono">
            {error}
          </div>
        )}
        
        {/* Results */}
        {result && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-mono font-bold text-foreground">
                  {result.symbol ? `${result.symbol} Catalysts` : "Results"}
                </h3>
                {result.name && (
                  <p className="text-sm text-foreground-muted">{result.name}</p>
                )}
              </div>
              {result.sources && (
                <div className="flex items-center gap-4 text-xs font-mono text-foreground-muted">
                  {result.sources.twitter !== undefined && (
                    <span>
                      <span className="text-foreground">{result.sources.twitter}</span> tweets
                    </span>
                  )}
                </div>
              )}
              {result.solscan_url && (
                <a
                  href={result.solscan_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-accent-primary hover:underline"
                >
                  View on Solscan →
                </a>
              )}
            </div>
            
            {result.message && (
              <div className="mb-4 p-3 border border-border bg-background-card text-sm text-foreground-muted font-mono">
                {result.message}
              </div>
            )}
            
            {result.catalysts.length > 0 ? (
              <div className="space-y-4">
                {result.catalysts.map((card, i) => (
                  <CatalystCard key={card.id || i} card={card} mode="full" />
                ))}
              </div>
            ) : (
              <div className="p-8 border border-border text-center">
                <p className="text-foreground-muted font-mono text-sm">
                  No catalysts found. Try pasting relevant news or tweets using the manual input above.
                </p>
              </div>
            )}
          </section>
        )}
        
        {/* Instructions when no result */}
        {!result && !error && (
          <section className="p-8 border border-dashed border-border text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-foreground-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="font-mono font-bold text-foreground mb-2">
              Enter a Contract Address
            </h3>
            <p className="text-sm text-foreground-muted max-w-md mx-auto">
              Paste any Solana token mint address to search for catalysts, 
              or use the manual input to parse specific tweets and news.
            </p>
          </section>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-xs font-mono text-foreground-subtle text-center">
            <p className="mb-2">
              For production use: Configure Twitter API keys and news sources in environment variables.
            </p>
            <p>
              See <Link href="/docs" className="text-accent-primary hover:underline">/docs</Link> for API integration guide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

