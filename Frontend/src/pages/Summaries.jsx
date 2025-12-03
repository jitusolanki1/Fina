import React, { useEffect, useState } from "react";
import { Eye, Filter } from "lucide-react";
import {
  fetchSummaries,
  generateDailySummary,
  fetchSummariesBetween,
  dateDaysAgo,
  aggregateSummaries,
  previewSummaryRange,
  createSummaryRange,
  undoSummary,
} from "../utils/summaries";
import { sendSummaryViaFormspree } from "../utils/sendSummaryForm";
import toast from "react-hot-toast";
import SummaryDetail from "../components/SummaryDetail";
import api from "../api";

export default function Summaries() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [aggregate, setAggregate] = useState(null);

  const [showAddSection, setShowAddSection] = useState(false);
  const [newSection, setNewSection] = useState({ title: "", target: "" });

  // Preview States
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewStart, setPreviewStart] = useState(dateDaysAgo(0));
  const [previewEnd, setPreviewEnd] = useState(dateDaysAgo(0));
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const s = await fetchSummaries();
      setSummaries(s);
    } finally {
      setLoading(false);
    }
  }

  async function createDaily() {
    try {
      const target = dateDaysAgo(1);
      await toast.promise(generateDailySummary(target), {
        loading: `Creating summary for ${target}`,
        success: "Summary created",
        error: "Failed to create summary",
      });
      setTimeout(load, 800);
    } catch (err) {
      console.error(err);
      toast.error("Could not create");
    }
  }

  // ⭐ FIXED — transactions now counted properly
  async function computePreview(start, end) {
    try {
      setPreviewData(null);
      const data = await previewSummaryRange(start, end);
      setPreviewData({ ...data, date: `${start} → ${end}` });
    } catch (err) {
      console.error(err);
      toast.error("Could not compute preview");
    }
  }

  async function openAggregated(days) {
    const end = dateDaysAgo(0);
    const start = dateDaysAgo(days - 1);

    const list = await fetchSummariesBetween(start, end);
    const agg = aggregateSummaries(list);

    setAggregate(agg);
    setSelected({
      date: `${start} → ${end}`,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="space-y-4">
      {/* HEADER BAR */}
      <div className="table-card">
        <div className="table-header-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="chips">
              <div className="chip flex">
                Filter
                <span className="ml-2 text-xs bg-[#0f1724] px-2 py-0.5 rounded">
                  <Filter size={12} />
                </span>
              </div>

              <div className="chip">
                This Week{" "}
                <span className="ml-2 text-xs bg-[#0f1724] px-2 py-0.5 rounded">
                  3
                </span>
              </div>

              <div className="chip">
                This Month{" "}
                <span className="ml-2 text-xs bg-[#0f1724] px-2 py-0.5 rounded">
                  2
                </span>
              </div>

              <div className="chip">
                This year{" "}
                <span className="ml-2 text-xs bg-[#0f1724] px-2 py-0.5 rounded">
                  30
                </span>
              </div>
            </div>
          </div>

          <div className="controls">
            <button className="control-btn">Customize Columns ▾</button>
            <button
              onClick={() => setShowAddSection(true)}
              className="control-btn"
            >
              + Add Section
            </button>

            <button onClick={createDaily} className="control-btn">
              Create Daily Summary
            </button>

            <button
              onClick={async () => {
                const target = dateDaysAgo(0);
                try {
                  const saved = await toast.promise(
                    createSummaryRange(target, target),
                    {
                      loading: `Creating summary for ${target}`,
                      success: "Summary created",
                      error: "Failed to create",
                    }
                  );

                  try {
                    await toast.promise(
                      sendSummaryViaFormspree(
                        saved,
                        "https://formspree.io/f/mdkqzwqg"
                      ),
                      {
                        loading: "Sending summary...",
                        success: "Summary sent",
                        error: "Failed to send",
                      }
                    );
                  } catch (err) {
                    console.error("send failed", err);
                    toast.error("Could not send summary");
                  }

                  setTimeout(load, 800);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="control-btn"
            >
              Create Today's Summary
            </button>

            <button
              onClick={async () => {
                const start = dateDaysAgo(2);
                const end = dateDaysAgo(1);
                try {
                  const saved = await toast.promise(
                    createSummaryRange(start, end),
                    {
                      loading: `Creating summary ${start} → ${end}`,
                      success: "Summary created",
                      error: "Failed",
                    }
                  );

                  try {
                    await toast.promise(
                      sendSummaryViaFormspree(
                        saved,
                        "https://formspree.io/f/mdkqzwqg"
                      ),
                      {
                        loading: "Sending summary...",
                        success: "Summary sent",
                        error: "Failed to send",
                      }
                    );
                  } catch (err) {
                    console.error("send failed", err);
                    toast.error("Could not send summary");
                  }

                  setTimeout(load, 800);
                } catch (err) {
                  console.error(err);
                }
              }}
              className="control-btn"
            >
              Create 2-Day Summary
            </button>

            <button
              onClick={() => {
                setPreviewStart(dateDaysAgo(0));
                setPreviewEnd(dateDaysAgo(0));
                setPreviewData(null);
                setPreviewOpen(true);
              }}
              className="control-btn"
            >
              Preview Summary
            </button>
          </div>
        </div>

        {loading && <div>Loading...</div>}

        {!loading && summaries.length === 0 && (
          <div className="p-4 card-dark rounded">No summaries yet.</div>
        )}

        {/* TABLE */}
        <div className="table-wrap">
          <table className="min-w-full text-sm table-fixed table-dark">
            <thead
              className="sticky top-0"
              style={{
                background: "#0A0A0A",
                color: "#e6eef8",
                borderBottom: "1px solid #1f2937",
              }}
            >
              <tr>
                <th className="p-3" style={{ width: 48 }}>
                  <input type="checkbox" className="row-checkbox" />
                </th>
                <th className="p-3" style={{ width: 28 }}></th>
                <th className="p-3 text-left">Header</th>
                <th className="p-3">Section Type</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Opening</th>
                <th className="p-3 text-right">Closing</th>
                <th className="p-3">Reviewer</th>
                <th className="p-3"></th>
              </tr>
            </thead>

            <tbody>
              {summaries.map((s, idx) => {
                const status =
                  idx % 3 === 0
                    ? "In Process"
                    : idx % 3 === 1
                    ? "Done"
                    : "In Review";

                const statusColor = status === "Done" ? "#16a34a" : "#f59e0b";

                return (
                  <tr
                    key={s.id || s.date}
                    className={`border-t ${
                      idx % 2 === 0 ? "" : "bg-[#07070733]"
                    } hover:bg-[#111216]`}
                  >
                    <td className="p-3">
                      <input type="checkbox" className="row-checkbox" />
                    </td>

                    <td className="p-3">
                      <span className="drag-handle">⋮⋮</span>
                    </td>

                    <td className="p-3 text-left">
                      <div className="font-medium text-slate-100">{s.date}</div>
                      <div className="text-xs text-slate-400">
                        Created:{" "}
                        {s.createdAt
                          ? new Date(s.createdAt).toLocaleString()
                          : "-"}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="pill">Narrative</span>
                    </td>

                    <td className="p-3">
                      <span className="status-badge">
                        <span
                          className="status-dot"
                          style={{ background: statusColor }}
                        ></span>
                        {status}
                      </span>
                    </td>

                    <td className="p-3 text-right tabular-nums">
                      {Number(s.overall?.openingTotal || 0).toLocaleString()}
                    </td>

                    <td className="p-3 text-right tabular-nums">
                      {Number(s.overall?.closingTotal || 0).toLocaleString()}
                    </td>

                    <td className="p-3">
                      <button className="control-btn">Assign reviewer ▾</button>
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setSelected(s)}
                          title="View"
                          className="control-btn"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={async () => {
                            if (!s.id)
                              return toast.error("Cannot undo local summary");

                            try {
                              await toast.promise(undoSummary(s.id), {
                                loading: "Reverting summary...",
                                success: "Summary reverted",
                                error: "Failed to revert",
                              });
                              setTimeout(load, 800);
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="control-btn"
                          title="Undo summary"
                        >
                          Undo
                        </button>

                        <button className="page-btn">⋯</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="table-footer">
          <div>0 of {summaries.length} row(s) selected.</div>
          <div className="pager">
            <div>Rows per page</div>
            <select className="control-btn" value={10} onChange={() => {}}>
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <div className="page-btn">⟪</div>
            <div className="page-btn">⟨</div>
            <div className="page-btn">1 of 1</div>
            <div className="page-btn">⟩</div>
            <div className="page-btn">⟫</div>
          </div>
        </div>
      </div>

      {/* Summary Detail Modal */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setSelected(null);
              setAggregate(null);
            }}
          />
          <div className="relative max-w-5xl w-full">
            <SummaryDetail
              summary={selected}
              aggregate={aggregate}
              onBack={() => {
                setSelected(null);
                setAggregate(null);
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setPreviewOpen(false)}
          />

          <div className="relative card-dark rounded shadow max-w-4xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">
                Preview Summary
              </h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Start
                </label>
                <input
                  value={previewStart}
                  onChange={(e) => setPreviewStart(e.target.value)}
                  className="p-2 w-full rounded bg-[#0A0A0A] border border-[var(--border)] text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">End</label>
                <input
                  value={previewEnd}
                  onChange={(e) => setPreviewEnd(e.target.value)}
                  className="p-2 w-full rounded bg-[#0A0A0A] border border-[var(--border)] text-white"
                />
              </div>

              <div className="flex items-end justify-end">
                <button
                  onClick={() => computePreview(previewStart, previewEnd)}
                  className="px-3 py-2 bg-blue-600 text-white rounded"
                >
                  Compute Preview
                </button>
              </div>
            </div>

            {previewData ? (
              <>
                {typeof previewData.txCount === "number" && (
                  <div className="text-xs text-slate-400 mb-3">
                    Matched transactions: {previewData.txCount}
                  </div>
                )}

                {previewData && previewData.txCount === 0 && (
                  <div className="p-3 mb-3 rounded border bg-[#071018] text-sm text-slate-400">
                    <div>No transactions matched the preview range.</div>
                    {previewData.txQuery && (
                      <div className="mt-2">
                        Raw API query:{" "}
                        <code className="text-xs">{previewData.txQuery}</code>
                        <button
                          className="ml-2 px-2 py-1 text-xs bg-slate-700 rounded"
                          onClick={() =>
                            window.open(
                              `http://localhost:3001${previewData.txQuery}`,
                              "_blank"
                            )
                          }
                        >
                          Open API
                        </button>
                      </div>
                    )}
                    {previewData.txSample &&
                      previewData.txSample.length > 0 && (
                        <div className="mt-2 text-xs">
                          Sample fetched IDs:{" "}
                          {previewData.txSample.map((t) => t.id).join(", ")}
                        </div>
                      )}
                  </div>
                )}
                <SummaryDetail summary={previewData} />

                <div className="flex gap-2 justify-end mt-4">
                  <button
                    onClick={() => setPreviewOpen(false)}
                    className="control-btn"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={async () => {
                      if (!previewData || !previewData.txCount) {
                        return toast.error(
                          "No transactions matched — compute preview first."
                        );
                      }
                      try {
                        const saved = await toast.promise(
                          createSummaryRange(previewStart, previewEnd),
                          {
                            loading: "Creating summary...",
                            success: "Summary created",
                            error: "Failed",
                          }
                        );

                        try {
                          await toast.promise(
                            sendSummaryViaFormspree(
                              saved,
                              "https://formspree.io/f/mdkqzwqg"
                            ),
                            {
                              loading: "Sending summary...",
                              success: "Summary sent",
                              error: "Failed to send",
                            }
                          );
                        } catch (err) {
                          console.error("send failed", err);
                          toast.error("Could not send summary");
                        }

                        setPreviewOpen(false);
                        setTimeout(load, 800);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className={`px-3 py-2 text-white rounded ${
                      previewData && previewData.txCount
                        ? "bg-green-600"
                        : "bg-gray-700 cursor-not-allowed"
                    }`}
                    disabled={!previewData || !previewData.txCount}
                  >
                    Commit Summary
                  </button>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-400">
                No preview computed yet for {previewStart} → {previewEnd}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
