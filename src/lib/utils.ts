import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format relative time (e.g., "6m ago", "3h ago")
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Format numbers for display (compact notation for large numbers)
export function formatNumber(value: number, decimals: number = 2): string {
  if (Math.abs(value) >= 1e9) {
    return (value / 1e9).toFixed(decimals) + "B";
  }
  if (Math.abs(value) >= 1e6) {
    return (value / 1e6).toFixed(decimals) + "M";
  }
  if (Math.abs(value) >= 1e3) {
    return (value / 1e3).toFixed(decimals) + "K";
  }
  return value.toFixed(decimals);
}

// Truncate address for display (e.g., "5YNmS...jXZ9n")
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Generate a stable ID for catalyst cards
export function generateCatalystId(
  chain: string,
  symbol: string,
  timestamp: string,
  eventType: string
): string {
  return `${chain}:${symbol}:${timestamp}:${eventType}`;
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Generate curl snippet for API demo
export function generateCurlSnippet(cardId: string): string {
  return `curl -X GET "https://api.catalystcards.io/v1/catalysts/${cardId}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: application/json"`;
}

