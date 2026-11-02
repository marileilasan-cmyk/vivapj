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
    const emp = data.empresas[0] || {};
    const root = data || {};
    const first = (...vals) => vals.find(v => v !== undefined && v !== null && String(v).trim() !== '') ?? '';
    const fmtAddress = [first(estabelecimento.tipo_logradouro),first(estabelecimento.logradouro),first(estabelecimento.numero),first(estabelecimento.complemento),first(estabelecimento.bairro),first(estabelecimento.municipio?.descricao,estabelecimento.cidade),first(estabelecimento.uf),first(estabelecimento.cep)].filter(Boolean).join(' ');
    const socios = (root.socios || root.qsa || emp.socios || []).map(s => typeof s==='string'?s:first(s.nome,s.nome_socio,s.nome_completo)).filter(Boolean);
    const detalhes = {
      natureza_juridica: first(emp.natureza_juridica?.descricao,emp.natureza_juridica_descricao,root.natureza_juridica?.descricao),
      porte: first(emp.porte?.descricao,emp.porte_descricao,root.porte?.descricao),
      faixa_faturamento: first(emp.faixa_faturamento,root.faixa_faturamento),
      capital_social: first(emp.capital_social,root.capital_social),
      situacao_desde: first(estabelecimento.data_situacao_cadastral,estabelecimento.data_inicio_atividade),
      abertura: first(estabelecimento.data_inicio_atividade,emp.data_abertura,root.abertura),
      cnae_codigo: first(estabelecimento.cnae_fiscal_principal,estabelecimento.atividade_principal?.codigo,root.cnae_fiscal),
      cnae_descricao: first(estabelecimento.cnae_fiscal_principal_descricao,estabelecimento.atividade_principal?.descricao,root.cnae_fiscal_descricao),
      regime: first(emp.regime_tributario?.descricao,root.regime_tributario?.descricao),
      simples: first(emp.simples?.optante,root.simples?.optante,emp.opcao_pelo_simples),
      mei: first(emp.mei?.optante,root.mei?.optante,emp.opcao_pelo_mei),
      endereco: fmtAddress,
      telefone_receita: [first(estabelecimento.ddd1,estabelecimento.ddd_telefone_1),first(estabelecimento.telefone1,estabelecimento.telefone_1)].filter(Boolean).join(' ') + (estabelecimento.telefone2?' / '+estabelecimento.telefone2:''),
      email_receita: first(estabelecimento.email,root.email),
      socios
    };
    return { detalhes,
      razao: String(data.empresas[0].razao_social || '').trim(),
      situacao: String(estabelecimento.situacao_cadastral_descricao || '').trim(),
      ativa: String(estabelecimento.situacao_cadastral || '') === '02'
    };
  } catch { return null; }
  finally { clearTimeout(timer); }
}
