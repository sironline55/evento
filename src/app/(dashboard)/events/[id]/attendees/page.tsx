export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import AttendeesClient from './AttendeesClient'

export default function AttendeesPage() {
  return (
    <Suspense fallback={<div style={{padding:40,textAlign:'center'}}>جاري التحميل...</div>}>
      <AttendeesClient />
    </Suspense>
  )
}
