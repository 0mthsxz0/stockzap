const recuperar = document.getElementById('recuperar');
const redefinir = document.getElementById('redefinir');
const statusSenha = document.getElementById('status');
stockzapSupabase.auth.onAuthStateChange(event => {
 if (event === 'PASSWORD_RECOVERY') { recuperar.hidden = true; redefinir.hidden = false; }
});
recuperar.addEventListener('submit', async event => {
 event.preventDefault(); const botao = recuperar.querySelector('button'); botao.disabled = true;
 try {
 const {error} = await stockzapSupabase.auth.resetPasswordForEmail(document.getElementById('email').value.trim(), {redirectTo: new URL('recuperar-senha.html', location.href).href});
 if(error) throw error;
 statusSenha.textContent = 'Se houver uma conta com esse e-mail, você receberá um link para redefinir a senha.';
 } catch { statusSenha.textContent = 'Não foi possível enviar o link. Tente novamente mais tarde.'; }
 finally { botao.disabled = false; }
});
redefinir.addEventListener('submit', async event => {
 event.preventDefault(); const senha = document.getElementById('senha').value;
 if(senha.length < 6 || senha !== document.getElementById('confirmar').value) {statusSenha.textContent = 'Use pelo menos 6 caracteres e confirme a mesma senha.'; return;}
 const botao = redefinir.querySelector('button'); botao.disabled = true;
 try {
 const {error} = await stockzapSupabase.auth.updateUser({password: senha}); if(error) throw error;
 await stockzapSupabase.auth.signOut(); redefinir.hidden = true;
 statusSenha.textContent = 'Senha atualizada. Volte ao login para entrar.';
 } catch {statusSenha.textContent = 'Não foi possível atualizar a senha. Solicite um novo link.';}
 finally {botao.disabled = false;}
});
