const fs = require('fs');
const path = require('path');

const dir = 'c:\\xampp\\htdocs\\github\\PlataformaMedicaSaaS\\frontend\\src\\app';

function walk(directory) {
  let results = [];
  const list = fs.readdirSync(directory);
  list.forEach(function(file) {
    file = path.join(directory, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(dir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace alert( with toast(
  // Use toast.error for "Error" and toast.success for others
  const alertRegex = /alert\(([^)]+)\)/g;
  if (content.match(alertRegex)) {
    content = content.replace(alertRegex, (match, msg) => {
      changed = true;
      if (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('no se pudo')) {
        return `toast.error(${msg})`;
      } else {
        return `toast.success(${msg})`;
      }
    });
  }

  // Add import if toast is used
  if (changed && !content.includes("from 'react-hot-toast'") && !content.includes('from "react-hot-toast"')) {
    // find first import and inject it
    content = content.replace(/import /, "import { toast } from 'react-hot-toast';\nimport ");
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated alert to toast in: ' + file);
  }
});
