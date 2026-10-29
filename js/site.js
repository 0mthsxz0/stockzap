(function(root){
  'use strict';
  const script=document.currentScript;
  const base=script?.src?new URL('../',script.src):new URL('./',location.href);
  function url(path=''){return new URL(String(path).replace(/^\/+/,''),base).href;}
  root.StockZapSite=Object.freeze({base:base.href,url});
})(window);
