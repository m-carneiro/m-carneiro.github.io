import { mkdir, cp, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const slug=process.argv[2];
if(!slug||!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)){console.error('Use: npm run new:project -- meu-projeto');process.exit(1)}
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.join(root,'projects',slug);
try{await access(target);console.error('Já existe uma pasta com esse nome.');process.exit(1)}catch(error){if(error.code!=='ENOENT')throw error}
await mkdir(target,{recursive:true});
for(const lang of ['pt','en'])await cp(path.join(root,'projects/_template',lang+'.md'),path.join(target,lang+'.md'));
console.log(`Rascunho criado em projects/${slug}. Edite pt.md e en.md; depois mude draft para false em pt.md.`);
