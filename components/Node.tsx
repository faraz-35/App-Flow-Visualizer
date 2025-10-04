import React from 'react';
import type { NodeData } from '../types';

interface NodeProps {
  data: NodeData;
  isSelected: boolean;
  isParent: boolean;
  isDropTarget: boolean;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onMouseUp: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onStartConnection: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
  onResizeStart: (e: React.MouseEvent<HTMLDivElement>, nodeId: string) => void;
}

const Node: React.FC<NodeProps> = ({ data, isSelected, isParent, isDropTarget, onMouseDown, onMouseUp, onClick, onStartConnection, onResizeStart }) => {
  const { x, y, width, height, title, description, type, locked, variables } = data;
  const cursorClass = locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing';


  if (type === 'page') {
      return (
          <div
              className={`absolute rounded-lg border border-slate-400 shadow-lg ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''} transition-all duration-150 ${cursorClass} bg-slate-50/70`}
              style={{ left: x, top: y, width, height }}
              onMouseDown={(e) => onMouseDown(e, data.id)}
              onClick={(e) => onClick(e, data.id)}
          >
              <div className="px-4 py-2 bg-slate-200 rounded-t-lg border-b border-slate-400">
                  <h3 className="font-bold text-slate-800 text-md truncate">{title}</h3>
              </div>
              <div className="p-2 h-full w-full">
                {/* Content area for child nodes */}
              </div>
              {isSelected && !locked && (
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

  // State Node
  let borderClass = 'border-slate-300';
  if (isDropTarget) {
    borderClass = 'border-green-500 ring-4 ring-green-500 ring-opacity-50';
  } else if (isSelected) {
    borderClass = 'border-blue-500 ring-2 ring-blue-500';
  }

  const backgroundClass = isParent ? 'bg-slate-50' : 'bg-white';
  const parentStyle = isParent ? 'border-dashed' : '';


  return (
    <div
      className={`absolute shadow-md rounded-lg border ${borderClass} ${backgroundClass} ${parentStyle} ${cursorClass} group transition-all duration-150 flex flex-col`}
      style={{ left: x, top: y, width, height }}
      onMouseDown={(e) => onMouseDown(e, data.id)}
      onMouseUp={(e) => onMouseUp(e, data.id)}
      onClick={(e) => onClick(e, data.id)}
    >
      <div className="p-3">
        <h3 className="font-bold text-slate-800 text-md truncate">{title}</h3>
        <p className="text-slate-600 text-sm mt-1">{description}</p>
      </div>
       {type === 'state' && variables && variables.length > 0 && (
         <div className="mt-auto p-3 pt-2 border-t border-slate-200">
            <div className="space-y-1 text-xs text-slate-700">
              {variables.map(variable => (
                <div key={variable.id} className="flex justify-between items-center font-mono">
                  <span className="bg-slate-100 px-1 rounded truncate" title={variable.key}>{variable.key}</span>
                  <span className="mx-2 text-slate-400">=</span>
                  <span className="bg-slate-100 px-1 rounded flex-1 truncate text-right" title={variable.value}>{variable.value}</span>
                </div>
              ))}
            </div>
          </div>
       )}
       {type === 'state' && (
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