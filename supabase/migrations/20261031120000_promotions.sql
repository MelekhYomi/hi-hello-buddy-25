-- Promotions: the cards in the home page "Promotions" row and the full page each one opens (/promo/<slug>).
-- Admin edits everything in Admin > Promotions. Text in [square brackets] shows highlighted until it is replaced.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  is_published boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  tag text NOT NULL DEFAULT '',
  title text NOT NULL,
  blurb text NOT NULL DEFAULT '',
  benefits text[] NOT NULL DEFAULT '{}',
  card_cta text NOT NULL DEFAULT 'Learn more',
  icon text NOT NULL DEFAULT 'sparkles',
  page jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_promotions_updated_at ON public.promotions;
CREATE TRIGGER set_promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads published promotions" ON public.promotions;
CREATE POLICY "Anyone reads published promotions" ON public.promotions
  FOR SELECT USING (is_published = true OR (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

DROP POLICY IF EXISTS "Admins manage promotions" ON public.promotions;
CREATE POLICY "Admins manage promotions" ON public.promotions
  FOR ALL USING ((public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))) WITH CHECK ((public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

-- Starting content (never overwrites a promotion that already exists).
INSERT INTO public.promotions (slug, is_published, display_order, tag, title, blurb, benefits, card_cta, icon, page)
VALUES ('idea-to-brand-2027', true, 1, 'Masterclass · 2027', 'Idea to Brand 2027', 'One practical day in Jos to take your business idea to a clear, credible, market-ready brand.',
  ARRAY['Business Idea Canvas, pricing and break-even worked out in naira', 'Brand foundation and a seven-day content plan', 'A 30-day roadmap with one committed first action', 'Printed workbook included'], 'See the masterclass', 'lightbulb',
  $json${
  "seo_title": "Idea to Brand 2027 | C Imperium Masterclass in Jos",
  "seo_description": "A practical one-day masterclass in Jos: turn your business idea into a clear, credible, market-ready brand with a printed workbook and a 30-day roadmap.",
  "og_image": "/og-image.jpg",
  "pill": "C Imperium presents · Masterclass",
  "headline": "Idea to *Brand* 2027",
  "lead": "From business idea to a clear, credible, market-ready brand. One practical day, working on your own idea.",
  "cta_primary": "Reserve my seat",
  "cta_secondary": "See the six steps",
  "details": [
    {
      "label": "Date",
      "value": "[Date]"
    },
    {
      "label": "Venue",
      "value": "[Venue, Jos]"
    },
    {
      "label": "Time",
      "value": "[Time]"
    },
    {
      "label": "Length",
      "value": "About 4½ hours"
    },
    {
      "label": "Includes",
      "value": "Printed workbook"
    }
  ],
  "outcomes_kicker": "What you leave with",
  "outcomes_title": "A plan, not just inspiration",
  "outcomes": [
    {
      "title": "A clear idea",
      "body": "Your Business Idea Canvas: who it is for, the problem it solves, and a plan to test demand."
    },
    {
      "title": "A workable model",
      "body": "Pricing and break-even worked out in naira, plus a registration roadmap for your business."
    },
    {
      "title": "A brand and a first move",
      "body": "A brand foundation, a seven-day content plan and a 30-day roadmap with one committed first action."
    }
  ],
  "outcomes_note": "Not a finished business, but a clear next step you can take this week.",
  "steps_kicker": "The programme",
  "steps_title": "Six steps, one question each",
  "steps": [
    {
      "title": "Clarify",
      "body": "What problem am I solving, and for whom?"
    },
    {
      "title": "Validate",
      "body": "What evidence suggests customers want this?"
    },
    {
      "title": "Structure",
      "body": "How will I deliver value and earn sustainably?"
    },
    {
      "title": "Brand",
      "body": "Why should the right customer recognise and trust me?"
    },
    {
      "title": "Market",
      "body": "How will people discover and choose my offer?"
    },
    {
      "title": "Launch",
      "body": "What will I do over the next 30 days?"
    }
  ],
  "steps_note": "Each step: a short idea, a worked example, then you write in your own workbook.",
  "audience_kicker": "Who it is for",
  "audience_title": "Made for people ready to start",
  "audience": [
    "You have a business idea but do not know where to start.",
    "You are selling, but people do not understand or remember your brand.",
    "You want a realistic plan, not a motivational speech."
  ],
  "faq_kicker": "Questions",
  "faq_title": "Before you book",
  "faq": [
    {
      "q": "Do I need a business already?",
      "a": "No. It works for an idea, a new business or an established one."
    },
    {
      "q": "What should I bring?",
      "a": "Your business idea and a pen. We provide the printed workbook. [Add any extras]"
    },
    {
      "q": "Will you help me register my business?",
      "a": "We help you plan the steps. Requirements and fees change, so you will learn how to check them with CAC and official sources."
    },
    {
      "q": "How much is it?",
      "a": "[Price and payment details] Team rate: [if offered]"
    }
  ],
  "final_title": "Ready to turn your idea into a brand?",
  "final_sub": "Leave with a plan, not inspiration alone.",
  "button_label": "Reserve on WhatsApp",
  "whatsapp_number": "2348038577654",
  "whatsapp_message": "Hi C Imperium, I'd like to reserve a seat for Idea to Brand 2027.",
  "contacts": [
    "+234 803 857 7654",
    "info@cimperiumbrand.com",
    "@cimperium"
  ]
}$json$::jsonb)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.promotions (slug, is_published, display_order, tag, title, blurb, benefits, card_cta, icon, page)
VALUES ('logistics-delivery', true, 2, 'Launching soon', 'Logistics Delivery', 'Describe what needs to move. A rider is matched, you pay securely and follow it to the door.',
  ARRAY['Order in plain words, no long forms', 'Your fare shown before you pay', 'Bike, car or bus riders matched to the job', 'Follow the delivery from pickup to drop-off'], 'Get early access', 'truck',
  $json${
  "seo_title": "Logistics Delivery | C Imperium, Jos",
  "seo_description": "Describe what needs to move and where. C Imperium matches a rider, you pay securely and follow the delivery to the door. Launching soon in Jos.",
  "og_image": "/og-image.jpg",
  "pill": "C Imperium presents · Launching soon",
  "headline": "Describe it. We *dispatch* it.",
  "lead": "Tell us what needs to move and where, in your own words. A rider is matched, you pay securely, and you follow the delivery to the door.",
  "cta_primary": "Get early access",
  "cta_secondary": "See how it works",
  "details": [
    {
      "label": "Status",
      "value": "Launching soon"
    },
    {
      "label": "Order",
      "value": "In plain words"
    },
    {
      "label": "Riders",
      "value": "Bike, car or bus"
    },
    {
      "label": "Payment",
      "value": "Secure, via Paystack"
    },
    {
      "label": "Areas",
      "value": "[Areas covered]"
    }
  ],
  "outcomes_kicker": "Why it feels easy",
  "outcomes_title": "No forms. No guesswork.",
  "outcomes": [
    {
      "title": "Order in plain words",
      "body": "Write it the way you would say it: what to pick up, from where, and when it must arrive. We work out the rest."
    },
    {
      "title": "Matched and moving",
      "body": "A suitable rider, on a bike, in a car or in a bus, is matched to your job. You see who is coming and how long it will take."
    },
    {
      "title": "Pay, then follow it",
      "body": "Your fare is shown before you pay. Pay securely online, then watch the rider's progress until the delivery is done."
    }
  ],
  "outcomes_note": "Built so that a sender, a rider and our team always see the same, up-to-date picture.",
  "steps_kicker": "How it works",
  "steps_title": "Six steps from request to doorstep",
  "steps": [
    {
      "title": "Describe",
      "body": "Say what needs to move, from where to where."
    },
    {
      "title": "Price",
      "body": "Your fare is worked out and shown up front."
    },
    {
      "title": "Pay",
      "body": "Confirm with a secure online payment."
    },
    {
      "title": "Match",
      "body": "The best rider for the job is assigned, with an arrival time."
    },
    {
      "title": "Track",
      "body": "Follow the rider's location while they are on the way."
    },
    {
      "title": "Delivered",
      "body": "The trip is completed and recorded for everyone involved."
    }
  ],
  "steps_note": "Every delivery has a record: what was asked, what was paid and who delivered it.",
  "audience_kicker": "Who it is for",
  "audience_title": "One platform, three ways to use it",
  "audience": [
    "Senders. You need something collected, delivered or sent across town, today.",
    "Businesses and vendors. Restaurants, shops and online sellers who want orders to reach customers reliably.",
    "Riders. You have a bike, car or bus and want a steady flow of jobs, with your trips and earnings tracked."
  ],
  "faq_kicker": "Questions",
  "faq_title": "Before you order",
  "faq": [
    {
      "q": "When does it start?",
      "a": "We are preparing to launch. Message us on WhatsApp to be told the moment it opens, and to be among the first to use it. [Launch date]"
    },
    {
      "q": "What can I send?",
      "a": "Everyday parcels, documents, food and goods. [Items that are not allowed]"
    },
    {
      "q": "Which areas do you cover?",
      "a": "[Areas covered in Jos and beyond]"
    },
    {
      "q": "How much does it cost?",
      "a": "Your fare is calculated and shown before you pay, so there are no surprises. [Rates and minimum fare]"
    },
    {
      "q": "I have a bike or car. Can I ride with you?",
      "a": "Yes. Tell us about your vehicle on WhatsApp and we will share the requirements. [Rider requirements]"
    }
  ],
  "final_title": "Want to be first in line?",
  "final_sub": "Tell us you are interested and we will message you when delivery opens.",
  "button_label": "Get early access on WhatsApp",
  "whatsapp_number": "2349010912491",
  "whatsapp_message": "Hi C Imperium, I'd like early access to your delivery service.",
  "contacts": [
    "+234 901 091 2491",
    "info@cimperiumbrand.com",
    "@cimperium"
  ]
}$json$::jsonb)
ON CONFLICT (slug) DO NOTHING;
