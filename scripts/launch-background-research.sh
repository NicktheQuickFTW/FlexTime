#!/bin/bash

# Background Research Launcher
# Launches automated sports research and monitors progress

echo "🚀 LAUNCHING BACKGROUND BIG 12 SPORTS RESEARCH 🚀"
echo "================================================="

# Create logs directory if it doesn't exist
mkdir -p ../logs

# Set the working directory
cd "$(dirname "$0")/.."

# Function to launch research in background
launch_research() {
    local command=$1
    local sport_name=$2
    
    echo "🔄 Starting $sport_name research in background..."
    
    # Launch with nohup to continue running even if terminal closes
    nohup node scripts/run-automated-sports-research.js $command \
        > logs/${sport_name}_research_$(date +%Y%m%d_%H%M%S).log 2>&1 &
    
    local pid=$!
    echo "✅ $sport_name research launched with PID: $pid"
    echo "$pid" > "logs/${sport_name}_research.pid"
    
    return $pid
}

# Function to check if process is running
check_process() {
    local pid=$1
    if ps -p $pid > /dev/null 2>&1; then
        return 0  # Process is running
    else
        return 1  # Process is not running
    fi
}

# Launch automated research for all remaining sports
echo "🎯 Launching automated research for all Big 12 sports..."

# Start the full automated research
launch_research "continue" "multi_sport"

echo ""
echo "🎊 BACKGROUND RESEARCH LAUNCHED SUCCESSFULLY!"
echo "=============================================="
echo ""
echo "📊 Monitor progress with:"
echo "   tail -f logs/multi_sport_research_*.log"
echo ""
echo "📈 Check automation progress:"
echo "   cat data/research_results/automation_progress.json"
echo ""
echo "🛑 Stop all research:"
echo "   pkill -f 'run-automated-sports-research'"
echo ""
echo "📁 Results will be saved to:"
echo "   data/research_results/"
echo ""

# Show current status
echo "🔍 Current research processes:"
ps aux | grep "run-automated-sports-research" | grep -v grep || echo "   No active research processes found"

echo ""
echo "✅ Background research system is now active!"