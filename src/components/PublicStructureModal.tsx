import React from 'react';
import { X, Folder, FileCode, Download, Copy, Check, HelpCircle, HardDrive, Sparkles } from 'lucide-react';
import { HtmlFile } from '../types';

interface PublicStructureModalProps {
  files: HtmlFile[];
  onClose: () => void;
  onExportZip: () => void;
}

export const PublicStructureModal: React.FC<PublicStructureModalProps> = ({
  files,
  onClose,
  onExportZip,
}) => {
  const [copied, setCopied] = React.useState(false);

  const pathsList = files.map(f => `public/${f.relativePath}`).join('\n');

  const handleCopyPaths = async () => {
    try {
      await navigator.clipboard.writeText(pathsList);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-6"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col shrink-0 min-h-[580px] my-auto overflow-hidden text-slate-900"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-[60px] min-h-[60px] bg-slate-50 border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Guida Struttura Cartella "public"
              </h2>
              <p className="text-xs text-slate-500">
                Come caricare i file direttamente nel codice o tramite l'interfaccia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-5 text-xs text-slate-700 overflow-y-auto">
          {/* Card: Caricamento Diretto nel Codice */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-2.5">
            <h3 className="font-bold text-emerald-950 flex items-center gap-2 text-sm">
              <HardDrive className="w-4 h-4 text-emerald-700" />
              <span>SÌ! Puoi inserire i file direttamente nella cartella codice</span>
            </h3>
            <p className="leading-relaxed text-emerald-900">
              Nel codice del progetto esiste la cartella fisica <code className="font-mono bg-white border border-emerald-300 px-1.5 py-0.5 rounded font-bold text-emerald-950">/public</code>. Puoi creare liberamente cartelle e sottocartelle al suo interno:
            </p>
            <div className="bg-[#0B132B] text-emerald-300 font-mono text-[11px] p-3 rounded-lg leading-relaxed border border-emerald-950">
              <div>📁 public/</div>
              <div className="pl-4">├── 📁 Guide/ <span className="text-slate-400">→ Diventa la Categoria "Guide"</span></div>
              <div className="pl-4">│   ├── 📄 introduzione.html</div>
              <div className="pl-4">│   └── 📁 Avanzate/ <span className="text-slate-400">→ Diventa sottocartella "Avanzate"</span></div>
              <div className="pl-4">│       └── 📄 configurazione.html</div>
              <div className="pl-4">└── 📁 Documenti/ <span className="text-slate-400">→ Diventa la Categoria "Documenti"</span></div>
              <div className="pl-4">    └── 📄 report-2026.html</div>
            </div>
            <p className="text-[11px] text-emerald-800 leading-normal">
              <strong>Riconoscimento istantaneo:</strong> Il sistema scansiona automaticamente la cartella fisica <code>/public/</code> senza bisogno di file JSON né configurazioni.
            </p>
          </div>

          {/* Regola Organizzazione */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Formula di Organizzazione Automatica</span>
            </h3>
            <div className="p-3 bg-slate-950 text-slate-100 font-mono text-[11px] rounded-xl font-bold">
              public / [NomeCategoria] / [SottoCartelleOpzionali] / [file.html]
            </div>
            <p className="leading-relaxed text-slate-600">
              Il primo livello di cartella determina sempre la <strong>Categoria</strong>; i livelli intermedi compongono le <strong>sottocartelle</strong>; all'interno puoi inserire tutti i file <code>.html</code> o <code>.htm</code> che desideri.
            </p>
          </div>

          {/* Elenco file correnti */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900">
                Elenco dei {files.length} percorsi attualmente rilevati:
              </span>
              <button
                type="button"
                onClick={handleCopyPaths}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-800 transition-colors cursor-pointer font-bold shadow-xs text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiati!' : 'Copia percorsi'}</span>
              </button>
            </div>

            <div className="bg-[#0F172A] text-slate-200 font-mono text-xs p-4 rounded-xl max-h-40 overflow-y-auto leading-6 border border-slate-800">
              {files.length > 0 ? (
                pathsList.split('\n').map((path, idx) => (
                  <div key={idx} className="hover:text-blue-300 transition-colors">
                    {path}
                  </div>
                ))
              ) : (
                <span className="text-slate-400 italic">Nessun file presente nell'archivio.</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-[60px] min-h-[60px] bg-slate-50 border-t border-slate-200 px-6 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Chiudi
          </button>
          {files.length > 0 && (
            <button
              type="button"
              onClick={onExportZip}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs active:scale-98 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Scarica Archivio ZIP Strutturato</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
