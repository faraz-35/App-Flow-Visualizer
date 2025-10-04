import React from 'react';
import type { NodeData } from '../types';

interface DocsPanelProps {
  node: NodeData;
  onClose: () => void;
  onUpdateDocs: (nodeId: string, docs: string) => void;
}

const DocsPanel: React.FC<DocsPanelProps> = ({ node, onClose, onUpdateDocs }) => {
  if (node.type !== 'page') return null;

  return (
    <div
      className="absolute bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 shadow-xl flex flex-col z-10"
      style={{
        left: node.x + node.width + 10,
        top: node.y,
        width: 320,
        height: node.height,
        pointerEvents: 'auto', 
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center p-2 bg-slate-100 dark:bg-slate-700 border-b border-slate-300 dark:border-slate-600 rounded-t-lg flex-shrink-0">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">Docs: {node.title}</h3>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xl font-bold leading-none p-1" title="Close Docs">&times;</button>
      </div>
      <textarea
        value={node.docs || ''}
        onChange={(e) => onUpdateDocs(node.id, e.target.value)}
        placeholder={`Add documentation for the "${node.title}" page here...`}
        className="flex-grow p-3 w-full h-full resize-none focus:outline-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-800 rounded-b-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
      />
    </div>
  );
};

export default DocsPanel;