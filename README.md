# Social Media App - Buddy Script

A full-stack social media application built with Next.js 16, TypeScript, Prisma, and PostgreSQL. This application features user authentication, post creation, comments, replies, likes, and is designed to scale to millions of posts with optimized performance and security.

## 🚀 Features

### Core Functionality

- **User Authentication**: Secure registration and login with JWT tokens
- **Post Management**: Create posts with text and/or images
- **Social Interactions**:
  - Like/unlike posts, comments, and replies
  - Comment on posts
  - Reply to comments
  - View who liked content
- **Protected Routes**: Feed page requires authentication
- **Real-time Updates**: Dynamic post loading with pagination

### Security Features

- **Password Hashing**: bcryptjs with 12 rounds
- **JWT Authentication**: Secure token-based authentication
- **HttpOnly Cookies**: Prevents XSS attacks
- **Input Sanitization**: XSS prevention for all user inputs
- **File Upload Validation**: Type and size validation for images
- **Rate Limiting**: Prevents abuse on all API endpoints
- **Protected API Routes**: Authentication required for sensitive operations

### Performance Optimizations

- **Database Indexing**: Optimized indexes for fast queries
- **Cursor-based Pagination**: Efficient pagination for millions of posts
- **Query Optimization**: Selective field fetching, batch queries
- **Connection Pooling**: Configured PostgreSQL connection pool
- **Optimized API Responses**: Limited data transfer, efficient data structures

## 🛠️ Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Bootstrap 5** - UI framework
- **React 19** - UI library

### Backend

- **Next.js API Routes** - Server-side API endpoints
- **Prisma ORM** - Database toolkit and query builder
- **PostgreSQL** - Relational database (Neon)
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### Validation & Security

- **Zod** - Schema validation
- **Custom Security Utilities** - Rate limiting, input sanitization, file validation

## 📁 Project Structure

```
social-media-app/
├── prisma/
│   ├── schema.prisma          # Database schema with indexes
│   └── migrations/             # Database migrations
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── posts/          # Post endpoints
│   │   │   ├── comments/       # Comment endpoints
│   │   │   └── replies/       # Reply endpoints
│   │   ├── feed/              # Feed page (protected)
│   │   ├── login/             # Login page
│   │   └── register/          # Registration page
│   ├── components/
│   │   ├── posts/             # Post-related components
│   │   └── forms/             # Form components
│   └── lib/
│       ├── auth.ts            # JWT authentication utilities
│       ├── prisma.ts          # Prisma client singleton
│       ├── security.ts        # Security utilities (rate limiting, sanitization)
│       └── pagination.ts      # Pagination utilities
└── public/
    └── uploads/               # User-uploaded images
```

## 🗄️ Database Schema

### Models

- **User**: Email, password (hashed), relationships
- **Post**: Content, image URL, author, timestamps
- **Comment**: Content, post reference, author
- **Reply**: Content, comment reference, author
- **Like**: Polymorphic (posts, comments, replies)

### Indexes

Optimized indexes for performance:

- Post: `authorId`, `createdAt`, `[authorId, createdAt]`
- Comment: `postId`, `[postId, createdAt]`, `authorId`
- Reply: `commentId`, `[commentId, createdAt]`, `authorId`
- Like: `userId`, `postId`, `commentId`, `replyId`

## 🔐 Security Decisions

### Authentication

- **JWT Tokens**: Stateless authentication for scalability
- **HttpOnly Cookies**: Prevents JavaScript access to tokens (XSS protection)
- **Secure Cookies**: Enabled in production (HTTPS only)
- **Token Expiration**: 7 days (configurable via `JWT_EXPIRES_IN`)

### Password Security

- **bcryptjs**: Industry-standard password hashing
- **12 Rounds**: Balance between security and performance
- **No Plain Text Storage**: Passwords never stored in plain text

### Input Validation

- **Zod Schemas**: Type-safe validation on both client and server
- **Input Sanitization**: Removes HTML tags, limits length
- **File Validation**: Type checking (JPEG, PNG, GIF, WebP), size limits (5MB)

### Rate Limiting

- **In-Memory Store**: Simple rate limiting (use Redis in production)
- **Per-Endpoint Limits**:
  - Posts GET: 100 requests/minute
  - Post Creation: 10 posts/minute
  - Comments GET: 200 requests/minute
  - Comment/Reply Creation: 30/minute

## ⚡ Performance Decisions

### Database Optimization

- **Indexes**: Strategic indexes on frequently queried fields
- **Composite Indexes**: Multi-column indexes for common query patterns
- **Selective Queries**: Only fetch required fields
- **Batch Queries**: Reduce N+1 query problems

### Pagination

- **Cursor-based**: Uses post ID for pagination (O(1) complexity)
- **No OFFSET**: Avoids performance degradation with large datasets
- **Default Page Size**: 20 items (configurable, max 100)

### Query Optimization

- **Batch Like Queries**: Single query to check all user likes
- **Limited likedBy**: Only fetch first 10 users who liked (prevents huge responses)
- **Separate Queries**: Optimized queries for pagination vs. initial load

### Connection Pooling

- **Max Connections**: 20 concurrent connections
- **Idle Timeout**: 30 seconds
- **Connection Timeout**: 10 seconds

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Neon account)
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd social-media-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
```

4. **Set up the database**

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (or use migrations)
npm run db:push

# Optional: Open Prisma Studio to view data
npm run db:studio
```

5. **Run the development server**

```bash
npm run dev
```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

## 🔄 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Posts

- `GET /api/posts` - Get paginated posts (supports `cursor` and `limit` query params)
- `POST /api/posts` - Create new post (protected, requires authentication)
- `POST /api/posts/[postId]/like` - Like/unlike a post (protected)
- `GET /api/posts/[postId]/comments` - Get comments for a post
- `POST /api/posts/[postId]/comments` - Create comment (protected)

### Comments

- `POST /api/comments/[commentId]/like` - Like/unlike a comment (protected)
- `POST /api/comments/[commentId]/replies` - Create reply (protected)

### Replies

- `POST /api/replies/[replyId]/like` - Like/unlike a reply (protected)

## 🎨 UI/UX Decisions

- **Bootstrap 5**: Familiar, responsive design system
- **Poppins Font**: Modern, readable typography
- **Error Boundaries**: User-friendly error handling
- **Loading States**: Clear feedback during async operations
- **Protected Routes**: Automatic redirect to login when unauthenticated
- **Infinite Scroll**: "Load More" button for pagination

## 🚀 Production Considerations

### Recommended Improvements

1. **Rate Limiting**: Replace in-memory store with Redis
2. **File Storage**: Use cloud storage (AWS S3, Cloudflare R2) with CDN
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Monitoring**: Add APM and error tracking (Sentry)
5. **Security Headers**: Add CSP, CSRF protection, security headers
6. **Database**: Consider read replicas for read-heavy workloads

### Environment Variables

Ensure these are set in production:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong, random secret key
- `JWT_EXPIRES_IN` - Token expiration time
- `NODE_ENV=production` - Enables production optimizations

## 📊 Scalability

This application is designed to handle:

- **Millions of Posts**: Cursor-based pagination ensures consistent performance
- **High Read Load**: Optimized indexes and query patterns
- **Concurrent Users**: Connection pooling and efficient queries
- **Large Datasets**: No performance degradation with data growth

## 🤝 Contributing

This is a project for assessment purposes. For production use, consider:

- Adding comprehensive tests
- Implementing CI/CD pipeline
- Adding monitoring and logging
- Security audit and penetration testing
- Performance testing under load

## 📄 License

This project is private and for assessment purposes.

---

**Built with ❤️ using Next.js, TypeScript, Prisma, and PostgreSQL**
