#!/bin/bash
echo "Stopping FlexTime..."
kill 15316 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
echo "FlexTime stopped"
