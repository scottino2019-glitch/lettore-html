import React from 'react';
import { Upload, Plus, Download, FolderTree, LayoutGrid, Sun, Moon, HelpCircle } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenUpload: () => void;
  onOpenNewFile: () => void;
  onExportZip: () => void;
  onOpenStructure: () => void;
  totalFiles: number;
  totalCategories: number;
  isDark: boolean;
  onToggleDark: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenUpload,
  onOpenNewFile,
  onExportZip,
  onOpenStructure,
  totalFiles,
  isDark,
  onToggleDark,
}) => {
  const headerBg = isDark
    ? 'bg-[#0F172A]/95 border-slate-800 text-slate-100'
    : 'bg-white/95 border-slate-300 text-slate-950 shadow-xs';

  const navText = isDark
    ? 'text-slate-400 hover:text-white'
    : 'text-slate-600 hover:text-slate-950 font-semibold';

  const navActive = isDark
    ? 'text-white font-bold border-b-2 border-blue-400 pb-1'
    : 'text-slate-950 font-bold border-b-2 border-slate-950 pb-1';

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors ${headerBg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xl font-extrabold tracking-tight whitespace-nowrap text-slate-950 dark:text-white">
              Archivio HTML
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              public/
            </span>
          </div>

          {/* Navigation & Views */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'grid' ? navActive : navText
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Card per Categoria</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('folder-tree')}
              className={`flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'folder-tree' ? navActive : navText
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>Albero Cartelle</span>
            </button>
            <button
              type="button"
              onClick={onOpenStructure}
              className={`flex items-center gap-1.5 ${navText} transition-colors whitespace-nowrap cursor-pointer`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Guida Cartella Public</span>
            </button>
            {totalFiles > 0 && (
              <button
                type="button"
                onClick={onExportZip}
                className={`flex items-center gap-1.5 ${navText} transition-colors whitespace-nowrap cursor-pointer`}
                title="Scarica archivio ZIP completo con cartelle"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Esporta ZIP</span>
              </button>
            )}
          </nav>

          {/* Actions & Theme */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={onToggleDark}
              className={`p-2 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                isDark
                  ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
              }`}
              title={isDark ? 'Passa a Perla Luminous (Chiaro elegante)' : 'Passa a Perla Dark (Scuro riposante)'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden lg:inline">
                {isDark ? 'Luce' : 'Notte'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenNewFile}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer border shadow-xs ${
                isDark
                  ? 'bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuovo HTML</span>
            </button>

            <button
              type="button"
              onClick={onOpenUpload}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer shadow-sm active:scale-98 ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-950 hover:bg-slate-800 text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Carica File / Cartella</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
