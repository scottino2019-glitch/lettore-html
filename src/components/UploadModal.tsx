import React, { useState, useRef } from 'react';
import { X, Upload, FolderUp, FileCode, Check, Plus, Layers } from 'lucide-react';
import { HtmlFile } from '../types';
import { parseHtmlMetadata, computeRelativePath, formatFileSize } from '../utils/htmlParser';

interface UploadModalProps {
  existingCategories: string[];
  initialCategory?: string;
  onClose: () => void;
  onSaveFiles: (files: HtmlFile[]) => void;
}

interface StagedFile {
  name: string;
  category: string;
  subfolder: string;
  content: string;
  size: number;
  title: string;
  description: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  existingCategories,
  initialCategory,
  onClose,
  onSaveFiles,
}) => {
  const [tab, setTab] = useState<'folder' | 'files' | 'paste'>('folder');

  // Staged files ready to be committed
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // For individual files tab
  const [manualCategory, setManualCategory] = useState<string>(initialCategory || '');
  const [isNewCategoryInput, setIsNewCategoryInput] = useState<boolean>(existingCategories.length === 0);
  const [manualSubfolder, setManualSubfolder] = useState<string>('');

  // For paste tab
  const [pasteName, setPasteName] = useState<string>('nuova-pagina.html');
  const [pasteCategory, setPasteCategory] = useState<string>(initialCategory || (existingCategories[0] || ''));
  const [pasteSubfolder, setPasteSubfolder] = useState<string>('');
  const [pasteCode, setPasteCode] = useState<string>(
    '<!DOCTYPE html>\n<html lang="it">\n<head>\n  <meta charset="UTF-8">\n  <title>Mio Documento</title>\n</head>\n<body>\n  <h1>Titolo del Documento</h1>\n  <p>Scrivi o incolla qui il tuo contenuto HTML...</p>\n</body>\n</html>'
  );

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  // Handle folder upload with webkitdirectory
  const handleFolderSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    setIsProcessing(true);
    const newStaged: StagedFile[] = [];

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      const name = file.name;
      if (!name.toLowerCase().endsWith('.html') && !name.toLowerCase().endsWith('.htm')) {
        continue;
      }

      try {
        const text = await readFileAsText(file);
        const relPath = file.webkitRelativePath || name;
        const segments = relPath.split('/').filter(Boolean);

        let category = 'Generale';
        let subfolder = '';

        if (segments.length >= 3) {
          category = segments[0];
          subfolder = segments.slice(1, segments.length - 1).join('/');
        } else if (segments.length === 2) {
          category = segments[0];
          subfolder = '';
        } else {
          category = manualCategory.trim() || 'Generale';
          subfolder = manualSubfolder.trim();
        }

        const meta = parseHtmlMetadata(text, name);

        newStaged.push({
          name,
          category,
          subfolder,
          content: text,
          size: file.size,
          title: meta.title,
          description: meta.description,
        });
      } catch (err) {
        console.error('Errore lettura file', file.name, err);
      }
    }

    setStagedFiles(prev => [...prev, ...newStaged]);
    setIsProcessing(false);
    setStatusMessage(`${newStaged.length} file aggiunti alla lista di salvataggio.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Handle individual files selection
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    const targetCategory = manualCategory.trim() || 'Generale';
    const targetSubfolder = manualSubfolder.trim();

    setIsProcessing(true);
    const newStaged: StagedFile[] = [];

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      const name = file.name;
      if (!name.toLowerCase().endsWith('.html') && !name.toLowerCase().endsWith('.htm')) {
        continue;
      }

      try {
        const text = await readFileAsText(file);
        const meta = parseHtmlMetadata(text, name);

        newStaged.push({
          name,
          category: targetCategory,
          subfolder: targetSubfolder,
          content: text,
          size: file.size,
          title: meta.title,
          description: meta.description,
        });
      } catch (err) {
        console.error('Errore lettura file', file.name, err);
      }
    }

    setStagedFiles(prev => [...prev, ...newStaged]);
    setIsProcessing(false);
    setStatusMessage(`${newStaged.length} file aggiunti alla lista.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Add pasted code to staged
  const handleAddPasted = () => {
    if (!pasteCode.trim()) return;

    let cleanName = pasteName.trim();
    if (!cleanName) cleanName = 'pagina.html';
    if (!cleanName.endsWith('.html') && !cleanName.endsWith('.htm')) {
      cleanName += '.html';
    }

    const cat = pasteCategory.trim() || 'Generale';
    const meta = parseHtmlMetadata(pasteCode, cleanName);

    setStagedFiles(prev => [
      ...prev,
      {
        name: cleanName,
        category: cat,
        subfolder: pasteSubfolder.trim(),
        content: pasteCode,
        size: new Blob([pasteCode]).size,
        title: meta.title,
        description: meta.description,
      },
    ]);

    setPasteName(`pagina-${stagedFiles.length + 2}.html`);
    setStatusMessage(`File "${cleanName}" aggiunto.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Commit all staged files to storage
  const handleCommit = () => {
    if (stagedFiles.length === 0) return;

    const now = Date.now();
    const finalFiles: HtmlFile[] = stagedFiles.map((s, idx) => ({
      id: `file_${now}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      name: s.name,
      title: s.title || s.name,
      category: s.category,
      subfolder: s.subfolder,
      relativePath: computeRelativePath(s.category, s.subfolder, s.name),
      content: s.content,
      size: s.size,
      description: s.description,
      createdAt: now,
      updatedAt: now,
    }));

    onSaveFiles(finalFiles);
    onClose();
  };

  const preventEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    /* Modal Backdrop: Stable, scrollable container without squishing or shrinking */
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-6">
      {/* 
        Dialog Card:
        - shrink-0 (NEVER shrinks under flexbox)
        - min-h-[580px] (prevents vertical collapsing when keyboard opens)
        - w-full max-w-3xl (stable width)
      */}
      <div
        className="relative w-full max-w-3xl bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col shrink-0 min-h-[580px] overflow-hidden text-slate-900 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Fixed 60px height */}
        <div className="h-[60px] min-h-[60px] bg-slate-50 border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-950">
                Aggiungi File HTML all'Archivio
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Organizzazione automatica in cartelle e sottocartelle senza configurazioni JSON
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
            title="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip - Fixed 44px height */}
        <div className="h-[44px] min-h-[44px] flex items-center px-6 bg-slate-100 border-b border-slate-200 gap-2 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setTab('folder')}
            className={`flex items-center gap-2 h-full px-3 border-b-2 transition-colors cursor-pointer ${
              tab === 'folder'
                ? 'border-slate-950 text-slate-950 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <FolderUp className="w-4 h-4" />
            <span>Carica Cartella Completa</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('files')}
            className={`flex items-center gap-2 h-full px-3 border-b-2 transition-colors cursor-pointer ${
              tab === 'files'
                ? 'border-slate-950 text-slate-950 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Carica File Singoli</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('paste')}
            className={`flex items-center gap-2 h-full px-3 border-b-2 transition-colors cursor-pointer ${
              tab === 'paste'
                ? 'border-slate-950 text-slate-950 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Incolla Codice HTML</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-6 space-y-5 text-xs">
          {/* TAB 1: CARICA CARTELLA */}
          {tab === 'folder' && (
            <div className="space-y-4">
              <div
                onClick={() => folderInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-slate-900 bg-slate-50 hover:bg-slate-100/70 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <FolderUp className="w-6 h-6 text-slate-800" />
                </div>
                <h3 className="text-sm font-bold text-slate-950 mb-1">
                  Seleziona una cartella dal computer
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  L'archivio legge ricorsivamente tutti i file HTML, creando <strong className="text-slate-900">automaticamente</strong> la Categoria (dal nome della cartella principale) e le relative sottocartelle.
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 text-white text-xs font-bold rounded-lg shadow-xs group-hover:bg-slate-800 transition-colors">
                  <FolderUp className="w-3.5 h-3.5" />
                  <span>Scegli cartella...</span>
                </div>
                <input
                  ref={folderInputRef}
                  type="file"
                  /* @ts-expect-error webkitdirectory is standard for folder upload */
                  webkitdirectory=""
                  directory=""
                  multiple
                  onChange={handleFolderSelected}
                  className="hidden"
                />
              </div>

              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 text-xs text-slate-700 flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Mappatura istantanea:</strong> se carichi una cartella chiamata <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-200 text-slate-900">Progetti/Web/index.html</code>, il file verrà categorizzato sotto <strong className="text-slate-900">"Progetti"</strong> con sottocartella <strong className="text-slate-900">"Web"</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CARICA FILE SINGOLI */}
          {tab === 'files' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-900">
                  Categoria di destinazione per i file
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  {existingCategories.length > 0 && !isNewCategoryInput ? (
                    <div className="flex-1 flex gap-2">
                      <select
                        value={manualCategory}
                        onChange={e => setManualCategory(e.target.value)}
                        className="flex-1 h-10 min-h-[40px] bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-950 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="">-- Seleziona una categoria creata in precedenza --</option>
                        {existingCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewCategoryInput(true);
                          setManualCategory('');
                        }}
                        className="px-3 h-10 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        + Nuova Categoria
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Nome nuova categoria (es: Guide, Progetti, Manuali...)"
                        value={manualCategory}
                        onChange={e => setManualCategory(e.target.value)}
                        onKeyDown={preventEnterKey}
                        className="flex-1 h-10 min-h-[40px] bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-950 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                      />
                      {existingCategories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsNewCategoryInput(false)}
                          className="px-3 h-10 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Usa Esistente
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Sottocartella (opzionale)
                  </label>
                  <input
                    type="text"
                    placeholder="es: sezione-a oppure bozze"
                    value={manualSubfolder}
                    onChange={e => setManualSubfolder(e.target.value)}
                    onKeyDown={preventEnterKey}
                    className="w-full h-10 min-h-[40px] bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-950 font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shrink-0"
                  />
                </div>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-slate-900 bg-slate-50 hover:bg-slate-100/70 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group"
              >
                <div className="w-10 h-10 bg-white rounded-xl shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-2">
                  <FileCode className="w-5 h-5 text-slate-800" />
                </div>
                <h4 className="text-xs font-bold text-slate-950 mb-0.5">
                  Seleziona uno o più file HTML dal computer
                </h4>
                <p className="text-[11px] text-slate-500">
                  Formati supportati: .html, .htm
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm"
                  multiple
                  onChange={handleFilesSelected}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 3: INCOLLA CODICE */}
          {tab === 'paste' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Nome File
                  </label>
                  <input
                    type="text"
                    value={pasteName}
                    onChange={e => setPasteName(e.target.value)}
                    onKeyDown={preventEnterKey}
                    className="w-full h-10 min-h-[40px] bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-950 font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shrink-0"
                    placeholder="documento.html"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={pasteCategory}
                    onChange={e => setPasteCategory(e.target.value)}
                    onKeyDown={preventEnterKey}
                    className="w-full h-10 min-h-[40px] bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-950 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shrink-0"
                    placeholder="es: Documenti"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Sottocartella (opzionale)
                  </label>
                  <input
                    type="text"
                    value={pasteSubfolder}
                    onChange={e => setPasteSubfolder(e.target.value)}
                    onKeyDown={preventEnterKey}
                    className="w-full h-10 min-h-[40px] bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-950 font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shrink-0"
                    placeholder="es: schede"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Codice HTML Sorgente
                </label>
                <textarea
                  value={pasteCode}
                  onChange={e => setPasteCode(e.target.value)}
                  className="w-full h-44 min-h-[176px] bg-[#0F172A] text-slate-100 font-mono text-xs p-3.5 rounded-xl border border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none shrink-0"
                  placeholder="Incolla qui il codice HTML..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddPasted}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs active:scale-98 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi alla lista di salvataggio</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGED FILES PREVIEW LIST */}
          {stagedFiles.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-950">
                  File in attesa di salvataggio ({stagedFiles.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setStagedFiles([])}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                >
                  Svuota lista
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 max-h-36 overflow-y-auto">
                {stagedFiles.map((f, i) => (
                  <div key={i} className="px-3.5 py-2 flex items-center justify-between text-xs hover:bg-white transition-colors">
                    <div className="truncate mr-3">
                      <span className="font-mono text-slate-950 font-bold truncate block">
                        {f.name}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        public/{f.category}{f.subfolder ? `/${f.subfolder}` : ''}/{f.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="font-mono text-slate-500 text-[11px] font-medium">
                        {formatFileSize(f.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStagedFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer transition-colors"
                        title="Rimuovi"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed 60px height */}
        <div className="h-[60px] min-h-[60px] bg-slate-50 border-t border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="text-xs">
            {statusMessage ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {statusMessage}
              </span>
            ) : (
              <span className="text-slate-600 font-medium">
                {stagedFiles.length === 0
                  ? 'Nessun file selezionato finora'
                  : `${stagedFiles.length} file pronti per l'archivio`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleCommit}
              disabled={stagedFiles.length === 0}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
                stagedFiles.length > 0
                  ? 'bg-slate-950 text-white hover:bg-slate-800 shadow-sm active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Conferma e Salva</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
