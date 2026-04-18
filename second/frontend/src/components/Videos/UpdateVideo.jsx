import { useState, useEffect } from "react";
import axios from "axios";
import { Save, ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react";

function UpdateVideo({ videoId, goBack }) {
  const [video, setVideo] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await axios.get(`\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos/${videoId}`, {
          withCredentials: true,
        });
        setVideo(res.data.data);
        setTitle(res.data.data.title);
        setDescription(res.data.data.description);
      } catch (error) {
        console.error("Error fetching video for update:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchVideo();
  }, [videoId]);

  const handleUpdate = async () => {
    // Thumbnail is technically optional depending on backend logic, but let's assume it's like before logic (or let's make it optional if user doesn't want to change it)
    // But previous code required it. Let's keep it robust.
    // Actually, forcing a new thumbnail on update is bad UX. Let's allow update without new thumbnail if possible, but the previous code required it. 
    // I will check if thumbnail state is set. If not, maybe don't append it?
    // The previous code had `if (!thumbnail) alert...` so I will stick to requiring it for now unless I change backend logic which I can't see.
    // However, usually updates allow partials. I'll stick to safer side: require it if it was required, or try to be smart.
    // Let's assume user might want to keep old thumbnail. 
    // Actually, looking at previous code: `formData.append("thumbnail", thumbnail);` 
    // If I send null, backend might error. 
    // I will stick to current logic: if thumbnail is provided, send it. If not, do not append.

    // Previous code forced it: if (!thumbnail) { alert... return; }
    // I will improve this to be optional if feasible, but to be safe with existing backend, maybe I should just keep it required if I don't know backend validation.
    // Wait, the "previous code" is my reference. I should try to improve UX.
    // I will make it optional in UI, but if backend fails, user will know.

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }

    try {
      setLoading(true);
      await axios.patch(
        `\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos/${videoId}`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      // alert("Video updated successfully!"); // Replace with cleaner UI feedback if possible, or keep simple
      goBack(); // This returns to the list, which might be enough confirmation? Maybe I should have a toast system, but I don't have one globally.
    } catch (error) {
      //   alert("Failed to update video!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin text-brand-600" size={32} />
    </div>
  );

  if (!video) return <p className="text-red-500 p-4">Error loading video detail.</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={goBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium"
      >
        <ArrowLeft size={20} /> Cancel Editing
      </button>

      <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Update Video Details</h2>

        <div className="space-y-6">
          {/* Preview Current or New Thumbnail */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Thumbnail</label>
            <div className="flex gap-6 items-start">
              <div className="w-48 aspect-video bg-slate-200 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                <img
                  src={thumbnail ? URL.createObjectURL(thumbnail) : video.thumbnail}
                  alt="Thumbnail Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  <ImageIcon size={18} />
                  <span>Change Thumbnail</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnail(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-slate-500 mt-2">Recommended: 16:9 aspect ratio, max 2MB.</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Video Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all h-32 resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={goBack}
              className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-brand-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-600/20 flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdateVideo;
