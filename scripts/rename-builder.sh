#!/bin/bash
# Script to rename Schedule Builder files to FT Builder

# Create directories if they don't exist
mkdir -p /Users/nickw/Documents/GitHub/Flextime/frontend/src/components/renamed
mkdir -p /Users/nickw/Documents/GitHub/Flextime/frontend/src/assets/renamed
mkdir -p /Users/nickw/Documents/GitHub/Flextime/frontend/demos/renamed

# Rename files in src/components
for file in /Users/nickw/Documents/GitHub/Flextime/frontend/src/components/schedule-builder*.js
do
  newname=$(echo $file | sed 's/schedule-builder/ft-builder/')
  cp "$file" "${newname}"
  echo "Copied $file to $newname"
done

# Rename files in src/assets
for file in /Users/nickw/Documents/GitHub/Flextime/frontend/src/assets/schedule-builder*.css
do
  newname=$(echo $file | sed 's/schedule-builder/ft-builder/')
  cp "$file" "${newname}"
  echo "Copied $file to $newname"
done

# Rename files in demos
for file in /Users/nickw/Documents/GitHub/Flextime/frontend/demos/schedule-builder*.html
do
  newname=$(echo $file | sed 's/schedule-builder/ft-builder/')
  cp "$file" "${newname}"
  echo "Copied $file to $newname"
done

echo "All files copied with new names. Original files preserved."
