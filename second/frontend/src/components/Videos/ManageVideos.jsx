import { useState, useEffect } from "react";
import axios from "axios";
import Upload from "./upload.jsx"
import UpdateVideo from "./UpdateVideo.jsx";
import { Upload as UploadIcon, Edit, Trash2, ArrowLeft, Video } from "lucide-react";

function ManageVideos() {
    const [selectedTab, setSelectedTab] = useState("upload");
    const [videos, setVideos] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await axios.get(`\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos/`, {
                    withCredentials: true,
                });
                setVideos(res.data.data || []);
            } catch (error) {
                console.error("Error fetching videos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    // Delete a video
    const handleDelete = async (videoId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this video?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos/${videoId}`, {
                withCredentials: true,
            });
            // Show a toast or clearer feedback here ideally
            setVideos(videos.filter((v) => v._id !== videoId));
        } catch (error) {
            console.error(error);
            alert("Failed to delete video. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <button
                            onClick={() => (window.location.href = "/Home/user")}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-2 font-medium"
                        >
                            <ArrowLeft size={20} /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Video className="text-brand-600" size={32} /> Manage Your Content
                        </h1>
                    </div>
                </div>

                {/* Tab Buttons */}
                <div className="flex flex-wrap gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 w-fit">
                    <button
                        onClick={() => setSelectedTab("upload")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${selectedTab === "upload"
                                ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                                : "bg-transparent text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        <UploadIcon size={18} /> Upload Video
                    </button>
                    <button
                        onClick={() => setSelectedTab("update")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${selectedTab === "update"
                                ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                                : "bg-transparent text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        <Edit size={18} /> Update Video
                    </button>
                    <button
                        onClick={() => setSelectedTab("delete")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${selectedTab === "delete"
                                ? "bg-brand-600 text-white shadow-lg shadow-brand-500/20"
                                : "bg-transparent text-slate-600 hover:bg-slate-50"
                            }`}
                    >
                        <Trash2 size={18} /> Delete Video
                    </button>
                </div>

                {/* Render Tab Content */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden min-h-[500px] border border-slate-100">
                    {selectedTab === "upload" && (
                        <div className="p-8">
                            <Upload />
                        </div>
                    )}

                    {selectedTab === "delete" && (
                        <div className="p-8">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-800">Select videos to delete</h2>
                                <p className="text-slate-500">This action cannot be undone.</p>
                            </div>

                            {videos.length === 0 ? (
                                <p className="text-center text-slate-400 py-12">No videos found to delete.</p>
                            ) : (
                                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {videos.map((video) => (
                                        <div
                                            key={video._id}
                                            className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 hover:border-red-200 hover:shadow-lg transition-all"
                                        >
                                            <div className="relative aspect-video">
                                                <img
                                                    src={video.thumbnail}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Trash2 className="text-white" size={32} />
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mb-3">{video.title}</h3>
                                                <button
                                                    onClick={() => handleDelete(video._id)}
                                                    className="w-full bg-white text-red-600 border border-red-200 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Trash2 size={16} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedTab === "update" && (
                        <div className="p-8">
                            {!selectedVideo ? (
                                <>
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-bold text-slate-800">Select a video to edit</h2>
                                        <p className="text-slate-500">Click on any video below to update its details.</p>
                                    </div>

                                    {videos.length === 0 ? (
                                        <p className="text-center text-slate-400 py-12">No videos found to update.</p>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                            {videos.map((video) => (
                                                <div
                                                    key={video._id}
                                                    onClick={() => setSelectedVideo(video._id)}
                                                    className="group bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 hover:border-brand-300 hover:shadow-lg transition-all cursor-pointer"
                                                >
                                                    <div className="relative aspect-video">
                                                        <img
                                                            src={video.thumbnail}
                                                            alt={video.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Edit className="text-white" size={32} />
                                                        </div>
                                                    </div>
                                                    <div className="p-4">
                                                        <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-brand-600 transition-colors">{video.title}</h3>
                                                        <p className="text-xs text-slate-500 mt-1">{video.views} views</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <UpdateVideo videoId={selectedVideo} goBack={() => setSelectedVideo(null)} />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ManageVideos;
