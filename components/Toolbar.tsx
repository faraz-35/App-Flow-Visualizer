import React from 'react';
import { PlusIcon, ExportIcon, ImportIcon, PageIcon, HistoryIcon } from './IconComponents';

interface ToolbarProps {
  onAddStateNode: () => void;
  onAddPageNode: () => void;
  onExport: () => void;
  onImport: () => void;
  onToggleHistory: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onAddStateNode, onAddPageNode, onExport, onImport, onToggleHistory }) => {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white p-2 rounded-lg shadow-md border border-slate-200 flex space-x-1">
      <button
        onClick={onToggleHistory}
        className="p-2 text-slate-700 hover:bg-slate-100 rounded-md"
        title="View Version History"
      >
        <HistoryIcon />
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
    </div>
  );
};

export default Toolbar;
