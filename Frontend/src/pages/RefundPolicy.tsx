import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

const RefundPolicy = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <header className="px-6 py-5 flex items-center justify-between max-w-3xl mx-auto w-full">
      <Logo size="md" />
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>
    </header>
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8 prose-sm">
      <h1 className="text-3xl font-semibold text-foreground mb-2">Refund Policy</h1>
      <p className="text-xs text-muted-foreground mb-6">Last updated: May 2026</p>

      <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-1">Event ticket refunds</h2>
          <p>
            {/* TODO: Add final legal text for event ticket refund policy */}
            Refunds for paid event tickets are handled on a case-by-case basis. Please contact support
            for refund requests. All refund decisions are at the discretion of the event organizer.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-1">Founder Card refunds</h2>
          <p>
            {/* TODO: Add final legal text for Founder Card refund policy */}
            Founder Card subscription refunds are subject to our subscription terms. Please refer to your
            subscription agreement or contact support for more information.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-1">How to request a refund</h2>
          <p>
            {/* TODO: Add final legal text for refund request process */}
            To request a refund, please contact our support team with your order details and reason for
            the refund request. We will review your request and respond within 7-10 business days.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-1">Contact</h2>
          <p>
            Questions about refunds? Reach us via the support address in the app. See also our{' '}
            <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link> and{' '}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </section>
      </div>
    </main>
  </div>
);

export default RefundPolicy;
