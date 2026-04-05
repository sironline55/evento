import * as XLSX from 'xlsx'

export function exportAttendees(regs: any[], eventTitle: string) {
  const rows = regs.map((r, i) => ({
    '#': i + 1,
    'الاسم': r.guest_name || '',
    'البريد الإلكتروني': r.guest_email || r.email || '',
    'رقم الجوال': r.guest_phone || r.phone || '',
    'نوع التذكرة': r.ticket_type || 'عام',
    'الحالة': translateStatus(r.status),
    'كود الخصم': r.discount_code || '',
    'سعر التذكرة': r.ticket_price || 0,
    'تاريخ التسجيل': r.created_at ? new Date(r.created_at).toLocaleDateString('ar-SA') : '',
    'وقت الحضور': r.checked_in_at ? new Date(r.checked_in_at).toLocaleString('ar-SA') : '—',
    'رمز QR': r.qr_code || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 4 }, { wch: 22 }, { wch: 28 }, { wch: 14 },
    { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
    { wch: 16 }, { wch: 20 }, { wch: 36 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'الزوار')

  // Summary sheet
  const summary = [
    { 'البيان': 'إجمالي المسجلين',  'العدد': regs.filter(r => r.status !== 'waitlisted').length },
    { 'البيان': 'حضروا الفعالية',  'العدد': regs.filter(r => r.status === 'attended').length },
    { 'البيان': 'لم يحضروا',        'العدد': regs.filter(r => r.status === 'registered').length },
    { 'البيان': 'ملغية',            'العدد': regs.filter(r => r.status === 'cancelled').length },
    { 'البيان': 'قائمة الانتظار',  'العدد': regs.filter(r => r.status === 'waitlisted').length },
  ]
  const ws2 = XLSX.utils.json_to_sheet(summary)
  ws2['!cols'] = [{ wch: 20 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'ملخص')

  XLSX.writeFile(wb, `${eventTitle.slice(0,30)}-الزوار.xlsx`)
}

function translateStatus(s: string) {
  const m: Record<string, string> = {
    registered: 'مسجّل', attended: 'حضر',
    cancelled: 'ملغي', waitlisted: 'انتظار'
  }
  return m[s] || s
}
