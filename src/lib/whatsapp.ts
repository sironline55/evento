// ══════════════════════════════════════════════════════════
// WhatsApp Notification Helper — call from any page
// Usage: await sendNotification({ type, userId, phone, data })
// ══════════════════════════════════════════════════════════

interface NotifyOptions {
  type: string
  userId: string
  phone: string
  data?: Record<string, any>
  referenceId?: string
}

export async function sendNotification(opts: NotifyOptions): Promise<boolean> {
  try {
    const base = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL || 'https://evento-h2ir.vercel.app')
    const res = await fetch(`${base}/api/whatsapp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    })
    const data = await res.json()
    return data.ok === true
  } catch {
    return false
  }
}

// ── Shorthand helpers ─────────────────────────────────────

export async function notifyProposalReceived(opts: {
  orgUserId: string; orgPhone: string;
  influencerName: string; briefTitle: string; price: number; briefId: string;
}) {
  return sendNotification({
    type: 'inf_proposal_received',
    userId: opts.orgUserId,
    phone: opts.orgPhone,
    referenceId: opts.briefId,
    data: {
      influencer_name: opts.influencerName,
      brief_title: opts.briefTitle,
      price: opts.price.toLocaleString('ar-SA'),
      url: `https://evento-h2ir.vercel.app/briefs/${opts.briefId}`,
    },
  })
}

export async function notifyProposalAccepted(opts: {
  infUserId: string; infPhone: string; infName: string;
  briefTitle: string; price: number; contractId: string;
}) {
  return sendNotification({
    type: 'inf_proposal_accepted',
    userId: opts.infUserId,
    phone: opts.infPhone,
    referenceId: opts.contractId,
    data: {
      name: opts.infName,
      brief_title: opts.briefTitle,
      price: opts.price.toLocaleString('ar-SA'),
    },
  })
}

export async function notifyPaymentHeld(opts: {
  infUserId: string; infPhone: string; infName: string;
  amount: number; contractId: string;
}) {
  return sendNotification({
    type: 'inf_payment_held',
    userId: opts.infUserId,
    phone: opts.infPhone,
    referenceId: opts.contractId,
    data: {
      name: opts.infName,
      amount: opts.amount.toLocaleString('ar-SA'),
    },
  })
}

export async function notifyContentSubmitted(opts: {
  orgUserId: string; orgPhone: string;
  influencerName: string; briefTitle: string; contractId: string;
}) {
  return sendNotification({
    type: 'inf_content_submitted',
    userId: opts.orgUserId,
    phone: opts.orgPhone,
    referenceId: opts.contractId,
    data: {
      influencer_name: opts.influencerName,
      brief_title: opts.briefTitle,
      url: `https://evento-h2ir.vercel.app/contracts`,
    },
  })
}

export async function notifyPaymentReleased(opts: {
  infUserId: string; infPhone: string; infName: string;
  amount: number; contractId: string;
}) {
  return sendNotification({
    type: 'inf_payment_released',
    userId: opts.infUserId,
    phone: opts.infPhone,
    referenceId: opts.contractId,
    data: {
      name: opts.infName,
      amount: opts.amount.toLocaleString('ar-SA'),
    },
  })
}

export async function notifyTicketConfirmed(opts: {
  userId: string; phone: string; name: string;
  eventName: string; eventDate: string; ticketCode: string;
}) {
  return sendNotification({
    type: 'ticket_confirmed',
    userId: opts.userId,
    phone: opts.phone,
    data: {
      name: opts.name,
      event_name: opts.eventName,
      event_date: opts.eventDate,
      ticket_code: opts.ticketCode,
    },
  })
}

export async function notifyStaffAccepted(opts: {
  userId: string; phone: string; name: string;
  jobTitle: string; orgName: string; eventDate: string;
}) {
  return sendNotification({
    type: 'staff_application_accepted',
    userId: opts.userId,
    phone: opts.phone,
    data: {
      name: opts.name,
      job_title: opts.jobTitle,
      org_name: opts.orgName,
      event_date: opts.eventDate,
    },
  })
}
