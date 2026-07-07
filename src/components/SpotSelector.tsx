import { Search } from 'lucide-react';
import type { SurfSpot } from '../types/surf';

interface Props {
  spots: SurfSpot[];
  selected: SurfSpot;
  onSelect: (spot: SurfSpot) => void;
  onSearchClick: () => void;
  searchActive: boolean;
}

export function SpotSelector({ spots, selected, onSelect, onSearchClick, searchActive }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {spots.map(spot => (
        <button
          key={spot.id}
          onClick={() => onSelect(spot)}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left min-h-[52px] active:scale-95 ${
            selected.id === spot.id && !searchActive
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
              : 'bg-white text-gray-600 border border-gray-200 shadow-sm active:bg-gray-50'
          }`}
        >
          <span className="block text-xs opacity-60 mb-0.5">{spot.location}</span>
          {spot.name}
        </button>
      ))}
      <button
        onClick={onSearchClick}
        aria-label="Chercher un spot"
        className={`flex-shrink-0 w-[52px] min-h-[52px] rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 ${
          searchActive
            ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
            : 'bg-white text-gray-500 border border-gray-200 shadow-sm active:bg-gray-50'
        }`}
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  );
}
