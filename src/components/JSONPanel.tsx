"use client";

import { useState } from "react";
import { CatalystCard } from "@/types/catalyst";
import { copyToClipboard, generateCurlSnippet } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface JSONPanelProps {
  card: CatalystCard;
}

export function JSONPanel({ card }: JSONPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState<"json" | "curl" | null>(null);
  
  const jsonString = JSON.stringify(card, null, 2);
  const curlSnippet = generateCurlSnippet(card.id);
  
  const handleCopy = async (type: "json" | "curl") => {
    const text = type === "json" ? jsonString : curlSnippet;
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  };
  
  return (
    <div className="border-t border-border mt-4 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-mono text-foreground-muted hover:text-foreground transition-colors"
      >
        <svg 
          className={cn("w-4 h-4 transition-transform", isOpen && "rotate-90")} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Raw JSON
      </button>
      
      {isOpen && (
        <div className="mt-3 space-y-3 animate-fade-in">
          {/* JSON Panel */}
          <div className="relative">
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => handleCopy("json")}
                className={cn(
                  "px-2 py-1 text-[10px] font-mono uppercase tracking-wider",
                  "border transition-colors",
                  copied === "json" 
                    ? "border-accent-success text-accent-success bg-accent-success/10" 
                    : "border-border text-foreground-muted hover:text-foreground hover:border-foreground-muted"
                )}
              >
                {copied === "json" ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="p-4 pr-20 bg-background text-xs font-mono overflow-x-auto max-h-80 border border-border">
              <code className="text-foreground-muted">{jsonString}</code>
            </pre>
          </div>
          
          {/* curl snippet */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-foreground-subtle">
                API Request (example)
              </span>
              <button
                onClick={() => handleCopy("curl")}
                className={cn(
                  "px-2 py-1 text-[10px] font-mono uppercase tracking-wider",
                  "border transition-colors",
                  copied === "curl" 
                    ? "border-accent-success text-accent-success bg-accent-success/10" 
                    : "border-border text-foreground-muted hover:text-foreground hover:border-foreground-muted"
                )}
              >
                {copied === "curl" ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="p-4 bg-background text-xs font-mono overflow-x-auto border border-border">
              <code className="text-foreground-muted">{curlSnippet}</code>
            </pre>
          </div>
          
          {/* Endpoint hints */}
          <div className="text-[10px] font-mono text-foreground-subtle space-y-1">
            <p>Available endpoints:</p>
            <ul className="list-disc list-inside space-y-0.5 text-foreground-muted">
              <li>GET /v1/catalysts?chain=solana&mint=...</li>
              <li>GET /v1/catalysts/latest?limit=50</li>
              <li>GET /v1/catalysts/{"{id}"}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

