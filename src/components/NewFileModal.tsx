import React, { useState } from 'react';
import { X, FileCode, Check } from 'lucide-react';
import { HtmlFile } from '../types';
import { computeRelativePath } from '../utils/htmlParser';

interface NewFileModalProps {
  existingCategories: string[];
  defaultCategory?: string;
  onClose: () => void;
  onCreateFile: (file: HtmlFile) => void;
}

export const NewFileModal: React.FC<NewFileModalProps> = ({
  existingCategories,
  defaultCategory,
  onClose,
  onCreateFile,
}) => {
  const [name, setName] = useState('nuovo-documento.html');
  const [title, setTitle] = useState('Nuovo Documento HTML');
  const [category, setCategory] = useState(defaultCategory || (existingCategories.length > 0 ? existingCategories[0] : ''));
  const [isNewCategory, setIsNewCategory] = useState(existingCategories.length === 0 || !defaultCategory);
  const [subfolder, setSubfolder] = useState('');
  const [templateType, setTemplateType] = useState<'article' | 'page' | 'blank'>('article');

  const getTemplateCode = () => {
    switch (templateType) {
      case 'article':
        return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Descrizione del documento...">
  <title>${title || 'Documento'}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.7;
      color: #1E293B;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 24px;
      background-color: #F8FAFC;
    }
    h1 { color: #0F172A; border-bottom: 2px solid #E2E8F0; padding-bottom: 12px; }
    h2 { color: #1E40AF; margin-top: 32px; }
    p { margin-bottom: 16px; font-size: 16px; }
    .note { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 12px 16px; margin: 20px 0; border-radius: 6px; }
    code { background: #F1F5F9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  </style>
</head>
<body>
  <h1>${title || 'Documento'}</h1>
  <p>Benvenuto in questo nuovo file HTML creato all'interno dell'archivio.</p>
  
  <h2>Prima Sezione</h2>
  <p>Puoi modificare liberamente questo testo dall'editor integrato dell'archivio oppure visualizzarlo in modalità lettura.</p>
  
  <div class="note">
    <strong>Suggerimento:</strong> Questo file è salvato automaticamente nella cartella virtuale <code>public/</code>.
  </div>

  <h2>Conclusioni</h2>
  <p>I tuoi contenuti sono organizzati senza bisogno di configurazioni JSON o server complessi.</p>
</body>
</html>`;

      case 'page':
        return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Pagina Web'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #F8FAFC; color: #0F172A; }
    header { background: #0F172A; color: white; padding: 28px 20px; text-align: center; }
    main { max-width: 880px; margin: 40px auto; padding: 0 20px; }
    .card { background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
    button { background: #2563EB; color: white; border: 0; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
    button:hover { background: #1D4ED8; }
  </style>
</head>
<body>
  <header>
    <h1>${title || 'Pagina Web'}</h1>
    <p style="opacity: 0.8; margin-top: 6px;">Layout salvato nella cartella virtuale public</p>
  </header>
  <main>
    <div class="card">
      <h2 style="margin-bottom: 12px;">Benvenuto</h2>
      <p style="margin-bottom: 20px; line-height: 1.6;">Questa è una pagina web HTML standard, pronta da consultare nel lettore o modificare nel codice sorgente.</p>
      <button onclick="alert('Funzionalità interattiva verificata!')">Test Interattività</button>
    </div>
  </main>
</body>
</html>`;

      case 'blank':
      default:
        return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Nuovo Documento'}</title>
</head>
<body>
  <h1>${title || 'Nuovo Documento'}</h1>
  <p>Inizia a scrivere il tuo contenuto...</p>
</body>
</html>`;
    }
  };

  const handleCreate = () => {
    let cleanName = name.trim();
    if (!cleanName) cleanName = 'documento.html';
    if (!cleanName.endsWith('.html') && !cleanName.endsWith('.htm')) {
      cleanName += '.html';
    }

    const cat = category.trim() || 'Generale';
    const sub = subfolder.trim();
    const content = getTemplateCode();
    const now = Date.now();

    const newFile: HtmlFile = {
      id: `file_${now}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      title: title.trim() || cleanName,
      category: cat,
      subfolder: sub,
      relativePath: computeRelativePath(cat, sub, cleanName),
      content,
      size: new Blob([content]).size,
      createdAt: now,
      updatedAt: now,
    };

    onCreateFile(newFile);
    onClose();
  };

  const preventEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        handleCreate();
      }
    }
  };

  return (
    /* Modal Backdrop: Stable, scrollable container without squishing or shrinking */
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-6">
      {/* 
        Dialog Card:
        - shrink-0 (NEVER shrinks under flexbox)
        - min-h-[540px] (prevents vertical collapsing when keyboard opens)
        - w-full max-w-lg (stable width)
      */}
      <div
        className="relative w-full max-w-lg bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col shrink-0 min-h-[540px] overflow-hidden text-slate-900 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Fixed 60px */}
        <div className="h-[60px] min-h-[60px] bg-slate-50 border-b border-slate-200 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-950">Crea Nuovo File HTML</h3>
              <p className="text-[11px] text-slate-500">Salvataggio automatico nella cartella public</p>
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

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-5 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Nome File (con estensione .html)
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={preventEnterKey}
              className="w-full h-10 min-h-[40px] bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-950 font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors shrink-0"
              placeholder="es: guida-iniziale.html"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Titolo Documento (&lt;title&gt;)
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={preventEnterKey}
              className="w-full h-10 min-h-[40px] bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-950 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors shrink-0"
              placeholder="es: Guida Utente 2026"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Categoria
            </label>
            {existingCategories.length > 0 && !isNewCategory ? (
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="flex-1 h-10 min-h-[40px] bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-950 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                >
                  {existingCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCategory(true);
                    setCategory('');
                  }}
                  className="px-3 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer shrink-0"
                >
                  + Nuova Categoria
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  onKeyDown={preventEnterKey}
                  placeholder="Nome categoria (es: Guide, Documenti, Note...)"
                  className="flex-1 h-10 min-h-[40px] bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-950 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                />
                {existingCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsNewCategory(false)}
                    className="px-3 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer shrink-0"
                  >
                    Usa Esistente
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1">
              Sottocartella (opzionale)
            </label>
            <input
              type="text"
              value={subfolder}
              onChange={e => setSubfolder(e.target.value)}
              onKeyDown={preventEnterKey}
              placeholder="es: capitolo-1 oppure bozze"
              className="w-full h-10 min-h-[40px] bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-950 font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors shrink-0"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1.5">
              Modello Iniziale
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setTemplateType('article')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer shrink-0 ${
                  templateType === 'article'
                    ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600 shadow-xs'
                    : 'bg-white border-slate-300 hover:border-slate-400'
                }`}
              >
                <span className="font-bold text-slate-950 block">Articolo</span>
                <span className="text-[11px] text-slate-500">Tipografia leggibile</span>
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('page')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer shrink-0 ${
                  templateType === 'page'
                    ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600 shadow-xs'
                    : 'bg-white border-slate-300 hover:border-slate-400'
                }`}
              >
                <span className="font-bold text-slate-950 block">Pagina Web</span>
                <span className="text-[11px] text-slate-500">Header e card</span>
              </button>
              <button
                type="button"
                onClick={() => setTemplateType('blank')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer shrink-0 ${
                  templateType === 'blank'
                    ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600 shadow-xs'
                    : 'bg-white border-slate-300 hover:border-slate-400'
                }`}
              >
                <span className="font-bold text-slate-950 block">Minimo</span>
                <span className="text-[11px] text-slate-500">HTML5 vuoto</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer - Fixed 60px */}
        <div className="h-[60px] min-h-[60px] bg-slate-50 border-t border-slate-200 px-5 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm active:scale-98 shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Crea e Salva nell'Archivio</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewFileModal;
