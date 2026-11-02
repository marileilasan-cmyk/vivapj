import { consultarCNPJ } from './_cnpj.js';
// api/allowpay.js - Nova versão com AllowPay v2
const API_BASE = "https://allow-gi0i.onrender.com";
const API_KEY = process.env.ALLOWPAY_API_KEY;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        const input = req.body;
        
        // VALIDAÇÃO
        const amount = Number(input.amount) || 0;
        const cpf = (input.cpf || '').replace(/\D/g, '');
        const cnpj = (input.cnpj || '').replace(/\D/g, '');
        const telefone = (input.telefone || '').replace(/\D/g, '');
        const quantidade = parseInt(input.quantidade) || 0;
        
        const precos = {15:990,25:1650,50:3300,75:4950,100:6600,150:9900,200:13200,300:19800,500:33000};
        const etapa = input.etapa === 'oferta_adicional' ? 'oferta_adicional' : 'compra_principal';
        const valorCentavos = Math.round(amount * 100);
        const precoEsperado = etapa === 'oferta_adicional' ? 13200 : (precos[quantidade] ?? (quantidade >= 15 ? Math.round(quantidade * 66) : null));
        if (!API_KEY) return res.status(503).json({success:false,error:'Configure ALLOWPAY_API_KEY na Vercel.'});
        if (valorCentavos !== precoEsperado || cpf.length !== 11 || cnpj.length !== 14 || telefone.length < 10 || quantidade <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos ou incompletos'
            });
        }
        
        // Confirma novamente no servidor que o CNPJ está ativo antes de criar a cobrança.
        const empresa = await consultarCNPJ(cnpj);
        if (!empresa || !empresa.ativa) {
            return res.status(400).json({ success:false, error:'CNPJ não confirmado como ATIVO.' });
        }

        // CONVERTER VALOR para centavos
        // Nome do produto (sem "Sorte" ou "Viva" para evitar bloqueios)
        const nomeProduto = input.produto || "Título de Capitalização";
        
        // Gerar ID único para transação
        const transactionId = "VS-" + Date.now() + "-" + Math.random().toString(36).substr(2, 8);
        
        // PAYLOAD PARA A NOVA API ALLOWPAY
        const payload = {
            api_key: API_KEY,
            amount: valorCentavos,
            description: `VIVAPJ-TESTE-${etapa}: compra de ${quantidade} ${nomeProduto}`,
            customer: {
                name: input.nome || "Cliente",
                email: input.email || `cliente-${Date.now()}@example.com`,
                cellphone: telefone,
                taxId: cnpj
            }
        };
        
        console.log('Criando PIX AllowPay:', { etapa, amount: valorCentavos, quantidade });
        
        // CHAMADA PARA A NOVA API
        const response = await fetch(`${API_BASE}/api/v2/allowpay-seller/create-pix`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const responseData = await response.json();
        
        if (responseData.error) {
            throw new Error(responseData.error);
        }
        
        // VERIFICAR QR CODE
        const qrCode = responseData.pix_code || responseData.pix_qr_code || '';
        const pixCode = responseData.pix_code || '';
        
        if (!qrCode && !pixCode) {
            throw new Error('QR Code PIX não gerado');
        }
        
        // IMPORTANTE: Guardar o route para consulta de status
        const route = responseData.route || 'safepix';
        const txid = responseData.txid || transactionId;
        
        // Salvar no localStorage para debug (opcional)
        console.log('✅ PIX criado com sucesso:', { txid, route });
        
        // SUCESSO - MESMO FORMATO QUE O FRONT-END ESPERA
        return res.status(200).json({
            success: true,
            transaction_id: txid,
            txid: txid,
            route: route,
            qr_code: pixCode,
            qr_code_image: `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(pixCode)}`,
            codigo_pix: pixCode,
            valor: amount,
            quantidade: quantidade,
            expira_em: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message || 'Erro interno no servidor'
        });
    }
}