# Habit Tracker AI Instructions

## Architecture Overview
Full-stack habit tracking application with React frontend (Vite) and Node.js/Express backend using SQLite database. Client proxies `/api` requests to server. Authentication via JWT tokens stored in localStorage.

## Key Directories & Files
- `client/src/components/`: UI components organized by feature (habits/, layout/, logs/) with CSS modules
- `client/src/pages/`: Route-based pages (Dashboard.jsx, HabitsPage.jsx)
- `client/src/services/`: API service layer (api.js for HTTP methods, habitService.js for habit operations)
- `client/src/context/AuthContext.jsx`: React context for authentication state
- `server/src/controllers/`: Express route handlers (habitController.js, authController.js)
- `server/src/db/`: Database setup (database.js) and schema (schema.js with SQLite tables: users, habits, habit_logs)
- `server/src/middleware/auth.js`: JWT verification middleware

## Development Workflow
- **Start server**: `cd server && npm run dev` (runs on port 3000 with nodemon)
- **Start client**: `cd client && npm run dev` (runs on port 5173, proxies /api to localhost:3000)
- **Build client**: `cd client && npm run build`
- **Database**: SQLite file `habit-tracker.db` auto-created on server start

## Coding Patterns
- **API Calls**: Use `api.js` methods (get/post/put/delete) which automatically include JWT auth headers and handle ApiError responses
- **Database Queries**: Use prepared statements in controllers (e.g., `db.prepare().run/get/all()`)
- **Validation**: Server-side validation with express-validator in controllers
- **Authentication**: Check `req.user.id` in protected routes after auth middleware
- **Components**: Pair JSX with CSS modules (e.g., HabitCard.jsx + HabitCard.css)
- **Routing**: React Router with custom PrivateRoute/PublicRoute components for auth guards
- **Error Handling**: Client throws ApiError on non-2xx responses; server returns JSON errors

## Examples
- **Create habit**: `api.post('/habits', { name: 'Exercise', trackingType: 'completion' })`
- **Fetch user habits**: `api.get('/habits')` returns array with parsed `target_days` JSON
- **Log habit**: `api.post('/logs', { habitId: 1, date: '2024-01-01', completed: true })`
- **Auth flow**: Login returns token; store in localStorage; AuthContext provides `isAuthenticated` and `user`