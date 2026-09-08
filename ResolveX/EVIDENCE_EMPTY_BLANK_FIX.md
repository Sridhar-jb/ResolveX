# ResolveX evidence image fix

Fixed the complaint-view evidence logic so newly uploaded persistent images (stored in MongoDB) are detected even when `image` is an empty legacy path and `imageContentType` is populated.

The complaint view now:
- Uses inline `data:` evidence when available.
- Calls `GET /api/complaints/:id/evidence` when a persistent upload is indicated by `imageContentType` or a legacy image path.
- Shows "No evidence attached" only when neither image metadata nor image path exists.
- Keeps the authenticated evidence request so protected evidence works on Vercel/Render.

Important: existing legacy uploads whose actual file was deleted from an ephemeral Render filesystem cannot be recovered automatically. Re-upload those images once; new uploads are stored in MongoDB.
