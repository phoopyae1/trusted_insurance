# Integration Management Setup

## MongoDB Setup

The integration management feature uses MongoDB to store integration configurations (context keys and script tags).

### 1. Install MongoDB Dependencies

```bash
npm install mongoose
```

### 2. Configure MongoDB Connection

Add the following to your `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/trusted_insurance
```

For MongoDB Atlas (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trusted_insurance?retryWrites=true&w=majority
```

### 3. Start MongoDB

If using local MongoDB:
```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Restart Backend Server

The MongoDB connection will be established automatically when the server starts.

## API Endpoints

- `GET /api/integrations` - Get all integrations (ADMIN, AGENT)
- `GET /api/integrations/:id` - Get single integration (ADMIN, AGENT)
- `POST /api/integrations` - Create integration (ADMIN, AGENT)
- `PUT /api/integrations/:id` - Update integration (ADMIN, AGENT)
- `DELETE /api/integrations/:id` - Delete integration (ADMIN only)

## Frontend

Access the integration management page at `/integration` (requires ADMIN or AGENT role).
