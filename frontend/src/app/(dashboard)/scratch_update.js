const fs = require('fs');
const path = require('path');

const dir = 'c:\\xampp\\htdocs\\github\\PlataformaMedicaSaaS\\frontend\\src\\app\\(dashboard)';

function walk(directory) {
  let results = [];
  const list = fs.readdirSync(directory);
  list.forEach(function(file) {
    file = path.join(directory, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(dir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Update backdrops
  const oldBackdrops = [
    'bg-surface/80 backdrop-blur-sm',
    'bg-black/60 backdrop-blur-sm',
    'bg-surface/90 backdrop-blur-md',
    'bg-surface/50 backdrop-blur-[2px]'
  ];

  oldBackdrops.forEach(backdrop => {
    if (content.includes(backdrop)) {
      content = content.split(backdrop).join('bg-background/50 backdrop-blur-[3px]');
      changed = true;
    }
  });

  // Update Cancelar buttons lacking borders or clear hover states
  // We look for 'Cancelar' buttons that don't have border or bg styles
  const cancelRegex = /className="([^"]*)"[^>]*>\s*Cancelar\s*<\/button>/g;
  content = content.replace(cancelRegex, (match, classes) => {
    if (!classes.includes('bg-') && !classes.includes('border-')) {
      // Add pill style to text-only cancel buttons
      const newClasses = classes + ' px-5 py-2.5 rounded-xl border border-outline-variant/30 hover:bg-surface-container-highest transition-colors';
      changed = true;
      return match.replace(classes, newClasses);
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated: ' + file);
  }
});
