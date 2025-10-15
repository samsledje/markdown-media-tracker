import React from 'react';
import { Star } from 'lucide-react';

/**
 * Reusable star rating component with half-star support
 * @param {number} rating - Current rating (can be decimal like 3.5)
 * @param {function} onChange - Optional callback when rating is changed (for interactive mode)
 * @param {boolean} interactive - Whether the stars are clickable
 * @param {boolean} halfStarsEnabled - Whether to show/allow half stars
 * @param {string} size - Size class for stars (e.g., 'w-6 h-6')
 */
const StarRating = ({ 
  rating = 0, 
  onChange, 
  interactive = false, 
  halfStarsEnabled = true,
  size = 'w-8 h-8'
}) => {
  // Track hovered star index and half (left/right)
  const [hover, setHover] = React.useState(null); // { index: number, isLeftHalf: boolean } | null
  /**
   * Handle click on a star
   * Cycles through: full rating → half rating → unrated
   */
  // Enhanced: click left/right half for half/full star
  const handleStarClick = (starIndex, e) => {
    if (!interactive || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;
    const clickedRating = starIndex + 1;
    if (halfStarsEnabled) {
      // Remove rating if clicking filled section
      if (
        (rating === clickedRating && !isLeftHalf) || // full star, click anywhere
        (rating === starIndex + 0.5 && isLeftHalf)   // half star, click left
      ) {
        onChange(0);
        return;
      }
      // Otherwise, set rating
      if (isLeftHalf) {
        onChange(starIndex + 0.5);
      } else {
        onChange(clickedRating);
      }
    } else {
      if (rating === clickedRating) {
        onChange(0);
      } else {
        onChange(clickedRating);
      }
    }
  };

  // Calculate ghost fill for hover
  const getGhostFill = (starIndex) => {
    if (!hover) return 'empty';
    const { index, isLeftHalf } = hover;
    if (starIndex < index) return 'full';
    if (starIndex === index) {
      if (halfStarsEnabled && isLeftHalf) return 'half';
      if (halfStarsEnabled && !isLeftHalf) return 'full';
      return 'full';
    }
    return 'empty';
  };

  /**
   * Determine fill state for a star at given index
   * Returns: 'full', 'half', or 'empty'
   */
  const getStarFill = (starIndex) => {
    const starValue = starIndex + 1;
    if (rating >= starValue) {
      return 'full';
    } else if (halfStarsEnabled && rating >= starValue - 0.5) {
      return 'half';
    }
    return 'empty';
  };

  return (
    <div className="flex gap-2">
      {[0, 1, 2, 3, 4].map((i) => {
        const fillState = getStarFill(i);
        const ghostFill = interactive && hover ? getGhostFill(i) : null;
        return (
          <button
            key={i}
            onClick={(e) => handleStarClick(i, e)}
            className={`transition relative ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={!interactive}
            type="button"
            onMouseMove={interactive ? (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const isLeftHalf = x < rect.width / 2;
              setHover({ index: i, isLeftHalf });
            } : undefined}
            onMouseLeave={interactive ? () => setHover(null) : undefined}
          >
            {/* Ghost fill (hover preview) */}
            {ghostFill && ghostFill !== 'empty' && (
              ghostFill === 'half' ? (
                <span className={`absolute left-0 top-0 flex items-center pointer-events-none ${size}`} style={{ opacity: 0.4 }}>
                  {/* Only left half highlighted for ghost half */}
                  <Star className={`${size} text-slate-600`} style={{ position: 'absolute', left: 0, top: 0 }} />
                  <span className="absolute left-0 top-0 overflow-hidden" style={{ width: '50%', height: '100%' }}>
                    <Star className={`${size} text-yellow-400 fill-yellow-400`} />
                  </span>
                </span>
              ) : (
                <Star className={`absolute left-0 top-0 ${size} text-yellow-400 fill-yellow-400 pointer-events-none`} style={{ opacity: 0.4 }} />
              )
            )}
            {/* Actual fill */}
            {fillState === 'half' ? (
              <span className={`relative flex items-center ${size}`}> 
                {/* Background empty star */}
                <Star className={`${size} text-slate-600`} style={{ position: 'absolute', left: 0, top: 0 }} />
                {/* Clipped filled half */}
                <span className="absolute left-0 top-0 overflow-hidden" style={{ width: '50%', height: '100%' }}>
                  <Star className={`${size} text-yellow-400 fill-yellow-400`} />
                </span>
              </span>
            ) : (
              <Star
                className={`${size} ${
                  fillState === 'full'
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-600'
                }`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
