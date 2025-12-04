import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchJson } from '../fetchClient';
import AccountSheet from '../components/account/AccountSheet';

export default function AccountPage(){
  const { id } = useParams();
  const [account, setAccount] = useState(null);

  useEffect(()=>{
    if(!id) return;
    fetchJson(`/accounts/${id}`).then(r=>setAccount(r)).catch(()=>setAccount(null));
  }, [id]);

  if(!account) return <div className="p-4 card-dark rounded shadow">Loading account...</div>;

  return (
    <div>
      <AccountSheet account={account} onClose={()=>{
        window.history.back();
      }} />
    </div>
  );
}
