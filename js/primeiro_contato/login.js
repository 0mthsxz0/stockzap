const formLogin = document.getElementById("formLogin");

// Limite local de tentativas. A proteção efetiva também deve existir no servidor.
const limiteLogin = 5;
const pausaLogin = 15 * 60 * 1000;
const chaveLogin = "stockzap:login-attempts";
let loginPendente = false;
let tentativasLogin = { erros: 0, bloqueadoAte: 0 };
try {
 const salvo = JSON.parse(localStorage.getItem(chaveLogin));
 if (salvo && Number.isInteger(salvo.erros) && salvo.erros >= 0 &&
     Number.isFinite(salvo.bloqueadoAte) && salvo.bloqueadoAte >= 0) tentativasLogin = salvo;
} catch { /* Mantém o limite em memória se o armazenamento estiver indisponível. */ }
function salvarTentativasLogin() {
 try { localStorage.setItem(chaveLogin, JSON.stringify(tentativasLogin)); } catch {}
}
formLogin.addEventListener("submit", async (evento) => {
 evento.preventDefault();
 if (loginPendente) return;
 if (tentativasLogin.bloqueadoAte && tentativasLogin.bloqueadoAte <= Date.now()) {
  tentativasLogin = { erros: 0, bloqueadoAte: 0 };
  salvarTentativasLogin();
 }
 if (tentativasLogin.bloqueadoAte > Date.now()) {
  const minutos = Math.ceil((tentativasLogin.bloqueadoAte - Date.now()) / 60000);
  alert(`Limite de 5 erros atingido. Tente novamente em ${minutos} minuto(s).`);
  return;
 }
 const email = document.getElementById("email").value.trim();
 const senha = document.getElementById("senha").value;
 const botao = formLogin.querySelector('button[type="submit"]');
 loginPendente = true;
 botao.disabled = true;
 try {
  const { error } = await stockzapSupabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
   if (error.code === 'invalid_credentials' || error.status === 400 && !error.code) {
    tentativasLogin.erros++;
    if (tentativasLogin.erros >= limiteLogin) tentativasLogin.bloqueadoAte = Date.now() + pausaLogin;
    salvarTentativasLogin();
    alert(tentativasLogin.bloqueadoAte ? 'Limite de 5 erros atingido. Aguarde 15 minutos para tentar novamente.' : `E-mail ou senha incorretos. Restam ${limiteLogin - tentativasLogin.erros} tentativa(s).`);
   } else {
    alert(error.status === 429 ? 'Muitas tentativas. Aguarde antes de tentar novamente.' : 'Não foi possível entrar. Verifique sua conexão e tente novamente.');
   }
   return;
  }
  tentativasLogin = { erros: 0, bloqueadoAte: 0 };
  salvarTentativasLogin();
  window.location.href = "../funcionalidades_internas/dashboard.html";
 } catch {
  alert('Não foi possível conectar. Tente novamente mais tarde.');
 } finally {
  loginPendente = false;
  botao.disabled = false;
 }
});
document.getElementById("loginGoogle").addEventListener("click", async () => {
 try {
 const { error } = await stockzapSupabase.auth.signInWithOAuth({provider: "google", options: {redirectTo: new URL("../funcionalidades_internas/dashboard.html", location.href).href}});
 if (error) throw error;
 } catch { alert("Não foi possível entrar com Google. Tente novamente."); }
});
