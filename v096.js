'use strict';
/* Good King V0.9.6 · impresión 3x5 e inventario/costos inspirado en Natura Vida */
const V096_VERSION='0.9.6';

function unitLabelV096(item){return item?.baseUnit||'unidad'}
function recipeHumanQtyV096(q,unit){
  const n=Number(q||0);
  if(unit==='kg'&&n>0&&n<1)return `${inventoryNumber(n)} kg = ${inventoryNumber(n*1000)} g`;
  if(unit==='litro'&&n>0&&n<1)return `${inventoryNumber(n)} L = ${inventoryNumber(n*1000)} ml`;
  return `${inventoryNumber(n)} ${unit||''}`.trim();
}
function purchaseUnitCostV096(p){const converted=Number(p?.convertedQuantity||0);return converted>0?Number(p.total||0)/converted:0}
function lastPurchaseForIngredientV096(id,purchases){return purchases.filter(p=>p.ingredientId===id).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0]||null}

const renderInventoryModuleV096Base=renderInventoryModule;
renderInventoryModule=async function(){
  const rows=await loadInventoryLocal();
  const purchases=(await getAllRecords('purchasesLocal')).filter(p=>p.status!=='cancelled').sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  const low=rows.filter(x=>Number(x.theoreticalQuantity||0)<=Number(x.minimumStock||0));
  const stockValue=rows.reduce((s,x)=>s+Number(x.theoreticalQuantity||0)*Number(x.averageCost||0),0);
  const totalPurchased=purchases.reduce((s,p)=>s+Number(p.total||0),0);
  const cards=rows.map(x=>{
    const q=Number(x.theoreticalQuantity||0),min=Number(x.minimumStock||0),avg=Number(x.averageCost||0),value=q*avg,last=lastPurchaseForIngredientV096(x.id,purchases),lastUnit=last?purchaseUnitCostV096(last):0,isLow=q<=min;
    return `<article class="cost-stock-card-v096 ${isLow?'low':''}">
      <div class="cost-stock-title-v096"><div><b>${escapeHTML(x.name)}</b><small>${escapeHTML(x.purchaseUnit||x.baseUnit)} → ${inventoryNumber(x.conversionFactor||1)} ${escapeHTML(x.baseUnit)}</small></div><span class="cost-stock-state-v096 ${isLow?'danger':'ok'}">${isLow?'Reponer':'Normal'}</span></div>
      <div class="cost-stock-grid-v096"><div><span>Stock teórico</span><strong>${inventoryNumber(q)} ${escapeHTML(x.baseUnit)}</strong></div><div><span>Costo promedio</span><strong>${money(avg)} / ${escapeHTML(x.baseUnit)}</strong></div><div><span>Valor en stock</span><strong>${money(value)}</strong></div><div><span>Mínimo</span><strong>${inventoryNumber(min)} ${escapeHTML(x.baseUnit)}</strong></div></div>
      ${last?`<div class="last-purchase-v096"><span>Última compra</span><b>${inventoryNumber(last.quantity||0)} ${escapeHTML(last.purchaseUnit||x.purchaseUnit||'')} · ${money(last.total)}</b><small>${money(lastUnit)} por ${escapeHTML(x.baseUnit)}${last.supplier?` · ${escapeHTML(last.supplier)}`:''}</small></div>`:'<div class="last-purchase-v096 empty"><span>Sin compras registradas todavía</span></div>'}
      <div class="inventory-actions"><button class="button-light edit-ingredient" data-id="${x.id}">Editar</button><button class="secondary-action adjust-inventory" data-id="${x.id}">Ajustar stock</button><button class="primary-action buy-ingredient-v096" data-id="${x.id}">Registrar compra</button></div>
    </article>`;
  }).join('');
  const recent=purchases.slice(0,10).map(p=>`<article class="macro-purchase-row-v096"><div><b>${escapeHTML(p.ingredientName||p.description||'Insumo')}</b><small>${new Date(p.createdAt).toLocaleString('es-BO')} · ${escapeHTML(p.supplier||'Sin proveedor')}</small></div><div><span>Compra macro</span><strong>${inventoryNumber(p.quantity||0)} ${escapeHTML(p.purchaseUnit||'')}</strong><small>Ingresó ${inventoryNumber(p.convertedQuantity||0)} ${escapeHTML(p.baseUnit||'')}</small></div><div><span>Total pagado</span><strong>${money(p.total)}</strong><small>${money(purchaseUnitCostV096(p))} / ${escapeHTML(p.baseUnit||'unidad')}</small></div></article>`).join('');
  const html=`<div class="inventory-cost-hero-v096"><div><span>Capital en insumos</span><strong>${money(stockValue)}</strong><small>Stock teórico × costo promedio</small></div><div><span>Compras acumuladas</span><strong>${money(totalPurchased)}</strong><small>${purchases.length} compra(s)</small></div><div><span>Insumos por reponer</span><strong>${low.length}</strong><small>Según stock mínimo</small></div><button id="newIngredientBtn" class="primary-action">＋ Nuevo insumo</button></div>
    <div class="inventory-cost-help-v096"><b>Cómo funciona el costo</b><span>1. Registras una compra macro (ej. 10 kg de carne por Bs 320). 2. GOOD KING obtiene el costo por kg. 3. En la receta defines cuántos gramos usa cada plato. 4. El sistema calcula costo por plato y margen automáticamente.</span></div>
    <div class="inventory-toolbar"><button id="quickPurchaseBtn" class="secondary-action">🛍 Registrar compra</button><button id="seedIngredientsBtn" class="button-light">Cargar insumos iniciales</button></div>
    <section class="cost-stock-list-v096">${cards||'<div class="empty-state">Todavía no hay insumos. Crea el primero para empezar a calcular costos.</div>'}</section>
    <section class="module-subsection"><div class="subsection-title"><div><p class="eyebrow">Compras macro</p><h2>Historial de costos de insumos</h2></div><small>Cada compra actualiza el costo promedio del insumo.</small></div><div class="macro-purchases-v096">${recent||'<div class="empty-state compact">Todavía no existen compras registradas.</div>'}</div></section>`;
  return html;
};

const renderModuleV096Base=renderModule;
renderModule=async function(key){
  const out=await renderModuleV096Base(key);
  if(key==='inventory'){
    document.querySelectorAll('.buy-ingredient-v096').forEach(btn=>btn.onclick=async()=>{
      const item=(await loadInventoryLocal()).find(x=>x.id===btn.dataset.id);if(!item)return;
      try{await openPurchaseDialog(item)}catch(e){console.error(e);toast('No se pudo abrir la compra del insumo.')}
    });
  }
  return out;
};

recipeLineHTML=function(line,index,ingredients){
  const ingredient=ingredientById(line.ingredientId,ingredients),unit=ingredient?.baseUnit||'',cost=Number(line.quantity||0)*Number(ingredient?.averageCost||0);
  return `<div class="recipe-line recipe-line-v096" data-index="${index}">
    <label>Insumo<select class="recipe-ingredient">${ingredients.map(item=>`<option value="${item.id}" ${item.id===line.ingredientId?'selected':''}>${escapeHTML(item.name)}</option>`).join('')}</select></label>
    <label>Cantidad usada<input class="recipe-quantity" type="number" min="0.0001" step="0.0001" value="${numberInput(line.quantity,1)}" required /><small>${escapeHTML(unit)} · ${escapeHTML(recipeHumanQtyV096(line.quantity,unit))}</small></label>
    <div class="recipe-line-cost"><span>Costo del insumo</span><b>${money(cost)}</b><small>${money(Number(ingredient?.averageCost||0))} / ${escapeHTML(unit||'unidad')}</small></div>
    <button type="button" class="remove-recipe-line" aria-label="Quitar insumo">×</button>
  </div>`;
};

const updateRecipePreviewV096Base=updateRecipePreview;
updateRecipePreview=function(items=recipeDraftItems,ingredients=[]){
  const preview=$('recipeCostPreview');if(!preview)return;
  const recipe={yieldQuantity:numberInput($('recipeYield')?.value,1),indirectCost:numberInput($('recipeIndirectCost')?.value)};
  const product=localProductById($('recipeProduct')?.value),cost=recipeUnitCost(recipe,items,ingredients),price=numberInput(product?.price),margin=price-cost.unit,percentage=price>0?margin/price*100:0;
  preview.innerHTML=`<div><span>Ingredientes</span><b>${money(cost.direct)}</b></div><div><span>Costos indirectos</span><b>${money(cost.indirect)}</b></div><div class="highlight-v096"><span>Costo por plato</span><b>${money(cost.unit)}</b></div><div><span>Precio de venta</span><b>${money(price)}</b></div><div class="${margin<0?'negative':''}"><span>Ganancia bruta</span><b>${money(margin)}</b><small>${inventoryNumber(percentage)}% del precio</small></div>`;
};

window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{
  document.title='Good King V0.9.6';
  const side=document.querySelector('.side-footer span');if(side)side.textContent='V0.9.6 · Costos de insumos, recetas y tickets 3×5';
},160));
