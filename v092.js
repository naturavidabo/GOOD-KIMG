'use strict';

/* Good King V0.9.2 · estado real de nube y continuidad local */
const V092_VERSION = '0.9.2';
const originalRefreshStatusV092 = refreshStatus;
const originalRenderModuleV092 = renderModule;
let cloudHealthV092 = { state:'unknown', checkedAt:null, latencyMs:null, message:null };
let cloudHealthTimerV092 = null;

function syncAgeLabelV092(value) {
  if (!value) return 'sin sincronizar';
  const age = Math.max(0, Date.now() - Date.parse(value));
  if (!Number.isFinite(age)) return 'sincronización desconocida';
  if (age < 60_000) return 'ahora';
  if (age < 3_600_000) return `hace ${Math.floor(age / 60_000)} min`;
  if (age < 86_400_000) return `hace ${Math.floor(age / 3_600_000)} h`;
  return `hace ${Math.floor(age / 86_400_000)} d`;
}

async function probeCloudHealthV092({ force = false } = {}) {
  if (!navigator.onLine) {
    cloudHealthV092 = { state:'offline', checkedAt:nowIso(), latencyMs:null, message:'Sin internet' };
    return cloudHealthV092;
  }
  const previous = await getRecord('appMeta','cloud-health-v092');
  const previousAge = previous?.checkedAt ? Date.now() - Date.parse(previous.checkedAt) : Infinity;
  if (!force && previous && previousAge < 60_000) {
    cloudHealthV092 = previous;
    return cloudHealthV092;
  }
  try {
    const result = await checkSupabaseHealth();
    cloudHealthV092 = { id:'cloud-health-v092', state:'healthy', checkedAt:nowIso(), latencyMs:result.latencyMs, message:'Supabase disponible', appVersion:APP_VERSION };
  } catch (error) {
    cloudHealthV092 = { id:'cloud-health-v092', state:'unreachable', checkedAt:nowIso(), latencyMs:null, message:friendlyConnectionError(error), appVersion:APP_VERSION };
    await logAppError('cloud-health-v092', error, { projectRef:OFFICIAL_SUPABASE_PROJECT_REF });
  }
  await putRecord('appMeta', cloudHealthV092);
  return cloudHealthV092;
}

function cloudLabelV092() {
  if (!navigator.onLine || cloudHealthV092.state === 'offline') return ['Nube pendiente','offline'];
  if (cloudHealthV092.state === 'healthy') return [`Nube activa${cloudHealthV092.latencyMs != null ? ` · ${cloudHealthV092.latencyMs} ms` : ''}`,'online'];
  if (cloudHealthV092.state === 'unreachable') return ['Nube sin respuesta','warning'];
  return ['Nube verificando','neutral'];
}

refreshStatus = async function() {
  await originalRefreshStatusV092();
  const [queue,lastSync] = await Promise.all([getAllRecords('syncQueue'),getRecord('appMeta','last-sync')]);
  const pending = queue.filter(item => ['pending','error'].includes(item.status)).length;
  const blocked = queue.filter(item => item.status === 'blocked').length;
  const [cloudText,cloudClass] = cloudLabelV092();
  const localText = navigator.onLine ? 'Internet activo' : 'Sin internet';
  const pendingText = blocked ? `${pending} pendientes · ${blocked} bloqueados` : `${pending} pendiente${pending === 1 ? '' : 's'}`;
  const syncText = `Última sync: ${syncAgeLabelV092(lastSync?.checkedAt)}`;
  const status = $('syncStatus');
  if (status) {
    status.className = `sync-status-v092 ${cloudClass}`;
    status.innerHTML = `<span class="status-chip-v092 network">${escapeHTML(localText)}</span><span class="status-chip-v092 cloud ${cloudClass}">${escapeHTML(cloudText)}</span><span class="status-chip-v092 queue ${blocked ? 'warning' : ''}">${escapeHTML(pendingText)}</span><span class="status-chip-v092 last">${escapeHTML(syncText)}</span>`;
    status.title = cloudHealthV092.message || cloudText;
  }
};

async function cloudCardHtmlV092() {
  const saved = await getRecord('appMeta','cloud-health-v092');
  if (saved) cloudHealthV092 = saved;
  const [cloudText] = cloudLabelV092();
  return `<section class="maintenance-card cloud-card-v092">
    <h3>Estado real de la nube</h3>
    <p><strong>${escapeHTML(cloudText)}</strong></p>
    <small>${cloudHealthV092.checkedAt ? `Verificado ${new Date(cloudHealthV092.checkedAt).toLocaleString('es-BO')}` : 'Todavía no se realizó una comprobación directa.'}${cloudHealthV092.message ? ` · ${escapeHTML(cloudHealthV092.message)}` : ''}</small>
    <div class="button-row"><button id="probeCloudBtnV092" class="button-light">Probar conexión</button></div>
  </section>`;
}

renderModule = async function(key) {
  await originalRenderModuleV092(key);
  if (key === 'settings') {
    const grid = $('moduleContent')?.querySelector('.maintenance-grid');
    if (grid && !grid.querySelector('.cloud-card-v092')) grid.insertAdjacentHTML('afterbegin', await cloudCardHtmlV092());
    $('probeCloudBtnV092')?.addEventListener('click', async () => {
      toast('Comprobando Supabase…');
      await probeCloudHealthV092({force:true});
      await refreshStatus();
      await renderModule('settings');
      toast(cloudHealthV092.state === 'healthy' ? 'Supabase responde correctamente.' : 'Supabase no respondió; Good King mantiene el modo local.', 5200);
    });
  }
};

async function refreshCloudAndUiV092(force = false) {
  await probeCloudHealthV092({force}).catch(()=>{});
  await refreshStatus().catch(()=>{});
}

window.addEventListener('DOMContentLoaded', () => setTimeout(async () => {
  document.title = `Good King V${V092_VERSION}`;
  const side = document.querySelector('.side-footer span');
  if (side) side.textContent = `V${V092_VERSION} · Estabilidad, nube verificable y seguridad`;
  await refreshCloudAndUiV092(true);
  cloudHealthTimerV092 = setInterval(() => {
    if (document.visibilityState === 'visible') refreshCloudAndUiV092(false);
  }, 300000);
  window.addEventListener('online', () => refreshCloudAndUiV092(true));
  window.addEventListener('offline', () => refreshCloudAndUiV092(false));
}, 60));
