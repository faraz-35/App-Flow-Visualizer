import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { NodeData, EdgeData, SelectedElement, ConnectionPreview, Version, DiffStatus } from './types';
import Node from './components/Node';
import PropertiesPanel from './components/PropertiesPanel';
import Toolbar from './components/Toolbar';
import HistoryPanel from './components/HistoryPanel';
import DocsPanel from './components/DocsPanel';
import { SunIcon, MoonIcon, ImageIcon } from './components/IconComponents';

type CanvasState = {
    nodes: NodeData[];
    edges: EdgeData[];
};

const useHistoryState = (initialState: CanvasState) => {
    const [state, _setState] = useState({
        past: [] as CanvasState[],
        present: initialState,
        future: [] as CanvasState[],
    });

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    const setState = useCallback((newStateFn: (prevState: CanvasState) => CanvasState) => {
        _setState(currentState => {
            const newPresent = newStateFn(currentState.present);
            
            if (JSON.stringify(newPresent) === JSON.stringify(currentState.present)) {
                return currentState;
            }

            return {
                past: [...currentState.past, currentState.present],
                present: newPresent,
                future: [],
            };
        });
    }, []);
    
    const resetState = useCallback((newState: CanvasState) => {
        _setState({
            past: [],
            present: newState,
            future: [],
        });
    }, []);

    const undo = useCallback(() => {
        _setState(currentState => {
            if (currentState.past.length === 0) return currentState;
            const previous = currentState.past[currentState.past.length - 1];
            const newPast = currentState.past.slice(0, currentState.past.length - 1);
            return {
                past: newPast,
                present: previous,
                future: [currentState.present, ...currentState.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
         _setState(currentState => {
            if (currentState.future.length === 0) return currentState;
            const next = currentState.future[0];
            const newFuture = currentState.future.slice(1);
            return {
                past: [...currentState.past, currentState.present],
                present: next,
                future: newFuture,
            };
        });
    }, []);

    return { state: state.present, setState, resetState, undo, redo, canUndo, canRedo };
};


type DraggingState = { 
  id: string; 
  offsetX: number; 
  offsetY: number; 
  initialX: number; 
  initialY: number;
  descendantInitialPositions: Map<string, { x: number; y: number }>;
} | null;

type ResizingState = {
    id: string;
    initialWidth: number;
    initialHeight: number;
    initialMouseX: number;
    initialMouseY: number;
} | null;

const getDescendants = (nodeId: string, allNodes: NodeData[]): string[] => {
    const children = allNodes.filter(n => n.parentId === nodeId).map(n => n.id);
    return [...children, ...children.flatMap(childId => getDescendants(childId, allNodes))];
};

const INITIAL_STATE: CanvasState = {
  nodes: [
    { id: 'page1', type: 'page', x: 50, y: 50, width: 600, height: 400, title: 'Onboarding', description: '', locked: false, docs: 'This page handles the entire user onboarding flow, including login and registration.' },
    { id: 'page2', type: 'page', x: 700, y: 50, width: 600, height: 400, title: 'Main Application', description: '', locked: false, docs: '' },
    { id: 'node3', parentId: 'page1', type: 'state', x: 100, y: 150, width: 250, height: 140, title: 'Login Modal', description: 'Pops up on the start page.', locked: false, variables: [ { id: 'v1', key: 'email', value: '""'}, { id: 'v2', key: 'password', value: '""'} ] },
    { id: 'node2', parentId: 'page2', type: 'state', x: 750, y: 150, width: 250, height: 120, title: 'Dashboard', description: 'User is logged in.', locked: false, variables: [ { id: 'v3', key: 'isLoggedIn', value: 'true'} ] },
  ],
  edges: [
      { id: 'edge1', sourceId: 'node3', targetId: 'node2', label: 'Successful Login', type: 'interaction', condition: 'email != "" && password != ""' }
  ]
};

// Helper function to wrap text for SVG. A bit naive but should work for simple cases.
function wrapText(text: string, maxWidth: number, charWidth: number): string[] {
    const lines: string[] = [];
    if (!text) return lines;
    
    const maxCharsPerLine = Math.floor(maxWidth / charWidth);
    if (maxCharsPerLine <= 0) return [text];

    const words = text.split(' ');
    let currentLine = '';

    words.forEach(word => {
        if (currentLine.length > 0 && (currentLine + ' ' + word).length > maxCharsPerLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = currentLine ? currentLine + ' ' + word : word;
        }
    });
    lines.push(currentLine);
    return lines;
}

// Helper function to escape special XML characters
function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

const App: React.FC = () => {
  const { state, setState, resetState, undo, redo, canUndo, canRedo } = useHistoryState(INITIAL_STATE);
  const { nodes, edges } = state;

  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [draggingNode, setDraggingNode] = useState<DraggingState>(null);
  const [resizingNode, setResizingNode] = useState<ResizingState>(null);
  const [connectionPreview, setConnectionPreview] = useState<ConnectionPreview | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panningStartPos, setPanningStartPos] = useState({ x: 0, y: 0 });
  
  const [history, setHistory] = useState<Version[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [openDocsNodeId, setOpenDocsNodeId] = useState<string | null>(null);

  const [diffingVersion, setDiffingVersion] = useState<Version | null>(null);
  const [diffMode, setDiffMode] = useState<'off' | 'simple' | 'detailed'>('simple');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme') as 'light' | 'dark';
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const didPan = useRef(false);
  const wasDroppingRef = useRef(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const nodeIsParent = useMemo(() => new Set(nodes.map(n => n.parentId).filter(Boolean)), [nodes]);

  const sortedNodes = useMemo(() => {
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    const getDepth = (nodeId: string | null | undefined): number => {
        if (!nodeId) return 0;
        const node = nodeMap.get(nodeId);
        if (!node) return 0;
        return 1 + getDepth(node.parentId);
    };
    return [...nodes].sort((a, b) => getDepth(a.id) - getDepth(b.id));
  }, [nodes]);

  const diffResult = useMemo(() => {
    if (!diffingVersion) return null;
    
    const nodeStatus = new Map<string, DiffStatus>();
    const edgeStatus = new Map<string, DiffStatus>();

    const oldNodes = new Map(diffingVersion.nodes.map(n => [n.id, n]));
    const newNodes = new Map(nodes.map(n => [n.id, n]));

    for (const [id, newNode] of newNodes.entries()) {
        const oldNode = oldNodes.get(id);
        if (!oldNode) {
            nodeStatus.set(id, 'added');
        } else if (JSON.stringify(newNode) !== JSON.stringify(oldNode)) {
            nodeStatus.set(id, 'modified');
        } else {
            nodeStatus.set(id, 'unchanged');
        }
    }
    const ghostNodes = diffingVersion.nodes.filter(n => !newNodes.has(n.id));
    ghostNodes.forEach(n => nodeStatus.set(n.id, 'deleted'));


    const oldEdges = new Map(diffingVersion.edges.map(e => [e.id, e]));
    const newEdges = new Map(edges.map(e => [e.id, e]));

    for (const [id, newEdge] of newEdges.entries()) {
        const oldEdge = oldEdges.get(id);
        if (!oldEdge) {
            edgeStatus.set(id, 'added');
        } else if (JSON.stringify(newEdge) !== JSON.stringify(oldEdge)) {
            edgeStatus.set(id, 'modified');
        } else {
            edgeStatus.set(id, 'unchanged');
        }
    }
    const ghostEdges = diffingVersion.edges.filter(e => !newEdges.has(e.id));
    ghostEdges.forEach(e => edgeStatus.set(e.id, 'deleted'));

    return { nodeStatus, edgeStatus, ghostNodes, ghostEdges };
  }, [diffingVersion, nodes, edges]);

  const getTransformedMouseCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    return {
      x: (mouseX - transform.x) / transform.scale,
      y: (mouseY - transform.y) / transform.scale,
    };
  }, [transform]);

  const addNode = (type: 'page' | 'state') => {
    const newNodeId = `node_${crypto.randomUUID()}`;
    const canvasRect = canvasRef.current?.getBoundingClientRect() || { width: window.innerWidth, height: window.innerHeight };
    const centerX = (canvasRect.width / 2 - transform.x) / transform.scale;
    const centerY = (canvasRect.height / 2 - transform.y) / transform.scale;

    const isPage = type === 'page';
    const newNode: NodeData = {
      id: newNodeId,
      type,
      x: centerX - (isPage ? 300 : 125),
      y: centerY - (isPage ? 200 : 60),
      width: isPage ? 600 : 250,
      height: isPage ? 400 : 120,
      title: isPage ? 'New Page' : 'New State',
      description: isPage ? '' : 'Describe this application state.',
      locked: false,
      ...(isPage && { docs: '' }),
      ...(type === 'state' && { variables: [] })
    };
    setState(prev => ({...prev, nodes: [...prev.nodes, newNode]}));
    setCurrentVersionId(null);
    setSelectedElement({ type: 'node', id: newNodeId });
  }

  const handleAddStateNode = () => addNode('state');
  const handleAddPageNode = () => addNode('page');

  const handleDrop = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!draggingNode) return;

    setState(prev => {
        const draggedNode = prev.nodes.find(n => n.id === draggingNode.id);
        if (dropTargetId && draggedNode && draggedNode.type !== 'page') {
            return { ...prev, nodes: prev.nodes.map(n => n.id === draggingNode.id ? { ...n, parentId: dropTargetId } : n) };
        } else if (draggedNode?.parentId) {
            const parent = prev.nodes.find(n => n.id === draggedNode.parentId);
            if(parent) {
                 const transformedCoords = getTransformedMouseCoords(e);
                 const isOutsideParent = transformedCoords.x < parent.x || transformedCoords.x > parent.x + parent.width || transformedCoords.y < parent.y || transformedCoords.y > parent.y + parent.height;
                 if (isOutsideParent) {
                     return { ...prev, nodes: prev.nodes.map(n => n.id === draggingNode.id ? { ...n, parentId: null } : n) };
                 }
            }
        }
        return prev;
    });
    setCurrentVersionId(null);
    setDraggingNode(null);
    setDropTargetId(null);
  }, [draggingNode, dropTargetId, getTransformedMouseCoords, setState]);
  
  const handleNodeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, nodeId: string) => {
    e.stopPropagation();

    if (draggingNode) {
        handleDrop(e);
        wasDroppingRef.current = true;
        return;
    }

    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.locked || (diffResult && diffResult.nodeStatus.get(node.id) === 'deleted')) return;
    
    if (selectedElement?.type === 'node' && selectedElement.id === nodeId) {
        const transformedCoords = getTransformedMouseCoords(e);
        const descendantIds = getDescendants(nodeId, nodes);
        const descendantInitialPositions = new Map<string, {x: number, y: number}>();
        nodes.forEach(n => {
            if(descendantIds.includes(n.id)) {
                descendantInitialPositions.set(n.id, { x: n.x, y: n.y });
            }
        });

        setDraggingNode({
          id: nodeId,
          offsetX: transformedCoords.x - node.x,
          offsetY: transformedCoords.y - node.y,
          initialX: node.x,
          initialY: node.y,
          descendantInitialPositions,
        });
    }
  }, [nodes, getTransformedMouseCoords, draggingNode, handleDrop, selectedElement, diffResult]);

  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.locked) return;

    setResizingNode({
        id: nodeId,
        initialWidth: node.width,
        initialHeight: node.height,
        initialMouseX: e.clientX / transform.scale,
        initialMouseY: e.clientY / transform.scale,
    });

  }, [nodes, transform.scale]);

  const handleNodeMouseUp = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectionPreview && connectionPreview.sourceId !== nodeId) {
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode?.type !== 'page') {
             const newEdge: EdgeData = {
                id: `edge_${crypto.randomUUID()}`,
                sourceId: connectionPreview.sourceId,
                targetId: nodeId,
                label: 'New Interaction',
                type: 'interaction',
                condition: ''
            };
            setState(prev => ({...prev, edges: [...prev.edges, newEdge]}));
            setCurrentVersionId(null);
        }
    }
    setConnectionPreview(null);
  }, [connectionPreview, nodes, setState]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (draggingNode) {
        e.preventDefault();
        e.stopPropagation();
        handleDrop(e);
        wasDroppingRef.current = true;
        return;
    }

    if (e.button !== 0) return;

    e.preventDefault();
    setIsPanning(true);
    setPanningStartPos({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    didPan.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    
  }, [transform, draggingNode, handleDrop]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const transformedCoords = getTransformedMouseCoords(e);

    if (resizingNode) {
        const dx = e.clientX / transform.scale - resizingNode.initialMouseX;
        const dy = e.clientY / transform.scale - resizingNode.initialMouseY;
        const minWidth = 300;
        const minHeight = 200;

        setState(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => {
                if (n.id === resizingNode.id) {
                    return {
                        ...n,
                        width: Math.max(minWidth, resizingNode.initialWidth + dx),
                        height: Math.max(minHeight, resizingNode.initialHeight + dy),
                    };
                }
                return n;
            })
        }));
        setCurrentVersionId(null);

    } else if (draggingNode) {
      const newX = transformedCoords.x - draggingNode.offsetX;
      const newY = transformedCoords.y - draggingNode.offsetY;
      const dx = newX - draggingNode.initialX;
      const dy = newY - draggingNode.initialY;

      setState(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => {
            if (n.id === draggingNode.id) {
                return { ...n, x: newX, y: newY };
            }
            const initialPos = draggingNode.descendantInitialPositions.get(n.id);
            if(initialPos) {
                return { ...n, x: initialPos.x + dx, y: initialPos.y + dy };
            }
            return n;
          })
      }));
      setCurrentVersionId(null);

      const draggedNode = nodes.find(n => n.id === draggingNode.id);
      if (!draggedNode || draggedNode.type === 'page') {
        setDropTargetId(null);
        return;
      };
      
      const descendantsOfDragged = getDescendants(draggingNode.id, nodes);
      const potentialDropTarget = nodes.find(node => 
        !node.locked &&
        node.id !== draggingNode.id &&
        !descendantsOfDragged.includes(node.id) &&
        transformedCoords.x >= node.x &&
        transformedCoords.x <= node.x + node.width &&
        transformedCoords.y >= node.y &&
        transformedCoords.y <= node.y + node.height
      );
      setDropTargetId(potentialDropTarget ? potentialDropTarget.id : null);

    } else if (isPanning) {
        didPan.current = true;
        setTransform(prev => ({
            ...prev,
            x: e.clientX - panningStartPos.x,
            y: e.clientY - panningStartPos.y,
        }));
    } else if (connectionPreview) {
        setConnectionPreview(prev => prev ? { ...prev, x2: transformedCoords.x, y2: transformedCoords.y } : null);
    }
  }, [draggingNode, isPanning, panningStartPos, connectionPreview, getTransformedMouseCoords, nodes, resizingNode, transform.scale, setState]);

  const handleCanvasClick = useCallback(() => {
    if (wasDroppingRef.current) {
        wasDroppingRef.current = false;
        return;
    }
    if (!didPan.current) {
        setSelectedElement(null);
        setOpenDocsNodeId(null);
    }
  }, []);

  const handleNodeClick = useCallback((e: React.MouseEvent<HTMLDivElement>, nodeId: string) => {
    e.stopPropagation();
    if (wasDroppingRef.current) {
        wasDroppingRef.current = false;
        return;
    }
    if (openDocsNodeId && openDocsNodeId !== nodeId) {
      setOpenDocsNodeId(null);
    }
    setSelectedElement({ type: 'node', id: nodeId });
  }, [openDocsNodeId]);

  const handleEdgeClick = useCallback((e: React.MouseEvent, edgeId: string) => {
      e.stopPropagation();
      setSelectedElement({ type: 'edge', id: edgeId });
      setOpenDocsNodeId(null);
  }, []);

  const handleUpdateElement = useCallback((id: string, type: 'node' | 'edge', data: Partial<NodeData> | Partial<EdgeData>) => {
      setState(prev => {
          if (type === 'node') {
              return {...prev, nodes: prev.nodes.map(n => n.id === id ? { ...n, ...data } as NodeData : n)};
          } else {
              // FIX: Added type assertion to EdgeData to resolve TypeScript error.
              return {...prev, edges: prev.edges.map(e => e.id === id ? { ...e, ...data } as EdgeData : e)};
          }
      });
      setCurrentVersionId(null);
  }, [setState]);

  const handleDeleteElement = useCallback((id: string, type: 'node' | 'edge') => {
      setState(prev => {
          if(type === 'node') {
              const descendantIds = getDescendants(id, prev.nodes);
              const idsToDelete = [id, ...descendantIds];
              return {
                  ...prev,
                  nodes: prev.nodes.filter(n => !idsToDelete.includes(n.id)),
                  edges: prev.edges.filter(e => !idsToDelete.includes(e.sourceId) && !idsToDelete.includes(e.targetId))
              };
          } else {
              return {...prev, edges: prev.edges.filter(e => e.id !== id)};
          }
      });
      setCurrentVersionId(null);
      setSelectedElement(null);
  }, [setState]);
  
  const handleStartConnection = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.type === 'page') return;

    const transformedCoords = getTransformedMouseCoords(e);
    const startX = node.x + node.width;
    const startY = node.y + node.height / 2;
    
    setConnectionPreview({
      sourceId: nodeId,
      x1: startX,
      y1: startY,
      x2: transformedCoords.x,
      y2: transformedCoords.y,
    });
  }, [nodes, getTransformedMouseCoords]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - canvasRect.left;
    const mouseY = e.clientY - canvasRect.top;
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.2, transform.scale + scaleAmount), 3);
    const worldX = (mouseX - transform.x) / transform.scale;
    const worldY = (mouseY - transform.y) / transform.scale;
    const newX = mouseX - worldX * newScale;
    const newY = mouseY - worldY * newScale;
    setTransform({ scale: newScale, x: newX, y: newY });
  }, [transform]);

  const handleToggleHistory = () => {
    setIsHistoryPanelOpen(prev => !prev);
  };
  
  const handleToggleDocs = (nodeId: string) => {
    if (openDocsNodeId !== nodeId) {
      setSelectedElement({ type: 'node', id: nodeId });
    }
    setOpenDocsNodeId(prev => (prev === nodeId ? null : nodeId));
  };
  
  const handleUpdateDocs = (nodeId: string, docs: string) => {
    handleUpdateElement(nodeId, 'node', { docs });
  };

  const handleSaveVersion = useCallback((name: string) => {
    const newVersion: Version = {
      id: crypto.randomUUID(),
      name,
      timestamp: new Date().toISOString(),
      nodes,
      edges,
    };
    setHistory(prev => [...prev, newVersion]);
    setCurrentVersionId(newVersion.id);
  }, [nodes, edges]);

  const handleLoadVersion = useCallback((versionId: string) => {
    const versionToLoad = history.find(v => v.id === versionId);
    if (versionToLoad) {
      resetState({ nodes: versionToLoad.nodes, edges: versionToLoad.edges });
      setCurrentVersionId(versionToLoad.id);
      setSelectedElement(null);
      setDiffingVersion(null);
    }
  }, [history, resetState]);

  const handleDeleteVersion = useCallback((versionId: string) => {
    setHistory(prev => prev.filter(v => v.id !== versionId));
    if (currentVersionId === versionId) {
      setCurrentVersionId(null);
    }
    if (diffingVersion?.id === versionId) {
        setDiffingVersion(null);
    }
  }, [currentVersionId, diffingVersion]);

  const handleStartDiff = useCallback((versionId: string) => {
    const versionToDiff = history.find(v => v.id === versionId);
    if (versionToDiff) {
        setDiffingVersion(versionToDiff);
        setDiffMode('simple');
    }
  }, [history]);

  const handleClearDiff = () => {
    setDiffingVersion(null);
    setDiffMode('off');
  }

  const handleDiffModeChange = (mode: 'off' | 'simple' | 'detailed') => {
    if (mode === 'off') {
        handleClearDiff();
    } else {
        setDiffMode(mode);
    }
  }

  const handleExport = useCallback(() => {
    const data = JSON.stringify({ ...state, history }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-flow-history.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state, history]);

  const handleExportAsImage = useCallback(() => {
    if (nodes.length === 0) {
        alert("Nothing to export.");
        return;
    }

    const padding = 50;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + node.height);
    });

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const svgWidth = contentWidth + padding * 2;
    const svgHeight = contentHeight + padding * 2;

    const isDark = theme === 'dark';
    
    const styles = {
        bg: isDark ? '#1e293b' : '#f1f5f9',
        page: {
            bg: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(248, 250, 252, 0.7)',
            border: isDark ? '#475569' : '#cbd5e1',
            headerBg: isDark ? '#334155' : '#e2e8f0',
            title: isDark ? '#e2e8f0' : '#1e293b',
        },
        state: {
            bg: isDark ? '#334155' : '#ffffff',
            border: isDark ? '#475569' : '#cbd5e1',
            title: isDark ? '#e2e8f0' : '#1e293b',
            description: isDark ? '#94a3b8' : '#64748b',
            varKeyBg: isDark ? '#475569' : '#f1f5f9',
            varValueBg: isDark ? '#475569' : '#f1f5f9',
            varText: isDark ? '#cbd5e1' : '#334155',
        },
        edge: {
            line: isDark ? '#94a3b8' : '#64748b',
            labelBg: isDark ? '#334155' : '#ffffff',
            labelBorder: isDark ? '#475569' : '#cbd5e1',
            labelText: isDark ? '#e2e8f0' : '#334155',
            conditionBg: isDark ? '#312e81' : '#e0e7ff',
            conditionText: isDark ? '#c7d2fe' : '#3730a3',
        },
    };

    const nodesSvg = nodes.map(node => {
        const commonRectProps = `rx="8" stroke="${node.type === 'page' ? styles.page.border : styles.state.border}" stroke-width="1"`;
        
        if (node.type === 'page') {
            return `
                <g transform="translate(${node.x}, ${node.y})">
                    <rect width="${node.width}" height="${node.height}" fill="${styles.page.bg}" ${commonRectProps} />
                    <rect width="${node.width}" height="40" fill="${styles.page.headerBg}" rx="8" ry="8" />
                    <rect width="${node.width}" height="20" y="20" fill="${styles.page.headerBg}" />
                    <text x="16" y="25" font-family="sans-serif" font-size="16" font-weight="bold" fill="${styles.page.title}" text-anchor="start">${escapeXml(node.title)}</text>
                </g>
            `;
        }

        // State node
        const titleY = 24;
        const descY = 44;
        const lineHeight = 18;
        const descLines = wrapText(node.description, node.width - 32, 7.5);
        
        let variablesSvg = '';
        if (node.variables && node.variables.length > 0) {
            const startY = descY + descLines.length * lineHeight;
            variablesSvg += `<line x1="12" y1="${startY}" x2="${node.width - 12}" y2="${startY}" stroke="${isDark ? '#475569' : '#e2e8f0'}" stroke-width="1" />`;
            
            let currentY = startY + 20;
            
            node.variables.forEach(v => {
                const keyWidth = v.key.length * 7 + 8;
                const valueWidth = v.value.length * 7 + 8;
                const keyX = 16;
                const equalX = keyX + keyWidth + 6;
                const valueX = equalX + 14;
                
                variablesSvg += `
                    <g transform="translate(0, ${currentY})">
                        <rect x="${keyX}" y="-12" height="16" width="${keyWidth}" rx="4" fill="${styles.state.varKeyBg}" />
                        <text x="${keyX + 4}" font-family="monospace" font-size="12" fill="${styles.state.varText}">${escapeXml(v.key)}</text>
                        <text x="${equalX}" font-family="monospace" font-size="12" fill="${styles.state.description}">=</text>
                        <rect x="${valueX}" y="-12" height="16" width="${valueWidth}" rx="4" fill="${styles.state.varValueBg}" />
                        <text x="${valueX + 4}" font-family="monospace" font-size="12" fill="${styles.state.varText}">${escapeXml(v.value)}</text>
                    </g>
                `;
                currentY += 20;
            });
        }

        return `
            <g transform="translate(${node.x}, ${node.y})">
                <rect width="${node.width}" height="${node.height}" fill="${styles.state.bg}" ${commonRectProps} />
                <text x="16" y="${titleY}" font-family="sans-serif" font-size="16" font-weight="bold" fill="${styles.state.title}">${escapeXml(node.title)}</text>
                ${descLines.map((line, i) => `<text x="16" y="${descY + i * lineHeight}" font-family="sans-serif" font-size="14" fill="${styles.state.description}">${escapeXml(line)}</text>`).join('')}
                ${variablesSvg}
            </g>
        `;
    }).join('');
    
    const edgesSvg = edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.sourceId);
        const targetNode = nodes.find(n => n.id === edge.targetId);
        if (!sourceNode || !targetNode) return '';
        
        const x1 = sourceNode.x + sourceNode.width;
        const y1 = sourceNode.y + sourceNode.height / 2;
        const x2 = targetNode.x;
        const y2 = targetNode.y + targetNode.height / 2;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        const labelHtml = `
            <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: sans-serif; font-size: 14px; text-align: center;">
              <div style="background-color: ${styles.edge.labelBg}; color: ${styles.edge.labelText}; border: 1px solid ${styles.edge.labelBorder}; padding: 2px 8px; border-radius: 6px; display: inline-block;">
                ${escapeXml(edge.label)}
              </div>
              ${edge.condition ? `<div style="margin-top: 4px; background-color: ${styles.edge.conditionBg}; color: ${styles.edge.conditionText}; font-family: monospace; font-size: 12px; padding: 1px 6px; border-radius: 9999px; display: inline-block; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeXml(edge.condition)}</div>` : ''}
            </div>
        `;
        
        return `
            <g>
                <path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="${styles.edge.line}" stroke-width="2" stroke-dasharray="${edge.type === 'action' ? '5,5' : 'none'}" marker-end="url(#arrowhead)" />
                <foreignObject x="${midX - 75}" y="${midY - 30}" width="150" height="60">
                    ${labelHtml}
                </foreignObject>
            </g>
        `;
    }).join('');

    const svgString = `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <marker id="arrowhead" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto" fill="${styles.edge.line}">
                    <polygon points="0 0, 7 2.5, 0 5" />
                </marker>
            </defs>
            <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="${styles.bg}" />
            <g transform="translate(${-minX + padding}, ${-minY + padding})">
                ${edgesSvg}
                ${nodesSvg}
            </g>
        </svg>
    `;

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-flow.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, edges, theme]);


  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
            if (Array.isArray(data.history)) {
                setHistory(data.history);
                const latestVersion = [...data.history].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                if (latestVersion) {
                    resetState({ nodes: latestVersion.nodes, edges: latestVersion.edges });
                    setCurrentVersionId(latestVersion.id);
                } else {
                    resetState({ nodes: [], edges: [] });
                    setCurrentVersionId(null);
                }
            } else {
                resetState({ nodes: data.nodes, edges: data.edges });
                setHistory([]);
                setCurrentVersionId(null);
            }
            setSelectedElement(null);
            setDiffingVersion(null);
        } else { alert('Invalid file format.'); }
      } catch (error) {
        alert('Error reading or parsing file.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [resetState]);

  const triggerImport = () => importFileRef.current?.click();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        if (draggingNode) {
          setState(prev => ({ ...prev, nodes: prev.nodes.map(n => {
              if (n.id === draggingNode.id) {
                  return { ...n, x: draggingNode.initialX, y: draggingNode.initialY };
              }
              const initialPos = draggingNode.descendantInitialPositions.get(n.id);
              if (initialPos) {
                  return { ...n, x: initialPos.x, y: initialPos.y };
              }
              return n;
          })}));
          setCurrentVersionId(null);
          setDraggingNode(null);
        }
        if (connectionPreview) setConnectionPreview(null);
        if (dropTargetId) setDropTargetId(null);
        if (openDocsNodeId) setOpenDocsNodeId(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [draggingNode, connectionPreview, dropTargetId, undo, redo, setState, openDocsNodeId]);

  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isPanning && e.button === 0) {
          setIsPanning(false);
          if (canvasRef.current) canvasRef.current.style.cursor = 'default';
      }
      if (resizingNode) {
        setResizingNode(null);
      }
      setConnectionPreview(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isPanning, resizingNode]);

  const nodesToRender = diffResult ? [...nodes, ...diffResult.ghostNodes] : sortedNodes;
  const edgesToRender = diffResult ? [...edges, ...diffResult.ghostEdges] : edges;

  const getDiffColor = (status: DiffStatus | undefined, isSelected: boolean) => {
    const colors = {
      light: { default: '#64748b', selected: '#3b82f6', added: '#22c55e', modified: '#f59e0b', deleted: '#ef4444' },
      dark: { default: '#94a3b8', selected: '#60a5fa', added: '#4ade80', modified: '#facc15', deleted: '#f87171' }
    };
    const themeColors = colors[theme];
    if (isSelected) return themeColors.selected;
    if (diffMode === 'detailed') {
      if (status === 'added') return themeColors.added;
      if (status === 'modified') return themeColors.modified;
      if (status === 'deleted') return themeColors.deleted;
    }
     if (diffMode === 'simple' && (status === 'added' || status === 'modified')) {
       return themeColors.selected;
     }
    return themeColors.default;
  }

  return (
    <div className="flex h-screen font-sans dark:text-slate-300">
      <HistoryPanel
        isOpen={isHistoryPanelOpen}
        versions={history}
        currentVersionId={currentVersionId}
        diffingVersionId={diffingVersion?.id || null}
        onSaveVersion={handleSaveVersion}
        onLoadVersion={handleLoadVersion}
        onDeleteVersion={handleDeleteVersion}
        onStartDiff={handleStartDiff}
        onClearDiff={handleClearDiff}
        onClose={handleToggleHistory}
      />
      <div 
        ref={canvasRef}
        className="flex-grow h-full relative overflow-hidden bg-slate-100 dark:bg-slate-900"
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={handleCanvasMouseDown}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        style={{
          backgroundImage: theme === 'light' 
            ? 'radial-gradient(#d1d5db 1px, transparent 1px)'
            : 'radial-gradient(#475569 1px, transparent 1px)',
          backgroundSize: '1.5rem 1.5rem',
        }}
      >
        <Toolbar 
          onAddStateNode={handleAddStateNode} 
          onAddPageNode={handleAddPageNode} 
          onExport={handleExport} 
          onImport={triggerImport} 
          onExportAsImage={handleExportAsImage}
          onToggleHistory={handleToggleHistory}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          isDiffing={!!diffingVersion}
          diffMode={diffMode}
          onDiffModeChange={handleDiffModeChange}
          isHistoryPanelOpen={isHistoryPanelOpen}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
        <input type="file" ref={importFileRef} onChange={handleImport} accept=".json" style={{ display: 'none' }} />

        <div className="absolute top-0 left-0" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: '0 0' }}>
            {nodesToRender.map(node => {
              const diffStatus = diffResult?.nodeStatus.get(node.id) || 'unchanged';
              const isGhost = diffStatus === 'deleted';
              return (
              <Node
                key={node.id}
                data={node}
                isSelected={selectedElement?.type === 'node' && selectedElement.id === node.id}
                isParent={nodeIsParent.has(node.id)}
                isDropTarget={node.id === dropTargetId}
                diffStatus={diffStatus}
                diffMode={diffMode}
                isGhost={isGhost}
                onMouseDown={handleNodeMouseDown}
                onMouseUp={handleNodeMouseUp}
                onClick={handleNodeClick}
                onStartConnection={handleStartConnection}
                onResizeStart={handleResizeStart}
                onToggleDocs={handleToggleDocs}
              />
            )})}
            
            {openDocsNodeId && nodes.find(n => n.id === openDocsNodeId) && (
                <DocsPanel
                    node={nodes.find(n => n.id === openDocsNodeId)!}
                    onClose={() => setOpenDocsNodeId(null)}
                    onUpdateDocs={handleUpdateDocs}
                />
            )}
        </div>
        
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <defs>
                <marker id="arrowhead" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto" fill={theme === 'light' ? '#64748b' : '#94a3b8'}>
                    <polygon points="0 0, 7 2.5, 0 5" />
                </marker>
                 <marker id="arrowhead-selected" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto" fill={theme === 'light' ? '#3b82f6' : '#60a5fa'}>
                    <polygon points="0 0, 7 2.5, 0 5" />
                </marker>
                 <marker id="arrowhead-added" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto" fill={theme === 'light' ? '#22c55e' : '#4ade80'}>
                    <polygon points="0 0, 7 2.5, 0 5" />
                </marker>
                 <marker id="arrowhead-modified" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto" fill={theme === 'light' ? '#f59e0b' : '#facc15'}>
                    <polygon points="0 0, 7 2.5, 0 5" />
                </marker>
                 <marker id="arrowhead-deleted" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto" fill={theme === 'light' ? '#ef4444' : '#f87171'}>
                    <polygon points="0 0, 7 2.5, 0 5" />
                </marker>
            </defs>
            <g style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: '0 0' }}>
                {edgesToRender.map(edge => {
                    const sourceNode = nodesToRender.find(n => n.id === edge.sourceId);
                    const targetNode = nodesToRender.find(n => n.id === edge.targetId);
                    if (!sourceNode || !targetNode) return null;

                    const diffStatus = diffResult?.edgeStatus.get(edge.id) || 'unchanged';
                    const isGhost = diffStatus === 'deleted';

                    const x1 = sourceNode.x + sourceNode.width;
                    const y1 = sourceNode.y + sourceNode.height / 2;
                    const x2 = targetNode.x;
                    const y2 = targetNode.y + targetNode.height / 2;
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    const isSelected = selectedElement?.type === 'edge' && selectedElement.id === edge.id;
                    
                    const strokeColor = getDiffColor(diffStatus, isSelected);
                    const markerId = isSelected ? 'arrowhead-selected' : diffMode === 'detailed' && diffStatus !== 'unchanged' ? `arrowhead-${diffStatus}` : 'arrowhead';

                    return (
                        <g key={edge.id} className="pointer-events-auto" style={{ opacity: isGhost ? 0.4 : 1 }}>
                            
                             <path 
                                d={`M ${x1} ${y1} L ${x2} ${y2}`}
                                stroke={strokeColor}
                                strokeWidth="2"
                                strokeDasharray={edge.type === 'action' ? '5,5' : 'none'}
                                markerEnd={`url(#${markerId})`}
                                className="pointer-events-none"
                            />
                            <foreignObject x={midX - 75} y={midY - 25} width="150" height="50" className="pointer-events-none">
                                <div 
                                  className={`pointer-events-auto cursor-pointer flex flex-col items-center justify-center h-full ${isGhost ? 'pointer-events-none' : ''}`}
                                  onClick={(e) => handleEdgeClick(e, edge.id)}
                                >
                                  <div 
                                    className="px-2 py-1 rounded-md text-sm font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                                    style={{
                                      border: `1px solid ${isSelected ? (theme === 'light' ? '#3b82f6' : '#60a5fa') : (theme === 'light' ? '#cbd5e1' : '#475569')}`
                                    }}
                                  >
                                    {edge.label}
                                  </div>
                                  {edge.condition && (
                                     <div className="mt-1 px-1.5 py-0.5 rounded-full text-xs font-mono truncate max-w-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                                      title={edge.condition}
                                     >
                                        {edge.condition}
                                     </div>
                                  )}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}
                {connectionPreview && (
                     <path 
                        d={`M ${connectionPreview.x1} ${connectionPreview.y1} L ${connectionPreview.x2} ${connectionPreview.y2}`}
                        stroke={theme === 'light' ? '#3b82f6' : '#60a5fa'}
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        markerEnd="url(#arrowhead-selected)"
                    />
                )}
            </g>
        </svg>

      </div>
      {selectedElement && <PropertiesPanel 
        selectedElement={selectedElement} 
        nodes={nodes} 
        edges={edges}
        onUpdateElement={handleUpdateElement}
        onDeleteElement={handleDeleteElement}
      />}
    </div>
  );
};

export default App;