import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Upload,
  FolderUp,
  Plus,
  Search,
  Download,
  FolderTree,
  LayoutGrid,
  FileCode,
  Folder,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { HtmlFile, ViewMode } from './types';
import {
  getAllFiles,
  saveFile,
  saveFiles,
  deleteFile,
  deleteCategory,
  renameCategory,
  clearAllFiles,
  exportArchiveZip,
} from './services/storage';
import { formatFileSize, parseHtmlMetadata } from './utils/htmlParser';
import {
  Header,
  CategorySection,
  FolderTreeView,
  HtmlReaderModal,
  UploadModal,
  NewFileModal,
  RenameCategoryModal,
  PublicStructureModal,
} from './components';

export default function App() {
  const [files, setFiles] = useState<HtmlFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('html_archive_theme') === 'dark';
    } catch {
      return false;
    }
  });

  // Modals state
  const [activeReadFile, setActiveReadFile] = useState<HtmlFile | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isNewFileOpen, setIsNewFileOpen] = useState<boolean>(false);
  const [isStructureOpen, setIsStructureOpen] = useState<boolean>(false);
  const [renamingCategory, setRenamingCategory] = useState<string | null>(null);
  const [targetUploadCategory, setTargetUploadCategory] = useState<string | undefined>(undefined);
  const [isConfirmingClearArchive, setIsConfirmingClearArchive] = useState<boolean>(false);

  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      try {
        localStorage.setItem('html_archive_theme', next ? 'dark' : 'light');
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Load files from storage on mount
  const loadArchive = useCallback(async () => {
    setIsLoading(true);
    try {
      const stored = await getAllFiles();
      setFiles(stored);
    } catch (err) {
      console.error('Errore nel caricamento dei file', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArchive();
  }, [loadArchive]);

  // Dynamically extract categories from currently stored files (NO preset categories!)
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    files.forEach(f => {
      if (f.category && f.category.trim()) {
        set.add(f.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [files]);

  // Filter files by search query and category filter
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      const matchesCategory =
        selectedCategoryFilter === 'all' || f.category === selectedCategoryFilter;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        (f.subfolder && f.subfolder.toLowerCase().includes(q)) ||
        (f.description && f.description.toLowerCase().includes(q))
      );
    });
  }, [files, searchQuery, selectedCategoryFilter]);

  // Group filtered files by category
  const filesByCategory = useMemo(() => {
    const map = new Map<string, HtmlFile[]>();
    filteredFiles.forEach(f => {
      const cat = f.category || 'Generale';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(f);
    });
    return map;
  }, [filteredFiles]);

  // Total bytes
  const totalBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + f.size, 0);
  }, [files]);

  // File operations
  const handleSaveFiles = async (newFiles: HtmlFile[]) => {
    await saveFiles(newFiles);
    await loadArchive();
  };

  const handleUpdateFile = async (updated: HtmlFile) => {
    await saveFile(updated);
    setFiles(prev => prev.map(f => (f.id === updated.id ? updated : f)));
    if (activeReadFile?.id === updated.id) {
      setActiveReadFile(updated);
    }
  };

  const handleDeleteFile = async (id: string) => {
    await deleteFile(id);
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeReadFile?.id === id) {
      setActiveReadFile(null);
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    await deleteCategory(cat);
    await loadArchive();
  };

  const handleRenameCategory = async (newName: string) => {
    if (!renamingCategory) return;
    await renameCategory(renamingCategory, newName);
    setRenamingCategory(null);
    await loadArchive();
  };

  const handleExportZip = async () => {
    if (files.length === 0) return;
    try {
      const blob = await exportArchiveZip(files);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `archivio_public_html_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Errore creazione archivio ZIP', err);
    }
  };

  const handleConfirmClearArchive = async () => {
    await clearAllFiles();
    setIsConfirmingClearArchive(false);
    await loadArchive();
  };

  // Drag and drop handler on whole window
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    setIsUploadOpen(true);
  };

  // Palette styles: authentic luminous pearl gray canvas vs clean dark pearl
  const appBg = isDark ? 'bg-[#0B0F17] text-slate-100' : 'bg-[#EAEFF5] text-slate-950';
  const borderDivider = isDark ? 'border-slate-800' : 'border-slate-300';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-screen flex flex-col font-sans transition-colors ${appBg}`}
    >
      {/* Global Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenUpload={() => {
          setTargetUploadCategory(undefined);
          setIsUploadOpen(true);
        }}
        onOpenNewFile={() => {
          setTargetUploadCategory(undefined);
          setIsNewFileOpen(true);
        }}
        onExportZip={handleExportZip}
        onOpenStructure={() => setIsStructureOpen(true)}
        totalFiles={files.length}
        totalCategories={dynamicCategories.length}
        isDark={isDark}
        onToggleDark={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Archival Overview Bar */}
        <div className="mb-8">
          <div className={`flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b ${borderDivider}`}>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-1 text-blue-600 dark:text-blue-400">
                Lettore &amp; Gestore Archivio Statico
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance text-slate-950 dark:text-white">
                Archivio Personalizzato in Cartella Public
              </h1>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed ${textMuted}`}>
                Carica cartelle e pagine HTML: categorie e sottocartelle vengono generate
                in tempo reale senza file JSON né server complessi.
              </p>
            </div>

            {/* Metadata stats */}
            <div className={`flex items-center gap-3 text-xs shrink-0 font-medium ${textMuted}`}>
              <span className="font-bold tabular-nums text-slate-950 dark:text-white">
                {files.length}
              </span>
              <span>{files.length === 1 ? 'file' : 'file totali'}</span>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span className="font-bold tabular-nums text-slate-950 dark:text-white">
                {dynamicCategories.length}
              </span>
              <span>{dynamicCategories.length === 1 ? 'categoria' : 'categorie'}</span>
              <span aria-hidden="true" className="opacity-40">·</span>
              <span className="font-mono font-bold tabular-nums text-slate-950 dark:text-white">
                {formatFileSize(totalBytes)}
              </span>
            </div>
          </div>

          {/* Search and Category Filter Strip */}
          {files.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Cerca per titolo, file o cartella..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none border shadow-xs transition-colors ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-950 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    Cancella
                  </button>
                )}
              </div>

              {/* Dynamic Categories Filter buttons */}
              {dynamicCategories.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
                  <span className={`font-bold shrink-0 mr-1 hidden lg:inline ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Filtra:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      selectedCategoryFilter === 'all'
                        ? isDark
                          ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                          : 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : isDark
                        ? 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
                        : 'bg-white text-slate-700 hover:text-slate-950 border-slate-300 hover:border-slate-400 shadow-xs'
                    }`}
                  >
                    Tutte ({files.length})
                  </button>
                  {dynamicCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap border ${
                        selectedCategoryFilter === cat
                          ? isDark
                            ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                            : 'bg-slate-950 text-white border-slate-950 shadow-xs'
                          : isDark
                          ? 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
                          : 'bg-white text-slate-700 hover:text-slate-950 border-slate-300 hover:border-slate-400 shadow-xs'
                      }`}
                    >
                      {cat} ({files.filter(f => f.category === cat).length})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* View Mode: Loading State */}
        {isLoading && (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-3 border-slate-950 dark:border-blue-400 border-t-transparent rounded-full mb-3" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Caricamento dell'archivio in corso...</p>
          </div>
        )}

        {/* View Mode: Empty State */}
        {!isLoading && files.length === 0 && (
          <div className={`border rounded-3xl p-8 sm:p-14 text-center max-w-2xl mx-auto my-6 shadow-sm ${
            isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-300'
          }`}>
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900">
              <FolderUp className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold mb-2 text-slate-950 dark:text-white">
              Il tuo archivio è pronto e vuoto
            </h2>
            <p className={`text-xs sm:text-sm mb-6 leading-relaxed max-w-lg mx-auto ${textMuted}`}>
              Nessuna categoria preconfezionata o commerciale: le cartelle e le sottocartelle
              verranno create <strong className="text-slate-950 dark:text-white">automaticamente</strong> man mano che carichi i tuoi file HTML dal computer.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm active:scale-98 ${
                  isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-slate-950 hover:bg-slate-800 text-white'
                }`}
              >
                <FolderUp className="w-4 h-4" />
                <span>Carica Cartella dal Computer</span>
              </button>
              <button
                type="button"
                onClick={() => setIsNewFileOpen(true)}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold rounded-xl transition-colors cursor-pointer border shadow-xs ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Crea Nuovo File HTML</span>
              </button>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <span className="font-bold text-xs block mb-1 text-slate-950 dark:text-white">1. Zero JSON</span>
                <span className={`text-[11px] leading-snug block ${textMuted}`}>
                  Nessun file di configurazione da compilare. I percorsi vengono calcolati automaticamente.
                </span>
              </div>
              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <span className="font-bold text-xs block mb-1 text-slate-950 dark:text-white">2. Cartelle &amp; Sottocartelle</span>
                <span className={`text-[11px] leading-snug block ${textMuted}`}>
                  Riconosce la gerarchia della cartella caricata o assegna percorsi personalizzati.
                </span>
              </div>
              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <span className="font-bold text-xs block mb-1 text-slate-950 dark:text-white">3. Lettore Completo</span>
                <span className={`text-[11px] leading-snug block ${textMuted}`}>
                  Anteprima a schermo intero, modalità lettura, ispezione codice ed editor.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* View Mode: Search Empty State */}
        {!isLoading && files.length > 0 && filteredFiles.length === 0 && (
          <div className={`text-center py-16 rounded-3xl border border-dashed my-6 ${
            isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-300'
          }`}>
            <Search className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <h3 className="text-sm font-bold mb-1 text-slate-950 dark:text-white">
              Nessun file trovato per "{searchQuery}"
            </h3>
            <p className={`text-xs mb-4 ${textMuted}`}>
              Prova con un altro termine di ricerca oppure reimposta i filtri.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryFilter('all');
              }}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Reimposta filtri
            </button>
          </div>
        )}

        {/* View Mode: Category Sections (GRID) */}
        {!isLoading && viewMode === 'grid' && filteredFiles.length > 0 && (
          <div>
            {Array.from(filesByCategory.entries()).map(([category, catFiles]) => (
              <CategorySection
                key={category}
                category={category}
                files={catFiles}
                onOpenReader={setActiveReadFile}
                onEdit={file => setActiveReadFile(file)}
                onDeleteFile={handleDeleteFile}
                onAddFileToCategory={cat => {
                  setTargetUploadCategory(cat);
                  setIsNewFileOpen(true);
                }}
                onRenameCategory={cat => setRenamingCategory(cat)}
                onDeleteCategory={handleDeleteCategory}
                isDark={isDark}
              />
            ))}
          </div>
        )}

        {/* View Mode: Hierarchical Folder Tree */}
        {!isLoading && viewMode === 'folder-tree' && filteredFiles.length > 0 && (
          <FolderTreeView
            files={filteredFiles}
            onOpenReader={setActiveReadFile}
            onEdit={file => setActiveReadFile(file)}
            onDeleteFile={handleDeleteFile}
            isDark={isDark}
          />
        )}
      </main>

      {/* Footer */}
      <footer className={`mt-auto border-t py-6 text-xs transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-white/90 border-slate-300 text-slate-600'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-950 dark:text-white">Archivio &amp; Lettore HTML</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>Mappatura virtuale cartella <code className="font-mono font-bold text-slate-900 dark:text-slate-200">public/</code></span>
          </div>
          <div className="flex items-center gap-4">
            {files.length > 0 && (
              <button
                type="button"
                onClick={handleExportZip}
                className="font-bold hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                Esporta ZIP
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsStructureOpen(true)}
              className="font-bold hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            >
              Guida Struttura Public
            </button>
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => setIsConfirmingClearArchive(true)}
                className="font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer"
              >
                Svuota Archivio
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modal: Confirm Clear Archive (Without blocked window.confirm) */}
      {isConfirmingClearArchive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          onClick={e => {
            if (e.target === e.currentTarget) setIsConfirmingClearArchive(false);
          }}
        >
          <div
            className={`border rounded-2xl shadow-2xl p-6 max-w-md w-full ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-red-600">
                Svuotare l'intero archivio?
              </h3>
            </div>
            <p className="text-xs leading-relaxed mb-6 text-slate-600 dark:text-slate-400">
              Questa operazione eliminerà permanentemente tutti i <strong className="text-slate-900 dark:text-slate-200">{files.length} file</strong> e le cartelle salvate. Questa azione non può essere annullata.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmingClearArchive(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer border border-slate-200"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmClearArchive}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-sm active:scale-98"
              >
                Sì, elimina tutto l'archivio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Drag Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6 border-4 border-dashed border-white m-4 rounded-3xl pointer-events-none">
          <div className="text-center text-white">
            <FolderUp className="w-16 h-16 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold">Rilascia qui la cartella o i file HTML</h2>
            <p className="text-sm opacity-80 mt-1">
              Verranno organizzati automaticamente in categorie e sottocartelle
            </p>
          </div>
        </div>
      )}

      {/* MODAL: HTML Reader & Runner (HERO) */}
      {activeReadFile && (
        <HtmlReaderModal
          file={activeReadFile}
          onClose={() => setActiveReadFile(null)}
          onUpdateFile={handleUpdateFile}
        />
      )}

      {/* MODAL: Upload Files / Folder */}
      {isUploadOpen && (
        <UploadModal
          existingCategories={dynamicCategories}
          initialCategory={targetUploadCategory}
          onClose={() => setIsUploadOpen(false)}
          onSaveFiles={handleSaveFiles}
        />
      )}

      {/* MODAL: New HTML File */}
      {isNewFileOpen && (
        <NewFileModal
          existingCategories={dynamicCategories}
          defaultCategory={targetUploadCategory}
          onClose={() => setIsNewFileOpen(false)}
          onCreateFile={file => {
            handleSaveFiles([file]);
            setActiveReadFile(file);
          }}
        />
      )}

      {/* MODAL: Rename Category */}
      {renamingCategory && (
        <RenameCategoryModal
          currentCategory={renamingCategory}
          onClose={() => setRenamingCategory(null)}
          onRename={handleRenameCategory}
        />
      )}

      {/* MODAL: Public Structure Guide */}
      {isStructureOpen && (
        <PublicStructureModal
          files={files}
          onClose={() => setIsStructureOpen(false)}
          onExportZip={handleExportZip}
        />
      )}
    </div>
  );
}
