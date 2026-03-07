import { NavLink, Route, Routes } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const colors = { INFO: 'text-white', WARN: 'text-yellow-400', ERROR: 'text-red-400', TOOL_CALL: 'text-blue-400' };

function Notifications(){
  const [events,setEvents]=useState([]);
  useEffect(()=>{const wsBase=import.meta.env.VITE_WS_URL || `${window.location.protocol==='https:'?'wss':'ws'}://${window.location.host}`; const ws=new WebSocket(wsBase+'/ws/tasks'); ws.onmessage=(e)=>{const evt=JSON.parse(e.data); setEvents(s=>[{ts:Date.now(),text:evt.type||'task.event'},...s].slice(0,5));}; return ()=>ws.close();},[]);
  if(!events.length) return null;
  return <div className='fixed top-3 right-3 z-50 space-y-2'>{events.map((e,i)=><div key={i} className='bg-zinc-900/95 border border-zinc-700 px-3 py-2 rounded text-xs text-emerald-300'>{new Date(e.ts).toLocaleTimeString()} · {e.text}</div>)}</div>;
}

function Layout({ children }) {
  const links = ['overview','tasks','agents','skills','logs','files','terminal','settings','history'];
  return <div className='min-h-screen flex bg-gradient-to-b from-zinc-950 to-black'><Notifications/><aside className='w-60 border-r border-zinc-800 p-4 space-y-2 bg-zinc-950/80'><div className='mb-4'><div className='text-red-400 font-semibold'>OpenClaw Ops</div><div className='text-xs text-zinc-500'>Mission Control Dashboard</div></div>{links.map(l=><NavLink key={l} to={`/${l}`} className={({isActive})=>`block capitalize rounded px-3 py-2 ${isActive?'bg-zinc-800 text-white':'text-zinc-300 hover:bg-zinc-900'}`}>{l}</NavLink>)}</aside><main className='flex-1 p-6'><div className='max-w-[1500px] mx-auto'>{children}</div></main></div>;
}

function Overview(){
  const [data,setData]=useState(null); const [series,setSeries]=useState([]); const [timeline,setTimeline]=useState([]);
  useEffect(()=>{const load=async()=>{const r=await api.get('/overview'); setData(r.data); const logs=(await api.get('/logs/export',{params:{format:'json'}})).data||[]; setTimeline(logs.filter(l=>String(l.message||'').includes('[CONTROL]')).slice(-5).reverse());}; load(); const wsBase=import.meta.env.VITE_WS_URL || `${window.location.protocol==='https:'?'wss':'ws'}://${window.location.host}`; const ws=new WebSocket(wsBase+'/ws/system'); ws.onmessage=(e)=>{const m=JSON.parse(e.data); setSeries(s=>[...s.slice(-59),{t:new Date(m.ts).toLocaleTimeString(),cpu:m.cpu,ram:m.ram,disk:m.disk}]);}; return ()=>ws.close();},[]);
  if(!data) return 'Loading...';
  return <div className='space-y-4'>
    <div className='grid grid-cols-4 gap-3'>{Object.entries(data.stats).map(([k,v])=><div key={k} className='card'><div className='text-zinc-400'>{k}</div><div className='text-2xl'>{v}</div></div>)}</div>
    <div className='grid grid-cols-3 gap-3'>{Object.entries(data.agentStats||{}).map(([k,v])=><div key={k} className='card'><div className='text-zinc-400'>agent {k}</div><div className='text-xl'>{v}</div></div>)}</div>
    <div className='card h-64'><ResponsiveContainer><LineChart data={series}><XAxis dataKey='t' hide/><YAxis/><Tooltip/><Line dataKey='cpu' stroke='#60a5fa'/><Line dataKey='ram' stroke='#34d399'/><Line dataKey='disk' stroke='#fbbf24'/></LineChart></ResponsiveContainer></div>
    <div className='card'><div>Agent uptime: {Math.floor(data.agent.uptimeSec)}s | version: {data.agent.version}</div></div>
    <div className='card'><div className='mb-2 text-zinc-300'>Control Timeline (son 5)</div>{timeline.length?timeline.map((l,i)=><div key={i} className='text-xs text-zinc-400'>{new Date(l.ts).toLocaleTimeString()} {l.message}</div>):<div className='text-xs text-zinc-500'>Henüz control eventi yok</div>}</div>
  </div>;
}

function Tasks(){
  const [tasks,setTasks]=useState([]); const [q,setQ]=useState(''); const [status,setStatus]=useState(''); const [prompt,setPrompt]=useState(''); const [deps,setDeps]=useState(''); const [subtasks,setSubtasks]=useState('');
  const [from,setFrom]=useState(''); const [to,setTo]=useState(''); const [detail,setDetail]=useState(null); const [lastEvent,setLastEvent]=useState('');
  const [events,setEvents]=useState([]); const [view,setView]=useState('list');
  const load=async()=>setTasks((await api.get('/tasks',{params:{q,status,from:from?new Date(from).getTime():undefined,to:to?new Date(to).getTime():undefined}})).data);
  useEffect(()=>{load()},[q,status,from,to]);
  useEffect(()=>{const wsBase=import.meta.env.VITE_WS_URL || `${window.location.protocol==='https:'?'wss':'ws'}://${window.location.host}`; const ws=new WebSocket(wsBase+'/ws/tasks'); ws.onmessage=(e)=>{const evt=JSON.parse(e.data); setLastEvent(evt.type||'task.event'); setEvents(s=>[{ts:Date.now(),msg:evt.type||'task.event'},...s].slice(0,20)); load();}; return ()=>ws.close();},[q,status,from,to]);
  const lanes={queued:tasks.filter(t=>t.status==='queued'),running:tasks.filter(t=>t.status==='running'||t.status==='in_progress'),done:tasks.filter(t=>t.status==='done'),failed:tasks.filter(t=>t.status==='failed')};
  return <div className='space-y-3'>
    <div className='flex gap-2 flex-wrap'><input className='bg-zinc-900 p-2 rounded' placeholder='Search' value={q} onChange={e=>setQ(e.target.value)}/><select className='bg-zinc-900 p-2 rounded' onChange={e=>setStatus(e.target.value)}><option value=''>all</option><option>running</option><option>queued</option><option>done</option><option>failed</option></select><input type='datetime-local' className='bg-zinc-900 p-2 rounded' value={from} onChange={e=>setFrom(e.target.value)}/><input type='datetime-local' className='bg-zinc-900 p-2 rounded' value={to} onChange={e=>setTo(e.target.value)}/><button className='bg-zinc-800 px-3 rounded' onClick={()=>setView(view==='list'?'kanban':'list')}>{view==='list'?'Kanban':'Liste'}</button></div>
    {lastEvent && <div className='text-xs text-emerald-400'>Live: {lastEvent}</div>}
    {view==='list' ? <div className='card'><table className='w-full text-sm'><thead><tr><th>ID</th><th>Durum</th><th>Başlangıç</th><th>Süre</th><th>Çalıştıran</th><th/></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td>{t.id}</td><td>{t.status}</td><td>{new Date(t.startedAt).toLocaleString()}</td><td>{Math.floor((t.durationMs||0)/1000)}s</td><td>{t.actor}</td><td><button onClick={async()=>setDetail((await api.get(`/tasks/${t.id}`)).data)}>Detay</button> | <button onClick={()=>api.post(`/tasks/${t.id}/cancel`).then(load)}>İptal</button> | <button onClick={()=>api.post(`/tasks/${t.id}/restart`).then(load)}>Yeniden Başlat</button></td></tr>)}</tbody></table></div> : <div className='grid grid-cols-4 gap-3'>{Object.entries(lanes).map(([lane,rows])=><div key={lane} className='card'><div className='font-semibold capitalize mb-2'>{lane} ({rows.length})</div><div className='space-y-2'>{rows.map(t=><div key={t.id} className='bg-zinc-950 p-2 rounded text-xs'><div className='font-medium'>{t.title||t.id}</div><div className='text-zinc-400'>{t.assignee||t.actor||'-'}</div><button className='text-blue-400' onClick={async()=>setDetail((await api.get(`/tasks/${t.id}`)).data)}>Detay</button></div>)}</div></div>)}</div>}
    <div className='grid grid-cols-1 md:grid-cols-4 gap-2'><input className='bg-zinc-900 p-2 rounded' placeholder='Yeni görev prompt/title' value={prompt} onChange={e=>setPrompt(e.target.value)}/><input className='bg-zinc-900 p-2 rounded' placeholder='Bağımlılıklar (id,id)' value={deps} onChange={e=>setDeps(e.target.value)}/><input className='bg-zinc-900 p-2 rounded' placeholder='Subtasks (virgül ile)' value={subtasks} onChange={e=>setSubtasks(e.target.value)}/><button className='bg-blue-600 px-3 rounded' onClick={()=>api.post('/tasks',{title:prompt,prompt,dependencies:deps.split(',').map(x=>x.trim()).filter(Boolean),subtasks:subtasks.split(',').map(x=>x.trim()).filter(Boolean).map(title=>({title,done:false}))}).then(()=>{setPrompt('');setDeps('');setSubtasks('');load();})}>Başlat</button></div>
    <div className='card'><div className='text-sm mb-2'>Event Stream (son 20)</div>{events.length?events.map((e,i)=><div key={i} className='text-xs text-zinc-400'>{new Date(e.ts).toLocaleTimeString()} {e.msg}</div>):<div className='text-xs text-zinc-500'>event bekleniyor...</div>}</div>
    {detail && <div className='fixed inset-0 bg-black/60 flex items-center justify-center' onClick={()=>setDetail(null)}><div className='card w-[900px] max-h-[85vh] overflow-auto space-y-2' onClick={(e)=>e.stopPropagation()}><div className='flex justify-between'><h3 className='text-lg'>{detail.id}</h3><button onClick={()=>setDetail(null)}>Kapat</button></div><div className='grid grid-cols-2 gap-2'><input className='bg-zinc-900 p-2 rounded' value={detail.title||''} onChange={e=>setDetail({...detail,title:e.target.value})}/><select className='bg-zinc-900 p-2 rounded' value={detail.status||'queued'} onChange={e=>setDetail({...detail,status:e.target.value})}><option value='queued'>queued</option><option value='running'>running</option><option value='in_progress'>in_progress</option><option value='done'>done</option><option value='failed'>failed</option></select><input className='bg-zinc-900 p-2 rounded' placeholder='assignee' value={detail.assignee||''} onChange={e=>setDetail({...detail,assignee:e.target.value})}/><input className='bg-zinc-900 p-2 rounded' placeholder='progress 0-100' value={detail.progress||0} onChange={e=>setDetail({...detail,progress:Number(e.target.value)})}/></div><input className='bg-zinc-900 p-2 rounded w-full' placeholder='dependencies (id,id)' value={(detail.dependencies||[]).join(',')} onChange={e=>setDetail({...detail,dependencies:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})}/><div>Durum: {detail.status} | Token: {detail.tokens} | Progress: {detail.progress||0}%</div><div className='mt-2'>Tools: {(detail.tools||[]).join(', ') || '-'}</div><div className='mt-2'><div className='text-sm mb-1'>Subtasks</div>{(detail.subtasks||[]).map((s,idx)=><label key={idx} className='block text-xs'><input type='checkbox' checked={!!s.done} onChange={e=>{const next=[...(detail.subtasks||[])]; next[idx]={...s,done:e.target.checked}; setDetail({...detail,subtasks:next,progress:Math.round((next.filter(x=>x.done).length/Math.max(next.length,1))*100)});}}/> <span className='ml-2'>{s.title||`Subtask ${idx+1}`}</span></label>)}</div><button className='bg-blue-600 px-3 py-1 rounded' onClick={()=>api.put(`/tasks/${detail.id}`,detail).then(async()=>{setDetail((await api.get(`/tasks/${detail.id}`)).data);load();})}>Kaydet</button><pre className='mt-2 text-xs bg-zinc-950 p-2 rounded'>{(detail.logs||[]).join('\n')}</pre></div></div>}
  </div>;
}

function Agents(){
  const [agents,setAgents]=useState([]); const [name,setName]=useState(''); const [role,setRole]=useState(''); const [detail,setDetail]=useState(null);
  const load=async()=>setAgents((await api.get('/agents')).data); useEffect(()=>{load();},[]);
  return <div className='space-y-3'>
    <div className='flex gap-2'><input className='bg-zinc-900 p-2 rounded' placeholder='agent name' value={name} onChange={e=>setName(e.target.value)}/><input className='bg-zinc-900 p-2 rounded' placeholder='role' value={role} onChange={e=>setRole(e.target.value)}/><button className='bg-blue-600 px-3 rounded' onClick={()=>api.post('/agents',{name,role}).then(()=>{setName('');setRole('');load();})}>Ekle</button></div>
    <div className='card'><table className='w-full text-sm'><thead><tr><th>ID</th><th>Ad</th><th>Rol</th><th>Durum</th><th/></tr></thead><tbody>{agents.map(a=><tr key={a.id}><td>{a.id}</td><td>{a.name}</td><td>{a.role}</td><td>{a.status||'idle'}</td><td><button onClick={()=>setDetail({...a})}>Detay</button> | <button onClick={()=>api.post(`/agents/${a.id}/start`).then(load)}>Start</button> | <button onClick={()=>api.post(`/agents/${a.id}/stop`).then(load)}>Stop</button> | <button onClick={()=>api.delete(`/agents/${a.id}`).then(load)}>Sil</button></td></tr>)}</tbody></table></div>
    {detail && <div className='fixed inset-0 bg-black/60 flex items-center justify-center' onClick={()=>setDetail(null)}><div className='card w-[600px] space-y-2' onClick={(e)=>e.stopPropagation()}><div className='flex justify-between'><h3 className='text-lg'>{detail.id}</h3><button onClick={()=>setDetail(null)}>Kapat</button></div><input className='bg-zinc-900 p-2 rounded w-full' value={detail.name||''} onChange={e=>setDetail({...detail,name:e.target.value})}/><input className='bg-zinc-900 p-2 rounded w-full' value={detail.role||''} onChange={e=>setDetail({...detail,role:e.target.value})}/><select className='bg-zinc-900 p-2 rounded w-full' value={detail.status||'idle'} onChange={e=>setDetail({...detail,status:e.target.value})}><option value='idle'>idle</option><option value='running'>running</option><option value='stopped'>stopped</option></select><button className='bg-blue-600 px-3 py-1 rounded' onClick={()=>api.put(`/agents/${detail.id}`,detail).then(()=>{setDetail(null);load();})}>Kaydet</button></div></div>}
  </div>;
}

function Skills(){
  const [skills,setSkills]=useState([]); const [agents,setAgents]=useState([]); const [name,setName]=useState(''); const [description,setDescription]=useState(''); const [agentId,setAgentId]=useState(''); const [detail,setDetail]=useState(null);
  const load=async()=>{setSkills((await api.get('/skills')).data); const a=(await api.get('/agents')).data; setAgents(a); if(!agentId && a[0]?.id) setAgentId(a[0].id);}; useEffect(()=>{load();},[]);
  return <div className='space-y-3'>
    <div className='flex gap-2'><input className='bg-zinc-900 p-2 rounded' placeholder='skill name' value={name} onChange={e=>setName(e.target.value)}/><input className='bg-zinc-900 p-2 rounded flex-1' placeholder='description' value={description} onChange={e=>setDescription(e.target.value)}/><button className='bg-blue-600 px-3 rounded' onClick={()=>api.post('/skills',{name,description}).then(()=>{setName('');setDescription('');load();})}>Ekle</button></div>
    <div className='flex gap-2 items-center'><span className='text-sm text-zinc-400'>Atama agent:</span><select className='bg-zinc-900 p-2 rounded' value={agentId} onChange={e=>setAgentId(e.target.value)}>{agents.map(a=><option key={a.id} value={a.id}>{a.name||a.id}</option>)}</select></div>
    <div className='card'><table className='w-full text-sm'><thead><tr><th>ID</th><th>Ad</th><th>Açıklama</th><th>Atanan Agent</th><th/></tr></thead><tbody>{skills.map(s=><tr key={s.id}><td>{s.id}</td><td>{s.name}</td><td>{s.description}</td><td>{s.assignedAgentId||'-'}</td><td><button onClick={()=>setDetail({...s})}>Detay</button> | <button onClick={()=>api.post(`/skills/${s.id}/assign`,{agentId}).then(load)}>Ata</button> | <button onClick={()=>api.delete(`/skills/${s.id}`).then(load)}>Sil</button></td></tr>)}</tbody></table></div>
    {detail && <div className='fixed inset-0 bg-black/60 flex items-center justify-center' onClick={()=>setDetail(null)}><div className='card w-[600px] space-y-2' onClick={(e)=>e.stopPropagation()}><div className='flex justify-between'><h3 className='text-lg'>{detail.id}</h3><button onClick={()=>setDetail(null)}>Kapat</button></div><input className='bg-zinc-900 p-2 rounded w-full' value={detail.name||''} onChange={e=>setDetail({...detail,name:e.target.value})}/><textarea className='bg-zinc-900 p-2 rounded w-full' value={detail.description||''} onChange={e=>setDetail({...detail,description:e.target.value})}/><button className='bg-blue-600 px-3 py-1 rounded' onClick={()=>api.put(`/skills/${detail.id}`,detail).then(()=>{setDetail(null);load();})}>Kaydet</button></div></div>}
  </div>;
}

function Logs(){
  const [logs,setLogs]=useState([]); const [level,setLevel]=useState(''); const [keyword,setKeyword]=useState(''); const [connected,setConnected]=useState(false);
  useEffect(()=>{api.get('/logs/export',{params:{format:'json'}}).then(r=>setLogs(r.data||[])).catch(()=>{}); const wsBase=import.meta.env.VITE_WS_URL || `${window.location.protocol==='https:'?'wss':'ws'}://${window.location.host}`; const ws=new WebSocket(wsBase+'/ws/logs'); ws.onopen=()=>setConnected(true); ws.onclose=()=>setConnected(false); ws.onmessage=e=>setLogs(s=>[...s.slice(-500),JSON.parse(e.data)]); return ()=>ws.close();},[]);
  const filtered=useMemo(()=>logs.filter(l=>(!level||l.level===level)&&(!keyword||l.message.includes(keyword))),[logs,level,keyword]);
  const download=(format)=>window.open(`${import.meta.env.VITE_API_URL||'/api'}/logs/export?format=${format}${level?`&level=${level}`:''}${keyword?`&keyword=${encodeURIComponent(keyword)}`:''}`,'_blank');
  return <div className='space-y-2'><div className='flex gap-2 items-center'><select className='bg-zinc-900 p-2 rounded' onChange={e=>setLevel(e.target.value)}><option value=''>all</option><option>INFO</option><option>WARN</option><option>ERROR</option><option>TOOL_CALL</option></select><input className='bg-zinc-900 p-2 rounded' placeholder='keyword' onChange={e=>setKeyword(e.target.value)}/><button className='bg-zinc-800 px-3 rounded' onClick={()=>download('txt')}>TXT indir</button><button className='bg-zinc-800 px-3 rounded' onClick={()=>download('json')}>JSON indir</button><span className={`text-xs ${connected?'text-emerald-400':'text-amber-400'}`}>{connected?'WS bağlı':'WS bağlı değil'}</span></div><div className='card h-96 overflow-auto font-mono text-sm'>{filtered.map((l,i)=><div key={i} className={colors[l.level]}>{new Date(l.ts).toLocaleTimeString()} {l.message}</div>)}</div></div>;
}

function Files(){
  const [path,setPath]=useState('.'); const [items,setItems]=useState([]); const [content,setContent]=useState(''); const [selected,setSelected]=useState('');
  const load=async(p=path)=>{setPath(p); setItems((await api.get('/files/list',{params:{path:p}})).data)}; useEffect(()=>{load('.')},[]);
  const full=(name)=>`${path}/${name}`.replace('./','');
  return <div className='space-y-2'><div className='flex gap-2'><button className='bg-zinc-800 px-3 rounded' onClick={()=>load(path.split('/').slice(0,-1).join('/')||'.')}>..</button><button className='bg-zinc-800 px-3 rounded' onClick={async()=>{const n=prompt('Klasör adı'); if(!n) return; await api.post('/files/mkdir',{path:full(n)}); load();}}>Yeni Klasör</button><button className='bg-zinc-800 px-3 rounded' onClick={async()=>{const n=prompt('Dosya adı'); if(!n) return; await api.post('/files/write',{path:full(n),content:''}); load();}}>Yeni Dosya</button><button className='bg-zinc-800 px-3 rounded' onClick={async()=>{if(!selected) return; const n=prompt('Yeni ad'); if(!n) return; await api.post('/files/rename',{oldPath:selected,newPath:selected.split('/').slice(0,-1).concat([n]).join('/')}); load();}}>Yeniden Adlandır</button><button className='bg-red-700 px-3 rounded' onClick={async()=>{if(!selected) return; await api.delete('/files',{params:{path:selected}}); setSelected(''); setContent(''); load();}}>Sil</button><button className='bg-zinc-800 px-3 rounded' onClick={()=>selected&&window.open(`${import.meta.env.VITE_API_URL||'/api'}/files/download?path=${encodeURIComponent(selected)}`,'_blank')}>İndir</button><button className='bg-blue-700 px-3 rounded' onClick={async()=>{if(!selected) return; await api.post('/files/write',{path:selected,content});}}>Kaydet</button></div><div className='grid grid-cols-2 gap-3'><div className='card h-96 overflow-auto'>{items.map(i=><div key={i.name} className={`cursor-pointer ${selected===full(i.name)?'bg-zinc-800':''}`} onClick={async()=>{const p=full(i.name); if(i.type==='dir'){load(p);return;} setSelected(p); setContent((await api.get('/files/read',{params:{path:p}})).data);}}>{i.type==='dir'?'📁':'📄'} {i.name}</div>)}</div><textarea className='card h-96 w-full bg-zinc-900 font-mono text-sm' value={content} onChange={e=>setContent(e.target.value)}/></div></div>;
}

function Term(){
  const el=useRef(null); useEffect(()=>{const term=new Terminal(); const fit=new FitAddon(); term.loadAddon(fit); term.open(el.current); fit.fit(); const wsBase=import.meta.env.VITE_WS_URL || `${window.location.protocol==='https:'?'wss':'ws'}://${window.location.host}`; const ws=new WebSocket(wsBase+'/ws/terminal'); term.onData(d=>ws.send(d)); ws.onmessage=e=>term.write(e.data); return ()=>{ws.close();term.dispose();};},[]);
  return <div ref={el} className='card h-[500px]'/>
}

function Settings(){
  const [s,setS]=useState({}); useEffect(()=>{api.get('/settings').then(r=>setS(r.data))},[]);
  const addKey=()=>{const provider=prompt('Provider'); const key=prompt('API Key'); if(!provider||!key) return; setS({...s,apiKeys:[...(s.apiKeys||[]),{provider,key}]});};
  return <div className='card space-y-2'>
    <div className='grid grid-cols-2 gap-2'>
      <input className='bg-zinc-900 p-2 rounded w-full' placeholder='model' value={s.model||''} onChange={e=>setS({...s,model:e.target.value})}/>
      <input className='bg-zinc-900 p-2 rounded w-full' placeholder='maxTokens' value={s.maxTokens||''} onChange={e=>setS({...s,maxTokens:Number(e.target.value)})}/>
      <input className='bg-zinc-900 p-2 rounded w-full' placeholder='temperature' value={s.temperature||''} onChange={e=>setS({...s,temperature:Number(e.target.value)})}/>
      <input className='bg-zinc-900 p-2 rounded w-full' placeholder='timeoutSec' value={s.timeoutSec||''} onChange={e=>setS({...s,timeoutSec:Number(e.target.value)})}/>
    </div>
    <div className='card'>
      <div className='mb-2'>API Keys</div>
      {(s.apiKeys||[]).map((k,idx)=><div key={idx} className='flex justify-between text-sm'><span>{k.provider}</span><span>{String(k.key).startsWith('sk-')?'sk-****-****':k.key}</span><button onClick={()=>setS({...s,apiKeys:(s.apiKeys||[]).filter((_,i)=>i!==idx)})}>sil</button></div>)}
      <button className='bg-zinc-800 px-3 py-1 rounded mt-2' onClick={addKey}>Yeni Key Ekle</button>
    </div>
    <button className='bg-blue-600 px-3 py-1 rounded' onClick={()=>api.post('/settings',s)}>Kaydet</button><button className='bg-amber-600 px-3 py-1 rounded ml-2' onClick={()=>api.post('/settings/restart')}>Agent'ı Yeniden Başlat</button>
  </div>
}

function History(){
  const [a,setA]=useState(null); useEffect(()=>{api.get('/analytics').then(r=>setA(r.data))},[]); if(!a) return 'Loading';
  const burnup=(a.dailyTasks||[]).slice().sort((x,y)=>x.date.localeCompare(y.date)).reduce((acc,row)=>{const prev=acc.length?acc[acc.length-1].done:0; acc.push({date:row.date,done:prev+row.count}); return acc;},[]);
  return <div className='grid grid-cols-2 gap-3'><div className='card h-64'><ResponsiveContainer><BarChart data={a.dailyTasks}><XAxis dataKey='date'/><YAxis/><Tooltip/><Bar dataKey='count' fill='#60a5fa'/></BarChart></ResponsiveContainer></div><div className='card h-64'><ResponsiveContainer><PieChart><Pie data={a.toolUsage} dataKey='value' nameKey='name'>{a.toolUsage.map((_,i)=><Cell key={i} fill={['#60a5fa','#34d399','#f87171','#fbbf24'][i%4]}/> )}</Pie></PieChart></ResponsiveContainer></div><div className='card h-64'><ResponsiveContainer><BarChart data={a.agentUsage||[]}><XAxis dataKey='name'/><YAxis/><Tooltip/><Bar dataKey='value' fill='#34d399'/></BarChart></ResponsiveContainer></div><div className='card h-64'><ResponsiveContainer><LineChart data={burnup}><XAxis dataKey='date'/><YAxis/><Tooltip/><Line dataKey='done' stroke='#a78bfa'/></LineChart></ResponsiveContainer></div><div className='card col-span-2'>Average duration: {a.averageDurationSec.toFixed(1)}s<br/>Token: {a.tokenUsage} | Cost: ${a.estimatedCost}</div></div>
}

function Login({ onOk }){
  const [username,setUsername]=useState('admin'); const [password,setPassword]=useState('admin123'); const [err,setErr]=useState('');
  const submit=async()=>{try{const r=await axios.post((import.meta.env.VITE_API_URL||'/api')+'/auth/login',{username,password});localStorage.setItem('token',r.data.token);onOk();}catch{setErr('Login failed')}};
  return <div className='min-h-screen flex items-center justify-center'><div className='card w-96 space-y-2'><h1 className='text-xl'>OpenClaw Dashboard</h1><input className='bg-zinc-900 p-2 rounded w-full' value={username} onChange={e=>setUsername(e.target.value)}/><input type='password' className='bg-zinc-900 p-2 rounded w-full' value={password} onChange={e=>setPassword(e.target.value)}/><button className='bg-blue-600 px-3 py-2 rounded w-full' onClick={submit}>Giriş</button>{err&&<div className='text-red-400 text-sm'>{err}</div>}</div></div>
}

export default function App(){
  const [ok,setOk]=useState(!!localStorage.getItem('token'));
  if(!ok) return <Login onOk={()=>setOk(true)}/>;
  return <Layout><Routes><Route path='/' element={<Overview/>}/><Route path='/overview' element={<Overview/>}/><Route path='/tasks' element={<Tasks/>}/><Route path='/agents' element={<Agents/>}/><Route path='/skills' element={<Skills/>}/><Route path='/logs' element={<Logs/>}/><Route path='/files' element={<Files/>}/><Route path='/terminal' element={<Term/>}/><Route path='/settings' element={<Settings/>}/><Route path='/history' element={<History/>}/></Routes></Layout>
}
