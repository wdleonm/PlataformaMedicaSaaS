const fs = require('fs');

const path = 'c:\\xampp\\htdocs\\github\\PlataformaMedicaSaaS\\frontend\\src\\app\\admin\\layout.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Sun, Moon to imports
content = content.replace(/Stethoscope/g, 'Stethoscope,\n  Sun,\n  Moon');

// 2. Add isDarkMode state
content = content.replace(/const \[currentTime, setCurrentTime\] = useState\(new Date\(\)\);/g, `const [currentTime, setCurrentTime] = useState(new Date());\n  const [isDarkMode, setIsDarkMode] = useState(true);`);

// 3. Add useEffect for dark mode
const effectTarget = `  // Actualizar hora cada minuto sin necesidad de alta precisión`;
const effectReplacement = `  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Actualizar hora cada minuto sin necesidad de alta precisión`;
content = content.replace(effectTarget, effectReplacement);

// 4. Add Toggle button next to Bell
const bellTarget = `<button className="relative p-2.5 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-violet-500 rounded-full border-2 border-background" />
              </button>`;
const bellReplacement = `<button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white">
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="relative p-2.5 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-violet-500 rounded-full border-2 border-background" />
              </button>`;
content = content.replace(bellTarget, bellReplacement);

fs.writeFileSync(path, content);
console.log('Added dark mode toggle to admin layout');
