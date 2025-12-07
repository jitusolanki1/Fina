import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "fina-sheets";

export default function AccountsPage() {
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

  function handleOpen(sheet) {
    setEditingSheet(sheet);
    setEditorOpen(true);
  }

  function handleDelete(id) {
    if (!confirm("Delete this sheet?")) return;
    const remaining = sheets.filter((s) => s.id !== id);
    persist(remaining);
  }

  const templates = [
    {
      id: "blank",
      name: "Blank Account",
      img: "http://upload.wikimedia.org/wikipedia/commons/9/9e/Plus_symbol.svg",
    },
    {
      id: "todo",
      name: "To-do list",
      img: "https://ssl.gstatic.com/docs/templates/thumbnails/1hnNKC7DneWh2V1nkeegN2D9AiqOH0bkJAqMgF-6nz74_400_5.png",
    },
    {
      id: "annual",
      name: "Annual budget",
      img: "https://ssl.gstatic.com/docs/templates/thumbnails/1xeSCG6bBUie8mdnMm0L4OKvSf5PUsYNDgLAyODAbRqo_400.png",
    },
    {
      id: "monthly",
      name: "Monthly budget",
      img: "https://ssl.gstatic.com/docs/templates/thumbnails/1hv3m7XwWEVyhoIxXcBL-z1V_xPo3ogZJQtDWQBcLyjI_400_3.png",
    },
    {
      id: "finance",
      name: "Google Finance",
      img: "https://ssl.gstatic.com/docs/templates/thumbnails/1zeFfPrv0RtfZPhY1GuK5Un6W4Ok9hwfc0KnHWyB_G7g_400_3.png",
    },
    {
      id: "calendar",
      name: "Annual Calendar",
      img: "https://ssl.gstatic.com/docs/templates/thumbnails/1-6P8bWFKKgO_reWKv-hWqh_RW2JdU7Rd9TStWfsfGgE_400_2.png",
    },
  ];

  const handleTemplateClick = (templateId) => {
    switch (templateId) {
      case "blank":
        navigate("/account/blank/new");
        break;
      case "todo":
        navigate("/account/todo/new");
        break;
      case "annual":
        navigate("/account/budget-annual/new");
        break;
      case "monthly":
        navigate("/account/budget-monthly/new");
        break;
      case "finance":
        navigate("/account/google-finance/new");
        break;
      case "calendar":
        navigate("/account/calendar-annual/new");
        break;

      default:
        alert(
          "Feature coming soon! In the meantime, create a blank Account and customize it to your needs."
        );
    }
  };

  return (
    <div data-tour="accounts" className="space-y-6 settings-card">
      {/* Template gallery */}
      <div className="p-6 rounded ">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Start a new Account
          </h3>
        </div>

        <div className="grid grid-cols-6 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="flex flex-col items-start gap-2">
              <div
                className="w-full h-28 border rounded bg-white flex items-center justify-center bg-slate-200"
                style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.04) inset" }}
                onClick={() => handleTemplateClick(t.id)}
              >
                {t.img ? (
                  <img
                    src={t.img}
                    alt={t.name}
                    className="max-h-full max-w-full object-cover cursor-pointer "
                  />
                ) : (
                  <div className="text-sm text-slate-600">{t.name}</div>
                )}
              </div>
              <div className="w-full flex items-center justify-between">
                <div className="text-md text-slate-200">{t.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Accounts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Accounts</h3>
          <div className="text-sm text-slate-200">Owned by anyone</div>
        </div>

        {sheets.length === 0 ? (
          <div
            className="rounded border p-12 text-center"
            style={{ borderColor: "#e6eef8" }}
          >
            <div className="text-xl font-semibold text-slate-200">
              No Accounts yet
            </div>
            <div className="text-sm text-slate-200 mt-2">
              Select a blank Account or choose another template above to get
              started
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {sheets.map((s) => (
              <div key={s.id} className="card p-4 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">{s.name}</div>
                    <div className="text-xs text-slate-200">
                      {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-1 bg-transparent text-slate-200 rounded"
                      onClick={() => handleOpen(s)}
                    >
                      Open
                    </button>
                    <button
                      className="px-2 py-1 bg-red-600 text-white rounded"
                      onClick={() => handleDelete(s.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
