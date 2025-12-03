import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AccountList from "../components/account/AccountList";
import AccountDetail from "../components/account/AccountDetail";

export default function AccountsPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailAccount, setDetailAccount] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <AccountList
        onOpen={(a) => {
          navigate(`/account/${a.id}`);
        }}
      />

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
