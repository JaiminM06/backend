import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Upload, Loader2, ArrowRight, Image as ImageIcon } from "lucide-react";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("username", username);
    formData.append("password", password);
    if (avatarFile) formData.append("avatar", avatarFile);
    if (coverFile) formData.append("coverImage", coverFile);

    try {
      await axios.post(`\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Redirect to home/login
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="bg-white shadow-xl rounded-2xl w-full max-w-lg overflow-hidden border border-slate-100">

        {/* Header Section */}
        <div className="bg-brand-600 px-8 py-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-600 to-indigo-700 opacity-90 z-0"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
            <p className="text-brand-100 text-sm">Join MyTube today</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Personal Info Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all placeholder:text-slate-400 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700 ml-1">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">@</span>
                  <input
                    type="text"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all placeholder:text-slate-400 text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all placeholder:text-slate-400 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none transition-all placeholder:text-slate-400 text-sm"
                  required
                />
              </div>
            </div>

            {/* File Uploads */}
            <div className="pt-2 grid grid-cols-2 gap-4">
              <div className="relative group cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  id="avatar-upload"
                  onChange={(e) => setAvatarFile(e.target.files[0])}
                  className="hidden"
                />
                <label htmlFor="avatar-upload" className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-brand-400 hover:bg-brand-50 transition-all cursor-pointer h-full">
                  <Upload size={20} className="text-slate-400 group-hover:text-brand-500 mb-2" />
                  <span className="text-xs text-slate-600 font-medium text-center">{avatarFile ? avatarFile.name : "Upload Avatar"}</span>
                </label>
              </div>
              <div className="relative group cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  id="cover-upload"
                  onChange={(e) => setCoverFile(e.target.files[0])}
                  className="hidden"
                />
                <label htmlFor="cover-upload" className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-brand-400 hover:bg-brand-50 transition-all cursor-pointer h-full">
                  <ImageIcon size={20} className="text-slate-400 group-hover:text-brand-500 mb-2" />
                  <span className="text-xs text-slate-600 font-medium text-center">{coverFile ? coverFile.name : "Upload Cover"}</span>
                </label>
              </div>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition duration-200 shadow-lg shadow-brand-600/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Register <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/Login" className="text-brand-600 hover:text-brand-700 font-semibold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
