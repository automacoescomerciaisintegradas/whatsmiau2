const fs = require('fs');
const content = fs.readFileSync('C:/Users/autom/.gemini/antigravity-ide/brain/7ebfb068-1ebe-499e-b7a2-a28b46bd4235/scratch/wavoip-bundle.js', 'utf8');

const urlRegex = /https?:\/\/[^\s\'\"\`]+/g;
const pathRegex = /[\'\"]\/[a-zA-Z0-9_\-\/]+[\'\"]/g;

const urls = content.match(urlRegex) || [];
const paths = content.match(pathRegex) || [];

console.log('URLs Encontradas:');
[...new Set(urls)].forEach(url => console.log(url));

console.log('\nPaths Encontrados:');
[...new Set(paths)].filter(p => p.length > 3).forEach(path => console.log(path));
