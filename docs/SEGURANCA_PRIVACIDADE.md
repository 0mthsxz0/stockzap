# Segurança, privacidade e operação

Esta revisão cobre o código e as configurações que puderam ser observadas. Não é certificação de segurança, parecer jurídico ou garantia integral de conformidade.

## Controles

- Autenticação Supabase, verificação de usuário na API e encerramento de sessão.
- Isolamento por empresa, RLS e checagem de associação antes de consultar o estado.
- Operações validadas e recalculadas no servidor; estado enviado pelo cliente não é aceito como fonte de verdade.
- Papéis owner/admin/operator/viewer, ações administrativas restritas e revisão otimista de gravações.
- Limite existente de 60 chamadas por minuto por conta; solicitações de privacidade limitadas a cinco por 24 horas.
- Dados pessoais do chat ficam em memória na sessão da página. O estado real do negócio não é salvo no localStorage pela nova aplicação.
- Demonstração isolada com sandbox, sem origem compartilhada, tokens ou acesso ao armazenamento da conta real.
- SDK empacotado localmente, dependências diretas fixadas e lockfile; sem scripts/fontes de terceiros ou analytics.
- CSP sem scripts inline, proteção contra enquadramento externo, no-referrer, nosniff, restrições de permissões e no-store.
- Saída escapada na interface; nomes e descrições são texto, sem execução de HTML. Exportações CSV neutralizam fórmulas iniciadas por = + - @.
- Aceite dos termos versionado com horário do banco, separado de autorização de marketing. Não existe coleta de consentimento para finalidades genéricas.
- Exportação pessoal, correção do perfil e solicitação de direitos com protocolo. Tabelas de solicitações e aceites têm RLS, leitura limitada à própria conta e escrita reservada ao serviço.

## Pendências de configuração e organização

1. Formalizar o nome/identificação e contato público do controlador e os responsáveis pelo atendimento.
2. Definir a tabela de retenção, descarte e backups; implementar a rotina correspondente. O texto público explicita essa limitação.
3. Formalizar o tratamento com Supabase e hospedagem e a hipótese válida para transferência internacional. O banco conectado fica no Canadá.
4. Manter processo de resposta a incidentes, verificação de solicitações e atendimento dentro dos prazos aplicáveis. A fila de pedidos não é um serviço de atendimento automático.
5. Revisar no Supabase Auth: confirmação de e-mail, força mínima das senhas, proteção contra senhas vazadas, limites, SMTP, URLs de retorno e CAPTCHA. A ferramenta disponível não permite confirmar ou alterar todas essas opções de autenticação.
6. Separar dados pessoais necessários à operação de informações sensíveis ou excessivas. O responsável por cada empresa precisa informar os seus clientes e colaboradores sobre o próprio tratamento.

O advisor do Supabase observou proteção contra senhas comprometidas desabilitada na inspeção inicial. A ativação depende das configurações e disponibilidade do projeto/plano. Orientação oficial: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Atendimento de pedidos

A equipe autorizada deve acompanhar `public.stockzap_privacy_requests` no Supabase. Os campos `status` (`pending`, `in_review`, `completed`, `rejected`), `response` e `updated_at` permitem registrar a análise. Não inclua senhas, documentos ou dados pessoais desnecessários na resposta. O titular pode consultar seus próprios protocolos na interface.

Uma exclusão precisa avaliar vínculos com empresas, obrigações legais e dados de terceiros. Antes de excluir uma conta, revogue as sessões, retire as associações e considere a validade remanescente de tokens. A criação de um protocolo nunca executa esse processo automaticamente.

## Fontes oficiais

- LGPD: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- Guias da ANPD: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes
- Segurança do Supabase: https://supabase.com/docs/guides/security/product-security
- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security

Os resultados da validação desta entrega estão em `VALIDACAO.md`.
