# Validação da entrega — 19/10/2026

## Resultado

- `npm test`: **27 testes aprovados**. Regras financeiras e de estoque, validade dos dados, autorização, limitação de chamadas, privacidade e concorrência de edição.
- `npm run build` e `npm run check`: build estático, sintaxe, referências locais, exclusão dos fontes privilegiados e 25 páginas verificados.
- `npm audit --omit=dev --audit-level=moderate`: **zero vulnerabilidades reportadas** no conjunto de dependências de produção na execução desta entrega.

## Navegador real

Chromium 153, landing page nas larguras **320, 375, 768, 1024, 1440 e 1920 px**, sem transbordamento horizontal observado. A área real de privacidade também foi verificada em 375 px. Isso cobre os tamanhos testados, não todos os navegadores e dispositivos existentes.

Na demonstração incorporada foram executados: menu no celular, abertura do iframe, cadastro de produto, nome com marcação HTML tratado como texto, registro de venda com atualização de estoque/financeiro e consulta ao ZapChat. A sandbox mantém origem isolada: não acessa o armazenamento do documento pai. Nenhuma requisição ao Supabase foi feita pela demonstração. Também foram verificados redirecionamento de visitante sem sessão e campos obrigatórios do cadastro.

Na conta real foram executados: login por senha, carregamento da empresa pela API, cadastro de produto, persistência após recarregar a página, criação de pedido de privacidade, consulta de protocolo, visualização em 375 px, saída da sessão e cadastro de uma nova conta com criação do seu espaço. Não foram observados erros de JavaScript nos fluxos concluídos.

As requisições do navegador à autenticação e API reais foram encaminhadas pelo proxy HTTP permitido do ambiente de teste, sem substituir as respostas por mocks. Os testes usaram usuários e empresas fictícios.

## API e banco reais

Doze verificações concluídas contra o projeto Supabase conectado:

1. API rejeita acesso sem token.
2. CORS rejeita origem não cadastrada.
3. Aceite da versão dos termos é persistido.
4. Nova empresa começa sem os produtos fictícios da demonstração.
5. Uma venda é validada no servidor e persiste a baixa do estoque e a receita.
6. Revisão de gravação desatualizada retorna 409.
7. Conta sem vínculo não acessa outra empresa pela API.
8. RLS não retorna o estado de outra empresa.
9. Pedido de privacidade é persistido e devolve protocolo.
10. Outra conta não lê esse pedido.
11. Escrita direta de protocolos pelo cliente é rejeitada.
12. Exportação pessoal é limitada ao titular e não contém tokens de sessão.

As tabelas novas de aceite e solicitações têm RLS, não concedem leitura ao papel anônimo e não concedem INSERT/UPDATE aos usuários autenticados. A Edge Function `stockzap-api` foi atualizada para a versão 5. Sua autenticação é feita no serviço por `/auth/v1/user`; a opção `verify_jwt=false` do gateway foi preservada da função existente, sem tornar as operações de negócio públicas.

## Standards

A revisão encontrou uma falha de concorrência: uma consulta automática poderia atualizar a revisão global enquanto um formulário antigo permanecia aberto. Corrigido: consultas são suspensas durante a edição; respostas que chegam após a abertura de formulário são descartadas; uma resposta antiga não pode regredir uma revisão já gravada. Três testes de regressão executam as funções reais em Node VM.

A duplicação de regras entre API e navegador foi tratada com geração a partir dos módulos da API e um teste de paridade. A revisão não estabeleceu outra falha explorável nos fluxos examinados. Não houve um pentest independente ou teste de carga.

## Spec

Os rótulos herdados de setembro/empresa fictícia foram corrigidos na área real. Landing page, demonstração incorporada e conexão das contas com os módulos foram implementadas. Permanecem pendências organizacionais e de configuração para operação comercial e conformidade integral, detalhadas em `SEGURANCA_PRIVACIDADE.md`.

## Limites de autenticação e privacidade

A consulta pública de configuração do Auth mostrou `mailer_autoconfirm=true` no projeto atual; por isso o cadastro testado entrou diretamente, sem exigir e-mail de confirmação. O código também trata o caso de confirmação habilitada, mas a entrega e abertura de um e-mail real de confirmação ou recuperação não foram testadas. Revise URLs de retorno, SMTP e a exigência de confirmação no painel.

O advisor de segurança continua informando proteção contra senhas comprometidas desabilitada. A ferramenta disponível não expõe os ajustes de Auth necessários para habilitá-la ou impor a força mínima da senha no provedor.

Os pedidos de privacidade são uma fila persistida com protocolo; exigem acompanhamento e resposta pela equipe. Não há exclusão automática da conta ou rotina de descarte implantada. Identificação e canal público do controlador, retenção e mecanismo de transferência internacional precisam ser formalizados antes do uso comercial com dados reais.

## Limpeza dos testes

As três contas fictícias, quatro empresas de teste e seus protocolos/estados foram removidos após a validação. A consulta final confirmou zero contas, empresas e pedidos de teste remanescentes, mantendo os sete perfis que já existiam antes do trabalho.

## Revisão da experiência e correções de acesso

A revisão reproduziu dois erros de inicialização: o SDK local só existia em `dist/`, causando falha no login servido pelo Live Server; e o CORS recusava o alias exato da prévia e a porta 5500 com HTTP 403. O SDK gerado agora é versionado no código e regenerado pelo build. Somente os endereços exatos necessários foram adicionados à API, publicada como versão 6. A mesma negociação de acesso que retornava 403 passou a responder 204; origens não reconhecidas continuam recusadas e as operações continuam exigindo autenticação.

Também foi reproduzido no Chromium um formulário da demo com o botão de salvar fora da área visível após ampliar/reduzir o painel. O documento isolado agora sinaliza a abertura de formulário para a landing alinhar a área de trabalho, sem expor o armazenamento da conta. O teste usa cliques reais nos formulários em desktop e celular.

A demonstração tem documento público próprio, sem SDK de autenticação, confirmação de prontidão, indicador de carregamento, tempo limite e nova tentativa. A venda guiada executa `order.create` nas mesmas regras da API: gera pedido, baixa estoque e cria receita. Os resultados são enviados para a landing somente pela janela ativa da demo e com origem isolada. A navegação, ampliação, reinício e consultas ao ZapChat foram verificados.

A landing e a área interna usam os mesmos tokens azul/verde. A proposta de valor se organiza por vender sem retrabalho, identificar reposições e entender o dinheiro. Os seletores funcionam por clique e teclado. Animações respeitam `prefers-reduced-motion`. Novas contas recebem primeiros passos com ações para cadastrar produto, registrar venda e consultar financeiro.

Validação desta revisão: 23 testes Node aprovados e `npm run test:e2e` aprovado no Chromium 153, com venda guiada e resultado no estoque/financeiro, produto com HTML exibido como texto, formulários no desktop e celular, resposta atualizada do ZapChat, isolamento da sessão, seis larguras (320, 375, 768, 1024, 1440 e 1920), reinício, recuperação após bloqueio de carregamento e movimento reduzido. Build/check verificam 26 páginas. Nenhuma chamada à nuvem foi feita pela demo.

Novo teste contra Auth/API reais na porta 5500: cadastro, empresa vazia, primeiros passos, produto, venda, baixa de estoque, persistência após recarga, logout e login por senha com verificação da API antes do redirecionamento. Sem erros de JavaScript observados. Conta e empresa fictícias foram removidas; consulta final confirmou zero remanescentes e os sete perfis anteriores preservados. Entrega/abertura de e-mail de recuperação continua fora da verificação.

O site público `stockzap.vercel.app` ainda servia o código da branch principal anterior na inspeção. O PR #1 permanece o ponto de integração do frontend. A prévia Vercel exige autenticação, e a conexão Vercel deste ambiente não tem acesso àquele projeto; não se afirma teste de navegador nessa hospedagem protegida.

## Correção do carregamento em prévia protegida

Foi reproduzida a falha que o teste local anterior não cobria: o iframe com sandbox e origem opaca carregava o documento, mas os pedidos de CSS, JS e logo eram enviados como `cross-site`, sem o cookie `SameSite=Lax` da proteção de prévia. O servidor os redirecionava para a tela de autenticação, e a demo terminava por timeout. `tests/preview.e2e.cjs` falhou nesse cenário antes da correção e aprovou depois.

O build agora gera uma demo autocontida, com estilo, logo e um único bundle inline validado por hash CSP. A sandbox continua sem compartilhar origem ou armazenamento. Verificado em `/` e `/stockzap/`, numa porta aleatória, com a barreira de autenticação ativa: venda guiada concluída, estoque de 6 para 5, nenhuma requisição de recurso externo da demo, nenhuma requisição ao Supabase pela demo e script injetado bloqueado pela CSP.

Os links, recursos, redirecionamentos e callbacks deixaram de depender da raiz do domínio. `js/site.js` deriva a base pelo endereço do próprio script. `js/config.js` reúne apenas configuração pública. Cadastro/login têm checagem de disponibilidade, limites de espera e mensagens que distinguem credenciais incorretas, confirmação, rede e bloqueio de armazenamento. Erros de rede ao verificar usuário não encerram a sessão como se fosse inválida.

A função `stockzap-api` versão 7 está ativa. Validação HTTP real: preflight de `localhost:5173` e de outra prévia dentro do namespace da StockZap respondeu 204 com a origem exata; um domínio de outra conta respondeu 403 sem CORS; operação sem token respondeu 401. A liberação global dos endpoints de dados foi rejeitada na revisão automática e não foi aplicada. A alternativa aprovada preserva o escopo do projeto, permite portas locais e aceita uma lista explícita para novos domínios.

Um novo teste de navegador, com Auth/API reais encaminhados pelo proxy HTTP permitido, percorreu cadastro, aceite, empresa vazia, criação de produto, venda, baixa de estoque, persistência após recarga, logout, feedback de credenciais incorretas e novo login, em uma subpasta e com barreira de prévia. Não houve erros de JavaScript. A conta, as sessões e a empresa fictícias foram removidas; consulta final confirmou zero registros de teste remanescentes e sete perfis anteriores preservados. Nenhuma credencial foi gravada no relatório.

Checks atuais: 27 testes Node; `npm run build`; `npm run check` em 26 páginas; `npm run test:e2e`; `npm run test:preview`. A suíte anterior da demo continua cobrindo seis larguras, formulários desktop/celular, ZapChat, teclado, recuperação e movimento reduzido.

Limites: o navegador remoto chegou ao login da Vercel, e o conector respondeu 403 para a equipe proprietária do projeto. O teste na própria prévia protegida exige uma sessão autorizada. Não se deve confundir a simulação fiel de proteção local com teste já concluído na Vercel. A tentativa de conexão nativa do Chromium local ao Supabase encontrou o certificado do proxy do ambiente; a validação TLS não foi desabilitada. Por isso o teste de UI com dados reais usa encaminhamento HTTP pelo proxy autorizado e é complementado pela verificação HTTP dos cabeçalhos CORS reais.

Autenticação não é suportada por `file://`; use HTTP/HTTPS. Entrega de e-mails de confirmação/recuperação, outros motores de navegador e a revisão organizacional da LGPD permanecem fora dos fluxos verificados.

