import React, { useState } from 'react';
import { Eye, Download, Trash2, Folder, FileEdit } from 'lucide-react';
import { HtmlFile } from '../types';
import { formatFileSize } from '../utils/htmlParser';

interface FileCardProps {
  file: HtmlFile;
  onOpenReader: (file: HtmlFile) => void;
  onEdit: (file: HtmlFile) => void;
  onDelete: (id: string) => void;
  isDark?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onOpenReader,
  onEdit,
  onDelete,
  isDark = false,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([file.content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTriggerDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
    onDelete(file.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(file);
  };

  // Card theme classes: Crisp contrast, non-glare, clean separation from pearl gray canvas
  const cardBgClass = isDark
    ? 'bg-[#161F2E] hover:bg-[#1C273A] border-slate-700 hover:border-slate-500'
    : 'bg-white hover:bg-white border-slate-300 hover:border-slate-400 shadow-xs hover:shadow-md';

  const titleClass = isDark ? 'text-white' : 'text-slate-950';
  const descClass = isDark ? 'text-slate-300' : 'text-slate-600';
  const metaClass = isDark ? 'text-slate-400 border-slate-700/80' : 'text-slate-500 border-slate-200';

  return (
    <div
      onClick={() => onOpenReader(file)}
      className={`group relative border rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 ${cardBgClass}`}
    >
      <div>
        {/* Top Path / Subfolder Indicator */}
        <div className="flex items-center justify-between text-xs mb-2.5">
          <div className="flex items-center gap-1.5 truncate">
            {file.subfolder ? (
              <>
                <Folder className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-blue-400' : 'text-slate-700'}`} />
                <span className={`font-mono truncate ${isDark ? 'text-blue-300' : 'text-slate-700 font-semibold'}`}>
                  {file.subfolder}
                </span>
                <span aria-hidden="true" className={isDark ? 'text-slate-600' : 'text-slate-400'}>/</span>
              </>
            ) : (
              <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Cartella radice</span>
            )}
            <span className={`font-mono font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {file.name}
            </span>
          </div>

          <span className={`text-[11px] font-mono tabular-nums font-semibold shrink-0 ml-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {formatFileSize(file.size)}
          </span>
        </div>

        {/* Title */}
        <h3 className={`text-base font-extrabold transition-colors line-clamp-1 mb-1.5 tracking-tight ${titleClass}`}>
          {file.title || file.name}
        </h3>

        {/* Description or Preview Snippet */}
        {file.description ? (
          <p className={`text-xs line-clamp-2 leading-relaxed mb-4 ${descClass}`}>
            {file.description}
          </p>
        ) : (
          <p className={`text-xs italic line-clamp-2 leading-relaxed mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Nessuna descrizione meta nel file. Clicca per visualizzare o modificare il codice HTML.
          </p>
        )}
      </div>

      <div>
        {/* Unboxed Metadata (Zero-Pill Discipline) */}
        <div className={`flex items-center gap-2 text-[11px] pt-3 border-t mb-3 font-mono ${metaClass}`}>
          <span className="truncate">public/{file.relativePath}</span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <span className="shrink-0">{new Date(file.updatedAt).toLocaleDateString('it-IT')}</span>
        </div>

        {/* Card Action Controls or Inline Delete Confirmation */}
        <div className="flex items-center justify-between pt-1 min-h-[34px]">
          {isConfirmingDelete ? (
            <div className="flex items-center justify-between w-full gap-2 bg-red-50 dark:bg-red-950/40 p-1.5 rounded-xl border border-red-200 dark:border-red-800/40">
              <span className="text-xs font-bold text-red-600 truncate">Eliminare definitivamente?</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Sì, elimina
                </button>
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="px-2 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-slate-200"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenReader(file);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-slate-950 hover:bg-slate-800 text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Apri Lettore</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleEdit}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                  title="Modifica codice sorgente HTML"
                >
                  <FileEdit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                  title="Scarica file HTML"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleTriggerDelete}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Elimina file dall'archivio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
