function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-3">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}

export default function Privacy() {
  return (
    <div className="min-h-screen">
      <section className="bg-foreground py-12 px-4 text-center">
        <h1 className="text-3xl font-black text-background">Privacy Policy</h1>
        <p className="text-background/50 text-sm mt-2">Last updated: July 1, 2025</p>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-3xl">
          <PolicySection title="1. Information We Collect">
            <p>
              We collect information you provide directly, including your name, email
              address, phone number, and payment preferences when you register or book
              a turf. We also collect location data when you search for venues near
              you.
            </p>
            <p>
              Automatically collected data includes usage logs, device type, IP
              address, and booking history to improve our services and detect
              fraudulent activity.
            </p>
          </PolicySection>
          <PolicySection title="2. How We Use Your Information">
            <p>
              Your data is used to process bookings, send confirmation and reminder
              notifications, display your player profile and statistics, and resolve
              disputes. We never sell your personal information to third parties.
            </p>
            <p>
              We may use aggregate, anonymised data for product analytics and to
              improve venue recommendations.
            </p>
          </PolicySection>
          <PolicySection title="3. Payment Information">
            <p>
              Turfifa integrates with bKash, Nagad, and Upay for payment processing. We
              do not store full payment credentials. Transactions are handled by each
              gateway&apos;s secure infrastructure and are governed by their respective
              privacy policies.
            </p>
          </PolicySection>
          <PolicySection title="4. Data Retention">
            <p>
              Account data is retained for as long as your account is active. Upon
              deletion, personal data is removed within 30 days, except where required
              by Bangladeshi law for audit or dispute resolution purposes.
            </p>
          </PolicySection>
          <PolicySection title="5. Contact">
            <p>
              For privacy questions, email{' '}
              <strong className="text-foreground">privacy@turfifa.com</strong> or write
              to: Turfifa Ltd., Gulshan-2, Dhaka 1212, Bangladesh.
            </p>
          </PolicySection>
        </div>
      </section>
    </div>
  );
}
