import { useState, useEffect } from 'react';

export function useVirtualKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const vv = window.visualViewport;

    const handleViewportChange = () => {
      const windowHeight = window.innerHeight;
      const currentHeight = vv.height;
      const diff = windowHeight - currentHeight;

      // Virtual keyboard open detection (diff > 100px)
      if (diff > 100) {
        setKeyboardHeight(diff);
        setIsKeyboardOpen(true);
        document.documentElement.style.setProperty('--keyboard-inset', `${diff}px`);
      } else {
        setKeyboardHeight(0);
        setIsKeyboardOpen(false);
        document.documentElement.style.setProperty('--keyboard-inset', '0px');
      }
    };

    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  return { keyboardHeight, isKeyboardOpen };
}
