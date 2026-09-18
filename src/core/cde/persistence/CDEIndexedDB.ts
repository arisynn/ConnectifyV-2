import { CDEProfile, CDEOperation, CDEMetadata } from '../types/cde.types';

const DB_NAME = 'CDE_DB';
const DB_VERSION = 1;
export const CDE_SCHEMA_VERSION = 1;

export class CDEIndexedDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('profileCache')) {
          db.createObjectStore('profileCache', { keyPath: 'account_id' });
        }
        
        if (!db.objectStoreNames.contains('outbox')) {
          const outboxStore = db.createObjectStore('outbox', { keyPath: 'opId' });
          outboxStore.createIndex('accountId', 'accountId', { unique: false });
          outboxStore.createIndex('status', 'status', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'accountId' });
        }
      };
    });
  }

  // Profile
  async getProfile(accountId: string): Promise<CDEProfile | null> {
    return this.get<CDEProfile>('profileCache', accountId);
  }

  async setProfile(profile: CDEProfile): Promise<void> {
    return this.put('profileCache', profile);
  }

  async clearProfile(accountId: string): Promise<void> {
    return this.delete('profileCache', accountId);
  }

  // Outbox
  async getOutbox(accountId: string): Promise<CDEOperation[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      
      const transaction = this.db.transaction(['outbox'], 'readonly');
      const store = transaction.objectStore('outbox');
      const index = store.index('accountId');
      const request = index.getAll(accountId);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get outbox'));
    });
  }

  async getPendingOperations(accountId: string): Promise<CDEOperation[]> {
      const outbox = await this.getOutbox(accountId);
      return outbox.filter(op => op.status === 'PENDING' || op.status === 'SYNCING' || op.status === 'CONFLICT')
                   .sort((a, b) => a.createdAt - b.createdAt);
  }

  async addOperation(operation: CDEOperation): Promise<void> {
    return this.put('outbox', operation);
  }

  async updateOperation(operation: CDEOperation): Promise<void> {
    return this.put('outbox', operation);
  }

  async removeOperation(opId: string): Promise<void> {
    return this.delete('outbox', opId);
  }

  async clearOutbox(accountId: string): Promise<void> {
     const ops = await this.getOutbox(accountId);
     const promises = ops.map(op => this.removeOperation(op.opId));
     await Promise.all(promises);
  }

  // Metadata
  async getMetadata(accountId: string): Promise<CDEMetadata | null> {
    return this.get<CDEMetadata>('metadata', accountId);
  }

  async setMetadata(metadata: CDEMetadata): Promise<void> {
    return this.put('metadata', metadata);
  }

  async validateCache(accountId: string): Promise<boolean> {
     const meta = await this.getMetadata(accountId);
     if (!meta) return false;
     if (meta.schemaVersion !== CDE_SCHEMA_VERSION) return false;
     return true;
  }

  private async get<T>(storeName: string, key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`Failed to get from ${storeName}`));
    });
  }

  private async put(storeName: string, item: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to put into ${storeName}`));
    });
  }

  private async delete(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete from ${storeName}`));
    });
  }
}
