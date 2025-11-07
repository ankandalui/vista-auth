/**
 * Vista Auth - Session Storage
 * Handles token storage with support for localStorage, sessionStorage, and IndexedDB
 */

import type { AuthConfig } from '../types';

export class SessionStorage {
  private storageType: 'localStorage' | 'sessionStorage' | 'indexedDB';
  private dbName = 'vista-auth';
  private storeName = 'sessions';
  private db: IDBDatabase | null = null;

  constructor(config: AuthConfig = {}) {
    const configuredStorage = config.sessionStorage || 'localStorage';
    this.storageType = configuredStorage === 'cookie' ? 'localStorage' : configuredStorage;
    
    if (this.storageType === 'indexedDB') {
      this.initIndexedDB();
    }
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async setToken(token: string): Promise<void> {
    if (this.storageType === 'indexedDB') {
      return this.setIndexedDBToken(token);
    } else {
      const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.setItem('vista-auth-token', token);
    }
  }

  getToken(): string | null {
    if (this.storageType === 'indexedDB') {
      // For IndexedDB, we need async, but this is a sync method
      // So we'll fall back to localStorage for immediate reads
      console.warn('[Vista Auth] IndexedDB getToken is async. Using localStorage fallback.');
      return localStorage.getItem('vista-auth-token');
    } else {
      const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
      return storage.getItem('vista-auth-token');
    }
  }

  async getTokenAsync(): Promise<string | null> {
    if (this.storageType === 'indexedDB') {
      return this.getIndexedDBToken();
    } else {
      return this.getToken();
    }
  }

  clearToken(): void {
    if (this.storageType === 'indexedDB') {
      this.clearIndexedDBToken();
    } else {
      const storage = this.storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.removeItem('vista-auth-token');
    }
  }

  private async setIndexedDBToken(token: string): Promise<void> {
    if (!this.db) {
      await this.initIndexedDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(token, 'vista-auth-token');

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getIndexedDBToken(): Promise<string | null> {
    if (!this.db) {
      await this.initIndexedDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get('vista-auth-token');

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async clearIndexedDBToken(): Promise<void> {
    if (!this.db) {
      await this.initIndexedDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete('vista-auth-token');

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
