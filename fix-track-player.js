const fs = require('fs');
const path = require('path');

const filePath = path.join(
    __dirname,
    'node_modules',
    'react-native-track-player',
    'android',
    'src',
    'main',
    'java',
    'com',
    'doublesymmetry',
    'trackplayer',
    'module',
    'MusicModule.kt'
);

console.log('Reading MusicModule.kt...');
let content = fs.readFileSync(filePath, 'utf8');

// Fix line 548 - add null safety operator
content = content.replace(
    /(\s+)PlayerOptions\.parsePlayerOptions\(bundle\)/g,
    '$1PlayerOptions.parsePlayerOptions(bundle ?: Bundle())'
);

// Another potential fix pattern  
content = content.replace(
    /(\s+)val capabilities = capabilities\(bundle\)/g,
    '$1val capabilities = capabilities(bundle ?: Bundle())'
);

console.log('Writing fixed MusicModule.kt...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed react-native-track-player Kotlin nullability issues');
console.log('Now run: npx patch-package react-native-track-player');
