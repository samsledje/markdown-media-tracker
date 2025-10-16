import React from 'react';
import { Book, Film, Tag, Calendar, User, Hash, Bookmark, BookOpen, CheckCircle, PlayCircle, Layers, Image, XCircle } from 'lucide-react';
import { STATUS_LABELS, STATUS_ICONS, STATUS_COLORS } from '../../constants/index.js';
import StarRating from '../StarRating.jsx';
import { useHalfStars } from '../../hooks/useHalfStars.js';
import { renderMarkdown } from '../../utils/markdownUtils.js';

/**
 * Get the icon component for a given status
 */
const getStatusIcon = (status, className = '') => {
  const iconType = STATUS_ICONS[status];
  switch (iconType) {
    case 'bookmark':
      return <Bookmark className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'book-open':
      return <BookOpen className={className} />;
    case 'check-circle':
      return <CheckCircle className={className} />;
    case 'play-circle':
      return <PlayCircle className={className} />;
    case 'x-circle':
      return <XCircle className={className} />;
    default:
      return <Bookmark className={className} />;
  }
};

/**
 * Get color class for status badge
 */
const getStatusColorClass = (status) => {
  const colorType = STATUS_COLORS[status];
  switch (colorType) {
    case 'blue':
      return 'bg-blue-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'green':
      return 'bg-green-500';
    case 'red':
      return 'bg-red-500';
    default:
      return 'bg-blue-500';
  }
};

/**
 * Component for displaying item details in read-only view
 */
const ViewDetails = ({ item, hexToRgba, highlightColor, hideRating = false, onFetchCover = null, isFetchingCover = false }) => {
  const [halfStarsEnabled] = useHalfStars();
  return (
    <div className="space-y-4">
      {item.coverUrl ? (
        <div className="flex justify-center mb-6">
          <img
            src={item.coverUrl}
            alt={item.title}
            className="max-w-xs rounded-lg shadow-lg"
          />
        </div>
      ) : onFetchCover && (
        <div className="flex justify-center mb-6">
          <div className="max-w-xs w-full bg-slate-700/30 rounded-lg p-8 flex flex-col items-center gap-4">
            <Image className="w-16 h-16 text-slate-500" />
            <p className="text-slate-400 text-sm text-center">No cover image available</p>
            <button
              onClick={onFetchCover}
              disabled={isFetchingCover}
              className="px-4 py-2 rounded transition text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--mt-highlight)', color: 'white' }}
            >
              <Image className="w-4 h-4" />
              {isFetchingCover ? 'Fetching...' : 'Fetch Cover'}
            </button>
          </div>
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
          {/* status removed here — handled via modal quick actions / badge */}
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

      {item.type === 'movie' && item.actors && item.actors.length > 0 && (
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

      {item.rating > 0 && !hideRating && (
        <div>
          <div className="text-sm font-medium text-slate-400 mb-2">Rating</div>
          <StarRating
            rating={item.rating}
            interactive={false}
            halfStarsEnabled={halfStarsEnabled}
            size="w-6 h-6"
          />
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
          <div 
            className="bg-slate-700/30 rounded-lg p-4 prose-review"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(item.review) }}
          />
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