/* Good King V0.9.2 · configuración pública administrada.
   La publishable key puede vivir en el navegador con Auth + RLS.
   Nunca colocar service_role, secret key ni contraseña de base de datos aquí. */
window.GOOD_KING_CONFIG = Object.freeze({
  configVersion: '0.9.2', build: '2026-08-23-v092',
  supabaseUrl: 'https://iufpbpwkvrrvbolfnptw.supabase.co',
  supabasePublishableKey: 'sb_publishable_jav-XXPrPefkCbBawLrIzw_tqojhw4p',
  supabaseProjectRef: 'iufpbpwkvrrvbolfnptw', administratorEmail: 'goodking.bo@gmail.com', ownerEmail: 'gloria.msg27@gmail.com'
});
window.addEventListener('DOMContentLoaded',()=>{if(!document.querySelector('script[data-good-king-v092]')){const s=document.createElement('script');s.src='./v092.js?v=0.9.2';s.dataset.goodKingV092='1';document.body.appendChild(s);}});
window.addEventListener('load',()=>{if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js?v=0.9.2',{scope:'./',updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});});
