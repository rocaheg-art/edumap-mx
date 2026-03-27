import { createContext } from 'react';
import { Institucion } from '../types';

export interface FavoritesContextType {
  favorites: Institucion[];
  toggleFavorite: (institucion: Institucion) => void;
  isFavorite: (id: number) => boolean;
}

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
