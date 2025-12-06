import React from "react";
import SettingsPanel from "../components/Settings";

export default function Settings() {
  return (
    <div data-tour="settings" className="max-w-full">
      <h2 className="text-2xl font-semibold text-slate-100 mb-6">Settings</h2>
      <SettingsPanel />
    </div>
  );
}
