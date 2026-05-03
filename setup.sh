#!/bin/bash
# ============================================
# OpenScholar AI - Quick Setup Script
# ============================================

echo ""
echo "╔════════════════════════════════════════╗"
echo "║       OPENSCHOLAR AI - SETUP           ║"
echo "║       Team SCAM*€₹$ · MS RIT           ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Install backend
echo "📦 Installing backend dependencies..."
cd backend && npm install
echo "✅ Backend ready"

# Create .env from example if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📝 Created .env file - please configure it!"
fi

cd ..

# Install frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend && npm install
echo "✅ Frontend ready"

cd ..

echo ""
echo "════════════════════════════════════════"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env with your API keys"
echo "  2. Run backend:  cd backend && npm start"
echo "  3. Run frontend: cd frontend && npm run dev"
echo "  4. Open http://localhost:3000"
echo "  5. Click '▶ Run Pipeline'"
echo "════════════════════════════════════════"
echo ""
