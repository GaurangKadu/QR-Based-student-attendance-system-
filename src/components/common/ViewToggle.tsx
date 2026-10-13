import React from 'react';
import { LayoutGrid, Table } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'table' | 'card';
  setViewMode: (mode: 'table' | 'card') => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex bg-white rounded-lg p-0.5 border border-slate-300">
      <button
        onClick={() => setViewMode('table')}
        className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
        title="Table View"
      >
        <Table className="w-4 h-4 text-slate-700" />
      </button>
      <button
        onClick={() => setViewMode('card')}
        className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
        title="Card View"
      >
        <LayoutGrid className="w-4 h-4 text-slate-700" />
      </button>
    </div>
  );
};
