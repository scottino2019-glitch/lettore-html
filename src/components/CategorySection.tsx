import React, { useState, useMemo } from 'react';
import { Folder, Plus, Edit2, Trash2, ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import { HtmlFile } from '../types';
import { FileCard } from './FileCard';

interface CategorySectionProps {
  category: string;
  files: HtmlFile[];
  onOpenReader: (file: HtmlFile) => void;
  onEdit: (file: HtmlFile) => void;
  onDeleteFile: (id: string) => void;
  onAddFileToCategory: (category: string) => void;
  onRenameCategory: (oldCategory: string) => void;
  onDeleteCategory: (category: string) => void;
  isDark?: boolean;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  files,
  onOpenReader,
  onEdit,
  onDeleteFile,
  onAddFileToCategory,
  onRenameCategory,
  onDeleteCategory,
  isDark = false,
}) => {
  const [selectedSubfolder, setSelectedSubfolder] = useState<string>('all');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState<boolean>(false);

  // Discover all subfolders dynamically within this category
  const subfolders = useMemo(() => {
    const set = new Set<string>();
    files.forEach(f => {
      if (f.subfolder && f.subfolder.trim() !== '') {
        set.add(f.subfolder.trim());
      }
    });
    return Array.from(set).sort();
  }, [files]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    if (selectedSubfolder === 'all') return files;
    if (selectedSubfolder === 'root') return files.filter(f => !f.subfolder || f.subfolder.trim() === '');
    return files.filter(f => f.subfolder === selectedSubfolder);
  }, [files, selectedSubfolder]);

  const sectionBgClass = isDark
    ? 'bg-[#111827] border-slate-800'
    : 'bg-[#F4F7FA] border-slate-300/90';

  const filterBgClass = isDark
    ? 'bg-slate-900 border-slate-800'
    : 'bg-white border-slate-200';

  return (
    <section className={`border rounded-3xl p-5 sm:p-7 shadow-xs transition-all mb-8 ${sectionBgClass}`}>
      {/* Category Header Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
            }`}
            title={isCollapsed ? 'Espandi categoria' : 'Comprimi categoria'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                <Folder className="w-5 h-5" />
              </div>
              <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                {category}
              </h2>
            </div>

            {/* Unboxed category metadata (Zero-Pill Discipline) */}
            <div className={`flex items-center gap-2 text-xs mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <span className="font-bold text-slate-900 dark:text-slate-200">{files.length} {files.length === 1 ? 'file HTML' : 'file HTML'}</span>
              {subfolders.length > 0 && (
                <>
                  <span aria-hidden="true" className="opacity-40">·</span>
                  <span>{subfolders.length} {subfolders.length === 1 ? 'sottocartella' : 'sottocartelle'}</span>
                </>
              )}
              <span aria-hidden="true" className="opacity-40">·</span>
              <span>Percorso: <code className="font-mono font-semibold text-blue-700 dark:text-blue-400">public/{category}/</code></span>
            </div>
          </div>
        </div>

        {/* Action controls for category or Delete Confirmation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 p-2 rounded-xl border border-red-200 dark:border-red-800/40">
              <span className="text-xs font-bold text-red-600">Eliminare categoria e {files.length} file?</span>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmingDelete(false);
                  onDeleteCategory(category);
                }}
                className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                Sì, elimina tutto
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-slate-200"
              >
                Annulla
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onAddFileToCategory(category)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer border shadow-xs ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuovo file qui</span>
              </button>
              <button
                type="button"
                onClick={() => onRenameCategory(category)}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent hover:border-slate-700'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-white border-transparent hover:border-slate-300'
                }`}
                title="Rinomina categoria"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/40 border-transparent hover:border-red-800/40'
                    : 'text-slate-500 hover:text-red-600 hover:bg-red-50 border-transparent hover:border-red-200'
                }`}
                title="Elimina categoria e tutti i suoi file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="pt-5">
          {/* Subfolder filter bar */}
          {subfolders.length > 0 && (
            <div className={`flex flex-wrap items-center gap-1.5 mb-5 p-1.5 rounded-xl border ${filterBgClass}`}>
              <span className={`text-xs font-bold px-2 flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <FolderTree className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Sottocartelle:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedSubfolder('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedSubfolder === 'all'
                    ? isDark
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-950 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                Tutti i file ({files.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedSubfolder('root')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedSubfolder === 'root'
                    ? isDark
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-slate-950 text-white shadow-xs font-bold'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                / (Radice)
              </button>
              {subfolders.map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubfolder(sub)}
                  className={`px-3 py-1 text-xs rounded-lg transition-all cursor-pointer font-mono ${
                    selectedSubfolder === sub
                      ? isDark
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'bg-slate-950 text-white shadow-xs font-bold'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-medium'
                  }`}
                >
                  /{sub} ({files.filter(f => f.subfolder === sub).length})
                </button>
              ))}
            </div>
          )}

          {/* Cards Grid */}
          {filteredFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFiles.map(file => (
                <FileCard
                  key={file.id}
                  file={file}
                  onOpenReader={onOpenReader}
                  onEdit={onEdit}
                  onDelete={onDeleteFile}
                  isDark={isDark}
                />
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 rounded-2xl border border-dashed ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-white border-slate-300 text-slate-600'}`}>
              <p className="text-xs">
                Nessun file presente in questa sottocartella.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
