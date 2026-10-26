import JSZip from 'jszip';
import { HtmlFile } from '../types';

const DB_NAME = 'HtmlReaderArchiveDB';
const DB_VERSION = 1;
const STORE_NAME = 'html_files';
const LOCAL_STORAGE_KEY = 'html_archive_backup_files';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non disponibile'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

import { parseHtmlMetadata, computeRelativePath } from '../utils/htmlParser';

// Dynamically discover any HTML files placed directly in the codebase under /public/
export function getPhysicalPublicFiles(): HtmlFile[] {
  try {
    const modules = import.meta.glob('/public/**/*.{html,htm}', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;

    const list: HtmlFile[] = [];

    for (const [filepath, content] of Object.entries(modules)) {
      if (typeof content !== 'string') continue;

      // filepath format: "/public/NomeCategoria/sotto/file.html" or "/public/file.html"
      const clean = filepath.replace(/^\/public\//, '');
      const parts = clean.split('/');
      const name = parts[parts.length - 1];

      let category = 'Generale';
      let subfolder = '';

      if (parts.length >= 3) {
        category = parts[0];
        subfolder = parts.slice(1, parts.length - 1).join('/');
      } else if (parts.length === 2) {
        category = parts[0];
        subfolder = '';
      }

      const meta = parseHtmlMetadata(content, name);
      list.push({
        id: `physical_${clean.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        name,
        title: meta.title || name,
        category,
        subfolder,
        relativePath: computeRelativePath(category, subfolder, name),
        content,
        size: new Blob([content]).size,
        description: meta.description,
        createdAt: 1700000000000,
        updatedAt: 1700000000000,
      });
    }

    return list;
  } catch (err) {
    console.warn('Impossibile scansionare i file fisici di /public', err);
    return [];
  }
}

export async function getAllFiles(): Promise<HtmlFile[]> {
  const physical = getPhysicalPublicFiles();

  try {
    const db = await openDatabase();
    const storedFiles: HtmlFile[] = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });

    // Merge: stored files take precedence if same id or same relativePath
    const map = new Map<string, HtmlFile>();
    // First populate with physical files from /public/
    for (const p of physical) {
      map.set(p.relativePath, p);
    }
    // Then overwrite or add stored/uploaded files
    for (const s of storedFiles) {
      map.set(s.relativePath, s);
    }

    return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    // Fallback to localStorage
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const stored = raw ? (JSON.parse(raw) as HtmlFile[]) : [];
      const map = new Map<string, HtmlFile>();
      for (const p of physical) {
        map.set(p.relativePath, p);
      }
      for (const s of stored) {
        map.set(s.relativePath, s);
      }
      return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    } catch {
      return physical;
    }
  }
}

export async function saveFile(file: HtmlFile): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(file);

      request.onsuccess = () => {
        syncLocalStorageBackup();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    const current = await getAllFiles();
    const index = current.findIndex(f => f.id === file.id);
    if (index >= 0) {
      current[index] = file;
    } else {
      current.push(file);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  }
}

export async function saveFiles(files: HtmlFile[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      for (const file of files) {
        store.put(file);
      }

      transaction.oncomplete = () => {
        syncLocalStorageBackup();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch {
    const current = await getAllFiles();
    const map = new Map(current.map(f => [f.id, f]));
    files.forEach(f => map.set(f.id, f));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Array.from(map.values())));
  }
}

export async function deleteFile(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        syncLocalStorageBackup();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    const current = await getAllFiles();
    const filtered = current.filter(f => f.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  }
}

export async function deleteCategory(category: string): Promise<void> {
  const current = await getAllFiles();
  const toDelete = current.filter(f => f.category === category);
  for (const item of toDelete) {
    await deleteFile(item.id);
  }
}

export async function renameCategory(oldCategory: string, newCategory: string): Promise<void> {
  const current = await getAllFiles();
  const updated = current
    .filter(f => f.category === oldCategory)
    .map(f => ({
      ...f,
      category: newCategory,
      relativePath: `${newCategory}/${f.subfolder ? f.subfolder + '/' : ''}${f.name}`.replace(/\/+/g, '/'),
      updatedAt: Date.now(),
    }));
  await saveFiles(updated);
}

export async function clearAllFiles(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

async function syncLocalStorageBackup(): Promise<void> {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const files: HtmlFile[] = request.result || [];
      // Store compact copy (without huge contents if payload exceeds limit)
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(files));
      } catch {
        // quota exceeded, skip
      }
    };
  } catch {
    // ignore
  }
}

/**
 * Creates a structured ZIP archive with public/ folder hierarchy.
 */
export async function exportArchiveZip(files: HtmlFile[]): Promise<Blob> {
  const zip = new JSZip();
  const publicFolder = zip.folder('public') || zip;

  for (const file of files) {
    const cleanCategory = (file.category || 'Generale').replace(/[\\:*?"<>|]/g, '_');
    const cleanSubfolder = (file.subfolder || '').replace(/^[/\\]+|[/\\]+$/g, '');
    const cleanName = (file.name || 'documento.html').replace(/[\\:*?"<>|]/g, '_');

    let targetPath = cleanCategory;
    if (cleanSubfolder) {
      targetPath += `/${cleanSubfolder}`;
    }
    targetPath += `/${cleanName}`;

    publicFolder.file(targetPath, file.content);
  }

  // Also include a readme explaining the structure
  const readmeContent = `# Archivio File HTML (Cartella public)
Generato automaticamente da Archivio & Lettore HTML.

Tutti i file sono organizzati in cartelle per Categoria e Sottocartelle:
${files.map(f => `- public/${f.relativePath} (Titolo: "${f.title}")`).join('\n')}

Puoi copiare la cartella "public" direttamente nel tuo web server, repository o progetto statico!
`;
  zip.file('LEGGIMI.txt', readmeContent);

  return await zip.generateAsync({ type: 'blob' });
}
