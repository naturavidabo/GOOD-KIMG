from pathlib import Path

# Surgical V0.9.1 patch. No DB schema/data changes.
p=Path('app.js'); s=p.read_text()
def one(old,new):
    global s
    if s.count(old)!=1: raise SystemExit(f'app.js unexpected match count for: {old[:60]}')
    s=s.replace(old,new,1)
one("const APP_VERSION = '0.9.0';","const APP_VERSION = '0.9.1';")
one("const PUBLIC_CONFIG = window.GOOD_KING_CONFIG || {};","const PUBLIC_CONFIG = window.GOOD_KING_CONFIG || {};\nconst PUBLIC_CONFIG_VERSION = String(PUBLIC_CONFIG.configVersion || 'unknown');\nconst PUBLIC_CONFIG_BUILD = String(PUBLIC_CONFIG.build || 'unknown');")
one('const NETWORK_TIMEOUT_MS = 12000;','const NETWORK_TIMEOUT_MS = 15000;')
one("navigator.serviceWorker.register('./sw.js?v=0.9.0'","navigator.serviceWorker.register('./sw.js?v=0.9.1'")
s=s.replace('Good King V0.9.0</p><h1>','Good King V0.9.1</p><h1>')
s=s.replace("createAutoBackup('migración e inicio de V0.9.0')","createAutoBackup('migración e inicio de V0.9.1')")
marker="window.addEventListener('error', event => logAppError('window-error'"
if marker not in s: raise SystemExit('app.js marker not found')
override=r'''
/* V0.9.1 HOTFIX: acceso resiliente y reparación PWA acotada a Good King. */
function getGoodKingServiceWorkersV091(){
  if(!('serviceWorker' in navigator)) return Promise.resolve([]);
  return navigator.serviceWorker.getRegistration('./').then(r=>r?[r]:[]);
}
friendlyConnectionError = function(error){
  const text=String(error?.message||error||'').toLowerCase(), status=Number(error?.status||0);
  if(error?.name==='AbortError') return `Supabase no respondió dentro de 15 segundos. Proyecto: ${runtimeSupabaseConfig.projectRef||OFFICIAL_SUPABASE_PROJECT_REF}. Puede estar pausado o reactivándose.`;
  if(isFetchFailure(error)) return `No se pudo contactar al proyecto ${runtimeSupabaseConfig.projectRef||OFFICIAL_SUPABASE_PROJECT_REF}. Puede estar pausado, sin red o bloqueado temporalmente. Ejecuta “Diagnosticar conexión”.`;
  if(status===401||status===403||text.includes('invalid api key')||text.includes('apikey')) return 'Supabase rechazó la clave pública o el acceso. Usa “Restablecer conexión oficial” y vuelve a diagnosticar.';
  if(text.includes('invalid login credentials')||text.includes('invalid credentials')) return 'Correo o contraseña incorrectos. La conexión con Supabase sí respondió.';
  if(text.includes('email not confirmed')) return 'El correo existe, pero todavía no está confirmado en Supabase Auth.';
  return String(error?.message||error||'Error de conexión desconocido.');
};
seedSupabaseConfig = async function(){
  const current=await getRecord('settings','supabase-config');
  if(!OFFICIAL_SUPABASE_URL||!OFFICIAL_SUPABASE_PUBLISHABLE_KEY) throw new Error(`La configuración pública de Good King no cargó correctamente (config ${PUBLIC_CONFIG_VERSION}, build ${PUBLIC_CONFIG_BUILD}). Usa “Reparar actualización”.`);
  const raw=current?.value||{}, url=normalizeSupabaseUrl(raw.url||''), key=normalizeSupabaseKey(raw.anonKey||raw.publishableKey||'');
  let ref=''; try{ref=new URL(url).hostname.split('.')[0]||'';}catch(_){}
  const repair=!current||!url||!key||LEGACY_WRONG_SUPABASE_URLS.has(url)||ref===OFFICIAL_SUPABASE_PROJECT_REF||raw.managed!==false;
  const finalConfig=normalizeSupabaseConfig(repair?{...raw,url:OFFICIAL_SUPABASE_URL,anonKey:OFFICIAL_SUPABASE_PUBLISHABLE_KEY,enabled:true,managed:true,configVersion:PUBLIC_CONFIG_VERSION,configBuild:PUBLIC_CONFIG_BUILD,repairedAt:nowIso()}:raw);
  setRuntimeSupabaseConfig(finalConfig);
  if(!current||current.value?.url!==finalConfig.url||normalizeSupabaseKey(current.value?.anonKey)!==finalConfig.anonKey||current.value?.configBuild!==PUBLIC_CONFIG_BUILD) await putRecord('settings',{id:'supabase-config',value:{...finalConfig,updatedAt:nowIso()},updatedAt:nowIso()});
  return finalConfig;
};
runConnectionDiagnostic = async function({showToast=true}={}){
  const target=$('authDiagnosticResult'), steps=[];
  const show=(cls='')=>{if(target){target.hidden=false;target.className=`connection-result diagnostic-steps ${cls}`.trim();target.textContent=steps.join('\n');}};
  try{
    const url=activeSupabaseUrl(), key=activeSupabaseKey();
    steps.push(`1. Configuración: ${url&&key?'correcta':'incompleta'} · build ${PUBLIC_CONFIG_BUILD}`); show();
    if(!url||!key) throw new Error('Falta URL o clave pública.');
    if(!window.supabase?.createClient) throw new Error('El cliente local de Supabase no está disponible. Usa Reparar actualización.');
    steps.push(`2. Cliente Supabase: ${window.supabase.__goodKingLocalClient?'local integrado':'disponible'}`); show();
    steps.push(`3. Internet: ${navigator.onLine?'disponible':'sin conexión'}`); show();
    if(!navigator.onLine) throw new Error('El dispositivo está sin conexión.');
    const health=await checkSupabaseHealth(); steps.push(`4. Auth: disponible · HTTP ${health.status} · ${health.latencyMs} ms`); show();
    const r=await fetchWithTimeout(`${url}/rest/v1/`,{headers:{apikey:key,Accept:'application/openapi+json'}},NETWORK_TIMEOUT_MS);
    if(!r.ok) throw Object.assign(new Error(`API de datos HTTP ${r.status}`),{status:r.status});
    steps.push('5. API de datos: disponible');
    const {data:{session},error}=await createSupabaseClient().auth.getSession(); if(error) throw error;
    steps.push(session?.user?.id?'6. Sesión: válida':'6. Sesión: todavía no iniciada'); show('success');
    if(showToast) toast('Diagnóstico correcto: Supabase está accesible.');
    const report={ok:true,checkedAt:nowIso(),url,projectRef:runtimeSupabaseConfig.projectRef,health,steps,client:'local-v091'};
    await putRecord('appMeta',{id:'last-supabase-health',...report}); return report;
  }catch(error){steps.push(`Problema: ${friendlyConnectionError(error)}`);show('error');if(showToast)toast('El diagnóstico encontró un problema. Revisa el detalle en pantalla.',4200);throw error;}
};
forceAppRefresh = async function(){
  if(!confirm('Se reparará la actualización sin borrar ventas, caja, clientes ni IndexedDB. ¿Continuar?')) return;
  try{if(db) await createAutoBackup('antes de reparar actualización').catch(()=>{}); const rs=await getGoodKingServiceWorkersV091(); await Promise.all(rs.map(r=>r.unregister())); const ks=await caches.keys(); await Promise.all(ks.filter(k=>k.startsWith('good-king-')).map(k=>caches.delete(k))); const next=new URL('./index.html',location.href);next.searchParams.set('actualizar',Date.now());location.replace(next.href);}catch(error){await logAppError('force-update-repair',error);toast(`No se pudo reparar la actualización: ${error.message||error}`,6200);}
};
'''
s=s.replace(marker,override+'\n'+marker,1)
p.write_text(s)

p=Path('index.html'); h=p.read_text(); h=h.replace('V0.9.0','V0.9.1').replace('?v=0.9.0','?v=0.9.1'); h=h.replace('  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.109.0" crossorigin="anonymous"></script>','  <script src="vendor/supabase-lite.js?v=0.9.1"></script>'); h=h.replace('V0.9.1 · Operación integrada, control remoto y sincronización reforzada','V0.9.1 · Hotfix de acceso, PWA y sincronización'); p.write_text(h)
p=Path('v09.js'); t=p.read_text().replace("const V09_VERSION = '0.9.0';","const V09_VERSION = '0.9.1';").replace('Operación integrada, control remoto y sincronización reforzada','Hotfix de acceso, PWA y sincronización'); p.write_text(t)
p=Path('styles.css'); c=p.read_text(); css='\n/* V0.9.1 — diagnóstico legible */\n.connection-result.diagnostic-steps{white-space:pre-line;line-height:1.5;text-align:left}\n.connection-result.diagnostic-steps.success{box-shadow:0 0 0 1px rgba(18,104,65,.12) inset}\n.connection-result.diagnostic-steps.error{box-shadow:0 0 0 1px rgba(177,15,26,.12) inset}\n'; p.write_text(c if 'diagnostic-steps' in c else c.rstrip()+css)
print('V0.9.1 hotfix applied')
