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

  // Modals animation
  content = content.replace(/scale:\s*0\.95/g, 'scale: 0.9');

  // Replace hardcoded dark backgrounds with themable ones
  content = content.replace(/bg-\[#0a0514\]/g, 'bg-background');
  content = content.replace(/bg-\[#130a24\]/g, 'glass-panel border-none');
  
  // Specific replacements for admin layout
  content = content.replace(/bg-\[#0d071b\]/g, 'bg-surface-container-low/50 backdrop-blur-md');
  content = content.replace(/bg-\[#160c2d\]/g, 'glass-panel border-none');

  // Container Classes (e.g. Dashboard cards)
  // Dashboard card: bg-white/5 border border-white/10 rounded-3xl p-6
  content = content.replace(/bg-white\/5(\s+backdrop-blur-xl)?\s+border\s+border-white\/10\s+rounded-(3xl|2xl)/g, 'glass-panel rounded-[2.5rem] border-none');
  
  // Modals container
  content = content.replace(/bg-white\/5\s+backdrop-blur-2xl\s+w-full\s+max-w-([a-z0-9]+)\s+(max-h-\[[^\]]+\]\s+)?rounded-\[40px\]\s+border\s+border-white\/10\s+shadow-2xl/g, (match, maxw) => {
    return `glass-panel w-full max-w-${maxw} rounded-[2.5rem] border-none shadow-2xl`;
  });

  content = content.replace(/bg-\[#160c2d\]\s+w-full\s+max-w-([a-z0-9]+)\s+(max-h-\[[^\]]+\]\s+)?rounded-3xl\s+border\s+border-violet-500\/20\s+shadow-2xl/g, (match, maxw) => {
    return `glass-panel w-full max-w-${maxw} rounded-[2.5rem] border-none shadow-2xl`;
  });

  // Inputs
  content = content.replace(/bg-\[#0a0514\]\/50\s+border\s+border-white\/10\s+rounded-2xl\s+(py-4|py-3|p-3)\s+(pl-12|px-4)\s+(pr-4|pr-12)?\s+text-white/g, 'bg-surface-container-highest/50 border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface');

  // Primary Buttons
  content = content.replace(/bg-gradient-to-r\s+from-violet-600\s+to-indigo-600\s+hover:from-violet-500\s+hover:to-indigo-500\s+text-white\s+font-bold\s+py-3\s+px-6\s+rounded-xl\s+transition-all/g, 'py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-violet-500/20 hover:scale-[1.02] transition-all active:scale-[0.98]');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${path.basename(file)}`);
  }
});
console.log('Done updating admin modals and styles');
