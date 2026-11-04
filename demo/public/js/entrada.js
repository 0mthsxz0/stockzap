/* Endereços antigos da demo não mantêm uma segunda landing ou login fictício. */
(function(){
 const nested=/\/demo\/public\/(?:index|login)\.html$/.test(window.location.pathname);
 const home=window.top===window?'../../stockzap.html#experimentar':'../../stockzap.html';
 const target=new URL(nested?home:'app.html#dashboard',window.location.href);
 // Na experimentação embutida, Sair devolve o visitante à página principal.
 window.top.location.replace(target.href);
})();
