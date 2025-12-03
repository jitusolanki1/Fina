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
import React from "react";
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

  const mobileTranslate = open
    ? "translate-x-0 md:translate-x-0"
    : "-translate-x-full md:translate-x-0";
  return (
    <aside
      aria-hidden={!open}
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
          <div className="nav-item" style={{ justifyContent: "space-between" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: 10 }}
              className="sidebar-label"
            >
              <img src={avatar} alt="user" className="avatar" />
              <div className="sidebar-label">
                <div className="user-name">Fina</div>
                <div className="user-email">Fina@support.com</div>
              </div>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: 8 }}
              className="nav-icon"
            >
              <SignOutButton onClose={onClose} />
            </div>
          </div>
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
