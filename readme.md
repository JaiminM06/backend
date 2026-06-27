# MediaVerse

> A full-stack YouTube + Twitter hybrid platform built as a portfolio project demonstrating
> async video processing, real-time communication, full-text search, and creator analytics.

## ✨ Features

- 🎬 **Async video pipeline** — Upload → S3 → BullMQ queue → FFmpeg worker → HLS adaptive streaming
- 📡 **Real-time** — Socket.IO with Redis Pub/Sub for live comments, viewer counts, notifications
- 🔍 **Full-text search** — Typesense with fuzzy matching, autocomplete, typo tolerance
- 📊 **Creator analytics** — Views, watch time, subscriber growth, traffic sources via MongoDB aggregations
- 🤖 **Recommendations** — Content-based + collaborative filtering hybrid algorithm
- 🔐 **Auth** — JWT access/refresh tokens, httpOnly cookies, bcrypt password hashing
- 🛡️ **Production hardened** — Pino logging, Helmet, Zod validation, rate limiting, Docker, CI/CD

## 🏗️ Architecture

```
Client
  │
  ├── REST API (Express) ──► MongoDB (data)
  │                      ──► Redis (cache + queue broker)
  │                      ──► Typesense (search index)
  │
  ├── Socket.IO ──► Redis Pub/Sub ──► All connected clients
  │
  └── Video Upload Flow:
        Pre-signed S3 URL ──► S3 Raw Bucket
                          ──► BullMQ Job
                          ──► FFmpeg Worker (transcode → HLS)
                          ──► S3 Processed Bucket
                          ──► CloudFront CDN ──► HLS.js Player
```

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Runtime | Node.js 20 + Express 5 | Async I/O, production-proven |
| Database | MongoDB + Mongoose | Flexible schema, rich aggregation pipelines |
| Queue | BullMQ + Redis | Reliable async job processing with retries |
| Storage | AWS S3 + CloudFront | Scalable object storage + global CDN |
| Video | FFmpeg + HLS.js | Industry-standard transcoding + adaptive streaming |
| Search | Typesense | Fast, typo-tolerant, self-hostable |
| Real-time | Socket.IO + Redis adapter | Horizontally scalable WebSocket pub/sub |
| Logging | Pino + pino-http | Fastest Node.js JSON logger |
| Validation | Zod | Type-safe runtime schema validation |
| Testing | Jest + Supertest | API integration tests |
| CI/CD | GitHub Actions | Automated lint, test, Docker build |
| Frontend | React + Tailwind + Recharts + HLS.js | Modern, responsive UI |

## 🔑 Key Engineering Decisions

**Why BullMQ over processing videos inline?**
Video transcoding takes minutes. Doing it in the request/response cycle would time out
and block the server. BullMQ decouples upload from processing — the user gets an immediate
response and the worker transcodes asynchronously with automatic retry on failure.

**Why Typesense over MongoDB Atlas Search?**
MongoDB Atlas Search requires an M10+ cluster ($57/month). Typesense is open-source,
self-hostable via Docker (free), and provides comparable fuzzy search with better
autocomplete support. It also syncs from MongoDB via fire-and-forget hooks.

**Why MongoDB over PostgreSQL?**
MediaVerse has flexible, rapidly evolving schemas (video variants, analytics events,
social graph). MongoDB's document model and aggregation pipeline made iterating faster
than designing normalized SQL schemas upfront. For a portfolio project, the aggregation
pipeline complexity (recommendations, analytics, trending) demonstrates advanced query skills.

## 🚀 Local Setup

Prerequisites: Docker, Node.js 20, FFmpeg (for worker)

```bash
git clone <repo-url>
cd mediaverse
cp .env.example .env
# Fill in your values in .env

# Start all services (MongoDB, Redis, Typesense, MinIO, API, Worker)
docker-compose -f docker-compose.dev.yml up

# Or run manually:
npm install
npm run dev        # API server on :8000
npm run worker     # Video processing worker (separate terminal)
```

API docs: http://localhost:8000/api-docs
Health:   http://localhost:8000/health

## 🧪 Running Tests

```bash
npm test                    # run all tests
npm test -- --coverage      # with coverage report
npm test -- --watch         # watch mode
```

## 📋 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | No (default 8000) | API server port |
| MONGODB_URI | Yes | MongoDB connection string |
| JWT_SECRET | Yes | JWT signing secret |
| JWT_ACCESS_EXPIRY | No (default 1d) | Access token expiry |
| JWT_REFRESH_EXPIRY | No (default 10d) | Refresh token expiry |
| REDIS_URL | Yes | Redis connection URL |
| AWS_ACCESS_KEY_ID | Yes | AWS credentials |
| AWS_SECRET_ACCESS_KEY | Yes | AWS credentials |
| AWS_REGION | Yes | S3 bucket region |
| AWS_S3_RAW_BUCKET | Yes | Bucket for raw video uploads |
| AWS_S3_PROCESSED_BUCKET | Yes | Bucket for HLS output |
| CLOUDFRONT_DOMAIN | Yes | CloudFront distribution domain |
| TYPESENSE_HOST | Yes | Typesense server host |
| TYPESENSE_PORT | Yes | Typesense server port |
| TYPESENSE_API_KEY | Yes | Typesense API key |
| TYPESENSE_PROTOCOL | No (default http) | http or https |
| CLOUDINARY_CLOUD_NAME | Yes | Cloudinary (avatars/covers) |
| CLOUDINARY_API_KEY | Yes | Cloudinary |
| CLOUDINARY_API_SECRET | Yes | Cloudinary |
| SENTRY_DSN | No | Sentry error tracking DSN |
| LOG_LEVEL | No (default info) | Pino log level |
| NODE_ENV | No (default development) | Environment |

## 📄 License
MIT
