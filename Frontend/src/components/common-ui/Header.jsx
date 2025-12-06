import React, { useState } from "react";
import { Menu, X, Bell, Search, HelpCircle, Target } from "lucide-react";
import NotificationDrawer from "./NotificationDrawer";
import { Link } from "react-router-dom";

export default function Header({
  onToggleSidebar,
  onToggleCollapse,
  sidebarOpen,
  collapsed,
}) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-40"
      style={{ background: "#0A0A0A", borderBottom: "1px solid #1f2937" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          <div className="flex items-center gap-3 pl-4 md:pl-12 ">
            <button
              onClick={onToggleSidebar}
              aria-label="Toggle navigation"
              className="p-2 rounded-md hover:bg-slate-800/40 md:hidden"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="text-base font-semibold">
              <span className="sidebar-label">Fina</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/search"
              className="p-2 rounded hover:bg-slate-800/40"
              title="Search"
            >
              <Search size={16} />
            </Link>
            <button
              onClick={() => {
                // Support lazy-loaded tour (TourLauncher)
                if (window.__launchTour) {
                  window.__launchTour();
                }
                // Fallback to direct tour (if loaded)
                if (window.__crmGuide) {
                  window.__crmGuide.restart();
                }
              }}
              className="p-2 rounded hover:bg-slate-800/40"
              title="Show Tour"
              aria-label="Show guided tour"
            >
              <HelpCircle size={16} />
            </button>
            <div className="hidden sm:block text-sm text-slate-300">
              <button
                onClick={() => setNotifOpen(true)}
                className="relative p-2 rounded hover:bg-slate-800/40"
                aria-label="Open notifications"
              >
                <Bell size={16} />
                <span className="absolute -top-0.5 -right-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 text-white text-[10px]">
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <NotificationDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </header>
  );
}
