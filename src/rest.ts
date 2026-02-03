/**
 * REST API Client for GiveBit
 */

import { DonationSession } from "./types";
import { REQUEST_TIMEOUT, REST_FALLBACK_INTERVAL } from "./config";

export class RestClient {
  private baseUrl: string;
  private apiKey: string;
  private projectId: string;
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(baseUrl: string, apiKey: string, projectId: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.projectId = projectId;
  }

  private getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "X-Project-Id": this.projectId,
    };
  }

  /**
   * Create a new donation session
   * @param options - Donation session options
   * @returns Promise<DonationSession>
   */
  public async createDonationSession(options: {
    amount: number | string;
    currency: string;
    network: string;
    creatorWallet: string;  // REQUIRED - where funds will be sent
    donorWallet?: string;
    metadata?: Record<string, any>;
  }): Promise<DonationSession> {
    // Validate that creator_wallet is provided
    if (!options.creatorWallet || options.creatorWallet.trim() === '') {
      throw new Error(
        'creator_wallet is required. This is the wallet address where donation funds will be sent. ' +
        'Please provide a valid Ethereum address.'
      );
    }

    // Convert amount to string if it's a number
    const amountStr = typeof options.amount === 'number' 
      ? options.amount.toString() 
      : options.amount;

    const response = await fetch(`${this.baseUrl}/donation/session`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        amount: amountStr,
        currency: options.currency,
        network: options.network,
        creator_wallet: options.creatorWallet,
        donor_wallet: options.donorWallet,
        metadata: options.metadata || {},
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create donation session: ${error}`);
    }

    const data = await response.json();
    return data as DonationSession;
  }

  public async getDonationSession(
    sessionId: string
  ): Promise<DonationSession> {
    const response = await fetch(`${this.baseUrl}/donation/${sessionId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get donation session: ${response.statusText}`);
    }

    const data = await response.json();
    return data as DonationSession;
  }

  public async getDonationHistory(limit?: number): Promise<DonationSession[]> {
    const url = new URL(`${this.baseUrl}/donation/history`);
    if (limit) {
      url.searchParams.set("limit", limit.toString());
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get donation history: ${response.statusText}`
      );
    }

    const data = await response.json() as { donations: DonationSession[] };
    return data.donations;
  }

  public startPolling(
    sessionId: string,
    callback: (session: DonationSession) => void
  ): void {
    if (this.pollingIntervals.has(sessionId)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const session = await this.getDonationSession(sessionId);
        callback(session);

        if (
          session.status === "finalized" ||
          session.status === "failed" ||
          session.status === "expired"
        ) {
          this.stopPolling(sessionId);
        }
      } catch (error) {
        console.error(`[GiveBit] Polling error for ${sessionId}:`, error);
      }
    }, REST_FALLBACK_INTERVAL);

    this.pollingIntervals.set(sessionId, interval);
  }

  public stopPolling(sessionId: string): void {
    const interval = this.pollingIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(sessionId);
    }
  }

  public stopAllPolling(): void {
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
  }
}