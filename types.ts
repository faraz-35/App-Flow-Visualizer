export interface StateVariable {
  id: string;
  key: string;
  value: string;
}

export type NodeType = 'page' | 'action' | 'logic' | 'entity' | 'ui' | 'external' | 'note';
export type EdgeType = 'navigation' | 'logic' | 'data' | 'system';


export interface NodeData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  description: string;
  parentId?: string | null;
  type: NodeType;
  locked?: boolean;
  variables?: StateVariable[]; // Repurposed as 'attributes' for entity nodes
  docs?: string;
}

export interface EdgeData {
  id:string;
  sourceId: string;
  targetId: string;
  label: string;
  type: EdgeType;
  condition?: string;
}

export type SelectedElement = {
  type: 'node' | 'edge';
  id: string;
} | null;

export interface ConnectionPreview {
    sourceId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface Version {
  id: string;
  name: string;
  timestamp: string;
  nodes: NodeData[];
  edges: EdgeData[];
}

export type DiffStatus = 'added' | 'modified' | 'deleted' | 'unchanged';