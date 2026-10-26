import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  RotateCw,
  ExternalLink,
  Download,
  Copy,
  Check,
  Eye,
  BookOpen,
  Code2,
  FileEdit,
  Info,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { HtmlFile, ReaderTab, DevicePreview, ReaderTheme } from '../types';
import { parseHtmlMetadata, extractReadableContent, formatFileSize } from '../utils/htmlParser';

interface HtmlReaderModalProps {
  file: HtmlFile;
  onClose: () => void;
  onUpdateFile: (updated: HtmlFile) => void;
}

export const HtmlReaderModal: React.FC<HtmlReaderModalProps> = ({
  file,
  onClose,
  onUpdateFile,
}) => {
  const [activeTab, setActiveTab] = useState<ReaderTab>('preview');
  const [device, setDevice] = useState<DevicePreview>('desktop');
  const [copied, setCopied] = useState(false);
  const [editableCode, setEditableCode] = useState(file.content);
  const [isSaved, setIsSaved] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Reader mode settings
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('pearl');
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontSerif, setFontSerif] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    setEditableCode(file.content);
  }, [file]);

  const metadata = useMemo(() => {
    return parseHtmlMetadata(editableCode, file.name);
  }, [editableCode, file.name]);

  const readable = useMemo(() => {
    return extractReadableContent(editableCode);
  }, [editableCode]);

  const handleCopySource = async () => {
    try {
      await navigator.clipboard.writeText(editableCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSaveEdit = () => {
    const updated: HtmlFile = {
      ...file,
      content: editableCode,
      size: new Blob([editableCode]).size,
      title: metadata.title || file.title,
      description: metadata.description || file.description,
      updatedAt: Date.now(),
    };
    onUpdateFile(updated);
    setIsSaved(true);
    setPreviewKey(k => k + 1);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([editableCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.endsWith('.html') ? file.name : `${file.name}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewWindow = () => {
    const blob = new Blob([editableCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w) {
      alert('Consenti i pop-up per aprire il file in una nuova scheda.');
    }
  };

  const getReaderThemeClasses = () => {
    switch (readerTheme) {
      case 'light':
        return 'bg-white text-slate-900 border-slate-200';
      case 'sepia':
        return 'bg-[#FBF3E4] text-[#423120] border-[#E5D7BF]';
      case 'dark':
        return 'bg-[#0F172A] text-slate-100 border-slate-800';
      case 'pearl':
      default:
        return 'bg-[#F1F5F9] text-slate-900 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#090D16] text-white w-full h-full overflow-hidden select-none">
      {/* 
        HERO TOOLBAR:
        Guaranteed to ALWAYS show "Chiudi Finestra" and "Archivio" prominently on the left,
        so horizontal overflow CANNOT hide them under any resolution!
      */}
      <header className="h-14 min-h-[56px] bg-[#0F172A] border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 z-30 overflow-x-auto">
        {/* Left Section: Prominent "Chiudi Finestra" and "Archivio" buttons + File Info */}
        <div className="flex items-center gap-2 shrink-0">
          {/* PRIMARY RED "CHIUDI FINESTRA" BUTTON - ALWAYS VISIBLE FIRST */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer shrink-0 active:scale-95"
            title="Chiudi finestra del lettore (Esc)"
          >
            <X className="w-4 h-4 stroke-[3]" />
            <span className="whitespace-nowrap font-bold">Chiudi Finestra</span>
          </button>

          {/* DEDICATED "ARCHIVIO" BUTTON - ALWAYS VISIBLE WITH TEXT */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 transition-all cursor-pointer shrink-0"
            title="Torna all'archivio dei file"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="whitespace-nowrap font-bold">Archivio</span>
          </button>

          <div className="hidden sm:block pl-2 border-l border-slate-700 max-w-[200px] lg:max-w-xs truncate">
            <h2 className="text-xs font-bold text-white truncate leading-tight">
              {metadata.title || file.name}
            </h2>
            <div className="text-[10px] text-blue-300 font-mono truncate leading-tight">
              public/{file.relativePath}
            </div>
          </div>
        </div>

        {/* Center: View Navigation Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Anteprima</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('source')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'source'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Codice</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Modifica</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('read-mode')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'read-mode'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Lettura</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Dati</span>
          </button>
        </div>

        {/* Right: Quick Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeTab === 'preview' && (
            <button
              type="button"
              onClick={() => setPreviewKey(k => k + 1)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Ricarica Anteprima"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenInNewWindow}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Apri in nuova scheda del browser"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleDownloadFile}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Scarica file HTML sul computer"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Viewport: The Reader is the absolute protagonist */}
      <main className="flex-1 w-full h-[calc(100%-56px)] overflow-hidden relative bg-[#090D16]">
        {/* TAB 1: ANTEPRIMA (Full Screen Edge-to-Edge Hero) */}
        {activeTab === 'preview' && (
          <div className="w-full h-full flex items-center justify-center bg-[#090D16] overflow-hidden">
            <div
              className={`h-full flex flex-col bg-white transition-all duration-150 ${
                device === 'mobile'
                  ? 'w-[380px] shadow-2xl border-x border-slate-700 my-auto'
                  : device === 'tablet'
                  ? 'w-[768px] shadow-2xl border-x border-slate-700 my-auto'
                  : 'w-full'
              }`}
            >
              <iframe
                key={previewKey}
                ref={iframeRef}
                title={metadata.title || file.name}
                srcDoc={editableCode}
                sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>
        )}

        {/* TAB 2: CODICE SORGENTE (Full Height Edge-to-Edge) */}
        {activeTab === 'source' && (
          <div className="w-full h-full flex flex-col bg-[#0B0F19] select-text">
            <div className="h-9 bg-[#111827] border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300 shrink-0">
              <span className="font-mono text-slate-400">
                {editableCode.split('\n').length} righe · {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                onClick={handleCopySource}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiato!' : 'Copia Tutto il Codice'}</span>
              </button>
            </div>
            <div className="flex-1 flex overflow-auto font-mono text-xs">
              <div className="select-none py-4 px-3 text-right text-slate-500 bg-[#070A10] border-r border-slate-800 shrink-0 leading-6 tabular-nums">
                {editableCode.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <pre className="p-4 flex-1 overflow-x-auto text-slate-100 leading-6 selection:bg-blue-600 selection:text-white">
                <code>{editableCode}</code>
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: EDITOR HTML (Full Height with Instant Save) */}
        {activeTab === 'editor' && (
          <div className="w-full h-full flex flex-col bg-[#0B0F19]">
            <div className="h-10 bg-[#111827] border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-200 shrink-0">
              <span className="font-bold text-slate-300">
                Modifica codice HTML sorgente in tempo reale
              </span>
              <div className="flex items-center gap-3">
                {isSaved && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                    <Check className="w-4 h-4" />
                    Modifiche salvate nell'archivio!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salva nell'Archivio</span>
                </button>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="select-none py-4 px-3 text-right text-slate-500 bg-[#070A10] border-r border-slate-800 shrink-0 font-mono text-xs leading-6 tabular-nums">
                {editableCode.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                value={editableCode}
                onChange={e => setEditableCode(e.target.value)}
                spellCheck={false}
                className="flex-1 w-full h-full p-4 font-mono text-xs leading-6 bg-[#0B0F19] text-slate-100 resize-none outline-none selection:bg-blue-600 selection:text-white"
              />
            </div>
          </div>
        )}

        {/* TAB 4: MODALITÀ LETTURA */}
        {activeTab === 'read-mode' && (
          <div className="w-full h-full flex overflow-hidden bg-[#0A0E17]">
            {/* Outline sidebar */}
            {metadata.headings.length > 0 && (
              <aside className="w-64 border-r border-slate-800 bg-[#0F172A] p-5 overflow-y-auto shrink-0 hidden md:block">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Indice Documento
                </h3>
                <div className="space-y-2 text-xs">
                  {metadata.headings.map((h, i) => (
                    <div
                      key={i}
                      className={`text-slate-300 hover:text-white py-1 transition-colors cursor-pointer leading-tight ${
                        h.level === 1 ? 'font-bold text-white' : h.level === 2 ? 'pl-2 text-slate-300' : 'pl-4 text-slate-400'
                      }`}
                    >
                      {h.text}
                    </div>
                  ))}
                </div>
              </aside>
            )}

            {/* Reading Column */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center select-text">
              {/* Reading controls floating bar */}
              <div className="w-full max-w-3xl mb-5 flex items-center justify-between text-xs text-slate-300 bg-[#162032] px-4 py-2 rounded-xl border border-slate-700 shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-200">Tema:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setReaderTheme('pearl')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${readerTheme === 'pearl' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Perla
                    </button>
                    <button
                      type="button"
                      onClick={() => setReaderTheme('light')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${readerTheme === 'light' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
                    >
                      Luce
                    </button>
                    <button
                      type="button"
                      onClick={() => setReaderTheme('sepia')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${readerTheme === 'sepia' ? 'bg-[#C28E58] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      Seppia
                    </button>
                    <button
                      type="button"
                      onClick={() => setReaderTheme('dark')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${readerTheme === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Notte
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFontSize(s => Math.max(14, s - 1))}
                      className="px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 text-white font-bold"
                      title="Rimpicciolisci testo"
                    >
                      A-
                    </button>
                    <span className="font-mono px-1 font-bold">{fontSize}px</span>
                    <button
                      type="button"
                      onClick={() => setFontSize(s => Math.min(30, s + 1))}
                      className="px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 text-white font-bold"
                      title="Ingrandisci testo"
                    >
                      A+
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFontSerif(s => !s)}
                    className="px-2.5 py-0.5 bg-slate-800 rounded hover:bg-slate-700 text-slate-200 font-semibold"
                  >
                    {fontSerif ? 'Serif' : 'Sans'}
                  </button>
                </div>
              </div>

              {/* Document Article */}
              <article
                className={`w-full max-w-3xl rounded-2xl p-6 sm:p-12 shadow-2xl border transition-colors mb-12 ${getReaderThemeClasses()}`}
                style={{
                  fontSize: `${fontSize}px`,
                  fontFamily: fontSerif ? '"Source Serif 4", Georgia, serif' : 'system-ui, -apple-system, sans-serif',
                  lineHeight: '1.8',
                }}
              >
                <header className="mb-8 border-b border-current/15 pb-6">
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
                    {readable.title || file.name}
                  </h1>
                  {metadata.description && (
                    <p className="text-base opacity-85 mt-2 font-normal italic">
                      {metadata.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-4 text-xs opacity-75 font-mono">
                    <span className="font-bold">{file.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{metadata.wordCount.toLocaleString()} parole</span>
                    <span aria-hidden="true">·</span>
                    <span>~{metadata.readTimeMinutes} min lettura</span>
                  </div>
                </header>

                <div
                  className="prose max-w-none space-y-4"
                  dangerouslySetInnerHTML={{ __html: readable.bodyHtml }}
                />
              </article>
            </div>
          </div>
        )}

        {/* TAB 5: METADATI & INFO */}
        {activeTab === 'info' && (
          <div className="w-full h-full p-6 sm:p-10 overflow-y-auto flex justify-center bg-[#090D16] select-text">
            <div className="w-full max-w-3xl space-y-6">
              <div className="bg-[#0F172A] rounded-2xl p-6 border border-slate-800 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  <span>Dati Documento HTML</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Titolo (&lt;title&gt;)</span>
                    <span className="font-bold text-white text-sm">{metadata.title || 'Nessuno'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Percorso virtuale public/</span>
                    <span className="font-mono text-blue-300 bg-slate-950 px-2.5 py-1 rounded inline-block border border-slate-800">
                      public/{file.relativePath}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Dimensione file</span>
                    <span className="font-bold text-white font-mono">{formatFileSize(file.size)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Codifica caratteri (Charset)</span>
                    <span className="font-mono text-white">{metadata.charset}</span>
                  </div>
                </div>

                {metadata.description && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <span className="text-slate-400 block mb-1 text-xs">Descrizione (&lt;meta description&gt;)</span>
                    <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800">
                      {metadata.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-[#0F172A] rounded-2xl p-6 border border-slate-800 shadow-xl">
                <h3 className="text-base font-bold text-white mb-4">Statistiche Rilevate</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-xs block">Parole</span>
                    <span className="text-xl font-extrabold text-white tabular-nums">{metadata.wordCount.toLocaleString()}</span>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-xs block">Tempo Lettura</span>
                    <span className="text-xl font-extrabold text-white tabular-nums">~{metadata.readTimeMinutes} min</span>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-xs block">Link rilevati</span>
                    <span className="text-xl font-extrabold text-white tabular-nums">{metadata.linksCount}</span>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-xs block">Immagini</span>
                    <span className="text-xl font-extrabold text-white tabular-nums">{metadata.imagesCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
