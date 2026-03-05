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

function Layout({ children }) {
  const links = ['overview','tasks','logs','files','terminal','settings','history'];
  return <div className='min-h-screen flex'><aside className='w-52 border-r border-zinc-800 p-4 space-y-2'>{links.map(l=><NavLink key={l} to={`/${l}`} className='block capitalize text-zinc-300'>{l}</NavLink>)}</aside><main className='flex-1 p-6'>{children}</main></div>;
}

function Overview(){
  const [data,setData]=useState(null); const [series,setSeries]=useState([]);
  useEffect(()=>{const t=setInterval(async()=>{const r=await api.get('/overview'); setData(r.data); setSeries(s=>[...s.slice(-59),{t:new Date().toLocaleTimeString(),...r.data.resources}]);},1000); return ()=>clearInterval(t)},[]);
  if(!data) return 'Loading...';
  return <div className='space-y-4'>
    <div className='grid grid-cols-4 gap-3'>{Object.entries(data.stats).map(([k,v])=><div key={k} className='card'><div className='text-zinc-400'>{k}</div><div className='text-2xl'>{v}</div></div>)}</div>
    <div className='card h-64'><ResponsiveContainer><LineChart data={series}><XAxis dataKey='t' hide/><YAxis/><Tooltip/><Line dataKey='cpu' stroke='#60a5fa'/><Line dataKey='ram' stroke='#34d399'/><Line dataKey='disk' stroke='#fbbf24'/></LineChart></ResponsiveContainer></div>
    <div className='card'><div>Agent uptime: {Math.floor(data.agent.uptimeSec)}s | version: {data.agent.version}</div></div>
  </div>;
}

function Tasks(){
  const [tasks,setTasks]=useState([]); const [q,setQ]=useState(''); const [status,setStatus]=useState(''); const [prompt,setPrompt]=useState('');
  const load=async()=>setTasks((await api.get('/tasks',{params:{q,status}})).data); useEffect(()=>{load()},[q,status]);
  return <div className='space-y-3'>
    <div className='flex gap-2'><input className='bg-zinc-900 p-2 rounded' placeholder='Search' value={q} onChange={e=>setQ(e.target.value)}/><select className='bg-zinc-900 p-2 rounded' onChange={e=>setStatus(e.target.value)}><option value=''>all</option><option>running</option><option>queued</option><option>done</option><option>failed</option></select></div>
    <div className='card'><table className='w-full text-sm'><thead><tr><th>ID</th><th>Durum</th><th>Başlangıç</th><th>Süre</th><th>Çalıştıran</th><th/></tr></thead><tbody>{tasks.map(t=><tr key={t.id}><td>{t.id}</td><td>{t.status}</td><td>{new Date(t.startedAt).toLocaleString()}</td><td>{Math.floor((t.durationMs||0)/1000)}s</td><td>{t.actor}</td><td><button onClick={()=>api.post(`/tasks/${t.id}/cancel`).then(load)}>İptal</button> | <button onClick={()=>api.post(`/tasks/${t.id}/restart`).then(load)}>Yeniden Başlat</button></td></tr>)}</tbody></table></div>
    <div className='flex gap-2'><input className='bg-zinc-900 p-2 rounded flex-1' placeholder='Yeni görev prompt' value={prompt} onChange={e=>setPrompt(e.target.value)}/><button className='bg-blue-600 px-3 rounded' onClick={()=>api.post('/tasks',{prompt}).then(()=>{setPrompt('');load();})}>Başlat</button></div>
  </div>;
}

function Logs(){
  const [logs,setLogs]=useState([]); const [level,setLevel]=useState(''); const [keyword,setKeyword]=useState('');
  useEffect(()=>{const wsBase=import.meta.env.VITE_WS_URL || `${window.location.protocol==='https:'?'wss':'ws'}://${window.location.host}`; const ws=new WebSocket(wsBase+'/ws/logs'); ws.onmessage=e=>setLogs(s=>[...s.slice(-500),JSON.parse(e.data)]); return ()=>ws.close();},[]);
  const filtered=useMemo(()=>logs.filter(l=>(!level||l.level===level)&&(!keyword||l.message.includes(keyword))),[logs,level,keyword]);
  return <div className='space-y-2'><div className='flex gap-2'><select className='bg-zinc-900 p-2 rounded' onChange={e=>setLevel(e.target.value)}><option value=''>all</option><option>INFO</option><option>WARN</option><option>ERROR</option><option>TOOL_CALL</option></select><input className='bg-zinc-900 p-2 rounded' placeholder='keyword' onChange={e=>setKeyword(e.target.value)}/></div><div className='card h-96 overflow-auto font-mono text-sm'>{filtered.map((l,i)=><div key={i} className={colors[l.level]}>{new Date(l.ts).toLocaleTimeString()} {l.message}</div>)}</div></div>;
}

function Files(){
  const [path,setPath]=useState('.'); const [items,setItems]=useState([]); const [content,setContent]=useState('');
  const load=async(p=path)=>{setPath(p); setItems((await api.get('/files/list',{params:{path:p}})).data)}; useEffect(()=>{load('.')},[]);
  return <div className='grid grid-cols-2 gap-3'><div className='card h-96 overflow-auto'>{items.map(i=><div key={i.name} className='cursor-pointer' onClick={async()=>i.type==='dir'?load(`${path}/${i.name}`):setContent((await api.get('/files/read',{params:{path:`${path}/${i.name}`}})).data)}>{i.type==='dir'?'📁':'📄'} {i.name}</div>)}</div><textarea className='card h-96 w-full bg-zinc-900' value={content} onChange={e=>setContent(e.target.value)}/></div>;
}

function Term(){
  const el=useRef(null); useEffect(()=>{const term=new Terminal(); const fit=new FitAddon(); term.loadAddon(fit); term.open(el.current); fit.fit(); const wsBase=import.meta.env.VITE_WS_URL || `${window.location.protocol==='https:'?'wss':'ws'}://${window.location.host}`; const ws=new WebSocket(wsBase+'/ws/terminal'); term.onData(d=>ws.send(d)); ws.onmessage=e=>term.write(e.data); return ()=>{ws.close();term.dispose();};},[]);
  return <div ref={el} className='card h-[500px]'/>
}

function Settings(){
  const [s,setS]=useState({}); useEffect(()=>{api.get('/settings').then(r=>setS(r.data))},[]);
  return <div className='card space-y-2'><input className='bg-zinc-900 p-2 rounded w-full' value={s.model||''} onChange={e=>setS({...s,model:e.target.value})}/><button className='bg-blue-600 px-3 py-1 rounded' onClick={()=>api.post('/settings',s)}>Kaydet</button><button className='bg-amber-600 px-3 py-1 rounded ml-2' onClick={()=>api.post('/settings/restart')}>Agent'ı Yeniden Başlat</button></div>
}

function History(){
  const [a,setA]=useState(null); useEffect(()=>{api.get('/analytics').then(r=>setA(r.data))},[]); if(!a) return 'Loading';
  return <div className='grid grid-cols-2 gap-3'><div className='card h-64'><ResponsiveContainer><BarChart data={a.dailyTasks}><XAxis dataKey='date'/><YAxis/><Tooltip/><Bar dataKey='count' fill='#60a5fa'/></BarChart></ResponsiveContainer></div><div className='card h-64'><ResponsiveContainer><PieChart><Pie data={a.toolUsage} dataKey='value' nameKey='name'>{a.toolUsage.map((_,i)=><Cell key={i} fill={['#60a5fa','#34d399','#f87171','#fbbf24'][i%4]}/> )}</Pie></PieChart></ResponsiveContainer></div><div className='card'>Average duration: {a.averageDurationSec.toFixed(1)}s</div><div className='card'>Token: {a.tokenUsage} | Cost: ${a.estimatedCost}</div></div>
}

function Login({ onOk }){
  const [username,setUsername]=useState('admin'); const [password,setPassword]=useState('admin123'); const [err,setErr]=useState('');
  const submit=async()=>{try{const r=await axios.post((import.meta.env.VITE_API_URL||'http://localhost:4001/api')+'/auth/login',{username,password});localStorage.setItem('token',r.data.token);onOk();}catch{setErr('Login failed')}};
  return <div className='min-h-screen flex items-center justify-center'><div className='card w-96 space-y-2'><h1 className='text-xl'>OpenClaw Dashboard</h1><input className='bg-zinc-900 p-2 rounded w-full' value={username} onChange={e=>setUsername(e.target.value)}/><input type='password' className='bg-zinc-900 p-2 rounded w-full' value={password} onChange={e=>setPassword(e.target.value)}/><button className='bg-blue-600 px-3 py-2 rounded w-full' onClick={submit}>Giriş</button>{err&&<div className='text-red-400 text-sm'>{err}</div>}</div></div>
}

export default function App(){
  const [ok,setOk]=useState(!!localStorage.getItem('token'));
  if(!ok) return <Login onOk={()=>setOk(true)}/>;
  return <Layout><Routes><Route path='/' element={<Overview/>}/><Route path='/overview' element={<Overview/>}/><Route path='/tasks' element={<Tasks/>}/><Route path='/logs' element={<Logs/>}/><Route path='/files' element={<Files/>}/><Route path='/terminal' element={<Term/>}/><Route path='/settings' element={<Settings/>}/><Route path='/history' element={<History/>}/></Routes></Layout>
}
