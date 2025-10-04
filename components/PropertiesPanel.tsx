import React from 'react';
import type { NodeData, EdgeData, SelectedElement, StateVariable } from '../types';
import { TrashIcon, LockClosedIcon, LockOpenIcon, PlusIcon } from './IconComponents';

interface PropertiesPanelProps {
  selectedElement: SelectedElement;
  nodes: NodeData[];
  edges: EdgeData[];
  onUpdateElement: (id: string, type: 'node' | 'edge', data: Partial<NodeData> | Partial<EdgeData>) => void;
  onDeleteElement: (id: string, type: 'node' | 'edge') => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement, nodes, edges, onUpdateElement, onDeleteElement }) => {
  if (!selectedElement) {
    return null;
  }

  const { type, id } = selectedElement;
  const element = type === 'node' ? nodes.find(n => n.id === id) : edges.find(e => e.id === id);

  if (!element) {
    return null;
  }

  const handleNodeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onUpdateElement(id, 'node', { [e.target.name]: e.target.value });
  };

  const handleEdgeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onUpdateElement(id, 'edge', { [e.target.name]: e.target.value });
  };
  
  const handleDelete = () => {
      onDeleteElement(id, type);
  }

  const handleToggleLock = () => {
    if (type === 'node') {
        const node = element as NodeData;
        onUpdateElement(id, 'node', { locked: !node.locked });
    }
  };

  const handleVariableChange = (index: number, field: 'key' | 'value', value: string) => {
    if (type !== 'node') return;
    const node = element as NodeData;
    const newVariables = [...(node.variables || [])];
    newVariables[index] = { ...newVariables[index], [field]: value };
    onUpdateElement(id, 'node', { variables: newVariables });
  };

  const handleAddVariable = () => {
    if (type !== 'node') return;
    const node = element as NodeData;
    const newVariable = { id: crypto.randomUUID(), key: 'newVar', value: '""' };
    const newVariables = [...(node.variables || []), newVariable];
    onUpdateElement(id, 'node', { variables: newVariables });
  };

  const handleRemoveVariable = (variableId: string) => {
    if (type !== 'node') return;
    const node = element as NodeData;
    const newVariables = (node.variables || []).filter(v => v.id !== variableId);
    onUpdateElement(id, 'node', { variables: newVariables });
  };

  return (
    <div className="w-80 bg-white dark:bg-slate-800 p-4 border-l border-slate-200 dark:border-slate-700 shadow-sm overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 capitalize">{type} Properties</h2>
        <div className="flex items-center space-x-2">
            {type === 'node' && (
                 <button onClick={handleToggleLock} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-slate-700" title={(element as NodeData).locked ? "Unlock" : "Lock"}>
                    {(element as NodeData).locked ? <LockClosedIcon /> : <LockOpenIcon />}
                </button>
            )}
            <button onClick={handleDelete} className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-slate-700" title="Delete Element">
                <TrashIcon />
            </button>
        </div>
      </div>
      
      {type === 'node' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Title</label>
            <input
              type="text"
              name="title"
              id="title"
              value={(element as NodeData).title}
              onChange={handleNodeChange}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-200"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Description</label>
            <textarea
              name="description"
              id="description"
              rows={4}
              value={(element as NodeData).description}
              onChange={handleNodeChange}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-200"
            />
          </div>
          {(element as NodeData).type === 'state' && (
             <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">State Variables</h3>
                    <button onClick={handleAddVariable} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-slate-700" title="Add State Variable">
                        <PlusIcon />
                    </button>
                </div>
                <div className="space-y-2">
                   {(element as NodeData).variables?.map((variable, index) => (
                      <div key={variable.id} className="flex items-center space-x-2">
                        <input 
                            type="text"
                            value={variable.key}
                            onChange={(e) => handleVariableChange(index, 'key', e.target.value)}
                            placeholder="key"
                            className="flex-1 block w-full px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-200 font-mono"
                        />
                        <span className="text-slate-500 dark:text-slate-400">=</span>
                        <input 
                            type="text"
                            value={variable.value}
                            onChange={(e) => handleVariableChange(index, 'value', e.target.value)}
                            placeholder="value"
                            className="flex-1 block w-full px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-200 font-mono"
                        />
                        <button onClick={() => handleRemoveVariable(variable.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-slate-700" title="Remove Variable">
                            <TrashIcon />
                        </button>
                      </div>
                   ))}
                   {(element as NodeData).variables?.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">No variables defined.</p>}
                </div>
             </div>
          )}
        </div>
      )}
      
      {type === 'edge' && (
        <div className="space-y-4">
           <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Action Type</label>
            <select
              name="type"
              id="type"
              value={(element as EdgeData).type}
              onChange={handleEdgeChange}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-200"
            >
              <option value="interaction">UI Interaction</option>
              <option value="action">Business Logic Action</option>
            </select>
          </div>
          <div>
            <label htmlFor="label" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Label</label>
            <input
              type="text"
              name="label"
              id="label"
              value={(element as EdgeData).label}
              onChange={handleEdgeChange}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-200"
            />
          </div>
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Condition</label>
            <textarea
              name="condition"
              id="condition"
              rows={3}
              value={(element as EdgeData).condition || ''}
              onChange={handleEdgeChange}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-200 font-mono"
              placeholder="e.g., user.isLoggedIn == true"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;