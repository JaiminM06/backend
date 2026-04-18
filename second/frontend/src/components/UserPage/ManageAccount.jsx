import { useState } from "react";
import axios from "axios";
import { Upload, User, Image, Lock, ArrowLeft, Save, Loader2, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ManageAccount() {
    const [activeTab, setActiveTab] = useState("details");
    const [password, setPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [details, setDetails] = useState({ fullName: "", email: "" });
    const [avatar, setAvatar] = useState(null);
    const [cover, setCover] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const navigate = useNavigate();

    // 🔒 Change Password
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        let err = {};
        if (!password) err.password = "Current password is required";
        if (!newPassword) err.newPassword = "New password is required";
        if (newPassword && newPassword.length < 6) err.newPassword = "Password must be at least 6 characters";
        if (!confirmPassword) err.confirmPassword = "Please confirm new password";
        if (newPassword && confirmPassword && newPassword !== confirmPassword)
            err.confirmPassword = "Passwords do not match";

        setErrors(err);
        if (Object.keys(err).length > 0) return;

        try {
            setLoading(true);
            const res = await axios.post(
                `\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/change-password`,
                { oldPassword: password, newPassword },
                { withCredentials: true }
            );
            setMessage({ type: "success", text: res.data.message || "Password updated successfully!" });
            setPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Incorrect old password." });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        }
    };

    // 🧾 Update Account Details
    const handleDetailsUpdate = async (e) => {
        e.preventDefault();
        let err = {};
        if (!details.fullName) err.fullName = "Full name is required";
        if (!details.email) err.email = "Email is required";

        setErrors(err);
        if (Object.keys(err).length > 0) return;

        try {
            setLoading(true);
            const res = await axios.patch(
                `\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/update-account`,
                details,
                { withCredentials: true }
            );
            setMessage({ type: "success", text: res.data.message || "Account details updated!" });
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to update details." });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        }
    };

    // 🧍 Update Avatar
    const handleAvatarUpload = async (e) => {
        e.preventDefault();
        if (!avatar) {
            setMessage({ type: "error", text: "Please select an image first." });
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("avatar", avatar);

            const res = await axios.patch(
                `\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/avatar`,
                formData,
                { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
            );
            setMessage({ type: "success", text: res.data.message || "Avatar updated!" });
            setAvatar(null);
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to upload avatar." });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        }
    };

    // 🖼️ Update Cover Image
    const handleCoverUpload = async (e) => {
        e.preventDefault();
        if (!cover) {
            setMessage({ type: "error", text: "Please select a cover image first." });
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("coverImage", cover);

            const res = await axios.patch(
                `\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/users/cover-Image`,
                formData,
                { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
            );
            setMessage({ type: "success", text: res.data.message || "Cover image updated!" });
            setCover(null);
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to upload cover." });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        }
    };

    const tabs = [
        { id: "details", label: "Profile Details", icon: User },
        { id: "password", label: "Security", icon: Key },
        { id: "avatar", label: "Avatar", icon: Upload },
        { id: "cover", label: "Cover Image", icon: Image },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => navigate("/Home/user")}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium"
                >
                    <ArrowLeft size={20} /> Back to Profile
                </button>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar / Navigation */}
                    <aside className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-24">
                            <div className="p-4 border-b border-slate-100 bg-gray-50/50">
                                <h2 className="font-bold text-slate-800">Account Settings</h2>
                            </div>
                            <nav className="p-2 space-y-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setMessage({ type: "", text: "" });
                                            setErrors({});
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all ${activeTab === tab.id
                                                ? "bg-brand-50 text-brand-700"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                    >
                                        <tab.icon size={18} />
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">

                            {/* Header */}
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-slate-900">{tabs.find(t => t.id === activeTab)?.label}</h1>
                                <p className="text-slate-500 text-sm mt-1">Manage your account preferences</p>
                            </div>

                            {/* Flash Message */}
                            {message.text && (
                                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-fadeIn ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${message.type === "success" ? "bg-green-500" : "bg-red-500"}`}></span>
                                    {message.text}
                                </div>
                            )}

                            {/* Tab Content */}
                            {activeTab === "details" && (
                                <form onSubmit={handleDetailsUpdate} className="space-y-5 max-w-lg">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                            value={details.fullName}
                                            onChange={(e) => setDetails({ ...details, fullName: e.target.value })}
                                        />
                                        {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="name@example.com"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                            value={details.email}
                                            onChange={(e) => setDetails({ ...details, email: e.target.value })}
                                        />
                                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center gap-2 disabled:opacity-70"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                        Save Changes
                                    </button>
                                </form>
                            )}

                            {activeTab === "password" && (
                                <form onSubmit={handlePasswordChange} className="space-y-5 max-w-lg">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Current Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">New Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center gap-2 disabled:opacity-70"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Update Password"}
                                    </button>
                                </form>
                            )}

                            {activeTab === "avatar" && (
                                <form onSubmit={handleAvatarUpload} className="space-y-6 max-w-lg">
                                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => setAvatar(e.target.files[0])}
                                        />
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Upload className="text-slate-400 group-hover:text-brand-600" size={28} />
                                        </div>
                                        <h3 className="font-semibold text-slate-900">Click to upload avatar</h3>
                                        <p className="text-sm text-slate-500 mt-1">SVG, PNG, JPG or GIF (max. 3MB)</p>
                                        {avatar && <p className="mt-4 text-brand-600 font-medium text-sm">Selected: {avatar.name}</p>}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all disabled:opacity-70"
                                    >
                                        {loading ? "Uploading..." : "Save Avatar"}
                                    </button>
                                </form>
                            )}

                            {activeTab === "cover" && (
                                <form onSubmit={handleCoverUpload} className="space-y-6 max-w-lg">
                                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => setCover(e.target.files[0])}
                                        />
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Image className="text-slate-400 group-hover:text-brand-600" size={28} />
                                        </div>
                                        <h3 className="font-semibold text-slate-900">Click to upload cover image</h3>
                                        <p className="text-sm text-slate-500 mt-1">1920x1080 recommended</p>
                                        {cover && <p className="mt-4 text-brand-600 font-medium text-sm">Selected: {cover.name}</p>}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-all disabled:opacity-70"
                                    >
                                        {loading ? "Uploading..." : "Save Cover Image"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

