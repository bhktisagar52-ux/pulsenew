# Fix Media Disappearance on Server Restart

## Tasks
- [x] Update Multer destination in backend/routes/auth.js to use configurable path
- [x] Update Multer destination in backend/routes/posts.js to use configurable path
- [x] Update Multer destination in backend/routes/stories.js to use configurable path
- [x] Update static file serving in backend/server.js to use configurable path
- [x] Ensure upload directory exists with proper permissions
- [x] Fix mixed content error by using dynamic protocol/host for image URLs
- [ ] Test file uploads and serving in development
- [ ] Set UPLOAD_PATH environment variable in production to a permanent folder
- [ ] Test in production environment
