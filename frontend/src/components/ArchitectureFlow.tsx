'use client';
import { ReactNode } from 'react';
import { ReactFlow, Background, MarkerType, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Cpu, HardDrive, Network, Radio, Globe, Shield } from 'lucide-react';

interface CustomNodeData {
  label: string;
  icon: any;
  borderClass: string;
  sub: string;
}

// Custom Node design for NextJS elements
const NodeRenderer = ({ data }: { data: CustomNodeData }) => {
  const IconComp = data.icon;
  return (
    <div className={`px-4 py-3 rounded-xl bg-brand-card/90 border-2 ${data.borderClass} text-brand-text flex items-center gap-3 shadow-lg min-w-[200px]`}>
      <div className="p-2 rounded-lg bg-[#050816]/80 text-brand-text border border-brand-primary/10">
        <IconComp className="h-5 w-5" />
      </div>
      <div className="text-left font-mono">
        <div className="text-xs font-bold leading-tight">{data.label}</div>
        <div className="text-[10px] text-brand-subtext mt-0.5 leading-none">{data.sub}</div>
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: NodeRenderer
};

export default function ArchitectureFlow() {
  const initialNodes: Node[] = [
    {
      id: 'frontend',
      type: 'custom',
      position: { x: 50, y: 150 },
      data: {
        label: 'Next.js Frontend',
        icon: Globe,
        borderClass: 'border-brand-primary/40 shadow-[0_0_15px_rgba(0,229,255,0.1)]',
        sub: 'Web Interface & Twin'
      }
    },
    {
      id: 'backend',
      type: 'custom',
      position: { x: 340, y: 150 },
      data: {
        label: 'Express Node Server',
        icon: Cpu,
        borderClass: 'border-brand-secondary/40 shadow-[0_0_15px_rgba(0,255,149,0.1)]',
        sub: 'Socket.io Simulation Engine'
      }
    },
    {
      id: 'database',
      type: 'custom',
      position: { x: 630, y: 60 },
      data: {
        label: 'MongoDB Cache',
        icon: HardDrive,
        borderClass: 'border-brand-warning/40 shadow-[0_0_15px_rgba(255,184,0,0.1)]',
        sub: 'State & Logs Ledger'
      }
    },
    {
      id: 'telegram',
      type: 'custom',
      position: { x: 630, y: 240 },
      data: {
        label: 'Telegram Bot API',
        icon: Radio,
        borderClass: 'border-brand-primary/45 shadow-[0_0_15px_rgba(0,229,255,0.1)]',
        sub: 'Owner Chat Hook'
      }
    },
    {
      id: 'iot',
      type: 'custom',
      position: { x: 340, y: 320 },
      data: {
        label: 'ESP32 IoT Sensor Layer',
        icon: Network,
        borderClass: 'border-brand-danger/40 shadow-[0_0_15px_rgba(255,77,77,0.1)]',
        sub: 'GPS + MPU6050 Accelerometer'
      }
    },
    {
      id: 'detector',
      type: 'custom',
      position: { x: 150, y: 10 },
      data: {
        label: 'Threat Filter Engine',
        icon: Shield,
        borderClass: 'border-brand-secondary/30',
        sub: 'IDS Pattern Matcher'
      }
    }
  ];

  const initialEdges: Edge[] = [
    {
      id: 'fe-be',
      source: 'frontend',
      target: 'backend',
      animated: true,
      style: { stroke: '#00e5ff', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#00e5ff' }
    },
    {
      id: 'be-db',
      source: 'backend',
      target: 'database',
      animated: true,
      style: { stroke: '#00ff95', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#00ff95' }
    },
    {
      id: 'be-tg',
      source: 'backend',
      target: 'telegram',
      animated: true,
      style: { stroke: '#00e5ff', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#00e5ff' }
    },
    {
      id: 'iot-be',
      source: 'iot',
      target: 'backend',
      animated: true,
      style: { stroke: '#ff4d4d', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#ff4d4d' }
    },
    {
      id: 'be-det',
      source: 'backend',
      target: 'detector',
      animated: true,
      style: { stroke: '#00ff95', strokeWidth: 1.5, strokeDasharray: '5,5' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#00ff95' }
    }
  ];

  return (
    <div className="w-full h-[450px] border border-brand-primary/10 rounded-2xl bg-brand-card/40 relative overflow-hidden">
      {/* Network Canvas grid */}
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        fitView
        nodesConnectable={false}
        nodesDraggable={true}
        zoomOnScroll={false}
        panOnDrag={true}
        preventScrolling={true}
      >
        <Background bgColor="#050816" color="rgba(0, 229, 255, 0.08)" gap={20} size={1} />
      </ReactFlow>
      
      {/* Zoom / Drag Overlay Prompt */}
      <div className="absolute bottom-4 right-4 bg-brand-card/80 border border-brand-primary/10 px-3 py-1.5 rounded text-[10px] font-mono text-brand-subtext pointer-events-none select-none">
        💡 Interactive: Nodes can be dragged on canvas.
      </div>
    </div>
  );
}
