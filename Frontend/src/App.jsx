import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { useAuth } from "./auth/AuthProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import CommandPalette from "./components/CommandPalette";
import ProtectedRoute from "./auth/ProtectedRoute";
import Header from "./components/common-ui/Header";
import Sidebar from "./components/common-ui/Sidebar";
import { useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import TourLauncher from "./components/TourLauncher";
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
const RegisterPage = lazy(() => import("./components/auth/Register"));
const MailsPage = lazy(() => import("./components/campagin/Tamplates"));
const TeamPage = lazy(() => import("./pages/Team"));
const ProfilePage = lazy(() => import("./pages/Profile"));
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
  const location = useLocation();
  const authPaths = ["/login", "/register"];
  const isAuthRoute = authPaths.includes(location.pathname);
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
          navigate("/dashboard");
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

  const routesElement = (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <AccountsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account/:id"
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/summaries"
          element={
            <ProtectedRoute>
              <SummariesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/data-library"
          element={
            <ProtectedRoute>
              <DataLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/word-assistant"
          element={
            <ProtectedRoute>
              <WordAssistant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpPage />
            </ProtectedRoute>
          }
        />
        {/* <Route path="/projects" element={<AccountList />} /> */}
        {/* <Route path="/account-create" element={<AccountDetail />} /> */}
        {/* <Route path="/projects" element={<AccountSheet />} /> */}
        <Route
          path="/account-create"
          element={
            <ProtectedRoute>
              <AccountForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <TeamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <div className="text-center text-slate-400">
              404 - Page Not Found
            </div>
          }
        />
      </Routes>
    </Suspense>
  );

  if (isAuthRoute) {
    return <main>{routesElement}</main>;
  }

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
      {/* Only show tour on authenticated routes */}
      {!isAuthRoute && <TourLauncher appId="fina-app" startAutomatically={true} delayMs={800} />}
      <main className="transition-all pt-20 pb-4 px-8 w-full">
        <div className="mx-auto">{routesElement}</div>
      </main>
    </>
  );
}

function HeaderWrapper(props) {
  const location = useLocation();
  const authPaths = [ "/login", "/register"];
  if (authPaths.includes(location.pathname)) return null;
  return <Header {...props} />;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebarCollapsed") === "1";
    } catch (e) {
      return false;
    }
  });
  const { initialized } = useAuth() || {};

  // Ensure hooks are called in the same order across renders by creating
  // the QueryClient ref before any early returns that depend on auth state.
  const queryClientRef = React.useRef();
  if (!queryClientRef.current) queryClientRef.current = new QueryClient();
  // Prevent body scrolling so only the app's main pane scrolls
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // If the auth provider hasn't finished its initial check, show a loader to avoid route flashes
  if (initialized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-slate-200">
        <div className="text-sm text-slate-300">Loading…</div>
      </div>
    );
  }
  return (
    <QueryClientProvider client={queryClientRef.current}>
      <BrowserRouter>
        <div className="h-screen bg-[#0A0A0A] text-slate-200 flex flex-row overflow-hidden">
          <Sidebar
            open={sidebarOpen}
            collapsed={sidebarCollapsed}
            onClose={() => setSidebarOpen(false)}
            onToggleCollapse={() => {
              setSidebarCollapsed((s) => {
                const next = !s;
                try {
                  localStorage.setItem("sidebarCollapsed", next ? "1" : "0");
                } catch (e) {}
                return next;
              });
            }}
          />
          <div className="flex-1 min-h-screen flex flex-col">
            <Toaster />
            <HeaderWrapper
              onToggleSidebar={() => setSidebarOpen((s) => !s)}
              onToggleCollapse={() => {
                setSidebarCollapsed((s) => {
                  const next = !s;
                  try {
                    localStorage.setItem("sidebarCollapsed", next ? "1" : "0");
                  } catch (e) {}
                  return next;
                });
              }}
              sidebarOpen={sidebarOpen}
              collapsed={sidebarCollapsed}
            />
            <div
              className={`flex-1 overflow-y-auto touch-scroll overscroll-contain h-main`}
            >
              <AppRoutes
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                sidebarCollapsed={sidebarCollapsed}
                onToggleCollapse={() => {
                  setSidebarCollapsed((s) => {
                    const next = !s;
                    try {
                      localStorage.setItem("sidebarCollapsed", next ? "1" : "0");
                    } catch (e) {}
                    return next;
                  });
                }}
              />
            </div>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
