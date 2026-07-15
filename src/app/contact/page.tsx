'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const CONTACT_DETAILS = [
  { icon: Mail, label: 'Email', value: 'hello@turfifa.com', sub: 'For general inquiries' },
  { icon: Mail, label: 'Support', value: 'support@turfifa.com', sub: 'For booking issues' },
  { icon: Phone, label: 'Phone', value: '+880 1700-000000', sub: 'Mon–Sat, 9am–7pm' },
  { icon: MapPin, label: 'Office', value: 'Gulshan-2, Dhaka 1212', sub: 'Bangladesh' },
];

const SOCIALS = [
  { label: 'Facebook', href: 'https://facebook.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'X / Twitter', href: 'https://x.com' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.message.trim()) e.message = 'Message is required';
    else if (form.message.trim().length < 20)
      e.message = 'Message must be at least 20 characters';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-foreground py-16 px-4 sm:px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
          Get in Touch
        </p>
        <h1 className="text-4xl font-black text-background mb-4">
          We&apos;d love to hear from you
        </h1>
        <p className="text-background/60 text-sm max-w-md mx-auto">
          Got a question about booking, a venue dispute, or want to list your turf? Our
          team responds within 24 hours.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Contact form */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-8">
              Send us a message
            </h2>
            {submitted ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                  <CheckCircle2 className="size-10 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Message Sent!</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Thanks for reaching out, {form.name.split(' ')[0]}. We&apos;ll get
                    back to you at <strong>{form.email}</strong> within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: '', email: '', message: '' });
                    }}
                  >
                    Send another message
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contact-name">Your Name</Label>
                  <Input
                    id="contact-name"
                    placeholder="Rakibul Hasan"
                    value={form.name}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, name: e.target.value }));
                      setErrors((err) => ({ ...err, name: '' }));
                    }}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-email">Email Address</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="rakib@gmail.com"
                    value={form.email}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, email: e.target.value }));
                      setErrors((err) => ({ ...err, email: '' }));
                    }}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Tell us about your inquiry…"
                    rows={5}
                    value={form.message}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, message: e.target.value }));
                      setErrors((err) => ({ ...err, message: '' }));
                    }}
                    aria-invalid={!!errors.message}
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message}</p>
                  )}
                </div>
                <Button type="submit" className="self-start gap-2">
                  <Send className="size-3.5" /> Send Message
                </Button>
              </form>
            )}
          </div>

          {/* Static info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Contact Details
            </h2>
            <div className="flex flex-col gap-4">
              {CONTACT_DETAILS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 bg-card border border-border rounded-lg p-4"
                >
                  <div className="size-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                    <item.icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {item.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Follow us
              </p>
              <div className="flex gap-3 flex-wrap">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors border border-border rounded-md px-3 py-1.5"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
