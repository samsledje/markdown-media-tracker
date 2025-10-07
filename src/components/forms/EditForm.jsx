import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

/**
 * Form component for editing item details
 */
const EditForm = ({ item, onChange }) => {
  const [tagInput, setTagInput] = useState('');
  const [actorInput, setActorInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && !item.tags.includes(tagInput.trim())) {
      onChange({ ...item, tags: [...item.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    onChange({ ...item, tags: item.tags.filter(t => t !== tag) });
  };

  const addActor = () => {
    if (actorInput.trim() && !item.actors.includes(actorInput.trim())) {
      onChange({ ...item, actors: [...item.actors, actorInput.trim()] });
      setActorInput('');
    }
  };

  const removeActor = (actor) => {
    onChange({ ...item, actors: item.actors.filter(a => a !== actor) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Type</label>
        <div className="flex gap-2">
          {['book', 'movie'].map(type => (
            <button
              key={type}
              onClick={() => onChange({ ...item, type })}
              className={`px-4 py-2 rounded-lg transition capitalize ${
                item.type === type
                  ? ''
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              style={item.type === type ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Title *</label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => onChange({ ...item, title: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Enter title"
        />
      </div>

      {item.type === 'book' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Author</label>
            <input
              type="text"
              value={item.author || ''}
              onChange={(e) => onChange({ ...item, author: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter author name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">ISBN</label>
            <input
              type="text"
              value={item.isbn || ''}
              onChange={(e) => onChange({ ...item, isbn: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter ISBN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date read</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={item.dateRead || ''}
                onChange={(e) => onChange({ ...item, dateRead: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => onChange({ ...item, dateRead: '' })}
                className="px-3 py-2 rounded-lg transition text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white' }}
                title="Clear date"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}

      {item.type === 'movie' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Director</label>
            <input
              type="text"
              value={item.director || ''}
              onChange={(e) => onChange({ ...item, director: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter director name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Actors</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={actorInput}
                onChange={(e) => setActorInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (addActor(), e.preventDefault())}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Add actor"
              />
              <button
                onClick={addActor}
                className="px-4 py-2 rounded-lg transition"
                style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.actors.map((actor, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-600 rounded-full text-sm flex items-center gap-2"
                >
                  {actor}
                  <button onClick={() => removeActor(actor)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date watched</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={item.dateWatched || ''}
                onChange={(e) => onChange({ ...item, dateWatched: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => onChange({ ...item, dateWatched: '' })}
                className="px-3 py-2 rounded-lg transition text-sm"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white' }}
                title="Clear date"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Year</label>
        <input
          type="number"
          value={item.year || ''}
          onChange={(e) => onChange({ ...item, year: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Enter year"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(rating => (
            <button
              key={rating}
              onClick={() => {
                // If clicking on the same star that's currently the rating, toggle to unrated (0)
                if (item.rating === rating) {
                  onChange({ ...item, rating: 0 });
                } 
                // Otherwise, set to the clicked rating
                else {
                  onChange({ ...item, rating });
                }
              }}
              className="transition"
            >
              <Star
                className={`w-8 h-8 ${
                  rating <= (item.rating || 0)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (addTag(), e.preventDefault())}
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Add tag"
          />
          <button
            onClick={addTag}
            className="px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-slate-600 rounded-full text-sm flex items-center gap-2"
            >
              {tag}
              <button onClick={() => removeTag(tag)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Cover URL</label>
        <input
          type="text"
          value={item.coverUrl || ''}
          onChange={(e) => onChange({ ...item, coverUrl: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Enter cover image URL"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Review / Notes</label>
        <textarea
          value={item.review || ''}
          onChange={(e) => onChange({ ...item, review: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500"
          placeholder="Write your review or notes here..."
        />
      </div>
    </div>
  );
};

export default EditForm;