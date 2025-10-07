import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal for batch editing multiple selected items
 */
const BatchEditModal = ({ onClose, onApply, selectedItems = [] }) => {
  // Per-field values and apply toggles
  const [type, setType] = useState('');
  const [applyType, setApplyType] = useState(false);
  const [author, setAuthor] = useState('');
  const [applyAuthor, setApplyAuthor] = useState(false);
  const [director, setDirector] = useState('');
  const [applyDirector, setApplyDirector] = useState(false);
  const [year, setYear] = useState('');
  const [applyYear, setApplyYear] = useState(false);
  const [rating, setRating] = useState(null);
  const [applyRating, setApplyRating] = useState(false);
  const [addTagsStr, setAddTagsStr] = useState('');
  const [applyAddTags, setApplyAddTags] = useState(false);
  const [removeTagsStr, setRemoveTagsStr] = useState('');
  const [applyRemoveTags, setApplyRemoveTags] = useState(false);
  const [dateRead, setDateRead] = useState('');
  const [applyDateRead, setApplyDateRead] = useState(false);
  const [dateWatched, setDateWatched] = useState('');
  const [applyDateWatched, setApplyDateWatched] = useState(false);

  // Compute preview
  const preview = selectedItems.map(it => {
    const out = { before: it, after: { ...it } };
    if (applyType && type) out.after.type = type;
    if (applyAuthor && author) out.after.author = author;
    if (applyDirector && director) out.after.director = director;
    if (applyYear && year) out.after.year = year;
    if (applyRating && (rating !== null && rating !== undefined)) out.after.rating = rating;
    if (applyAddTags && addTagsStr) {
      out.after.tags = Array.from(new Set([
        ...(out.after.tags || []),
        ...addTagsStr.split(',').map(s => s.trim()).filter(Boolean)
      ]));
    }
    if (applyRemoveTags && removeTagsStr) {
      out.after.tags = (out.after.tags || []).filter(t =>
        !removeTagsStr.split(',').map(s => s.trim()).filter(Boolean).includes(t)
      );
    }
    if (applyDateRead && dateRead) out.after.dateRead = dateRead;
    if (applyDateWatched && dateWatched) out.after.dateWatched = dateWatched;
    return out;
  });

  const handleApply = () => {
    const changes = {};
    if (applyType) changes.type = type;
    if (applyAuthor) changes.author = author;
    if (applyDirector) changes.director = director;
    if (applyYear) changes.year = year;
    if (applyRating) changes.rating = rating;
    if (applyAddTags) changes.addTags = addTagsStr ? addTagsStr.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (applyRemoveTags) changes.removeTags = removeTagsStr ? removeTagsStr.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (applyDateRead) changes.dateRead = dateRead;
    if (applyDateWatched) changes.dateWatched = dateWatched;

    if (Object.keys(changes).length === 0) {
      alert('No fields selected to apply');
      return;
    }

    onApply(changes);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleApply();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [type, author, director, year, rating, addTagsStr, removeTagsStr, dateRead, dateWatched, applyType, applyAuthor, applyDirector, applyYear, applyRating, applyAddTags, applyRemoveTags, applyDateRead, applyDateWatched]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Batch Edit Preview</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              className="px-3 py-1 rounded" 
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: 'white' }}
            >
              Close
            </button>
            <button 
              onClick={handleApply} 
              className="px-3 py-1 rounded" 
              style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
            >
              Apply to {selectedItems.length} items
            </button>
          </div>
        </div>
        
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="text-sm text-slate-300">Select fields to apply</div>
            <div className="bg-slate-800 border border-slate-700 rounded p-3 space-y-2">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={applyType} 
                  onChange={(e) => setApplyType(e.target.checked)} 
                />
                Type
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded"
                >
                  <option value="">(select)</option>
                  <option value="book">book</option>
                  <option value="movie">movie</option>
                </select>
              </label>
              
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={applyAuthor} 
                  onChange={(e) => setApplyAuthor(e.target.checked)} 
                />
                Author
                <input 
                  value={author} 
                  onChange={(e) => setAuthor(e.target.value)} 
                  className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" 
                  placeholder="Author" 
                />
              </label>
              
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={applyDirector} 
                  onChange={(e) => setApplyDirector(e.target.checked)} 
                />
                Director
                <input 
                  value={director} 
                  onChange={(e) => setDirector(e.target.value)} 
                  className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" 
                  placeholder="Director" 
                />
              </label>
              
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={applyYear} 
                  onChange={(e) => setApplyYear(e.target.checked)} 
                />
                Year
                <input 
                  value={year} 
                  onChange={(e) => setYear(e.target.value)} 
                  className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" 
                  placeholder="Year" 
                />
              </label>
              
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={applyRating} 
                  onChange={(e) => setApplyRating(e.target.checked)} 
                />
                Rating
                <select 
                  value={rating ?? ''} 
                  onChange={(e) => setRating(e.target.value === '' ? null : parseInt(e.target.value, 10))} 
                  className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded"
                >
                  <option value="">(select)</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </label>
              
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={applyAddTags} 
                  onChange={(e) => setApplyAddTags(e.target.checked)} 
                />
                Add tags
                <input 
                  value={addTagsStr} 
                  onChange={(e) => setAddTagsStr(e.target.value)} 
                  className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" 
                  placeholder="tag1, tag2" 
                />
              </label>
              
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={applyRemoveTags} 
                  onChange={(e) => setApplyRemoveTags(e.target.checked)} 
                />
                Remove tags
                <input 
                  value={removeTagsStr} 
                  onChange={(e) => setRemoveTagsStr(e.target.value)} 
                  className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" 
                  placeholder="tag1, tag2" 
                />
              </label>
              
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={applyDateRead} 
                  onChange={(e) => setApplyDateRead(e.target.checked)} 
                />
                Date read
                <input 
                  type="date" 
                  value={dateRead} 
                  onChange={(e) => setDateRead(e.target.value)} 
                  className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" 
                />
              </label>
              
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={applyDateWatched} 
                  onChange={(e) => setApplyDateWatched(e.target.checked)} 
                />
                Date watched
                <input 
                  type="date" 
                  value={dateWatched} 
                  onChange={(e) => setDateWatched(e.target.value)} 
                  className="ml-auto px-2 py-1 bg-slate-700 border border-slate-600 rounded" 
                />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-slate-300">Preview (before → after)</div>
            <div className="bg-slate-800 border border-slate-700 rounded p-3 max-h-[60vh] overflow-y-auto space-y-2">
              {preview.map((p, idx) => (
                <div key={idx} className="p-2 border-b border-slate-700 last:border-b-0">
                  <div className="text-sm font-medium">{p.before.title}</div>
                  <div className="text-xs text-slate-400">
                    Before: {p.before.author || p.before.director || '-'} • {p.before.year || '-'} • {p.before.rating ? `${p.before.rating}★` : '-'}
                  </div>
                  <div className="text-xs text-slate-200 mt-1">
                    After: {p.after.author || p.after.director || '-'} • {p.after.year || '-'} • {p.after.rating ? `${p.after.rating}★` : '-'}
                  </div>
                  {JSON.stringify(p.before) !== JSON.stringify(p.after) && (
                    <div className="text-xs text-yellow-300 mt-1">Will change</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchEditModal;