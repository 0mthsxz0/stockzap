# StockZap

Gestão de pequenos negócios com landing page, demonstração incorporada e aplicação conectada ao Supabase existente.

## Executar no VSCode / Windows

Instale **Node.js 24 ou posterior**. Na pasta do projeto:

```powershell
npm.cmd ci
npm.cmd run dev
```

Abra **http://localhost:3000**. O comando prepara os arquivos públicos e inicia um servidor local. Depois de editar o código, reinicie o comando para gerar uma nova versão. O uso da conta real depende de internet.

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run check
```

O SDK de autenticação também está versionado em `js/supabase-vendor.js`, para que a inicialização não falhe ao abrir o código pelo Live Server (porta 5500). O build regenera esse arquivo a partir da versão fixada no `package-lock.json`; não o edite manualmente. Para publicar, use sempre o build.

O build produz `dist/`. Apenas esse diretório deve ser publicado. A configuração de Vercel já define build, saída e cabeçalhos de segurança. Não publique a raiz inteira: ela preserva o histórico da antiga demonstração e os fontes do backend.

## Experiência

- `/`: landing page com benefícios, recursos, demonstração navegável, ZapChat, perguntas frequentes e informações de privacidade.
- A demonstração carrega `/demo.html` em um iframe com origem isolada e dados fictícios em memória. O documento gerado da demo inclui seus scripts, estilos e logo; não depende de recursos adicionais que perderiam o cookie de autorização da prévia. Não carrega o SDK de autenticação. Não edite `demo.html` manualmente: o build o regenera com uma CSP por hash. A landing oferece venda guiada com efeitos reais nas regras compartilhadas, navegação entre módulos, reinício, ampliação e recuperação de falha de carregamento. Ela não acessa a sessão, não consulta contas reais e não envia os dados fictícios ao banco.
- `/cadastro.html` e `/login.html`: Supabase Auth, confirmação de e-mail quando exigida pelo provedor, mensagens específicas para credenciais inválidas, rede, confirmação ou armazenamento bloqueado, sem informar se uma conta existe, e recuperação de senha.
- `/auth/callback.html`: retorno PKCE. Abra os links no mesmo navegador utilizado para iniciar o cadastro ou recuperação.
- `/app.html`: valida a sessão e abre a empresa vinculada à conta. Sem vínculo prévio, a API existente cria uma empresa vazia. Não importa os registros fictícios.
- Produtos, estoque, pedidos, financeiro, prazos, equipe, configuração da empresa e ZapChat usam as operações da API. Equipe cadastral não equivale a uma nova conta com acesso.
- Configurações → Privacidade e conta: edição do perfil, exportação pessoal, exportação da empresa e solicitações com protocolo e consulta de status.
- As URLs HTML antigas apontam para os mesmos fluxos. `/stockzap.html` também mostra a landing page. `/demo` e descendentes redirecionam para a demonstração incorporada.

## Supabase e hospedagem

O projeto existente é `xvbryihihhzehebchuqc`, e a API é `stockzap-api`. O navegador contém somente a URL e a chave publicável. As credenciais privilegiadas ficam no ambiente da Edge Function, nunca no frontend.

Os fontes da API existente foram trazidos para `supabase/functions/stockzap-api/`, com a extensão aditiva para privacidade e aceite versionado. A migração está em `supabase/migrations/`. As tabelas de empresas e operações preexistentes foram preservadas.

A API aceita o domínio de produção, as prévias `stockzap-…-matheusmjcandian-1663s-projects.vercel.app` da conta atual e endereços de loopback (`localhost`, `127.0.0.1`, `[::1]`) em portas variáveis. Outros domínios precisam ser adicionados à variável **`STOCKZAP_ALLOWED_ORIGINS`** nos Secrets da Edge Function, separados por vírgula, incluindo protocolo e porta quando houver. Exemplo: `https://minha-loja.example,https://homologacao.example`. Não há liberação global dos endpoints de dados.

`GET /functions/v1/stockzap-api/health` é público e responde apenas status, versão e se a origem foi autorizada. Esse diagnóstico não devolve dados de usuários. As operações de gestão continuam exigindo token válido, vínculo e permissão na empresa.

Os valores públicos da conexão ficam em `js/config.js`. Não coloque chaves secretas ou `service_role` nesse arquivo. O helper `js/site.js` resolve os links pela localização do próprio projeto; não é necessário alterar links ao publicar numa subpasta.

No painel Supabase → Authentication → URL Configuration, configure a Site URL e permita os retornos exatos usados pelo cadastro e recuperação:

- `https://stockzap.vercel.app/auth/callback.html`
- `https://stockzap.vercel.app/auth/callback.html?flow=recovery`
- Os mesmos caminhos em `http://localhost:3000`, se for testar localmente.

Mantenha a confirmação de e-mail, defina a força mínima da senha também no Supabase Auth, revise limites e CAPTCHA, configure SMTP de produção e habilite proteção contra senhas comprometidas quando disponível no plano. A validação de 6 caracteres no formulário não substitui essas configurações do provedor.

## Limites importantes

O ZapChat usa regras para consultar os dados. Não há IA generativa conectada. O WhatsApp é simulado apenas na demonstração. Não há pagamentos, emissão fiscal ou promessa de disponibilidade comercial.

As solicitações de privacidade são registradas para análise: não excluem automaticamente a conta. A equipe deve acompanhar a tabela `stockzap_privacy_requests`, verificar os direitos e atualizar status, resposta e data. Os papéis de usuários comuns não podem alterar esses protocolos. Leia [segurança e privacidade](docs/SEGURANCA_PRIVACIDADE.md) antes de coletar dados de clientes reais. Controles técnicos não equivalem a uma certificação LGPD.

Arquivos de código e documentação usam CRLF para facilitar o trabalho no Windows.

As regras compartilhadas do navegador são geradas a partir dos módulos da API: depois de alterar `core.mjs` ou `zapcare.mjs`, execute `npm.cmd run sync-core`. O build também faz essa geração. O teste de paridade impede diferenças silenciosas entre a demonstração e o servidor. Veja os resultados em [validação](docs/VALIDACAO.md).

## Teste de navegador reproduzível

Com o servidor local parado:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
npm.cmd run test:preview
```

O teste inicia e encerra o servidor, abre o Chromium e verifica venda guiada com baixa de estoque e receita, formulários no desktop e celular, ZapChat atualizado, isolamento da sessão, navegação por teclado, seis larguras, reinício, recuperação após falha de carregamento e movimento reduzido. Não cria contas nem envia dados ao Supabase. Para usar um Chromium já instalado, defina `CHROMIUM_EXECUTABLE_PATH`.

A função conectada está na versão 7, com diagnóstico de saúde e reconhecimento restrito de prévias da StockZap e portas locais. A publicação do frontend continua vinculada à integração do PR; o domínio de produção não recebe automaticamente alterações de uma branch de prévia.

## Portabilidade e publicação

Use um servidor **HTTP/HTTPS**, como `npm run dev`, VSCode Live Server ou hospedagem estática. O site pode ficar na raiz ou em uma subpasta; a demo foi verificada com uma barreira de autenticação por cookie `SameSite=Lax` nas duas posições. A conta real exige internet e armazenamento local permitido. Abrir o HTML por `file://` não é um modo de autenticação suportado.

A demo continua em sandbox sem `allow-same-origin` e sem acesso à conta. O cabeçalho específico de `demo.html` admite o pacote inline; a política CSP por hash dentro do próprio documento restringe a execução ao bundle gerado e bloqueia conexões de rede. Mantenha as duas políticas. Os testes verificam o bloqueio de script injetado e a ausência de recursos externos. Os demais documentos mantêm `script-src 'self'`.

`npm run test:preview` verifica raiz e subpasta em portas variáveis, com a proteção por cookie, e não cria contas reais. Para copiar `dist/` para outra hospedagem, preserve os arquivos e os cabeçalhos de `vercel.json` quando o servidor permitir essa configuração. Cadastre os domínios usados pela conta na API e os retornos de e-mail no Supabase. Nenhum site pode autorizar automaticamente um novo domínio no provedor de autenticação.



### Login Google e limites de senha
No Supabase Auth, habilite Google em Sign In / Providers com as credenciais do cliente OAuth. No Google Cloud, autorize o callback HTTPS do projeto Supabase (`https://xvbryihihhzehebchuqc.supabase.co/auth/v1/callback`). Em URL Configuration do Supabase, autorize o endereço `auth/callback.html` dos domínios de produção e previews utilizados, além do callback de recuperação existente. Defina o mínimo de senha no Supabase Auth como 6 para aceitar senhas de 6 caracteres também no servidor. Não coloque o segredo OAuth no frontend.

O formulário interrompe o login por senha neste navegador por 15 minutos após 5 respostas `invalid_credentials`. O contador persiste ao recarregar, é compartilhado pelas abas nas próximas submissões e zera após login válido ou fim da pausa. Falhas de rede e de confirmação de e-mail não contam. Essa proteção local pode ser contornada apagando o armazenamento e não substitui rate limits e CAPTCHA no Supabase Auth. Google e recuperação continuam disponíveis. A recuperação usa o fluxo PKCE já existente.

### Questionário e perfil da empresa
No primeiro acesso autenticado, após confirmação de e-mail quando exigida e aceite dos termos, proprietários e administradores respondem ao questionário original do ZapChat: 11 etapas, com duas perguntas adicionais para produção própria. Cada avanço salva as respostas na empresa usando a ação existente `onboarding.save`, com revisão para evitar sobrescritas entre abas. Se sair antes de concluir, o próximo acesso retoma a primeira etapa pendente. Empresas existentes sem questionário concluído também passam por esse fluxo; operadores e usuários de consulta não precisam responder.

O cartão da empresa na barra lateral abre `app.html#empresa`, com os dados cadastrais e o resumo das respostas. Proprietários e administradores podem revisar o questionário ou abrir a edição dos dados cadastrais. Revisar inicia uma nova passagem pelas respostas existentes; ao salvar uma etapa, o questionário fica pendente até a nova conclusão. As respostas não habilitam integrações indisponíveis nem criam produtos ou dados financeiros. A persistência usa o endpoint já existente, sem nova migração ou alteração de Edge Function.

Validação reproduzível: `npm test`, `npm run build`, `npm run check` e `npm run test:onboarding`. Para usar Chromium instalado no Linux, execute `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:onboarding`. O teste de navegador simula autenticação e API, sem criar contas ou alterar registros reais.

A pergunta final permite ordenar prioridades por seleção: a primeira opção marcada recebe 1, a segunda 2, e assim por diante. Desmarcar reajusta a numeração; marcar novamente coloca a opção no fim. A ordem é salva no questionário e aparece numerada no perfil. Respostas antigas com uma única prioridade são preservadas como prioridade 1.


### Carregamento com raio
Login, cadastro, confirmação de acesso e abertura do aplicativo usam a cortina de raio verde: ele cai uma vez, espera os dados e abre as duas metades da tela para revelar o conteúdo pronto ou uma mensagem de erro. O retorno entre páginas evita repetir a queda. A preferência de movimento reduzido troca os deslocamentos por um fade curto. A transição não depende de imagens externas ou de bibliotecas de animação. Verifique com `npm run test:loading` (ou `CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:loading`).
