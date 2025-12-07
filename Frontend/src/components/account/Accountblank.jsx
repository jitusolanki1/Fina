import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountList from "./AccountList";
import AccountDetail from "./AccountDetail";

const STORAGE_KEY = "fina-sheets";
export default function Accountblank() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAccount, setDetailAccount] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSheets(JSON.parse(raw));
    } catch (err) {
      console.error("Could not load sheets", err);
    }
  }, []);

  function persist(next) {
    setSheets(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error(err);
    }
  }

  function handleNew(template = null) {
    setEditingSheet(
      template ? { data: template.data, name: template.name } : null
    );
    setEditorOpen(true);
  }

  function handleOpen(sheet) {
    setEditingSheet(sheet);
    setEditorOpen(true);
  }

  function handleDelete(id) {
    if (!confirm("Delete this sheet?")) return;
    const remaining = sheets.filter((s) => s.id !== id);
    persist(remaining);
  }

  function handleSave(payload) {
    const id = editingSheet?.id || `sheet_${Date.now()}`;
    const item = {
      id,
      name: payload.name,
      data: payload.data,
      createdAt: payload.createdAt || new Date().toISOString(),
    };
    const existing = sheets.filter((s) => s.id !== id);
    const next = [item, ...existing];
    persist(next);
    setEditorOpen(false);
    setEditingSheet(item);
  }

  return (
    <div className="space-y-6 settings-card">
      {/* Keep account list below (original content) */}
      <div>
        <AccountList
          onOpen={(a) => {
            navigate(`/account/${a.id}`);
          }}
        />
      </div>

      {editorOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center p-6">
          <div className="w-full max-w-6xl">
            <ExcelSheet
              initialData={editingSheet?.data}
              sheetName={editingSheet?.name}
              onClose={() => setEditorOpen(false)}
              onSave={handleSave}
            />
          </div>
        </div>
      )}

      {detailOpen && (
        <AccountDetail
          account={detailAccount}
          onClose={() => setDetailOpen(false)}
          onSaved={(acc) => {
            setDetailOpen(false);
          }}
        />
      )}
    </div>
  );
}
