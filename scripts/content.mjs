import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function parseContent(source, filename = 'Markdown') {
  const match = source.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: inclua os metadados entre duas linhas ---.`);
  const doc = parseDocument(match[1], { uniqueKeys: true });
  if (doc.errors.length) throw new Error(`${filename}: ${doc.errors[0].message}`);
  const meta = doc.toJS();
  if (!meta || Array.isArray(meta) || typeof meta !== 'object') throw new Error(`${filename}: metadados inválidos.`);
  return { meta, body: match[2] };
}
function validateLocalized({ meta, body }, name) {
  for (const field of ['title', 'summary']) {
    if (typeof meta[field] !== 'string' || !meta[field].trim()) throw new Error(`${name}: ${field} é obrigatório.`);
  }
  if (!Array.isArray(meta.tags) || meta.tags.some(t => typeof t !== 'string' || !t.trim())) throw new Error(`${name}: tags deve ser uma lista de textos.`);
  if (!body.trim()) throw new Error(`${name}: escreva o conteúdo do projeto.`);
}
export async function loadProjects(directory) {
  const projects = [];
  for (const entry of (await readdir(directory, {withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    if (!entry.isDirectory() || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(entry.name)) throw new Error(`projects/${entry.name}: use uma pasta com nome como meu-projeto.`);
    const folder = path.join(directory, entry.name);
    const pt = parseContent(await readFile(path.join(folder, 'pt.md'), 'utf8'), `${entry.name}/pt.md`);
    if (typeof pt.meta.draft !== 'boolean') throw new Error(`${entry.name}/pt.md: draft deve ser true ou false.`);
    if (pt.meta.draft) continue;
    const en = parseContent(await readFile(path.join(folder, 'en.md'), 'utf8'), `${entry.name}/en.md`);
    validateLocalized(pt, `${entry.name}/pt.md`); validateLocalized(en, `${entry.name}/en.md`);
    if (typeof pt.meta.featured !== 'boolean') throw new Error(`${entry.name}: featured deve ser true ou false.`);
    if (!Number.isFinite(pt.meta.order)) throw new Error(`${entry.name}: order deve ser um número.`);
    if (pt.meta.cover !== undefined) {
      const cover = pt.meta.cover;
      if (typeof cover !== 'string' || !/^[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|gif)$/i.test(cover) || cover.startsWith('/') || cover.split('/').includes('..')) throw new Error(`${entry.name}: cover deve apontar para uma imagem na pasta do projeto.`);
      if (!(await stat(path.join(folder, cover))).isFile()) throw new Error(`${entry.name}: imagem de capa inválida.`);
    }
    projects.push({ slug: entry.name, folder, pt, en, featured: pt.meta.featured, order: pt.meta.order, cover: pt.meta.cover });
  }
  return projects.sort((a,b)=>a.order-b.order || a.slug.localeCompare(b.slug));
}
export function renderMarkdown(body) {
  return sanitizeHtml(marked.parse(body, {gfm:true}), {
    allowedTags: ['p','br','hr','h1','h2','h3','h4','h5','h6','strong','em','del','blockquote','ul','ol','li','a','img','pre','code','table','thead','tbody','tr','th','td'],
    allowedAttributes: { a:['href','title'], img:['src','alt','title','width','height','loading'], code:['class'], ol:['start'], th:['align'],td:['align'] },
    allowedSchemes: ['http','https','mailto'],
    allowedSchemesByTag: { img:['https'] },
    allowProtocolRelative: false,
    transformTags: { img: (tag, attrs) => ({tagName:tag,attribs:{...attrs,loading:'lazy'}}) }
  });
}
