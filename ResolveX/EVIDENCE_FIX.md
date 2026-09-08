# ResolveX Evidence Image Fix

The evidence image was not loading after deployment because the previous implementation stored uploads on the backend's local `server/uploads` folder. Render's filesystem is ephemeral, so files can disappear after a restart/redeploy.

This version stores **new evidence images inside MongoDB** and returns the image as a data URL only when a complaint's detail view is opened. The complaint list endpoints exclude the binary image data to keep list responses small.

## Important

1. Deploy the updated `server` to the same Render backend used by the Vercel frontend.
2. Deploy the updated `client` to Vercel.
3. New complaint evidence images up to **10 MB** will persist in MongoDB.
4. Existing old complaints whose `image` is only `/uploads/<filename>` will work only if that old file still exists on the backend. If the old Render file is gone, it cannot be recovered from the database because only its path was stored.
5. Test by submitting a **new complaint with an image**, then open that complaint with **View**.

The complaint permissions remain:
- Admin: can view every complaint.
- User: can view only their own complaint.
