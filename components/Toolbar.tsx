import React from 'react';
import { PlusIcon, ExportIcon, ImportIcon, PageIcon, HistoryIcon, UndoIcon, RedoIcon } from './IconComponents';

interface ToolbarProps {
  onAddStateNode: () => void;
  onAddPageNode: () => void;
  onExport: () => void;
  onImport: () => void;
  onToggleHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDiffing: boolean;
  diffMode: 'off' | 'simple' | 'detailed';
  onDiffModeChange: (mode: 'off' | 'simple' | 'detailed') => void;
  isHistoryPanelOpen: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddStateNode, 
  onAddPageNode, 
  onExport, 
  onImport, 
  onToggleHistory,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isDiffing,
  diffMode,
  onDiffModeChange,
  isHistoryPanelOpen
}) => {

  const handleToggleDiffMode = () => {
    if (diffMode === 'simple') {
      onDiffModeChange('detailed');
    } else if (diffMode === 'detailed') {
      onDiffModeChange('off'); // This will turn off diffing
    }
  };

  const getNextDiffModeText = () => {
    if (diffMode === 'simple') return 'Detailed';
    if (diffMode === 'detailed') return 'Off';
    return '';
  }

  return (
    <div className={`absolute top-4 left-4 z-30 bg-white p-2 rounded-lg shadow-md border border-slate-200 flex space-x-1 items-center transition-transform duration-300 ease-in-out ${isHistoryPanelOpen ? 'translate-x-[21rem]' : ''}`}>
      <button
        onClick={onToggleHistory}
        className="p-2 text-slate-700 hover:bg-slate-100 rounded-md"
        title="View Version History"
      >
        <HistoryIcon />
      </button>
      <div className="border-l border-slate-200 h-8 my-auto"></div>
       <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-2 text-slate-700 hover:bg-slate-100 rounded-md disabled:text-slate-300 disabled:cursor-not-allowed"
        title="Undo"
      >
        <UndoIcon />
      </button>
       <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-2 text-slate-700 hover:bg-slate-100 rounded-md disabled:text-slate-300 disabled:cursor-not-allowed"
        title="Redo"
      >
        <RedoIcon />
      </button>
      <div className="border-l border-slate-200 h-8 my-auto"></div>
      <button
        onClick={onAddPageNode}
        className="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
        title="Add new page container"
      >
        <PageIcon />
        <span className="text-sm font-medium">Add Page</span>
      </button>
      <button
        onClick={onAddStateNode}
        className="flex items-center space-x-2 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
        title="Add new state"
      >
        <PlusIcon />
        <span className="text-sm font-medium">Add State</span>
      </button>
      <div className="border-l border-slate-200 h-8 my-auto"></div>
      <button
        onClick={onImport}
        className="p-2 text-slate-700 hover:bg-slate-100 rounded-md"
        title="Import Flow (.json)"
      >
        <ImportIcon />
      </button>
      <button
        onClick={onExport}
        className="p-2 text-slate-700 hover:bg-slate-100 rounded-md"
        title="Export Flow (.json)"
      >
        <ExportIcon />
      </button>
      {isDiffing && diffMode !== 'off' && (
         <>
          <div className="border-l border-slate-200 h-8 my-auto"></div>
            <button
              onClick={handleToggleDiffMode}
              className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200"
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