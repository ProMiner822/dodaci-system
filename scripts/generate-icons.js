// Simple script to generate PWA icons
// Run: node scripts/generate-icons.js
const fs = require("fs");
const path = require("path");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#e5950f"/>
  <text x="256" y="360" text-anchor="middle" font-size="320" font-weight="800" font-family="system-ui, sans-serif" fill="#2a2418">T</text>
</svg>`;

const dir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "icon.svg"), svg);
console.log("SVG icon created at public/icons/icon.svg");
