import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function TweetComposer({ onTweetPosted, parentTweetId, quoteTweetId }) {
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quoteTweet, setQuoteTweet] = useState(null);
  
  const fileInputRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchQuoteTweet = async () => {
      try {
        const res = await axios.get(
          `${apiUrl}/api/v1/tweets/${quoteTweetId}/thread`,
          { withCredentials: true }
        );
        if (res.data?.data?.rootTweet) {
          setQuoteTweet(res.data.data.rootTweet);
        }
      } catch (err) {
        console.error("Failed to fetch quote tweet details", err);
      }
    };
    if (quoteTweetId) {
      fetchQuoteTweet();
    }
  }, [quoteTweetId, apiUrl]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (mediaUrls.length + files.length > 4) {
      setError("Maximum 4 media items per tweet");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const newMediaUrls = [...mediaUrls];
      for (const file of files) {
        if (file.size > 10485760) {
          throw new Error(`File ${file.name} is too large. Max size is 10MB`);
        }
        
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File ${file.name} has unsupported format`);
        }

        // Get presigned URL
        const res = await axios.post(
          `${apiUrl}/api/v1/tweets/media/upload-url`,
          { contentType: file.type, fileSize: file.size },
          { withCredentials: true }
        );

        const { uploadUrl, publicUrl } = res.data.data;

        // PUT to S3
        await axios.put(uploadUrl, file, {
          headers: { 'Content-Type': file.type }
        });

        newMediaUrls.push(publicUrl);
      }
      setMediaUrls(newMediaUrls);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to upload image(s)");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeMedia = (indexToRemove) => {
    setMediaUrls(mediaUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && mediaUrls.length === 0) return;
    if (content.length > 280) return;

    setSubmitting(true);
    setError("");

    try {
      let endpoint = `${apiUrl}/api/v1/tweets`;
      let payload = { content, media: mediaUrls };

      if (parentTweetId) {
        endpoint = `${apiUrl}/api/v1/tweets/${parentTweetId}/reply`;
        payload = { content };
      } else if (quoteTweetId) {
        endpoint = `${apiUrl}/api/v1/tweets/${quoteTweetId}/quote`;
        payload = { content };
      }

      const res = await axios.post(endpoint, payload, { withCredentials: true });
      const responseData = res.data.data;
      const newTweet =
        responseData?.reply       ||
        responseData?.quoteTweet  ||
        responseData?.tweet       ||
        responseData;

      if (onTweetPosted) {
        onTweetPosted(newTweet);
      }
      setContent("");
      setMediaUrls([]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post tweet");
    } finally {
      setSubmitting(false);
    }
  };

  const charLength = content.length;
  let counterColor = "text-slate-400";
  if (charLength >= 275) {
    counterColor = "text-red-500 font-semibold";
  } else if (charLength >= 260) {
    counterColor = "text-yellow-500 font-semibold";
  }

  const hashtags = content.match(/#[\w]+/g) || [];

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-100 rounded-xl p-4 shadow-sm">
      {quoteTweetId && quoteTweet && (
        <div className="mb-3 p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600">
          <div className="font-semibold text-slate-800">@{quoteTweet.owner?.username}</div>
          <div className="truncate max-w-full">{quoteTweet.content?.substring(0, 80)}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={parentTweetId ? "Post your reply" : "What's happening?"}
            maxLength={280}
            rows={parentTweetId ? 2 : 3}
            className="w-full bg-transparent border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none text-sm leading-relaxed"
          />
        </div>

        {/* Hashtags Preview */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {hashtags.map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Image Preview Grid */}
        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {mediaUrls.map((url, index) => (
              <div key={index} className="relative group rounded-lg overflow-hidden border border-slate-100 aspect-video bg-slate-50">
                <img src={url} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            {!parentTweetId && !quoteTweetId && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || mediaUrls.length >= 4}
                  className="p-2 text-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-transparent rounded-full transition-colors"
                  title="Upload images"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </>
            )}
            
            {uploading && (
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs ${counterColor}`}>
              {charLength}/280
            </span>
            <button
              type="submit"
              disabled={(!content.trim() && mediaUrls.length === 0) || charLength > 280 || submitting || uploading}
              className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400/50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-full transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Posting
                </>
              ) : (
                parentTweetId ? "Reply" : "Post"
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg p-2.5">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
