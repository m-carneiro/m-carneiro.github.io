import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,cp,access,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {buildSite} from '../scripts/build.mjs';
import {parseContent,renderMarkdown,loadProjects} from '../scripts/content.mjs';

async function fixture(t){
 const root=await mkdtemp(path.join(os.tmpdir(),'portfolio-test-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await mkdir(path.join(root,'projects/_template'),{recursive:true});
 await cp(new URL('../templates',import.meta.url),path.join(root,'templates'),{recursive:true});
 await cp(new URL('../public',import.meta.url),path.join(root,'public'),{recursive:true});
 return root;
}
async function project(root,slug,{draft=false,featured=true,order=1,en=true}={}){
 const dir=path.join(root,'projects',slug);await mkdir(dir,{recursive:true});
 await writeFile(path.join(dir,'pt.md'),`---\ntitle: "Projeto ${slug}"\nsummary: "Descrição em português"\ntags: ["AppSec"]\ndraft: ${draft}\nfeatured: ${featured}\norder: ${order}\n---\n\n## A solução\n\n**Texto em português.**\n\n![Diagrama](diagram.png)\n`);
 if(en)await writeFile(path.join(dir,'en.md'),`---\ntitle: "Project ${slug}"\nsummary: "English summary"\ntags: ["AppSec"]\n---\n\n## The solution\n\n**English content.**\n`);
 return dir;
}
test('rascunhos e modelo não geram páginas nem arquivos públicos; sem projetos preserva o currículo',async t=>{
 const root=await fixture(t);const dir=await project(root,'draft-project',{draft:true,en:false});await writeFile(path.join(dir,'private.pdf'),'draft');
 const out=path.join(root,'dist');await buildSite(root,out);
 const home=await readFile(path.join(out,'index.html'),'utf8');assert.ok(!home.includes('id="projetos"'));assert.ok(home.includes('Matheus'));await assert.rejects(access(path.join(out,'projects/draft-project')));
 assert.ok((await readFile(path.join(out,'projects/index.html'),'utf8')).includes('Projects will be published soon.'));
});
test('projetos publicados geram detalhes nos dois idiomas, assets, catálogo e destaques em ordem',async t=>{
 const root=await fixture(t);await project(root,'second',{order:2});await project(root,'first',{order:1});const dir=await project(root,'catalog-only',{order:3,featured:false});await writeFile(path.join(dir,'diagram.png'),'test image');
 const out=path.join(root,'dist');await buildSite(root,out);const home=await readFile(path.join(out,'index.html'),'utf8');
 assert.ok(home.indexOf('Projeto first')<home.indexOf('Projeto second'));assert.ok(!home.includes('Projeto catalog-only'));
 const pairs=JSON.parse(home.match(/const translations = ([\s\S]*?);\s*function setLanguage/)[1]);assert.equal(pairs[43][0],'Automação de documentação e rotinas administrativas com Java e Bash. Administração de volumes LVM e sistemas de arquivos Linux.');assert.equal(pairs[44][0],'04 / Formação');assert.ok(home.includes('id="projetos"'));assert.ok(home.includes('04 / Formação'));assert.ok(home.includes('05 / Contato'));
 const detail=await readFile(path.join(out,'projects/catalog-only/index.html'),'utf8');assert.ok(detail.includes('English content.'));assert.ok(detail.includes('Texto em português.'));assert.ok(detail.includes('data-home="#projetos"'));assert.ok(!detail.includes('fetch('));await access(path.join(out,'projects/catalog-only/diagram.png'));
 assert.ok((await readFile(path.join(out,'projects/index.html'),'utf8')).includes('Project catalog-only'));
});
test('publicação incompleta e capa fora da pasta falham antes de substituir o site',async t=>{
 const root=await fixture(t);const dir=await project(root,'incomplete',{en:false});await assert.rejects(loadProjects(path.join(root,'projects')),/en.md/);
 await project(root,'incomplete');const source=await readFile(path.join(dir,'pt.md'),'utf8');await writeFile(path.join(dir,'pt.md'),source.replace('order: 1','order: 1\ncover: "../escape.png"'));await assert.rejects(loadProjects(path.join(root,'projects')),/cover/);
});
test('Markdown preserva títulos, tabelas e código, removendo scripts e URLs executáveis',()=>{
 const output=renderMarkdown('## Hello\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```js\nconst n = 1;\n```\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n<img src="x" onerror="alert(1)">');
 assert.ok(output.includes('<h2>Hello</h2>'));assert.ok(output.includes('<table>'));assert.ok(output.includes('<pre>'));assert.ok(!output.includes('<script'));assert.ok(!output.includes('javascript:'));assert.ok(!output.includes('onerror'));
});
test('metadados rejeitam chaves duplicadas e cabeçalho ausente',()=>{
 assert.throws(()=>parseContent('No front matter'),/metadados/);assert.throws(()=>parseContent('---\ntitle: one\ntitle: two\n---\ntext'),/unique/);
});
