/**
 * IndexedDB Model Storage
 * 
 * Used to persist custom VRM/GLB models locally in the browser,
 * as Blob URLs are lost on page refresh.
 */

const DB_NAME = 'StreamAvatarDB';
const STORE_NAME = 'models';
const VERSION = 1;
const MAX_STORAGE_SIZE = 500 * 1024 * 1024; // 500MB total limit
export const MAX_MODEL_SIZE = 50 * 1024 * 1024; // 50MB per-model limit

// GLB magic bytes: "glTF" (0x676C5446) in little-endian = 0x46546C67
const GLB_MAGIC = 0x46546C67;

/**
 * Validates that a file is a genuine GLB/VRM by checking magic bytes.
 * VRM files are GLB containers, so both share the same magic header.
 */
export const validateModelFile = async (file: File | Blob): Promise<{ valid: boolean; error?: string }> => {
  // 1. Size check
  if (file.size > MAX_MODEL_SIZE) {
    return { valid: false, error: `File exceeds ${MAX_MODEL_SIZE / (1024 * 1024)}MB limit` };
  }

  if (file.size < 12) {
    return { valid: false, error: 'File is too small to be a valid 3D model' };
  }

  // 2. Magic byte verification (GLB header: magic + version + length = 12 bytes)
  try {
    const headerBuffer = await file.slice(0, 12).arrayBuffer();
    const view = new DataView(headerBuffer);
    const magic = view.getUint32(0, true); // little-endian
    const version = view.getUint32(4, true);

    if (magic !== GLB_MAGIC) {
      return { valid: false, error: 'Invalid file format: not a valid GLB/VRM file' };
    }

    if (version !== 2) {
      return { valid: false, error: `Unsupported glTF version: ${version}. Only version 2 is supported` };
    }

    // 3. Verify declared length matches actual file size (tolerance for padding)
    const declaredLength = view.getUint32(8, true);
    if (declaredLength > file.size * 1.1 || declaredLength < 12) {
      return { valid: false, error: 'File header declares invalid content length' };
    }
  } catch {
    return { valid: false, error: 'Failed to read file header' };
  }

  return { valid: true };
};

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
    };
  });
};

/**
 * Calculates total storage used across all stored models.
 */
const getTotalStorageSize = (db: IDBDatabase): Promise<number> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const items = request.result || [];
      const totalSize = items.reduce((sum: number, item: any) => sum + (item.size || 0), 0);
      resolve(totalSize);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Enforces total storage limit by deleting the least recently used (LRU) models
 * until enough space is freed for the incoming file.
 */
const enforceStorageLimit = async (db: IDBDatabase, incomingSize: number): Promise<void> => {
  const totalSize = await getTotalStorageSize(db);

  if (totalSize + incomingSize <= MAX_STORAGE_SIZE) {
    return; // Within limit, no eviction needed
  }

  const spaceNeeded = totalSize + incomingSize - MAX_STORAGE_SIZE;

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('updatedAt');

    // Open cursor ascending by updatedAt (oldest first = LRU)
    const cursorRequest = index.openCursor();
    let freedSpace = 0;

    cursorRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor && freedSpace < spaceNeeded) {
        const itemSize = cursor.value.size || 0;
        cursor.delete();
        freedSpace += itemSize;
        cursor.continue();
      } else {
        resolve();
      }
    };
    cursorRequest.onerror = () => reject(cursorRequest.error);
  });
};

export const saveModel = async (id: string, file: File | Blob, metadata: Record<string, unknown>) => {
  // Validate file before storage
  const validation = await validateModelFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const db = await initDB();

  // Enforce storage limit with LRU eviction
  await enforceStorageLimit(db, file.size);

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({
      id,
      data: file,
      ...metadata,
      updatedAt: Date.now(),
      size: file.size
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getModel = async (id: string) => {
  const db = await initDB();
  return new Promise<any>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const deleteModel = async (id: string) => {
  const db = await initDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};