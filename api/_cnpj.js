const TOKEN = process.env.CNPJ_API_TOKEN || 'ca5fe17f-b7b5-42a3-b0d2-6385eae0180c';
export async function consultarCNPJ(cnpj) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch('https://api.amnesiatechnology.de/v1/cnpj/' + cnpj + '?token=' + encodeURIComponent(TOKEN), { signal: controller.signal });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || !data.empresas || !data.empresas[0]) return null;
    const estabelecimento = data.estabelecimento || {};
    return {
      razao: String(data.empresas[0].razao_social || '').trim(),
      situacao: String(estabelecimento.situacao_cadastral_descricao || '').trim(),
      ativa: String(estabelecimento.situacao_cadastral || '') === '02'
    };
  } catch { return null; }
  finally { clearTimeout(timer); }
}
