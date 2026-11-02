import { db, configured } from './_db.js';
import { consultarCNPJ } from './_cnpj.js';
const clean=(v,n=200)=>String(v ?? '').trim().slice(0,n);
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'method'});
  if(!configured()) return res.status(503).json({error:'storage_not_configured'});
  const b=req.body||{};
  const cpf=clean(b.cpf,14).replace(/\D/g,''); const cnpj=clean(b.cnpj,18).replace(/\D/g,'');
  const tx=clean(b.transaction_id,100);
  if(cpf.length!==11 || cnpj.length!==14 || !tx || !clean(b.telefone,20)) return res.status(400).json({error:'invalid'});
  const empresa=await consultarCNPJ(cnpj);
  if(!empresa || !empresa.ativa) return res.status(400).json({error:'cnpj_not_active'});
  const id=tx;
  const ficha={id, nome:clean(b.nome,120), cpf, cnpj, razao_social:empresa.razao || clean(b.razao_social,180), empresa_detalhes:empresa.detalhes || {}, telefone:clean(b.telefone,20), data_nascimento:clean(b.data_nascimento,20), quantidade:Number(b.quantidade)||0, valor:Number(b.valor)||0, transaction_id:tx, route:clean(b.route,60), produto:clean(b.produto,100), status:'pix_gerado', gerado_em:clean(b.gerado_em,40)||new Date().toISOString()};
  try { await db(['HSET','fichas',id,JSON.stringify(ficha)]); return res.status(200).json({ok:true,id}); }
  catch(e){ return res.status(503).json({error:'storage_error'}); }
}
