import { Resend } from 'resend'

let _resend: Resend | undefined

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('Missing env var: RESEND_API_KEY')
    _resend = new Resend(key)
  }
  return _resend
}
