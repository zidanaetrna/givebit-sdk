/**
 * GiveBit WebSocket Manager
 * Handles real-time donation updates with auto-reconnect
 */

import WebSocket from "ws";
import { EventCallback, DonationSession, DonationEvent } from "./types";

interface PendingCallback {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timeout: NodeJS.Timeout;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private apiKey: string;
  private projectId: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, EventCallback[]> = new Map();
  private pendingRequests: Map<string, PendingCallback> = new Map();
  private messageId: number = 0;

  constructor(
    url: string,
    apiKey: string,
    projectId: string,
    maxReconnectAttempts: number = 5,
    reconnectDelay: number = 3000
  ) {
    this.url = url;
    this.apiKey = apiKey;
    this.projectId = projectId;
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.reconnectDelay = reconnectDelay;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "X-Project-Id": this.projectId,
          },
        });

        this.ws.onopen = () => {
          console.log("[GiveBit] WebSocket connected");
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit("connection_open", {
            type: "connection_open",
            session: {} as DonationSession,
            timestamp: Date.now(),
          });
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data as string);
        };

        this.ws.onerror = (error) => {
          console.error("[GiveBit] WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("[GiveBit] WebSocket disconnected");
          this.stopHeartbeat();
          this.emit("connection_lost", {
            type: "connection_lost",
            session: {} as DonationSession,
            timestamp: Date.now(),
          });
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.id && this.pendingRequests.has(message.id)) {
        const pending = this.pendingRequests.get(message.id)!;
        clearTimeout(pending.timeout);
        this.pendingRequests.delete(message.id);

        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve(message.data);
        }
      } else if (message.type) {
        const event: DonationEvent = {
          type: message.type,
          session: message.session,
          timestamp: message.timestamp || Date.now(),
          error: message.error,
        };
        this.emit(message.type, event);
      }
    } catch (error) {
      console.error("[GiveBit] Failed to parse WebSocket message:", error);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(
        `[GiveBit] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      setTimeout(() => this.connect().catch(console.error), delay);
    } else {
      console.error("[GiveBit] Max reconnection attempts reached");
    }
  }

  public send(data: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const id = String(++this.messageId);
      const message = { id, ...data };

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error("WebSocket request timeout"));
      }, 15000);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  public on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: DonationEvent): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (error) {
          console.error(`[GiveBit] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  public disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
