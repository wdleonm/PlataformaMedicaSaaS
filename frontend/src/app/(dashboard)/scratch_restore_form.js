const fs = require('fs');

const path = 'c:\\xampp\\htdocs\\github\\PlataformaMedicaSaaS\\frontend\\src\\app\\(dashboard)\\historias\\page.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `                  })()}

                        seccionActual.codigo,`;

const replacement = `                  })()}
                </div>

                {/* Contenido del paso actual */}
                <form onSubmit={handleSaveHistoria} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {seccionActual
                    ? renderSeccion(
                        seccionActual.codigo,`;

content = content.replace(targetStr, replacement);
fs.writeFileSync(path, content);
console.log('Restored deleted lines in historias/page.tsx');
