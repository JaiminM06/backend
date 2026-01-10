import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ThumbsUp, ThumbsDown, Share2, Bookmark, Flag, UserStar } from "lucide-react";

export default function VideoPlayer() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [avatar, setAvatar]= useState(null);
  const [subscribers,setSubscribers]=useState(0);
  const [isSubscribed,setIsSubscribed]=useState(false);
  // COMMENTS STATE
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyTo, setReplyTo] = useState(null);


  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/v1/videos/${id}`, {
          withCredentials: true,
        });
        setVideo(res.data.data);
        console.log(res.data);
        const subscriptionRes = await axios.get(
          `http://localhost:8000/api/v1/subscriptions/status/${res.data.data.owner._id}`,
          { withCredentials: true }
        );
        setIsSubscribed(subscriptionRes.data.data.isSubscribed);  
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [id]);
 
  useEffect(() => {
    if (!video) return;

    const fetchAvatar = async () => {
      try {
        console.log(video.owner._id)
        const res = await axios.get(`http://localhost:8000/api/v1/users/${video.owner._id}`, {
          withCredentials: true,
        });
        setAvatar(res.data.data.avatar);
        console.log(res.data.data.avatar)
      } catch (error) {
        console.error("Error fetching avatar:", error);
      }
    };

    fetchAvatar();
  }, [video]);
  useEffect(() => {
    if (!video) return;

    const fetchSubscriber = async () => {
      try {
        console.log(video.owner._id)
        const res = await axios.get(`http://localhost:8000/api/v1/users/${video.owner._id}`, {
          withCredentials: true,
        });
        setAvatar(res.data.data.avatar);
        console.log(res.data.data.avatar)
      } catch (error) {
        console.error("Error fetching avatar:", error);
      }
    };

    fetchSubscriber();
  }, [video]);

  useEffect(() => {
    if (!video) return;
    const fetchSubscriberCount = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/v1/subscriptions/u/${video.owner._id}`,
          { withCredentials: true }
        );
        console.log("Subscriber count response:");
        console.log(res.data);
        setSubscribers(res.data.data.length);
      } catch (error) {
        console.error("Error fetching subscriber count:", error);
      }
    };
    fetchSubscriberCount();
  }, [video]);
  useEffect(() => {
  if (!id) return;
  const fetchComments = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/v1/comments/${id}`,
        { withCredentials: true }
      );

      setComments(Array.isArray(res.data.data) ? res.data.data : []);
      console.log(res.data.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  fetchComments();
}, [id]);

  
  const handleLike = () => {
    if (liked) {
      setLiked(false);
    } else {
      setLiked(true);
      setDisliked(false);
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
    } else {
      setDisliked(true);
      setLiked(false);
    }
  };
  
  if (loading) return <p className="text-center mt-8">Loading video...</p>;
  if (!video) return <p className="text-center mt-8 text-red-500">Video not found!</p>;
  console.log(video)
  console.log(avatar)
  
  
const handleAddComment = async () => {
  if (!newComment.trim()) return;

  try {
    const res = await axios.post(
      `http://localhost:8000/api/v1/comments/${id}`,
      { content: newComment },
      { withCredentials: true }
    );

setComments(prev =>
  Array.isArray(prev) ? [res.data.data, ...prev] : [res.data.data]
);
    setNewComment("");
  } catch (error) {
    console.error(
      "Error adding comment:",
      error.response?.data || error.message
    );
  }
};


const handleCommentAction = async (commentId, type) => {
  try {
    await axios.post(
      `http://localhost:8000/api/v1/comments/${commentId}/${type}`,
      {},
      { withCredentials: true }
    );

    setComments(prev =>
      prev.map(c =>
        c._id === commentId
          ? {
              ...c,
              likes: type === "like" ? (c.likes || 0) + 1 : c.likes,
              dislikes: type === "dislike" ? (c.dislikes || 0) + 1 : c.dislikes,
            }
          : c
      )
    );
  } catch (error) {
    console.error("Error updating comment:", error);
  }
};

const handleReply = async (commentId) => {
  if (!replyText.trim()) return;

  try {
    const res = await axios.post(
      `http://localhost:8000/api/v1/comments/${commentId}/reply`,
      { text: replyText },
      { withCredentials: true }
    );

    setComments(prev =>
      prev.map(c =>
        c._id === commentId
          ? { ...c, replies: [...(c.replies || []), res.data.data] }
          : c
      )
    );

    setReplyText("");
    setReplyTo(null);
  } catch (error) {
    console.error("Error replying to comment:", error);
  }
};

  
  const shortDesc = video.description?.slice(0, 120) || "";
  const publishedDate = new Date(video.createdAt).toLocaleDateString();
  
  
    
    return (
  <div className="w-[1200px] mx-auto mt-8 px-4  max-h-[calc(100vh-64px)]  bg-gray-100">
    {/* Video Player */}
    <div className="relative w-full rounded-xl overflow-hidden shadow-lg  bg-gray-100 ">
      <video
        src={video.videoFile}
        poster={video.thumbnail}
        controls
        className="w-full h-[500px] object-contain md:object-cover   bg-gray-100"
      />
    </div>

    {/* Video Title and Actions */}
    <div className="mt-4">
      <h1 className="text-2xl font-semibold">{video.title}</h1>
      <div className="flex flex-wrap justify-between items-center mt-3">
        <p className="text-gray-600 text-sm">
          {video.views || Math.floor(Math.random() * 100000)} views • {publishedDate}
        </p>
        <div className="flex gap-4 text-gray-700">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 ${liked ? "text-blue-600" : "hover:text-blue-500"}`}
          >
            <ThumbsUp size={20} /> Like
          </button>
          <button
            onClick={handleDislike}
            className={`flex items-center gap-1 ${disliked ? "text-red-600" : "hover:text-red-500"}`}
          >
            <ThumbsDown size={20} /> Dislike
          </button>
          <button className="flex items-center gap-1 hover:text-green-600">
            <Share2 size={20} /> Share
          </button>
          <button className="flex items-center gap-1 hover:text-yellow-600">
            <Bookmark size={20} /> Save
          </button>
          <button className="flex items-center gap-1 hover:text-gray-600">
            <Flag size={20} /> Report
          </button>
        </div>
      </div>
    </div>

    {/* Channel Info */}
    <div className="flex items-center gap-3 mt-6 border-t border-gray-200 pt-4">
      <img
        src={avatar || "https://via.placeholder.com/50"}
        alt="Channel"
        className="w-12 h-12 rounded-full object-cover"
      />
      <div>
        <p className="font-semibold text-gray-900">{video.owner.username || "Unknown Channel"}</p>
        <p className="text-sm text-gray-500">{subscribers} subscribers</p>
      </div>
      <button className="ml-auto bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700" onClick={async () => {
        try {
          if (isSubscribed) {
            await axios.post( 
              `http://localhost:8000/api/v1/subscriptions/c/${video.owner._id}`,
              {},
              { withCredentials: true }     
            );
            setSubscribers(prev => prev - 1);
          } else {
            await axios.post(
              `http://localhost:8000/api/v1/subscriptions/c/${video.owner._id}`,    
              {},
              { withCredentials: true }
            );
            setSubscribers(prev => prev + 1);
          }
        } catch (error) {
          console.error("Error subscribing:", error);
        } finally {
          setIsSubscribed(!isSubscribed);
        }   
      }}>
        {isSubscribed ? "unSubscribe" : "Subscribe"} 

      </button>
    </div>

    {/* Description */}
    <div className="mt-4 bg-gray-50 p-4 rounded-lg">
      <p className="text-gray-800 text-sm whitespace-pre-line">
        {showFullDesc ? video.description : shortDesc}
        {video.description?.length > 120 && (
          <button
            onClick={() => setShowFullDesc(!showFullDesc)}
            className="text-blue-600 ml-2"
          >
            {showFullDesc ? "Show less" : "Show more"}
          </button>
        )}
      </p>
    </div>
    {/* COMMENTS SECTION */}
<div className="mt-6 bg-white p-4 rounded-lg shadow">
  <h2 className="text-lg font-semibold mb-4">
    Comments ({comments.length})
  </h2>

  {/* ADD COMMENT */}
  <div className="flex gap-2 mb-4">
    <input
      type="text"
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      placeholder="Add a comment..."
      className="flex-1 border rounded-full px-4 py-2"
    />
    <button
      onClick={handleAddComment}
      className="bg-blue-600 text-white w-10 h-10 rounded-full text-xl"
    >
      +
    </button>
  </div>

  {/* COMMENT LIST */}
  {comments.map((comment) => (
    <div key={comment._id} className="mb-4 border-b pb-3">
      <p className="font-semibold">{comment.owner.username}</p>
      <p className="text-sm text-gray-700">{comment.content}</p>

      <div className="flex gap-4 text-sm mt-2 text-gray-600">
        <button onClick={() => handleCommentAction(comment._id, "like")}>
          👍 {comment.likes || 0}
        </button>
        <button onClick={() => handleCommentAction(comment._id, "dislike")}>
          👎 {comment.dislikes || 0}
        </button>
        <button onClick={() => setReplyTo(comment._id)}>
          Reply
        </button>
      </div>

      {/* REPLY BOX */}
      {replyTo === comment._id && (
        <div className="ml-6 mt-2 flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 border rounded-full px-3 py-1"
          />
          <button
            onClick={() => handleReply(comment._id)}
            className="text-blue-600"
          >
            Send
          </button>
        </div>
      )}

      {/* REPLIES */}
      {comment.replies?.map((reply) => (
        <div key={reply._id} className="ml-6 mt-2 text-sm">
          <span className="font-semibold">{reply.user.username}</span>
          <p>{reply.text}</p>
        </div>

      ))}
    </div>
  ))}
</div>

  </div>
);

}
