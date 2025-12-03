import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import { dateDaysAgo, generateDailySummary } from '../utils/summaries';
import toast from 'react-hot-toast';

export default function Settings(){
  const storedOffset = localStorage.getItem('Fina.timezoneOffset') || String(-new Date().getTimezoneOffset()/60);
  const storedCutoff = localStorage.getItem('Fina.cutoffHour') || '0';
  const [offset, setOffset] = useState(storedOffset);
  const [cutoff, setCutoff] = useState(storedCutoff);

  useEffect(()=>{
    localStorage.setItem('Fina.timezoneOffset', offset);
    localStorage.setItem('Fina.cutoffHour', cutoff);
  }, [offset, cutoff]);

  async function createNow(){
    try{
      const target = dateDaysAgo(1, Number(offset));
      toast.promise(generateDailySummary(target), {
        loading: `Generating summary for ${target}`,
        success: 'Summary created',
        error: 'Failed'
      });
    }catch(err){ console.error(err); toast.error('Could not generate'); }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-100 mb-4">Settings</h2>
      <div className="settings-panel">
        <aside className="settings-nav">
          <div className="mb-4 text-slate-200 font-semibold">Settings</div>
          {[
            'Notifications','Navigation','Home','Appearance','Messages & media','Language & region','Accessibility','Mark as read','Audio & video','Connected accounts','Privacy & visibility','Advanced'
          ].map((name)=> (
            <div key={name} className={`nav-link ${name==='Messages & media' ? 'active' : ''}`}>
              <SettingsIcon size={16} className="min-w-[16px]" />
              <span>{name}</span>
            </div>
          ))}
        </aside>

        <section className="settings-content">
          <div className="settings-breadcrumb">Settings &gt; <strong>Messages & media</strong></div>
          <div className="settings-right-scroll">
            <div className="settings-card mb-6">
              <div style={{height:80, borderRadius:12, background:'#0b0b0b'}}></div>
            </div>

            <div className="settings-card">
              <div style={{height:280, borderRadius:12, background:'#0b0b0b'}}></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
