import { useCallback, useEffect, useState } from 'react';
import { SURF_SPOTS } from '../data/spots';
import type { SurfSpot } from '../types/surf';

const STORAGE_KEY = 'surfcast:favorites';

function loadFavorites(): SurfSpot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SURF_SPOTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SURF_SPOTS;
  } catch {
    return SURF_SPOTS;
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<SurfSpot[]>(loadFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorite = useCallback(
    (spotId: string) => favorites.some(f => f.id === spotId),
    [favorites],
  );

  const toggleFavorite = useCallback((spot: SurfSpot) => {
    setFavorites(prev =>
      prev.some(f => f.id === spot.id)
        ? prev.filter(f => f.id !== spot.id)
        : [...prev, spot],
    );
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
