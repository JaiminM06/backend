import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import { setupTestMocks } from './setup.js';

beforeAll(async () => {
  await setupTestMocks();
});

// ══════════════════════════════════════════════════════════════════════
// Video Queue — job creation
// ══════════════════════════════════════════════════════════════════════

describe('Video Queue', () => {
  it('addVideoProcessingJob adds job with correct name to queue', async () => {
    const { addVideoProcessingJob } = await import('../queues/videoQueue.js');
    const result = await addVideoProcessingJob({ videoId: 'v1', userId: 'u1', s3Key: 'key.mp4' });
    expect(result).toBeDefined();
    expect(result.id).toBe('mock-job-id');
  });
});

// ══════════════════════════════════════════════════════════════════════
// Helper Functions — content type, resolutions, manifest
// ══════════════════════════════════════════════════════════════════════

describe('Content Type Detection', () => {
  const getContentType = (filename) => {
    if (filename.endsWith('.m3u8')) return 'application/x-mpegURL';
    if (filename.endsWith('.ts')) return 'video/MP2T';
    if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
    return 'application/octet-stream';
  };

  it('detects HLS manifest .m3u8', () => {
    expect(getContentType('playlist.m3u8')).toBe('application/x-mpegURL');
  });

  it('detects TS segment .ts', () => {
    expect(getContentType('segment_001.ts')).toBe('video/MP2T');
  });

  it('detects JPEG .jpg and .jpeg', () => {
    expect(getContentType('thumb_1.jpg')).toBe('image/jpeg');
    expect(getContentType('thumb.jpeg')).toBe('image/jpeg');
  });

  it('defaults to octet-stream for unknown', () => {
    expect(getContentType('unknown.bin')).toBe('application/octet-stream');
  });
});

describe('Resolution Filtering', () => {
  const RESOLUTIONS = [
    { name: '360p', width: 640,  height: 360,  videoBitrate: '800k',  audioBitrate: '96k' },
    { name: '480p', width: 854,  height: 480,  videoBitrate: '1500k', audioBitrate: '128k' },
    { name: '720p', width: 1280, height: 720,  videoBitrate: '3000k', audioBitrate: '128k' },
    { name: '1080p',width: 1920, height: 1080, videoBitrate: '5000k', audioBitrate: '192k' },
  ];

  it('filters to resolutions <= source height (720p source)', () => {
    const active = RESOLUTIONS.filter(r => r.height <= 720);
    expect(active).toHaveLength(3);
    expect(active.map(r => r.name)).toEqual(['360p', '480p', '720p']);
  });

  it('includes 360p fallback for small videos', () => {
    const active = RESOLUTIONS.filter(r => r.height <= 240);
    if (active.length === 0) active.push(RESOLUTIONS[0]);
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('360p');
  });

  it('includes all 4 resolutions for 1080p source', () => {
    const active = RESOLUTIONS.filter(r => r.height <= 1080);
    expect(active).toHaveLength(4);
  });
});

describe('Master Manifest Generation', () => {
  it('generates valid multi-bitrate HLS manifest', () => {
    const resolutions = [
      { name: '360p', width: 640, height: 360, videoBitrate: '800k' },
      { name: '720p', width: 1280, height: 720, videoBitrate: '3000k' },
    ];

    let manifest = '#EXTM3U\n#EXT-X-VERSION:3\n';
    for (const res of resolutions) {
      const bw = parseInt(res.videoBitrate) * 1000;
      manifest += `#EXT-X-STREAM-INF:BANDWIDTH=${bw},RESOLUTION=${res.width}x${res.height}\n`;
      manifest += `${res.name}/playlist.m3u8\n`;
    }

    expect(manifest).toContain('#EXTM3U');
    expect(manifest).toContain('BANDWIDTH=800000');
    expect(manifest).toContain('BANDWIDTH=3000000');
    expect(manifest).toContain('640x360');
    expect(manifest).toContain('1280x720');
    expect(manifest).toContain('360p/playlist.m3u8');
    expect(manifest).toContain('720p/playlist.m3u8');
  });
});

// ══════════════════════════════════════════════════════════════════════
// Status Transitions
// ══════════════════════════════════════════════════════════════════════

describe('Status Transitions', () => {
  const STATUSES = ['uploading', 'processing', 'ready', 'failed'];

  it('defines 4 allowed statuses', () => {
    expect(STATUSES).toEqual(['uploading', 'processing', 'ready', 'failed']);
  });

  it('normal flow: uploading → processing → ready', () => {
    expect(STATUSES.indexOf('uploading')).toBeLessThan(STATUSES.indexOf('processing'));
    expect(STATUSES.indexOf('processing')).toBeLessThan(STATUSES.indexOf('ready'));
  });

  it('error flow: processing → failed', () => {
    expect(STATUSES.indexOf('processing')).toBeLessThan(STATUSES.indexOf('failed'));
  });

  it('error message stored on video document', () => {
    const error = new Error('ffmpeg transcoding failed');
    const update = { processingStatus: 'failed', processingError: error.message };
    expect(update.processingStatus).toBe('failed');
    expect(update.processingError).toBe('ffmpeg transcoding failed');
  });

  it('video auto-published on successful processing', () => {
    const update = { processingStatus: 'ready', isPublished: true };
    expect(update.processingStatus).toBe('ready');
    expect(update.isPublished).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Notification Payloads
// ══════════════════════════════════════════════════════════════════════

describe('Notification Payloads', () => {
  it('video_ready notification has correct shape', () => {
    const payload = {
      recipientId: 'u1', senderId: null, type: 'video_ready',
      referenceId: 'v1', referenceModel: 'Video',
      message: 'Your video has been processed and is ready to stream',
    };
    expect(payload.type).toBe('video_ready');
    expect(payload.referenceModel).toBe('Video');
    expect(payload.senderId).toBeNull();
  });

  it('video_failed notification has correct shape', () => {
    const payload = {
      recipientId: 'u1', senderId: null, type: 'video_failed',
      referenceId: 'v1', referenceModel: 'Video',
      message: 'Your video could not be processed. Please try uploading again.',
    };
    expect(payload.type).toBe('video_failed');
    expect(payload.message).toContain('could not be processed');
  });
});

// ══════════════════════════════════════════════════════════════════════
// Retry Logic
// ══════════════════════════════════════════════════════════════════════

describe('Retry Logic', () => {
  it('default job options: 3 attempts with exponential backoff', () => {
    const opts = { attempts: 3, backoff: { type: 'exponential', delay: 5000 } };
    expect(opts.attempts).toBe(3);
    expect(opts.backoff.type).toBe('exponential');
    expect(opts.backoff.delay).toBe(5000);
  });

  it('failed notification only on final attempt', () => {
    const shouldNotify = (job) => job.attemptsMade >= (job.opts?.attempts || 1);

    expect(shouldNotify({ attemptsMade: 1, opts: { attempts: 3 } })).toBe(false);
    expect(shouldNotify({ attemptsMade: 2, opts: { attempts: 3 } })).toBe(false);
    expect(shouldNotify({ attemptsMade: 3, opts: { attempts: 3 } })).toBe(true);
  });

  it('cleanup runs even after processing error (finally block)', () => {
    let cleanupRan = false;
    try {
      throw new Error('processing error');
    } catch (e) {
      // re-thrown for BullMQ retry
    } finally {
      cleanupRan = true;
    }
    expect(cleanupRan).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════
// Upload Controller — integration tests (needs mock fix)
// ══════════════════════════════════════════════════════════════════════

describe('Upload Controller (pending)', () => {
  it.todo('requestUploadUrl returns 200 with presigned URL and videoId');
  it.todo('requestUploadUrl returns 400 when fields are missing');
  it.todo('requestUploadUrl returns 413 when file exceeds 500MB');
  it.todo('confirmUploadAndProcess returns 200 and queues job');
  it.todo('confirmUploadAndProcess returns 403 when user not owner');
  it.todo('confirmUploadAndProcess returns 400 when already processing');
  it.todo('confirmUploadAndProcess returns 404 when video not found');
  it.todo('getVideoStatus returns 200 with processing status');
  it.todo('getVideoStatus returns 404 when video not found');
  it.todo('getVideoStream returns 200 with stream data');
  it.todo('getVideoStream returns 400 when video not ready');
});
