const fs = require('fs');
const path = require('path');

const dir = 'c:\\xampp\\htdocs\\github\\PlataformaMedicaSaaS\\frontend\\src\\app\\(dashboard)';

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

  // 1. Modals animation
  content = content.replace(/scale:\s*0\.95/g, 'scale: 0.9');

  // 2. Modals container classes
  // Find `<motion.div ... bg-surface-container-low` and modify it.
  content = content.replace(/bg-surface-container-low\s+w-full\s+max-w-([a-z0-9]+)\s+(max-h-\[[^\]]+\]\s+)?rounded-[a-zA-Z0-9\[\]\-]+\s+shadow-2xl\s+border\s+border-[a-zA-Z0-9\/\-]+(\s+relative\s+z-10)?/g, (match, maxw) => {
    return `glass-panel w-full max-w-${maxw} rounded-[2.5rem] border-none shadow-2xl relative z-10`;
  });
  
  // Custom case for layout.tsx emergency modal
  content = content.replace(/bg-surface-container-low w-full max-w-md rounded-3xl shadow-2xl border border-red-500\/30 relative z-10 overflow-hidden/g, 'glass-panel w-full max-w-md rounded-[2.5rem] shadow-2xl border-none relative z-10 overflow-hidden');

  // Custom case for historias
  content = content.replace(/bg-surface-container-low w-full max-w-5xl max-h-\[90vh\] rounded-\[2rem\] shadow-2xl border border-outline-variant\/20 relative z-10/g, 'glass-panel w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl border-none relative z-10');

  // Custom case for inventario
  content = content.replace(/bg-surface-container-low w-full max-w-md rounded-\[2rem\] shadow-2xl border border-outline-variant\/20 relative z-10/g, 'glass-panel w-full max-w-md rounded-[2.5rem] border-none shadow-2xl relative z-10');
  
  // 3. Inputs
  // `w-full bg-surface border border-outline-variant/50 p-2 rounded-lg text-sm` -> new input style
  // `w-full bg-surface border border-outline-variant/50 p-2.5 rounded-xl text-sm` -> new input style
  // `w-full bg-surface border border-outline-variant/50 rounded-xl p-2.5 text-sm`
  content = content.replace(/w-full\s+bg-surface\s+border\s+border-outline-variant\/50\s+(p-2\.5|p-2|p-3)\s+(rounded-lg|rounded-xl)\s+text-sm(\s+outline-none\s+focus:ring-2\s+focus:ring-[a-zA-Z0-9\/]+)?/g, 'w-full bg-surface-container-highest/50 border border-outline-variant/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/40 transition-all font-bold text-sm');

  // 4. Primary Buttons (Guardar/Registrar)
  // `w-full bg-primary text-primary-foreground py-2 rounded-lg font-bold text-sm shadow flex justify-center items-center gap-2 border border-primary/20`
  // `flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all border border-primary/20 hover:bg-primary/90 active:bg-primary/80`
  content = content.replace(/flex\s+items-center\s+gap-2\s+bg-primary\s+text-white\s+px-6\s+py-2\.5\s+rounded-xl\s+text-sm\s+font-bold\s+transition-all\s+border\s+border-primary\/20\s+hover:bg-primary\/90\s+active:bg-primary\/80(\s+disabled:opacity-50)?/g, 'flex justify-center items-center gap-2 flex-1 py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-[0.98]$1');

  content = content.replace(/w-full\s+bg-primary\s+text-primary-foreground\s+py-2\s+rounded-lg\s+font-bold\s+text-sm\s+shadow\s+flex\s+justify-center\s+items-center\s+gap-2\s+border\s+border-primary\/20/g, 'w-full flex justify-center items-center gap-2 py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-[0.98]');
  
  // Emergency primary button
  content = content.replace(/flex items-center gap-2 bg-red-600 text-white px-6 py-2\.5 rounded-xl text-sm font-bold transition-all border border-red-500\/20 hover:bg-red-700 active:bg-red-800/g, 'flex justify-center items-center gap-2 flex-1 py-4 bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all active:scale-[0.98]');

  // Cancel buttons (outline -> flat)
  content = content.replace(/px-5\s+py-2\.5\s+rounded-xl\s+border\s+border-outline-variant\/30\s+hover:bg-surface-container-highest\s+transition-colors\s+text-sm\s+font-bold\s+text-on-surface-variant/g, 'flex-1 py-4 bg-surface-container-highest/50 text-on-surface-variant font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-surface-container-highest transition-all');
  
  content = content.replace(/px-4\s+py-2\s+rounded-lg\s+text-sm\s+font-bold\s+text-on-surface-variant\s+hover:bg-surface-container-highest\s+transition-colors/g, 'flex-1 py-4 bg-surface-container-highest/50 text-on-surface-variant font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-surface-container-highest transition-all');


  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${path.basename(file)}`);
  }
});
console.log('Done updating modals');
