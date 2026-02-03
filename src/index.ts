/**
 * GiveBit SDK - Main Entry Point
 * Event-driven crypto donation infrastructure
 */

import { WebSocketManager } from "./websocket";
import { RestClient } from "./rest";
import {
  GiveBitConfig,
  DonationSession,
  DonationEvent,
  EventCallback,
} from "./types";
import { getConfig, RECONNECT_ATTEMPTS, RECONNECT_DELAY, SDK_VERSION } from "./config";

export class GiveBit {
  private static instance: GiveBit | null = null;
  private wsManager: WebSocketManager | null = null;
  private restClient: RestClient | null = null;
  private config: GiveBitConfig;
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private activeSessions: Set<string> = new Set();

  private constructor(config: GiveBitConfig) {
    this.config = {
      reconnectAttempts: RECONNECT_ATTEMPTS,
      reconnectDelay: RECONNECT_DELAY,
      ...config,
    };

    this.initializeEndpoints();
  }

  private initializeEndpoints(): void {
    const modeConfig = getConfig(this.config.mode);

    const wsEndpoint = this.config.wsEndpoint || modeConfig.wsEndpoint;
    const apiEndpoint = this.config.apiEndpoint || modeConfig.apiEndpoint;

    this.wsManager = new WebSocketManager(
      wsEndpoint,
      this.config.apiKey,
      this.config.projectId,
      this.config.reconnectAttempts,
      this.config.reconnectDelay
    );

    this.restClient = new RestClient(
      apiEndpoint,
      this.config.apiKey,
      this.config.projectId
    );

    this.setupEventForwarding();
  }

  private setupEventForwarding(): void {
    if (this.wsManager) {
      ["connection_open", "connection_lost", "donation_pending", "donation_confirmed", "donation_finalized", "donation_failed"].forEach(
        (event) => {
          this.wsManager!.on(event, (data) => {
            this.broadcastEvent(data);
          });
        }
      );
    }
  }

  public static init(config: GiveBitConfig): GiveBit {
    if (!GiveBit.instance) {
      GiveBit.instance = new GiveBit(config);
    }
    return GiveBit.instance;
  }

  public static getInstance(): GiveBit {
    if (!GiveBit.instance) {
      throw new Error("GiveBit not initialized. Call GiveBit.init() first.");
    }
    return GiveBit.instance;
  }

  public async connect(): Promise<void> {
    if (!this.wsManager) {
      throw new Error("WebSocket manager not initialized");
    }

    try {
      await this.wsManager.connect();
    } catch (error) {
      console.warn(
        "[GiveBit] WebSocket connection failed, falling back to REST polling",
        error
      );
    }
  }

  /**
   * Create a new donation session
   * @param options - Donation session options
   * @param options.creatorWallet - REQUIRED: The wallet address where funds will be sent (e.g., streamer's wallet)
   * @param options.amount - The donation amount
   * @param options.currency - The cryptocurrency (e.g., 'ETH', 'USDT')
   * @param options.network - The blockchain network (e.g., 'holesky', 'ethereum', 'polygon')
   * @param options.donorWallet - Optional: The donor's wallet address
   * @param options.metadata - Optional: Additional metadata
   * @returns Promise<DonationSession>
   */
  public async createDonationSession(options: {
    creatorWallet: string;  // REQUIRED - where the donation funds will go
    amount: number | string;
    currency: string;
    network: string;
    donorWallet?: string;
    metadata?: Record<string, any>;
  }): Promise<DonationSession> {
    if (!this.restClient) {
      throw new Error("REST client not initialized");
    }

    const session = await this.restClient.createDonationSession(options);

    this.activeSessions.add(session.id);

    if (this.restClient) {
      this.restClient.startPolling(session.id, (updatedSession) => {
        this.broadcastEvent({
          type: ("donation_" + updatedSession.status) as any,
          session: updatedSession,
          timestamp: Date.now(),
        });
      });
    }

    return session;
  }

  public async getDonationSession(sessionId: string): Promise<DonationSession> {
    if (!this.restClient) {
      throw new Error("REST client not initialized");
    }

    return this.restClient.getDonationSession(sessionId);
  }

  public async getDonationHistory(limit?: number): Promise<DonationSession[]> {
    if (!this.restClient) {
      throw new Error("REST client not initialized");
    }

    return this.restClient.getDonationHistory(limit);
  }

  public on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: EventCallback): void {
    const callbacks = this.eventListeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private broadcastEvent(event: DonationEvent): void {
    const callbacks = this.eventListeners.get(event.type) || [];
    callbacks.forEach((cb) => {
      try {
        cb(event);
      } catch (error) {
        console.error(
          `[GiveBit] Error in event listener for ${event.type}:`,
          error
        );
      }
    });
  }

  public isConnected(): boolean {
    return this.wsManager ? this.wsManager.isConnected() : false;
  }

  public disconnect(): void {
    if (this.wsManager) {
      this.wsManager.disconnect();
    }
    if (this.restClient) {
      this.restClient.stopAllPolling();
    }
    this.activeSessions.clear();
  }

  public getConfig(): GiveBitConfig {
    return this.config;
  }
}

export { DonationSession, DonationEvent, EventCallback, GiveBitConfig };