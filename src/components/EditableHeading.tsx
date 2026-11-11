import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';

interface EditableHeadingProps {
  value: string;
  onSave: (newTitle: string) => void;
  className?: string;
  badgeStyle?: boolean;
  subtitle?: string;
  onSaveSubtitle?: (newSubtitle: string) => void;
}

export const EditableHeading: React.FC<EditableHeadingProps> = ({
  value,
  onSave,
  className = '',
  badgeStyle = true,
  subtitle,
  onSaveSubtitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(value);
  const [draftSubtitle, setDraftSubtitle] = useState(subtitle || '');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraftTitle(value);
  }, [value]);

  useEffect(() => {
    setDraftSubtitle(subtitle || '');
  }, [subtitle]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingSubtitle && subInputRef.current) {
      subInputRef.current.focus();
      subInputRef.current.select();
    }
  }, [isEditingSubtitle]);

  const handleSaveTitle = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setDraftTitle(value);
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setDraftTitle(value);
    setIsEditingTitle(false);
  };

  const handleSaveSubtitle = () => {
    const trimmed = draftSubtitle.trim();
    if (onSaveSubtitle) {
      onSaveSubtitle(trimmed);
    }
    setIsEditingSubtitle(false);
  };

  const handleCancelSubtitle = () => {
    setDraftSubtitle(subtitle || '');
    setIsEditingSubtitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelTitle();
    }
  };

  const handleSubKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveSubtitle();
    } else if (e.key === 'Escape') {
      handleCancelSubtitle();
    }
  };

  // Rendering when title is being edited
  if (isEditingTitle) {
    return (
      <div
        className={`flex items-center gap-1.5 w-full ${
          badgeStyle ? 'bg-[#0e355c] p-1 rounded border border-cyan-400/60 mb-2' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={titleInputRef}
          type="text"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onKeyDown={handleTitleKeyDown}
          onBlur={handleSaveTitle}
          className="flex-1 min-w-[140px] bg-white text-slate-900 text-xs font-black uppercase px-2 py-0.5 rounded outline-none border-2 border-cyan-500 shadow-md"
          placeholder="Escribe el nuevo título..."
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleSaveTitle();
          }}
          title="Guardar título"
          className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCancelTitle();
          }}
          title="Cancelar"
          className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Rendering when subtitle is being edited
  if (isEditingSubtitle) {
    return (
      <div
        className={`flex items-center gap-1.5 w-full ${
          badgeStyle ? 'bg-[#0e355c] p-1 rounded border border-cyan-400/60 mb-2' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] font-black uppercase text-cyan-300 shrink-0">Subtítulo:</span>
        <input
          ref={subInputRef}
          type="text"
          value={draftSubtitle}
          onChange={(e) => setDraftSubtitle(e.target.value)}
          onKeyDown={handleSubKeyDown}
          onBlur={handleSaveSubtitle}
          className="flex-1 min-w-[140px] bg-white text-slate-900 text-[11px] font-medium px-2 py-0.5 rounded outline-none border-2 border-cyan-500 shadow-md"
          placeholder="Escribe el nuevo subtítulo..."
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleSaveSubtitle();
          }}
          title="Guardar subtítulo"
          className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCancelSubtitle();
          }}
          title="Cancelar"
          className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // BADGE STYLE (Used by major chart headers)
  if (badgeStyle) {
    return (
      <div
        className={`group relative bg-gradient-to-r from-[#124270] via-[#16518a] to-[#124270] text-white text-[11px] font-black py-1 px-2.5 rounded shadow-sm flex items-center justify-between uppercase tracking-wider mb-2 border border-blue-900/40 select-none ${className}`}
      >
        <div className="flex items-center gap-2 truncate">
          {/* Título editable */}
          <span
            onClick={() => setIsEditingTitle(true)}
            className="truncate cursor-pointer hover:text-cyan-200 transition-colors inline-flex items-center gap-1"
            title="Haz clic para editar este título"
          >
            <span>{value}</span>
            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-75 text-cyan-200 shrink-0" />
          </span>

          {/* Subtítulo editable */}
          {(subtitle !== undefined || onSaveSubtitle) && (
            <span
              onClick={(e) => {
                if (onSaveSubtitle) {
                  e.stopPropagation();
                  setIsEditingSubtitle(true);
                }
              }}
              className={`text-[9px] font-normal lowercase tracking-normal hidden sm:inline-flex items-center gap-1 ${
                onSaveSubtitle
                  ? 'cursor-pointer text-cyan-200 hover:text-white hover:underline'
                  : 'text-cyan-200'
              }`}
              title={onSaveSubtitle ? 'Haz clic para editar el subtítulo' : undefined}
            >
              <span>{subtitle || '(añadir subtítulo)'}</span>
              {onSaveSubtitle && (
                <Pencil className="w-2 h-2 opacity-0 group-hover:opacity-60 text-cyan-200 shrink-0" />
              )}
            </span>
          )}
        </div>

        {/* Global Edit Hint */}
        <div
          onClick={() => setIsEditingTitle(true)}
          className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ml-2 cursor-pointer"
          title="Haz clic para editar este título"
        >
          <Pencil className="w-3 h-3 text-cyan-200 group-hover:text-amber-300" />
          <span className="text-[9px] font-normal text-cyan-200 hidden group-hover:inline">
            Editar
          </span>
        </div>
      </div>
    );
  }

  // INLINE / CLEAN STYLE (Used by Category Headers, KPI cards, etc.)
  return (
    <div className={`group inline-flex items-center flex-wrap gap-2 ${className}`}>
      {/* Title */}
      <span
        onClick={() => setIsEditingTitle(true)}
        className="cursor-pointer hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
        title="Haz clic para editar este título"
      >
        <span>{value}</span>
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-80 text-cyan-300 shrink-0 transition-opacity" />
      </span>

      {/* Subtitle */}
      {(subtitle || onSaveSubtitle) && (
        <span
          onClick={(e) => {
            if (onSaveSubtitle) {
              e.stopPropagation();
              setIsEditingSubtitle(true);
            }
          }}
          className={`text-[11px] font-normal normal-case hidden sm:inline-flex items-center gap-1 ${
            onSaveSubtitle
              ? 'cursor-pointer text-cyan-200/90 hover:text-white hover:underline'
              : 'text-cyan-200/90'
          }`}
          title={onSaveSubtitle ? 'Haz clic para editar este subtítulo' : undefined}
        >
          <span>{subtitle}</span>
          {onSaveSubtitle && (
            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-75 text-cyan-300 shrink-0 transition-opacity" />
          )}
        </span>
      )}
    </div>
  );
};
