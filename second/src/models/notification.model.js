import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    sender: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      default: null 
    },
    type: {
      type: String,
      enum: ["new_subscriber", "new_comment", "new_like", "video_ready", "mention"],
      required: true
    },
    referenceId: { 
      type: Schema.Types.ObjectId, 
      default: null 
    },
    referenceModel: { 
      type: String, 
      enum: ["Video", "Comment", "Tweet"], 
      default: null 
    },
    message: { 
      type: String, 
      required: true 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
