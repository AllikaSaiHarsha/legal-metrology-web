"use client";

const DB_NAME = "LegalMetrologyStore";
const DB_VERSION = 1;
const STORE_NAME = "inspection_images";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported in this environment"));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db: IDBDatabase = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an image dataUrl or blob into IndexedDB with an inspection ID.
 */
export async function saveImageToIDB(id: string, dataUrl: string): Promise<void> {
  if (typeof window === "undefined" || !id || !dataUrl) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB saveImage failed:", err);
  }
}

/**
 * Retrieve an image for a specific inspection ID from IndexedDB.
 */
export async function getImageFromIDB(id: string): Promise<string | null> {
  if (typeof window === "undefined" || !id) return null;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Delete an image for a specific inspection ID from IndexedDB.
 */
export async function deleteImageFromIDB(id: string): Promise<void> {
  if (typeof window === "undefined" || !id) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB deleteImage failed:", err);
  }
}

/**
 * Fetch all stored images as a key-value record (id -> dataUrl).
 */
export async function getAllImagesFromIDB(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      const results: Record<string, string> = {};

      req.onsuccess = (e: any) => {
        const cursor = e.target.result;
        if (cursor) {
          results[cursor.key as string] = cursor.value;
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return {};
  }
}
