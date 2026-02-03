/**
 * GiveBit SDK Types
 * Updated to match actual backend API response format
 */

export type GiveBitMode = "testnet" | "mainnet";

export interface GiveBitConfig {
  projectId: string;
  apiKey: string;
  mode: GiveBitMode;
  wsEndpoint?: string;
  apiEndpoint?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

/**
 * Donation Session - matches backend response format (snake_case)
 */
export interface DonationSession {
  id: string;                          // Session UUID
  project_id: string;                  // Project ID
  creator_wallet: string;              // Wallet where funds will be sent
  donor_wallet: string;                // Donor's wallet (optional)
  chain_id: number;                    // Blockchain chain ID (e.g., 17000 for Holesky)
  contract_address: string;            // Smart contract address
  amount: string;                      // Donation amount
  memo: string;                        // Optional memo
  status: "pending" | "confirmed" | "finalized" | "failed" | "expired";
  created_at: string;                  // ISO timestamp
  tx_hash: string;                     // Transaction hash
  session_id_hash: string;             // Session ID hash
  requires_confirmation: boolean;      // Whether confirmation is required
  estimated_confirmation_time: number; // Estimated time in seconds
}

/**
 * Donation Event
 */
export interface DonationEvent {
  type: 
    | "connection_open"
    | "connection_lost"
    | "donation_pending"
    | "donation_confirmed"
    | "donation_finalized"
    | "donation_failed";
  session?: DonationSession;
  timestamp: number;
  error?: string;
}

/**
 * Event Callback
 */
export type EventCallback = (event: DonationEvent | any) => void;