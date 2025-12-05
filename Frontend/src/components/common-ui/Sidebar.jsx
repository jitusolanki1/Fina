import React, { useEffect, useRef, useState } from "react";
import {
  BarChart2,
  Clock,
  Cloud,
  Database,
  FileText,
  Grid,
  HelpCircle,
  Home,
  List,
  Mail,
  Plus,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Target,
  LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import avatar from "../../assets/avatar.jpeg";

/**
 * Keep UI/markup exactly as provided.
 * Fixes applied:
 * - SSR-safe checks for document/window
 * - Robust inert handling with fallback (aria-hidden + pointer-events)
 * - Prevent focus trap when closing (moves focus, waits a few frames)
 * - Cancels any pending requestAnimationFrame on cleanup
 * - Uses router navigate for login/register with window fallback
 * - Handles sync/async logout safely
 *
 * This file is plain JSX (no TypeScript) to match your request.
 */
export default function Sidebar({
  open = true,
  collapsed = false,
  onClose,
  onToggleCollapse,
}) {
  const collapsedClass = collapsed ? "collapsed" : "";
  const auth = useAuth() || {};
  const isAuthenticated = !!auth.isAuthenticated;
  const user = auth.user;

  const mobileTranslate = open
    ? "translate-x-0 md:translate-x-0"
    : "-translate-x-full md:translate-x-0";

  const asideRef = useRef(null);
  const rafRef = useRef(null);
  const [ariaHidden, setAriaHidden] = useState(!open);
  const navigate = useNavigate();

  // Defer calling onClose until next frame so router can process navigation
  // and active classes update without the sidebar being hidden immediately.
  function handleNavCloseDeferred() {
    if (!onClose) return;
    try {
      requestAnimationFrame(() => {
        try {
          onClose();
        } catch (e) {}
      });
    } catch (e) {
      // fallback
      setTimeout(() => {
        try {
          onClose();
        } catch (e) {}
      }, 0);
    }
  }

  // helper: set inert (native) or fallback (aria-hidden + pointerEvents)
  function setInertState(el, inert) {
    if (!el) return;
    try {
      // native inert support (may throw in some SSR or older browsers)
      // eslint-disable-next-line no-undef
      if (
        typeof HTMLElement !== "undefined" &&
        "inert" in HTMLElement.prototype
      ) {
        // @ts-ignore - some environments don't include inert in typings
        el.inert = !!inert;
        if (inert) el.setAttribute("inert", "");
        else el.removeAttribute("inert");
        return;
      }
    } catch (e) {
      // fall through to fallback
    }

    // fallback: make non-interactive
    if (inert) {
      el.setAttribute("aria-hidden", "true");
      el.style.pointerEvents = "none";
    } else {
      el.removeAttribute("aria-hidden");
      el.style.pointerEvents = "";
    }
  }

  useEffect(() => {
    const asideEl = asideRef.current;

    // Opening: make visible and interactive
    if (open) {
      setAriaHidden(false);
      setInertState(asideEl, false);
      return;
    }

    // Closing: ensure no focused element remains inside aside before hiding
    const active =
      typeof document !== "undefined" ? document.activeElement : null;
    const containsFocus =
      asideEl && active && asideEl.contains && asideEl.contains(active);

    const setHiddenNow = () => {
      setAriaHidden(true);
      setInertState(asideEl, true);
    };

    const moveFocusThenHide = () => {
      if (typeof document === "undefined") {
        setHiddenNow();
        return;
      }

      const fallback =
        document.getElementById("root") || (document.body && document.body);
      if (!fallback) {
        setHiddenNow();
        return;
      }

      const prevTab =
        fallback.getAttribute && fallback.getAttribute("tabindex");
      let addedTab = false;
      try {
        if (fallback.tabIndex === undefined || fallback.tabIndex < 0) {
          fallback.setAttribute("tabindex", "-1");
          addedTab = true;
        }
        fallback.focus();
      } catch (e) {
        // ignore focus errors
      }

      let attempts = 0;
      const checkAndHide = () => {
        attempts += 1;
        const nowActive = document.activeElement;
        const stillInside =
          asideEl &&
          nowActive &&
          asideEl.contains &&
          asideEl.contains(nowActive);
        if (!stillInside) {
          try {
            if (addedTab) fallback.removeAttribute("tabindex");
            else if (prevTab != null)
              fallback.setAttribute("tabindex", prevTab);
          } catch (e) {
            // ignore
          }
          setHiddenNow();
          return;
        }

        if (attempts < 6) {
          rafRef.current = requestAnimationFrame(checkAndHide);
          return;
        }

        // give up waiting: blur and hide
        try {
          if (nowActive && typeof nowActive.blur === "function")
            nowActive.blur();
        } catch (e) {
          // ignore
        }
        try {
          if (addedTab) fallback.removeAttribute("tabindex");
          else if (prevTab != null) fallback.setAttribute("tabindex", prevTab);
        } catch (e) {
          // ignore
        }
        setHiddenNow();
      };

      rafRef.current = requestAnimationFrame(checkAndHide);
    };

    if (containsFocus) {
      moveFocusThenHide();
    } else {
      setHiddenNow();
    }

    return () => {
      // cleanup any pending RAF
      if (rafRef.current != null) {
        try {
          cancelAnimationFrame(rafRef.current);
        } catch (e) {
          /* ignore */
        }
        rafRef.current = null;
      }
    };
    // only depends on `open` so eslint-disable-next-line is okay
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // router-safe navigation (falls back to window.location.href)
  function safeNavigate(to) {
    try {
      if (onClose) onClose();
      navigate(to);
    } catch (e) {
      if (typeof window !== "undefined") window.location.href = to;
    }
  }

  return (
    <aside
      ref={asideRef}
      aria-hidden={ariaHidden}
      className={`fixed top-0 left-0 h-[calc(100vh)] transform ${mobileTranslate} ${collapsedClass} transition-all z-50 sidebar`}
    >
      <div className="p-4 sidebar-scroll h-full text-slate-200 flex flex-col">
        <div className="brand">
          {/* Collapse handle (desktop) */}
          <button
            aria-label="Collapse sidebar"
            onClick={onToggleCollapse}
            className="collapse-handle hidden md:inline-flex"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          <div
            style={{
              display: "flex",
              flexDirection: "column",

              gap: 12,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
              }}
            >
              <div className="logo-circle">
                <span style={{ color: "#e6eef8", fontWeight: 700 }}>
                  <Target size={26} />
                </span>
              </div>
              <div className="text-base font-semibold">
                {" "}
                <span className="sidebar-label">Fina</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <NavLink to="/account-create" onClick={handleNavCloseDeferred}>
                <div className="quick-create">
                  <Plus size={14} />
                  <span className="sidebar-label">Quick Create</span>
                </div>
              </NavLink>
              <NavLink to="/messages" onClick={handleNavCloseDeferred}>
                <div className="mail-btn" title="Messages">
                  <Mail size={16} />
                </div>
              </NavLink>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/"
              title="Dashboard"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavCloseDeferred}
            >
              <Home className="nav-icon " />
              <span className="sidebar-label">Dashboard</span>
            </NavLink>
            <NavLink
              to="/accounts"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavCloseDeferred}
            >
              <Grid className="nav-icon" />
              <span className="sidebar-label">Accounts</span>
            </NavLink>
            <NavLink
              to="/summaries"
              title="CIW Summaries"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavCloseDeferred}
            >
              <BarChart2 className="nav-icon" />
              <span className="sidebar-label">Ciw Summary</span>
            </NavLink>
            <NavLink
              to="/projects"
              title="Projects"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavCloseDeferred}
            >
              <List className="nav-icon" size={16} />
              <span className="sidebar-label">Projects</span>
            </NavLink>
            <NavLink
              to="/team"
              title="Team"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavCloseDeferred}
            >
              <Users className="nav-icon" />
              <span className="sidebar-label">Team</span>
            </NavLink>
          </nav>

          <div className="flex flex-col gap-1 mt-2">
            <NavLink
              to="/settings"
              title="Settings"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavCloseDeferred}
            >
              <Clock className="nav-icon" />
              <span className="sidebar-label">Settings</span>
            </NavLink>

            <NavLink
              to="/documents"
              title="Documents"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavCloseDeferred}
            >
              <FileText className="nav-icon" />
              <span className="sidebar-label">Documents</span>
            </NavLink>
            <NavLink
              to="/data-library"
              title="Data Library"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavCloseDeferred}
            >
              <Database className="nav-icon" />
              <span className="sidebar-label">Data Library</span>
            </NavLink>
            <NavLink
              to="/reports"
              title="Reports"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavCloseDeferred}
            >
              <BarChart2 className="nav-icon" />
              <span className="sidebar-label">Reports</span>
            </NavLink>
            <NavLink
              to="/search"
              title="Search"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavCloseDeferred}
            >
              <Search className="nav-icon" />
              <span className="sidebar-label">Search</span>
            </NavLink>
            <NavLink
              to="/word-assistant"
              title="Word Assistant"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavCloseDeferred}
            >
              <Cloud className="nav-icon" />
              <span className="sidebar-label">Word Assistant</span>
            </NavLink>
            <NavLink
              to="/help"
              title="Help"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavCloseDeferred}
            >
              <HelpCircle className="nav-icon" />
              <span className="sidebar-label">Help</span>
            </NavLink>
          </div>
        </div>

        <div className="mt-auto">
          {!isAuthenticated ? (
            <div
              className="nav-item"
              style={{ justifyContent: "space-between" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  className="page-btn"
                  onClick={() => {
                    safeNavigate("/login");
                  }}
                >
                  Login
                </button>
                <button
                  className="page-btn"
                  onClick={() => {
                    safeNavigate("/register");
                  }}
                >
                  Register
                </button>
              </div>
            </div>
          ) : (
            <div
              className="nav-item"
              style={{ justifyContent: "space-between" }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
                className="sidebar-label"
              >
                <img src={avatar} alt="user" className="avatar" />
                <div className="sidebar-label">
                  <div className="user-name">
                    {user?.name || user?.email || "User"}
                  </div>
                  <div className="user-email">{user?.email || ""}</div>
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
                className="nav-icon"
              >
                <SignOutButton onClose={onClose} />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function SignOutButton({ onClose }) {
  const auth = useAuth() || {};
  const logout = auth.logout;
  const navigate = useNavigate();

  async function handleSignOut() {
    try {
      if (logout) {
        const res = logout();
        // support promise or sync
        if (res && typeof res.then === "function") await res;
      }
    } catch (e) {
      // ignore logout errors but continue to navigate away
    } finally {
      if (onClose) onClose();
      try {
        navigate("/login", { replace: true });
      } catch (e) {
        if (typeof window !== "undefined") window.location.href = "/login";
      }
    }
  }

  return (
    <button aria-label="Sign out" className="page-btn" onClick={handleSignOut}>
      <LogOut size={16} />
    </button>
  );
}
