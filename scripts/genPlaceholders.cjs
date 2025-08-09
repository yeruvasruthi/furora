
const fs = require('fs'); const path = require('path');
const dir = path.join(process.cwd(), 'public', 'images');
fs.mkdirSync(dir, { recursive: true });
const files = ['dog1.jpg','dog2.jpg','cat1.jpg','cat2.jpg'];
const svg = (label)=>`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
  <rect width="800" height="500" fill="#F8F4F0"/><text x="24" y="60" fill="#333" font-size="36" font-family="Arial">${label}</text></svg>`;
for (const name of files) {
  fs.writeFileSync(path.join(dir, name.replace('.jpg','.svg')), svg(name.replace('.jpg',' placeholder')));
}
console.log('Created SVG placeholders in public/images (kept lightweight).');
