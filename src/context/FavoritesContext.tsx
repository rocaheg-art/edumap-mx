import React, { useState, useEffect } from 'react';
import { Institucion } from '../types';
import { FavoritesContext } from './FavoritesContextType';

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Institucion[]>(() => {
    const saved = localStorage.getItem('edumap_favorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading favorites:', e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('edumap_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (inst: Institucion) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.id_institucion === inst.id_institucion);
      if (exists) {
        return prev.filter(f => f.id_institucion !== inst.id_institucion);
      }
      return [...prev, inst];
    });
  };

  const isFavorite = (id: number) => {
    return favorites.some(f => f.id_institucion === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};
