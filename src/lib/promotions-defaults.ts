// The two launch promotions. This is the content the admin starts from: the migration seeds it into the
// `promotions` table, and the site falls back to it if the table cannot be read.
// Text in [square brackets] is a placeholder: it shows highlighted on the page until the admin replaces it.

export type PromoPage = {
  seo_title: string;
  seo_description: string;
  og_image: string;
  pill: string;
  /** Words wrapped in *asterisks* get the yellow highlight. */
  headline: string;
  lead: string;
  cta_primary: string;
  cta_secondary: string;
  details: { label: string; value: string }[];
  outcomes_kicker: string;
  outcomes_title: string;
  outcomes: { title: string; body: string }[];
  outcomes_note: string;
  steps_kicker: string;
  steps_title: string;
  steps: { title: string; body: string }[];
  steps_note: string;
  audience_kicker: string;
  audience_title: string;
  audience: string[];
  faq_kicker: string;
  faq_title: string;
  faq: { q: string; a: string }[];
  final_title: string;
  final_sub: string;
  button_label: string;
  whatsapp_number: string;
  whatsapp_message: string;
  contacts: string[];
};

export type Promotion = {
  id: string;
  slug: string;
  is_published: boolean;
  display_order: number;
  tag: string;
  title: string;
  blurb: string;
  benefits: string[];
  card_cta: string;
  icon: string;
  page: PromoPage;
};

export const PROMO_ICONS = ["lightbulb", "truck", "sparkles", "megaphone", "gift", "calendar", "graduation-cap", "rocket"] as const;

export const EMPTY_PAGE: PromoPage = {
  seo_title: "",
  seo_description: "",
  og_image: "/og-image.jpg",
  pill: "",
  headline: "",
  lead: "",
  cta_primary: "Reserve my seat",
  cta_secondary: "See how it works",
  details: [],
  outcomes_kicker: "",
  outcomes_title: "",
  outcomes: [],
  outcomes_note: "",
  steps_kicker: "",
  steps_title: "",
  steps: [],
  steps_note: "",
  audience_kicker: "",
  audience_title: "",
  audience: [],
  faq_kicker: "Questions",
  faq_title: "Before you book",
  faq: [],
  final_title: "",
  final_sub: "",
  button_label: "Reserve on WhatsApp",
  whatsapp_number: "2349010912491",
  whatsapp_message: "Hi C Imperium, I'd like to know more.",
  contacts: ["+234 901 091 2491", "info@cimperiumbrand.com", "@cimperium"],
};

export const DEFAULT_PROMOTIONS: Omit<Promotion, "id">[] = [
  {
    slug: "idea-to-brand-2027",
    is_published: true,
    display_order: 1,
    tag: "Masterclass · 2027",
    title: "Idea to Brand 2027",
    blurb: "One practical day in Jos to take your business idea to a clear, credible, market-ready brand.",
    benefits: [
      "Business Idea Canvas, pricing and break-even worked out in naira",
      "Brand foundation and a seven-day content plan",
      "A 30-day roadmap with one committed first action",
      "Printed workbook included",
    ],
    card_cta: "See the masterclass",
    icon: "lightbulb",
    page: {
      ...EMPTY_PAGE,
      seo_title: "Idea to Brand 2027 | C Imperium Masterclass in Jos",
      seo_description:
        "A practical one-day masterclass in Jos: turn your business idea into a clear, credible, market-ready brand with a printed workbook and a 30-day roadmap.",
      pill: "C Imperium presents · Masterclass",
      headline: "Idea to *Brand* 2027",
      lead: "From business idea to a clear, credible, market-ready brand. One practical day, working on your own idea.",
      cta_primary: "Reserve my seat",
      cta_secondary: "See the six steps",
      details: [
        { label: "Date", value: "[Date]" },
        { label: "Venue", value: "[Venue, Jos]" },
        { label: "Time", value: "[Time]" },
        { label: "Length", value: "About 4½ hours" },
        { label: "Includes", value: "Printed workbook" },
      ],
      outcomes_kicker: "What you leave with",
      outcomes_title: "A plan, not just inspiration",
      outcomes: [
        { title: "A clear idea", body: "Your Business Idea Canvas: who it is for, the problem it solves, and a plan to test demand." },
        { title: "A workable model", body: "Pricing and break-even worked out in naira, plus a registration roadmap for your business." },
        { title: "A brand and a first move", body: "A brand foundation, a seven-day content plan and a 30-day roadmap with one committed first action." },
      ],
      outcomes_note: "Not a finished business, but a clear next step you can take this week.",
      steps_kicker: "The programme",
      steps_title: "Six steps, one question each",
      steps: [
        { title: "Clarify", body: "What problem am I solving, and for whom?" },
        { title: "Validate", body: "What evidence suggests customers want this?" },
        { title: "Structure", body: "How will I deliver value and earn sustainably?" },
        { title: "Brand", body: "Why should the right customer recognise and trust me?" },
        { title: "Market", body: "How will people discover and choose my offer?" },
        { title: "Launch", body: "What will I do over the next 30 days?" },
      ],
      steps_note: "Each step: a short idea, a worked example, then you write in your own workbook.",
      audience_kicker: "Who it is for",
      audience_title: "Made for people ready to start",
      audience: [
        "You have a business idea but do not know where to start.",
        "You are selling, but people do not understand or remember your brand.",
        "You want a realistic plan, not a motivational speech.",
      ],
      faq_kicker: "Questions",
      faq_title: "Before you book",
      faq: [
        { q: "Do I need a business already?", a: "No. It works for an idea, a new business or an established one." },
        { q: "What should I bring?", a: "Your business idea and a pen. We provide the printed workbook. [Add any extras]" },
        {
          q: "Will you help me register my business?",
          a: "We help you plan the steps. Requirements and fees change, so you will learn how to check them with CAC and official sources.",
        },
        { q: "How much is it?", a: "[Price and payment details] Team rate: [if offered]" },
      ],
      final_title: "Ready to turn your idea into a brand?",
      final_sub: "Leave with a plan, not inspiration alone.",
      button_label: "Reserve on WhatsApp",
      whatsapp_number: "2348038577654",
      whatsapp_message: "Hi C Imperium, I'd like to reserve a seat for Idea to Brand 2027.",
      contacts: ["+234 803 857 7654", "info@cimperiumbrand.com", "@cimperium"],
    },
  },
  {
    slug: "logistics-delivery",
    is_published: true,
    display_order: 2,
    tag: "Launching soon",
    title: "Logistics Delivery",
    blurb: "Describe what needs to move. A rider is matched, you pay securely and follow it to the door.",
    benefits: [
      "Order in plain words, no long forms",
      "Your fare shown before you pay",
      "Bike, car or bus riders matched to the job",
      "Follow the delivery from pickup to drop-off",
    ],
    card_cta: "Get early access",
    icon: "truck",
    page: {
      ...EMPTY_PAGE,
      seo_title: "Logistics Delivery | C Imperium, Jos",
      seo_description:
        "Describe what needs to move and where. C Imperium matches a rider, you pay securely and follow the delivery to the door. Launching soon in Jos.",
      pill: "C Imperium presents · Launching soon",
      headline: "Describe it. We *dispatch* it.",
      lead: "Tell us what needs to move and where, in your own words. A rider is matched, you pay securely, and you follow the delivery to the door.",
      cta_primary: "Get early access",
      cta_secondary: "See how it works",
      details: [
        { label: "Status", value: "Launching soon" },
        { label: "Order", value: "In plain words" },
        { label: "Riders", value: "Bike, car or bus" },
        { label: "Payment", value: "Secure, via Paystack" },
        { label: "Areas", value: "[Areas covered]" },
      ],
      outcomes_kicker: "Why it feels easy",
      outcomes_title: "No forms. No guesswork.",
      outcomes: [
        { title: "Order in plain words", body: "Write it the way you would say it: what to pick up, from where, and when it must arrive. We work out the rest." },
        {
          title: "Matched and moving",
          body: "A suitable rider, on a bike, in a car or in a bus, is matched to your job. You see who is coming and how long it will take.",
        },
        {
          title: "Pay, then follow it",
          body: "Your fare is shown before you pay. Pay securely online, then watch the rider's progress until the delivery is done.",
        },
      ],
      outcomes_note: "Built so that a sender, a rider and our team always see the same, up-to-date picture.",
      steps_kicker: "How it works",
      steps_title: "Six steps from request to doorstep",
      steps: [
        { title: "Describe", body: "Say what needs to move, from where to where." },
        { title: "Price", body: "Your fare is worked out and shown up front." },
        { title: "Pay", body: "Confirm with a secure online payment." },
        { title: "Match", body: "The best rider for the job is assigned, with an arrival time." },
        { title: "Track", body: "Follow the rider's location while they are on the way." },
        { title: "Delivered", body: "The trip is completed and recorded for everyone involved." },
      ],
      steps_note: "Every delivery has a record: what was asked, what was paid and who delivered it.",
      audience_kicker: "Who it is for",
      audience_title: "One platform, three ways to use it",
      audience: [
        "**Senders.** You need something collected, delivered or sent across town, today.",
        "**Businesses and vendors.** Restaurants, shops and online sellers who want orders to reach customers reliably.",
        "**Riders.** You have a bike, car or bus and want a steady flow of jobs, with your trips and earnings tracked.",
      ],
      faq_kicker: "Questions",
      faq_title: "Before you order",
      faq: [
        {
          q: "When does it start?",
          a: "We are preparing to launch. Message us on WhatsApp to be told the moment it opens, and to be among the first to use it. [Launch date]",
        },
        { q: "What can I send?", a: "Everyday parcels, documents, food and goods. [Items that are not allowed]" },
        { q: "Which areas do you cover?", a: "[Areas covered in Jos and beyond]" },
        { q: "How much does it cost?", a: "Your fare is calculated and shown before you pay, so there are no surprises. [Rates and minimum fare]" },
        {
          q: "I have a bike or car. Can I ride with you?",
          a: "Yes. Tell us about your vehicle on WhatsApp and we will share the requirements. [Rider requirements]",
        },
      ],
      final_title: "Want to be first in line?",
      final_sub: "Tell us you are interested and we will message you when delivery opens.",
      button_label: "Get early access on WhatsApp",
      whatsapp_number: "2349010912491",
      whatsapp_message: "Hi C Imperium, I'd like early access to your delivery service.",
      contacts: ["+234 901 091 2491", "info@cimperiumbrand.com", "@cimperium"],
    },
  },
];
