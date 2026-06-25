import mongoose from "mongoose";
import VideoAnalytics from "../models/videoAnalytics.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Video } from "../models/video.model.js";

const getViewsOverTime = async (videoIds, period = 'month') => {
  const cutoffDate = new Date();
  if (period === 'week') {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  } else if (period === 'year') {
    cutoffDate.setDate(cutoffDate.getDate() - 365);
  } else {
    cutoffDate.setDate(cutoffDate.getDate() - 30);
  }

  const results = await VideoAnalytics.aggregate([
    {
      $match: {
        video: { $in: videoIds },
        timestamp: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        views: { $sum: 1 },
        avgWatchTime: { $avg: '$watchDuration' },
        totalWatchTime: { $sum: '$watchDuration' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return results.map(item => ({
    date: item._id,
    views: item.views,
    avgWatchTime: item.avgWatchTime,
    totalWatchTime: item.totalWatchTime
  }));
};

const getSubscriberGrowth = async (channelId, period = 'month') => {
  const cutoffDate = new Date();
  if (period === 'week') {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  } else if (period === 'year') {
    cutoffDate.setDate(cutoffDate.getDate() - 365);
  } else {
    cutoffDate.setDate(cutoffDate.getDate() - 30);
  }

  const results = await Subscription.aggregate([
    {
      $match: {
        channel: channelId,
        createdAt: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        newSubscribers: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return results.map(item => ({
    date: item._id,
    newSubscribers: item.newSubscribers
  }));
};

const getTopVideos = async (videoIds, limit = 10) => {
  return await Video.aggregate([
    {
      $match: {
        _id: { $in: videoIds },
        isPublished: true
      }
    },
    {
      $lookup: {
        from: 'videoanalytics',
        let: { videoId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$video', '$$videoId'] } } },
          {
            $group: {
              _id: null,
              totalViews: { $sum: 1 },
              avgCompletionRate: { $avg: '$completionRate' },
              avgWatchDuration: { $avg: '$watchDuration' }
            }
          }
        ],
        as: 'analytics'
      }
    },
    {
      $addFields: {
        totalViews: { $ifNull: [{ $arrayElemAt: ['$analytics.totalViews', 0] }, 0] },
        avgCompletionRate: { $ifNull: [{ $arrayElemAt: ['$analytics.avgCompletionRate', 0] }, 0] },
        avgWatchDuration: { $ifNull: [{ $arrayElemAt: ['$analytics.avgWatchDuration', 0] }, 0] }
      }
    },
    {
      $lookup: {
        from: 'likes',
        let: { videoId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$video', '$$videoId'] } } },
          { $count: 'count' }
        ],
        as: 'likes'
      }
    },
    {
      $addFields: {
        likeCount: { $ifNull: [{ $arrayElemAt: ['$likes.count', 0] }, 0] }
      }
    },
    {
      $lookup: {
        from: 'comments',
        let: { videoId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$video', '$$videoId'] } } },
          { $count: 'count' }
        ],
        as: 'comments'
      }
    },
    {
      $addFields: {
        commentCount: { $ifNull: [{ $arrayElemAt: ['$comments.count', 0] }, 0] }
      }
    },
    {
      $sort: { totalViews: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        title: 1,
        thumbnail: 1,
        duration: 1,
        createdAt: 1,
        totalViews: 1,
        avgCompletionRate: 1,
        avgWatchDuration: 1,
        likeCount: 1,
        commentCount: 1
      }
    }
  ]);
};

const getTrafficSources = async (videoIds) => {
  return await VideoAnalytics.aggregate([
    {
      $match: {
        video: { $in: videoIds }
      }
    },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        source: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
};

const getAudienceRetention = async (videoId) => {
  const results = await VideoAnalytics.aggregate([
    {
      $match: {
        video: videoId
      }
    },
    {
      $group: {
        _id: null,
        avgCompletionRate: { $avg: '$completionRate' },
        avgWatchDuration: { $avg: '$watchDuration' },
        totalViews: { $sum: 1 },
        viewsCompleted: {
          $sum: {
            $cond: [{ $gte: ['$completionRate', 0.9] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        avgCompletionRate: 1,
        avgWatchDuration: 1,
        totalViews: 1,
        completionPercent: {
          $cond: [
            { $gt: ['$totalViews', 0] },
            { $multiply: [{ $divide: ['$viewsCompleted', '$totalViews'] }, 100] },
            0
          ]
        }
      }
    }
  ]);

  return results[0] || {
    avgCompletionRate: 0,
    avgWatchDuration: 0,
    totalViews: 0,
    completionPercent: 0
  };
};

const getSummaryStats = async (videoIds, channelId) => {
  const [totalViews, watchTimeData, totalSubscribers, publishedVideoCount] = await Promise.all([
    VideoAnalytics.countDocuments({ video: { $in: videoIds } }),
    VideoAnalytics.aggregate([
      { $match: { video: { $in: videoIds } } },
      { $group: { _id: null, totalWatchSeconds: { $sum: '$watchDuration' } } }
    ]),
    Subscription.countDocuments({ channel: channelId }),
    Video.countDocuments({ _id: { $in: videoIds }, isPublished: true })
  ]);

  const totalWatchTimeSeconds = watchTimeData[0]?.totalWatchSeconds || 0;
  const totalWatchTimeHours = totalWatchTimeSeconds / 3600;

  return {
    totalViews,
    totalWatchTimeHours,
    totalSubscribers,
    publishedVideoCount
  };
};

export {
  getViewsOverTime,
  getSubscriberGrowth,
  getTopVideos,
  getTrafficSources,
  getAudienceRetention,
  getSummaryStats
};
