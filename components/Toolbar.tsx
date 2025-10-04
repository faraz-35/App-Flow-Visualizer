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
  onDiffModeChange
}) => {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded-lg shadow-md border border-slate-200 flex space-x-1 items-center">
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
      {isDiffing && (
         <>
          <div className="border-l border-slate-200 h-8 my-auto"></div>
          <div className="flex items-center space-x-2 px-2">
            <label htmlFor="diff-mode" className="text-sm font-medium text-slate-600">Diff View:</label>
            <select
                id="diff-mode"
                value={diffMode}
                onChange={(e) => onDiffModeChange(e.target.value as 'off' | 'simple' | 'detailed')}
                className="block w-full pl-3 pr-8 py-1.5 text-sm border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
                <option value="off">Off</option>
                <option value="simple">Simple</option>
                <option value="detailed">Detailed</option>
            </select>
          </div>
         </>
      )}
    </div>
  );
};

export default Toolbar;
