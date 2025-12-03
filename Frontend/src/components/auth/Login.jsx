import React, { useState } from "react";
import { Apple, Chrome, Facebook, Box } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthProvider";
import { useNavigate, useLocation, Link } from "react-router-dom";
import LoadingButton from "../common-ui/LoadingButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email) return toast.error("Email required");

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res?.ok) {
        toast.success("Logged in");
        const dest = location.state?.from?.pathname || "/";
        navigate(dest, { replace: true });
      } else {
        toast.error(res?.error || "Login failed");
      }
    } catch (err) {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black opacity-70"></div>

      {/* LEFT CORNER GRID ANIMATION */}
      <div className="animated-grid"></div>

      {/* Floating light orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
          <div className="w-full p-10 flex flex-col justify-center items-center">
            <h1 className="text-3xl font-semibold">Welcome back</h1>
            <p className="text-slate-400 mt-1">Login to your account</p>

            <form onSubmit={submit} className="mt-8 space-y-6 w-full">
              {/* Email */}
              <div>
                <label className="text-sm text-slate-300">Email</label>
                <input
                  className="w-full mt-1 p-3 rounded-md text-white
                  bg-black/40 border border-white/10 
                  focus:border-purple-500 focus:ring-purple-500 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm text-slate-300">Password</label>
                <input
                  type="password"
                  className="w-full mt-1 p-3 rounded-md text-white
                  bg-black/40 border border-white/10 
                  focus:border-purple-500 focus:ring-purple-500 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                <Link
                  className="text-sm text-slate-400 hover:text-purple-300 mt-1 inline-block"
                  to="#"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Submit */}
              <LoadingButton
                type="submit"
                loading={loading}
                className="w-full py-3 rounded-md bg-purple-600 hover:bg-purple-700 transition shadow-lg hover:shadow-purple-700/40 font-medium text-white"
              >
                {loading ? 'Signing in...' : 'Login'}
              </LoadingButton>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <hr className="flex-1 border-slate-700" />
                <span className="text-slate-400">Or continue with</span>
                <hr className="flex-1 border-slate-700" />
              </div>

              {/* Social Buttons */}
              <div className="flex gap-4 justify-center">
                <button type="button" className="social-btn">
                  <Apple size={22} />
                </button>
                <button type="button" className="social-btn">
                  <Chrome size={22} />
                </button>
                <button type="button" className="social-btn">
                  <Facebook size={22} />
                </button>
              </div>

              {/* Footer */}
              <div className="text-sm text-center text-slate-400">
                Don't have an account?{" "}
                <Link
                  className="text-purple-300 hover:text-purple-200"
                  to="/register"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
