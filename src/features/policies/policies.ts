/**
 * The standard pages every store needs: privacy, terms, cancellation, refunds and FAQ. They are written so they
 * are true for any store built on this boilerplate (no invented times, fees or percentages): where a rule depends on
 * the business, the page says it is shown on the listing and in the confirmation, and tells people to ask.
 * A store that wants its own wording edits this file (`{brand}` is replaced with the store name).
 */
export type PolicySection = { heading: string; body: string[] }
export type Policy = { slug: string; title: string; summary: string; sections: PolicySection[] }

export const policies: Policy[] = [
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    summary: 'What {brand} collects when you browse, book or contact us, and what we do with it.',
    sections: [
      { heading: 'What we collect', body: ['Details you give us when you create an account, book, check out or send an enquiry: your name, email address, phone number, address and anything you write to us.', 'Basic usage information such as the pages you visit, so we can keep the site working and improve it.'] },
      { heading: 'How we use it', body: ['To process your bookings, orders and payments, to send confirmations and updates about them, and to reply to your messages.', 'We do not sell your personal information.'] },
      { heading: 'Payments', body: ['Payments are handled by the payment provider shown at checkout. {brand} does not store your full card details.'] },
      { heading: 'Your choices', body: ['You can view and update your details in your account. To ask for your information to be corrected or removed, contact us using the details on the contact page.'] },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms & Conditions',
    summary: 'The terms for using the {brand} website and booking or buying through it.',
    sections: [
      { heading: 'Using this website', body: ['By using this website you agree to these terms. Please read them before you book or buy.'] },
      { heading: 'Bookings and orders', body: ['The price, dates, availability and what is included are shown on each listing and again before you pay. A booking or order is confirmed when you receive a confirmation with a reference.', 'Please check your details carefully before you complete payment.'] },
      { heading: 'Changes and cancellations', body: ['See the Cancellation Policy and Refund Policy pages for how changes, cancellations and refunds work.'] },
      { heading: 'Contact', body: ['For anything not covered here, contact {brand} using the details on the contact page.'] },
    ],
  },
  {
    slug: 'cancellation',
    title: 'Booking & Cancellation Policy',
    summary: 'How to change or cancel a booking with {brand}.',
    sections: [
      { heading: 'Before you book', body: ['The cancellation rules that apply to a stay, workshop or appointment are shown on its listing and in your booking confirmation. Please read them before you pay.'] },
      { heading: 'Changing or cancelling', body: ['To change or cancel, contact {brand} as early as you can and quote your booking reference. Requests are handled according to the rules shown on your booking.', 'Cancelling an unpaid or unfinished booking attempt simply releases the dates or seats.'] },
      { heading: 'Questions', body: ['If you are unsure how a rule applies to your booking, ask us before you pay.'] },
    ],
  },
  {
    slug: 'refund',
    title: 'Refund Policy',
    summary: 'When and how refunds are made by {brand}.',
    sections: [
      { heading: 'Eligibility', body: ['Whether a payment is refundable, and how much, depends on the rules shown on the listing and in your confirmation, and on when you cancel.'] },
      { heading: 'How refunds are made', body: ['An approved refund is returned to the payment method you used. How long it takes to appear depends on your bank or payment provider.'] },
      { heading: 'Tracking a refund', body: ['The status of a cancelled booking and its refund is shown on your booking in your account. If something looks wrong, contact us with your booking reference.'] },
    ],
  },
  {
    slug: 'faq',
    title: 'Frequently Asked Questions',
    summary: 'Quick answers about booking with {brand}.',
    sections: [
      { heading: 'How do I book?', body: ['Open a listing, choose your dates, time or quantity, and continue to checkout. You get a confirmation with a reference when payment is complete.'] },
      { heading: 'Do I need an account?', body: ['No. You can book and check out as a guest. An account lets you see your booking history and update your details.'] },
      { heading: 'How do I pay?', body: ['The payment methods available are shown at checkout.'] },
      { heading: 'Can I change or cancel?', body: ['Yes, subject to the rules on your booking. See the Booking & Cancellation Policy.'] },
      { heading: 'How do I contact you?', body: ['Use the contact page. We reply to enquiries as soon as we can.'] },
    ],
  },
]

export const policyBySlug = (slug: string | undefined): Policy | undefined => policies.find(policy => policy.slug === slug)
