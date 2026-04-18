import { useState } from "react";
import axios from "axios";
import { Upload, CloudUpload, Film, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function VideoUpload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!title || !videoFile) {
      setError("Please provide a title and a video file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("thumbnail", thumbnail);
    formData.append("videoFile", videoFile);

    try {
      setUploading(true);
      const res = await axios.post(
        `\${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/videos/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      setMessage(res.data.message || "Video is ready to watch!");
      // Reset form
      setTitle("");
      setDescription("");
      setThumbnail(null);
      setVideoFile(null);
    } catch (err) {
      console.error(err);
      setError("Failed to upload video. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Upload className="text-brand-600" /> Upload Video
          </h2>
          <p className="text-slate-500 mt-1">Share your content with the world</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 border border-red-100">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
          {message && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3 border border-green-100">
              <CheckCircle size={20} />
              {message}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-8">

            {/* Video File Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Video File</label>
              <div className="relative group">
                <input
                  type="file"
                  accept="video/*"
                  id="video-upload"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="hidden"
                />
                <label
                  htmlFor="video-upload"
                  className={`flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl transition-all cursor-pointer bg-slate-50
                        ${videoFile ? 'border-brand-500 bg-brand-50/30' : 'border-slate-300 hover:border-brand-400 hover:bg-brand-50/30'}`}
                >
                  {videoFile ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Film size={32} />
                      </div>
                      <p className="text-brand-700 font-medium text-lg">{videoFile.name}</p>
                      <p className="text-brand-500 text-sm mt-1">Click to change video</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <CloudUpload size={32} />
                      </div>
                      <p className="text-slate-700 font-medium text-lg">Drag and drop video files to upload</p>
                      <p className="text-slate-400 text-sm mt-1">or click to browse files</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Metadata */}
              <div className="md:col-span-2 space-y-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Video Title</label>
                  <input
                    type="text"
                    placeholder="Give your video a catchy title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea
                    placeholder="Tell viewers about your video..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>
              </div>

              {/* Right Column: Thumbnail */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700">Thumbnail</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    id="thumbnail-upload"
                    onChange={(e) => setThumbnail(e.target.files[0])}
                    className="hidden"
                  />
                  <label
                    htmlFor="thumbnail-upload"
                    className={`flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-xl transition-all cursor-pointer overflow-hidden relative
                            ${thumbnail ? 'border-transparent' : 'border-slate-300 hover:border-brand-400 bg-slate-50 hover:bg-brand-50/30'}`}
                  >
                    {thumbnail ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={URL.createObjectURL(thumbnail)}
                          alt="Thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm font-medium">Change Image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon size={24} className="mx-auto text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500">Upload Thumbnail</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={uploading}
                className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-600/20 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Uploading Video...
                  </>
                ) : (
                  "Upload Video"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
