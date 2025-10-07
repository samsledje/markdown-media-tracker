import React from 'react';
import { X } from 'lucide-react';

/**
 * Modal displaying keyboard shortcuts help
 */
const HelpModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-3xl w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold">Keyboard shortcuts</h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-slate-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Global</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li><strong>?</strong> — Show this help</li>
              <li><strong>/</strong> or <strong>Ctrl/Cmd+K</strong> — Focus search</li>
              <li><strong>Esc</strong> — Close modals / clear search / exit selection</li>
              <li><strong>A</strong> or <strong>N</strong> — Add manually (when directory selected)</li>
              <li><strong>S</strong> — Search online (when directory selected)</li>
              <li><strong>F</strong> — Toggle filters</li>
              <li><strong>C</strong> — Toggle customize style panel</li>
              <li><strong>T</strong> — Cycle filter type (all → book → movie)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">When items are visible</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li><strong>Arrow keys</strong> — Navigate between item cards</li>
              <li><strong>Enter / Space</strong> — Open selected item</li>
              <li><strong>Shift+Click</strong> or <strong>V</strong> — Toggle selection mode / select</li>
              <li><strong>Ctrl/Cmd+A</strong> — Select all visible (in selection mode)</li>
              <li><strong>Delete / Backspace</strong> — Delete selected (in selection mode)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">In modals</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li><strong>Esc</strong> — Close modal</li>
              <li><strong>Ctrl/Cmd+Enter</strong> — Save / Submit</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;