'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, CreditCard, BookOpen, FileText, Scan, Settings } from 'lucide-react';

const NAV=[
  {href:'/',label:'الرئيسية',icon:LayoutDashboard},
  {href:'/events',label:'الفعاليات',icon:FileText},
  {href:'/attendees',label:'الحضور',icon:Users},
  {href:'/analytics',label:'التحليلات',icon:BarChart3},
  {href:'/tickets',label:'التذاكر',icon:CreditCard},
  {href:'/workshops',label:'الورش',icon:BookOpen},
  {href:'/scanner',label:'المسح',icon:Scan},
  {href:'/settings',label:'الإعدادات',icon:Settings},
];

export default function Sidebar(){
  const path=usePathname();
  return(
    <aside style={{width:240,flexShrink:0,background:'#fff',borderLeft:'0.5px solid #e8e8e4',display:'flex',flexDirection:'column',height:'100vh',position:'fixed',right:0,top:0,zIndex:10}}>
      <div style={{height:52,display:'flex',alignItems:'center',padding:'0 20px',gap:10,borderBottom:'0.5px solid #e8e8e4'}}>
        <div style={{width:26,height:26,background:'#2B6E64',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700}}>EV</div>
        <span style={{fontSize:14,fontWeight:600,color:'#111110'}}>EventVMS</span>
      </div>
      <nav style={{flex:1,padding:'8px 10px',overflowY:'auto'}}>
        {NAV.map(item=>{
          const Icon=item.icon;
          const active=path===item.href||path.startsWith(item.href+'/');
          return(
            <Link key={item.href} href={item.href} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:8,marginBottom:2,fontSize:13,color:active?'#111110':'#6b6b68',background:active?'#fafaf8':'transparent',fontWeight:active?500:400,textDecoration:'none'}}>
              <Icon size={16}/>{item.label}
            </Link>
          );
        })}
      </nav>
      <div style={{padding:'12px 16px',borderTop:'0.5px solid #e8e8e4',fontSize:10,color:'#a8a8a4'}}>EventVMS v1.0</div>
    </aside>
  );
}
