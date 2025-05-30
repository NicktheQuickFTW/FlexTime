#!/bin/bash
# Script to update file contents from "Schedule Builder" to "FT Builder"

# Process all copied ft-builder files in components
for file in /Users/nickw/Documents/GitHub/Flextime/frontend/src/components/ft-builder*.js
do
  echo "Updating $file..."
  # Replace multiple variants of the naming
  sed -i '' 's/FlexTime Schedule Builder/FlexTime FT Builder/g' "$file"
  sed -i '' 's/Schedule Builder/FT Builder/g' "$file"
  sed -i '' 's/SCHEDULE BUILDER/FT BUILDER/g' "$file"
  sed -i '' 's/schedule builder/ft builder/g' "$file"
  sed -i '' 's/scheduleBuilder/ftBuilder/g' "$file"
  sed -i '' 's/ScheduleBuilder/FTBuilder/g' "$file"
  echo "✅ Updated $file"
done

# Process all copied ft-builder files in assets
for file in /Users/nickw/Documents/GitHub/Flextime/frontend/src/assets/ft-builder*.css
do
  echo "Updating $file..."
  sed -i '' 's/FlexTime Schedule Builder/FlexTime FT Builder/g' "$file"
  sed -i '' 's/Schedule Builder/FT Builder/g' "$file"
  sed -i '' 's/SCHEDULE BUILDER/FT BUILDER/g' "$file"
  sed -i '' 's/schedule builder/ft builder/g' "$file"
  sed -i '' 's/scheduleBuilder/ftBuilder/g' "$file"
  sed -i '' 's/ScheduleBuilder/FTBuilder/g' "$file"
  echo "✅ Updated $file"
done

# Process all copied ft-builder files in demos
for file in /Users/nickw/Documents/GitHub/Flextime/frontend/demos/ft-builder*.html
do
  echo "Updating $file..."
  sed -i '' 's/FlexTime Schedule Builder/FlexTime FT Builder/g' "$file"
  sed -i '' 's/Schedule Builder/FT Builder/g' "$file"
  sed -i '' 's/SCHEDULE BUILDER/FT BUILDER/g' "$file"
  sed -i '' 's/schedule builder/ft builder/g' "$file"
  sed -i '' 's/scheduleBuilder/ftBuilder/g' "$file"
  sed -i '' 's/ScheduleBuilder/FTBuilder/g' "$file"
  echo "✅ Updated $file"
done

# Update the MVP_Features_App_Architecture_Workflow_Prompt.md file
echo "Updating MVP Features document..."
sed -i '' 's/5\. Schedule Builder/5\. FT Builder/g' "/Users/nickw/Desktop/MVP_Features_App_Architecture_Workflow_Prompt.md"
echo "✅ Updated MVP Features document"

echo "All files updated with FT Builder naming!"
