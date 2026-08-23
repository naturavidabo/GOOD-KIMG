/* Good King V0.9.1 — Supabase client ligero local
   Cubre Auth, PostgREST, RPC y Storage usados por Good King.
   No contiene claves privadas. */
(function(global){
  'use strict';

  const jsonHeaders = {'Content-Type':'application/json','Accept':'application/json'};
  const safeJson = async response => {
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch (_) { return text; }
  };
  const errorFromResponse = async response => {
    const payload = await safeJson(response).catch(()=>null);
    const message = payload?.message || payload?.msg || payload?.error_description || payload?.hint || (typeof payload === 'string' ? payload : '') || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.statusText = response.statusText;
    if (payload && typeof payload === 'object') Object.assign(error, payload);
    return error;
  };
  const decodeJwt = token => {
    try {
      const part = String(token || '').split('.')[1];
      if (!part) return {};
      const base64 = part.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(part.length / 4) * 4,'=');
      const json = decodeURIComponent(Array.from(atob(base64)).map(c=>`%${c.charCodeAt(0).toString(16).padStart(2,'0')}`).join(''));
      return JSON.parse(json);
    } catch (_) { return {}; }
  };
  const normalizeSession = payload => {
    if (!payload?.access_token) return null;
    const jwt = decodeJwt(payload.access_token);
    const expiresAt = Number(payload.expires_at || jwt.exp || 0) || Math.floor(Date.now()/1000) + Number(payload.expires_in || 3600);
    return {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token || '',
      token_type: payload.token_type || 'bearer',
      expires_in: Number(payload.expires_in || Math.max(0,expiresAt-Math.floor(Date.now()/1000))),
      expires_at: expiresAt,
      user: payload.user || null
    };
  };
  const encodePath = path => String(path || '').split('/').map(encodeURIComponent).join('/');

  class AuthClient {
    constructor(baseUrl,key,options={}) {
      this.baseUrl = baseUrl.replace(/\/+$/,'');
      this.key = key;
      this.storageKey = options.storageKey || 'sb-auth-token';
      this.persistSession = options.persistSession !== false;
      this.autoRefreshToken = options.autoRefreshToken !== false;
      this.listeners = new Set();
      this.memorySession = null;
    }
    _readStored() {
      if (this.memorySession) return this.memorySession;
      if (!this.persistSession) return null;
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        this.memorySession = parsed?.currentSession || parsed?.session || parsed;
        return this.memorySession;
      } catch (_) { return null; }
    }
    _writeStored(session) {
      this.memorySession = session || null;
      if (!this.persistSession) return;
      try {
        if (session) localStorage.setItem(this.storageKey,JSON.stringify(session));
        else localStorage.removeItem(this.storageKey);
      } catch (_) {}
    }
    _emit(event,session) {
      for (const callback of this.listeners) {
        try { callback(event,session); } catch (error) { console.error('[Good King] Auth listener',error); }
      }
    }
    async _authFetch(path,options={}) {
      return fetch(`${this.baseUrl}/auth/v1${path}`,{
        ...options,
        headers:{apikey:this.key,...jsonHeaders,...(options.headers||{})},
        cache:'no-store'
      });
    }
    async _fetchUser(accessToken) {
      if (!accessToken) return null;
      const response = await this._authFetch('/user',{method:'GET',headers:{Authorization:`Bearer ${accessToken}`}});
      if (!response.ok) throw await errorFromResponse(response);
      return safeJson(response);
    }
    async _refresh(refreshToken) {
      const response = await this._authFetch('/token?grant_type=refresh_token',{
        method:'POST',body:JSON.stringify({refresh_token:refreshToken})
      });
      if (!response.ok) throw await errorFromResponse(response);
      const payload = await safeJson(response);
      const session = normalizeSession(payload);
      if (!session) throw new Error('Supabase no devolvió una sesión renovada.');
      if (!session.user) session.user = payload?.user || await this._fetchUser(session.access_token).catch(()=>null);
      this._writeStored(session);
      this._emit('TOKEN_REFRESHED',session);
      return session;
    }
    async _validSession() {
      let session = this._readStored();
      if (!session?.access_token) return null;
      const now = Math.floor(Date.now()/1000);
      const expiresAt = Number(session.expires_at || decodeJwt(session.access_token).exp || 0);
      if (this.autoRefreshToken && expiresAt && expiresAt <= now + 60 && session.refresh_token) {
        try { session = await this._refresh(session.refresh_token); }
        catch (error) {
          if (expiresAt <= now) {
            this._writeStored(null);
            this._emit('SIGNED_OUT',null);
            throw error;
          }
        }
      }
      return session;
    }
    async getSession() {
      try { return {data:{session:await this._validSession()},error:null}; }
      catch (error) { return {data:{session:null},error}; }
    }
    async signInWithPassword({email,password}) {
      try {
        const response = await this._authFetch('/token?grant_type=password',{
          method:'POST',body:JSON.stringify({email,password})
        });
        if (!response.ok) throw await errorFromResponse(response);
        const payload = await safeJson(response);
        const session = normalizeSession(payload);
        if (!session) throw new Error('Supabase no devolvió una sesión válida.');
        session.user = payload?.user || session.user || await this._fetchUser(session.access_token).catch(()=>null);
        this._writeStored(session);
        this._emit('SIGNED_IN',session);
        return {data:{user:session.user,session},error:null};
      } catch (error) { return {data:{user:null,session:null},error}; }
    }
    async setSession({access_token,refresh_token}) {
      try {
        let session = normalizeSession({access_token,refresh_token});
        if (!session) throw new Error('Tokens de sesión inválidos.');
        session.user = await this._fetchUser(access_token);
        this._writeStored(session);
        this._emit('SIGNED_IN',session);
        return {data:{user:session.user,session},error:null};
      } catch (error) { return {data:{user:null,session:null},error}; }
    }
    async signOut() {
      const session = this._readStored();
      try {
        if (session?.access_token) {
          await this._authFetch('/logout',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`}}).catch(()=>null);
        }
      } finally {
        this._writeStored(null);
        this._emit('SIGNED_OUT',null);
      }
      return {error:null};
    }
    onAuthStateChange(callback) {
      this.listeners.add(callback);
      const subscription = {unsubscribe:()=>this.listeners.delete(callback)};
      Promise.resolve().then(()=>callback('INITIAL_SESSION',this._readStored())).catch(()=>{});
      return {data:{subscription}};
    }
  }

  class QueryBuilder {
    constructor(client,table) {
      this.client=client; this.table=table; this.method='GET'; this.body=undefined;
      this.params=new URLSearchParams(); this.headers={}; this.mode='many'; this.returnRepresentation=false;
    }
    select(columns='*') { this.params.set('select',columns); if(this.method==='GET'){} else this.returnRepresentation=true; return this; }
    eq(column,value) { this.params.append(column,`eq.${value}`); return this; }
    is(column,value) { this.params.append(column,`is.${value===null?'null':value}`); return this; }
    in(column,values=[]) { this.params.append(column,`in.(${values.map(v=>String(v).replace(/,/g,'\\,')).join(',')})`); return this; }
    order(column,{ascending=true}={}) { this.params.append('order',`${column}.${ascending?'asc':'desc'}`); return this; }
    limit(value) { this.params.set('limit',String(value)); return this; }
    single() { this.mode='single'; return this; }
    maybeSingle() { this.mode='maybeSingle'; return this; }
    insert(values) { this.method='POST'; this.body=values; this.headers.Prefer='return=minimal'; return this; }
    upsert(values,{onConflict,ignoreDuplicates=false}={}) {
      this.method='POST'; this.body=values;
      if(onConflict) this.params.set('on_conflict',onConflict);
      this.headers.Prefer=`resolution=${ignoreDuplicates?'ignore':'merge'}-duplicates,return=minimal`;
      return this;
    }
    update(values) { this.method='PATCH'; this.body=values; this.headers.Prefer='return=minimal'; return this; }
    delete() { this.method='DELETE'; this.headers.Prefer='return=minimal'; return this; }
    async _execute() {
      try {
        const session = await this.client.auth._validSession().catch(()=>this.client.auth._readStored());
        const token = session?.access_token || this.client.key;
        const qs=this.params.toString();
        const response=await fetch(`${this.client.baseUrl}/rest/v1/${encodeURIComponent(this.table)}${qs?`?${qs}`:''}`,{
          method:this.method,
          headers:{apikey:this.client.key,Authorization:`Bearer ${token}`,Accept:'application/json',...(this.body!==undefined?{'Content-Type':'application/json'}:{}),...this.headers,...(this.returnRepresentation?{Prefer:`${this.headers.Prefer?`${this.headers.Prefer},`:''}return=representation`}:{})},
          body:this.body===undefined?undefined:JSON.stringify(this.body),cache:'no-store'
        });
        if(!response.ok) return {data:null,error:await errorFromResponse(response),status:response.status,statusText:response.statusText};
        let data=null;
        if(response.status!==204) data=await safeJson(response);
        if(this.mode==='single') {
          const rows=Array.isArray(data)?data:(data==null?[]:[data]);
          if(rows.length!==1) return {data:null,error:Object.assign(new Error(`Se esperaba 1 registro y se obtuvieron ${rows.length}.`),{code:'PGRST116'}),status:response.status,statusText:response.statusText};
          data=rows[0];
        } else if(this.mode==='maybeSingle') {
          const rows=Array.isArray(data)?data:(data==null?[]:[data]);
          if(rows.length>1) return {data:null,error:Object.assign(new Error(`Se esperaba como máximo 1 registro y se obtuvieron ${rows.length}.`),{code:'PGRST116'}),status:response.status,statusText:response.statusText};
          data=rows[0] || null;
        }
        return {data,error:null,status:response.status,statusText:response.statusText};
      } catch(error) { return {data:null,error,status:0,statusText:''}; }
    }
    then(resolve,reject) { return this._execute().then(resolve,reject); }
    catch(reject) { return this._execute().catch(reject); }
    finally(callback) { return this._execute().finally(callback); }
  }

  class StorageBucket {
    constructor(client,bucket){this.client=client;this.bucket=bucket;}
    async upload(path,file,{upsert=false,contentType}={}) {
      try {
        const session=await this.client.auth._validSession().catch(()=>this.client.auth._readStored());
        const token=session?.access_token||this.client.key;
        const headers={apikey:this.client.key,Authorization:`Bearer ${token}`,'x-upsert':String(Boolean(upsert))};
        if(contentType || file?.type) headers['Content-Type']=contentType||file.type;
        const response=await fetch(`${this.client.baseUrl}/storage/v1/object/${encodeURIComponent(this.bucket)}/${encodePath(path)}`,{method:'POST',headers,body:file});
        if(!response.ok) return {data:null,error:await errorFromResponse(response)};
        return {data:await safeJson(response),error:null};
      } catch(error){return {data:null,error};}
    }
    getPublicUrl(path) {
      return {data:{publicUrl:`${this.client.baseUrl}/storage/v1/object/public/${encodeURIComponent(this.bucket)}/${encodePath(path)}`}};
    }
  }

  class SupabaseLiteClient {
    constructor(url,key,options={}) {
      this.baseUrl=String(url||'').replace(/\/+$/,''); this.key=key;
      this.auth=new AuthClient(this.baseUrl,key,options.auth||{});
      this.storage={from:bucket=>new StorageBucket(this,bucket)};
    }
    from(table){return new QueryBuilder(this,table);}
    async rpc(fn,args={}) {
      try {
        const session=await this.auth._validSession().catch(()=>this.auth._readStored());
        const token=session?.access_token||this.key;
        const response=await fetch(`${this.baseUrl}/rest/v1/rpc/${encodeURIComponent(fn)}`,{method:'POST',headers:{apikey:this.key,Authorization:`Bearer ${token}`,...jsonHeaders},body:JSON.stringify(args),cache:'no-store'});
        if(!response.ok) return {data:null,error:await errorFromResponse(response),status:response.status};
        return {data:await safeJson(response),error:null,status:response.status};
      } catch(error){return {data:null,error,status:0};}
    }
  }

  function createClient(url,key,options){
    if(!url || !key) throw new Error('Falta URL o clave pública de Supabase.');
    return new SupabaseLiteClient(url,key,options||{});
  }

  global.supabase={createClient,__goodKingLocalClient:true,__version:'0.9.1-lite'};
})(window);
