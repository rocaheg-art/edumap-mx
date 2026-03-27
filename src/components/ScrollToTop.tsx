import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset window scroll (for body-level scrolling if any)
    window.scrollTo(0, 0);

    // Reset main container scroll (the primary layout scrollable)
    const main = document.querySelector('main');
    if (main) {
      main.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
    }
  }, [pathname]);

  return null;
}
