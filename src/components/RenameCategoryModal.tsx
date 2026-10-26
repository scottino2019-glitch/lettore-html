import React, { useState } from 'react';
import { X, Edit2, Check } from 'lucide-react';

interface RenameCategoryModalProps {
  currentCategory: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export const RenameCategoryModal: React.FC<RenameCategoryModalProps> = ({
  currentCategory,
  onClose,
  onRename,
}) => {
  const [name, setName] = useState(currentCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === currentCategory) {
      onClose();
      return;
    }
    onRename(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex min-h-full items-center justify-center p-3 sm:p-6">
      <div
        className="relative w-full max-w-md bg-white border border-slate-300 rounded-2xl shadow-2xl flex flex-col shrink-0 min-h-[220px] my-auto overflow-hidden text-slate-900"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-[60px] min-h-[60px] bg-slate-50 border-b border-slate-200 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 shrink-0">
              <Edit2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-950">Rinomina Categoria</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Nuovo nome per la categoria
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-10 min-h-[40px] bg-white border border-slate-300 rounded-lg px-3 text-sm text-slate-950 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shrink-0"
              autoFocus
            />
            <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
              Tutti i file di questa categoria verranno automaticamente aggiornati con il nuovo percorso virtuale.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === currentCategory}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salva Modifica</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
