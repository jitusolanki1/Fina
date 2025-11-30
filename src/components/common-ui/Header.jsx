import React, { useState } from "react";
import { Menu, X, Sun, Moon, ChevronLeft, ChevronRight, Bell, Search } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header({
  onToggleSidebar,
  onToggleCollapse,
  sidebarOpen,
  collapsed,
}) {
  const [isDarkMode, setIsDarkMode] = useState(true);
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
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              aria-label="Toggle navigation"
              className="p-2 rounded-md hover:bg-slate-800/40 md:hidden"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="text-lg font-semibold">Fina</div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/search" className="p-2 rounded hover:bg-slate-800/40" title="Search">
              <Search size={16} />
            </Link>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded hover:bg-slate-800/40"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="hidden sm:block text-sm text-slate-300">
             <Bell size={16} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
