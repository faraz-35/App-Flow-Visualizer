import React, { useState } from 'react';
import type { Version } from '../types';
import { TrashIcon } from './IconComponents';

interface HistoryPanelProps {
  isOpen: boolean;
  versions: Version[];
  currentVersionId: string | null;
  diffingVersionId: string | null;
  onSaveVersion: (name: string) => void;
  onLoadVersion: (id: string) => void;
  onDeleteVersion: (id: string) => void;
  onStartDiff: (id: string) => void;
  onClearDiff: () => void;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ 
  isOpen, 
  versions, 
  currentVersionId, 
  diffingVersionId,
  onSaveVersion, 
  onLoadVersion, 
  onDeleteVersion, 
  onStartDiff,
  onClearDiff,
  onClose 
}) => {
  const [versionName, setVersionName] = useState('');

  const handleSave = () => {
    if (versionName.trim()) {
      onSaveVersion(versionName.trim());
      setVersionName('');
    }
  };

  if (!isOpen) {
    return null;
  }
  
  const sortedVersions = [...versions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="absolute top-0 left-0 h-full w-80 bg-white dark:bg-slate-800 p-4 border-r border-slate-200 dark:border-slate-700 shadow-lg z-20 flex flex-col transition-transform duration-300 ease-in-out" style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">Version History</h2>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-2xl font-bold" title="Close Panel">&times;</button>
      </div>

      <div className="mb-4 border-b dark:border-slate-700 pb-4">
        <label htmlFor="versionName" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Save Current Version As</label>
        <div className="flex space-x-2">
          <input
            type="text"
            id="versionName"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="e.g., v1.0 - Login Flow"
            className="flex-grow block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-200"
          />
          <button
            onClick={handleSave}
            disabled={!versionName.trim()}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
            title="Save current state as a new version"
          >
            Save
          </button>
        </div>
      </div>
      
      {diffingVersionId && (
        <div className="mb-4 border-b dark:border-slate-700 pb-4 text-center">
            <button
                onClick={onClearDiff}
                className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-md hover:bg-slate-300 dark:hover:bg-slate-600"
                title="Exit the diff comparison view"
            >
                Clear Diff View
            </button>
        </div>
      )}


      <div className="flex-grow overflow-y-auto -mr-4 pr-4">
        {sortedVersions.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm text-center mt-8">No versions saved yet.</p>
        ) : (
          <ul className="space-y-2">
            {sortedVersions.map(version => (
              <li key={version.id} className={`p-3 rounded-lg border transition-colors ${currentVersionId === version.id ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700' : diffingVersionId === version.id ? 'bg-yellow-50 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-semibold text-slate-800 dark:text-slate-200 ${currentVersionId === version.id ? 'text-blue-800 dark:text-blue-200' : ''} ${diffingVersionId === version.id ? 'text-yellow-800 dark:text-yellow-200' : ''}`}>{version.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(version.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                     <button
                        onClick={() => onStartDiff(version.id)}
                        disabled={diffingVersionId === version.id}
                        className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
                        title="Compare this version with the current canvas"
                      >
                        Diff
                      </button>
                     <button
                        onClick={() => onLoadVersion(version.id)}
                        className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-500"
                        title="Load this version onto the canvas"
                      >
                        Load
                      </button>
                    <button onClick={() => onDeleteVersion(version.id)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-slate-600 rounded-full" title="Delete this version">
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;