import React, { useCallback } from 'react';
import { Star, Layers, BookOpen, CheckCircle, PlayCircle, XCircle } from 'lucide-react';
import { STATUS_LABELS, STATUS_ICONS } from "../../constants";

const FilterModal = ({
    // Filter state
    showFilters,
    filterRating,
    filterTags,
    filterStatuses,
    filterRecent,
    allTags,
    allStatuses,
    // Filter handlers
    setFilterRating,
    setFilterRecent,
    toggleTagFilter,
    toggleStatusFilter,
    clearFilters,
}) => {

    // Filter handlers
    const handleSetFilterRating = useCallback((rating) => {
        setFilterRating(rating);
    }, [setFilterRating]);

    const handleSetFilterRecent = useCallback((value) => {
        setFilterRecent(value);
    }, [setFilterRecent]);

    // Get the appropriate icon component for a status
    const getStatusIcon = (status) => {
        const iconName = STATUS_ICONS[status];
        const iconProps = { className: "w-4 h-4" };

        switch (iconName) {
            case 'layers':
                return <Layers {...iconProps} />;
            case 'book-open':
                return <BookOpen {...iconProps} />;
            case 'check-circle':
                return <CheckCircle {...iconProps} />;
            case 'play-circle':
                return <PlayCircle {...iconProps} />;
            case 'x-circle':
                return <XCircle {...iconProps} />;
            default:
                return <Layers {...iconProps} />;
        }
    };

    return (
        <>
            {/* Expanded Filters */}
            {showFilters && (
                <div data-filter-modal="1" data-testid="filter-modal" className="mb-6 p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Status Filter */}
                        <div>
                            <div className="text-sm text-slate-300 mb-2">Status</div>
                            <div className="flex flex-wrap gap-2">
                                {allStatuses.length === 0 ? (
                                    <div className="text-sm text-slate-400">No status data available</div>
                                ) : (
                                    allStatuses.map(status => (
                                        <button
                                            key={status}
                                            onClick={() => toggleStatusFilter(status)}
                                            className={`px-3 py-1 rounded-lg text-sm transition flex items-center gap-2 ${filterStatuses.includes(status) ? '' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                                }`}
                                            style={filterStatuses.includes(status) ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                                        >
                                            {getStatusIcon(status)}
                                            {STATUS_LABELS[status]}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Rating Filter */}
                        <div>
                            <div className="text-sm text-slate-300 mb-2">Minimum rating</div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setFilterRating(0)}
                                    className={`px-3 py-1 rounded-lg ${filterRating === 0 ? '' : 'bg-slate-700/50'}`}
                                    style={filterRating === 0 ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                                >
                                    Any
                                </button>
                                {[1, 2, 3, 4, 5].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => handleSetFilterRating(r)}
                                        className={`px-2 py-1 rounded-lg ${filterRating === r ? '' : 'bg-slate-700/50'}`}
                                        style={filterRating === r ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                                        title={`Minimum ${r} star${r > 1 ? 's' : ''}`}
                                    >
                                        <Star className={`w-4 h-4 ${r <= (filterRating || 0) ? 'text-yellow-400' : 'text-slate-600'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recent Filter */}
                        <div>
                            <div className="text-sm text-slate-300 mb-2">Recently read / watched</div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { value: 'any', label: 'Any' },
                                    { value: 'last7', label: 'Last 7 days' },
                                    { value: 'last30', label: 'Last 30 days' },
                                    { value: 'last90', label: 'Last 90 days' }
                                ].map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSetFilterRecent(option.value)}
                                        className={`px-3 py-1 rounded-lg text-sm ${filterRecent === option.value ? '' : 'bg-slate-700/50'}`}
                                        style={filterRecent === option.value ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags Filter */}
                        <div>
                            <div className="text-sm text-slate-300 mb-2">Tags</div>
                            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                {allTags.length === 0 ? (
                                    <div className="text-sm text-slate-400">No tags available</div>
                                ) : (
                                    allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTagFilter(tag)}
                                            className={`px-3 py-1 rounded-full text-sm transition ${filterTags.includes(tag) ? '' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                                }`}
                                            style={filterTags.includes(tag) ? { backgroundColor: 'var(--mt-highlight)', color: 'white' } : {}}
                                        >
                                            {tag}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex justify-end mt-4 pt-4 border-t border-slate-700">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-sm font-medium"
                            title="Clear all filters"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default FilterModal;
