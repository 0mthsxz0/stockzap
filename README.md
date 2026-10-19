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

- `/`: landing page com benefícios, recursos, demonstração navegável, ZapCare, perguntas frequentes e informações de privacidade.
- A demonstração carrega `/demo.html` em um iframe com origem isolada e dados fictícios em memória. O documento da demo não carrega o SDK de autenticação. A landing oferece venda guiada com efeitos reais nas regras compartilhadas, navegação entre módulos, reinício, ampliação e recuperação de falha de carregamento. Ela não acessa a sessão, não consulta contas reais e não envia os dados fictícios ao banco.
- `/cadastro.html` e `/login.html`: Supabase Auth, confirmação de e-mail quando exigida pelo provedor, mensagens genéricas e recuperação de senha.
- `/auth/callback.html`: retorno PKCE. Abra os links no mesmo navegador utilizado para iniciar o cadastro ou recuperação.
- `/app.html`: valida a sessão e abre a empresa vinculada à conta. Sem vínculo prévio, a API existente cria uma empresa vazia. Não importa os registros fictícios.
- Produtos, estoque, pedidos, financeiro, prazos, equipe, configuração da empresa e ZapCare usam as operações da API. Equipe cadastral não equivale a uma nova conta com acesso.
- Configurações → Privacidade e conta: edição do perfil, exportação pessoal, exportação da empresa e solicitações com protocolo e consulta de status.
- As URLs HTML antigas apontam para os mesmos fluxos. `/stockzap.html` também mostra a landing page. `/demo` e descendentes redirecionam para a demonstração incorporada.

## Supabase e hospedagem

O projeto existente é `xvbryihihhzehebchuqc`, e a API é `stockzap-api`. O navegador contém somente a URL e a chave publicável. As credenciais privilegiadas ficam no ambiente da Edge Function, nunca no frontend.

Os fontes da API existente foram trazidos para `supabase/functions/stockzap-api/`, com a extensão aditiva para privacidade e aceite versionado. A migração está em `supabase/migrations/`. As tabelas de empresas e operações preexistentes foram preservadas.

A API aceita as origens `https://stockzap.vercel.app`, `http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:4173` e `http://127.0.0.1:4173`, `http://localhost:5500`, `http://127.0.0.1:5500` e o alias exato da prévia `https://stockzap-git-feature-lan-162467-matheusmjcandian-1663s-projects.vercel.app`. Para outro domínio, revise a lista em `index.ts` e republique a função. **Não libere todas as origens.**

No painel Supabase → Authentication → URL Configuration, configure a Site URL e permita os retornos exatos usados pelo cadastro e recuperação:

- `https://stockzap.vercel.app/auth/callback.html`
- `https://stockzap.vercel.app/auth/callback.html?flow=recovery`
- Os mesmos caminhos em `http://localhost:3000`, se for testar localmente.

Mantenha a confirmação de e-mail, defina a força mínima da senha também no Supabase Auth, revise limites e CAPTCHA, configure SMTP de produção e habilite proteção contra senhas comprometidas quando disponível no plano. A validação de 12 caracteres no formulário não substitui essas configurações do provedor.

## Limites importantes

O ZapCare usa regras para consultar os dados. Não há IA generativa conectada. O WhatsApp é simulado apenas na demonstração. Não há pagamentos, emissão fiscal ou promessa de disponibilidade comercial.

As solicitações de privacidade são registradas para análise: não excluem automaticamente a conta. A equipe deve acompanhar a tabela `stockzap_privacy_requests`, verificar os direitos e atualizar status, resposta e data. Os papéis de usuários comuns não podem alterar esses protocolos. Leia [segurança e privacidade](docs/SEGURANCA_PRIVACIDADE.md) antes de coletar dados de clientes reais. Controles técnicos não equivalem a uma certificação LGPD.

Arquivos de código e documentação usam CRLF para facilitar o trabalho no Windows.

As regras compartilhadas do navegador são geradas a partir dos módulos da API: depois de alterar `core.mjs` ou `zapcare.mjs`, execute `npm.cmd run sync-core`. O build também faz essa geração. O teste de paridade impede diferenças silenciosas entre a demonstração e o servidor. Veja os resultados em [validação](docs/VALIDACAO.md).

## Teste de navegador reproduzível

Com o servidor local parado:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

O teste inicia e encerra o servidor, abre o Chromium e verifica venda guiada com baixa de estoque e receita, formulários no desktop e celular, ZapCare atualizado, isolamento da sessão, navegação por teclado, seis larguras, reinício, recuperação após falha de carregamento e movimento reduzido. Não cria contas nem envia dados ao Supabase. Para usar um Chromium já instalado, defina `CHROMIUM_EXECUTABLE_PATH`.

A correção de CORS da prévia e da porta 5500 já está na versão 6 da função conectada. A publicação do frontend continua vinculada à integração do PR; o domínio de produção não recebe automaticamente alterações de uma branch de prévia.
