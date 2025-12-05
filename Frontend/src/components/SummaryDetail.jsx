import React, { useState } from "react";
import { ArrowLeft, GripVertical } from "lucide-react";
import AccountSheet from "./account/AccountSheet";
import { fetchJson } from "../fetchClient";

function NumberCell({ v, className = "" }) {
  return (
    <td className={`p-3 text-right tabular-nums font-medium ${className}`}>
      {Number(v || 0).toLocaleString()}
    </td>
  );
}

function SummaryDetail({ summary, aggregate, onBack }) {
  const perAccount = aggregate
    ? aggregate.perAccount
    : summary?.perAccount || [];
  const overall = aggregate ? aggregate.overall : summary?.overall || {};

  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);
  const [expandedAccount, setExpandedAccount] = useState(null);

  async function openAccountHistory(accountId, accountName, openingBefore) {
    const range = summary?.date || null;
    try {
      if (accountId) {
        const acct = (await fetchJson(`/accounts/${accountId}`)) || {
          id: accountId,
          name: accountName,
          openingBalance: openingBefore,
        };
        setSelectedAccount(acct);
        setSelectedRange(range);
      } else {
        setSelectedAccount({
          id: accountId,
          name: accountName,
          openingBalance: openingBefore,
        });
        setSelectedRange(range);
      }
    } catch (err) {
      setSelectedAccount({
        id: accountId,
        name: accountName,
        openingBalance: openingBefore,
      });
      setSelectedRange(range);
    }
  }

  return (
    <div className="card-dark rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-slate-400">
            {summary ? `Summary for` : "Aggregated Summary"}
          </div>
          <div className="text-2xl font-semibold text-slate-100">
            {summary?.date || (aggregate ? "Custom Range" : "")}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded border card-dark">
          <div className="text-xs text-slate-400">Opening Total</div>
          <div className="text-xl font-semibold text-slate-100">
            {Number(overall.openingTotal || 0).toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded border card-dark">
          <div className="text-xs text-slate-400">Deposit</div>
          <div className="text-xl font-semibold text-slate-100">
            {Number(overall.deposit || 0).toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded border card-dark">
          <div className="text-xs text-slate-400">UpLine Deposit</div>
          <div className="text-xl font-semibold text-slate-100">
            {Number(overall.upLineDeposit || 0).toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded border card-dark">
          <div className="text-xs text-slate-400">Withdrawals</div>
          <div className="text-xl font-semibold text-slate-100">
            {Number(
              (overall.otherWithdrawal || 0) + (overall.penalWithdrawal || 0) + (overall.upLineWithdrawal || 0)
            ).toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded border card-dark">
          <div className="text-xs text-slate-400">UpLine Withdrawal</div>
          <div className="text-xl font-semibold text-slate-100">
            {Number(overall.upLineWithdrawal || 0).toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded border card-dark">
          <div className="text-xs text-slate-400">Closing Total</div>
          <div className="text-xl font-semibold text-slate-100">
            {Number(overall.closingTotal || 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div
        className="overflow-auto rounded border"
        style={{ borderColor: "#1f2937" }}
      >
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
              <th className="p-3" style={{ width: 48 }}></th>
              <th className="p-3 text-left">Account</th>
              <th className="p-3 text-right">Opening</th>
              <th className="p-3 text-right">Deposit</th>
              <th className="p-3 text-right">Other Dep</th>
                <th className="p-3 text-right">UpLine Dep</th>
              <th className="p-3 text-right">Penal W</th>
              <th className="p-3 text-right">Other W</th>
                <th className="p-3 text-right">UpLine W</th>
              <th className="p-3 text-right">Net</th>
              <th className="p-3 text-right">Next Opening</th>
            </tr>
          </thead>
          <tbody>
            {perAccount.map((a, idx) => (
              <>
              <tr
                key={a.accountId}
                className={`${
                  idx % 2 === 0 ? "" : "bg-[#07070733]"
                } hover:bg-[#111216]`}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="md:hidden text-sm px-2 py-1 rounded bg-transparent hover:bg-zinc-800"
                      onClick={() => setExpandedAccount(expandedAccount === a.accountId ? null : a.accountId)}
                      aria-expanded={expandedAccount === a.accountId}
                      title={expandedAccount === a.accountId ? 'Hide details' : 'Show details'}
                    >
                      {expandedAccount === a.accountId ? '▾' : '▸'}
                    </button>
                    <span className="drag-handle">
                      <GripVertical size={16} />
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <button
                    onClick={() =>
                      openAccountHistory(
                        a.accountId,
                        a.accountName,
                        a.openingBefore
                      )
                    }
                    className="text-left w-full text-slate-100 hover:underline"
                  >
                    {a.accountName}
                  </button>
                </td>
                <NumberCell v={a.openingBefore} />
                <NumberCell v={a.deposit} />
                <NumberCell v={a.otherDeposit} className="hidden md:table-cell" />
                <NumberCell v={a.upLineDeposit} className="hidden md:table-cell" />
                <NumberCell v={a.penalWithdrawal} className="hidden md:table-cell" />
                <NumberCell v={a.otherWithdrawal} className="hidden md:table-cell" />
                <NumberCell v={a.upLineWithdrawal} className="hidden md:table-cell" />
                <NumberCell v={a.net} />
                <NumberCell v={a.openingAfter} />
              </tr>
              {expandedAccount === a.accountId && (
                <tr className="md:hidden bg-[#070705]">
                  <td colSpan={11} className="p-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-neutral-400 text-xs">Opening</div>
                      <div className="text-right">{Number(a.openingBefore || 0).toLocaleString()}</div>
                      <div className="text-neutral-400 text-xs">Deposit</div>
                      <div className="text-right">{Number(a.deposit || 0).toLocaleString()}</div>
                      <div className="text-neutral-400 text-xs">Other Deposit</div>
                      <div className="text-right">{Number(a.otherDeposit || 0).toLocaleString()}</div>
                      <div className="text-neutral-400 text-xs">UpLine Deposit</div>
                      <div className="text-right">{Number(a.upLineDeposit || 0).toLocaleString()}</div>
                      <div className="text-neutral-400 text-xs">Penal Withdrawal</div>
                      <div className="text-right">{Number(a.penalWithdrawal || 0).toLocaleString()}</div>
                      <div className="text-neutral-400 text-xs">Other Withdrawal</div>
                      <div className="text-right">{Number(a.otherWithdrawal || 0).toLocaleString()}</div>
                      <div className="text-neutral-400 text-xs">UpLine Withdrawal</div>
                      <div className="text-right">{Number(a.upLineWithdrawal || 0).toLocaleString()}</div>
                      <div className="text-neutral-400 text-xs">Net</div>
                      <div className="text-right">{Number(a.net || 0).toLocaleString()}</div>
                      <div className="text-neutral-400 text-xs">Next Opening</div>
                      <div className="text-right">{Number(a.openingAfter || 0).toLocaleString()}</div>
                    </div>
                  </td>
                </tr>
              )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      {selectedAccount && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setSelectedAccount(null);
              setSelectedRange(null);
            }}
          />
          <div className="relative max-w-4xl w-full max-h-[calc(100vh-160px)] overflow-auto">
            <AccountSheet
              account={selectedAccount}
              onClose={() => {
                setSelectedAccount(null);
                setSelectedRange(null);
              }}
              historyRange={selectedRange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(SummaryDetail);
