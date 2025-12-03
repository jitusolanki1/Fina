import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import AccountSheet from "./AccountSheet";

export default function AccountDetail({ account: initialAccount, onSaved ,onClose }) {
  const [account, setAccount] = useState(
    initialAccount || { name: "", openingBalance: 0 }
  );
  const [isNew, setIsNew] = useState(!initialAccount);

  useEffect(() => {
    setAccount(initialAccount || { name: "", openingBalance: 0 });
    setIsNew(!initialAccount);
  }, [initialAccount]);

  async function save() {
    try {
      if (isNew) {
        const r = await api.post("/accounts", account);
        toast.success("Account created");
        onSaved && onSaved(r.data);
      } else {
        await api.patch(`/accounts/${account.id}`, account);
        toast.success("Account updated");
        onSaved && onSaved(account);
      }
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    }
  }

  return (
    <div className="fixed pt-20 inset-0 z-50 flex items-start justify-center p-6">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          window.history.back();
        }}
      />
      <div className="relative card-dark rounded shadow max-w-4xl w-full p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-white">
            {isNew ? "Create Account" : `Edit ${account.name}`}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-2 py-1 bg-[#111214] border border-[var(--border)] text-gray-300 rounded"
            >
              Close
            </button>
            <button
              onClick={save}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-1 text-gray-300">Name</label>
            <input
              value={account.name}
              onChange={(e) =>
                setAccount((a) => ({ ...a, name: e.target.value }))
              }
              className="p-2 w-full rounded bg-[#0A0A0A] border border-[var(--border)] text-white"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-300">
              Opening Balance
            </label>
            <input
              type="number"
              value={account.openingBalance}
              onChange={(e) =>
                setAccount((a) => ({
                  ...a,
                  openingBalance: Number(e.target.value),
                }))
              }
              className="p-2 w-full rounded bg-[#0A0A0A] border border-[var(--border)] text-white"
            />
          </div>
        </div>

        {!isNew && (
          <div>
            <AccountSheet
              account={account}
              onClose={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
