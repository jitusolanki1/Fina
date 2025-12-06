import React, { useEffect, useMemo, useState } from "react";
import Joyride, { STATUS } from "react-joyride";
import { useNavigate } from "react-router-dom";

/**
 * CrmGuide.jsx
 * - Plain JSX (no TypeScript)
 * - Usage: <CrmGuide appId="my-crm" />
 * - Put near app root so it can see targets anywhere in the DOM.
 */

// Route mapping for tour steps
const stepRoutes = {
  dashboard: "/",
  accounts: "/accounts",
  summaries: "/summaries",
  search: "/search",
};

// Focused 6-step tour (high-value actions only)
const defaultSteps = [
  {
    id: "welcome",
    target: "body",
    content: (
      <div style={{ maxWidth: 340 }}>
        <h3 style={{ margin: 0, color: '#111827', fontWeight: 600 }}>Welcome to Fina 💰</h3>
        <p style={{ marginTop: 10, marginBottom: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.5 }}>
          Quick tour of essential features. <strong>Takes 30 seconds.</strong>
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    id: "dashboard",
    target: "[data-tour=dashboard]",
    content: (
      <div style={{ maxWidth: 300 }}>
        <h4 style={{ margin: 0, marginBottom: 8, color: '#111827', fontWeight: 600 }}>Dashboard</h4>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.4 }}>
          <strong>View balances</strong> and trends here. Click any account to see details.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    id: "accounts",
    target: "[data-tour=accounts]",
    content: (
      <div style={{ maxWidth: 300 }}>
        <h4 style={{ margin: 0, marginBottom: 8, color: '#111827', fontWeight: 600 }}>Accounts</h4>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.4 }}>
          <strong>Create accounts</strong> and track transactions. Click "Quick Create" to add one.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    id: "summaries",
    target: "[data-tour=summaries]",
    content: (
      <div style={{ maxWidth: 300 }}>
        <h4 style={{ margin: 0, marginBottom: 8, color: '#111827', fontWeight: 600 }}>Summaries</h4>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.4 }}>
          <strong>Generate daily summaries</strong> and export to Excel. One-click automation.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    id: "search",
    target: "[data-tour=search]",
    content: (
      <div style={{ maxWidth: 300 }}>
        <h4 style={{ margin: 0, marginBottom: 8, color: '#111827', fontWeight: 600 }}>Search</h4>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.4 }}>
          <strong>Find transactions</strong> fast. Press <kbd style={{ padding: '2px 6px', background: '#f3f4f6', borderRadius: 4, fontSize: 12 }}>Ctrl+F</kbd> anytime.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    id: "end",
    target: "body",
    content: (
      <div style={{ maxWidth: 340 }}>
        <h3 style={{ margin: 0, color: '#111827', fontWeight: 600 }}>You're Ready! 🎉</h3>
        <p style={{ marginTop: 10, marginBottom: 0, fontSize: 14, color: '#4b5563', lineHeight: 1.5 }}>
          Click <strong>Help (🆘)</strong> in the header to replay anytime.
        </p>
      </div>
    ),
    placement: "center",
  },
];

function ensureTargetExists(selector, timeout = 4000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const poll = () => {
      if (document.querySelector(selector)) return resolve(true);
      if (Date.now() - start > timeout) return resolve(false);
      requestAnimationFrame(poll);
    };
    poll();
  });
}

export default function CrmGuide({
  appId = "fina-app",
  steps = defaultSteps,
  startAutomatically = true,
  storageKey,
  navigate,
}) {
  const key = storageKey || `crm-guide:${appId}:completed`;
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(() => {
    try {
      return !!localStorage.getItem(key);
    } catch (e) {
      return false;
    }
  });

  // Auto-start if not completed
  useEffect(() => {
    if (!completed && startAutomatically) {
      const t = setTimeout(() => setRun(true), 400); // allow DOM to mount
      return () => clearTimeout(t);
    }
  }, [completed, startAutomatically]);

  const joyrideSteps = useMemo(() => steps, [steps]);

  // Analytics helper
  function trackTourEvent(eventName, data = {}) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, { tour_id: appId, ...data });
    }
    // Console log for debugging
    console.log(`[Tour] ${eventName}`, data);
  }

  // Controlled callback with fixed navigation
  function onJoyrideCallback(data) {
    const { status, index, action, type, lifecycle } = data;

    // Track events (only once per action)
    if (lifecycle === 'init') {
      if (action === 'start') trackTourEvent('tour_started', { step_count: joyrideSteps.length });
    }
    if (lifecycle === 'complete') {
      if (action === 'next') trackTourEvent('tour_step_next', { step_index: index });
      if (action === 'prev') trackTourEvent('tour_step_prev', { step_index: index });
    }
    if (action === 'skip') trackTourEvent('tour_skipped', { step_index: index });
    if (status === STATUS.FINISHED) trackTourEvent('tour_completed');

    // Update step index when lifecycle completes (fixes Next/Prev buttons)
    if (lifecycle === 'complete' && typeof index === "number") {
      if (action === 'next') {
        setStepIndex(index + 1);
      } else if (action === 'prev') {
        setStepIndex(index - 1);
      }
    }

    // Handle status changes
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      try {
        localStorage.setItem(key, "1");
      } catch (e) {
        // ignore storage failures
      }
      setCompleted(true);
      setRun(false);
      return;
    }

    // Verify next target exists before advancing (only for 'next' action)
    if (action === 'next' && type === 'step:after' && index < joyrideSteps.length - 1) {
      const nextIndex = index + 1;
      const nextStep = joyrideSteps[nextIndex];
      
      if (nextStep && nextStep.target && typeof nextStep.target === "string" && nextStep.target !== "body") {
        const targetExists = document.querySelector(nextStep.target);
        
        if (!targetExists) {
          // Try to navigate to the correct page
          const stepId = nextStep.id;
          const targetRoute = stepRoutes[stepId];
          
          if (navigate && targetRoute) {
            // Pause tour and navigate
            setRun(false);
            trackTourEvent('tour_navigating', { step_id: stepId, route: targetRoute });
            
            navigate(targetRoute);
            
            // Wait for navigation and target to appear
            setTimeout(() => {
              ensureTargetExists(nextStep.target, 2000).then((found) => {
                if (found) {
                  setStepIndex(nextIndex);
                  setRun(true);
                } else {
                  // Skip this step if still not found
                  setStepIndex(nextIndex + 1);
                  setRun(true);
                }
              });
            }, 500);
          } else {
            // No navigation available, wait for target
            setRun(false);
            trackTourEvent('tour_waiting_for_target', { target: nextStep.target });
            
            ensureTargetExists(nextStep.target, 3000).then((found) => {
              if (found) {
                setStepIndex(nextIndex);
                setRun(true);
              } else {
                // Skip to next available or finish
                const availableIndex = joyrideSteps.findIndex((s, i) => {
                  return i > nextIndex && (s.target === "body" || !!document.querySelector(s.target));
                });
                
                if (availableIndex !== -1) {
                  setStepIndex(availableIndex);
                  setRun(true);
                } else {
                  // No more valid targets - finish tour
                  try {
                    localStorage.setItem(key, "1");
                  } catch (e) {}
                  setCompleted(true);
                  setRun(false);
                }
              }
            });
          }
        }
      }
    }
  }

  // Expose window hook for programmatic control
  useEffect(() => {
    window.__crmGuide = {
      open: () => {
        setRun(true);
        setStepIndex(0);
      },
      restart: () => {
        try {
          localStorage.removeItem(key);
        } catch (e) {}
        setCompleted(false);
        setRun(true);
        setStepIndex(0);
      },
    };

    return () => {
      try {
        delete window.__crmGuide;
      } catch (e) {}
    };
  }, [key]);

  return (
    <>
      <Joyride
        steps={joyrideSteps}
        run={run}
        stepIndex={stepIndex}
        continuous={true}
        scrollToFirstStep={true}
        showSkipButton={true}
        showProgress={true}
        spotlightClicks={false}
        disableOverlayClose={true}
        disableCloseOnEsc={false}
        hideCloseButton={false}
        spotlightPadding={10}
        styles={{
          options: {
            zIndex: 10000,
            arrowColor: "#ffffff",
            backgroundColor: "#ffffff",
            primaryColor: "#10b981",
            textColor: "#111827",
            borderRadius: 12,
          },
          tooltip: {
            borderRadius: 12,
            padding: 20,
          },
          tooltipContent: {
            padding: '8px 0',
          },
          buttonNext: {
            backgroundColor: "#10b981",
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 600,
          },
          buttonBack: {
            color: "#6b7280",
            marginRight: 8,
          },
          buttonSkip: {
            color: "#9ca3af",
          },
          spotlight: {
            borderRadius: 8,
          },
        }}
        locale={{
          back: "Back",
          close: "Close",
          last: "Done",
          next: "Next",
          skip: "Skip tour",
        }}
        callback={onJoyrideCallback}
      />

      {/* assistive aria-live region for screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        style={{
          position: "absolute",
          left: -9999,
          top: "auto",
          width: 1,
          height: 1,
          overflow: "hidden",
        }}
      >
        {run && `Tour step ${stepIndex + 1} of ${joyrideSteps.length}`}
      </div>
    </>
  );
}
