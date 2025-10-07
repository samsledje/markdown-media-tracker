import React from 'react';
import { Book, Film, Star, Tag, Calendar, User, Hash } from 'lucide-react';

/**
 * Component for displaying item details in read-only view
 */
const ViewDetails = ({ item, hexToRgba, highlightColor }) => {
  return (
    <div className="space-y-4">
      {item.coverUrl && (
        <div className="flex justify-center mb-6">
          <img
            src={item.coverUrl}
            alt={item.title}
            className="max-w-xs rounded-lg shadow-lg"
          />
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {item.type === 'book' ? (
            <Book className="w-12 h-12 text-blue-400" />
          ) : (
            <Film className="w-12 h-12 text-purple-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm text-slate-400 uppercase tracking-wide mb-1">
            {item.type}
          </div>
          <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
          {item.author && (
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-4 h-4" />
              <span>{item.author}</span>
            </div>
          )}
          {item.director && (
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-4 h-4" />
              <span>Directed by {item.director}</span>
            </div>
          )}
        </div>
      </div>

      {item.actors && item.actors.length > 0 && (
        <div>
          <div className="text-sm font-medium text-slate-400 mb-2">Cast</div>
          <div className="flex flex-wrap gap-2">
            {item.actors.map((actor, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-slate-700 rounded-full text-sm"
              >
                {actor}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.isbn && (
        <div className="flex items-center gap-2 text-slate-300">
          <Hash className="w-4 h-4" />
          <span className="text-sm">ISBN: {item.isbn}</span>
        </div>
      )}

      {item.year && (
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Year: {item.year}</span>
        </div>
      )}

      {item.dateRead && (
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Read on {new Date(item.dateRead).toLocaleDateString()}</span>
        </div>
      )}

      {item.dateWatched && (
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">Watched on {new Date(item.dateWatched).toLocaleDateString()}</span>
        </div>
      )}

      {item.rating && (
        <div>
          <div className="text-sm font-medium text-slate-400 mb-2">Rating</div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-6 h-6 ${
                  i < item.rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div>
          <div className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-sm"
                style={{ 
                  backgroundColor: hexToRgba(highlightColor, 0.12), 
                  color: 'white', 
                  border: `1px solid ${hexToRgba(highlightColor, 0.12)}` 
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {item.review && (
        <div>
          <div className="text-sm font-medium text-slate-400 mb-2">Review / Notes</div>
          <div className="bg-slate-700/30 rounded-lg p-4 text-slate-300 whitespace-pre-wrap">
            {item.review}
          </div>
        </div>
      )}

      {item.dateAdded && (
        <div className="text-xs text-slate-500 mt-4">
          Added on {new Date(item.dateAdded).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default ViewDetails;