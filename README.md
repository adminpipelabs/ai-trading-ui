# Pipe Labs - AI Trading Platform UI

AI-first trading interface for managing multi-tenant crypto trading operations.

## Features

- **AI-First Interface** - Conversational UI as the primary interaction method
- **Role-Based Access**
  - **Admin**: Full platform access, all clients, global metrics
  - **Client**: Scoped access to own tokens, balances, and P&L only
- **Rich Responses** - Cards, charts, tables, and actionable buttons
- **Saved Prompts** - Pin frequently used queries
- **Quick Actions** - One-click common operations
- **Download/Export** - CSV and PDF report generation

## Tech Stack

- React 18
- Tailwind CSS
- React Router
- Recharts (charts)
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm start
```

### Environment Variables

```
REACT_APP_API_URL=https://your-backend-url.railway.app
```

## Deployment

### Railway

1. Create new project from GitHub repo
2. Add environment variable: `REACT_APP_API_URL`
3. Railway auto-detects Dockerfile and deploys

### Manual Build

```bash
npm run build
# Serve the /build folder
```

## Project Structure

```
src/
├── components/
│   ├── AIConsole.jsx      # Main chat interface
│   ├── Header.jsx         # Top navigation
│   ├── MetricsBar.jsx     # Overview metrics
│   ├── QuickActions.jsx   # Action buttons
│   ├── ResponseCard.jsx   # Rich response cards
│   └── SavedPrompts.jsx   # Sidebar with saved queries
├── contexts/
│   └── AuthContext.jsx    # Auth & role management
├── pages/
│   ├── Dashboard.jsx      # Main dashboard
│   └── Login.jsx          # Login page
├── services/
│   └── api.js             # API client
├── App.jsx                # Root component
└── index.js               # Entry point
```

## Admin vs Client Views

### Admin Can:
- View all clients and their data
- See global metrics (total volume, P&L, etc.)
- Start/stop bots for any client
- Configure strategies
- Generate platform-wide reports
- Manage client accounts

### Client Can:
- View only their own tokens and balances
- See their own P&L and trade history
- View status of bots on their tokens (no control)
- Download their own reports
- Chat with AI about their portfolio only

## License

Private - Pipe Labs
