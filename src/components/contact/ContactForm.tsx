'use client'

import Script from 'next/script'
import { type FormEvent, useRef, useState } from 'react'

import { ArrowRight } from '@/components/ui/Icons'
import { track } from '@/lib/analytics'

type Errors = Partial<Record<'name' | 'email' | 'message' | 'form', string>>
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function ContactForm({ projectTypes, fallbackEmail }: { projectTypes: string[]; fallbackEmail?: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errors, setErrors] = useState<Errors>({})
  const started = useRef(false)
  const renderedAt = useRef(Date.now())
  const turnstileKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const onStart = () => {
    if (started.current) return
    started.current = true
    track('contact_started')
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    const next: Errors = {}
    if (!data.name?.trim()) next.name = 'Please add your name.'
    if (!EMAIL.test(data.email ?? '')) next.email = 'Please add a valid email address.'
    if ((data.message ?? '').trim().length < 10) next.message = 'A few words about the space or opportunity, please.'
    setErrors(next)
    const firstInvalid = (['name', 'email', 'message'] as const).find((k) => next[k])
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`#${firstInvalid}`)?.focus()
      return
    }
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, elapsed: Date.now() - renderedAt.current, page: window.location.pathname }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Something went wrong.')
      setStatus('sent')
      track('contact_submitted', { type: data.projectType || 'unspecified' })
      form.reset()
    } catch (err) {
      setErrors({ form: (err as Error).message })
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="border-t border-[var(--color-line)] pt-8">
        <p className="t-statement">Thank you — your message is on its way.</p>
        <p className="t-body mt-4 text-muted">You’ll receive a reply by email.</p>
      </div>
    )
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`${k}-error`} className="field-error">
        {errors[k]}
      </p>
    ) : null

  return (
    <form noValidate onSubmit={onSubmit} onFocus={onStart} className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2" aria-describedby={errors.form ? 'form-error' : undefined}>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" autoComplete="name" required maxLength={120} className="input" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />
        {err('name')}
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required maxLength={200} className="input" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
        {err('email')}
      </div>
      <div className="field">
        <label htmlFor="phone">
          Phone <span className="opacity-70">(optional)</span>
        </label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40} className="input" />
      </div>
      <div className="field">
        <label htmlFor="projectType">Enquiry</label>
        <select id="projectType" name="projectType" className="input" defaultValue="">
          <option value="" disabled>
            Select…
          </option>
          {projectTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="field sm:col-span-2">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" required maxLength={4000} rows={5} className="input" aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error' : undefined} />
        {err('message')}
      </div>

      {/* Honeypot — invisible to people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      {turnstileKey && (
        <div className="sm:col-span-2">
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={turnstileKey} data-theme="light" />
        </div>
      )}

      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.8125rem] text-muted">Your details are used only to reply to this message.</p>
        <button type="submit" className="btn btn-solid" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send message'} <ArrowRight />
        </button>
      </div>
      <div aria-live="assertive" className="sm:col-span-2">
        {errors.form && (
          <p id="form-error" className="field-error">
            {errors.form} {fallbackEmail && (
              <>
                You can also write directly to{' '}
                <a className="link-underline" href={`mailto:${fallbackEmail}`}>
                  {fallbackEmail}
                </a>
                .
              </>
            )}
          </p>
        )}
      </div>
    </form>
  )
}
