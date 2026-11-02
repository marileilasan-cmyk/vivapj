import crypto from 'node:crypto';
import { db, configured } from './_db.js';
const ok=(p)=>{const a=Buffer.from(String(p||''));const b=Buffer.from(process.env.ADMIN_PASSWORD||'593120');return a.length===b.length && crypto.timingSafeEqual(a,b);};
export default async function handler(req,res){
  if(!ok(req.headers['x-admin-password'])) return res.status(401).json({error:'auth'});
  if(!configured()) return res.status(503).json({error:'storage_not_configured'});
  try {
    if(req.method==='GET') { const flat=(await db(['HGETALL','fichas']))||[]; const out=[]; for(let i=1;i<flat.length;i+=2){try{out.push(JSON.parse(flat[i]));}catch{}} out.sort((a,b)=>String(b.gerado_em).localeCompare(String(a.gerado_em))); return res.status(200).json(out); }
    if(req.method==='PATCH'){const id=String(req.query.id||'');const body=req.body||{};if(!id||!['pix_gerado','pago','expirado','cancelado'].includes(body.status))return res.status(400).json({error:'invalid'});const raw=await db(['HGET','fichas',id]);if(!raw)return res.status(404).json({error:'not_found'});const ficha=JSON.parse(raw);ficha.status=body.status;ficha.atualizado_em=new Date().toISOString();await db(['HSET','fichas',id,JSON.stringify(ficha)]);return res.status(200).json({ok:true});}
    return res.status(405).json({error:'method'});
  } catch(e){return res.status(503).json({error:'storage_error'});}
}
