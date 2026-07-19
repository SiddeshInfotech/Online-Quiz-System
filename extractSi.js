const fs = require('fs');

try {
  const siPath = 'c:/Users/niles/Desktop/QuizGen Ai1/frontend/node_modules/react-icons/si/index.d.ts';
  const content = fs.readFileSync(siPath, 'utf8');
  
  const exports = content.match(/export declare const (Si[a-zA-Z0-9_]+)/g) || [];
  const iconNames = exports.map(e => e.replace('export declare const ', ''));
  
  fs.writeFileSync('c:/Users/niles/Desktop/QuizGen Ai1/frontend/si-icons.json', JSON.stringify(iconNames, null, 2));
} catch (e) {
  fs.writeFileSync('c:/Users/niles/Desktop/QuizGen Ai1/frontend/si-icons.json', JSON.stringify({error: e.message}));
}
