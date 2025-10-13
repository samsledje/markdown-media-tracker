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
  /**
   * Handle click on a star
   * Cycles through: full rating → half rating → unrated
   */
  const handleStarClick = (starIndex) => {
    if (!interactive || !onChange) return;

    const clickedRating = starIndex + 1;
    
    if (halfStarsEnabled) {
      // Cycle: full → half → unrated
      if (rating === clickedRating) {
        // Currently at full star, go to half
        onChange(clickedRating - 0.5);
      } else if (rating === clickedRating - 0.5) {
        // Currently at half star, go to unrated
        onChange(0);
      } else {
        // Set to full star
        onChange(clickedRating);
      }
    } else {
      // Original behavior: full → unrated
      if (rating === clickedRating) {
        onChange(0);
      } else {
        onChange(clickedRating);
      }
    }
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
        
        return (
          <button
            key={i}
            onClick={() => handleStarClick(i)}
            className={`transition ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={!interactive}
            type="button"
          >
            {fillState === 'half' ? (
              <div className={`relative inline-block ${size}`}>
                {/* Background empty star */}
                <Star className={`${size} text-slate-600 absolute top-0 left-0`} />
                {/* Clipped filled half */}
                <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%', height: '100%' }}>
                  <Star className={`${size} text-yellow-400 fill-yellow-400`} />
                </div>
              </div>
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
