# PWA Icons Directory

This directory contains the Progressive Web App icons for FlexTime.

## Required Icon Sizes

The following icon sizes are needed for optimal PWA support across all devices:

### Standard PWA Icons
- `icon-72x72.png` - Android Chrome minimum
- `icon-96x96.png` - Android Chrome standard
- `icon-128x128.png` - Android Chrome recommended
- `icon-144x144.png` - Windows tile
- `icon-152x152.png` - iOS Safari
- `icon-192x192.png` - Android Chrome splash screen
- `icon-384x384.png` - Android Chrome large
- `icon-512x512.png` - Android Chrome extra large

### Additional Icons
- `icon-16x16.png` - Browser favicon
- `icon-32x32.png` - Browser favicon
- `favicon.ico` - Legacy browser support
- `badge-72x72.png` - Notification badge
- `shortcut-*.png` - App shortcuts (96x96)

## Icon Generation

To generate icons from a source image, you can use online tools like:
- https://www.pwabuilder.com/imageGenerator
- https://realfavicongenerator.net/
- https://favicon.io/

## Design Guidelines

### Brand Colors
- Primary: #00bfff (FlexTime Blue)
- Background: #0a0e17 (Dark Blue)
- Accent: #ffffff (White)

### Icon Design Principles
- Simple, recognizable symbol
- High contrast for visibility
- Scalable vector-based design
- Consistent with FlexTime branding
- Readable at small sizes

### Recommended Content
- FlexTime logo or "FT" monogram
- Sports/scheduling related iconography
- Clean, modern design aesthetic
- Dark theme compatible

## Icon Placement

Icons should be placed directly in this `/public/icons/` directory and referenced in:
- `/public/manifest.json` - PWA manifest
- `/public/index.html` - HTML meta tags
- Service worker cache configuration

## Testing

Test icon visibility on:
- Android Chrome (home screen installation)
- iOS Safari (Add to Home Screen)
- Windows (Start Menu tile)
- Desktop browsers (favicon)
- App store listings

## Current Status

⚠️ **Icons Required**: This directory currently contains placeholder documentation.
Production deployment requires actual icon files in all specified sizes.

To add icons:
1. Create or obtain FlexTime logo in vector format
2. Generate all required sizes using icon generation tools
3. Place files in this directory with exact naming convention
4. Test PWA installation across devices
5. Verify icon display in all contexts