/**
 * Vista Auth - WebSocket Sync
 * Real-time session synchronization across tabs/devices
 */

import type { Session } from "../types";

export class WebSocketSync {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private sessionUpdateCallbacks: ((session: Session) => void)[] = [];

  constructor(url?: string) {
    this.url =
      url ||
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${
        window.location.host
      }/ws/auth`;
  }

  connect(token: string): void {
    try {
      this.ws = new WebSocket(`${this.url}?token=${token}`);

      this.ws.onopen = () => {
        console.log("[Vista Auth] WebSocket connected");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "session_update") {
            this.sessionUpdateCallbacks.forEach((callback) =>
              callback(data.session)
            );
          }
        } catch (error) {
          console.error("[Vista Auth] WebSocket message parse error:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("[Vista Auth] WebSocket error:", error);
      };

      this.ws.onclose = () => {
        console.log("[Vista Auth] WebSocket disconnected");
        this.attemptReconnect(token);
      };
    } catch (error) {
      console.error("[Vista Auth] WebSocket connection failed:", error);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  onSessionUpdate(callback: (session: Session) => void): void {
    this.sessionUpdateCallbacks.push(callback);
  }

  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[Vista Auth] Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[Vista Auth] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect(token);
    }, delay);
  }
}
