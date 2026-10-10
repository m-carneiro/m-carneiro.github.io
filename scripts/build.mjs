import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escape, loadProjects, renderMarkdown } from './content.mjs';

const extraCSS = `
[hidden]{display:none!important}.project-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}.project-card{border:1px solid var(--line);border-radius:5px;padding:28px;display:flex;flex-direction:column;min-width:0;background:#fff8}.project-card:hover{border-color:var(--green)}.project-card p{color:var(--muted);font-size:15px}.project-card .tags{margin:8px 0 24px}.project-card .project-link{margin-top:auto;font-size:14px;font-weight:650;color:var(--green)}.project-cover{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:3px;margin-bottom:18px}.project-all{display:inline-block;margin-top:26px;color:var(--green);font-weight:650;font-size:14px}.project-heading{padding:64px 0 38px;border-bottom:1px solid var(--line)}.project-heading h1{font-size:clamp(36px,5vw,62px);letter-spacing:-2px;line-height:1.12;overflow-wrap:anywhere}.back{display:inline-block;font-size:14px;color:var(--green);font-weight:650;margin-bottom:28px}.project-heading .intro{max-width:820px}.project-content{max-width:820px;margin:auto;padding:40px 0 70px;overflow-wrap:anywhere}.project-content h1{font-size:32px;letter-spacing:-1px}.project-content h2{font-size:28px;margin-top:36px}.project-content h3{font-size:22px;margin-top:28px}.project-content img{max-width:100%;height:auto;border-radius:4px}.project-content pre{padding:20px;background:#142e29;color:#e5f0d6;overflow:auto;border-radius:4px;font-size:13px}.project-content code{font-family:ui-monospace,monospace}.project-content p code,.project-content li code{background:#e5eae2;padding:2px 5px;border-radius:3px}.project-content blockquote{border-left:3px solid var(--green);margin:24px 0;padding:5px 22px;color:var(--muted)}.project-content a{text-decoration:underline;text-underline-offset:3px;color:var(--green)}.project-content table{display:block;overflow-x:auto;border-collapse:collapse;margin:24px 0}.project-content td,.project-content th{border:1px solid var(--line);padding:10px;text-align:left}.catalog{padding:60px 0}.empty{color:var(--muted);padding:24px 0}.nav-right{min-width:0}.nav-right nav a{white-space:nowrap}@media(max-width:780px){.project-grid{grid-template-columns:1fr}.project-heading{padding-top:40px}.project-card{padding:22px}.nav-right nav a[href="#competencias"]{display:none}}@media(max-width:400px){.nav-right{gap:8px}.nav-right nav{gap:10px}}
`;
const labels = {
 pt: { projects:'Projetos', eyebrow:'03 / Projetos', title:'Projetos em<br>destaque.', summary:'Soluções que conectam segurança e engenharia. Conheça o contexto, minha participação e a solução de cada projeto.', read:'Conhecer o projeto ↗',all:'Ver todos os projetos ↗',back:'← Voltar ao currículo',catalog:'Projetos.',catalogSummary:'Uma seleção de projetos, soluções e aprendizados.',empty:'Os projetos serão publicados em breve.'},
 en: { projects:'Projects',eyebrow:'03 / Projects',title:'Selected<br>projects.',summary:'Solutions connecting security and engineering. Explore the context, my contribution and the approach behind each project.',read:'Explore project ↗',all:'View all projects ↗',back:'← Back to résumé',catalog:'Projects.',catalogSummary:'A selection of projects, solutions and lessons learned.',empty:'Projects will be published soon.'}
};
function card(project, lang, prefix) {
 const meta=project[lang].meta;
 return `<article class="project-card">${project.cover?`<img class="project-cover" src="${prefix}${escape(project.slug)}/${escape(project.cover)}" alt="" loading="lazy">`:''}<div class="eyebrow">${escape(meta.tags[0]||labels[lang].projects)}</div><h3>${escape(meta.title)}</h3><p>${escape(meta.summary)}</p><div class="tags">${meta.tags.map(t=>`<span>${escape(t)}</span>`).join('')}</div><a class="project-link" data-project-href="${prefix}${project.slug}/index.html" href="${prefix}${project.slug}/index.html?lang=${lang}">${labels[lang].read}<span class="sr-only"> — ${escape(meta.title)}</span></a></article>`;
}
const serialize = value => JSON.stringify(value).replace(/</g,'\\u003c');
function bilingualPage({ css, content, title, description, root, footer }) {
 const body = `<div data-language="pt">${content.pt}</div><div data-language="en" hidden>${content.en}</div>`;
 const script = `const titles=${serialize(title)},descriptions=${serialize(description)};function setLanguage(lang){lang=lang==='en'?'en':'pt';document.documentElement.lang=lang==='en'?'en':'pt-BR';document.querySelectorAll('[data-language]').forEach(el=>el.hidden=el.dataset.language!==lang);document.querySelectorAll('[data-lang]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.lang===lang)));document.querySelectorAll('[data-home]').forEach(el=>el.href=${serialize(root+'index.html')}+'?lang='+lang+(el.dataset.home||''));document.querySelectorAll('[data-project-href]').forEach(el=>el.href=el.dataset.projectHref+'?lang='+lang);document.title=titles[lang];document.querySelector('meta[name="description"]').content=descriptions[lang];try{localStorage.setItem('resume-language',lang)}catch(e){}const url=new URL(location.href);url.searchParams.set('lang',lang);try{history.replaceState(null,'',url)}catch(e){}}document.querySelectorAll('[data-lang]').forEach(el=>el.addEventListener('click',()=>setLanguage(el.dataset.lang)));let initial='pt';try{initial=localStorage.getItem('resume-language')||'pt'}catch(e){}const query=new URLSearchParams(location.search).get('lang');setLanguage(query==='pt'||query==='en'?query:initial);`;
 return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(description.pt)}"><title>${escape(title.pt)}</title><style>${css}${extraCSS}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}</style></head><body><header><div class="nav"><a class="brand" data-home="" href="${root}index.html" aria-label="Matheus Carneiro">mc<span>.</span></a><div class="language-switch" role="group" aria-label="Idioma / Language"><button type="button" data-lang="pt" aria-pressed="true" aria-label="Português">PT</button><button type="button" data-lang="en" aria-pressed="false" aria-label="English">EN</button></div></div></header><main>${body}</main>${footer}<script>${script}</script></body></html>`;
}
async function copyAssets(from,to) {
 for(const entry of await readdir(from,{withFileTypes:true})){
  if(entry.name.startsWith('.')||/\.md$/i.test(entry.name))continue;
  if(entry.isSymbolicLink())throw new Error(`Não são permitidos links simbólicos: ${entry.name}`);
  const source=path.join(from,entry.name),target=path.join(to,entry.name);
  if(entry.isDirectory()){await mkdir(target,{recursive:true});await copyAssets(source,target)}
  else if(/\.(?:png|jpe?g|webp|gif|pdf)$/i.test(entry.name))await cp(source,target);
 }
}
export async function buildSite(root, out = path.join(root,'dist')) {
 const projects=await loadProjects(path.join(root,'projects'));
 let home=await readFile(path.join(root,'templates/home.html'),'utf8');
 const css=home.match(/<style>([\s\S]*?)<\/style>/)[1];
 const footer=home.match(/<footer>[\s\S]*?<\/footer>/)[0];
 const originalJSON=home.match(/const translations = ([\s\S]*?);\s*function setLanguage/)[1];
 const translations=JSON.parse(originalJSON);
 const add=(pt,en,tag,attrs='')=>{const id=translations.push([pt,en])-1;return `<${tag} data-i18n="${id}"${attrs}>${pt}</${tag}>`};
 if(projects.length){
  const featured=projects.filter(p=>p.featured);
  const grid=(lang)=>featured.map(p=>card(p,lang,'projects/')).join('');
  const section=`<section class="section" id="projetos"><div class="section-head"><div>${add(labels.pt.eyebrow,labels.en.eyebrow,'div',' class="eyebrow"')}${add(labels.pt.title,labels.en.title,'h2')}</div>${add(labels.pt.summary,labels.en.summary,'p')}</div>${featured.length?add(grid('pt'),grid('en'),'div',' class="project-grid"'):''}${add(labels.pt.all,labels.en.all,'a',' class="project-all" data-project-href="projects/index.html" href="projects/index.html?lang=pt"')}</section>`;
  home=home.replace('<section class="section education">',section+'<section class="section education">');
  home=home.replace('<a href="#contato"',add(labels.pt.projects,labels.en.projects,'a',' href="#projetos"')+'<a href="#contato"');
  translations[translations.findIndex(pair=>pair[0]==='03 / Formação')]=['04 / Formação','04 / Education'];translations[translations.findIndex(pair=>pair[0]==='04 / Contato')]=['05 / Contato','05 / Contact'];
 }
 home=home.replace(originalJSON,serialize(translations));
 home=home.replace('</script>',"if(location.hash){requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView({behavior:'instant'}))}</script>");
 home=home.replace('</style>',extraCSS+'.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}</style>');
 home=home.replace("try{localStorage.setItem('resume-language',lang)}catch(e){}",`document.querySelectorAll('[data-project-href]').forEach(el=>el.href=el.dataset.projectHref+'?lang='+lang);try{localStorage.setItem('resume-language',lang)}catch(e){}`);
 await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
 await cp(path.join(root,'public'),out,{recursive:true});
 await writeFile(path.join(out,'index.html'),home);await writeFile(path.join(out,'.nojekyll'),'');
 await mkdir(path.join(out,'projects'),{recursive:true});
 const catalogContent={};
 for(const lang of ['pt','en'])catalogContent[lang]=`<section class="catalog"><a class="back" data-home="" href="../index.html?lang=${lang}">${labels[lang].back}</a><div class="eyebrow">${labels[lang].projects}</div><h1>${labels[lang].catalog}</h1><p class="intro">${labels[lang].catalogSummary}</p>${projects.length?`<div class="project-grid">${projects.map(p=>card(p,lang,'')).join('')}</div>`:`<p class="empty">${labels[lang].empty}</p>`}</section>`;
 await writeFile(path.join(out,'projects/index.html'),bilingualPage({css,footer,root:'../',content:catalogContent,title:{pt:'Projetos | Matheus Carneiro',en:'Projects | Matheus Carneiro'},description:{pt:labels.pt.catalogSummary,en:labels.en.catalogSummary}}));
 for(const project of projects){
  const folder=path.join(out,'projects',project.slug);await mkdir(folder,{recursive:true});await copyAssets(project.folder,folder);
  const content={};
  for(const lang of ['pt','en']){
   const meta=project[lang].meta;
   content[lang]=`<article><div class="project-heading"><a class="back" data-home="#projetos" href="../../index.html?lang=${lang}#projetos">${labels[lang].back}</a><div class="eyebrow">${escape(meta.tags[0]||labels[lang].projects)}</div><h1>${escape(meta.title)}</h1><p class="intro">${escape(meta.summary)}</p><div class="tags">${meta.tags.map(t=>`<span>${escape(t)}</span>`).join('')}</div></div><div class="project-content">${project.cover?`<img src="${escape(project.cover)}" alt="" loading="lazy">`:''}${renderMarkdown(project[lang].body)}</div></article>`;
  }
  await writeFile(path.join(folder,'index.html'),bilingualPage({css,footer,root:'../../',content,title:{pt:project.pt.meta.title+' | Matheus Carneiro',en:project.en.meta.title+' | Matheus Carneiro'},description:{pt:project.pt.meta.summary,en:project.en.meta.summary}}));
 }
 return projects;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const projects=await buildSite(root);console.log(`Site gerado em dist/: ${projects.length} projeto(s) publicado(s).`)}catch(error){console.error(error.message);process.exitCode=1}
}
