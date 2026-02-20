# Quick Delivery + E-commerce Backend

A production-grade backend API for a Quick Commerce (Q-Commerce) and E-commerce platform built with Node.js, TypeScript, MongoDB, and modern best practices.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Folder Structure](#folder-structure)
5. [Installation](#installation)
6. [Environment Configuration](#environment-configuration)
7. [Development](#development)
8. [Production Build](#production-build)
9. [Docker Deployment](#docker-deployment)
10. [API Endpoints](#api-endpoints)
11. [Database Indexing](#database-indexing)
12. [Security Practices](#security-practices)
13. [Order Transactions](#order-transactions)
14. [Future Scalability](#future-scalability)

---

## Project Overview

This platform enables:

- **Quick Commerce (10-30 min delivery)**: Customers can order products from nearby dark stores
- **E-commerce**: Traditional online shopping with standard delivery
- **Multi-role system**: Customers, Delivery Partners, and Admins
- **Real-time inventory management**: Stock tracking with reservation system
- **Geospatial queries**: Find nearest dark stores using MongoDB's 2dsphere index
- **Secure payments**: Simulated payment processing with webhook support
- **Media uploads**: Image and video handling via Cloudinary

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express** | Web framework |
| **TypeScript** | Type-safe development (strict mode) |
| **MongoDB + Mongoose** | Database and ODM |
| **Zod** | Runtime validation |
| **JWT** | Authentication (Access + Refresh tokens) |
| **Bcrypt** | Password hashing |
| **Multer** | File upload handling |
| **Cloudinary** | Media storage and optimization |
| **Morgan** | HTTP request logging |
| **Helmet** | Security headers |
| **Rate Limiting** | API protection |
| **CORS** | Cross-origin resource sharing |
| **Compression** | Response compression |
| **Winston** | Application logging |
| **Docker** | Containerization |

---

## Architecture

### Controller-Service-Repository Pattern

This project follows a clean, layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│                      Controllers                        │
│  - Handle HTTP requests/responses                       │
│  - Validate input using Zod schemas                     │
│  - Call services and return formatted responses         │
├─────────────────────────────────────────────────────────┤
│                       Services                          │
│  - Contain business logic                               │
│  - Orchestrate multiple repositories                    │
│  - Handle transactions                                  │
│  - Apply authorization rules                            │
├─────────────────────────────────────────────────────────┤
│                     Repositories                        │
│  - Database access layer                                │
│  - MongoDB/Mongoose queries                             │
│  - Handle data persistence                              │
└─────────────────────────────────────────────────────────┘
```

### Benefits

- **Separation of Concerns**: Each layer has a single responsibility
- **Testability**: Easy to unit test each layer independently
- **Maintainability**: Changes in one layer don't affect others
- **Reusability**: Services can be reused across different controllers

---

## Folder Structure

```
src/
├── config/                 # Configuration files
│   ├── env.ts             # Environment validation with Zod
│   ├── database.ts        # MongoDB connection
│   └── cloudinary.ts      # Cloudinary configuration
│
├── common/                 # Shared utilities and middleware
│   ├── errors/            # Custom error classes
│   ├── middleware/        # Express middleware
│   ├── utils/             # Helper functions
│   ├── constants/         # Application constants
│   └── types/             # TypeScript interfaces/enums
│
├── database/              # Database layer
│   └── models/            # Mongoose models with indexes
│
├── modules/               # Feature modules
│   ├── auth/              # Authentication (register, login, tokens)
│   ├── users/             # User management and middleware
│   ├── products/          # Product catalog
│   ├── dark-stores/       # Dark store management
│   ├── inventory/         # Stock management
│   ├── orders/            # Order processing with transactions
│   ├── payments/          # Payment processing
│   └── uploads/           # File upload handling
│
├── routes/                # Route aggregation
│   └── index.ts
│
├── app.ts                 # Express app configuration
└── server.ts              # Server entry point
```

---

## Installation

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 5.0
- npm or yarn

### Steps

1. **Clone the repository**

```bash
git clone <repository-url>
cd quick-delivery-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

---

## Environment Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/quick-delivery

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Cloudinary Configuration
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

**Security Notes:**

- JWT secrets must be at least 32 characters
- Use strong, randomly generated secrets in production
- Never commit `.env` files to version control
- Rotate secrets periodically

---

## Development

### Start Development Server

```bash
npm run dev
```

This uses `ts-node-dev` for hot reloading.

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Format with Prettier
npm run format

# Type checking
npm run typecheck
```

### API Base URL

```
http://localhost:3000/api/v1
```

### Health Check

```
GET http://localhost:3000/health
```

---

## Production Build

### Build

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

### Start Production Server

```bash
npm start
```

---

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Start all services**

```bash
docker-compose up -d
```

This starts:

- Application container (Node.js)
- MongoDB container with persistent volume

2. **View logs**

```bash
docker-compose logs -f app
```

3. **Stop services**

```bash
docker-compose down
```

4. **Stop and remove volumes**

```bash
docker-compose down -v
```

### Using Dockerfile Only

```bash
# Build image
docker build -t quick-delivery-api .

# Run container
docker run -p 3000:3000 --env-file .env quick-delivery-api
```

### Docker Features

- **Multi-stage build**: Smaller production image
- **Non-root user**: Security best practice
- **Health checks**: Automatic container monitoring
- **Volume persistence**: MongoDB data persists across restarts

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/auth/register` | Register new user | Public |
| POST | `/api/v1/auth/login` | Login user | Public |
| POST | `/api/v1/auth/refresh-token` | Refresh access token | Public |
| POST | `/api/v1/auth/logout` | Logout user | Authenticated |
| POST | `/api/v1/auth/logout-all` | Logout from all devices | Authenticated |
| GET | `/api/v1/auth/me` | Get current user | Authenticated |
| PATCH | `/api/v1/auth/change-password` | Change password | Authenticated |

### Products

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/products` | List products (with filters) | Public |
| GET | `/api/v1/products/:id` | Get product details | Public |
| GET | `/api/v1/products/categories` | Get all categories | Public |
| POST | `/api/v1/products` | Create product | Admin |
| PATCH | `/api/v1/products/:id` | Update product | Admin |
| DELETE | `/api/v1/products/:id` | Delete product (soft) | Admin |

### Dark Stores

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/dark-stores` | List dark stores | Public |
| GET | `/api/v1/dark-stores/:id` | Get store details | Public |
| GET | `/api/v1/dark-stores/nearest` | Find nearest stores | Public |
| POST | `/api/v1/dark-stores` | Create dark store | Admin |
| PATCH | `/api/v1/dark-stores/:id` | Update dark store | Admin |
| DELETE | `/api/v1/dark-stores/:id` | Delete dark store | Admin |
| PATCH | `/api/v1/dark-stores/:id/toggle` | Toggle store status | Admin |

### Inventory

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/inventory` | List inventory | Admin |
| GET | `/api/v1/inventory/:id` | Get inventory item | Admin |
| GET | `/api/v1/inventory/check` | Check availability | Admin |
| GET | `/api/v1/inventory/by-product-store` | Get by product & store | Admin |
| POST | `/api/v1/inventory` | Create inventory | Admin |
| PATCH | `/api/v1/inventory/:id` | Update inventory | Admin |
| PATCH | `/api/v1/inventory/:id/adjust` | Adjust stock | Admin |
| DELETE | `/api/v1/inventory/:id` | Delete inventory | Admin |

### Orders

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/orders` | Create order | Customer |
| GET | `/api/v1/orders/my-orders` | Get my orders | Customer |
| GET | `/api/v1/orders/:id` | Get order details | Authenticated |
| PATCH | `/api/v1/orders/:id/cancel` | Cancel order | Customer |
| GET | `/api/v1/orders` | List all orders | Admin |
| PATCH | `/api/v1/orders/:id/status` | Update order status | Admin |
| PATCH | `/api/v1/orders/:id/assign` | Assign delivery partner | Admin |
| GET | `/api/v1/orders/delivery/my-assignments` | Get my deliveries | Delivery |

### Payments

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/payments` | Create payment | Customer |
| GET | `/api/v1/payments/my-payments` | Get my payments | Customer |
| GET | `/api/v1/payments/:id` | Get payment details | Authenticated |
| GET | `/api/v1/payments/by-order/:orderId` | Get payment by order | Authenticated |
| GET | `/api/v1/payments/stats` | Get payment stats | Authenticated |
| GET | `/api/v1/payments` | List all payments | Admin |
| POST | `/api/v1/payments/:id/process` | Process payment | Admin |
| POST | `/api/v1/payments/:id/refund` | Refund payment | Admin |
| POST | `/api/v1/payments/webhook` | Payment webhook | Public |

### Uploads

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/uploads/image` | Upload single image | Admin |
| POST | `/api/v1/uploads/images` | Upload multiple images | Admin |
| POST | `/api/v1/uploads/video` | Upload video | Admin |
| POST | `/api/v1/uploads/delete` | Delete file | Admin |
| POST | `/api/v1/uploads/delete-multiple` | Delete multiple files | Admin |
| POST | `/api/v1/uploads/signed-url` | Generate signed URL | Admin |

---

## Database Indexing

### Indexes by Collection

| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| **Users** | `email` | Unique | Fast login, prevent duplicates |
| **Users** | `role` | Standard | Filter by user role |
| **Users** | `location` | 2dsphere | Geospatial queries |
| **Products** | `name + description` | Text | Full-text search |
| **Products** | `category` | Standard | Category filtering |
| **Products** | `isActive + deletedAt` | Compound | Soft delete queries |
| **DarkStores** | `location` | 2dsphere | Find nearest stores |
| **DarkStores** | `email` | Unique | Prevent duplicate stores |
| **Inventory** | `productId + darkStoreId` | Compound + Unique | Unique inventory per store |
| **Orders** | `userId + createdAt` | Compound | User order history |
| **Orders** | `status` | Standard | Filter by status |
| **Orders** | `darkStoreId` | Standard | Store order queries |
| **Orders** | `deliveryPartnerId` | Standard | Delivery partner queries |
| **Payments** | `orderId` | Unique | One payment per order |
| **Payments** | `userId` | Standard | User payment history |
| **Payments** | `status` | Standard | Filter by status |

### Performance Benefits

- **Text search**: Products can be searched by name/description
- **Geospatial queries**: Find stores within X kilometers
- **Compound queries**: Efficient filtering by multiple criteria
- **Unique constraints**: Prevent duplicate data

---

## Security Practices

### Implemented Security Measures

1. **Helmet.js**: Security headers (XSS, CSRF, clickjacking protection)
2. **Rate Limiting**: Prevent brute force attacks
   - General API: 100 requests per 15 minutes
   - Auth endpoints: 5 requests per 15 minutes
3. **CORS**: Configurable cross-origin policies
4. **JWT Security**:
   - Short-lived access tokens (15 minutes)
   - Long-lived refresh tokens (7 days) stored hashed
   - Secure cookie options (httpOnly, secure, sameSite)
5. **Password Security**:
   - Bcrypt with salt rounds 12
   - Minimum 8 characters
6. **Input Validation**:
   - Zod schemas for all inputs
   - ObjectId validation to prevent injection
7. **NoSQL Injection Prevention**:
   - Mongoose parameterized queries
   - Input sanitization
8. **Error Handling**:
   - No stack traces in production
   - Generic error messages for security
9. **File Upload Security**:
   - File type validation
   - File size limits
   - Temporary file cleanup

---

## Order Transactions

### Transaction Flow

The order module uses MongoDB transactions to ensure data consistency:

```
┌────────────────────────────────────────────────────────────┐
│                    Order Creation Flow                      │
├────────────────────────────────────────────────────────────┤
│ 1. Start MongoDB Session                                    │
│ 2. Find nearest dark store (geospatial query)              │
│ 3. For each item:                                          │
│    a. Verify product exists and is active                  │
│    b. Check stock availability                             │
│    c. Reserve stock (atomic operation)                     │
│ 4. Create order document                                   │
│ 5. Commit transaction                                      │
│ 6. If any step fails → Rollback all changes               │
└────────────────────────────────────────────────────────────┘
```

### Stock Reservation System

```
┌────────────────────────────────────────────────────────────┐
│                    Stock States                             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   Total Quantity: 100                                      │
│   Reserved Quantity: 30  ← Orders in progress              │
│   Available Quantity: 70  ← Can be ordered                 │
│                                                             │
│   Order Placed → Reserve Stock                             │
│   Order Confirmed → Deduct from stock + release reserve    │
│   Order Cancelled → Release reserved stock                 │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Order Status State Machine

```
PLACED → CONFIRMED → PACKED → OUT_FOR_DELIVERY → DELIVERED
   ↓         ↓          ↓              ↓
CANCELLED  CANCELLED  CANCELLED     CANCELLED
```

**Valid Transitions:**

- PLACED → CONFIRMED, CANCELLED
- CONFIRMED → PACKED, CANCELLED
- PACKED → OUT_FOR_DELIVERY, CANCELLED
- OUT_FOR_DELIVERY → DELIVERED, CANCELLED
- DELIVERED → (terminal state)
- CANCELLED → (terminal state)

---

## Future Scalability

### Horizontal Scaling

1. **MongoDB Replica Set**: Read replicas for better performance
2. **Redis Caching**: Cache frequently accessed data
   - Product listings
   - User sessions
   - Inventory counts
3. **Load Balancing**: Multiple API server instances
4. **CDN**: Serve static assets and images

### Microservices Architecture

Potential service split:

```
┌─────────────────────────────────────────────────────────┐
│                      API Gateway                        │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Product    │  │    Order     │  │   Payment    │
│   Service    │  │   Service    │  │   Service    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────────────┐
                    │   MongoDB    │
                    │   Cluster    │
                    └──────────────┘
```

### Additional Features

1. **Real-time Updates**: WebSocket/Socket.io for order tracking
2. **Push Notifications**: Firebase Cloud Messaging
3. **Analytics**: Aggregation pipelines for business insights
4. **Search Engine**: Elasticsearch for advanced product search
5. **Message Queue**: RabbitMQ/Redis for async processing
6. **Monitoring**: Prometheus + Grafana for metrics

---

## License

MIT License - feel free to use this project for learning or commercial purposes.

---

## Support

For issues or questions, please create an issue in the repository.

---

**Built with ❤️ for scalable Quick Commerce solutions**
