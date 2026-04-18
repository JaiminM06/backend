import { useState, useEffect } from "react";
import axios from "axios";
import { History, ThumbsUp, Clock, PlaySquare, FolderHeart } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Library() {
    // For now, since we might not have specific history/liked endpoints working perfect in frontend context,
    // we will reuse user videos or mocked data structure for UI demonstration, 
    // OR we can try to fetch real data if we know the endpoints.
    // I will assume standard video structure.

    const [history, setHistory] = useState([]);
    const [liked, setLiked] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetching all videos as a placeholder for now, to demonstrate UI.
                // In real app: axios.get("/users/history"), axios.get("/likes")
                const res = await axios.get(`\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos/`, {
                    withCredentials: true,
                });
                const all = res.data.data || [];

                // Mock separation
                setHistory(all.slice(0, 4));
                setLiked(all.slice(4, 10));

            } catch (error) {
                console.error("Error fetching library:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const VideoSection = ({ title, icon: Icon, videos }) => (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Icon size={24} className="text-brand-600" />
                    {title}
                </h2>
                <button className="text-brand-600 text-sm font-semibold hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">
                    See all
                </button>
            </div>

            {videos.length === 0 ? (
                <div className="h-32 flex items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                    No videos in {title}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {videos.map(video => (
                        <div
                            key={video._id}
                            className="group cursor-pointer"
                            onClick={() => navigate(`/Home/${video._id}`)}
                        >
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 mb-3">
                                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                    12:24
                                </div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200">
                                    <div className="h-full bg-red-600" style={{ width: `${Math.random() * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 line-clamp-2 text-sm leading-snug group-hover:text-brand-600 transition-colors">
                                    {video.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">{video.owner.username} • {video.views} views</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                    <FolderHeart className="text-brand-600" size={32} />
                    Library
                </h1>

                <VideoSection title="History" icon={History} videos={history} />
                <VideoSection title="Liked Videos" icon={ThumbsUp} videos={liked} />
                <VideoSection title="Watch Later" icon={Clock} videos={[]} />
            </div>
        </div>
    );
}

export default Library;
