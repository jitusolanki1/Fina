// Sidebar.jsx
import React, { useRef, useEffect, useState } from "react";
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
  Settings,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { fetchJson } from "../../fetchClient";

export default function Sidebar({
  open = true,
  collapsed = false,
  onClose,
  onToggleCollapse,
}) {
  const auth = useAuth() || {};
  const isAuthenticated = !!auth.isAuthenticated;
  const user = auth.user || {};
  const navigate = useNavigate();
  const asideRef = useRef(null);

  const [me, setMe] = useState(user || null);

  function getInitials(name) {
    const s = String(name || "").trim();
    if (!s) return "U";
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1][0] || "")).slice(0, 2).toUpperCase();
  }

  function handleNavClose() {
    if (typeof onClose === "function") onClose();
  }

  function safeNavigate(to) {
    try {
      handleNavClose();
      navigate(to);
    } catch (e) {
      if (typeof window !== "undefined") window.location.href = to;
    }
  }

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (open) {
      body.style.overflow = "";
    } else {
      body.style.overflow = "";
    }
    return () => {
      body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchJson("/auth/me", { method: "GET" });
        if (mounted && res && res.user) setMe(res.user);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const collapsedClass = collapsed ? "collapsed" : "";
  const mobileTranslate = open
    ? "translate-x-0 md:translate-x-0"
    : "-translate-x-full md:translate-x-0";

  return (
    <aside
      ref={asideRef}
      data-tour="sidebar"
      className={`fixed left-0 transform ${mobileTranslate} ${collapsedClass} transition-all z-50 sidebar top-header h-main !-top-0 `}
      aria-hidden={!open}
    >
      <div className="p-4 sidebar-scroll h-full text-slate-200 flex flex-col ">
        <div className="brand">
          <button
            aria-label="Collapse sidebar"
            onClick={onToggleCollapse}
            className="collapse-handle hidden md:inline-flex"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
        <div className=" w-full mb-4">
          <NavLink to="/account-create" onClick={handleNavClose}>
            <div className="quick-create inline-flex items-center gap-2 px-2 py-1 rounded-md">
              <Plus size={14} />
              <span className="sidebar-label">Quick Create</span>
            </div>
          </NavLink>
        </div>

        <div>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/"
              title="Dashboard"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavClose}
            >
              <Home className="nav-icon" />
              <span className="sidebar-label">Dashboard</span>
            </NavLink>

            <NavLink
              to="/accounts"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavClose}
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
              onClick={handleNavClose}
            >
              <BarChart2 className="nav-icon" />
              <span className="sidebar-label">Ciw Summary</span>
            </NavLink>

            <NavLink
              to="/messages"
              title="Messages"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavClose}
            >
              <Mail className="nav-icon" />
              <span className="sidebar-label">Messages</span>
            </NavLink>

            <NavLink
              to="/projects"
              title="Projects"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavClose}
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
              onClick={handleNavClose}
            >
              <Users className="nav-icon" />
              <span className="sidebar-label">Team</span>
            </NavLink>
          </nav>

          <div className="flex flex-col gap-1 mt-2">
            <NavLink
              to="/documents"
              title="Documents"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavClose}
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
              onClick={handleNavClose}
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
              onClick={handleNavClose}
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
              onClick={handleNavClose}
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
              onClick={handleNavClose}
            >
              <Cloud className="nav-icon" />
              <span className="sidebar-label">Word Assistant</span>
            </NavLink>

            <NavLink
              to="/settings"
              title="Settings"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavClose}
            >
              <Settings className="nav-icon" />
              <span className="sidebar-label">Settings</span>
            </NavLink>

            <NavLink
              to="/help"
              title="Help"
              className={({ isActive }) =>
                isActive ? "nav-item active" : "nav-item"
              }
              onClick={handleNavClose}
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
              <div className="flex items-center gap-2">
                <button
                  className="page-btn"
                  onClick={() => safeNavigate("/login")}
                >
                  Login
                </button>
                <button
                  className="page-btn"
                  onClick={() => safeNavigate("/register")}
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
              <div className="flex items-center gap-1 sidebar-label">
                <button
                  onClick={() => safeNavigate("/profile")}
                  className="flex items-center gap-1  rounded "
                >
                  {me?.github && (me.github.avatarUrl || me.github.username) ? (
                    <img
                      src={
                        me.github.avatarUrl ||
                        `https://github.com/${me.github.username}.png?size=80`
                      }
                      alt="user"
                      className="avatar"
                    />
                  ) : (
                    <div className="avatar bg-[#0F1724] flex items-center justify-center text-sm font-semibold text-slate-100">
                      {getInitials(user?.name || user?.email || "U")}
                    </div>
                  )}
                  <div className="sidebar-label text-left">
                    <div className="user-name font-semibold text-sm">
                      {user?.name || user?.user || "User"}
                    </div>
                    <div className="user-email text-xs opacity-70">
                      {user?.email || ""}
                    </div>
                  </div>
                </button>
              </div>
              <div className="nav-icon flex items-center gap-2">
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
        if (res && typeof res.then === "function") await res;
      }
    } catch (e) {
      // ignore
    } finally {
      if (typeof onClose === "function") onClose();
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
