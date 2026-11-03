import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'
import robot from './assets/budgy-robot-classic-glasses.png'
import classicRobot from './assets/budgy-robot-classic.png'
import loginRobot from './assets/budgy-robot-login.png'
import femaleRobot from './assets/budgy-robot-female.png'
import budgyLogo from './assets/budgy-logo-original.png'
import budgyLogoMark from './assets/Budgy-logo-mark.png'

type AccountType = 'bank' | 'cash' | 'credit'
type CategoryType = 'income' | 'expense'
type MovementType = 'income' | 'expense' | 'transfer' | 'receivable' | 'payable'
type PendingNature = 'loaned' | 'expected' | 'owed' | 'borrowed'
type RobotPreference = 'classic' | 'alternative'
type User = { id:string; name:string; email:string; password:string; robotPreference?:RobotPreference }
type Theme = { primary:string; secondary:string; background:string }

type Account = { id:number; name:string; type:AccountType; initialBalance:number; creditLimit?:number; cutoffDay?:number; paymentDay?:number }
type Category = { id:number; name:string; type:CategoryType; icon:string; budget:number; color:string }
type Subcategory = { id:number; categoryId:number; name:string; amount:number; reminderEnabled:boolean; reminderDay?:number; reminderMonth?:number; reminderDays?:number }
type Movement = { id:number; type:MovementType; amount:number; description:string; date:string; accountId:number; categoryId?:number; subcategoryId?:number; destinationAccountId?:number; interestRate?:number; interestAmount?:number; dueDate?:string; reminderEnabled?:boolean; reminderDays?:number; settled?:boolean; settlementMovementId?:number; originPendingId?:number; pendingNature?:PendingNature }

// Budgy returns to the original warm/green identity requested in the latest feedback.
const categoryColors = ['#00C9A7','#00BFA6','#0EA5A8','#22C55E','#6D5CE7','#FFB703']
const defaultTheme:Theme = {primary:'#00C9A7',secondary:'#007BFF',background:'#F5F7FA'}
const themePresets:Theme[] = [
  {primary:'#00C9A7',secondary:'#007BFF',background:'#F5F7FA'},
  {primary:'#7C3AED',secondary:'#EC4899',background:'#F8F7FC'},
  {primary:'#2563EB',secondary:'#06B6D4',background:'#F5F8FC'},
  {primary:'#F97316',secondary:'#EF4444',background:'#FFF8F4'},
  {primary:'#16A34A',secondary:'#0EA5E9',background:'#F5FAF7'}
]
const iconCatalog = [
  ['utensils','Comida','comida restaurante almuerzo cena'],['home','Casa','casa hogar vivienda arriendo'],['car','Auto','auto carro transporte gasolina'],['bus','Transporte','bus transporte taxi'],['shopping','Compras','compras mercado tienda ropa'],['heart','Salud','salud medicina farmacia doctor'],['play','Entretenimiento','cine ocio juegos entretenimiento'],['bolt','Servicios','servicios luz electricidad energía'],['water','Agua','agua acueducto'],['wifi','Internet','internet wifi'],['phone','Celular','celular teléfono móvil'],['book','Educación','educacion estudio universidad'],['plane','Viajes','viajes avión vacaciones'],['dumbbell','Gym','gym gimnasio deporte ejercicio'],['gift','Regalos','regalo cumpleaños obsequio'],['briefcase','Trabajo','trabajo freelance salario'],['wallet','Dinero','dinero ahorro finanzas'],['receipt','Factura','factura pago cuenta'],['coffee','Café','cafe desayuno'],['music','Música','musica concierto'],['spark','Otros','otros varios'],
  ['piggy','Ahorro','ahorro alcancia ahorrar'],['bank','Banco','banco bancario cuenta'],['coin','Monedas','moneda dinero plata'],['chart','Inversión','inversion inversiones acciones'],['shirt','Ropa','ropa vestuario zapatos'],['grocery','Mercado','mercado supermercado alimentos comida'],['medicine','Medicinas','medicinas farmacia medicamentos'],['dentist','Dentista','dentista odontologia dientes'],['baby','Bebé','bebe niños pañales'],['pet','Mascota','mascota perro gato veterinario'],['fuel','Combustible','combustible gasolina tanque'],['parking','Parqueadero','parqueadero estacionamiento'],['train','Metro','metro tren transporte'],['motorcycle','Moto','moto motocicleta transporte'],['bike','Bicicleta','bicicleta ciclismo'],['restaurant','Restaurante','restaurante comida cena'],['pizza','Comida rápida','pizza comida rápida'],['hotel','Hotel','hotel alojamiento hospedaje'],['map','Ubicación','ubicacion mapa dirección'],['camera','Fotos','fotos camara fotografía'],['headphones','Audio','audifonos musica podcast'],['tv','TV','television streaming netflix'],['game','Juegos','juegos videojuegos'],['ticket','Eventos','eventos entradas boletas'],['party','Celebración','celebracion fiesta'],['school','Colegio','colegio escuela educación'],['laptop','Tecnología','tecnologia computador laptop'],['tools','Mantenimiento','mantenimiento reparación arreglos'],['hammer','Reparaciones','reparacion hogar obra'],['leaf','Hogar','hogar naturaleza plantas'],['sun','Vacaciones','vacaciones descanso'],['calendar','Suscripciones','suscripcion mensual membresia'],['lock','Seguridad','seguridad seguro protección'],['document','Documentos','documentos trámites papeles'],['percent','Impuestos','impuestos tributos'],['plus','Salud bienestar','bienestar salud'],['user','Personal','personal cuidado'],['star','Favoritos','favoritos otros']
] as const

function Icon({name,size=22}:{name:string;size?:number}){
  const c={width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const}
  switch(name){
    case 'home':return <svg {...c}><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg>
    case 'car':return <svg {...c}><path d="M5 17h14"/><path d="m6 17-1-5 2-4h10l2 4-1 5"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/></svg>
    case 'bus':return <svg {...c}><rect x="5" y="3" width="14" height="16" rx="2"/><path d="M5 9h14M8 19v2M16 19v2"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>
    case 'shopping':return <svg {...c}><path d="M4 8h16l-1 12H5L4 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>
    case 'heart':return <svg {...c}><path d="M20.8 8.8c0 5.2-8.8 10.2-8.8 10.2S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.6Z"/></svg>
    case 'bolt':return <svg {...c}><path d="m13 2-8 11h6l-1 9 8-11h-6l1-9Z"/></svg>
    case 'water':return <svg {...c}><path d="M12 3s6 6.1 6 10a6 6 0 0 1-12 0c0-3.9 6-10 6-10Z"/></svg>
    case 'wifi':return <svg {...c}><path d="M4 9a12 12 0 0 1 16 0M7 12a7.5 7.5 0 0 1 10 0M10 15a3.2 3.2 0 0 1 4 0"/><circle cx="12" cy="19" r=".7" fill="currentColor" stroke="none"/></svg>
    case 'phone':return <svg {...c}><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10 5h4M11 18.5h2"/></svg>
    case 'book':return <svg {...c}><path d="M4 5a3 3 0 0 1 3-2h11v17H7a3 3 0 0 0-3 2V5Z"/><path d="M7 3v17"/></svg>
    case 'plane':return <svg {...c}><path d="m3 11 18-5-5 18-3-8-10-5Z"/></svg>
    case 'dumbbell':return <svg {...c}><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/></svg>
    case 'gift':return <svg {...c}><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18"/></svg>
    case 'briefcase':return <svg {...c}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></svg>
    case 'wallet':return <svg {...c}><path d="M4 6h15a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13"/><path d="M16 13h5"/></svg>
    case 'target':return <svg {...c}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>
    case 'receipt':return <svg {...c}><path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>
    case 'coffee':return <svg {...c}><path d="M5 8h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z"/><path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2"/></svg>
    case 'music':return <svg {...c}><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>
    case 'play':return <svg {...c}><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/></svg>
    case 'utensils':return <svg {...c}><path d="M7 3v8M4 3v4a3 3 0 0 0 6 0V3M7 10v11M17 3v18M17 3c3 2 3 6 0 8"/></svg>
    case 'spark':return <svg {...c}><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3Z"/></svg>
    case 'piggy':return <svg {...c}><path d="M5 11a7 7 0 0 1 13 3v3h-3v2H8v-2H6v-2H4v-4h2Z"/><path d="M18 12h3v3h-3M8 10h.01M15 9V6l2-1"/></svg>
    case 'bank':return <svg {...c}><path d="M3 9h18L12 4 3 9Z"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/></svg>
    case 'coin':return <svg {...c}><circle cx="12" cy="12" r="8"/><path d="M12 7v10M9 9h4a2 2 0 0 1 0 4H11a2 2 0 0 0 0 4h4"/></svg>
    case 'chart':return <svg {...c}><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-6"/></svg>
    case 'shirt':return <svg {...c}><path d="m8 4 4 2 4-2 5 4-3 4-2-2v10H8V10l-2 2-3-4 5-4Z"/></svg>
    case 'grocery':return <svg {...c}><path d="M5 9h14l-1 11H6L5 9Z"/><path d="M8 9a4 4 0 0 1 8 0M9 13h6"/></svg>
    case 'medicine':return <svg {...c}><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg>
    case 'dentist':return <svg {...c}><path d="M8 4c1.5-1 2.5 1 4 0 1.5 1 2.5-1 4 0 2 1.3 1 5.5 0 8.5-.8 2.3-1.5 5-3 5-1.5 0-1.2-5-2-5s-.5 5-2 5-2.2-2.7-3-5C5 9.5 4 5.3 6 4c.7-.5 1.3-.6 2 0Z"/></svg>
    case 'baby':return <svg {...c}><circle cx="12" cy="9" r="5"/><path d="M8 16c1 3 7 3 8 0M9 8h.01M15 8h.01"/></svg>
    case 'pet':return <svg {...c}><circle cx="12" cy="13" r="5"/><circle cx="7" cy="8" r="2"/><circle cx="17" cy="8" r="2"/><circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/></svg>
    case 'fuel':return <svg {...c}><path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 9h11M16 7h2l3 3v7a2 2 0 0 1-4 0v-4h4"/></svg>
    case 'parking':return <svg {...c}><circle cx="12" cy="12" r="9"/><path d="M10 17V7h3a3 3 0 0 1 0 6h-3"/></svg>
    case 'train':return <svg {...c}><rect x="5" y="3" width="14" height="15" rx="3"/><path d="M5 11h14M9 18l-2 3M15 18l2 3M9 7h.01M15 7h.01"/></svg>
    case 'motorcycle':return <svg {...c}><circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/><path d="M7 17l3-7h4l3 7M10 10l-2-2h3M14 10h3l2 3"/></svg>
    case 'bike':return <svg {...c}><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-8h4l4 8M10 9l-2-3M14 9l2-3"/></svg>
    case 'restaurant':return <svg {...c}><path d="M7 3v8M4 3v4a3 3 0 0 0 6 0V3M7 10v11M17 3v18M17 3c3 2 3 6 0 8"/></svg>
    case 'pizza':return <svg {...c}><path d="m4 4 16 5-11 11L4 4Z"/><circle cx="10" cy="10" r="1"/><circle cx="14" cy="13" r="1"/></svg>
    case 'hotel':return <svg {...c}><path d="M4 19V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13M4 13h16M8 13V9h4v4M3 19h18"/></svg>
    case 'map':return <svg {...c}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/></svg>
    case 'camera':return <svg {...c}><path d="M4 7h4l2-2h4l2 2h4v12H4V7Z"/><circle cx="12" cy="13" r="4"/></svg>
    case 'headphones':return <svg {...c}><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14v4h3v-6H5M20 14v4h-3v-6h2"/></svg>
    case 'tv':return <svg {...c}><rect x="3" y="5" width="18" height="13" rx="2"/><path d="m9 2 3 3 3-3"/></svg>
    case 'game':return <svg {...c}><path d="M7 8h10a5 5 0 0 1 4 8l-2 3h-3l-2-3H10l-2 3H5l-2-3a5 5 0 0 1 4-8Z"/><path d="M8 11v4M6 13h4M16 12h.01M19 14h.01"/></svg>
    case 'ticket':return <svg {...c}><path d="M4 7a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4h16v-4a2 2 0 0 0 0-4V7H4Z"/><path d="M12 7v10"/></svg>
    case 'party':return <svg {...c}><path d="M4 20 11 5l9 15H4Z"/><path d="M11 5V2M8 10l-3-2M14 10l3-2"/></svg>
    case 'school':return <svg {...c}><path d="m3 10 9-5 9 5-9 5-9-5Z"/><path d="M7 12v5c3 2 7 2 10 0v-5M21 10v6"/></svg>
    case 'laptop':return <svg {...c}><rect x="5" y="4" width="14" height="12" rx="1"/><path d="M3 19h18M9 19l1-2h4l1 2"/></svg>
    case 'tools':return <svg {...c}><path d="m14 7 3-3 3 3-3 3M4 20l8-8M10 5a4 4 0 0 0 5 5"/></svg>
    case 'hammer':return <svg {...c}><path d="m14 4 6 6-3 3-6-6M4 20l8-8M7 3l5 3-3 3-5-3 3-3Z"/></svg>
    case 'leaf':return <svg {...c}><path d="M20 4C10 4 4 9 4 16c0 2 1 4 3 4 7 0 13-6 13-16Z"/><path d="M4 20c3-5 7-8 12-10"/></svg>
    case 'sun':return <svg {...c}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    case 'calendar':return <svg {...c}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
    case 'lock':return <svg {...c}><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
    case 'document':return <svg {...c}><path d="M6 3h9l3 3v15H6V3Z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>
    case 'percent':return <svg {...c}><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/><path d="m6 18 12-12"/></svg>
    case 'plus':return <svg {...c}><path d="M12 5v14M5 12h14"/></svg>
    case 'user':return <svg {...c}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
    case 'star':return <svg {...c}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/></svg>
    default:return <svg {...c}><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>
  }
}

function formatMoney(value:number){return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Math.round(value||0))}
function formatInput(value:string){const digits=value.replace(/\D/g,'');return digits?new Intl.NumberFormat('es-CO',{maximumFractionDigits:0}).format(Number(digits)):''}
function parseInput(value:string){return Number(value.replace(/\D/g,''))||0}
function load<T>(key:string,fallback:T):T{try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback}catch{return fallback}}
function save(key:string,value:unknown){localStorage.setItem(key,JSON.stringify(value))}
function localDateInputValue(date=new Date()){const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,'0');const d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
function movementDateLabel(value:string){return new Date(`${value.slice(0,10)}T12:00:00`).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}
function userKey(userId:string,key:string){return `budgy_${userId}_${key}`}
function normalizeEmail(email:string){return email.trim().toLowerCase()}
function isPendingType(type:MovementType){return type==='receivable'||type==='payable'}
function categoryTypeForMovement(type:MovementType):CategoryType{return type==='income'||type==='receivable'?'income':'expense'}
function categorySideForPending(type:MovementType,nature:PendingNature):CategoryType{if(type==='receivable')return nature==='loaned'?'expense':'income';if(type==='payable')return nature==='borrowed'?'income':'expense';return type==='income'?'income':'expense'}
function pendingNatureLabel(type:MovementType,nature?:PendingNature){if(type==='receivable')return nature==='loaned'?'Presté dinero · salida hoy':'Dinero por cobrar · entra al cobrar';if(type==='payable')return nature==='borrowed'?'Recibí dinero prestado · entra hoy':'Deuda pendiente · salida al pagar';return movementTypeLabel(type)}
function movementTypeLabel(type:MovementType){return type==='income'?'Ingreso':type==='expense'?'Gasto':type==='transfer'?'Transferencia':type==='receivable'?'Cuenta por cobrar':'Cuenta por pagar'}
function movementStatusLabel(type:MovementType){return type==='receivable'?'Pendiente por cobrar':type==='payable'?'Pendiente por pagar':movementTypeLabel(type)}
function formatCompactMoney(value:number){const n=Math.round(value||0);if(Math.abs(n)>=1000000)return `$ ${(n/1000000).toFixed(1).replace('.0','')} M`;if(Math.abs(n)>=1000)return `$ ${(n/1000).toFixed(0)} mil`;return formatMoney(n)}
function overspendTone(excess:number){
  if(excess<=5)return {bg:'#fffbea',border:'#eadf9b',text:'#7f6a11',accent:'#c9b34d'}
  if(excess<=15)return {bg:'#fff6e5',border:'#efd2a0',text:'#8f5a18',accent:'#d99b45'}
  if(excess<=30)return {bg:'#fff0df',border:'#efc097',text:'#9a531e',accent:'#e38b45'}
  if(excess<=60)return {bg:'#ffe9e2',border:'#edb6a8',text:'#98463a',accent:'#db7865'}
  return {bg:'#f9e6ea',border:'#e1b1ba',text:'#8b3e4c',accent:'#c86b7b'}
}


function App(){
  const [page,setPage]=useState<'home'|'accounts'|'budget'|'movements'|'calendar'|'settings'>('home')
  const [loading,setLoading]=useState(true)
  const [currentUser,setCurrentUser]=useState<User|null>(()=>load('budgy_session',null))
  const [accounts,setAccounts]=useState<Account[]>([])
  const [categories,setCategories]=useState<Category[]>([])
  const [subcategories,setSubcategories]=useState<Subcategory[]>([])
  const [movements,setMovements]=useState<Movement[]>([])
  const [theme,setTheme]=useState<Theme>(defaultTheme)
  const [toast,setToast]=useState('')
  const [dataReady,setDataReady]=useState(false)

  useEffect(()=>{const t=window.setTimeout(()=>setLoading(false),900);return()=>window.clearTimeout(t)},[])

  useEffect(()=>{
    if(!currentUser){setDataReady(false);return}
    setDataReady(false)
    setAccounts(load(userKey(currentUser.id,'accounts'),[]))
    setCategories(load(userKey(currentUser.id,'categories'),[]).map((c:any,i:number)=>({...c,color:c.color||categoryColors[i%categoryColors.length]})))
    setSubcategories(load(userKey(currentUser.id,'subcategories'),[]).map((s:any)=>({...s,amount:Number(s.amount)||0,reminderEnabled:Boolean(s.reminderEnabled),reminderDay:s.reminderDay??s.dueDay,reminderMonth:s.reminderMonth??new Date().getMonth()+1})))
    setMovements(load(userKey(currentUser.id,'movements'),[]))
    setTheme(load(userKey(currentUser.id,'theme'),defaultTheme))
    setPage('home')
    setDataReady(true)
  },[currentUser?.id])

  useEffect(()=>{if(currentUser&&dataReady)save(userKey(currentUser.id,'accounts'),accounts)},[accounts,currentUser?.id,dataReady])
  useEffect(()=>{if(currentUser&&dataReady)save(userKey(currentUser.id,'categories'),categories)},[categories,currentUser?.id,dataReady])
  useEffect(()=>{if(currentUser&&dataReady)save(userKey(currentUser.id,'subcategories'),subcategories)},[subcategories,currentUser?.id,dataReady])
  useEffect(()=>{if(currentUser&&dataReady)save(userKey(currentUser.id,'movements'),movements)},[movements,currentUser?.id,dataReady])
  useEffect(()=>{if(currentUser&&dataReady)save(userKey(currentUser.id,'theme'),theme)},[theme,currentUser?.id,dataReady])

  const showToast=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(''),2400)}
  const logout=()=>{save('budgy_session',null);setCurrentUser(null);setAccounts([]);setCategories([]);setSubcategories([]);setMovements([]);setDataReady(false);setPage('home')}

  const balances=useMemo(()=>{const r:Record<number,number>={};accounts.forEach(a=>r[a.id]=a.initialBalance);movements.forEach(m=>{if(r[m.accountId]===undefined)return;if(m.type==='income')r[m.accountId]+=m.amount;if(m.type==='expense')r[m.accountId]-=m.amount;if(m.type==='receivable'&&!m.settled&&((m.pendingNature||'loaned')==='loaned'))r[m.accountId]-=m.amount;if(m.type==='payable'&&!m.settled&&m.pendingNature==='borrowed')r[m.accountId]+=m.amount;if(m.type==='transfer'){r[m.accountId]-=m.amount;if(m.destinationAccountId&&r[m.destinationAccountId]!==undefined)r[m.destinationAccountId]+=m.amount}});return r},[accounts,movements])
  const month=localDateInputValue().slice(0,7);const monthMovements=movements.filter(m=>m.date.slice(0,7)===month);const income=monthMovements.filter(m=>m.type==='income').reduce((s,m)=>s+m.amount,0);const expenses=monthMovements.filter(m=>m.type==='expense').reduce((s,m)=>s+m.amount,0);const totalMoney=accounts.filter(a=>a.type!=='credit').reduce((s,a)=>s+(balances[a.id]||0),0);const categorySpent=(id:number)=>monthMovements.filter(m=>m.type==='expense'&&m.categoryId===id).reduce((s,m)=>s+m.amount,0)

  if(loading)return <Splash/>
  if(!currentUser)return <AuthScreen onLogin={setCurrentUser}/>

  const cssVars={
    '--green':theme.primary,
    '--green-dark':theme.primary,
    '--blue':theme.secondary,
    '--bg':theme.background
  } as CSSProperties

  const robotPreference:RobotPreference=currentUser.robotPreference||'classic'
  return <div className="app-shell" style={cssVars}>
    <header className="topbar"><div className="brand" onClick={()=>setPage('home')}><BudgyWordmark compact/></div><div className="topbar-actions"><div className="topbar-avatar">{(currentUser.name||'B').charAt(0).toUpperCase()}</div><button className="topbar-settings" onClick={()=>setPage('settings')} aria-label="Ajustes">⚙</button></div></header>
    <main className="content">
      {page==='home'&&<Home totalMoney={totalMoney} income={income} expenses={expenses} accounts={accounts} balances={balances} categories={categories} categorySpent={categorySpent} setPage={setPage} subcategories={subcategories} userName={currentUser.name} robotPreference={robotPreference} movements={monthMovements}/>} 
      {page==='accounts'&&<Accounts accounts={accounts} setAccounts={setAccounts} balances={balances} showToast={showToast}/>} 
      {page==='movements'&&<Movements accounts={accounts} categories={categories} subcategories={subcategories} setMovements={setMovements} setCategories={setCategories} setSubcategories={setSubcategories} movements={movements} showToast={showToast} setPage={setPage}/>} 
      {page==='budget'&&<BudgetPage categories={categories} setCategories={setCategories} subcategories={subcategories} setSubcategories={setSubcategories} categorySpent={categorySpent} showToast={showToast} movements={movements}/>} 
      {page==='calendar'&&<CalendarPage movements={movements}/>}
      {page==='settings'&&<Settings setPage={setPage} theme={theme} setTheme={setTheme} currentUser={currentUser} onLogout={logout}/>} 
    </main>
    <nav className="bottom-nav budgy-bottom-nav">
      <button className={page==='home'?'active':''} onClick={()=>setPage('home')}><span><Icon name="home" size={20}/></span>Inicio</button>
      <button className={page==='budget'?'active':''} onClick={()=>setPage('budget')}><span><Icon name="target" size={20}/></span>Presupuesto</button>
      <button className={page==='movements'?'active':''} onClick={()=>setPage('movements')}><span><Icon name="receipt" size={20}/></span>Movimientos</button>
      <button className={page==='calendar'?'active':''} onClick={()=>setPage('calendar')}><span><Icon name="calendar" size={20}/></span>Calendario</button>
      <button className={page==='settings'?'active':''} onClick={()=>setPage('settings')}><span><Icon name="spark" size={20}/></span>Más</button>
    </nav>
    {toast&&<div className="toast">✓ <span>{toast}</span></div>}
  </div>
}

function BudgyWordmark({compact=false}:{compact?:boolean}){
  return <span className={`budgy-wordmark${compact?' compact':''}`} aria-label="Budgy">Budg<span>y</span></span>
}

function AuthScreen({onLogin}:{onLogin:(user:User)=>void}){
  const [mode,setMode]=useState<'welcome'|'login'|'preference'|'register'>('welcome')
  const [robotChoice,setRobotChoice]=useState<RobotPreference>('classic')
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')

  const submit=()=>{
    const normalized=normalizeEmail(email)
    if(!normalized||!password){setError('Completa correo y contraseña.');return}
    const users=load<User[]>('budgy_users',[])
    if(mode==='register'){
      if(!name.trim()){setError('Escribe tu nombre.');return}
      if(users.some(u=>u.email===normalized)){setError('Este correo ya tiene una cuenta.');return}
      const user={id:`u_${Date.now()}`,name:name.trim(),email:normalized,password,robotPreference:robotChoice}
      save('budgy_users',[...users,user]);save('budgy_session',user);onLogin(user);return
    }
    const user=users.find(u=>u.email===normalized&&u.password===password)
    if(!user){setError('Correo o contraseña incorrectos.');return}
    if(!user.robotPreference) user.robotPreference='classic'
    save('budgy_session',user);onLogin(user)
  }

  if(mode==='welcome') return <div className="auth-screen welcome-screen">
    <div className="welcome-content">
      <img className="welcome-robot" src={robot} alt="Budgy"/>
      <BudgyWordmark/>
      <p>Tu finanzas, más simple</p>
      <div className="welcome-actions">
        <button className="auth-primary-button" onClick={()=>{setMode('preference');setError('')}}>Crear cuenta <span>→</span></button>
        <button className="auth-secondary-button" onClick={()=>{setMode('login');setError('')}}>Iniciar sesión</button>
      </div>
      <div className="onboarding-dots welcome-dots"><i className="active"/><i/><i/></div>
    </div>
  </div>

  if(mode==='preference') return <div className="auth-screen onboarding-screen">
    <div className="onboarding-content">
      <button className="onboarding-back" onClick={()=>setMode('welcome')} aria-label="Volver">‹</button>
      <div className="onboarding-dots"><i className="active"/><i/><i/></div>
      <button className="onboarding-skip" onClick={()=>{setRobotChoice('classic');setMode('register')}}>Omitir</button>
      <h1>¿Qué Budgy prefieres?</h1>
      <p>Elige el robot que más te guste.<br/>Podrás cambiarlo en cualquier momento desde los ajustes.</p>
      <div className="robot-choice-grid">
        <button className={`robot-choice ${robotChoice==='classic'?'selected':''}`} onClick={()=>setRobotChoice('classic')}>
          <span className="choice-check">{robotChoice==='classic'?'✓':''}</span>
          <img src={classicRobot} alt="Budgy clásico"/>
          <strong>Budgy</strong><small>Versión clásica</small>
        </button>
        <button className={`robot-choice ${robotChoice==='alternative'?'selected':''}`} onClick={()=>setRobotChoice('alternative')}>
          <span className="choice-check">{robotChoice==='alternative'?'✓':''}</span>
          <img src={femaleRobot} alt="Budgy alternativo"/>
          <strong>Budgy</strong><small>Versión alternativa</small>
        </button>
      </div>
      <button className="auth-primary-button onboarding-continue" onClick={()=>setMode('register')}>Continuar <span>→</span></button>
    </div>
  </div>

  if(mode==='register') return <div className="auth-screen auth-minimal">
    <div className="auth-content">
      <div className="auth-robot"><img src={robotChoice==='alternative'?femaleRobot:classicRobot} alt="Budgy"/></div>
      <h1>Crea tu cuenta</h1>
      <p>Tus datos quedarán asociados a tu cuenta.</p>
      <div className="auth-form">
        <input placeholder="Tu nombre" value={name} onChange={e=>setName(e.target.value)}/>
        <input type="email" placeholder="Correo electrónico" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit()}}/>
        {error&&<div className="auth-error">{error}</div>}
        <button className="auth-primary-button" onClick={submit}>Crear cuenta <span>→</span></button>
      </div>
      <button className="auth-switch-minimal" onClick={()=>{setMode('login');setError('')}}>¿Ya tienes cuenta? <b>Iniciar sesión</b></button>
    </div>
  </div>

  return <div className="auth-screen auth-minimal">
    <div className="auth-content">
      <div className="auth-robot auth-login-robot"><img src={loginRobot} alt="Budgy"/></div>
      <BudgyWordmark/>
      <h1>Inicia sesión para continuar</h1>
      <div className="auth-form">
        <input type="email" placeholder="Correo electrónico" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit()}}/>
        {error&&<div className="auth-error">{error}</div>}
        <button className="auth-primary-button" onClick={submit}>Iniciar sesión <span>→</span></button>
      </div>
      <button className="auth-switch-minimal" onClick={()=>{setMode('welcome');setError('')}}>¿No tienes cuenta? <b>Crear una</b></button>
    </div>
  </div>
}

function Splash(){return <div className="splash"><div className="splash-content"><img className="splash-robot" src={classicRobot} alt="Budgy robot"/><BudgyWordmark/><p className="splash-tagline">Tu finanzas, más simple</p></div></div>}

function Home({totalMoney,income,expenses,accounts,balances,categories,categorySpent,setPage,subcategories,userName,robotPreference,movements}:any){
  const expenseCats=categories.filter((c:Category)=>c.type==='expense')
  const totalBudget=expenseCats.reduce((s:number,c:Category)=>s+c.budget,0)
  const totalSpent=expenseCats.reduce((s:number,c:Category)=>s+categorySpent(c.id),0)
  const percent=totalBudget?Math.round(totalSpent/totalBudget*100):0
  const status=totalBudget<=0?'normal':percent>=100?'over':percent>=80?'warning':'normal'
  const robotImage=robotPreference==='alternative'?femaleRobot:classicRobot
  const statusTitle=status==='over'?'Has superado tu presupuesto':status==='warning'?'Estás cerca de tu límite':''
  const statusText=status==='over'?'Tus gastos exceden el límite de este mes. Revisa tus movimientos.':status==='warning'?`Has usado el ${percent}% de tu presupuesto este mes.`:''
  const statusClass=status==='over'?'home-status-over':status==='warning'?'home-status-warning':'home-status-normal'
  const recent=[...movements].sort((a:any,b:any)=>b.date.localeCompare(a.date)).slice(0,3)
  const shortcuts=[
    {icon:'chart',title:'Presupuesto',text:'Revisa tus categorías y límites',page:'budget'},
    {icon:'chart',title:'Analizar presupuesto',text:'Gráficos y estadísticas',page:'budget'},
    {icon:'plus',title:'Registrar movimiento',text:'Ingresa un gasto o ingreso',page:'movements'},
    {icon:'receipt',title:'Analizar movimientos',text:'Revisa tus transacciones',page:'movements'},
    {icon:'wallet',title:'Mis cuentas',text:'Administra tus cuentas',page:'accounts'},
    {icon:'calendar',title:'Calendario',text:'Visualiza tus fechas y movimientos',page:'calendar'}
  ]
  return <div className="page home-page">
    <section className="home-heading"><p>Hola, {userName || ''} 👋</p><h1>Este es tu dinero</h1></section>
    <section className={`home-finance-card ${statusClass}`}>
      {status!=='normal'&&<div className="home-status-copy"><span className="status-symbol">!</span><div><strong>{statusTitle}</strong><small>{statusText}</small></div></div>}
      <div className="home-money-label">Dinero disponible</div>
      <strong className={`home-money-value ${totalMoney<0?'negative-money':''}`}>{formatMoney(totalMoney)}</strong>
      <div className="home-robot-slot"><img src={robotImage} alt={`Budgy ${status}`} /></div>
      <div className="home-metrics"><div><span className="metric-icon income">↑</span><div><small>Ingresos</small><b className="positive">+{formatMoney(income)}</b></div></div><div><span className="metric-icon expense">↓</span><div><small>Gastos</small><b className="negative">-{formatMoney(expenses)}</b></div></div></div>
    </section>
    <section className="shortcut-section"><h2>¿Qué quieres hacer?</h2><div className="shortcut-grid">{shortcuts.map((s:any)=><button key={s.title} className="shortcut-card" onClick={()=>setPage(s.page)}><span className={`shortcut-icon shortcut-${s.icon}`}><Icon name={s.icon} size={24}/></span><span className="shortcut-copy"><strong>{s.title}</strong><small>{s.text}</small></span><span className="shortcut-arrow">›</span></button>)}</div></section>
    <section className="home-budget-card"><div className="home-card-title"><h2>Presupuesto del mes</h2><button onClick={()=>setPage('budget')}>Ver detalle <span>›</span></button></div><div className="home-progress-track"><i style={{width:`${Math.min(percent,100)}%`}}/></div><div className="home-budget-meta"><div><strong>{percent}% usado</strong><small>{formatMoney(totalSpent)} de {formatMoney(totalBudget)}</small></div><div className="home-budget-available"><small>Disponible</small><strong>{formatMoney(totalBudget-totalSpent)}</strong></div></div></section>
    <section className="home-recent-card"><div className="home-card-title"><h2>Movimientos recientes</h2><button onClick={()=>setPage('movements')}>Ver todos <span>›</span></button></div>{recent.length?recent.map((m:any)=><button className="recent-row" key={m.id} onClick={()=>setPage('movements')}><span className="recent-icon"><Icon name={m.type==='income'?'plus':m.type==='expense'?'receipt':'wallet'} size={18}/></span><span><strong>{m.description||'Movimiento'}</strong><small>{m.date}</small></span><b className={m.type==='income'?'positive':'negative'}>{m.type==='income'?'+':'-'}{formatMoney(m.amount)}</b><span className="recent-arrow">›</span></button>):<div className="home-empty">Aún no tienes movimientos.</div>}</section>
  </div>
}

function CalendarPage({movements}:any){
  const upcoming=[...movements].filter((m:any)=>m.dueDate).sort((a:any,b:any)=>(a.dueDate||'').localeCompare(b.dueDate||'')).slice(0,8)
  return <div className="page"><div className="page-heading"><h1>Calendario</h1><p>Visualiza tus fechas, vencimientos y movimientos programados.</p></div><div className="calendar-card"><div className="calendar-placeholder-head"><Icon name="calendar" size={24}/><strong>Próximas fechas</strong></div>{upcoming.length?upcoming.map((m:any)=><div className="calendar-line" key={m.id}><span>{m.dueDate}</span><strong>{m.description||'Movimiento'}</strong><b>{formatMoney(m.amount)}</b></div>):<div className="empty">Aún no tienes fechas programadas.</div>}</div></div>
}

function Accounts({accounts,setAccounts,balances,showToast}:any){const[name,setName]=useState('');const[type,setType]=useState<AccountType>('bank');const[initial,setInitial]=useState('');const[limit,setLimit]=useState('');const[cutoff,setCutoff]=useState('');const[payment,setPayment]=useState('');const add=()=>{if(!name.trim())return;setAccounts((p:Account[])=>[...p,{id:Date.now(),name:name.trim(),type,initialBalance:parseInput(initial),creditLimit:parseInput(limit)||undefined,cutoffDay:Number(cutoff)||undefined,paymentDay:Number(payment)||undefined}]);setName('');setInitial('');setLimit('');setCutoff('');setPayment('');showToast('Cuenta creada')};const remove=(id:number)=>{setAccounts((p:Account[])=>p.filter(x=>x.id!==id));showToast('Cuenta eliminada')};return <div className="page"><div className="page-heading"><h1>Mis cuentas</h1><p>Donde está tu dinero y tus recursos.</p></div><div className="form-card"><input placeholder="Nombre de la cuenta" value={name} onChange={e=>setName(e.target.value)}/><select value={type} onChange={e=>setType(e.target.value as AccountType)}><option value="bank">Cuenta bancaria</option><option value="cash">Efectivo</option><option value="credit">Tarjeta de crédito</option></select><MoneyInput value={initial} setValue={setInitial} placeholder="Saldo inicial"/>{type==='credit'&&<><MoneyInput value={limit} setValue={setLimit} placeholder="Cupo de crédito"/><div className="two-cols"><input type="number" min="1" max="31" placeholder="Día de corte" value={cutoff} onChange={e=>setCutoff(e.target.value)}/><input type="number" min="1" max="31" placeholder="Día de pago" value={payment} onChange={e=>setPayment(e.target.value)}/></div></>}<button className="primary-button" onClick={add}>+ Crear cuenta</button></div><div className="card-list">{accounts.map((a:Account)=><div className="account-card" key={a.id}><div className="mini-icon"><Icon name="wallet"/></div><div><strong>{a.name}</strong><small>{a.type==='credit'?`Tarjeta · corte ${a.cutoffDay||'-'} · pago ${a.paymentDay||'-'}`:a.type==='cash'?'Efectivo':'Cuenta bancaria'}</small></div><b>{formatMoney(balances[a.id]||0)}</b><button className="delete" onClick={()=>remove(a.id)}>×</button></div>)}</div></div>}

function MoneyInput({value,setValue,placeholder}:{value:string;setValue:(v:string)=>void;placeholder:string}){return <input inputMode="numeric" placeholder={placeholder} value={value} onChange={e=>setValue(formatInput(e.target.value))}/>}
const iconEmoji:Record<string,string>={
  utensils:'🍴',home:'🏠',car:'🚗',bus:'🚌',shopping:'🛍️',heart:'❤️',play:'🎮',bolt:'⚡',water:'💧',wifi:'📶',phone:'📱',book:'📚',plane:'✈️',dumbbell:'💪',gift:'🎁',briefcase:'💼',wallet:'👛',target:'🎯',receipt:'🧾',coffee:'☕',music:'🎵',piggy:'🐷',bank:'🏦',coin:'🪙',chart:'📈',shirt:'👕',grocery:'🛒',medicine:'💊',dentist:'🦷',baby:'👶',pet:'🐶',fuel:'⛽',parking:'🅿️',train:'🚇',motorcycle:'🏍️',bike:'🚲',restaurant:'🍽️',pizza:'🍕',hotel:'🏨',map:'🗺️',camera:'📷',headphones:'🎧',tv:'📺',game:'🎮',ticket:'🎟️',party:'🥳',school:'🏫',laptop:'💻',tools:'🛠️',hammer:'🔨',leaf:'🌿',sun:'☀️',calendar:'📅',lock:'🔒',document:'📄',percent:'％',plus:'➕',user:'👤',star:'⭐',spark:'✨'
}

function IconPicker({value,onChange}:{value:string;onChange:(v:string)=>void}){const[q,setQ]=useState('');const filtered=iconCatalog.filter(x=>`${x[1]} ${x[2]}`.toLowerCase().includes(q.toLowerCase()));return <div className="icon-picker emoji-picker"><div className="icon-search"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Busca un icono: comida, viaje, salud..."/></div><div className="icon-options emoji-options">{filtered.map(([key,label])=><button type="button" key={key} className={value===key?'selected':''} onClick={()=>onChange(key)}><span className="emoji-icon">{iconEmoji[key]||'✨'}</span><span>{label}</span></button>)}</div></div>}

function CategoryForm({type,initial,onSave,onCancel}:{type:CategoryType;initial?:Partial<Category>;onSave:(c:Category)=>void;onCancel:()=>void}){const[name,setName]=useState(initial?.name||'');const[icon,setIcon]=useState(initial?.icon||'spark');const[budget,setBudget]=useState(initial?.budget?formatInput(String(initial.budget)):'');const[color,setColor]=useState(initial?.color||categoryColors[0]);return <div className="modal-card"><h2>{initial?.id?'Editar categoría':'Nueva categoría'}</h2><input placeholder="Nombre de la categoría" value={name} onChange={e=>setName(e.target.value)} autoFocus/><label className="field-label">Icono</label><IconPicker value={icon} onChange={setIcon}/><label className="field-label">{type==='expense'?'Presupuesto mensual de gasto':'Presupuesto de ingreso'}</label><MoneyInput value={budget} setValue={setBudget} placeholder="$ 0"/><label className="field-label">Color</label><div className="color-options">{categoryColors.map(c=><button type="button" key={c} className={color===c?'color-selected':''} style={{background:c}} onClick={()=>setColor(c)} aria-label={c}/>)}</div><div className="modal-actions"><button className="secondary-button" onClick={onCancel}>Cancelar</button><button className="primary-button" onClick={()=>name.trim()&&onSave({id:initial?.id||Date.now(),name:name.trim(),type,icon,budget:parseInput(budget),color})}>{initial?.id?'Guardar cambios':'Crear categoría'}</button></div></div>}

function Categories({categories,setCategories,subcategories,setSubcategories,categorySpent,showToast,setPage,movements}:any){
  const [show,setShow]=useState(false)
  const [editing,setEditing]=useState<Category|undefined>()
  const [type,setType]=useState<CategoryType>('expense')
  const [expanded,setExpanded]=useState<number[]>([])
  const [conceptName,setConceptName]=useState('')
  const [conceptAmount,setConceptAmount]=useState('')
  const [reminderEnabled,setReminderEnabled]=useState(false)
  const [reminderDay,setReminderDay]=useState('')
  const [reminderMonth,setReminderMonth]=useState(String(new Date().getMonth()+1))
  const [reminderDays,setReminderDays]=useState('3')

  const resetConcept=()=>{setConceptName('');setConceptAmount('');setReminderEnabled(false);setReminderDay('');setReminderMonth(String(new Date().getMonth()+1));setReminderDays('3')}
  const toggleExpanded=(id:number)=>setExpanded(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])
  const monthNames=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  const saveCategory=(c:Category)=>{
    const clean={...c,budget:Math.max(0,Number(c.budget)||0)}
    const planned=subcategories.filter((s:Subcategory)=>s.categoryId===clean.id).reduce((sum,s)=>sum+s.amount,0)
    if(planned>clean.budget){showToast(`El presupuesto de ${clean.name} no puede ser menor que sus conceptos configurados: ${formatMoney(planned)}`);return}
    setCategories((p:Category[])=>p.some(x=>x.id===clean.id)?p.map(x=>x.id===clean.id?clean:x):[...p,clean])
    setShow(false);setEditing(undefined);showToast('Categoría guardada')
  }

  const addConcept=(categoryId:number)=>{
    if(!conceptName.trim()){showToast('Escribe el nombre del concepto');return}
    if(reminderEnabled&&!reminderDay){showToast('Completa el día del recordatorio');return}
    const cat=categories.find((c:Category)=>c.id===categoryId)
    const conceptValue=parseInput(conceptAmount)
    const planned=subcategories.filter((s:Subcategory)=>s.categoryId===categoryId).reduce((sum,s)=>sum+s.amount,0)
    if(cat&&planned+conceptValue>cat.budget){showToast(`Los conceptos de ${cat.name} no pueden superar su presupuesto. Disponible para conceptos: ${formatMoney(Math.max(cat.budget-planned,0))}`);return}
    setSubcategories((p:Subcategory[])=>[...p,{id:Date.now(),categoryId,name:conceptName.trim(),amount:conceptValue,reminderEnabled,reminderDay:reminderEnabled?Number(reminderDay):undefined,reminderMonth:reminderEnabled?Number(reminderMonth):undefined,reminderDays:reminderEnabled?Number(reminderDays):undefined}])
    resetConcept();showToast('Concepto agregado')
  }
  const deleteConcept=(id:number)=>{setSubcategories((p:Subcategory[])=>p.filter(s=>s.id!==id));showToast('Concepto eliminado')}
  const deleteCategory=(id:number)=>{setCategories((p:Category[])=>p.filter(c=>c.id!==id));setSubcategories((p:Subcategory[])=>p.filter(s=>s.categoryId!==id));showToast('Categoría eliminada')}

  return <div className="page">
    <div className="page-heading"><h1>Presupuesto</h1><p>Configura cada presupuesto y despliega solo el detalle que necesites.</p></div>
    <div className="split-buttons">
      <button className="primary-button" onClick={()=>{setType('expense');setEditing(undefined);setShow(true)}}>+ Presupuesto de gasto</button>
      <button className="secondary-button" onClick={()=>{setType('income');setEditing(undefined);setShow(true)}}>+ Presupuesto de ingreso</button>
    </div>

    <div className="category-management">
      {categories.map((c:Category)=>{
        const subs=subcategories.filter((s:Subcategory)=>s.categoryId===c.id)
        const spent=c.type==='expense'?categorySpent(c.id):0
        const available=Math.max(c.budget-spent,0)
        const p=c.budget?Math.round(spent/c.budget*100):0
        const excess=Math.max(0,Math.round((spent-c.budget)/Math.max(c.budget,1)*100))
        const open=expanded.includes(c.id)
        const tone=overspendTone(excess)
        return <div className={`management-card ${open?'management-expanded':''}`} key={c.id}>
          <button className="management-toggle" type="button" onClick={()=>toggleExpanded(c.id)} aria-expanded={open}>
            <div className="category-icon" style={{color:c.color,background:`${c.color}12`}}><Icon name={c.icon}/></div>
            <div className="management-title"><strong>{c.name}</strong><small>{c.type==='expense'?`Presupuesto ${formatMoney(c.budget)}`:'Presupuesto de ingreso'} · {subs.length} concepto{subs.length===1?'':'s'}</small></div>
            <div className="management-preview">{c.type==='expense'?<><strong>{formatMoney(spent)}</strong><small>{p<=100?`${p}% usado`: `Superado ${excess}%`}</small></>:<><strong>{formatMoney(c.budget)}</strong><small>Presupuesto de ingreso</small></>}</div>
            <span className="expand-chevron">{open?'⌃':'⌄'}</span>
          </button>

          {open&&<div className="management-body">
            <div className="management-actions"><button className="text-button" onClick={()=>{setEditing(c);setType(c.type);setShow(true)}}>Editar presupuesto</button><button className="delete-link" onClick={()=>deleteCategory(c.id)}>Eliminar</button></div>
            {c.type==='expense'&&<>
              <div className="budget-line"><span>{formatMoney(spent)} gastado</span><span>{p>100?`Superado ${excess}% · ${formatMoney(spent-c.budget)}`:`${formatMoney(available)} disponible`}</span></div>
              <div className="progress" style={p>100?{background:tone.bg}:{}}><i style={{width:`${Math.min(p,100)}%`,background:p>100?tone.accent:c.color}}/></div>
              {p>100&&<div className="over-budget-badge" style={{background:tone.bg,border:`1px solid ${tone.border}`,color:tone.text}}><span style={{background:tone.accent}}>↑</span> Superado {excess}%</div>}
            </>}

            <div className="concepts">
              <div className="concept-header"><strong>Conceptos</strong><button className="text-button" onClick={()=>{setExpanded(x=>x.includes(c.id)?x:x.concat(c.id));resetConcept()}}>+ Agregar concepto</button></div>
              {subs.length===0&&<small className="muted">Ej. Luz, Agua, Internet, Restaurante...</small>}
              {subs.map((sub:Subcategory)=><div className="concept-row" key={sub.id}>
                <div className="concept-dot" style={{background:c.color}}/>
                <div><strong>{sub.name}</strong><small>Presupuestado {formatMoney(sub.amount)} · {c.type==='expense'?'Gastado':'Ingresado'} {formatMoney(c.type==='expense'?movements.filter((m:Movement)=>m.type==='expense'&&m.subcategoryId===sub.id).reduce((sum,m)=>sum+m.amount,0):movements.filter((m:Movement)=>m.type==='income'&&m.subcategoryId===sub.id).reduce((sum,m)=>sum+m.amount,0))}{sub.reminderEnabled?` · ${sub.reminderDay} de ${monthNames[(sub.reminderMonth||1)-1]} · avisar ${sub.reminderDays} días antes`:''}</small></div>
                <button className="delete-link" onClick={()=>deleteConcept(sub.id)}>Eliminar</button>
              </div>)}

              <div className="concept-form-inline">
                <input placeholder="Nombre del concepto" value={conceptName} onChange={e=>setConceptName(e.target.value)}/>
                <MoneyInput value={conceptAmount} setValue={setConceptAmount} placeholder="Valor presupuestado"/>
                <small className="concept-budget-hint">La suma de los valores de los conceptos no puede superar el presupuesto de esta categoría. Los movimientos reales sí pueden superarlo.</small>
                <label className="check-row"><input type="checkbox" checked={reminderEnabled} onChange={e=>setReminderEnabled(e.target.checked)}/> Activar recordatorio</label>
                {reminderEnabled&&<>
                  <div className="reminder-hint">Selecciona la fecha en la que quieres recordar este concepto.</div>
                  <div className="two-cols"><input type="number" min="1" max="31" placeholder="Día (ej. 15)" value={reminderDay} onChange={e=>setReminderDay(e.target.value)}/><select value={reminderMonth} onChange={e=>setReminderMonth(e.target.value)}>{monthNames.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select></div>
                  <div className="two-cols"><input type="number" min="0" max="30" placeholder="Avisar días antes" value={reminderDays} onChange={e=>setReminderDays(e.target.value)}/><div className="date-preview">📅 {reminderDay||'--'} de {monthNames[Number(reminderMonth)-1]}</div></div>
                </>}
                <div className="modal-actions compact-actions"><button className="secondary-button" onClick={resetConcept}>Limpiar</button><button className="primary-button" onClick={()=>addConcept(c.id)}>+ Guardar concepto</button></div>
              </div>
            </div>
          </div>}
        </div>
      })}
    </div>
    {!categories.length&&<div className="empty">Todavía no tienes categorías.</div>}
    <ReminderCalendar subcategories={subcategories} categories={categories} movements={movements} />
    {show&&<div className="modal-backdrop"><CategoryForm type={type} initial={editing} onSave={saveCategory} onCancel={()=>{setShow(false);setEditing(undefined)}}/></div>}
  </div>
}

function ReminderCalendar({subcategories,categories,movements}:any){
  const reminders=[
    ...subcategories.filter((s:Subcategory)=>s.reminderEnabled&&s.reminderDay).map((s:Subcategory)=>({id:`s-${s.id}`,day:s.reminderDay as number,month:s.reminderMonth||1,year:new Date().getFullYear(),title:s.name,subtitle:categories.find((c:Category)=>c.id===s.categoryId)?.name||'Concepto',kind:'concept'})),
    ...movements.filter((m:Movement)=>isPendingType(m.type)&&m.dueDate&&m.reminderEnabled).map((m:Movement)=>({id:`m-${m.id}`,day:Number(m.dueDate!.slice(8,10)),month:Number(m.dueDate!.slice(5,7)),year:Number(m.dueDate!.slice(0,4)),title:movementStatusLabel(m.type),subtitle:m.description||'Movimiento pendiente',kind:'movement'}))
  ]
  const now=new Date()
  const [viewMonth,setViewMonth]=useState(now.getMonth()+1)
  const [viewYear,setViewYear]=useState(now.getFullYear())
  const [expanded,setExpanded]=useState(false)
  const monthNames=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const weekdays=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
  const daysInMonth=new Date(viewYear,viewMonth,0).getDate()
  const firstDay=(new Date(viewYear,viewMonth-1,1).getDay()+6)%7
  const monthReminders=reminders.filter((r:any)=>r.month===viewMonth&&(r.year===viewYear||r.kind==='concept'))
  const reminderForDay=(day:number)=>monthReminders.filter((r:any)=>r.day===day)
  const moveMonth=(delta:number)=>{const d=new Date(viewYear,viewMonth-1+delta,1);setViewMonth(d.getMonth()+1);setViewYear(d.getFullYear())}
  const calendarCells=Array.from({length:firstDay+daysInMonth},(_,i)=>i<firstDay?null:i-firstDay+1)
  return <section className={`calendar-card ${expanded?'calendar-expanded':''}`}>
    <button className="calendar-toggle" type="button" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded}>
      <div className="calendar-title-wrap"><div className="calendar-icon"><Icon name="calendar" size={19}/></div><div><strong>Calendario de recordatorios</strong><span>Conceptos y movimientos pendientes</span></div></div><div className="calendar-toggle-right"><span className="calendar-count">{reminders.length}</span><span className="expand-chevron">{expanded?'⌃':'⌄'}</span></div>
    </button>
    {expanded&&<>
      <div className="calendar-toolbar"><button type="button" onClick={()=>moveMonth(-1)} aria-label="Mes anterior">‹</button><strong>{monthNames[viewMonth-1]} {viewYear}</strong><button type="button" onClick={()=>moveMonth(1)} aria-label="Mes siguiente">›</button></div>
      {!reminders.length?<div className="empty compact">Aún no tienes recordatorios configurados.</div>:<><div className="calendar-weekdays">{weekdays.map(d=><span key={d}>{d}</span>)}</div><div className="calendar-grid">{calendarCells.map((day,i)=>day===null?<div className="calendar-cell empty-cell" key={`empty-${i}`}/>:<div className={`calendar-cell ${reminderForDay(day).length?'has-reminder':''}`} key={day}><strong>{day}</strong>{reminderForDay(day).length>0&&<div className="calendar-dots">{reminderForDay(day).slice(0,3).map((r:any)=><span key={r.id} className={r.kind==='movement'?'movement-dot':''} title={`${r.title} · ${r.subtitle}`}/>)}</div>}</div>)}</div><div className="calendar-details">{monthReminders.length===0?<small>No hay recordatorios en este mes.</small>:[...monthReminders].sort((a:any,b:any)=>a.day-b.day).map((r:any)=><div className="calendar-item" key={r.id}><div className="calendar-day"><strong>{r.day}</strong><small>{monthNames[r.month-1].slice(0,3)}</small></div><div><strong>{r.title}</strong><small>{r.subtitle}{r.kind==='movement'?' · Recordatorio de vencimiento':''}</small></div></div>)}</div></>}
    </>}
  </section>
}

function MovementEditor({accounts,categories,subcategories,setMovements,setCategories,setSubcategories,showToast,setPage,initialMovement,onClose}:any){
  const [type,setType]=useState<MovementType>(initialMovement?.type||'expense')
  const [pendingNature,setPendingNature]=useState<PendingNature>(initialMovement?.pendingNature|| (initialMovement?.type==='payable'?'owed':'loaned'))
  const [description,setDescription]=useState(initialMovement?.description||'')
  const [amount,setAmount]=useState(initialMovement?.amount?formatInput(String(initialMovement.amount)):'')
  const [accountId,setAccountId]=useState(initialMovement?.accountId||0)
  const [categoryId,setCategoryId]=useState(initialMovement?.categoryId||0)
  const [subcategoryId,setSubcategoryId]=useState(initialMovement?.subcategoryId||0)
  const [destination,setDestination]=useState(initialMovement?.destinationAccountId||0)
  const [movementDate,setMovementDate]=useState(initialMovement?.date?.slice(0,10)||localDateInputValue())
  const [interestRate,setInterestRate]=useState(initialMovement?.interestRate?String(initialMovement.interestRate):'')
  const [dueDate,setDueDate]=useState(initialMovement?.dueDate||localDateInputValue(new Date(Date.now()+7*86400000)))
  const [reminderEnabled,setReminderEnabled]=useState(Boolean(initialMovement?.reminderEnabled))
  const [reminderDays,setReminderDays]=useState(initialMovement?.reminderDays!=null?String(initialMovement.reminderDays):'3')
  const [showCategory,setShowCategory]=useState(false)
  const [showConcept,setShowConcept]=useState(false)
  const [newCatName,setNewCatName]=useState('')
  const [newCatIcon,setNewCatIcon]=useState('spark')
  const [newCatBudget,setNewCatBudget]=useState('')
  const [newConceptName,setNewConceptName]=useState('')
  const [newConceptAmount,setNewConceptAmount]=useState('')

  const pending=isPendingType(type)
  const categorySide=type==='transfer'?( 'expense' as CategoryType):pending?categorySideForPending(type,pendingNature):categoryTypeForMovement(type)
  const availableCategories=categories.filter((c:Category)=>type!=='transfer'&&c.type===categorySide)
  const subs=subcategories.filter((s:Subcategory)=>s.categoryId===categoryId)

  const resetMovementForm=()=>{setType('expense');setPendingNature('loaned');setDescription('');setAmount('');setAccountId(0);setCategoryId(0);setSubcategoryId(0);setDestination(0);setMovementDate(localDateInputValue());setInterestRate('');setDueDate(localDateInputValue(new Date(Date.now()+7*86400000)));setReminderEnabled(false);setReminderDays('3');setShowCategory(false);setShowConcept(false);setNewCatName('');setNewCatIcon('spark');setNewCatBudget('');setNewConceptName('');setNewConceptAmount('')}

  useEffect(()=>{
    if(type==='receivable'&&!['loaned','expected'].includes(pendingNature))setPendingNature('loaned')
    if(type==='payable'&&!['owed','borrowed'].includes(pendingNature))setPendingNature('owed')
    if(type==='transfer'){setCategoryId(0);setSubcategoryId(0)}
    else if(categoryId&&!categories.some((c:Category)=>c.id===categoryId&&c.type===categorySide)){setCategoryId(0);setSubcategoryId(0)}
  },[type,pendingNature,categorySide])

  const addQuickCategory=()=>{
    if(!newCatName.trim()){showToast('Escribe el nombre de la categoría');return}
    const c:Category={id:Date.now(),name:newCatName.trim(),type:categorySide,icon:newCatIcon,budget:categorySide==='expense'?parseInput(newCatBudget):0,color:categoryColors[0]}
    setCategories((p:Category[])=>[...p,c]);setCategoryId(c.id);setSubcategoryId(0);setShowCategory(false);setNewCatName('');setNewCatIcon('spark');setNewCatBudget('');showToast('Categoría creada y seleccionada')
  }

  const addQuickConcept=()=>{
    if(type==='transfer'||!categoryId)return
    if(!newConceptName.trim()){showToast('Escribe el nombre del concepto');return}
    const value=parseInput(newConceptAmount)
    const cat=categories.find((c:Category)=>c.id===categoryId)
    const planned=subcategories.filter((s:Subcategory)=>s.categoryId===categoryId).reduce((sum,s)=>sum+s.amount,0)
    if(cat&&cat.type==='expense'&&planned+value>cat.budget){showToast(`Los conceptos de ${cat.name} no pueden superar su presupuesto. Disponible: ${formatMoney(Math.max(cat.budget-planned,0))}`);return}
    const s:Subcategory={id:Date.now()+1,categoryId,name:newConceptName.trim(),amount:value,reminderEnabled:false}
    setSubcategories((p:Subcategory[])=>[...p,s]);setSubcategoryId(s.id);setShowConcept(false);setNewConceptName('');setNewConceptAmount('');showToast('Concepto creado y seleccionado')
  }

  const saveMovement=()=>{
    const value=parseInput(amount)
    if(!value||!accountId){showToast('Completa cuenta y valor');return}
    if(type!=='transfer'&&!categoryId){showToast('Selecciona una categoría');return}
    if(type!=='transfer'&&!subcategoryId){showToast('Selecciona un concepto. Todos los movimientos deben quedar agrupados por concepto.');return}
    if(type==='transfer'&&!destination){showToast('Selecciona una cuenta destino');return}
    if(pending&&!dueDate){showToast('Selecciona la fecha de vencimiento');return}
    const rate=Math.max(0,Number(interestRate)||0)
    const interestAmount=pending?Math.round(value*rate/100):undefined
    const m:Movement={id:initialMovement?.id||Date.now(),type,amount:value,description:description.trim()||(type==='expense'?'Gasto':type==='income'?'Ingreso':type==='transfer'?'Transferencia':type==='receivable'?'Cuenta por cobrar':'Cuenta por pagar'),date:`${movementDate}T12:00:00`,accountId,categoryId:type==='transfer'?undefined:categoryId,subcategoryId:type==='transfer'?undefined:subcategoryId,destinationAccountId:type==='transfer'?destination:undefined,interestRate:pending?rate||undefined:undefined,interestAmount:pending?interestAmount:undefined,dueDate:pending?dueDate:undefined,reminderEnabled:pending?reminderEnabled:undefined,reminderDays:pending&&reminderEnabled?(Number(reminderDays)||0):undefined,settled:initialMovement?.settled, pendingNature:pending?pendingNature:undefined,settlementMovementId:initialMovement?.settlementMovementId,originPendingId:initialMovement?.originPendingId}
    setMovements((p:Movement[])=>initialMovement?p.map(x=>x.id===m.id?m:x):[m,...p])
    showToast(initialMovement?'Movimiento actualizado':type==='expense'?'Gasto registrado correctamente':type==='income'?'Ingreso registrado correctamente':type==='transfer'?'Transferencia registrada correctamente':type==='receivable'?'Cuenta por cobrar registrada':'Cuenta por pagar registrada')
    if(initialMovement){onClose?.()}else{resetMovementForm()}
  }

  const chooseDue=(days:number)=>setDueDate(localDateInputValue(new Date(Date.now()+days*86400000)))

  return <div className={initialMovement?'modal-card movement-editor-modal':'movement-editor-shell'}>
    {initialMovement&&<div className="modal-head-row"><div><span className="eyebrow">Editar</span><h2>Editar movimiento</h2></div><button className="icon-close" onClick={onClose}>×</button></div>}
    <div className="movement-type-select"><label className="field-label">Tipo de movimiento</label><select value={type} onChange={e=>setType(e.target.value as MovementType)}><option value="income">Ingreso</option><option value="expense">Gasto</option><option value="transfer">Transferencia</option><option value="receivable">Cuenta por cobrar</option><option value="payable">Cuenta por pagar</option></select></div>
    {type==='receivable'&&<div className="pending-nature-fields"><label className="field-label">Escenario</label><select value={pendingNature} onChange={e=>{setPendingNature(e.target.value as PendingNature);setCategoryId(0);setSubcategoryId(0)}}><option value="loaned">Presté dinero · sale hoy y queda por cobrar</option><option value="expected">Tengo un dinero por cobrar · entra al cobrar</option></select><small className="pending-nature-hint">Elige cómo ocurrió la operación. Si prestaste dinero, Budgy lo descuenta de tu cuenta. Al cobrarlo, el cruce generará el ingreso real.</small></div>}
    {type==='payable'&&<div className="pending-nature-fields"><label className="field-label">Escenario</label><select value={pendingNature} onChange={e=>{setPendingNature(e.target.value as PendingNature);setCategoryId(0);setSubcategoryId(0)}}><option value="owed">Tengo una deuda · saldrá de mi cuenta al pagar</option><option value="borrowed">Recibí dinero prestado · entra hoy y queda por pagar</option></select><small className="pending-nature-hint">Una deuda pendiente no se trata como gasto hasta que la pagues. Si recibiste un préstamo, el dinero entra hoy y la deuda queda pendiente.</small></div>}
    <div className="form-card movement-form-card">
      <input placeholder={pending?(type==='receivable'?'Descripción, por ejemplo: préstamo a Juan':'Descripción, por ejemplo: cuota pendiente'): 'Descripción, por ejemplo: Almuerzo'} value={description} onChange={e=>setDescription(e.target.value)}/>
      <MoneyInput value={amount} setValue={setAmount} placeholder="Valor"/>
      <select value={accountId} onChange={e=>setAccountId(Number(e.target.value))}><option value={0}>Selecciona una cuenta</option>{accounts.map((a:Account)=><option key={a.id} value={a.id}>{a.name}</option>)}</select>

      <div className="movement-date-field"><label>Fecha del movimiento</label><input type="date" value={movementDate} onChange={e=>setMovementDate(e.target.value)}/><div className="date-quick"><button type="button" className={movementDate===localDateInputValue()?'active':''} onClick={()=>setMovementDate(localDateInputValue())}>Hoy</button><button type="button" className={movementDate===localDateInputValue(new Date(Date.now()-86400000))?'active':''} onClick={()=>setMovementDate(localDateInputValue(new Date(Date.now()-86400000)))}>Ayer</button><button type="button" className={movementDate===localDateInputValue(new Date(Date.now()-172800000))?'active':''} onClick={()=>setMovementDate(localDateInputValue(new Date(Date.now()-172800000)))}>Anteayer</button></div></div>

      {type!=='transfer'&&<>
        {pending&&<small className="pending-category-note">{pendingNatureLabel(type,pendingNature)}. Este pendiente se muestra aparte del presupuesto y solo afecta el saldo según el escenario seleccionado.</small>}
        <div className="select-with-action"><select value={categoryId} onChange={e=>{setCategoryId(Number(e.target.value));setSubcategoryId(0)}}><option value={0}>Selecciona una categoría</option>{availableCategories.map((c:Category)=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="button" onClick={()=>setShowCategory(true)}>＋</button></div>
        {categoryId>0&&<>
          <div className="select-with-action"><select value={subcategoryId} onChange={e=>setSubcategoryId(Number(e.target.value))}><option value={0}>Selecciona un concepto</option>{subs.map((s:Subcategory)=><option key={s.id} value={s.id}>{s.name}</option>)}</select><button type="button" onClick={()=>setShowConcept(true)}>＋</button></div>
          {subs.length===0&&<><small className="concept-required-note">Este movimiento debe quedar agrupado por concepto. Puedes crear el concepto ahora mismo.</small><button type="button" className="secondary-button" onClick={()=>setShowConcept(true)}>+ Crear concepto</button></>}
        </>}
      </>}

      {type==='transfer'&&<select value={destination} onChange={e=>setDestination(Number(e.target.value))}><option value={0}>Cuenta destino</option>{accounts.filter((a:Account)=>a.id!==accountId).map((a:Account)=><option key={a.id} value={a.id}>{a.name}</option>)}</select>}

      {pending&&<div className="pending-fields"><div className="pending-note"><Icon name={type==='receivable'?'coin':'document'} size={18}/><div><strong>{type==='receivable'?'Ingreso futuro estimado':'Pago futuro estimado'}</strong><small>{type==='receivable'?'El dinero prestado se descuenta del saldo de la cuenta y queda pendiente por cobrar.':'La deuda queda pendiente y no modifica el saldo hasta que la marques como pagada.'}</small></div></div><label className="field-label">Interés (%)</label><input inputMode="decimal" placeholder="Ej. 5" value={interestRate} onChange={e=>setInterestRate(e.target.value.replace(/[^0-9.,]/g,'').replace(',','.'))}/><div className="future-amount"><span>{type==='receivable'?'Total por cobrar':'Total por pagar'}</span><strong>{formatMoney(parseInput(amount)+Math.round(parseInput(amount)*(Number(interestRate)||0)/100))}</strong></div><label className="field-label">Fecha de vencimiento</label><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}/><div className="date-quick"><button type="button" onClick={()=>chooseDue(7)}>En 7 días</button><button type="button" onClick={()=>chooseDue(15)}>En 15 días</button><button type="button" onClick={()=>chooseDue(30)}>En 30 días</button></div><label className="check-row"><input type="checkbox" checked={reminderEnabled} onChange={e=>setReminderEnabled(e.target.checked)}/> Activar recordatorio de vencimiento</label>{reminderEnabled&&<div className="two-cols"><input type="number" min="0" max="30" placeholder="Avisar días antes" value={reminderDays} onChange={e=>setReminderDays(e.target.value)}/><div className="date-preview">📅 {movementDateLabel(`${dueDate}T12:00:00`)}</div></div>}</div>}

      <div className="modal-actions">{initialMovement&&<button className="secondary-button" type="button" onClick={onClose}>Cancelar</button>}<button className="primary-button big" type="button" onClick={saveMovement}>{initialMovement?'Guardar cambios':'Registrar movimiento'}</button></div>
    </div>

    {showCategory&&<div className="modal-backdrop nested-modal"><div className="modal-card"><h2>Nueva categoría</h2><p className="modal-note">Se creará y quedará seleccionada automáticamente.</p><input placeholder="Nombre" value={newCatName} onChange={e=>setNewCatName(e.target.value)} autoFocus/><label className="field-label">Icono</label><IconPicker value={newCatIcon} onChange={setNewCatIcon}/>{categorySide==='expense'&&<><label className="field-label">Presupuesto de la categoría</label><MoneyInput value={newCatBudget} setValue={setNewCatBudget} placeholder="$ 0"/></>}<div className="modal-actions"><button className="secondary-button" onClick={()=>setShowCategory(false)}>Cancelar</button><button className="primary-button" onClick={addQuickCategory}>Crear y seleccionar</button></div></div></div>}
    {showConcept&&<div className="modal-backdrop nested-modal"><div className="modal-card"><h2>Nuevo concepto</h2><p className="modal-note">Quedará asociado a la categoría seleccionada y se elegirá automáticamente.</p><input placeholder="Nombre del concepto" value={newConceptName} onChange={e=>setNewConceptName(e.target.value)} autoFocus/><MoneyInput value={newConceptAmount} setValue={setNewConceptAmount} placeholder="Valor presupuestado"/>{categoryId>0&&categories.find((c:Category)=>c.id===categoryId)?.type==='expense'&&<small className="concept-budget-hint">La suma de conceptos no puede superar el presupuesto de la categoría.</small>}<div className="modal-actions"><button className="secondary-button" onClick={()=>setShowConcept(false)}>Cancelar</button><button className="primary-button" onClick={addQuickConcept}>Crear concepto</button></div></div></div>}
  </div>
}

function Movements({accounts,categories,subcategories,setMovements,setCategories,setSubcategories,movements,showToast,setPage}:any){
  const [mode,setMode]=useState<'register'|'analyze'>('register')
  const [editing,setEditing]=useState<Movement|null>(null)
  const [filterMonth,setFilterMonth]=useState(localDateInputValue().slice(0,7))
  const [filterCategory,setFilterCategory]=useState(0)
  const [filterFrom,setFilterFrom]=useState('')
  const [filterTo,setFilterTo]=useState('')
  const [filterType,setFilterType]=useState<MovementType|'all'>('expense')

  const matchesFilters=(m:Movement)=>{
    if(filterType!=='all'&&m.type!==filterType)return false
    if(!filterFrom&&!filterTo&&filterMonth&&m.date.slice(0,7)!==filterMonth)return false
    if(filterCategory&&m.categoryId!==filterCategory)return false
    if(filterFrom&&m.date.slice(0,10)<filterFrom)return false
    if(filterTo&&m.date.slice(0,10)>filterTo)return false
    return true
  }
  const filtered=movements.filter(matchesFilters)
  const filteredExpenses=movements.filter((m:Movement)=>m.type==='expense'&&(!filterFrom&&!filterTo&&filterMonth?m.date.slice(0,7)===filterMonth:true)&&(!filterCategory||m.categoryId===filterCategory)&&(!filterFrom||m.date.slice(0,10)>=filterFrom)&&(!filterTo||m.date.slice(0,10)<=filterTo))
  const recentMonths=Array.from({length:12},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);return localDateInputValue(d).slice(0,7)})
  const total=filtered.reduce((s,m)=>s+m.amount,0)
  const dailyTotals=Object.entries(filteredExpenses.reduce((acc:Record<string,number>,m:Movement)=>{const key=m.date.slice(0,10);acc[key]=(acc[key]||0)+m.amount;return acc},{})).map(([key,value])=>({key,value:value as number})).sort((a,b)=>b.value-a.value).slice(0,6)
  const maxDaily=Math.max(...dailyTotals.map(d=>d.value),1)
  const pending=movements.filter((m:Movement)=>isPendingType(m.type)&&!m.settled&&(!filterFrom&&!filterTo&&filterMonth?m.date.slice(0,7)===filterMonth:true)&&(!filterFrom||m.date.slice(0,10)>=filterFrom)&&(!filterTo||m.date.slice(0,10)<=filterTo))
  const pendingReceivable=pending.filter(m=>m.type==='receivable').reduce((s,m)=>s+m.amount+(m.interestAmount||0),0)
  const pendingPayable=pending.filter(m=>m.type==='payable').reduce((s,m)=>s+m.amount+(m.interestAmount||0),0)
  const removeMovement=(id:number)=>{if(window.confirm('¿Quieres eliminar este movimiento?')){setMovements((p:Movement[])=>{const target=p.find(x=>x.id===id);if(target?.originPendingId){return p.filter(x=>x.id!==id).map(x=>x.id===target.originPendingId?{...x,settled:false,settlementMovementId:undefined}:x)}return p.filter(x=>x.id!==id && x.originPendingId!==id) });showToast('Movimiento eliminado')}}
  const settlePending=(m:Movement)=>{if(m.settled)return;const total=m.amount+(m.interestAmount||0);const actualType=m.type==='receivable'?'income':'expense';const settlementId=Date.now();const settlement:Movement={id:settlementId,type:actualType,amount:total,description:`${m.type==='receivable'?'Cobro':'Pago'}: ${m.description}`,date:`${localDateInputValue()}T12:00:00`,accountId:m.accountId,categoryId:m.categoryId,subcategoryId:m.subcategoryId,originPendingId:m.id};setMovements((p:Movement[])=>p.map(x=>x.id===m.id?{...x,settled:true,settlementMovementId:settlementId}:x).concat(settlement));showToast(m.type==='receivable'?'Cuenta por cobrar cobrada y cruzada':'Cuenta por pagar pagada y cruzada')}
  const unSettlePending=(m:Movement)=>{if(!m.settled)return;setMovements((p:Movement[])=>p.filter(x=>x.id!==m.settlementMovementId).map(x=>x.id===m.id?{...x,settled:false,settlementMovementId:undefined}:x));showToast('Cruce deshecho; el pendiente vuelve a quedar abierto')}

  const renderMovementRow=(m:Movement)=>{const c=categories.find((x:Category)=>x.id===m.categoryId);const s=subcategories.find((x:Subcategory)=>x.id===m.subcategoryId);const pendingType=isPendingType(m.type);const settled=m.settled||false;const sign=m.type==='expense'||m.type==='receivable'&&((m.pendingNature||'loaned')==='loaned')?'-':m.type==='income'||m.type==='payable'&&m.pendingNature==='borrowed'?'+':m.type==='payable'?'':'↔';return <div className={`movement-row movement-row-actions ${settled?'movement-settled':''}`} key={m.id}><div className="mini-icon" style={{color:c?.color||categoryColors[0]}}><Icon name={c?.icon|| (pendingType?(m.type==='receivable'?'coin':'document'):'wallet')}/></div><div className="movement-main"><strong>{m.description}</strong><small>{movementDateLabel(m.date)} · {movementTypeLabel(m.type)}{pendingType?` · ${pendingNatureLabel(m.type,m.pendingNature)}`:''}{c?` · ${c.name}`:''}{s?` · ${s.name}`:''}{pendingType&&m.dueDate?` · vence ${movementDateLabel(`${m.dueDate}T12:00:00`)}`:''}</small>{pendingType&&<span className="movement-pending-info">{settled?'✓ Cruzado':`${m.interestAmount?`Interés ${formatMoney(m.interestAmount)} · `:''}${m.type==='receivable'?'Total por cobrar':'Total por pagar'} ${formatMoney(m.amount+(m.interestAmount||0))}`}</span>}</div><b className={m.type==='income'?'positive':m.type==='expense'||m.type==='receivable'?'negative':''}>{sign}{formatMoney(m.amount)}</b><div className="movement-actions">{pendingType&&!settled&&<button type="button" className="settle-link" onClick={()=>settlePending(m)}>{m.type==='receivable'?'Cobrar':'Pagar'}</button>}{pendingType&&settled&&<button type="button" className="edit-link" onClick={()=>unSettlePending(m)}>Deshacer cruce</button>}{!pendingType||!settled?<button type="button" className="edit-link" onClick={()=>setEditing(m)}>Editar</button>:null}<button type="button" className="delete-link" onClick={()=>removeMovement(m.id)}>Eliminar</button></div></div>}

  return <div className="page">
    <div className="page-heading"><h1>Movimientos</h1><p>Registra, consulta y analiza todo lo que entra, sale o queda pendiente.</p></div>
    <div className="subpage-tabs"><button className={mode==='register'?'active':''} onClick={()=>setMode('register')}>Registrar movimiento</button><button className={mode==='analyze'?'active':''} onClick={()=>setMode('analyze')}>Analizar movimientos</button></div>

    {mode==='register'&&<>
      <MovementEditor accounts={accounts} categories={categories} subcategories={subcategories} setMovements={setMovements} setCategories={setCategories} setSubcategories={setSubcategories} showToast={showToast} setPage={setPage}/>
      <section className="section"><div className="section-title"><h2>Últimos movimientos</h2><button onClick={()=>setMode('analyze')}>Analizar</button></div>{movements.slice(0,8).map(renderMovementRow)}</section>
    </>}

    {mode==='analyze'&&<div className="movement-analysis">
      <div className="analysis-toolbar movement-analysis-toolbar"><label>Tipo<select value={filterType} onChange={e=>setFilterType(e.target.value as MovementType|'all')}><option value="expense">Gastos</option><option value="income">Ingresos</option><option value="transfer">Transferencias</option><option value="receivable">Por cobrar</option><option value="payable">Por pagar</option><option value="all">Todos</option></select></label><label>Mes<select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}><option value="">Todos los meses</option>{recentMonths.map(m=><option key={m} value={m}>{new Intl.DateTimeFormat('es-CO',{month:'long',year:'numeric'}).format(new Date(`${m}-01T12:00:00`))}</option>)}</select></label><label>Categoría<select value={filterCategory} onChange={e=>setFilterCategory(Number(e.target.value))}><option value={0}>Todas</option>{categories.filter((c:Category)=>c.type==='expense').map((c:Category)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Desde<input type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)}/></label><label>Hasta<input type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)}/></label></div>
      <div className="analysis-kpis"><div><span>{filterType==='expense'?'Gasto filtrado':'Movimientos filtrados'}</span><strong>{formatMoney(total)}</strong></div><div><span>Movimientos</span><strong>{filtered.length}</strong></div><div><span>Por cobrar pendiente</span><strong>{formatMoney(pendingReceivable)}</strong></div><div><span>Por pagar pendiente</span><strong>{formatMoney(pendingPayable)}</strong></div></div>

      {filterType==='expense'&&<section className="analysis-card"><div className="chart-head"><div><strong>Días con mayor gasto</strong><span>Hasta 6 días dentro de los filtros seleccionados</span></div><span>{filteredExpenses.length} gastos</span></div>{!dailyTotals.length?<div className="empty compact">No hay gastos para este filtro.</div>:<><div className="daily-chart labeled-daily-chart">{dailyTotals.map(d=><div className="daily-bar" key={d.key}><strong className="daily-value" title={formatMoney(d.value)}>{formatMoney(d.value)}</strong><div className="daily-track"><i style={{height:`${Math.max(8,(d.value/maxDaily)*100)}%`}}/></div><span>{movementDateLabel(`${d.key}T12:00:00`).replace(/ de /,' ')}</span></div>)}</div><small className="chart-note">Las barras están ordenadas desde el día con mayor gasto. Los valores muestran el importe exacto.</small></>}</section>}

      {pending.length>0&&<section className="analysis-card pending-card"><div className="chart-head"><div><strong>Cuentas por cobrar y por pagar</strong><span>Las cuentas por cobrar descuentan el dinero prestado. Las cuentas por pagar se descuentan cuando las marques como pagadas.</span></div></div>{pending.map(renderMovementRow)}</section>}
      <section className="analysis-card"><div className="chart-head"><div><strong>{filterType==='expense'?'Gastos filtrados':'Movimientos filtrados'}</strong><span>Puedes editar o eliminar cualquiera de los registros.</span></div><span>{filtered.length}</span></div>{!filtered.length?<div className="empty compact">No hay movimientos para los filtros seleccionados.</div>:filtered.map(renderMovementRow)}</section>
      <button className="floating-add" onClick={()=>setMode('register')} aria-label="Registrar movimiento">＋</button>
    </div>}

    {editing&&<div className="modal-backdrop"><MovementEditor accounts={accounts} categories={categories} subcategories={subcategories} setMovements={setMovements} setCategories={setCategories} setSubcategories={setSubcategories} showToast={showToast} setPage={setPage} initialMovement={editing} onClose={()=>setEditing(null)}/></div>}
  </div>
}

function Visualize({categories,categorySpent,subcategories,movements}:any){
  const expenseCats=categories.filter((c:Category)=>c.type==='expense');const[selected,setSelected]=useState<number>(0);const active=selected?expenseCats.find((c:Category)=>c.id===selected):undefined;const totalBudget=expenseCats.reduce((s:number,c:Category)=>s+c.budget,0);const totalSpent=expenseCats.reduce((s:number,c:Category)=>s+categorySpent(c.id),0);const totalPercent=totalBudget?Math.round(totalSpent/totalBudget*100):0;const totalOver=totalSpent>totalBudget&&totalBudget>0;const excessPercent=totalBudget?Math.max(0,Math.round((totalSpent-totalBudget)/totalBudget*100)):0;useEffect(()=>{if(selected&&!expenseCats.some((c:Category)=>c.id===selected))setSelected(0)},[categories])
  const tone=overspendTone(excessPercent)
  return <div className="page"><div className="visual-overview"><div><span className="eyebrow">Tu panorama financiero</span><h1>Así va tu presupuesto</h1><p>Una vista general de cómo estás consumiendo tu dinero.</p></div>{totalOver&&<div className="overview-warning" style={{background:tone.bg,borderColor:tone.border,color:tone.text}}><span style={{background:tone.accent}}>↑</span><div><strong>Presupuesto superado en {excessPercent}%</strong><small>{formatMoney(totalSpent-totalBudget)} por encima del presupuesto</small></div></div>}</div>
    <div className="overview-grid"><div className="overview-card"><span>Presupuestado</span><strong>{formatMoney(totalBudget)}</strong></div><div className="overview-card"><span>Gastado</span><strong>{formatMoney(totalSpent)}</strong></div><div className="overview-card"><span>Disponible</span><strong>{formatMoney(Math.max(totalBudget-totalSpent,0))}</strong></div><div className="overview-card" style={totalOver?{background:tone.bg,borderColor:tone.border,color:tone.text}:undefined}><span>{totalOver?'Superado':'Uso total'}</span><strong>{totalOver?`${excessPercent}%`: `${totalPercent}%`}</strong></div></div>
    <div className="overview-chart"><div className="chart-head"><strong>Presupuesto general</strong><span>{expenseCats.length} categorías</span></div><div className="big-bar-track"><div className="big-bar-fill" style={{width:`${Math.min(totalPercent,100)}%`,background:totalOver?tone.accent:undefined}}/></div><div className="chart-values"><span>{formatMoney(totalSpent)} gastado</span><span>{totalOver?`Superado ${excessPercent}% · ${formatMoney(totalSpent-totalBudget)}`:`${formatMoney(Math.max(totalBudget-totalSpent,0))} disponible`}</span></div></div>
    <section className="section"><div className="section-title"><h2>Consumo por categoría</h2><span>Selecciona para ver detalle</span></div><div className="overview-category-list">{expenseCats.map((c:Category)=>{const spent=categorySpent(c.id);const p=c.budget?Math.round(spent/c.budget*100):0;const excess=Math.max(0,Math.round((spent-c.budget)/Math.max(c.budget,1)*100));const t=overspendTone(excess);return <button key={c.id} className={`overview-category ${selected===c.id?'selected':''} ${p>100?'over':''}`} onClick={()=>setSelected(selected===c.id?0:c.id)} style={p>100?{background:t.bg,borderColor:t.border}:undefined}><div className="category-icon" style={{color:c.color,background:`${c.color}12`}}><Icon name={c.icon}/></div><div className="overview-category-main"><div><strong>{c.name}</strong><span>{formatMoney(spent)} / {formatMoney(c.budget)}</span></div><div className="progress"><i style={{width:`${Math.min(p,100)}%`,background:p>100?t.accent:c.color}}/></div></div><b style={p>100?{color:t.text}:undefined}>{p>100?`Superado ${excess}%`: `${p}%`}</b></button>})}</div></section>
    {active&&<DetailView cat={active} spent={categorySpent(active.id)} subcategories={subcategories} movements={movements}/>} 
  </div>
}

function DetailView({cat,spent,subcategories,movements}:any){const remaining=Math.max(cat.budget-spent,0);const over=spent>cat.budget&&cat.budget>0;const excess=Math.max(0,Math.round((spent-cat.budget)/Math.max(cat.budget,1)*100));const tone=overspendTone(excess);const subs=subcategories.filter((s:Subcategory)=>s.categoryId===cat.id);const totals=subs.map((s:Subcategory)=>({...s,spent:movements.filter((m:Movement)=>m.type==='expense'&&m.subcategoryId===s.id).reduce((a,m)=>a+m.amount,0)})).sort((a:any,b:any)=>b.spent-a.spent);return <section className="detail-panel"><div className="detail-header"><div><span className="eyebrow">Detalle</span><h2>{cat.name}</h2></div><span className="status-pill" style={over?{background:tone.bg,borderColor:tone.border,color:tone.text}:undefined}>{over?`Superado ${excess}%`:'En presupuesto'}</span></div><div className="detail-stats"><div><span>Presupuesto</span><strong>{formatMoney(cat.budget)}</strong></div><div><span>Gastado</span><strong>{formatMoney(spent)}</strong></div><div><span>{over?'Excedido':'Disponible'}</span><strong>{formatMoney(over?spent-cat.budget:remaining)}</strong></div></div>{over&&<div className="overspend-panel" style={{background:tone.bg,borderColor:tone.border,color:tone.text}}><span style={{background:tone.accent}}>!</span><div><strong>Presupuesto superado</strong><small style={{color:tone.text}}>Superaste el presupuesto de {cat.name} en {excess}%.</small></div></div>}<div className="chart-card"><div className="chart-head"><strong>Consumo por concepto</strong><span>{subs.length} conceptos</span></div>{!totals.length?<div className="empty compact">Aún no tienes conceptos.</div>:totals.map((s:any)=>{const usedPercent=s.amount>0?Math.round(s.spent/s.amount*100):0;const excess=s.amount>0?Math.max(0,Math.round((s.spent-s.amount)/s.amount*100)):0;const t=overspendTone(excess);const overConcept=excess>0;return <div className="concept-chart" key={s.id}><div><strong>{s.name}</strong><span>Presupuestado {formatMoney(s.amount)} / Gastado {formatMoney(s.spent)}</span></div><div className="concept-chart-meta"><span style={overConcept?{color:t.text}:{}}>{overConcept?`Superado ${excess}%`:`${usedPercent}% usado`}</span></div><div className="progress small" style={overConcept?{background:t.bg}:{}}><i style={{width:`${Math.min(usedPercent,100)}%`,background:overConcept?t.accent:cat.color}}/></div>{overConcept&&<small className="concept-over-note" style={{color:t.text}}>Superado en {formatMoney(s.spent-s.amount)} sobre lo presupuestado</small>}</div>})}</div><div className="insight-card"><img src={robot} alt="Budgy"/><div><strong>{over?'Revisemos este presupuesto':'Vas muy bien'}</strong><span>{over?`Has superado ${cat.name} en ${formatMoney(spent-cat.budget)}.`:`Te quedan ${formatMoney(remaining)} disponibles en ${cat.name}.`}</span></div></div></section>}

function BudgetPending({movements}:any){
  const pending=movements.filter((m:Movement)=>isPendingType(m.type)&&!m.settled)
  if(!pending.length)return null
  return <section className="analysis-card budget-pending-card"><div className="chart-head"><div><strong>Compromisos pendientes</strong><span>Se muestran aparte del presupuesto para no confundir deuda o préstamos con ingresos y gastos reales.</span></div><span>{pending.length}</span></div>{pending.map((m:Movement)=><div className="budget-pending-row" key={m.id}><div><strong>{m.description||movementStatusLabel(m.type)}</strong><small>{movementTypeLabel(m.type)} · {pendingNatureLabel(m.type,m.pendingNature)}{m.dueDate?` · vence ${movementDateLabel(`${m.dueDate}T12:00:00`)}`:''}</small></div><b className={m.type==='receivable'?'pending-positive':'pending-negative'}>{m.type==='receivable'?'+ por cobrar':'- por pagar'} {formatMoney(m.amount+(m.interestAmount||0))}</b></div>)}</section>
}

function BudgetPage({categories,setCategories,subcategories,setSubcategories,categorySpent,showToast,movements}:any){
  const [tab,setTab]=useState<'config'|'analysis'>('config')
  return <div className="page"><div className="page-heading"><h1>Presupuesto</h1><p>Configura tus presupuestos por categoría y luego analiza cómo se comportan.</p></div><div className="subpage-tabs"><button className={tab==='config'?'active':''} onClick={()=>setTab('config')}>Configurar</button><button className={tab==='analysis'?'active':''} onClick={()=>setTab('analysis')}>Analizar</button></div>{tab==='config'&&<Categories categories={categories} setCategories={setCategories} subcategories={subcategories} setSubcategories={setSubcategories} categorySpent={categorySpent} showToast={showToast} setPage={()=>setTab('analysis')} movements={movements}/>} {tab==='analysis'&&<><Visualize categories={categories} categorySpent={categorySpent} subcategories={subcategories} movements={movements}/><BudgetPending movements={movements}/></>}</div>
}

function Settings({setPage,theme,setTheme,currentUser,onLogout}:any){
  const updateTheme=(key:keyof Theme,value:string)=>setTheme((t:Theme)=>({...t,[key]:value}))
  return <div className="page"><div className="page-heading"><h1>Ajustes</h1><p>Configura Budgy a tu manera.</p></div>
    <section className="settings-profile"><div className="profile-avatar">{currentUser.name.slice(0,1).toUpperCase()}</div><div><strong>{currentUser.name}</strong><small>{currentUser.email}</small></div><button className="delete-link" onClick={onLogout}>Cerrar sesión</button></section>
    <section className="section"><div className="section-title"><h2>Personalizar colores</h2><span>Se guardan en tu cuenta</span></div><div className="theme-card"><div className="theme-presets">{themePresets.map((p,i)=><button type="button" key={i} className="theme-preset" style={{background:`linear-gradient(135deg,${p.primary},${p.secondary})`}} onClick={()=>setTheme(p)} aria-label={`Paleta ${i+1}`}/>)}</div><div className="theme-custom"><label>Color principal<input type="color" value={theme.primary} onChange={e=>updateTheme('primary',e.target.value)}/></label><label>Color secundario<input type="color" value={theme.secondary} onChange={e=>updateTheme('secondary',e.target.value)}/></label><label>Fondo<input type="color" value={theme.background} onChange={e=>updateTheme('background',e.target.value)}/></label></div></div></section>
    <div className="settings-list"><button onClick={()=>setPage('accounts')}><span>🏦</span><div><strong>Cuentas</strong><small>Bancos, efectivo y tarjetas</small></div>›</button><button onClick={()=>setPage('budget')}><span>▦</span><div><strong>Presupuesto</strong><small>Configurar categorías y análisis</small></div>›</button></div>
  </div>
}

export default App
