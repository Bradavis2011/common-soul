# Common Soul - Spiritual Healing Platform

A comprehensive platform connecting spiritual healers with seekers, built with React and Node.js.

## Features

- 🔐 User authentication for healers and customers
- 📅 Booking system with calendar integration
- 💳 Stripe payment processing
- 💬 Real-time messaging with Socket.IO
- ⭐ Review and rating system
- 🖼️ File upload with Cloudinary integration
- 👨‍💼 Admin panel for moderation
- 📱 Responsive design

## Tech Stack

**Frontend:**
- React 19
- Vite
- Tailwind CSS
- Socket.IO Client

**Backend:**
- Node.js
- Express.js
- Prisma ORM
- SQLite
- Socket.IO
- Cloudinary

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/bradavis2011/common-soul.git
cd common-soul
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables
Create `.env` files in both backend and frontend directories based on the `.env.example` files.

5. Initialize the database
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

6. Start the development servers
```bash
# Backend (from backend directory)
npm start

# Frontend (from frontend directory)
npm run dev
```

## Project Structure

```
common-soul/
├── backend/           # Node.js API server
│   ├── src/
│   │   ├── routes/    # API routes
│   │   ├── services/  # Business logic
│   │   └── middleware/# Express middleware
│   └── prisma/        # Database schema
└── frontend/          # React application
    ├── src/
    │   ├── components/# React components
    │   ├── pages/     # Application pages
    │   └── context/   # React contexts
    └── public/        # Static assets
```

## Contributing

This project is actively being developed. Please feel free to submit issues and pull requests.

## License

MIT License

