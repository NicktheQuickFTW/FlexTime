#!/bin/bash

# Build script for Constraint Management API v2

echo "🔨 Building Constraint Management API v2..."

# Check if TypeScript is installed
if ! command -v tsc &> /dev/null; then
    echo "❌ TypeScript compiler not found. Installing..."
    npm install -g typescript
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Compile TypeScript
echo "📦 Compiling TypeScript..."
tsc -p tsconfig.json

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Output directory: ./dist"
    
    # List compiled files
    echo "📄 Compiled files:"
    find dist -name "*.js" -type f | head -20
else
    echo "❌ Build failed!"
    exit 1
fi

# Create index file for CommonJS compatibility
echo "📝 Creating CommonJS compatibility layer..."
cat > dist/index.js << 'EOF'
// CommonJS compatibility layer
const constraintAPI = require('./index');

// Export for CommonJS
module.exports = constraintAPI;
module.exports.createConstraintAPI = constraintAPI.createConstraintAPI;
module.exports.initializeConstraintAPI = constraintAPI.initializeConstraintAPI;
module.exports.constraintAPIMiddleware = constraintAPI.constraintAPIMiddleware;
EOF

echo "🎉 Build complete!"