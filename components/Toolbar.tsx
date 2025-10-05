import React, { useState, useRef, useEffect } from 'react';
import type { NodeType } from '../types';
import { PlusIcon, ExportIcon, ImportIcon, PageIcon, HistoryIcon, UndoIcon, RedoIcon, SunIcon, MoonIcon, ImageIcon, ActionIcon, LogicIcon, EntityIcon, UiIcon, ExternalIcon, NoteIcon } from './IconComponents';

interface ToolbarProps {
  onAddNode: (type: NodeType) => void;
  onExport: () => void;
  onImport: () => void;
  onExportAsImage: () => void;
  onToggleHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDiffing: boolean;
  diffMode: 'off' | 'simple' | 'detailed';
  onDiffModeChange: (mode: 'off' | 'simple' | 'detailed') => void;
  isHistoryPanelOpen: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const nodeTypes: { type: NodeType; label: string; icon: React.ReactNode }[] = [
    { type: 'page', label: 'Page', icon: <PageIcon /> },
    { type: 'ui', label: 'UI Item', icon: <UiIcon /> },
    { type: 'action', label: 'Action', icon: <ActionIcon /> },
    { type: 'logic', label: 'Logic', icon: <LogicIcon /> },
    { type: 'entity', label: 'Entity', icon: <EntityIcon /> },
    { type: 'external', label: 'External', icon: <ExternalIcon /> },
    { type: 'note', label: 'Note', icon: <NoteIcon /> },
];

const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddNode, 
  onExport, 
  onImport,
  onExportAsImage,
  onToggleHistory,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isDiffing,
  diffMode,
  onDiffModeChange,
  isHistoryPanelOpen,
  theme,
  onToggleTheme
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDiffMode = () => {
    if (diffMode === 'simple') {
      onDiffModeChange('detailed');
    } else if (diffMode === 'detailed') {
      onDiffModeChange('off');
    }
  };
  
  const getNextDiffModeText = () => {
    if (diffMode === 'simple') return 'Detailed';
    if (diffMode === 'detailed') return 'Off';
    return '';
  }

  return (
    <div className={`absolute top-4 left-4 z-30 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 flex space-x-1 items-center transition-transform duration-300 ease-in-out ${isHistoryPanelOpen ? 'translate-x-[21rem]' : ''}`}>
      <button
        onClick={onToggleHistory}
        className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
        title="View Version History"
      >
        <HistoryIcon />
      </button>
      <div className="border-l border-slate-200 dark:border-slate-700 h-8 my-auto"></div>
       <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
        title="Undo"
      >
        <UndoIcon />
      </button>
       <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
        title="Redo"
      >
        <RedoIcon />
      </button>
      <div className="border-l border-slate-200 dark:border-slate-700 h-8 my-auto"></div>
      
      <div className="relative" ref={addMenuRef}>
        <button
          onClick={() => setIsAddMenuOpen(prev => !prev)}
          className="flex items-center space-x-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
          title="Add new node"
        >
          <PlusIcon />
          <span className="text-sm font-medium">Add Node</span>
        </button>
        {isAddMenuOpen && (
            <div className="absolute top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 py-1">
                {nodeTypes.map(({ type, label, icon }) => (
                    <button
                        key={type}
                        onClick={() => {
                            onAddNode(type);
                            setIsAddMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <span className="w-6 h-6">{icon}</span>
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        )}
      </div>

      <div className="border-l border-slate-200 dark:border-slate-700 h-8 my-auto"></div>
      <button
        onClick={onImport}
        className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
        title="Import Flow (.json)"
      >
        <ImportIcon />
      </button>
      <button
        onClick={onExport}
        className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
        title="Export Flow (.json)"
      >
        <ExportIcon />
      </button>
      <button
        onClick={onExportAsImage}
        className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
        title="Export as SVG Image"
      >
        <ImageIcon />
      </button>
      <div className="border-l border-slate-200 dark:border-slate-700 h-8 my-auto"></div>
      <button
        onClick={onToggleTheme}
        className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <MoonIcon /> : <SunIcon />}
      </button>
      {isDiffing && diffMode !== 'off' && (
         <>
          <div className="border-l border-slate-200 dark:border-slate-700 h-8 my-auto"></div>
            <button
              onClick={handleToggleDiffMode}
              className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600"
              title={`Switch to ${getNextDiffModeText()} View`}
            >
              Diff: {diffMode.charAt(0).toUpperCase() + diffMode.slice(1)}
            </button>
         </>
      )}
    </div>
  );
};

export default Toolbar;