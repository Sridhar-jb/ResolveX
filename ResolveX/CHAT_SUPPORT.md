# ResolveX Customer Support Chat

This build includes a two-way customer support chat between users and administrators.

## User side
- Open **Customer Support** from the sidebar or the floating chat button.
- Switch between **AI Assistant** and **Team Support**.
- Team Support messages are saved in MongoDB and are visible to the admin.
- Admin replies appear automatically while the conversation is open.
- Opening Team Support marks admin replies as read.
- A user can delete individual messages they sent or delete their entire support chat.

## Admin side
- Open **AI Assist** from the admin sidebar or the floating chat button.
- The admin sees all customer conversations in the support inbox.
- Unread customer messages are counted and marked read when that conversation is opened.
- The admin can reply directly to any customer.
- The admin can delete individual messages or clear the complete conversation.
- The inbox is expanded for a large-screen, full workspace layout and remains responsive on mobile.

## API routes

### User
- `GET /api/chat`
- `POST /api/chat`
- `GET /api/chat/unread-count`
- `POST /api/chat/ai`
- `DELETE /api/chat/:messageId`
- `DELETE /api/chat`

### Admin
- `GET /api/admin/chat/conversations`
- `GET /api/admin/chat/customers`
- `GET /api/admin/chat/unread-count`
- `GET /api/admin/chat/:userId`
- `POST /api/admin/chat/:userId`
- `DELETE /api/admin/chat/:userId/:messageId`
- `DELETE /api/admin/chat/:userId`

The admin routes are protected by both authentication and the admin-role middleware. User routes only operate on the authenticated user's own conversation.
