const fs = require('fs');
const path = require('path');

const dir = 'c:\\xampp\\htdocs\\github\\PlataformaMedicaSaaS\\frontend\\src\\app\\admin';

function walk(directory) {
  let results = [];
  const list = fs.readdirSync(directory);
  list.forEach(file => {
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
  let original = content;

  content = content.replace(/className="([^"]+)"/g, (match, classes) => {
    if (classes.includes('bg-gradient') || classes.includes('bg-violet') || classes.includes('bg-primary') || classes.includes('bg-red') || classes.includes('bg-indigo')) {
      // It's a button or a colorful card, keep text-white
      return match;
    } else {
      let newClasses = classes
        .replace(/\btext-white\b/g, 'text-on-surface')
        .replace(/\btext-slate-200\b/g, 'text-on-surface')
        .replace(/\btext-slate-300\b/g, 'text-on-surface')
        .replace(/\btext-slate-400\b/g, 'text-on-surface-variant')
        .replace(/\btext-slate-500\b/g, 'text-on-surface-variant')
        .replace(/\btext-white\/60\b/g, 'text-on-surface-variant')
        .replace(/\btext-white\/80\b/g, 'text-on-surface')
        .replace(/\btext-white\/40\b/g, 'text-outline')
        .replace(/\bbg-white\/5\b/g, 'bg-surface-container-highest/50')
        .replace(/\bbg-white\/10\b/g, 'bg-surface-container-highest')
        .replace(/\bborder-white\/5\b/g, 'border-outline-variant/20')
        .replace(/\bborder-white\/10\b/g, 'border-outline-variant/30')
        .replace(/\bfrom-white\b/g, 'from-on-surface')
        .replace(/\bbg-black\/60\b/g, 'bg-background/80'); // Backdrop
      return `className="${newClasses}"`;
    }
  });

  // some hardcoded colors
  content = content.replace(/text-slate-200/g, 'text-on-surface');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${path.basename(file)}`);
  }
});
console.log('Done fixing admin text colors');
