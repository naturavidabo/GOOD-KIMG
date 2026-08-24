'use strict';
/* Good King V0.9.5 · continuidad de sesión y ergonomía operativa */
const V095_VERSION='0.9.5';

/* Una actualización del App Shell nunca debe expulsar a un dispositivo ya validado.
   Si Supabase tarda en restaurar su sesión, usamos el contexto local verificado y
   reintentamos la sesión remota en segundo plano. Cerrar sesión explícitamente sigue
   deshabilitando este acceso. */
bootstrapAuthentication=async function(){
  showAuthGate('Verificando sesión y permisos…');setAuthPanel('authLoadingPanel');await seedSupabaseConfig();
  const cached=await getCachedAuthContext();
  const disabled=(await getRecord('settings','offline-auth-disabled'))?.value===true;
  try{
    const client=createSupabaseClient();
    if(authSubscription)authSubscription.unsubscribe?.();
    const {data:sub}=client.auth.onAuthStateChange(async(event,session)=>{
      if(event==='SIGNED_OUT'){
        const explicit=(await getRecord('settings','offline-auth-disabled'))?.value===true;
        if(explicit){authSession=null;authContext=null;updateAuthenticatedUI();showAuthGate('Sesión cerrada.');setAuthPanel('loginForm');return;}
        const fallback=await getCachedAuthContext();
        if(fallback){authSession=null;authContext={...fallback,offline:true};updateAuthenticatedUI();hideAuthGate();}
      }
      if(session&&['SIGNED_IN','TOKEN_REFRESHED','INITIAL_SESSION'].includes(event)){
        try{await completeAuthentication(session)}catch(error){await logAppError('auth-state-v095',error)}
      }
    });
    authSubscription=sub.subscription;
    const {data:{session},error}=await client.auth.getSession();
    if(error)throw error;
    if(session){await completeAuthentication(session);return;}
    if(cached&&!disabled){authSession=null;authContext={...cached,offline:true};updateAuthenticatedUI();hideAuthGate();toast('Acceso local verificado. Reconectando la nube…',3200);setTimeout(async()=>{try{const s=await ensureAuthSession();if(s)await completeAuthentication(s)}catch(e){await logAppError('auth-background-v095',e)}},1200);return;}
    $('offlineAccessBtn').hidden=!cached||disabled;
    $('loginEmail').value=(await getRecord('settings','last-login-email'))?.value||ADMIN_EMAIL;
    showAuthGate('Ingresa con uno de los usuarios autorizados.');setAuthPanel('loginForm');
  }catch(error){
    await logAppError('auth-bootstrap-v095',error);
    if(cached&&!disabled){authSession=null;authContext={...cached,offline:true};updateAuthenticatedUI();hideAuthGate();toast('Sin conexión con la nube. GOOD KING continúa en modo local.',4200);return;}
    $('loginResult').textContent=error.message||'No se pudo verificar la sesión.';$('loginResult').className='connection-result error';setAuthPanel('loginForm');
  }
};

/* Mantener el listado del pedido como zona principal. */
function tuneCartV095(){
  const panel=$('cartPanel'),items=$('cartItems'),form=panel?.querySelector('.order-form');if(!panel||!items||!form)return;
  panel.classList.add('cart-v095');
  const note=form.querySelector('.text-note');if(note){note.classList.add('compact-note-v095');const input=note.querySelector('input');if(input)input.placeholder='Observación adicional (opcional)';}
}

/* Vista de impresión compacta: dos comprobantes, uno por hoja/ticket, sin páginas vacías. */
const showPrintV094=showPrint;
showPrint=function(sale,title='Vista previa'){
  showPrintV094(sale,title);
  const stack=document.querySelector('.ticket-stack-v094');if(stack)stack.classList.add('print-two-tickets-v095');
};

window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{
  document.title='Good King V0.9.5';
  const side=document.querySelector('.side-footer span');if(side)side.textContent='V0.9.5 · Sesión persistente, carrito y tickets optimizados';
  tuneCartV095();
},140));
