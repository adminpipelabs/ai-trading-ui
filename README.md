# Pipe Labs - AI Trading Platform UI

AI-first trading interface for managing multi-tenant crypto trading operations.

## Features

- **AI-First Interface** - Conversational UI as the primary interaction method
- **Role-Based Access**
  - **Admin**: Full platform access, client management, global metrics
  - **Client**: Scoped access to own tokens, balances, and P&L only
- **Client Management** - Add, edit, delete clients with exchange API keys
- **Light/Dark Theme** - Toggle between themes
- **Real-time Data** - Connect to Trading Bridge for live prices

## Tech Stack

- React 18
- Tailwind CSS (utility classes)
- Lucide React (icons)
- React Router

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm start
```

## Environment Variables

```
REACT_APP_API_URL=https://backend-pipelabs-dashboard-production.up.railway.app
REACT_APP_TRADING_BRIDGE_URL=https://trading-bridge-production.up.railway.app
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── AddClientModal.jsx
│   ├── ClientManagement.jsx
│   ├── MetricCard.jsx
│   ├── Message.jsx
│   └── Sidebar.jsx
├── contexts/
│   ├── AuthContext.jsx   # Auth & role management
│   └── ThemeContext.jsx  # Theme management
├── pages/
│   ├── AdminDashboard.jsx  # Admin view (includes all features)
│   ├── ClientDashboard.jsx # Client view (limited features)
│   └── Login.jsx           # Login page
├── services/
│   └── api.js            # API client for backend & trading bridge
├── constants/
│   └── index.js          # Exchange list, status options, etc.
├── styles/
│   └── globals.css       # Global styles & animations
├── App.jsx               # Main app with routing
└── index.js              # Entry point
```

## Admin Features

- View all clients and metrics
- Add new clients with API keys
- Manage client exchanges (BitMart, Binance, etc.)
- Assign trading pairs to clients
- Send invite emails
- View global P&L and volume

## Client Features

- View assigned trading pairs
- Check balances and P&L
- AI chat for portfolio queries
- View-only access (no trading controls)

## Deployment

### Railway

1. Create new project from GitHub repo
2. Add environment variables
3. Railway auto-detects and deploys

### Dockerfile

The included Dockerfile builds and serves the app:

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
```

## API Integration

The app connects to two services:

### Backend API (`REACT_APP_API_URL`)
- Authentication
- Client management
- Reports

### Trading Bridge (`REACT_APP_TRADING_BRIDGE_URL`)
- Market data (prices, orderbooks)
- Portfolio data
- Order management

## License

Private - Pipe Labs
# Railway deploy trigger Wed Jan 28 19:34:37 CST 2026
