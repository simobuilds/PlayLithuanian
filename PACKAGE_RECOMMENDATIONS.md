# Package Recommendations for Next Development Phase

## 🔒 Security & Middleware

### Essential Security
```bash
npm install helmet cors express-rate-limit dotenv
```
- **helmet**: Sets security HTTP headers to protect against common vulnerabilities
- **cors**: Handle Cross-Origin Resource Sharing if needed for API
- **express-rate-limit**: Prevent abuse with rate limiting on API endpoints
- **dotenv**: Manage environment variables (PORT, API keys, etc.)

## 🧪 Testing & Quality

### Testing Framework
```bash
npm install --save-dev jest supertest @types/jest
```
- **jest**: JavaScript testing framework for unit and integration tests
- **supertest**: HTTP assertions for API endpoint testing
- **@types/jest**: TypeScript definitions (if using TS in future)

### Code Quality
```bash
npm install --save-dev eslint prettier eslint-config-prettier
```
- **eslint**: Find and fix JavaScript code problems
- **prettier**: Code formatter for consistent style
- **eslint-config-prettier**: Disable ESLint rules that conflict with Prettier

## 🗄️ Database (Optional but Recommended)

### Lightweight Database Options

**Option 1: SQLite (Easiest for small scale)**
```bash
npm install better-sqlite3
```
- Perfect for user progress, statistics, and eventually user accounts
- No separate server needed, file-based database

**Option 2: MongoDB (For document-based storage)**
```bash
npm install mongoose
```
- Good for flexible schema, user profiles, learning analytics

**Option 3: PostgreSQL (For complex queries)**
```bash
npm install pg
```
- Best for complex relationships, analytics, and scalability

## 📊 Logging & Monitoring

### Logging
```bash
npm install winston morgan
```
- **winston**: Advanced logging library with multiple transports
- **morgan**: HTTP request logger middleware for Express

## 🔊 Audio & Speech Features

### Text-to-Speech (Pronunciation)
```bash
npm install say google-tts-api
```
- **say**: Cross-platform text-to-speech (requires system TTS)
- **google-tts-api**: Google Text-to-Speech API client

### Alternative: Web Speech API (Browser-based, no install needed)
- Use native browser `speechSynthesis` API (no package needed)

## 🎨 Frontend Enhancement

### Build Tools (Optional - if you want bundling)
```bash
npm install --save-dev vite @vitejs/plugin-html
```
- **vite**: Fast build tool and dev server
- Modern alternative to webpack, great for frontend bundling

### State Management (If app grows)
```bash
npm install zustand
```
- **zustand**: Lightweight state management (lighter than Redux)

## 👤 Authentication & User Management (Future)

### JWT Authentication
```bash
npm install jsonwebtoken bcryptjs
```
- **jsonwebtoken**: Create and verify JSON Web Tokens
- **bcryptjs**: Hash passwords securely

### Session Management
```bash
npm install express-session connect-redis
```
- **express-session**: Server-side session storage
- **connect-redis**: Redis store for sessions (optional)

## 📱 Progressive Web App (PWA)

### PWA Support
```bash
npm install --save-dev workbox-webpack-plugin
```
- **workbox-webpack-plugin**: Generate service worker for offline support
- Enable offline learning and app-like experience

## 🎯 Analytics & Tracking

### User Analytics
```bash
npm install analytics
```
- **analytics**: Lightweight analytics abstraction
- Track user progress, completion rates, error rates

## 🚀 Performance

### Caching
```bash
npm install node-cache redis
```
- **node-cache**: In-memory caching for dictionary/API responses
- **redis**: Advanced caching and session storage

### Compression
```bash
npm install compression
```
- **compression**: Gzip compression middleware (already in Express, but explicit control)

## 📦 Recommended Immediate Next Steps

### Phase 1: Security & Quality (High Priority)
```bash
npm install helmet cors express-rate-limit dotenv
npm install --save-dev eslint prettier eslint-config-prettier jest supertest
```

### Phase 2: Database & Persistence (Medium Priority)
```bash
npm install better-sqlite3
# or
npm install mongoose
```

### Phase 3: Audio Features (Feature Enhancement)
```bash
npm install google-tts-api
# Use browser SpeechSynthesis API for client-side
```

### Phase 4: User Accounts (Future)
```bash
npm install jsonwebtoken bcryptjs express-session
```

## 📝 Updated package.json Example

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0",
    "morgan": "^1.10.0",
    "better-sqlite3": "^9.2.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1",
    "eslint-config-prettier": "^9.1.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

## 🔧 Quick Setup Scripts

Add these to your `package.json` scripts:
```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write ."
  }
}
```

## 💡 Priority Recommendations

1. **Security packages** (helmet, cors, rate-limit) - Critical for production
2. **Testing** (jest, supertest) - Essential for maintaining code quality
3. **Code quality** (eslint, prettier) - Prevents bugs and keeps code clean
4. **Database** (better-sqlite3) - Needed for user progress persistence
5. **Logging** (winston, morgan) - Important for debugging and monitoring
