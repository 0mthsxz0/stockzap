/* =========================================
   STOCKZAP - ZAPCHAT
   Motor de personalização
========================================= */


/* =========================================
   ESTADO DO ZAPCHAT
========================================= */

const respostas = {};

let historico = [];

let perguntaAtual = null;


/* =========================================
   ELEMENTOS
========================================= */

const container = document.getElementById(
	"perguntaContainer"
);

const etapaAtual = document.getElementById(
	"etapaAtual"
);

const totalEtapas = document.getElementById(
	"totalEtapas"
);

const progresso = document.getElementById(
	"progressoPreenchido"
);

const botaoVoltar = document.getElementById(
	"botaoVoltar"
);


/* =========================================
   PERGUNTAS
========================================= */

const perguntas = StockZapOnboarding.questions;

/* =========================================
   ORDEM BASE
========================================= */

function construirFluxo() { return StockZapOnboarding.flow(respostas); }
let usuarioZapChat = null;
let salvando = false;
let concluido = false;
let avancando = false;
function guardarRascunho() {
 try { localStorage.setItem(`stockzap:usuario:${usuarioZapChat.id}:rascunho-zapchat:v1`, JSON.stringify(respostas)); } catch (_) {}
}
function aviso(texto) { document.getElementById('aviso-zapchat').textContent = texto; }

/* =========================================
   RENDERIZAR PERGUNTA
========================================= */

function renderizarPergunta(chave) {

	perguntaAtual = chave;

	const pergunta = perguntas[chave];

	if (!pergunta) {

		finalizarZapChat();

		return;

	}


	const numero = obterNumeroPergunta(chave);

	const total = construirFluxo().length;


	etapaAtual.textContent = numero;

	totalEtapas.textContent = total;


	const porcentagem =
		(numero / total) * 100;

	progresso.style.width =
		`${porcentagem}%`;


	botaoVoltar.style.visibility =
		historico.length > 0
			? "visible"
			: "hidden";


	let html = `

		<div class="pergunta-numero">
			Etapa ${numero}
		</div>

		<h1 class="pergunta-titulo">
			${pergunta.titulo}
		</h1>

		<p class="pergunta-descricao">
			${pergunta.descricao}
		</p>

		<div class="opcoes">
	`;


	for (const opcao of pergunta.opcoes) {

		const selecionada =
			pergunta.tipo === "multi" &&
			Array.isArray(respostas[chave]) &&
			respostas[chave].includes(opcao.id);


		html += `

			<button
				class="
					opcao
					${pergunta.tipo === "multi" ? "opcao-multi" : ""}
					${selecionada ? "selecionada" : ""}
				"
				onclick="
					selecionarOpcao(
						'${chave}',
						'${opcao.id}',
						this
					)
				"
			>

				<div class="opcao-icone">
					${opcao.icone}
				</div>

				<div class="opcao-conteudo">

					<strong>
						${opcao.titulo}
					</strong>

					<span>
						${opcao.descricao}
					</span>

				</div>

				${pergunta.tipo === "multi"
				? `
							<div class="checkbox">
								${selecionada ? "✓" : ""}
							</div>
						`
				: `
							<div class="opcao-seta">
								→
							</div>
						`
			}

			</button>

		`;

	}


	html += `</div>`;


	if (pergunta.tipo === "multi") {

		html += `

			<button
				class="botao-continuar"
				onclick="confirmarMultipla('${chave}')"
			>
				Continuar
			</button>

		`;

	}


	container.innerHTML = html;

}


/* =========================================
   SELECIONAR OPÇÃO
========================================= */

function selecionarOpcao(chave, valor, elemento) {
 if (salvando || avancando || concluido || chave !== perguntaAtual) return;

	const pergunta = perguntas[chave];


	/* MULTI */

	if (pergunta.tipo === "multi") {

		if (!Array.isArray(respostas[chave])) {

			respostas[chave] = [];

		}


		const index =
			respostas[chave].indexOf(valor);


		if (index === -1) {

			respostas[chave].push(valor);

		} else {

			respostas[chave].splice(index, 1);

		}


		elemento.classList.toggle(
			"selecionada"
		);


		const checkbox =
			elemento.querySelector(".checkbox");


		if (checkbox) {

			checkbox.textContent =
				elemento.classList.contains("selecionada")
					? "✓"
					: "";

		}


		guardarRascunho(); return;

	}


	/* SINGLE */

	respostas[chave] = valor;
 if (chave === 'oferta' && valor !== 'producao') { delete respostas.insumos; delete respostas.receita; }
 guardarRascunho();
 avancando = true;




	setTimeout(() => {

		avancando = false; proximaPergunta();

	}, 180);

}


/* =========================================
   CONFIRMAR MULTIPLA
========================================= */

function confirmarMultipla(chave) {
 if (salvando || avancando || concluido || chave !== perguntaAtual) return;

	if (
		!respostas[chave] ||
		respostas[chave].length === 0
	) {

		alert(
			"Selecione pelo menos uma opção para continuar."
		);

		return;

	}


	proximaPergunta();

}


/* =========================================
   PRÓXIMA PERGUNTA
========================================= */

function proximaPergunta() {

	const fluxo = construirFluxo();

	const indiceAtual =
		fluxo.indexOf(perguntaAtual);


	const proxima =
		fluxo[indiceAtual + 1];


	if (!proxima) {

		finalizarZapChat();

		return;

	}


	historico.push(perguntaAtual);


	renderizarPergunta(proxima);

}


/* =========================================
   VOLTAR
========================================= */

function voltarPergunta() {
 if(salvando || avancando || concluido) return;

	if (historico.length === 0) {

		return;

	}


	const anterior =
		historico.pop();


	renderizarPergunta(anterior);

}


/* =========================================
   NÚMERO DA PERGUNTA
========================================= */

function obterNumeroPergunta(chave) {

	const fluxo =
		construirFluxo();


	return fluxo.indexOf(chave) + 1;

}


/* =========================================
   SALVAR
========================================= */

function gerarConfiguracao() { return StockZapOnboarding.configuration(respostas); }

/* =========================================
   FINALIZAÇÃO
========================================= */

async function finalizarZapChat() {
 if (salvando || concluido) return;
 if (!StockZapOnboarding.valid(respostas)) { aviso('Responda todas as etapas antes de continuar.'); return; }
 salvando = true; botaoVoltar.disabled = true; aviso('Salvando seu perfil…');
 let configuracao;
 try {
  configuracao = await StockZapOnboardingService.save(stockzapSupabase, usuarioZapChat, respostas, localStorage);
  concluido = true;
  try { localStorage.removeItem(`stockzap:usuario:${usuarioZapChat.id}:rascunho-zapchat:v1`); } catch (_) {}
  aviso('Perfil salvo na sua conta.');
 } catch (erro) {
  aviso(erro.message + ' Suas respostas continuam nesta tela. Tente novamente.');
  const retry=document.createElement('button');retry.textContent='Tentar salvar novamente';retry.type='button';retry.addEventListener('click',()=>{retry.remove();finalizarZapChat();});
  document.getElementById('aviso-zapchat').append(retry);
  return;
 } finally { salvando = false; botaoVoltar.disabled = false; }

	progresso.style.width = "100%";

	etapaAtual.textContent =
		construirFluxo().length;

	botaoVoltar.style.visibility =
		"hidden";

	container.innerHTML = `

		<div class="resultado">

			<div class="resultado-sucesso">
				✓
			</div>

			<h2>
				Entendemos seu negócio.
			</h2>

			<p class="resultado-intro">
				Seu painel vai destacar a prioridade que você escolheu.
			</p>

			<div class="perfil-grid">

				<div class="perfil-item">
					<span>Operação</span>
					<strong>
						${configuracao.perfil.operacao}
					</strong>
				</div>

				<div class="perfil-item">
					<span>Segmento</span>
					<strong>
						${configuracao.perfil.segmento}
					</strong>
				</div>

				<div class="perfil-item">
					<span>Modelo</span>
					<strong>
						${configuracao.perfil.oferta}
					</strong>
				</div>

				<div class="perfil-item">
					<span>Maturidade</span>
					<strong>
						${configuracao.perfil.maturidade}
					</strong>
				</div>

				<div class="perfil-item">
					<span>WhatsApp</span>
					<strong>
						${configuracao.perfil.whatsapp}
					</strong>
				</div>

				<div class="perfil-item">
					<span>Prioridade</span>
					<strong>
						${configuracao.perfil.prioridade}
					</strong>
				</div>

			</div>

			<div class="configuracao">

				<h3>
					Seu foco inicial
				</h3>

				<ul>

					${configuracao.funcionalidades
			.map(
				item =>
					`<li>${item}</li>`
			)
			.join("")
		}

				</ul>

			</div>

			<button
				class="botao-finalizar"
				onclick="entrarNoStockZap()"
			>
				Continuar para o StockZap
			</button>

		</div>

	`;

}


/* =========================================
   ENTRAR NO STOCKZAP
========================================= */

function entrarNoStockZap() {
 if (concluido) window.location.replace('../funcionalidades_internas/dashboard.html');
}
function carregarRespostas() {
 try {
  const raw=localStorage.getItem(`stockzap:usuario:${usuarioZapChat.id}:rascunho-zapchat:v1`);
  const draft=raw?JSON.parse(raw):{};
  for(const [key,value] of Object.entries(draft)) {
   const q=perguntas[key];if(!q)continue;
   const choices=q.opcoes.map(o=>o.id);
   if(q.tipo==='multi'&&Array.isArray(value)&&value.every(v=>choices.includes(v)))respostas[key]=value;
   else if(q.tipo==='single'&&choices.includes(value))respostas[key]=value;
  }
 } catch (_) {}
}
document.addEventListener('DOMContentLoaded', async () => {
 try {
  const {data,error}=await stockzapSupabase.auth.getUser();
  if(error||!data.user){window.location.replace('login.html');return;}
  usuarioZapChat=data.user;
  stockzapSupabase.auth.onAuthStateChange((event,session)=>{
   if(event==='SIGNED_OUT'||(session?.user&&session.user.id!==usuarioZapChat.id)) window.location.replace('login.html');
  });
  const saved=await StockZapOnboardingService.load(stockzapSupabase,usuarioZapChat,localStorage);
  if(saved && new URLSearchParams(window.location.search).get('editar')!=='1'){window.location.replace('../funcionalidades_internas/dashboard.html');return;}
  carregarRespostas();
  const flow=construirFluxo();
  const next=flow.find(k=>!respostas[k]||(Array.isArray(respostas[k])&&!respostas[k].length))||flow[0];
  historico=flow.slice(0,flow.indexOf(next));
  renderizarPergunta(next);aviso('Vamos personalizar seu painel antes de começar.');
 } catch (_) {
  aviso('Não foi possível consultar seu perfil. Recarregue a página para tentar novamente.');
 }
});
