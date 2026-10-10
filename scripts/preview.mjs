import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const port=Number(process.env.PORT||8765);
const types={'.html':'text/html; charset=utf-8','.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
http.createServer(async(req,res)=>{
 try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end()};if((await stat(file)).isDirectory())file=path.join(file,'index.html');const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
