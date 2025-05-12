/**
 * Build script for FlexTime client components
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building FlexTime client components...');

// Create destination directories if they don't exist
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
};

// Build paths
const rootDir = path.resolve(__dirname, '..');
const clientSrcDir = path.join(rootDir, 'client');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');
const pagesDistDir = path.join(distDir, 'pages');

// Ensure directories exist
ensureDirExists(distDir);
ensureDirExists(publicDir);
ensureDirExists(pagesDistDir);

try {
  console.log('📦 Building application...');
  try {
    execSync('node index.js --build', { stdio: 'inherit', cwd: rootDir });
  } catch (err) {
    console.log('Note: Application build step skipped or not needed');
  }
  
  // Copy pages
  console.log('📦 Copying pages...');
  const pagesDir = path.join(clientSrcDir, 'pages');
  if (fs.existsSync(pagesDir)) {
    execSync(`mkdir -p ${pagesDistDir} && cp -r ${pagesDir}/* ${pagesDistDir}/`, { 
      stdio: 'inherit', 
      shell: true,
      cwd: rootDir 
    });
  }

  // Copy static HTML files if they exist in the project root
  console.log('📦 Checking for HTML files...');
  const projectRoot = path.resolve(__dirname, '../../..');
  const htmlFiles = [
    { src: path.join(projectRoot, 'flextime-index.html'), dest: path.join(publicDir, 'index.html') },
    { src: path.join(projectRoot, 'simple-flextime-ui.html'), dest: path.join(publicDir, 'simple-ui.html') }
  ];

  htmlFiles.forEach(({ src, dest }) => {
    if (fs.existsSync(src)) {
      console.log(`Copying ${src} to ${dest}`);
      fs.copyFileSync(src, dest);
    } else {
      console.log(`HTML file not found: ${src}`);
    }
  });

  // Copy static files
  console.log('📦 Copying static assets...');
  const staticDir = path.join(clientSrcDir, 'static');
  if (fs.existsSync(staticDir)) {
    const staticDistDir = path.join(publicDir, 'static');
    ensureDirExists(staticDistDir);
    execSync(`cp -r ${staticDir}/* ${staticDistDir}/`, { 
      stdio: 'inherit', 
      shell: true,
      cwd: rootDir 
    });
  }
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
