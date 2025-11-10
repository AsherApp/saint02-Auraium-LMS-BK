// post-build.js
const fs = require('fs');
const path = require('path');

function addJsExtensions(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      addJsExtensions(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      // Add .js extension to relative imports
      content = content.replace(/from\s+['"](\.\.?\/[^'"]*)['"](?![\.js])/g, 'from "$1.js"');
      fs.writeFileSync(filePath, content);
    }
  });
}

addJsExtensions('./dist');