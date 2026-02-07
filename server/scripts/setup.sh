#!/bin/bash
# scripts/setup.sh

echo "🚀 Setting up ProcessMail Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongosh &> /dev/null; then
    echo "⚠️  MongoDB shell not found. Please ensure MongoDB is installed and running"
else
    if ! mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        echo "⚠️  MongoDB is not running. Please start MongoDB"
    fi
fi

# Check if Redis is running
if ! command -v redis-cli &> /dev/null; then
    echo "⚠️  Redis CLI not found. Please ensure Redis is installed and running"
else
    if ! redis-cli ping &> /dev/null; then
        echo "⚠️  Redis is not running. Please start Redis"
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs uploads

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your configuration"
echo "2. Run MongoDB: mongod"
echo "3. Run Redis: redis-server"
echo "4. Seed database: npm run seed"
echo "5. Start development server: npm run dev"
echo ""
echo "🔗 API will be available at: http://localhost:3000"
echo "📊 Health check: http://localhost:3000/api/health"