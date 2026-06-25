# Frontend Bug Audit — MediaVerse

> Read-only audit. No files were modified.

---

## Critical Bugs

### 1. Library / Watch History uses wrong data source and is unsorted

- **Issue**: Library page calls `/api/v1/users/history`, which maps to `getWatchHistory`. That controller reads from `User.watchHistory` — a MongoDB array maintained with `$addToSet`. It does **not** preserve recency and does **not** read from the dedicated `WatchHistory` collection that stores `watchedAt` timestamps.
- **File**: `frontend/src/components/UserPage/Library.jsx`, `backend/src/controllers/user.controller.js`
- **Root cause**: Backend `getWatchHistory` aggregates `User.watchHistory` via `$lookup`, ignoring the `WatchHistory` model. `$addToSet` on `User.watchHistory` never reorders entries, so "recently watched" is unreliable.
- **Fix plan**: Change backend `getWatchHistory` to query the `WatchHistory` collection, sort by `watchedAt: -1`, `$lookup` video + owner, and return that ordered list. Frontend mapping `historyRes.data.data || []` is already correct.

### 2. Liked videos are unsorted

- **Issue**: Recently liked videos do not appear first.
- **File**: `backend/src/controllers/like.controller.js`
- **Root cause**: `getLikedVideos` uses `Like.find(...).populate("video")` with no `sort` or `createdAt` filter.
- **Fix plan**: Add `.sort({ createdAt: -1 }).limit(...)` to the `Like.find()` query. Frontend mapping in `Library.jsx` (`likedRes.data.data.map(likeDoc => likeDoc.video)`) is fine once sorted.

### 3. Dashboard has no visible navigation entry

- **Issue**: Creators cannot reach `/Home/dashboard` from the sidebar, navbar, or profile page.
- **File**: `frontend/Layout.jsx`, `frontend/src/components/UserPage/Userpage.jsx`
- **Root cause**: `navItems` in `Layout.jsx` lists Home, Trending, Library, Upload, Profile but no Dashboard. `UserPage.jsx` links to Manage Account and Manage Videos but not Dashboard.
- **Fix plan**: Add a "Dashboard" / "Creator Studio" item to `navItems` in `Layout.jsx` (e.g. `to: "/Home/dashboard"`) and add a dashboard button on the profile page.

### 4. Duplicate app branding in sidebar header

- **Issue**: Two "MediaVerse" brand labels render in the sidebar header simultaneously.
- **File**: `frontend/Layout.jsx` (lines ~78-91)
- **Root cause**:
  ```jsx
  <span className="... md:hidden">MediaVerse</span>
  <span className="... ${isExpanded ? ... : 'hidden'}">MediaVerse</span>
  ```
  On mobile, when the drawer is open, `isExpanded` is also `true`, so both spans are visible.
- **Fix plan**: Remove the mobile-only span or keep a single conditional logo.

### 5. Search bar is non-functional

- **Issue**: The global search input in `Layout.jsx` accepts no input handling, has no state, and cannot submit. Backend has full Typesense search endpoints (`/api/v1/search`).
- **File**: `frontend/Layout.jsx`
- **Root cause**: Input is a decorative `<input>` with no `value`, `onChange`, or `onSubmit`.
- **Fix plan**: Add search state, submit handler, and either navigate to a search results route or create a `SearchResults.jsx` page.

### 6. Socket authentication reads httpOnly cookie from JS

- **Issue**: `Layout.jsx` tries to read the `accessToken` cookie via `document.cookie`, but the backend sets it as `httpOnly: true` in `loginUser`. The socket therefore receives an empty token and the real-time connection will fail auth.
- **File**: `frontend/Layout.jsx`, `frontend/src/hooks/useSocket.js`
- **Root cause**: `getCookie("accessToken")` returns `undefined` for httpOnly cookies. `useSocket` then passes an empty token.
- **Fix plan**: Do not read the access token from JS for the socket. Instead, rely on `withCredentials: true` and have the backend read the cookie during the Socket.IO handshake, or send the token in a non-httpOnly cookie specifically for sockets.

---

## Important Bugs

### 7. Register success redirects to wrong page

- **Issue**: After successful registration, user is sent to `/` (Home landing page) instead of login or feed.
- **File**: `frontend/src/components/Register/Register.jsx`
- **Root cause**: `navigate("/")` after successful POST.
- **Fix plan**: Redirect to `/Login` so the new user can sign in, or log them in automatically and redirect to `/Home/feed`.

### 8. Login / Register still show "MyTube" branding

- **Issue**: App is branded "MediaVerse" everywhere else, but Login and Register headers say "MyTube".
- **File**: `frontend/src/components/Login/Login.jsx`, `frontend/src/components/Register/Register.jsx`
- **Root cause**: Stale copy-pasted branding.
- **Fix plan**: Replace "MyTube" / "Join MyTube" with "MediaVerse".

### 9. `Videos.jsx` is dead/broken code

- **Issue**: Component file comment says `// src/App.jsx`, navigates to `/Dashboard/${video._id}` (route does not exist), and is not wired into `main.jsx`.
- **File**: `frontend/src/components/Videos/Videos.jsx`
- **Root cause**: Legacy component left in repo.
- **Fix plan**: Delete `Videos.jsx` or update navigation to `/Home/${video._id}` and add it to routes if needed.

### 10. Inconsistent route naming: `/Home/getVideos`

- **Issue**: Route `/Home/getVideos` exists but maps to `UserPage`. No sidebar link or UI references it.
- **File**: `frontend/src/main.jsx`
- **Root cause**: Leftover/duplicate route.
- **Fix plan**: Remove `/Home/getVideos` route; profile is already served by `/Home/user`.

### 11. `ManageAccount` details form is not pre-filled

- **Issue**: The "Profile Details" tab initializes `details` as `{ fullName: "", email: "" }` and never fetches current user data.
- **File**: `frontend/src/components/UserPage/ManageAccount.jsx`
- **Root cause**: Missing `useEffect` to fetch `/api/v1/users/current-user`.
- **Fix plan**: Fetch current user on mount and populate `details`.

### 12. `UpdateVideo` creates unreleased object URLs

- **Issue**: Thumbnail preview uses `URL.createObjectURL(thumbnail)` but never revokes it, leaking memory.
- **File**: `frontend/src/components/Videos/UpdateVideo.jsx`
- **Root cause**: No cleanup for object URLs.
- **Fix plan**: Store the object URL in a ref/useEffect and call `URL.revokeObjectURL` on cleanup or when file changes.

### 13. `feed.jsx` displays fake durations when real duration is missing

- **Issue**: When `video.duration` is falsy, the card renders a fabricated duration based on `index`.
- **File**: `frontend/src/components/Videos/feed.jsx`
- **Root cause**: Fallback logic generates fake data.
- **Fix plan**: Show a placeholder like "—" instead of inventing durations.

### 14. `Home.jsx` renders an `<Outlet>` that never produces content

- **Issue**: `Home` component has `<Outlet />` but is rendered at `/` with no nested routes.
- **File**: `frontend/src/components/Home/Home.jsx`, `frontend/src/main.jsx`
- **Root cause**: Misused Outlet in a non-layout route.
- **Fix plan**: Remove `<Outlet />` from `Home.jsx`.

### 15. `ProtectedRoute` redirects on any error, including network errors

- **Issue**: If `/api/v1/users/current-user` fails due to a network blip, user is kicked to `/Login`.
- **File**: `frontend/src/main.jsx`
- **Root cause**: `.catch(() => navigate('/Login'))` treats all errors as unauthenticated.
- **Fix plan**: Distinguish 401 from network/server errors; only redirect on 401.

### 16. Missing error/loading states on several pages

- **Trending.jsx**: only has a loading spinner; API errors silently logged, page stays blank.
- **ManageVideos.jsx**: API errors silently logged; no user-facing error state.
- **UserPage.jsx**: only shows generic "Failed to load user details" on missing user; video fetch errors ignored.
- **Fix plan**: Add error banners and empty states.

### 17. `NotificationBell` does not update unread count on real-time events correctly

- **Issue**: When a real-time notification arrives, `unreadCount` increments but there is no `isRead` field on the incoming object. The list may show stale read states.
- **File**: `frontend/src/components/Notifications/NotificationBell.jsx`
- **Root cause**: Assumes incoming notification shape matches fetched list exactly.
- **Fix plan**: Normalize incoming notification shape before appending to state.

---

## Minor UI Improvements

### 18. Sidebar navigation mixes absolute and relative paths

- **File**: `frontend/Layout.jsx`
- **Note**: `to: "/Home/feed"` and `to: "trending"` both work but are inconsistent. Standardize to absolute paths for clarity.

### 19. `ManageVideos` "Back to Dashboard" button goes to profile

- **File**: `frontend/src/components/Videos/ManageVideos.jsx`
- **Note**: Button says "Back to Dashboard" but navigates to `/Home/user`. Rename or change target.

### 20. Video duration helper is duplicated across components

- **Files**: `Library.jsx`, `Trending.jsx`, `feed.jsx`
- **Note**: Same `Math.floor(duration / 60)...` formatting logic repeated. Extract to a shared utility.

### 21. `Upload` form file input label does not clear after success

- **File**: `frontend/src/components/Videos/upload.jsx`
- **Note**: `videoFile` is reset to `null`, but the DOM `<input type="file">` retains its selected file. Add `e.target.value = ""` on change or a ref reset.

### 22. `Trending` empty state missing

- **File**: `frontend/src/components/Videos/Trending.jsx`
- **Note**: If `videos` is empty, nothing is rendered below the header. Add an empty-state message.

### 23. Hardcoded `/Home/${video._id}` navigation is brittle

- **Files**: Many components
- **Note**: Consider a central route-constants file to avoid typos when routes change.

---

## Summary of Recommended Priority Order

1. Fix history data source (`WatchHistory` collection, sorted by `watchedAt` desc).
2. Sort liked videos by `createdAt` desc on backend.
3. Add Dashboard link to sidebar and profile.
4. Remove duplicate branding in sidebar.
5. Make search bar functional.
6. Fix socket token source (httpOnly cookie issue).
7. Remove/repair dead `Videos.jsx` and `/Home/getVideos` route.
8. Pre-fill ManageAccount details.
9. Fix Login/Register branding and redirect.
10. Add missing error/loading states.
