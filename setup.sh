#!/bin/bash
# Quick setup script for Open-Antigravity

set -e

echo "🚀 Setting up Open-Antigravity..."

# Check prerequisites
check_command() {
  if ! command -v $1 &> /dev/null; then
    echo "❌ $1 is not installed. Please install it first."
    exit 1
  fi
}

echo "📋 Checking prerequisites..."
check_command node
check_command docker
check_command docker-compose
check_command git

echo "✅ All prerequisites found!"

# Setup environment files
echo "📝 Setting up environment files..."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ Created .env"
fi

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "✓ Created backend/.env"
fi

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo "✓ Created frontend/.env"
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
npm install
echo "✓ Backend dependencies installed"

cd ../frontend
npm install
echo "✓ Frontend dependencies installed"

cd ..

# Display next steps
echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure API keys in backend/.env"
echo "2. Run: docker-compose up -d"
echo "3. Visit: http://localhost:3000"
echo ""
echo "Or for local development:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm start"
echo ""
