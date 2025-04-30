
// Database configuration
const DB_NAME = 'notesDb';
const DB_VERSION = 1;
const STORES = {
  notes: 'notes',
  envelopes: 'envelopes',
  labels: 'labels'
};

// Open the database connection
export const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject(`Database error: ${(event.target as IDBRequest).error}`);
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.notes)) {
        db.createObjectStore(STORES.notes, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.envelopes)) {
        db.createObjectStore(STORES.envelopes, { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains(STORES.labels)) {
        db.createObjectStore(STORES.labels, { keyPath: 'id' });
      }
    };
  });
};

// Generic get all items from a store
export const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  const db = await openDb();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result as T[]);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Generic get item by ID
export const getItemById = async <T>(storeName: string, id: string): Promise<T | undefined> => {
  const db = await openDb();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => {
      resolve(request.result as T);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Generic add item to store
export const addItem = async <T>(storeName: string, item: T): Promise<T> => {
  const db = await openDb();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);
    
    request.onsuccess = () => {
      resolve(item);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Generic update item in store
export const updateItem = async <T>(storeName: string, item: T): Promise<T> => {
  const db = await openDb();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    
    request.onsuccess = () => {
      resolve(item);
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Generic delete item from store
export const deleteItem = async (storeName: string, id: string): Promise<void> => {
  const db = await openDb();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Generic save all items (clear and add all)
export const saveAllItems = async <T>(storeName: string, items: T[]): Promise<void> => {
  const db = await openDb();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Clear the store first
    const clearRequest = store.clear();
    
    clearRequest.onsuccess = () => {
      // Add all items
      try {
        items.forEach(item => {
          store.add(item);
        });
        
        transaction.oncomplete = () => {
          resolve();
        };
        
        transaction.onerror = () => {
          reject(transaction.error);
        };
      } catch (error) {
        reject(error);
      }
    };
    
    clearRequest.onerror = () => {
      reject(clearRequest.error);
    };
  });
};

// Convert blob to base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Convert base64 to blob
export const base64ToBlob = (base64: string): Promise<Blob> => {
  return fetch(base64).then(res => res.blob());
};
