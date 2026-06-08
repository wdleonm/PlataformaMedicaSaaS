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

  // Flatten primary buttons: replace shadow-lg, shadow-primary/20, hover:scale-105 with flat styles
  // Typical old button: className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
  const regex = /className="([^"]*bg-primary text-primary-foreground[^"]*)"/g;
  content = content.replace(regex, (match, classes) => {
    let newClasses = classes
      .replace(/shadow-lg/g, '')
      .replace(/shadow-primary\/[0-9]+/g, '')
      .replace(/hover:scale-105/g, 'hover:bg-primary/90')
      .replace(/active:scale-95/g, 'active:bg-primary/80')
      .replace(/rounded-xl/g, 'rounded-lg')
      .replace(/rounded-2xl/g, 'rounded-lg')
      .replace(/\s+/g, ' ').trim();
    
    // Make sure we have the base classes
    if (!newClasses.includes('border-primary/20')) {
      newClasses += ' border border-primary/20';
    }

    if (newClasses !== classes) {
      changed = true;
      return `className="${newClasses}"`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated flat buttons in: ' + file);
  }
});
