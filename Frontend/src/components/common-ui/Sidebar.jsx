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
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import avatar from "../../assets/avatar.jpeg";

export default function Sidebar({
  open = true,
  collapsed = false,
  onClose,
  onToggleCollapse,
}) {
  const collapsedClass = collapsed ? "collapsed" : "";
    const { isAuthenticated, user } = useAuth() || {};

  const mobileTranslate = open
    ? "translate-x-0 md:translate-x-0"
    : "-translate-x-full md:translate-x-0";
  
  const asideRef = useRef(null);
  // Use a local ariaHidden flag so we can move focus off the sidebar
  // before actually setting aria-hidden (avoids hiding a focused element).
  const [ariaHidden, setAriaHidden] = useState(false);

  useEffect(() => {
    const asideEl = asideRef.current;
    if (open) {
      // opening: make visible to AT and remove inert
      setAriaHidden(false);
      if (asideEl) {
        try {
          asideEl.inert = false;
          asideEl.removeAttribute("inert");
        } catch (e) {}
      }
      return;
    }

    // closing: ensure no focused element is inside the aside before hiding
    const active = typeof document !== "undefined" ? document.activeElement : null;
    const containsFocus = asideEl && active && asideEl.contains(active);

    const setHiddenNow = () => {
      setAriaHidden(true);
      if (asideEl) {
        try {
          asideEl.inert = true;
          asideEl.setAttribute("inert", "");
        } catch (e) {}
      }
    };

    // Helper moves focus to a safe target then hides the aside.
    const moveFocusThenHide = () => {
      const fallback = (typeof document !== "undefined" && document.getElementById("root")) || (typeof document !== "undefined" && document.body);
      if (!fallback) return setHiddenNow();

      const prevTab = fallback.getAttribute && fallback.getAttribute("tabindex");
      let addedTab = false;
      try {
        if (fallback.tabIndex === undefined || fallback.tabIndex < 0) {
          fallback.setAttribute("tabindex", "-1");
          addedTab = true;
        }
        // Request focus synchronously; browsers may update document.activeElement on the next frame
        fallback.focus();
      } catch (e) {}

      // Check for up to a few frames whether focus moved off the aside; otherwise blur and proceed.
      const checkAndHide = (attempt = 0) => {
        const nowActive = document.activeElement;
        const stillInside = asideEl && nowActive && asideEl.contains(nowActive);
        if (!stillInside) {
          try {
            if (addedTab) fallback.removeAttribute("tabindex");
            else if (prevTab != null) fallback.setAttribute("tabindex", prevTab);
          } catch (e) {}
          setHiddenNow();
          return;
        }

        if (attempt < 5) {
          // wait a few frames for focus to settle
          requestAnimationFrame(() => checkAndHide(attempt + 1));
          return;
        }

        // give up waiting: blur the active element then hide
        try {
          nowActive && typeof nowActive.blur === "function" && nowActive.blur();
        } catch (e) {}
        try {
          if (addedTab) fallback.removeAttribute("tabindex");
          else if (prevTab != null) fallback.setAttribute("tabindex", prevTab);
        } catch (e) {}
        setHiddenNow();
      };

      requestAnimationFrame(() => checkAndHide(0));
    };

    if (containsFocus) {
      moveFocusThenHide();
    } else {
      setHiddenNow();
    }
  }, [open]);
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
              <NavLink to="/account-create" onClick={onClose}>
                <div className="quick-create">
                  <Plus size={14} />
                  <span className="sidebar-label">Quick Create</span>
                </div>
              </NavLink>
              <NavLink to="/messages" onClick={onClose}>
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
              onClick={onClose}
            >
              <Home className="nav-icon " />
              <span className="sidebar-label">Dashboard</span>
            </NavLink>
            <NavLink
              to="/accounts"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={onClose}
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
              onClick={onClose}
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
              onClick={onClose}
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
              onClick={onClose}
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
              onClick={onClose}
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
              onClick={onClose}
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
              onClick={onClose}
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
              onClick={onClose}
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
              onClick={onClose}
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
              onClick={onClose}
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
              onClick={onClose}
            >
              <HelpCircle className="nav-icon" />
              <span className="sidebar-label">Help</span>
            </NavLink>
          </div>
        </div>

        <div className="mt-auto">
          {!isAuthenticated ? (
            <div className="nav-item" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  className="page-btn"
                  onClick={() => {
                    onClose && onClose();
                    window.location.href = "/login";
                  }}
                >
                  Login
                </button>
                <button
                  className="page-btn"
                  onClick={() => {
                    onClose && onClose();
                    window.location.href = "/register";
                  }}
                >
                  Register
                </button>
              </div>
            </div>
          ) : (
            <div className="nav-item" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="sidebar-label">
                <img src={avatar} alt="user" className="avatar" />
                <div className="sidebar-label">
                  <div className="user-name">{user?.name || user?.email || 'User'}</div>
                  <div className="user-email">{user?.email || ''}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }} className="nav-icon">
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
  const { logout } = useAuth() || {};
  const navigate = useNavigate();

  function handleSignOut() {
    try {
      logout && logout();
    } catch (e) {}
    onClose && onClose();
    navigate("/login", { replace: true });
  }

  return (
    <button aria-label="Sign out" className="page-btn" onClick={handleSignOut}>
      <LogOut size={16} />
    </button>
  );
}
