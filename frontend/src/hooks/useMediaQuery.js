import { useState, useEffect } from 'react';

export function useMediaQuery(query) {
  const getMatch = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Centralised, reusable breakpoint logic for the dashboard sidebar.
 *
 * Breakpoints (per spec):
 *   Desktop (>=1200px) : expanded, width 260px
 *   Laptop  (992-1199) : expanded, width 220px
 *   Tablet  (769-991)  : collapsed (icons only), width 80px
 *   Mobile  (<=768)     : hidden by default, slide-out drawer (280px)
 */
export function useResponsiveSidebar() {
  const isDesktop = useMediaQuery('(min-width: 1200px)');
  const isLaptop = useMediaQuery('(min-width: 992px) and (max-width: 1199px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 991px)');
  const isMobile = useMediaQuery('(max-width: 768px)');

  let sidebarWidth = 0;
  let collapsed = false;

  if (isDesktop) {
    sidebarWidth = 260;
  } else if (isLaptop) {
    sidebarWidth = 220;
  } else if (isTablet) {
    sidebarWidth = 80;
    collapsed = true;
  } else if (isMobile) {
    sidebarWidth = 0;
  }

  return { isDesktop, isLaptop, isTablet, isMobile, sidebarWidth, collapsed };
}