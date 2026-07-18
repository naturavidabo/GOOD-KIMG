const products = [
  {id:'hamb-simple',name:'Hamburguesa simple',price:15,cat:'Hamburguesas',icon:'🍔'},
  {id:'hamb-doble',name:'Hamburguesa doble',price:22,cat:'Hamburguesas',icon:'🍔'},
  {id:'broaster-eco',name:'Broaster económico',price:18,cat:'Broaster',icon:'🍗'},
  {id:'cuarto-pierna',name:'Cuarto: pierna y contra',price:26,cat:'Broaster',icon:'🍗'},
  {id:'cuarto-mixto',name:'Cuarto mixto',price:27,cat:'Broaster',icon:'🍗'},
  {id:'cuarto-pecho',name:'Cuarto: pecho y ala',price:28,cat:'Broaster',icon:'🍗'},
  {id:'salchipapa',name:'Salchipapa',price:15,cat:'Platos',icon:'🍟'},
  {id:'salchicarne',name:'Salchicarne',price:20,cat:'Platos',icon:'🥩'},
  {id:'lomo',name:'Lomo montado',price:25,cat:'Platos',icon:'🍳'},
  {id:'coca-mini',name:'Coca-Cola mini',price:4,cat:'Bebidas',icon:'🥤'},
  {id:'coca-pop',name:'Coca-Cola popular',price:7,cat:'Bebidas',icon:'🥤'},
  {id:'coca-2l',name:'Coca-Cola 2 L',price:14,cat:'Bebidas',icon:'🥤'},
  {id:'limonada',name:'Limonada',price:7,cat:'Bebidas',icon:'🍋'},
  {id:'extra-arroz',name:'Porción de arroz',price:4,cat:'Extras',icon:'🍚'},
  {id:'extra-papa',name:'Porción de papa',price:6,cat:'Extras',icon:'🍟'},
  {id:'extra-salchicha',name:'Porción de salchicha',price:5,cat:'Extras',icon:'🌭'},
  {id:'extra-ensalada',name:'Porción de ensalada',price:4,cat:'Extras',icon:'🥗'},
  {id:'extra-huevo',name:'Huevo adicional',price:3,cat:'Extras',icon:'🍳'}
];

let cart = [];
let activeCategory = 'Todos';
const $ = s => document.querySelector(s);
const money = n => `Bs ${Number(n).toFixed(2).replace('.',',')}`;
const todayKey = () => new Date().toISOString().slice(0,10);

function getState(){
  return JSON.parse(localStorage.getItem('goodKingState') || '{}');
}
function saveState(state){localStorage.setItem('goodKingState',JSON.stringify(state));}
function currentOrderNumber(){
  const state=getState();
  const day=state.day===todayKey()?state:{...state,day:todayKey(),orderSeq:0,sales:[]};
  if(state.day!==todayKey()) saveState(day);
  return (day.orderSeq||0)+1;
}
function renderOrderNumber(){ $('#orderNumber').textContent=`N.º ${String(currentOrderNumber()).padStart(3,'0')}`; }

function renderCategories(){
  const cats=['Todos',...new Set(products.map(p=>p.cat))];
  $('#categoryTabs').innerHTML='';
  cats.forEach(cat=>{
    const b=document.createElement('button');b.textContent=cat;b.className=cat===activeCategory?'active':'';
    b.onclick=()=>{activeCategory=cat;renderCategories();renderProducts();};
    $('#categoryTabs').appendChild(b);
  });
}
function renderProducts(){
  const grid=$('#productGrid');grid.innerHTML='';
  products.filter(p=>activeCategory==='Todos'||p.cat===activeCategory).forEach(p=>{
    const node=$('#productCardTemplate').content.cloneNode(true);
    node.querySelector('.product-image').textContent=p.icon;
    node.querySelector('strong').textContent=p.name;
    node.querySelector('span').textContent=money(p.price);
    node.querySelector('button').onclick=()=>addProduct(p);
    grid.appendChild(node);
  });
}
function addProduct(p){
  const found=cart.find(x=>x.id===p.id); if(found) found.qty++; else cart.push({...p,qty:1}); renderCart();
}
function updateQty(id,delta){
  const item=cart.find(x=>x.id===id); if(!item)return; item.qty+=delta; if(item.qty<=0)cart=cart.filter(x=>x.id!==id); renderCart();
}
function renderCart(){
  const wrap=$('#cartItems');wrap.innerHTML='';
  if(!cart.length){wrap.className='cart-items empty';wrap.textContent='Aún no hay productos.';} else {
    wrap.className='cart-items';
    cart.forEach(i=>{
      const row=document.createElement('div');row.className='cart-item';
      row.innerHTML=`<div><strong>${i.name}</strong><small>${money(i.price)} c/u</small></div><div class="qty"><button>−</button><strong>${i.qty}</strong><button>+</button></div>`;
      const [minus,plus]=row.querySelectorAll('button');minus.onclick=()=>updateQty(i.id,-1);plus.onclick=()=>updateQty(i.id,1);wrap.appendChild(row);
    });
  }
  $('#cartTotal').textContent=money(cart.reduce((s,i)=>s+i.price*i.qty,0));
}
function openCash(){
  const state=getState();
  if(state.cashOpen&&state.day===todayKey()) return alert('La caja ya está abierta.');
  $('#openingAmount').value=state.nextOpeningAmount ?? 80;
  $('#cashDialog').showModal();
}
function confirmCashOpen(e){
  e.preventDefault(); const amount=Number($('#openingAmount').value||0); const state=getState();
  saveState({...state,day:todayKey(),cashOpen:true,openingAmount:amount,openedAt:new Date().toISOString(),orderSeq:state.day===todayKey()?(state.orderSeq||0):0,sales:state.day===todayKey()?(state.sales||[]):[]});
  $('#cashDialog').close(); refreshCashStatus();
}
function refreshCashStatus(){
  const s=getState(); const open=s.cashOpen&&s.day===todayKey();
  $('#cashStatus').textContent=open?`Caja abierta · Fondo ${money(s.openingAmount||0)}`:'Caja cerrada';
  $('#openCashBtn').textContent=open?'Caja abierta':'Abrir caja';
  renderOrderNumber();
}
function confirmSale(){
  const s=getState(); if(!(s.cashOpen&&s.day===todayKey())) return alert('Primero debes abrir la caja.');
  if(!cart.length) return alert('Agrega al menos un producto.');
  const payment=$('#paymentMethod').value;
  if(payment==='QR'&&!confirm('¿El pago por QR fue verificado?')) return;
  if(payment==='Fiado'&&!confirm('La venta quedará registrada como fiada. ¿Continuar?')) return;
  const total=cart.reduce((sum,i)=>sum+i.price*i.qty,0);
  const orderNo=(s.orderSeq||0)+1;
  const sale={id:`${todayKey()}-${orderNo}-${Date.now()}`,orderNo,date:new Date().toISOString(),items:cart.map(x=>({...x})),total,payment,type:$('#orderType').value,note:$('#orderNote').value,status:'confirmada'};
  const next={...s,orderSeq:orderNo,sales:[...(s.sales||[]),sale]}; saveState(next);
  printTickets(sale);
  cart=[]; $('#orderNote').value=''; renderCart(); renderOrderNumber();
}
function printTickets(sale){
  const lines=sale.items.map(i=>`${i.qty} x ${i.name}`).join('<br>');
  const html=`<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:monospace;width:72mm;margin:0;padding:4mm}h2,p{margin:4px 0}.center{text-align:center}.big{font-size:24px;font-weight:bold}.cut{border-top:1px dashed #000;margin:14px 0;padding-top:10px}@media print{button{display:none}}</style></head><body>
  <div class="center"><img src="assets/logo.jpg" style="width:35mm"><h2>COMANDA</h2><div class="big">PEDIDO ${String(sale.orderNo).padStart(3,'0')}</div><p>${sale.type}</p></div><p>${lines}</p>${sale.note?`<p><b>Obs.:</b> ${sale.note}</p>`:''}
  <div class="cut center"><img src="assets/logo.jpg" style="width:28mm"><h2>GOOD KING</h2><div class="big">N.º ${String(sale.orderNo).padStart(3,'0')}</div><p><b>${money(sale.total)}</b></p></div>
  <script>window.onload=()=>window.print()<\/script></body></html>`;
  const w=window.open('','_blank','width=420,height=700'); w.document.write(html); w.document.close();
}
function showSummary(){
  const s=getState(); const sales=(s.day===todayKey()?s.sales:[])||[];
  const total=sales.reduce((a,b)=>a+b.total,0), cash=sales.filter(x=>x.payment==='Efectivo').reduce((a,b)=>a+b.total,0), qr=sales.filter(x=>x.payment==='QR').reduce((a,b)=>a+b.total,0), credit=sales.filter(x=>x.payment==='Fiado').reduce((a,b)=>a+b.total,0);
  $('#summaryContent').innerHTML=`<div class="summary-grid"><div class="summary-box"><span>Pedidos</span><strong>${sales.length}</strong></div><div class="summary-box"><span>Total vendido</span><strong>${money(total)}</strong></div><div class="summary-box"><span>Efectivo</span><strong>${money(cash)}</strong></div><div class="summary-box"><span>QR</span><strong>${money(qr)}</strong></div><div class="summary-box"><span>Fiado</span><strong>${money(credit)}</strong></div><div class="summary-box"><span>Efectivo esperado</span><strong>${money((s.openingAmount||0)+cash)}</strong></div></div>`;
  $('#summaryDialog').showModal();
}
function closeCash(){
  const s=getState(); if(!s.cashOpen) return alert('La caja ya está cerrada.');
  const value=prompt('¿Cuánto dinero dejarás para cambio mañana?',String(s.nextOpeningAmount??80)); if(value===null)return;
  const nextAmount=Number(value||0); saveState({...s,cashOpen:false,closedAt:new Date().toISOString(),nextOpeningAmount:nextAmount});
  $('#summaryDialog').close();refreshCashStatus();alert('Caja cerrada correctamente.');
}

$('#openCashBtn').onclick=openCash;
$('#confirmOpenCash').onclick=confirmCashOpen;
$('#summaryBtn').onclick=showSummary;
$('#closeCashBtn').onclick=closeCash;
$('#clearCartBtn').onclick=()=>{if(cart.length&&confirm('¿Vaciar el pedido?')){cart=[];renderCart();}};
$('#confirmSaleBtn').onclick=confirmSale;

renderCategories();renderProducts();renderCart();refreshCashStatus();
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
