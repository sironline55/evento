'use client';
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Scan, BarChart3, Settings } from 'lucide-react';

const TABS=[
  {href:'/',label:'الرئيسية',icon:LayoutDashboard},
  {href:'/attendees',label:'الحضور',icon:Users},
  {href:'/scanner',label:'مسح',icon:Scan},
  {href:'/analytics',label:'تحليل',icon:BarChart3},
  {href:'/settings',label:'إعدادات',icon:Settings},
];

export default function MobileNav(){
  const path=usePathname();
  return(
    <nav style={{display:'flex',height:60,background:'#fff',borderTop:'0.5px solid #e8e8e4',paddingBottom:'env(safe-area-inset-bottom)'}}>
      {TABS.map(t=>{
        const Icon=t.icon;
        const active=path===t.href||path.startsWith(t.href+'/');
        return(
          <Link key={t.href} href={t.href} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,color:active?'#2B6E64':'#a8a8a4',fontSize:9,textDecoration:'none',fontWeight:active?500:400}}>
            <Icon size={20}/>{t.label}
          </Link>
        );
      })}
    </nav>
  );
}
