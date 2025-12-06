import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Lazy load the tour component to reduce initial bundle size
const CrmGuide = lazy(() => import('./CrmGuide'));

/**
 * TourLauncher - Lazy-loads the guided tour only when needed
 * 
 * Benefits:
 * - Reduces initial bundle size by ~50KB (react-joyride)
 * - Loads tour code only when user needs it
 * - No performance impact on initial page load
 * 
 * Usage in App.jsx:
 *   import TourLauncher from './components/TourLauncher';
 *   <TourLauncher />
 */
export default function TourLauncher({ 
  appId = "fina-app",
  startAutomatically = true,
  delayMs = 800 
}) {
  const navigate = useNavigate();
  const [shouldLoad, setShouldLoad] = useState(false);
  const storageKey = `crm-guide:${appId}:completed`;
  const [tourCompleted, setTourCompleted] = useState(() => {
    try {
      return !!localStorage.getItem(storageKey);
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    // Auto-start tour if not completed
    if (startAutomatically && !tourCompleted) {
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, delayMs);
      return () => clearTimeout(timer);
    }

    // Always expose manual launcher for Help button
    window.__launchTour = () => {
      setShouldLoad(true);
      // Reset completion status when manually launched
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {}
      setTourCompleted(false);
    };

    return () => {
      delete window.__launchTour;
    };
  }, [appId, startAutomatically, delayMs, storageKey, tourCompleted]);

  // Don't render anything until tour should load
  if (!shouldLoad) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <CrmGuide 
        appId={appId} 
        startAutomatically={startAutomatically}
        navigate={navigate}
      />
    </Suspense>
  );
}
