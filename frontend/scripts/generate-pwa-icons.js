#!/usr/bin/env node

/**
 * Generate basic PWA icons for FlexTime
 * Creates simple SVG-based icons that can be converted to PNG
 */

const fs = require('fs');
const path = require('path');

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// FlexTime SVG icon template
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0e17;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#060a10;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00bfff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.1}" fill="url(#bg)"/>
  
  <!-- Border -->
  <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${size * 0.08}" 
        fill="none" stroke="rgba(0, 191, 255, 0.3)" stroke-width="2"/>
  
  <!-- FT Monogram -->
  <g transform="translate(${size * 0.2}, ${size * 0.3})">
    <!-- F -->
    <rect x="0" y="0" width="${size * 0.08}" height="${size * 0.4}" fill="url(#accent)"/>
    <rect x="0" y="0" width="${size * 0.2}" height="${size * 0.06}" fill="url(#accent)"/>
    <rect x="0" y="${size * 0.17}" width="${size * 0.15}" height="${size * 0.06}" fill="url(#accent)"/>
    
    <!-- T -->
    <rect x="${size * 0.25}" y="0" width="${size * 0.3}" height="${size * 0.06}" fill="url(#accent)"/>
    <rect x="${size * 0.36}" y="0" width="${size * 0.08}" height="${size * 0.4}" fill="url(#accent)"/>
  </g>
  
  <!-- Glow effect -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.4}" 
          fill="none" stroke="rgba(0, 191, 255, 0.2)" stroke-width="2" opacity="0.6"/>
</svg>`;

// Icon sizes we need
const iconSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

console.log('🎨 Generating FlexTime PWA Icons...');

// Generate SVG icons for each size
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent.trim());
  console.log(`✅ Created ${filename}`);
});

// For browsers that need PNG, we'll create a simple HTML file that can help convert
const converterHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>FlexTime Icon Converter</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #0a0e17; color: white; }
        .icon-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .icon-item { text-align: center; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 8px; }
        .icon-item img { max-width: 100%; height: auto; }
        canvas { display: none; }
    </style>
</head>
<body>
    <h1>FlexTime PWA Icons</h1>
    <p>SVG icons generated successfully. For PNG conversion, use any SVG to PNG converter online.</p>
    
    <div class="icon-grid">
        ${iconSizes.map(size => `
            <div class="icon-item">
                <h3>${size}x${size}</h3>
                <img src="icon-${size}x${size}.svg" alt="FlexTime Icon ${size}x${size}">
                <p>icon-${size}x${size}.svg</p>
            </div>
        `).join('')}
    </div>
    
    <h2>Instructions</h2>
    <ol>
        <li>These SVG icons will work for modern browsers</li>
        <li>For better compatibility, convert to PNG using an online converter</li>
        <li>Upload the PNGs back to this icons folder</li>
        <li>Update manifest.json to reference PNG files if needed</li>
    </ol>
</body>
</html>`;

// Create the converter helper
fs.writeFileSync(path.join(iconsDir, 'converter.html'), converterHTML);

// Update manifest.json to use SVG icons for now
const manifestPath = path.join(__dirname, '../public/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

manifest.icons = iconSizes.map(size => ({
  "src": `/icons/icon-${size}x${size}.svg`,
  "sizes": `${size}x${size}`,
  "type": "image/svg+xml",
  "purpose": size >= 192 ? "any maskable" : "any"
}));

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('✅ Updated manifest.json with SVG icons');
console.log('🚀 FlexTime PWA icons generated successfully!');
console.log('📝 Open /icons/converter.html to view all icons');
console.log('');
console.log('Note: SVG icons work in modern browsers. For broader compatibility,');
console.log('convert the SVGs to PNG format using any online converter.');