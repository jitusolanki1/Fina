import React from 'react';

export default function Help(){
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Help & Support</h3>
      <div className="card-dark p-4 rounded">
        <h4 className="font-medium">FAQ</h4>
        <ul className="text-slate-300 mt-2 space-y-2">
          <li>How to create an account?</li>
          <li>How to generate CIW Summary?</li>
          <li>How to invite team members?</li>
        </ul>
        <div className="mt-4">
          <button className="control-btn">Create Support Ticket</button>
        </div>
      </div>
    </div>
  );
}
