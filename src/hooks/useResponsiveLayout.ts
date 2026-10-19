import { useState, useEffect } from 'react';

export type ResponsiveLayout = 'mobile' | 'tablet' | 'desktop';

export interface UseResponsiveLayoutResult {
  layout: ResponsiveLayout;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  tabletSidebarOpen: boolean;
  setTabletSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleTabletSidebar: () => void;
}

export function useResponsiveLayout(): UseResponsiveLayoutResult {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1200;
  });

  const [tabletSidebarOpen, setTabletSidebarOpen] = useState<boolean>(true);

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize, { passive: true });
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1200;
  const isDesktop = width >= 1200;

  const layout: ResponsiveLayout = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  const toggleTabletSidebar = () => {
    setTabletSidebarOpen((prev) => !prev);
  };

  return {
    layout,
    isMobile,
    isTablet,
    isDesktop,
    width,
    tabletSidebarOpen,
    setTabletSidebarOpen,
    toggleTabletSidebar,
  };
}
