import { 
  cvToJSON,
  ClarityValue
} from '@stacks/transactions';

// Contract details
export const CONTRACT_ADDRESS = 'ST3R3SX667CWE61113X23CAQ03SZXXZ3D8C2MR7YY';
export const CONTRACT_NAME = 'stream-manager';

// Network configuration
export const NETWORK = 'testnet';
export const NETWORK_NAME = 'testnet';

export const NETWORK_URL = 'https://api.testnet.hiro.so';

// Helper to convert CV to readable format
export function parseCV(cv: ClarityValue) {
  return cvToJSON(cv);
}

// Helper to format microSTX to STX
export function microStxToStx(microStx: number): string {
  return (microStx / 1_000_000).toFixed(6);
}

// Helper to format STX to microSTX
export function stxToMicroStx(stx: number): number {
  return Math.floor(stx * 1_000_000);
}

// Helper to format duration
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '0m';
}

// Helper to parse duration to seconds
export function parseDurationToSeconds(days: number, hours: number, minutes: number): number {
  return (days * 86400) + (hours * 3600) + (minutes * 60);
}
