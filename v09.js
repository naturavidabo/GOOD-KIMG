'use strict';

const V09_VERSION = '0.9.0';
const originalRenderModuleV09 = renderModule;
const originalPullRemoteCoreDataV09 = pullRemoteCoreData;
const originalRefreshStatusV09 = refreshStatus;
const originalVerifyDataIntegrityV09 = verifyDataIntegrity;
const originalAnnulSaleV09 = annulSale;
let dashboardTimerV09 = null;

const SIMPLE_ENTITY_STORE_V09 = Object.freeze({
  cashSessions: 'cashSessions',
  sales: 'sales',
  clients: 'clients',
  clientPayments: 'clientPayments',
  productCatalog: 'productCatalog',
  expensesLocal: 'expensesLocal'
});

function isoMsV09(value) {
  const ms = Date.parse(value || '');
  return Number.isFinite(ms) ? ms : 0;
}

function compactDateTimeV09(value) {
  if (!value) return 'Sin registro';
  try { return new Date(value).toLocaleString('es-BO', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); }
  catch (_) { return String(value); }
}

function backoffMsV09(attempts) {
  return Math.min(30 * 60 * 1000, Math.max(30 * 1000, 30 * 1000 * (2 ** Math.max(0, Number(attempts || 1) - 1))));
}

async function openConflictStoreV09() {
  return db?.objectStoreNames?.contains?.('syncConflicts');
}

async function recordConflictV09({ entity, entityId, localRecord, remoteRecord, localUpdatedAt, remoteUpdatedAt }) {
  if (!(await openConflictStoreV09())) return;
  const id = `${entity}:${entityId}`;
  const existing = await getRecord('syncConflicts', id);
  const record = {
    id, entity, entityId,
    status: 'open',
    resolution: 'local_pending_preserved',
    localUpdatedAt: localUpdatedAt || localRecord?.updatedAt || localRecord?.createdAt || null,
    remoteUpdatedAt: remoteUpdatedAt || remoteRecord?.updatedAt || remoteRecord?.createdAt || null,
    localRecord: localRecord || null,
    remoteRecord: remoteRecord || null,
    detectedAt: existing?.detectedAt || nowIso(),
    lastDetectedAt: nowIso(),
    resolvedAt: null,
    appVersion: APP_VERSION
  };
  await putRecord('syncConflicts', record);
}

async function resolveConflictsForEntityV09(entity, entityId) {
  if (!(await openConflictStoreV09())) return;
  const conflicts = await getAllRecords('syncConflicts');
  for (const conflict of conflicts.filter(item => item.entity === entity && String(item.entityId) === String(entityId) && item.status === 'open')) {
    conflict.status = 'resolved';
    conflict.resolution = 'local_synced';
    conflict.resolvedAt = nowIso();
    await putRecord('syncConflicts', conflict);
  }
}

async function restorePendingAfterPullV09(queueItems) {
  for (const item of queueItems) {
    const payload = item.payload || {};
    const simpleStore = SIMPLE_ENTITY_STORE_V09[item.entity];
    if (simpleStore) {
      const currentRemote = await getRecord(simpleStore, item.entityId);
      const localTime = isoMsV09(payload.updatedAt || payload.createdAt);
      const remoteTime = isoMsV09(currentRemote?.updatedAt || currentRemote?.createdAt);
      if (currentRemote?.remote && remoteTime > localTime && JSON.stringify(currentRemote) !== JSON.stringify(payload)) {
        await recordConflictV09({ entity:item.entity, entityId:item.entityId, localRecord:payload, remoteRecord:currentRemote, localUpdatedAt:payload.updatedAt, remoteUpdatedAt:currentRemote.updatedAt });
      }
      await putRecord(simpleStore, payload);
      continue;
    }
    if (item.entity === 'inventoryMovementsLocal') {
      if (payload.ingredient?.id) await putRecord('inventoryIngredients', payload.ingredient);
      if (payload.id) await putRecord('inventoryMovementsLocal', payload);
      continue;
    }
    if (item.entity === 'purchasesLocal') {
      if (payload.id) await putRecord('purchasesLocal', payload);
      if (payload.purchaseItem?.id) await putRecord('purchaseItemsLocal', payload.purchaseItem);
      if (payload.ingredient?.id) await putRecord('inventoryIngredients', payload.ingredient);
      if (payload.movement?.id) await putRecord('inventoryMovementsLocal', payload.movement);
      continue;
    }
    if (item.entity === 'recipesLocal') {
      if (payload.recipe?.id) {
        const remoteRecipe = await getRecord('recipesLocal', payload.recipe.id);
        if (remoteRecipe?.remote && isoMsV09(remoteRecipe.updatedAt) > isoMsV09(payload.recipe.updatedAt)) {
          await recordConflictV09({ entity:item.entity, entityId:item.entityId, localRecord:payload.recipe, remoteRecord:remoteRecipe });
        }
        await putRecord('recipesLocal', payload.recipe);
      }
      for (const line of payload.items || []) await putRecord('recipeItemsLocal', line);
      continue;
    }
    if (item.entity === 'marketListsLocal') {
      if (payload.list?.id) {
        const remoteList = await getRecord('marketListsLocal', payload.list.id);
        if (remoteList?.remote && isoMsV09(remoteList.updatedAt) > isoMsV09(payload.list.updatedAt)) {
          await recordConflictV09({ entity:item.entity, entityId:item.entityId, localRecord:payload.list, remoteRecord:remoteList });
        }
        await putRecord('marketListsLocal', payload.list);
      }
      for (const line of payload.items || []) await putRecord('marketListItemsLocal', line);
    }
  }
}

pullRemoteCoreData = async function() {
  const pending = (await getAllRecords('syncQueue')).filter(item => ['pending','error','blocked'].includes(item.status));
  const result = await originalPullRemoteCoreDataV09();
  await restorePendingAfterPullV09(pending);
  return result;
};

async function syncWorkerV09({ force = false } = {}) {
  const config = await getSupabaseConfig();
  if (!config.enabled || !navigator.onLine || !authContext || authContext.offline) return { synced:0, failed:0, pulled:0, blocked:0 };
  const session = await ensureAuthSession();
  if (!session) return { synced:0, failed:0, pulled:0, blocked:0 };
  if (syncInProgress) return { synced:0, failed:0, pulled:0, blocked:0, busy:true };
  syncInProgress = true;
  let synced = 0, failed = 0, pulled = 0, blocked = 0;
  try {
    const deviceId = await getDeviceId();
    await registerRemoteDevice();
    const now = Date.now();
    const queue = (await getAllRecords('syncQueue'))
      .filter(item => ['pending','error','blocked'].includes(item.status))
      .filter(item => force || item.status !== 'blocked')
      .filter(item => force || !item.nextAttemptAt || isoMsV09(item.nextAttemptAt) <= now)
      .sort((a,b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
      .slice(0, 250);

    for (const item of queue) {
      if (authContext.role === 'helper' && ['clients','clientPayments','productCatalog','recipesLocal','marketListsLocal','purchasesLocal','expensesLocal'].includes(item.entity)) continue;
      try {
        await pushQueueItem(item, deviceId);
        item.status = 'synced';
        item.syncedAt = nowIso();
        item.updatedAt = nowIso();
        item.lastError = null;
        item.nextAttemptAt = null;
        await putRecord('syncQueue', item);
        await resolveConflictsForEntityV09(item.entity, item.entityId);
        synced++;
      } catch (error) {
        item.attempts = Number(item.attempts || 0) + 1;
        item.lastError = String(error?.message || error || 'Error de sincronización');
        item.updatedAt = nowIso();
        if (item.attempts >= 8) {
          item.status = 'blocked';
          item.nextAttemptAt = null;
          blocked++;
        } else {
          item.status = 'error';
          item.nextAttemptAt = new Date(Date.now() + backoffMsV09(item.attempts)).toISOString();
          failed++;
        }
        await putRecord('syncQueue', item);
        await logAppError('supabase-sync-v09', error, { queueId:item.id, entity:item.entity, attempts:item.attempts });
        if (!navigator.onLine) break;
      }
    }

    try { await pushUnsyncedAudits(deviceId); } catch (error) { await logAppError('audit-sync-v09', error); }
    try {
      const result = await pullRemoteCoreData();
      pulled = result?.pulled || 0;
    } catch (error) {
      await logAppError('remote-pull-v09', error);
      failed++;
    }
    await putRecord('appMeta', { id:'last-sync', synced, failed, pulled, blocked, checkedAt:nowIso(), userId:authContext.userId, businessId:authContext.businessId, appVersion:APP_VERSION });
    return { synced, failed, pulled, blocked };
  } finally {
    syncInProgress = false;
    await refreshStatus();
    if (['settings','dashboard'].includes(currentModuleKey)) await renderModule(currentModuleKey);
  }
}

syncPendingRecords = async function(options = {}) {
  if (navigator.locks?.request) {
    let acquired = false;
    const result = await navigator.locks.request('good-king-sync-v09', { ifAvailable:true }, async lock => {
      if (!lock) return { synced:0, failed:0, pulled:0, blocked:0, busy:true };
      acquired = true;
      return syncWorkerV09(options);
    });
    return acquired ? result : { synced:0, failed:0, pulled:0, blocked:0, busy:true };
  }
  return syncWorkerV09(options);
};

refreshStatus = async function() {
  await originalRefreshStatusV09();
  const queue = await getAllRecords('syncQueue');
  const pending = queue.filter(item => item.status === 'pending').length;
  const errors = queue.filter(item => item.status === 'error').length;
  const blocked = queue.filter(item => item.status === 'blocked').length;
  const network = navigator.onLine ? 'En línea' : 'Sin internet';
  const remote = authContext ? (authContext.offline ? 'sesión local' : `${roleLabel(authContext.role)} conectado`) : 'sin sesión';
  $('syncStatus').textContent = `● ${network} · ${remote} · ${pending + errors} pendiente${pending + errors === 1 ? '' : 's'}${blocked ? ` · ${blocked} bloqueado${blocked === 1 ? '' : 's'}` : ''}`;
  $('syncStatus').className = navigator.onLine ? (blocked ? 'warning' : 'online') : 'offline';
};

annulSale = async function(id) {
  if (authContext?.role === 'helper') return toast('La anulación requiere autorización de la propietaria o del administrador.', 5200);
  return originalAnnulSaleV09(id);
};

async function localDashboardV09() {
  const today = localDateKey();
  const [report, inventory, queue, conflicts, devicesSnapshot] = await Promise.all([
    reportDataV08(today, today),
    loadInventoryLocal(),
    getAllRecords('syncQueue'),
    openConflictStoreV09().then(ok => ok ? getAllRecords('syncConflicts') : []),
    getRecord('remoteSnapshots', 'devices-v09')
  ]);
  const lowStock = inventory.filter(item => Number(item.theoreticalQuantity || 0) <= Number(item.minimumStock || 0)).slice(0, 12);
  return {
    source:'local', date:today,
    salesCount:report.sales.length, totalSales:report.totalSales, cashSales:report.cashSales, qrSales:report.qrSales,
    expenses:report.expenseTotal, purchases:report.purchaseTotal, netProfit:report.netProfit, outstandingDebt:report.outstandingDebt,
    openCash:currentCash ? { id:currentCash.id, openingAmount:Number(currentCash.openingAmount || 0), openedAt:currentCash.openedAt } : null,
    lowStock:lowStock.map(item => ({ name:item.name, quantity:Number(item.theoreticalQuantity || 0), minimum:Number(item.minimumStock || 0), unit:item.baseUnit })),
    pending:queue.filter(item => ['pending','error'].includes(item.status)).length,
    blocked:queue.filter(item => item.status === 'blocked').length,
    conflicts:conflicts.filter(item => item.status === 'open').length,
    devices:devicesSnapshot?.devices || []
  };
}

async function remoteDashboardV09() {
  if (!supabaseClient || !authContext || authContext.offline || !navigator.onLine) return localDashboardV09();
  const local = await localDashboardV09();
  let summary = null;
  const { data, error } = await supabaseClient.rpc('good_king_dashboard_v090', { p_business_id:authContext.businessId, p_business_date:localDateKey() });
  if (!error && data) summary = data;
  if (error && !String(error.message || '').includes('good_king_dashboard_v090')) await logAppError('dashboard-rpc-v09', error);

  const [{ data:devices, error:deviceError }, { data:syncErrors, error:syncError }] = await Promise.all([
    supabaseClient.from('devices').select('id,device_name,platform,app_version,active,last_seen_at,user_id').eq('business_id', authContext.businessId).eq('active', true).order('last_seen_at', { ascending:false }).limit(12),
    supabaseClient.from('sync_events').select('id,entity,entity_id,sync_status,error_message,updated_at').eq('business_id', authContext.businessId).eq('sync_status','error').order('updated_at',{ascending:false}).limit(20)
  ]);
  if (deviceError) await logAppError('dashboard-devices-v09', deviceError);
  if (syncError) await logAppError('dashboard-sync-errors-v09', syncError);
  if (devices) await putRecord('remoteSnapshots', { id:'devices-v09', devices, updatedAt:nowIso() });

  if (!summary) {
    const today = localDateKey();
    const [{ data:sales }, { data:expenses }, { data:purchases }, { data:customers }, { data:cash }, { data:stock }] = await Promise.all([
      supabaseClient.from('sales').select('id,total,payment_method,status').eq('business_id',authContext.businessId).eq('business_date',today),
      supabaseClient.from('expenses').select('amount').eq('business_id',authContext.businessId).eq('expense_date',today).is('deleted_at',null),
      supabaseClient.from('purchases').select('total').eq('business_id',authContext.businessId).eq('purchase_date',today).is('deleted_at',null),
      supabaseClient.from('customers').select('balance').eq('business_id',authContext.businessId).eq('active',true).is('deleted_at',null),
      supabaseClient.from('cash_sessions').select('id,opening_amount,opened_at,status').eq('business_id',authContext.businessId).eq('status','open').maybeSingle(),
      supabaseClient.from('inventory_items').select('theoretical_quantity,ingredients(name,base_unit,minimum_stock)').eq('business_id',authContext.businessId).is('deleted_at',null)
    ]);
    const valid = (sales || []).filter(item => item.status === 'confirmed');
    summary = {
      sales_count:valid.length,
      total_sales:valid.reduce((s,x)=>s+Number(x.total||0),0),
      cash_sales:valid.filter(x=>x.payment_method==='cash').reduce((s,x)=>s+Number(x.total||0),0),
      qr_sales:valid.filter(x=>x.payment_method==='qr').reduce((s,x)=>s+Number(x.total||0),0),
      expense_total:(expenses||[]).reduce((s,x)=>s+Number(x.amount||0),0),
      purchase_total:(purchases||[]).reduce((s,x)=>s+Number(x.total||0),0),
      outstanding_debt:(customers||[]).reduce((s,x)=>s+Number(x.balance||0),0),
      open_cash:cash || null,
      low_stock:(stock||[]).filter(x=>Number(x.theoretical_quantity||0)<=Number(x.ingredients?.minimum_stock||0)).map(x=>({name:x.ingredients?.name||'Insumo',quantity:Number(x.theoretical_quantity||0),minimum:Number(x.ingredients?.minimum_stock||0),unit:x.ingredients?.base_unit||''}))
    };
  }
  return {
    ...local,
    source:'supabase',
    salesCount:Number(summary.sales_count ?? local.salesCount),
    totalSales:Number(summary.total_sales ?? local.totalSales),
    cashSales:Number(summary.cash_sales ?? local.cashSales),
    qrSales:Number(summary.qr_sales ?? local.qrSales),
    expenses:Number(summary.expense_total ?? local.expenses),
    purchases:Number(summary.purchase_total ?? local.purchases),
    netProfit:Number(summary.net_profit ?? local.netProfit),
    outstandingDebt:Number(summary.outstanding_debt ?? local.outstandingDebt),
    openCash:summary.open_cash || null,
    lowStock:Array.isArray(summary.low_stock) ? summary.low_stock : local.lowStock,
    devices:devices || local.devices,
    remoteSyncErrors:syncErrors || []
  };
}

function dashboardMetricV09(label, value, note, tone='') {
  return `<div class="remote-metric ${tone}"><small>${escapeHTML(label)}</small><strong>${escapeHTML(value)}</strong><span>${escapeHTML(note || '')}</span></div>`;
}

async function renderDashboardModuleV09() {
  if (!canManageBusiness()) return '<div class="empty-state">Este módulo requiere autorización administrativa.</div>';
  let data;
  try { data = await remoteDashboardV09(); }
  catch (error) {
    await logAppError('dashboard-render-v09', error);
    data = await localDashboardV09();
  }
  const lowStock = (data.lowStock || []).map(item => `<div class="remote-list-row"><div><b>${escapeHTML(item.name)}</b><small>Mínimo ${inventoryNumber(item.minimum)} ${escapeHTML(item.unit || '')}</small></div><strong class="${Number(item.quantity)<0?'negative':''}">${inventoryNumber(item.quantity)} ${escapeHTML(item.unit || '')}</strong></div>`).join('');
  const devices = (data.devices || []).map(item => `<div class="device-row"><span class="device-dot ${Date.now()-isoMsV09(item.last_seen_at)<10*60*1000?'online':''}"></span><div><b>${escapeHTML(item.device_name || 'Dispositivo')}</b><small>V${escapeHTML(item.app_version || '?')} · ${compactDateTimeV09(item.last_seen_at)}</small></div></div>`).join('');
  const syncErrors = (data.remoteSyncErrors || []).slice(0,5).map(item => `<div class="remote-alert"><b>${escapeHTML(item.entity)}</b><span>${escapeHTML(item.error_message || 'Error remoto')}</span><small>${compactDateTimeV09(item.updated_at)}</small></div>`).join('');
  const sourceLabel = data.source === 'supabase' ? 'Datos centrales de Supabase' : 'Datos locales del dispositivo';
  return `<div class="remote-dashboard-head"><div><span class="live-pill ${data.source==='supabase'?'online':'offline'}">● ${sourceLabel}</span><h2>Estado de Good King hoy</h2><p>${new Date(`${data.date}T12:00:00`).toLocaleDateString('es-BO',{weekday:'long',day:'numeric',month:'long'})}</p></div><div class="button-row"><button id="dashboardSyncBtn" class="primary-action">Sincronizar</button><button id="dashboardRefreshBtn" class="button-light">Actualizar</button></div></div>
    <div class="remote-metrics-grid">
      ${dashboardMetricV09('Ventas', money(data.totalSales), `${data.salesCount} pedido(s)`)}
      ${dashboardMetricV09('Efectivo', money(data.cashSales), 'cobrado hoy')}
      ${dashboardMetricV09('QR', money(data.qrSales), 'cobrado hoy')}
      ${dashboardMetricV09('Gastos', money(data.expenses), 'registrados hoy', data.expenses>0?'warn':'')}
      ${dashboardMetricV09('Compras', money(data.purchases), 'ingreso de insumos')}
      ${dashboardMetricV09('Ganancia estimada', money(data.netProfit), 'según costos y gastos', data.netProfit<0?'danger':'success')}
      ${dashboardMetricV09('Fiados pendientes', money(data.outstandingDebt), 'saldo actual')}
      ${dashboardMetricV09('Sincronización', `${data.pending} pendientes`, `${data.blocked} bloqueados · ${data.conflicts} conflicto(s)`, data.blocked?'danger':'')}
    </div>
    <div class="remote-columns">
      <section class="remote-card"><div class="remote-card-title"><h3>Caja</h3><span>${data.openCash ? 'ABIERTA' : 'CERRADA'}</span></div>${data.openCash ? `<p>Fondo inicial <b>${money(data.openCash.opening_amount ?? data.openCash.openingAmount ?? 0)}</b></p><small>Abierta ${compactDateTimeV09(data.openCash.opened_at ?? data.openCash.openedAt)}</small>` : '<p>No existe una sesión de caja abierta en la base consultada.</p>'}</section>
      <section class="remote-card"><div class="remote-card-title"><h3>Alertas de inventario</h3><span>${(data.lowStock||[]).length}</span></div>${lowStock || '<div class="empty-state compact">Sin faltantes según el stock mínimo.</div>'}</section>
      <section class="remote-card"><div class="remote-card-title"><h3>Dispositivos</h3><span>${(data.devices||[]).length}</span></div>${devices || '<div class="empty-state compact">Sin dispositivos remotos registrados todavía.</div>'}</section>
      <section class="remote-card"><div class="remote-card-title"><h3>Errores remotos recientes</h3><span>${(data.remoteSyncErrors||[]).length}</span></div>${syncErrors || '<div class="empty-state compact">No hay errores de sincronización reportados.</div>'}</section>
    </div>`;
}

async function syncCenterHtmlV09() {
  const [queue, conflicts, lastSync] = await Promise.all([
    getAllRecords('syncQueue'),
    openConflictStoreV09().then(ok => ok ? getAllRecords('syncConflicts') : []),
    getRecord('appMeta','last-sync')
  ]);
  const pending = queue.filter(x=>x.status==='pending').length;
  const errors = queue.filter(x=>x.status==='error').length;
  const blocked = queue.filter(x=>x.status==='blocked').length;
  const openConflicts = conflicts.filter(x=>x.status==='open').length;
  const blockedRows = queue.filter(x=>x.status==='blocked').slice(0,6).map(x=>`<div class="sync-problem-row"><div><b>${escapeHTML(x.entity)}</b><small>${escapeHTML(x.lastError || 'Error repetido')}</small></div><span>${Number(x.attempts||0)} intentos</span></div>`).join('');
  return `<section class="maintenance-card sync-center-v09"><h3>Centro de sincronización V0.9</h3><p>Los datos se guardan primero en este dispositivo y luego se consolidan en Supabase. Los conflictos nunca sustituyen un cambio local pendiente.</p><div class="sync-kpis"><span>Pendientes <b>${pending}</b></span><span>En reintento <b>${errors}</b></span><span>Bloqueados <b>${blocked}</b></span><span>Conflictos protegidos <b>${openConflicts}</b></span></div><div class="button-row"><button id="syncForceBtnV09" class="secondary-action">Sincronizar ahora</button><button id="retryBlockedBtnV09" class="button-light" ${blocked?'':'disabled'}>Reintentar bloqueados</button><button id="clearResolvedConflictsBtnV09" class="text-button">Limpiar conflictos resueltos</button></div><small>Última ejecución: ${lastSync?.checkedAt ? compactDateTimeV09(lastSync.checkedAt) : 'todavía no registrada'}.</small>${blockedRows ? `<div class="sync-problem-list">${blockedRows}</div>` : ''}</section>`;
}

async function retryBlockedV09() {
  const queue = await getAllRecords('syncQueue');
  let count = 0;
  for (const item of queue.filter(x=>x.status==='blocked')) {
    item.status='pending'; item.attempts=0; item.lastError=null; item.nextAttemptAt=null; item.updatedAt=nowIso();
    await putRecord('syncQueue', item); count++;
  }
  toast(`${count} registro(s) habilitado(s) para reintento.`);
  const result = await syncPendingRecords({ force:true });
  toast(`${result.synced} enviado(s) · ${result.failed} error(es) · ${result.blocked} bloqueado(s)`, 5000);
}

async function clearResolvedConflictsV09() {
  if (!(await openConflictStoreV09())) return;
  const conflicts = await getAllRecords('syncConflicts');
  const tx = db.transaction('syncConflicts','readwrite');
  conflicts.filter(x=>x.status==='resolved').forEach(x=>tx.objectStore('syncConflicts').delete(x.id));
  await transactionPromise(tx);
  toast('Conflictos ya resueltos eliminados del diagnóstico.');
  if (currentModuleKey==='settings') await renderModule('settings');
}

verifyDataIntegrity = async function() {
  const report = await originalVerifyDataIntegrityV09();
  const [queue, conflicts] = await Promise.all([
    getAllRecords('syncQueue'),
    openConflictStoreV09().then(ok => ok ? getAllRecords('syncConflicts') : [])
  ]);
  const blocked = queue.filter(x=>x.status==='blocked');
  const openConflicts = conflicts.filter(x=>x.status==='open');
  if (blocked.length) report.warnings.push(`${blocked.length} registro(s) de sincronización están bloqueados tras varios intentos.`);
  if (openConflicts.length) report.warnings.push(`${openConflicts.length} conflicto(s) remoto/local están protegidos a favor del cambio local pendiente.`);
  report.counts.syncBlocked = blocked.length;
  report.counts.syncConflicts = openConflicts.length;
  report.v09 = { checkedAt:nowIso(), conflictPolicy:'local-pending-wins-until-synced' };
  await putRecord('appMeta', { id:'last-health-check', ...report });
  return report;
};

renderModule = async function(key) {
  if (key === 'dashboard') {
    currentModuleKey = key;
    const module = modules.find(item=>item[0]===key);
    $('salesView').classList.remove('active');
    $('moduleView').classList.add('active');
    const body = await renderDashboardModuleV09();
    $('moduleContent').innerHTML = `<div class="module-hero remote-hero-v09"><p class="eyebrow" style="color:#ffd54d">Good King V${V09_VERSION}</p><h1>${escapeHTML(module[2])}</h1><p>${escapeHTML(module[3])}</p></div>${body}`;
    $('dashboardRefreshBtn')?.addEventListener('click', async()=>{ toast('Actualizando control remoto…'); await renderModule('dashboard'); });
    $('dashboardSyncBtn')?.addEventListener('click', async()=>{ toast('Sincronizando…'); const r=await syncPendingRecords({force:true}); toast(`${r.synced} enviado(s) · ${r.pulled} recibido(s) · ${r.failed} error(es)`,5000); });
    if (dashboardTimerV09) clearTimeout(dashboardTimerV09);
    dashboardTimerV09 = setTimeout(()=>{ if(currentModuleKey==='dashboard' && navigator.onLine) renderModule('dashboard').catch(console.error); }, 60000);
    return;
  }
  await originalRenderModuleV09(key);
  if (key === 'settings') {
    const grid = $('moduleContent')?.querySelector('.maintenance-grid');
    if (grid) grid.insertAdjacentHTML('afterbegin', await syncCenterHtmlV09());
    $('syncForceBtnV09')?.addEventListener('click', async()=>{ toast('Sincronizando…'); const r=await syncPendingRecords({force:true}); toast(`${r.synced} enviado(s) · ${r.pulled} recibido(s) · ${r.failed} error(es) · ${r.blocked} bloqueado(s)`,5200); });
    $('retryBlockedBtnV09')?.addEventListener('click', retryBlockedV09);
    $('clearResolvedConflictsBtnV09')?.addEventListener('click', clearResolvedConflictsV09);
  }
};

function patchV09Ui() {
  document.title = `Good King V${V09_VERSION}`;
  const side = document.querySelector('.side-footer span');
  if (side) side.textContent = `V${V09_VERSION} · Operación integrada, control remoto y sincronización reforzada`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content','Good King - ventas, caja, inventario, compras y control remoto');
}

window.addEventListener('DOMContentLoaded', () => setTimeout(async()=>{
  patchV09Ui();
  await refreshStatus();
  // Sincronización de mantenimiento: no interrumpe ventas y respeta el bloqueo entre pestañas.
  setInterval(() => {
    if (navigator.onLine && authContext && !authContext.offline && !syncInProgress) syncPendingRecords().catch(()=>{});
  }, 120000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine && authContext && !authContext.offline) syncPendingRecords().catch(()=>{});
  });
}, 20));
