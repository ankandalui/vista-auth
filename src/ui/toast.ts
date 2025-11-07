/**
 * Vista Auth - Toast & Error UI
 * Built-in toast notifications and error messages
 */

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

class ToastManager {
  private toasts: Toast[] = [];
  private container: HTMLDivElement | null = null;
  private listeners: ((toasts: Toast[]) => void)[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.createContainer();
    }
  }

  private createContainer(): void {
    this.container = document.createElement("div");
    this.container.id = "vista-auth-toasts";
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  show(
    message: string,
    type: ToastType = "info",
    duration: number = 3000
  ): void {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type, duration };

    this.toasts.push(toast);
    this.render();

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.render();
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = "";

    this.toasts.forEach((toast) => {
      const element = document.createElement("div");
      element.style.cssText = `
        background: ${this.getBackgroundColor(toast.type)};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        font-weight: 500;
        pointer-events: auto;
        cursor: pointer;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
      `;

      element.textContent = toast.message;
      element.onclick = () => this.remove(toast.id);

      this.container!.appendChild(element);
    });

    // Add animation CSS if not exists
    if (!document.getElementById("vista-auth-toast-styles")) {
      const style = document.createElement("style");
      style.id = "vista-auth-toast-styles";
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    this.notifyListeners();
  }

  private getBackgroundColor(type: ToastType): string {
    switch (type) {
      case "success":
        return "#059669";
      case "error":
        return "#dc2626";
      case "warning":
        return "#d97706";
      case "info":
        return "#2563eb";
      default:
        return "#374151";
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.toasts));
  }

  onUpdate(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

// Singleton instance
const toastManager = new ToastManager();

// Export convenience functions
export function showToast(message: string, duration?: number): void {
  toastManager.show(message, "success", duration);
}

export function showError(message: string, duration?: number): void {
  toastManager.show(message, "error", duration);
}

export function showWarning(message: string, duration?: number): void {
  toastManager.show(message, "warning", duration);
}

export function showInfo(message: string, duration?: number): void {
  toastManager.show(message, "info", duration);
}

export function useToasts(callback: (toasts: Toast[]) => void): void {
  toastManager.onUpdate(callback);
}
