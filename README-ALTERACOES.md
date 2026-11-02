# Atualização — CPF + CNPJ e Painel de Fichas

- O layout original foi preservado.
- CPF continua consultado pelo fluxo original.
- CNPJ é consultado no servidor pela mesma API Amnesia Technology do projeto de referência; o navegador recebe somente razão social, situação cadastral e indicador ativo.
- O PIX continua usando as rotas AllowPay originais.
- Após criação bem-sucedida do PIX, a ficha é enviada para `/api/lead` e salva no Redis/Upstash com as variáveis REST já conectadas à Vercel.
- Meta Pixel dispara `Lead` depois da resposta de sucesso da AllowPay. `Purchase` permanece reservado à confirmação de pagamento existente.
- Admin: `/admin.html`, senha inicial `593120` (pode ser substituída por `ADMIN_PASSWORD`).

## Armazenamento
O painel usa a mesma detecção automática das variáveis REST/Redis da Vercel/Upstash (`*_REST_API_URL` e `*_REST_API_TOKEN`, ou `REDIS_REST_URL` e `REDIS_REST_TOKEN`). É necessário que o banco Redis/Upstash esteja conectado ao projeto Vercel; não existe armazenamento persistente sem um serviço de banco conectado.

## Segurança e homologação
A senha padrão é apenas para homologação. Troque-a antes de publicar em produção e mantenha o repositório privado. O token CNPJ tem fallback herdado do projeto de referência; por segurança, rotacione-o e prefira `CNPJ_API_TOKEN`. A chave AllowPay do projeto original também deve ser rotacionada e migrada para variável de ambiente antes da produção.

A tela de R$ 500.000 foi identificada como simulação de teste. A exibição de contemplação real deve depender de resultado oficial validado.
