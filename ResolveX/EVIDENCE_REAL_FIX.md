# ResolveX - Evidence Image Real Fix

This version fixes the evidence viewer at three levels:

1. New uploads use `multer.memoryStorage()` and are saved in MongoDB as `imageData` + `imageContentType`, so Render's ephemeral filesystem is not required.
2. `/api/complaints/:id` converts Mongo/Mongoose/BSON binary forms to a browser-safe image data URL.
3. `/api/complaints/:id/evidence` returns real image bytes with `Content-Type`, `Content-Length`, and `Content-Disposition: inline` headers.
4. The React viewer checks the HTTP status and content type before creating an object URL, handles legacy `/uploads/...` files, and shows a clear fallback instead of a broken image element.

## Important deployment requirement

Deploy the **server from this ZIP** to Render and redeploy the frontend from the same ZIP to Vercel. If Vercel is connected to an older Render backend, the UI will still receive the old behavior.

For Vercel:

`VITE_API_URL=https://resolvex-api.onrender.com/api`

After changing environment variables, redeploy.

## Existing old images

Complaints created by the old version may contain only `/uploads/<filename>`. Those images work only if the old file still exists on the server. If Render already removed that file, its bytes were not stored in the database and cannot be reconstructed. Upload a new image for those old complaints.

## New uploads

New evidence images are saved in MongoDB and should remain available after Render restarts/redeploys, subject to MongoDB's document size limit. The upload limit is 10 MB.
