import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useCustomTitles } from '../context/CustomTitlesContext';

interface EditableTextProps {
  idKey: string;
  defaultText: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  inputClassName?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({
  idKey,
  defaultText,
  className = '',
  as: Component = 'span',
  inputClassName = '',
}) => {
  const { getTitle, setTitle, isEditingGlobal } = useCustomTitles();
  const currentText = getTitle(idKey, defaultText);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(currentText);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(currentText);
  }, [currentText]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      setTitle(idKey, trimmed);
    } else {
      setDraft(currentText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(currentText);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1.5 z-20" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`bg-slate-900/90 text-white border-2 border-cyan-400 rounded px-2 py-0.5 text-inherit font-inherit outline-none shadow-lg ${inputClassName}`}
        />
        <button
          type="button"
          onClick={handleSave}
          className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow"
          title="Guardar cambios"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white shadow"
          title="Cancelar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </span>
    );
  }

  return (
    <Component
      className={`group relative inline-flex items-center gap-1.5 cursor-pointer select-text hover:text-cyan-300 transition-colors ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title="Haz clic para editar este título libremente"
    >
      <span>{currentText}</span>
      <span
        className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-cyan-900/80 text-cyan-300 border border-cyan-500/50 ${
          isEditingGlobal ? 'opacity-90' : ''
        }`}
      >
        <Pencil className="w-2.5 h-2.5" />
      </span>
    </Component>
  );
};
