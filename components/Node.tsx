import React from 'react';
import type { NodeData, DiffStatus, NodeType } from '../types';
import { DocsIcon, PageIcon, ActionIcon, LogicIcon, EntityIcon, UiIcon, ExternalIcon, NoteIcon } from './IconComponents';

interface NodeProps {
  data: NodeData;
  isSelected: boolean;
  isParent: boolean;
  isDropTarget: boolean;
  diffStatus: DiffStatus;
  diffMode: 'off' | 'simple' | 'detailed';
  isGhost?: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onMouseUp: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onStartConnection: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onResizeStart: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onToggleDocs: (nodeId: string) => void;
}

const nodeStyles: Record<NodeType, { bg: string, border: string, text: string, title: string, headerBg: string, icon: React.ReactNode, hasConnectionHandle: boolean }> = {
    page: { bg: 'bg-slate-50/70 dark:bg-slate-800/70', border: 'border-slate-400 dark:border-slate-600', text: 'text-slate-600 dark:text-slate-400', title: 'text-slate-800 dark:text-slate-200', headerBg: 'bg-slate-200 dark:bg-slate-700', icon: <PageIcon />, hasConnectionHandle: false },
    action: { bg: 'bg-yellow-50 dark:bg-yellow-900/50', border: 'border-yellow-400 dark:border-yellow-600', text: 'text-yellow-700 dark:text-yellow-300', title: 'text-yellow-900 dark:text-yellow-200', headerBg: 'bg-yellow-100 dark:bg-yellow-800/50', icon: <ActionIcon className="h-5 w-5" />, hasConnectionHandle: true },
    logic: { bg: 'bg-cyan-50 dark:bg-cyan-900/50', border: 'border-cyan-400 dark:border-cyan-600', text: 'text-cyan-700 dark:text-cyan-300', title: 'text-cyan-900 dark:text-cyan-200', headerBg: 'bg-cyan-100 dark:bg-cyan-800/50', icon: <LogicIcon className="h-5 w-5" />, hasConnectionHandle: true },
    entity: { bg: 'bg-green-50 dark:bg-green-900/50', border: 'border-green-400 dark:border-green-600', text: 'text-green-700 dark:text-green-300', title: 'text-green-900 dark:text-green-200', headerBg: 'bg-green-100 dark:bg-green-800/50', icon: <EntityIcon className="h-5 w-5" />, hasConnectionHandle: true },
    ui: { bg: 'bg-purple-50 dark:bg-purple-900/50', border: 'border-purple-400 dark:border-purple-600', text: 'text-purple-700 dark:text-purple-300', title: 'text-purple-900 dark:text-purple-200', headerBg: 'bg-purple-100 dark:bg-purple-800/50', icon: <UiIcon className="h-5 w-5" />, hasConnectionHandle: true },
    external: { bg: 'bg-orange-50 dark:bg-orange-900/50', border: 'border-orange-400 dark:border-orange-600', text: 'text-orange-700 dark:text-orange-300', title: 'text-orange-900 dark:text-orange-200', headerBg: 'bg-orange-100 dark:bg-orange-800/50', icon: <ExternalIcon className="h-5 w-5" />, hasConnectionHandle: true },
    note: { bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-400 dark:border-gray-500', text: 'text-gray-700 dark:text-gray-300', title: 'text-gray-900 dark:text-gray-200', headerBg: 'bg-gray-200 dark:bg-gray-600', icon: <NoteIcon className="h-5 w-5" />, hasConnectionHandle: false },
};

const Node: React.FC<NodeProps> = ({ 
  data, isSelected, isParent, isDropTarget, 
  diffStatus, diffMode, isGhost,
  onMouseDown, onMouseUp, onClick, onStartConnection, onResizeStart, onToggleDocs
}) => {
  const { x, y, width, height, title, description, type, locked, variables } = data;
  const cursorClass = locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing';

  let diffRingClass = '';
  if (diffMode === 'simple' && (diffStatus === 'added' || diffStatus === 'modified')) {
    diffRingClass = 'ring-4 ring-blue-400 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900';
  } else if (diffMode === 'detailed') {
    if (diffStatus === 'added') diffRingClass = 'ring-4 ring-green-400 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900';
    if (diffStatus === 'modified') diffRingClass = 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900';
  }
  
  if (isGhost) {
      diffRingClass = 'ring-4 ring-red-400 ring-offset-2 ring-offset-slate-100 dark:ring-offset-slate-900';
  }
  
  const ghostClass = isGhost ? 'opacity-40 pointer-events-none' : '';
  const styles = nodeStyles[type];

  if (type === 'page') {
      return (
          <div
              className={`absolute rounded-lg border shadow-lg ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : styles.border} ${diffRingClass} transition-all duration-150 ${cursorClass} ${styles.bg} ${ghostClass} flex flex-col`}
              style={{ left: x, top: y, width, height }}
              onMouseDown={(e) => onMouseDown(e, data.id)}
              onClick={(e) => onClick(e, data.id)}
          >
              <div className={`px-4 py-2 ${styles.headerBg} rounded-t-lg border-b ${styles.border} flex justify-between items-center`}>
                  <div className="flex items-center space-x-2">
                     <span className={styles.title}>{styles.icon}</span>
                     <h3 className={`font-bold ${styles.title} text-md truncate`}>{title}</h3>
                  </div>
                  {!isGhost && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleDocs(data.id);
                        }}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full"
                        title="View/Edit Documentation"
                    >
                        <DocsIcon /> 
                    </button>
                  )}
              </div>
              <div className="p-2 flex-grow">
                {/* Content area for child nodes */}
              </div>
              {isSelected && !locked && !isGhost && (
                <div
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize border-2 border-white shadow"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onResizeStart(e, data.id);
                    }}
                />
              )}
          </div>
      )
  }

  let borderClass = styles.border;
  if (isDropTarget) {
    borderClass = 'border-green-500 ring-4 ring-green-500 ring-opacity-50';
  } else if (isSelected) {
    borderClass = 'border-blue-500 ring-2 ring-blue-500';
  }

  const isDiamond = type === 'logic';

  return (
    <div
      className={`absolute shadow-md ${isDiamond ? '' : 'rounded-lg'} ${cursorClass} group transition-all duration-150 flex flex-col ${ghostClass}`}
      style={{ left: x, top: y, width, height }}
      onMouseDown={(e) => onMouseDown(e, data.id)}
      onMouseUp={(e) => onMouseUp(e, data.id)}
      onClick={(e) => onClick(e, data.id)}
    >
      <div
        className={`w-full h-full border ${borderClass} ${styles.bg} ${diffRingClass} flex flex-col p-3 text-center justify-center`}
        style={{ clipPath: isDiamond ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : undefined }}
      >
        <div className={`flex items-center space-x-2 mb-1 ${isDiamond ? 'justify-center' : ''}`}>
           <span className={`${styles.title} opacity-80`}>{styles.icon}</span>
           <h3 className={`font-bold ${styles.title} text-md truncate`}>{title}</h3>
        </div>
        <p className={`${styles.text} text-sm`}>{description}</p>
      
        {type === 'entity' && variables && variables.length > 0 && (
         <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800 w-full max-w-xs mx-auto">
            <div className="space-y-1 text-xs text-green-800 dark:text-green-200">
              {variables.map(variable => (
                <div key={variable.id} className="flex justify-between items-center font-mono">
                  <span className="bg-green-100 dark:bg-green-800/70 px-1 rounded truncate" title={variable.key}>{variable.key}</span>
                  <span className="mx-2 text-green-400 dark:text-green-600">=</span>
                  <span className="bg-green-100 dark:bg-green-800/70 px-1 rounded flex-1 truncate text-right" title={variable.value}>{variable.value}</span>
                </div>
              ))}
            </div>
          </div>
       )}
      </div>

       {styles.hasConnectionHandle && !isGhost && (
         <div 
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnection(e, data.id);
          }}
        />
       )}
    </div>
  );
};

export default Node;
