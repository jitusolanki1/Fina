import React, { useState } from 'react';
import { Box } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login(){
  const [email, setEmail] = useState('m@example.com');
  const [password, setPassword] = useState('');

  function submit(e){
    e.preventDefault();
    if(!email) return toast.error('Email required');
    // demo behaviour
    toast.success('Logged in (demo)');
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-left">
          <div style={{maxWidth:420}}>
            <div className="auth-title">Welcome back</div>
            <div className="auth-sub">Login to your Acme Inc account</div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-slate-300">Email</label>
                <input className="auth-input mt-1" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-sm text-slate-300">Password</label>
                  <a className="text-sm text-slate-400" href="#">Forgot your password?</a>
                </div>
                <input type="password" className="auth-input mt-1" value={password} onChange={e=>setPassword(e.target.value)} />
              </div>

              <div>
                <button className="auth-btn" type="submit">Login</button>
              </div>

              <div className="flex items-center gap-4">
                <hr className="flex-1 border-t border-[#1f2937]" />
                <div className="text-sm text-slate-400">Or continue with</div>
                <hr className="flex-1 border-t border-[#1f2937]" />
              </div>

              <div className="social-row">
                <button type="button" className="social-btn"></button>
                <button type="button" className="social-btn">G</button>
                <button type="button" className="social-btn"></button>
              </div>

              <div className="auth-footer">Don't have an account? <a className="text-slate-200" href="#">Sign up</a></div>
            </form>

            <div style={{marginTop:18, fontSize:12, color:'#9aa4b6'}}>
              By clicking continue, you agree to our <a className="text-slate-200" href="#">Terms of Service</a> and <a className="text-slate-200" href="#">Privacy Policy</a>.
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div style={{width:'80%', height:'70%', borderRadius:12, background:'#0b0b0b', display:'flex', alignItems:'center', justifyContent:'center', color:'#151515'}}>
              <div style={{textAlign:'center', opacity:0.06}}>
              <Box size={72} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
