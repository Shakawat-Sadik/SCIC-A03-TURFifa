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

export default function Terms() {
  return (
    <div className="min-h-screen">
      <section className="bg-foreground py-12 px-4 text-center">
        <h1 className="text-3xl font-black text-background">Terms of Service</h1>
        <p className="text-background/50 text-sm mt-2">Last updated: July 1, 2025</p>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-3xl">
          <PolicySection title="1. Acceptance of Terms">
            <p>
              By creating an account or booking a turf through Turfifa, you agree to
              these Terms of Service. If you do not agree, please do not use our
              platform.
            </p>
          </PolicySection>
          <PolicySection title="2. Bookings and Payments">
            <p>
              All bookings are subject to venue availability and manager confirmation.
              Payment must be completed at the time of booking. Prices are listed in
              BDT (Bangladeshi Taka) inclusive of applicable taxes.
            </p>
          </PolicySection>
          <PolicySection title="3. Cancellation Policy">
            <p>
              Cancellations made at least 6 hours before the scheduled slot receive a
              full refund. Cancellations within 6 hours result in a 50% refund.
              No-shows forfeit the full booking amount.
            </p>
            <p>
              Venue managers may cancel bookings for emergency maintenance with full
              refunds issued automatically within 48 hours.
            </p>
          </PolicySection>
          <PolicySection title="4. User Conduct">
            <p>
              Users must treat venue staff and other players with respect. Turfifa
              reserves the right to suspend or permanently ban accounts that violate
              community standards, misuse the platform, or engage in fraud.
            </p>
          </PolicySection>
          <PolicySection title="5. Disputes">
            <p>
              Booking disputes must be raised within 48 hours via the Dispute Center.
              Our team will investigate and issue a ruling within 5 business days. Our
              decision is final for transactions under ৳10,000. Larger disputes may be
              escalated to arbitration.
            </p>
          </PolicySection>
          <PolicySection title="6. Governing Law">
            <p>
              These Terms are governed by the laws of the People&apos;s Republic of
              Bangladesh. Any disputes shall be subject to the exclusive jurisdiction of
              the courts of Dhaka.
            </p>
          </PolicySection>
        </div>
      </section>
    </div>
  );
}
