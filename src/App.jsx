import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import CommandPalette from "./components/CommandPalette";
import Header from "./components/common-ui/Header";
import Sidebar from "./components/common-ui/Sidebar";
import { Toaster } from "react-hot-toast";
import "./index.css";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const AccountsPage = lazy(() => import("./pages/Accounts"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const AccountList = lazy(() => import("./components/account/AccountList"));
const AccountSheet = lazy(() => import("./components/account/AccountSheet"));
const AccountForm = lazy(() => import("./components/account/AccountForm"));
const AccountDetail = lazy(() => import("./components/account/AccountDetail"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const SummariesPage = lazy(() => import("./pages/Summaries"));
const LoginPage = lazy(() => import("./components/auth/Login"));
const MailsPage = lazy(() => import("./components/campagin/Tamplates"));
const TeamPage = lazy(() => import("./pages/Team"));
const Projects = lazy(() => import("./pages/Projects"));
const Documents = lazy(() => import("./pages/Documents"));
const DataLibrary = lazy(() => import("./pages/DataLibrary"));
const Reports = lazy(() => import("./pages/Reports"));
const SearchPage = lazy(() => import("./pages/Search"));
const WordAssistant = lazy(() => import("./pages/WordAssistant"));
const HelpPage = lazy(() => import("./pages/Help"));

function AppRoutes({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  onToggleCollapse,
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMode, setPaletteMode] = useState("open");
  const lastCtrlITimeRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      // Ctrl+F -> open search page
      if (ctrl && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        navigate("/search");
        return;
      }
      if (ctrl && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteMode("open");
        setPaletteOpen((p) => !p);
        return;
      }
      if (ctrl && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        const now = Date.now();
        const last = lastCtrlITimeRef.current;
        if (now - last < 400) {
          navigate("/");
          lastCtrlITimeRef.current = 0;
          return;
        }
        lastCtrlITimeRef.current = now;
        setPaletteMode("focus");
        setPaletteOpen(true);
        return;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <>
      <CommandPalette
        open={paletteOpen}
        mode={paletteMode}
        onClose={() => setPaletteOpen(false)}
        onSelect={(a) => {
          navigate(`/account/${a.id}`);
          setPaletteOpen(false);
        }}
      />
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
        onToggleCollapse={onToggleCollapse}
      />
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <main className="fixed sidebar-scroll h-full top-0 transition-all pt-20 left-0 right-0 p-10">
        <div className={sidebarCollapsed ? "md:ml-16" : "md:ml-64"}>
          <div className=" mx-auto p-4">
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Dashboard />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/account/:id" element={<AccountPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/summaries" element={<SummariesPage />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/data-library" element={<DataLibrary />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/word-assistant" element={<WordAssistant />} />
                <Route path="/help" element={<HelpPage />} />
                {/* <Route path="/projects" element={<AccountList />} /> */}
                {/* <Route path="/account-create" element={<AccountDetail />} /> */}
                {/* <Route path="/projects" element={<AccountSheet />} /> */}
                <Route path="/account-create" element={<AccountForm />} />
                <Route path="/messages" element={<MailsPage />} />
                <Route path="/team" element={<TeamPage />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </main>
    </>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0A0A0A] text-slate-200">
        <Toaster />
        <Header
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          onToggleCollapse={() => setSidebarCollapsed((s) => !s)}
          sidebarOpen={sidebarOpen}
          collapsed={sidebarCollapsed}
        />
        <AppRoutes
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((s) => !s)}
        />
      </div>
    </BrowserRouter>
  );
}
