import React from 'react';

export default function WordAssistant(){
  return (
    <div className="space-y-4">
      <div className="table-card">
        <div className="table-header-bar">
          <h3 className="text-lg font-semibold">Word Assistant</h3>
          <div className="controls">
            <button className="control-btn">New Prompt</button>
          </div>
        </div>
        <div className="card-dark p-4 rounded">
          <p className="text-slate-300">AI text helper placeholder — integrate your AI provider here.</p>
          <textarea className="auth-input mt-3" rows={6} placeholder="Enter text or prompt..." />
          <div className="mt-3 flex gap-2">
            <button className="primary-btn">Improve</button>
            <button className="control-btn">Rewrite</button>
            <button className="control-btn">Translate</button>
          </div>
        </div>
      </div>
    </div>
  );
}
