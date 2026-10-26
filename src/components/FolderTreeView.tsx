import React, { useState } from 'react';
import { Folder, FolderOpen, FileCode, ChevronRight, ChevronDown, Eye, Trash2, FileEdit } from 'lucide-react';
import { HtmlFile } from '../types';
import { formatFileSize } from '../utils/htmlParser';

interface FolderTreeViewProps {
  files: HtmlFile[];
  onOpenReader: (file: HtmlFile) => void;
  onEdit: (file: HtmlFile) => void;
  onDeleteFile: (id: string) => void;
  isDark?: boolean;
}

interface TreeNode {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children: { [key: string]: TreeNode };
  file?: HtmlFile;
}

export const FolderTreeView: React.FC<FolderTreeViewProps> = ({
  files,
  onOpenReader,
  onEdit,
  onDeleteFile,
  isDark = false,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<{ [path: string]: boolean }>({
    public: true,
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // Build tree from files
  const rootNode: TreeNode = {
    name: 'public',
    fullPath: 'public',
    isFolder: true,
    children: {},
  };

  files.forEach(file => {
    const parts = [file.category, ...(file.subfolder ? file.subfolder.split('/') : []), file.name].filter(Boolean);

    let current = rootNode;
    let accumulatedPath = 'public';

    parts.forEach((part, index) => {
      accumulatedPath += `/${part}`;
      const isLast = index === parts.length - 1;

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          fullPath: accumulatedPath,
          isFolder: !isLast,
          children: {},
          file: isLast ? file : undefined,
        };
      }
      current = current.children[part];
    });
  });

  const renderTree = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedPaths[node.fullPath] !== false;
    const childrenKeys = Object.keys(node.children).sort((a, b) => {
      const aIsFolder = node.children[a].isFolder;
      const bIsFolder = node.children[b].isFolder;
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return a.localeCompare(b);
    });

    if (node.isFolder) {
      return (
        <div key={node.fullPath} className="select-none">
          <div
            onClick={() => toggleExpand(node.fullPath)}
            className={`flex items-center gap-2 py-2 px-3 rounded-xl cursor-pointer transition-colors text-xs font-bold ${
              isDark
                ? 'hover:bg-slate-800 text-slate-200'
                : 'hover:bg-slate-100 text-slate-900'
            }`}
            style={{ paddingLeft: `${depth * 20 + 12}px` }}
          >
            <span className={isDark ? 'text-slate-400' : 'text-slate-400'}>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Folder className="w-4 h-4 text-blue-600/80 dark:text-blue-400/80" />
            )}
            <span className="font-mono text-slate-950 dark:text-white">{node.name}/</span>
            <span className="text-[11px] font-mono text-slate-500 font-normal">
              ({childrenKeys.length} {childrenKeys.length === 1 ? 'voce' : 'voci'})
            </span>
          </div>

          {isExpanded && (
            <div>
              {childrenKeys.map(key => renderTree(node.children[key], depth + 1))}
            </div>
          )}
        </div>
      );
    }

    // Leaf file
    const file = node.file;
    if (!file) return null;

    const isConfirming = confirmDeleteId === file.id;

    return (
      <div
        key={node.fullPath}
        onClick={() => onOpenReader(file)}
        className={`group flex items-center justify-between py-2 px-3 rounded-xl cursor-pointer transition-colors text-xs ${
          isDark
            ? 'hover:bg-slate-800/80 text-slate-200 border-b border-slate-800/60'
            : 'hover:bg-blue-50/70 text-slate-900 border-b border-slate-100'
        }`}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        <div className="flex items-center gap-2 truncate">
          <FileCode className="w-4 h-4 shrink-0 text-slate-700 dark:text-blue-400" />
          <span className="font-mono font-bold truncate text-slate-950 dark:text-white">{node.name}</span>
          <span className="truncate hidden sm:inline text-slate-500 font-normal">
            — {file.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[11px] font-mono tabular-nums text-slate-500 font-semibold">
            {formatFileSize(file.size)}
          </span>

          {isConfirming ? (
            <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-lg border border-red-200 dark:border-red-800/40">
              <span className="text-[11px] text-red-600 font-bold">Eliminare?</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFile(file.id);
                  setConfirmDeleteId(null);
                }}
                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold"
              >
                Sì
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(null);
                }}
                className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[11px] font-semibold"
              >
                No
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenReader(file);
                }}
                className="p-1 rounded-md transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                title="Apri Lettore"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(file);
                }}
                className="p-1 rounded-md transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                title="Modifica codice"
              >
                <FileEdit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDeleteId(file.id);
                }}
                className="p-1 rounded-md transition-colors text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                title="Elimina"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`border rounded-3xl p-6 sm:p-8 shadow-xs ${isDark ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-300'}`}>
      <div className={`flex items-center justify-between pb-4 mb-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
            Esplora Cartella Public &amp; Gerarchia File
          </h2>
          <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
            Mappa ad albero organizzata automaticamente in cartelle e sottocartelle. Clicca su un file per aprirlo nel lettore.
          </p>
        </div>
      </div>

      <div className={`rounded-2xl p-4 border font-mono text-xs ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        {renderTree(rootNode, 0)}
      </div>
    </div>
  );
};
