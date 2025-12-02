import React, { useState } from "react";
import { X, ChevronLeft } from "lucide-react";

const DUMMY_NOTIFICATIONS = [
  {
    id: 1,
    title: "Welcome to Fina",
    message: "Thanks for joining Fina!",
    time: "2h",
  },
  {
    id: 2,
    title: "Report Ready",
    message: "Your monthly report is ready to view.",
    time: "1d",
  },
  {
    id: 3,
    title: "New Comment",
    message: "Someone commented on your document.",
    time: "3d",
  },
  {
    id: 4,
    title: "Reminder",
    message: "Don't forget the meeting at 4PM.",
    time: "1w",
  },
];

export default function NotificationDrawer({ open, onClose }) {
  const [selected, setSelected] = useState(null);

  function openNotification(n) {
    setSelected(n);
  }

  function closeDetail() {
    setSelected(null);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Drawer - dark background */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-80 bg-slate-900 text-slate-200 shadow-lg transform transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 p-3">
            {selected ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={closeDetail}
                  className="p-1 rounded hover:bg-slate-800"
                >
                  <ChevronLeft size={18} className="text-slate-200" />
                </button>
                <h3 className="text-lg font-semibold text-slate-100">
                  Notification
                </h3>
              </div>
            ) : (
              <h3 className="text-lg font-semibold text-slate-100">
                Notifications
              </h3>
            )}

            <button
              onClick={() => {
                setSelected(null);
                onClose();
              }}
              className="p-2 rounded hover:bg-slate-800"
            >
              <X size={18} className="text-slate-200" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!selected && (
              <div>
                {DUMMY_NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openNotification(n)}
                    onKeyDown={(e) => e.key === "Enter" && openNotification(n)}
                    className="mb-3 cursor-pointer rounded p-3 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-medium text-slate-100">
                        {n.title}
                      </div>
                      <div className="ml-2 text-xs text-slate-400">
                        {n.time}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-slate-300 truncate">
                      {n.message}
                    </div>
                  </div>
                ))}

                {DUMMY_NOTIFICATIONS.length === 0 && (
                  <div className="text-center text-sm text-slate-500">
                    No notifications
                  </div>
                )}
              </div>
            )}

            {selected && (
              <div className="space-y-4">
                <div className="text-sm text-slate-400">{selected.time}</div>
                <h4 className="text-lg font-semibold text-slate-100">
                  {selected.title}
                </h4>
                <div className="text-sm text-slate-300">{selected.message}</div>

                <div className="pt-4 border-t border-slate-800">
                  <button
                    onClick={() => {
                      /* placeholder for action */ alert(`${selected.title}`);
                    }}
                    className="inline-flex items-center rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-500"
                  >
                    Open
                  </button>
                  <button
                    onClick={closeDetail}
                    className="ml-2 inline-flex items-center rounded border border-slate-700 bg-transparent px-3 py-1 text-sm font-medium text-slate-200 hover:bg-slate-800"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
