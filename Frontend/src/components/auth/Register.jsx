import React, { useState } from 'react';
import { Box } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

export default function Register(){
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  async function submit(e){
    e.preventDefault();
    if(!email) return toast.error('Email required');
    if(!name) return toast.error('Name required');
    if(!password) return toast.error('Password required');
    if(password !== confirm) return toast.error('Passwords do not match');
    const res = await register(email, password, name);
    if(res?.ok){
      toast.success('Registered successfully');
      navigate('/');
    } else {
      toast.error('Registration failed');
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-left">
          <div style={{maxWidth:420}}>
            <div className="auth-title">Create account</div>
            <div className="auth-sub">Sign up for a new account</div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-slate-300">Name</label>
                <input className="auth-input mt-1" value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-slate-300">Email</label>
                <input className="auth-input mt-1" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>

              <div>
                <label className="text-sm text-slate-300">Password</label>
                <input type="password" className="auth-input mt-1" value={password} onChange={e=>setPassword(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-slate-300">Confirm password</label>
                <input type="password" className="auth-input mt-1" value={confirm} onChange={e=>setConfirm(e.target.value)} />
              </div>

              <div>
                <button className="auth-btn" type="submit">Create account</button>
              </div>

              <div className="auth-footer">Already have an account? <a className="text-slate-200" href="/login">Sign in</a></div>
            </form>

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
