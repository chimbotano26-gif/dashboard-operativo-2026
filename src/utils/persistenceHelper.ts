/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Persistence helper for Serenazgo Nuevo Chimbote
 * Uses IndexedDB as high-capacity primary storage (>500MB capacity)
 * to avoid browser localStorage quota limitations (5MB limit),
 * while keeping lightweight metadata in localStorage.
 */

import { IncidentRecord } from '../types';

export const STORAGE_KEY_RECORDS = 'serenazgo_nch_records';
export const STORAGE_KEY_IS_CUSTOM = 'serenazgo_nch_is_custom';
export const STORAGE_KEY_LAST_SAVED = 'serenazgo_nch_last_saved';
export const STORAGE_KEY_TITLES = 'serenazgo_dashboard_custom_titles';
export const STORAGE_KEY_VERSION = 'serenazgo_nch_data_version';
export const STORAGE_KEY_RECORDS_COUNT = 'serenazgo_nch_records_count';

const IDB_NAME = 'serenazgo_nch_db_v2';
const IDB_VERSION = 1;
const STORE_NAME = 'app_data';

export interface SaveResult {
  success: boolean;
  timestamp: string;
  count: number;
  error?: string;
}

export interface BackupPayload {
  version: string;
  appName: string;
  exportDate: string;
  recordsCount: number;
  records: IncidentRecord[];
  titles?: Record<string, string>;
}

/**
 * Format current timestamp for user-facing display (e.g., "15:42 • 28/09/2026")
 */
export function formatSaveTimestamp(date: Date = new Date()): string {
  const time = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const day = date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time} • ${day}`;
}

/**
 * Open or initialize the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está soportado en este navegador.'));
      return;
    }
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir la base de datos IndexedDB.'));
  });
}

/**
 * Put an item into IndexedDB
 */
export async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error(`Error guardando ${key} en IndexedDB`));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Get an item from IndexedDB
 */
export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (e) {
    console.warn('Error leyendo desde IndexedDB:', e);
    return null;
  }
}

/**
 * Delete an item from IndexedDB
 */
export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    // Ignore error
  }
}

/**
 * Clear all items in IndexedDB
 */
export async function idbClear(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    // Ignore error
  }
}

/**
 * Persists all records and configuration to IndexedDB (preventing localStorage quota overflow)
 * and saves lightweight metadata in localStorage.
 */
export async function saveAllDataToStorage(
  records: IncidentRecord[],
  titles?: any
): Promise<SaveResult> {
  const timestamp = formatSaveTimestamp();
  try {
    // 1. Save records array directly in IndexedDB (handles hundreds of MBs seamlessly)
    await idbSet('records', records);
    await idbSet('metadata', {
      lastSaved: timestamp,
      isCustom: true,
      recordsCount: records.length,
      version: '2026_saved',
    });

    if (titles) {
      await idbSet('titles', titles);
    }

    // 2. Clear any old bloated records string from localStorage to permanently free quota!
    try {
      localStorage.removeItem(STORAGE_KEY_RECORDS);
    } catch {
      // Ignore
    }

    // 3. Save only lightweight metadata in localStorage (few bytes each)
    try {
      localStorage.setItem(STORAGE_KEY_IS_CUSTOM, 'true');
      localStorage.setItem(STORAGE_KEY_LAST_SAVED, timestamp);
      localStorage.setItem(STORAGE_KEY_VERSION, '2026_saved');
      localStorage.setItem(STORAGE_KEY_RECORDS_COUNT, String(records.length));

      if (titles) {
        localStorage.setItem(STORAGE_KEY_TITLES, JSON.stringify(titles));
      }
    } catch (lsErr) {
      console.warn('Advertencia al escribir metadatos en localStorage (datos guardados en IndexedDB):', lsErr);
    }

    return {
      success: true,
      timestamp,
      count: records.length,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al guardar datos en almacenamiento persistente.';
    console.error('Error al guardar datos en IndexedDB:', error);
    return {
      success: false,
      timestamp,
      count: records.length,
      error: message,
    };
  }
}

/**
 * Synchronous metadata loader (for immediate initial UI render before IDB responds)
 */
export function loadSavedRecordsSync(): {
  lastSaved: string | null;
  isCustom: boolean;
  recordsCount: number;
} {
  try {
    const lastSaved = localStorage.getItem(STORAGE_KEY_LAST_SAVED);
    const isCustom = localStorage.getItem(STORAGE_KEY_IS_CUSTOM) === 'true';
    const countStr = localStorage.getItem(STORAGE_KEY_RECORDS_COUNT);
    const recordsCount = countStr ? parseInt(countStr, 10) : 0;
    return { lastSaved, isCustom, recordsCount };
  } catch {
    return { lastSaved: null, isCustom: false, recordsCount: 0 };
  }
}

/**
 * Loads records from IndexedDB (or migrates from old localStorage if present)
 */
export async function loadSavedRecordsFromStorage(): Promise<{
  records: IncidentRecord[] | null;
  lastSaved: string | null;
  isCustom: boolean;
}> {
  try {
    // 1. Check IndexedDB first (Primary robust storage)
    const idbRecords = await idbGet<IncidentRecord[]>('records');
    const idbMeta = await idbGet<{ lastSaved: string; isCustom: boolean; recordsCount: number }>('metadata');

    if (idbRecords && Array.isArray(idbRecords) && idbRecords.length > 0) {
      const lastSaved = idbMeta?.lastSaved || localStorage.getItem(STORAGE_KEY_LAST_SAVED);
      const isCustom = idbMeta?.isCustom ?? (localStorage.getItem(STORAGE_KEY_IS_CUSTOM) === 'true');
      return {
        records: idbRecords,
        lastSaved: lastSaved || null,
        isCustom: !!isCustom,
      };
    }

    // 2. Migration: Check if user has legacy records stored in localStorage
    const savedInLs = localStorage.getItem(STORAGE_KEY_RECORDS);
    const lastSaved = localStorage.getItem(STORAGE_KEY_LAST_SAVED);
    const isCustom = localStorage.getItem(STORAGE_KEY_IS_CUSTOM) === 'true';

    if (savedInLs) {
      try {
        const parsed = JSON.parse(savedInLs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrate to IndexedDB for safety
          await idbSet('records', parsed);
          await idbSet('metadata', {
            lastSaved: lastSaved || formatSaveTimestamp(),
            isCustom,
            recordsCount: parsed.length,
          });
          // Clean up legacy localStorage to free up the 5MB quota immediately
          localStorage.removeItem(STORAGE_KEY_RECORDS);

          return {
            records: parsed,
            lastSaved,
            isCustom,
          };
        }
      } catch (parseErr) {
        console.warn('Error al deserializar registros legados de localStorage:', parseErr);
        localStorage.removeItem(STORAGE_KEY_RECORDS);
      }
    }
  } catch (e) {
    console.warn('No se pudieron recuperar datos guardados de IndexedDB:', e);
  }

  return {
    records: null,
    lastSaved: null,
    isCustom: false,
  };
}

/**
 * Clears all persistent records from both IndexedDB and localStorage
 */
export async function clearAllSavedData(): Promise<void> {
  try {
    await idbClear();
  } catch (e) {
    console.warn('Error limpiando IndexedDB:', e);
  }

  try {
    localStorage.removeItem(STORAGE_KEY_RECORDS);
    localStorage.removeItem(STORAGE_KEY_IS_CUSTOM);
    localStorage.removeItem(STORAGE_KEY_LAST_SAVED);
    localStorage.removeItem(STORAGE_KEY_RECORDS_COUNT);
    localStorage.removeItem(STORAGE_KEY_VERSION);
  } catch {
    // Ignore error
  }
}

/**
 * Downloads a complete portable JSON backup file so the user can transfer
 * their data to another computer, browser or device without re-entering data.
 */
export function exportBackupSnapshot(records: IncidentRecord[], titles?: any) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const payload: BackupPayload = {
    version: '1.0',
    appName: 'Serenazgo Nuevo Chimbote - Centro de Control',
    exportDate: now.toISOString(),
    recordsCount: records.length,
    records,
    titles,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Respaldo_Serenazgo_NuevoChimbote_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses a portable JSON backup file
 */
export async function importBackupSnapshot(file: File): Promise<{
  records: IncidentRecord[];
  titles?: Record<string, string>;
  recordsCount: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.records) && parsed.records.length > 0) {
          resolve({
            records: parsed.records,
            titles: parsed.titles,
            recordsCount: parsed.records.length,
          });
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          // Direct array fallback
          resolve({
            records: parsed,
            recordsCount: parsed.length,
          });
        } else {
          reject(new Error('El archivo no contiene un respaldo válido de registros.'));
        }
      } catch (err) {
        reject(new Error('Archivo JSON corrupto o con formato no reconocido.'));
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsText(file);
  });
}
