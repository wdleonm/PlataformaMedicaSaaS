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

  // Replace active tab styling (bg-primary text-primary-foreground)
  // Usually looks like: "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
  // or "bg-primary text-primary-foreground"
  
  // Let's replace specifically in inventario/page.tsx first to be safe
  if (file.includes('inventario') || file.includes('presupuestos') || file.includes('gastos-fijos') || file.includes('pacientes')) {
     const tabActiveRegex = /"bg-primary text-primary-foreground( shadow-lg shadow-primary\/20)?"/g;
     if (content.match(tabActiveRegex)) {
        content = content.replace(tabActiveRegex, '"bg-primary/20 text-primary border border-primary shadow-[0_0_15px_rgba(77,158,170,0.2)]"');
        changed = true;
     }

     const tabInactiveRegex = /"text-on-surface-variant hover:bg-surface-container-highest"/g;
     if (content.match(tabInactiveRegex)) {
        content = content.replace(tabInactiveRegex, '"bg-surface text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest border border-outline-variant/30"');
        changed = true;
     }

     // Also fix border-outline-variant/20 -> /50 for clear section lines
     const borderRegex = /border-b border-outline-variant\/20/g;
     if (content.match(borderRegex)) {
        content = content.replace(borderRegex, 'border-b border-outline-variant/50');
        changed = true;
     }

     // Fix the active status pills or labels
     const activePillRegex = /"bg-primary text-primary-foreground"/g;
     if (content.match(activePillRegex)) {
        content = content.replace(activePillRegex, '"bg-primary/20 text-primary border border-primary"');
        changed = true;
     }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated buttons/borders: ' + file);
  }
});
