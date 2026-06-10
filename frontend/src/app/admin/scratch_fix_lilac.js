const fs = require('fs');

// Fix layout.tsx
let layoutContent = fs.readFileSync('layout.tsx', 'utf8');

// Replace text-violet-400 with dark:text-violet-400 text-violet-700
layoutContent = layoutContent.replace(/text-violet-400/g, 'text-violet-700 dark:text-violet-400');
// The hover/bg also needs fixing
layoutContent = layoutContent.replace(/hover:text-violet-300/g, 'hover:text-violet-700 dark:hover:text-violet-300');

// Fix Acciones Rapidas in dashboard
let dashboardContent = fs.readFileSync('dashboard/page.tsx', 'utf8');
dashboardContent = dashboardContent.replace(/text-violet-400/g, 'text-violet-700 dark:text-violet-400');
dashboardContent = dashboardContent.replace(/text-violet-300/g, 'text-violet-600 dark:text-violet-300');

// "SISTEMA OPERATIVO" badge in dashboard
// <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
// <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">Sistema Operativo</span>
dashboardContent = dashboardContent.replace(/text-emerald-400/g, 'text-emerald-600 dark:text-emerald-400');

// "Acciones Rápidas" card bg. It's a gradient, but we should make it compatible.
// Currently: <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[40px] p-8 text-on-surface shadow-2xl shadow-violet-900/40 relative overflow-hidden group">
// Because it has a strong violet background, text inside MUST be white.
// Let's replace the content of that card.
dashboardContent = dashboardContent.replace(/className="bg-gradient-to-br from-violet-600 to-indigo-700/g, 'className="glass-panel border-primary/20 ring-1 ring-primary/10');

// Fix the buttons inside Acciones Rapidas that were broken by previous script
// <button className="w-full flex items-center justify-between p-4 bg-surface-container-highest\/50 rounded-2xl hover:bg-surface-container-highest\/80 transition-colors group">
// <span className="font-bold text-on-surface">Registrar Especialista</span>
// <ArrowUpRight className="text-on-surface-variant group-hover:text-on-surface transition-colors" size={18} />
dashboardContent = dashboardContent.replace(/p-4 bg-surface-container-highest\/50 rounded-2xl hover:bg-surface-container-highest\/80/g, 'p-4 glass-panel border border-primary/10 hover:border-primary/30');

fs.writeFileSync('layout.tsx', layoutContent);
fs.writeFileSync('dashboard/page.tsx', dashboardContent);
console.log('Fixed lilac colors and dashboard card');
