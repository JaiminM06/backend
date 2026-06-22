import { useState } from "react";
import axios from "axios";
import { Upload, CloudUpload, Film, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function VideoUpload() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setUploadProgress(0);
    setProcessingStatus("");

    if (!title || !videoFile) {
      setError("Please provide a title and a video file.");
      return;
    }

    try {
      setUploading(true);
      setProcessingStatus("Requesting upload permissions...");

      // Determine content type with fallback for Windows file association gaps
      let contentType = videoFile.type;
      if (!contentType) {
        const ext = videoFile.name.split('.').pop().toLowerCase();
        if (ext === 'mp4') contentType = 'video/mp4';
        else if (ext === 'webm') contentType = 'video/webm';
        else if (ext === 'mov' || ext === 'qt') contentType = 'video/quicktime';
      }

      // 1. Get presigned URL from backend
      const requestUrlRes = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/upload/request-url`,
        {
          fileName: videoFile.name,
          contentType: contentType || "video/mp4",
          fileSize: videoFile.size,
          title,
          description,
          tags: ["hls"]
        },
        { withCredentials: true }
      );

      const { uploadUrl, videoId } = requestUrlRes.data.data;
      setProcessingStatus("Uploading video directly to AWS S3...");

      // 2. Upload raw video file directly to AWS S3 via PUT
      await axios.put(uploadUrl, videoFile, {
        headers: {
          "Content-Type": videoFile.type
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      setUploadProgress(100);
      setProcessingStatus("Queuing video in transcoding queue...");

      // 3. Confirm upload on backend to start transcoding worker
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/upload/confirm/${videoId}`,
        {},
        { withCredentials: true }
      );

      setProcessingStatus("Transcoding & generating HLS manifests (360p, 480p, 720p, 1080p)...");

      // 4. Poll status until ready or failed
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await axios.get(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/upload/status/${videoId}`,
            { withCredentials: true }
          );
          
          const status = statusRes.data.data.processingStatus;
          if (status === "ready") {
            clearInterval(pollInterval);
            setProcessingStatus("Ready");
            setMessage("Video uploaded, processed, and ready for adaptive streaming!");
            setUploading(false);
            // Reset form
            setTitle("");
            setDescription("");
            setVideoFile(null);
            setUploadProgress(0);
          } else if (status === "failed") {
            clearInterval(pollInterval);
            setProcessingStatus("Failed");
            setError(statusRes.data.data.processingError || "Transcoding failed.");
            setUploading(false);
          }
        } catch (pollErr) {
          clearInterval(pollInterval);
          console.error("Polling error:", pollErr);
          setError("Failed to track video status, but processing is running.");
          setUploading(false);
        }
      }, 3000);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to upload video. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Upload className="text-brand-600" /> Upload HLS Video
          </h2>
          <p className="text-slate-500 mt-1">Direct-to-S3 secure uploads with automated HLS transcoding</p>
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

          {uploading && (
            <div className="mb-6 p-4 bg-brand-50 border border-brand-100 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold text-brand-800">
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-brand-600" />
                  {processingStatus}
                </span>
                {uploadProgress > 0 && uploadProgress <= 100 && (
                  <span className="text-brand-700">{uploadProgress}%</span>
                )}
              </div>
              {uploadProgress > 0 && uploadProgress <= 100 && (
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-brand-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-8">
            {/* Video File Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Video File</label>
              <div className="relative group">
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  id="video-upload"
                  disabled={uploading}
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
                      <p className="text-slate-400 text-sm mt-1">Supports MP4, WEBM, and MOV (Max 500MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Video Title</label>
                <input
                  type="text"
                  placeholder="Give your video a catchy title"
                  value={title}
                  disabled={uploading}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  placeholder="Tell viewers about your video..."
                  value={description}
                  disabled={uploading}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                />
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
                    Uploading...
                  </>
                ) : (
                  "Upload & Process"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
