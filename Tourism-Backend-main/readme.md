# Tourism Backend

This is a Node.js & Express backend project connected to MongoDB.

## Getting Started

First, install dependencies:

```bash
npm install
# or
yarn install

npm run dev
# or
yarn dev

Create a .env file in the root with the following:

PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/tourism_db
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
NODE_ENV=development

