import { consultarCNPJ } from './_cnpj.js';
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ found:false, error:'method' });
  const cnpj = String(req.query.cnpj || '').replace(/\D/g, '');
  if (cnpj.length !== 14) return res.status(400).json({ found:false, error:'cnpj_invalido' });
  const empresa = await consultarCNPJ(cnpj);
  if (!empresa) return res.status(200).json({ found:false });
  return res.status(200).json({ found:true, razao:empresa.razao, situacao:empresa.situacao, ativa:empresa.ativa });
}
