'use client';
interface Props{title?:string}
export default function Topbar({title='EventVMS'}:Props){
  return(
    <header style={{height:52,background:'#fff',borderBottom:'0.5px solid #e8e8e4',display:'flex',alignItems:'center',padding:'0 24px',flexShrink:0}}>
      <span style={{fontSize:14,fontWeight:500,color:'#111110'}}>{title}</span>
    </header>
  );
}
