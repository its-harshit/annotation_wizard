import { useEffect } from 'react';

export function useZoom(zoomLevel: number = 0.9) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setZoom = () => {
      try {
        // Method 1: CSS zoom property (Chrome, Safari, Edge)
        document.body.style.zoom = `${zoomLevel * 100}%`;
        
        // Method 2: CSS transform scale (Firefox, older browsers)
        if (!document.body.style.zoom) {
          document.body.style.transform = `scale(${zoomLevel})`;
          document.body.style.transformOrigin = 'top left';
        }
        
        // Method 3: Viewport meta tag for mobile devices
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
          viewport = document.createElement('meta');
          viewport.setAttribute('name', 'viewport');
          document.head.appendChild(viewport);
        }
        viewport.setAttribute('content', `width=device-width, initial-scale=${zoomLevel}, maximum-scale=${zoomLevel}, user-scalable=no`);
        
        // Method 4: Browser zoom API (if available)
        if ('zoom' in window) {
          (window as any).zoom(zoomLevel);
        }
        
        console.log(`Zoom set to ${zoomLevel * 100}%`);
      } catch (error) {
        console.warn('Could not set zoom level:', error);
      }
    };

    // Set zoom immediately
    setZoom();
    
    // Also set on window load to ensure it's applied
    window.addEventListener('load', setZoom);
    
    return () => {
      window.removeEventListener('load', setZoom);
    };
  }, [zoomLevel]);
} 