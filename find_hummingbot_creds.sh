#!/bin/bash

# Script to find Hummingbot API credentials
# Usage: ./find_hummingbot_creds.sh [hummingbot_directory]

HUMMINGBOT_DIR="${1:-$HOME/hummingbot_files}"

echo "🔍 Searching for Hummingbot API credentials..."
echo "📁 Directory: $HUMMINGBOT_DIR"
echo ""

# Check if directory exists
if [ ! -d "$HUMMINGBOT_DIR" ]; then
    echo "❌ Directory not found: $HUMMINGBOT_DIR"
    echo "💡 Usage: ./find_hummingbot_creds.sh /path/to/hummingbot_files"
    exit 1
fi

# Check docker-compose.yml
echo "1️⃣ Checking docker-compose.yml..."
if [ -f "$HUMMINGBOT_DIR/docker-compose.yml" ]; then
    echo "✅ Found docker-compose.yml"
    echo "--- API-related environment variables ---"
    grep -i "api\|auth\|user\|pass\|key" "$HUMMINGBOT_DIR/docker-compose.yml" | grep -v "^#" | head -20
    echo ""
else
    echo "❌ docker-compose.yml not found"
    echo ""
fi

# Check .env file
echo "2️⃣ Checking .env file..."
if [ -f "$HUMMINGBOT_DIR/.env" ]; then
    echo "✅ Found .env"
    echo "--- API-related variables ---"
    grep -i "api\|auth\|user\|pass\|key" "$HUMMINGBOT_DIR/.env" | grep -v "^#" | head -20
    echo ""
else
    echo "❌ .env file not found"
    echo ""
fi

# Check if container is running
echo "3️⃣ Checking running containers..."
if docker ps | grep -q "hummingbot-api"; then
    echo "✅ Hummingbot API container is running"
    CONTAINER_NAME=$(docker ps | grep "hummingbot-api" | awk '{print $NF}' | head -1)
    echo "📦 Container: $CONTAINER_NAME"
    echo ""
    
    echo "4️⃣ Checking environment variables inside container..."
    docker exec "$CONTAINER_NAME" env | grep -i "api\|auth\|user\|pass\|key" | head -20
    echo ""
    
    echo "5️⃣ Checking for .env file inside container..."
    if docker exec "$CONTAINER_NAME" test -f /app/.env; then
        echo "✅ Found /app/.env"
        docker exec "$CONTAINER_NAME" cat /app/.env | grep -i "api\|auth\|user\|pass\|key" | head -20
    else
        echo "❌ /app/.env not found"
    fi
    echo ""
else
    echo "❌ Hummingbot API container is not running"
    echo "💡 Start it with: cd $HUMMINGBOT_DIR && docker-compose up -d hummingbot-api"
    echo ""
fi

# Test API endpoint
echo "6️⃣ Testing API endpoint..."
if curl -s http://localhost:8000/bot-orchestration/status > /dev/null 2>&1; then
    echo "✅ API is reachable at http://localhost:8000"
    echo "📡 Testing authentication..."
    
    # Try without auth
    RESPONSE=$(curl -s http://localhost:8000/bot-orchestration/status)
    if echo "$RESPONSE" | grep -q "Not authenticated"; then
        echo "⚠️  API requires authentication"
        echo "💡 Try: curl -u username:password http://localhost:8000/bot-orchestration/status"
    else
        echo "✅ API responded: $RESPONSE"
    fi
else
    echo "❌ API not reachable at http://localhost:8000"
    echo "💡 Make sure Hummingbot API is running"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Next steps:"
echo "1. Note the credentials found above"
echo "2. Add them to Trading Bridge environment variables:"
echo "   - HUMMINGBOT_API_URL=http://localhost:8000"
echo "   - HUMMINGBOT_API_USERNAME=<found_username>"
echo "   - HUMMINGBOT_API_PASSWORD=<found_password>"
echo "3. If API is local, set up tunnel (ngrok/tailscale) for Railway"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
