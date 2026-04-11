import { useState, useEffect } from 'react'

export const useDeviceDetect = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
      const mobile = Boolean(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i));
      
      // Fallback para tables o simulación de devtools
      const hasTouch = navigator.maxTouchPoints > 0 || ('ontouchstart' in window);
      
      setIsMobile(mobile || (hasTouch && window.innerWidth <= 1024));
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkDevice();

    // Añadir listener para re-evaluar si cambias la vista
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, [])

  return { isMobile, isLandscape }
}
