import type { Config } from "@netlify/functions";

type Campaign = {
  audience: string;
  painPoint: string;
  product: string;
  checkoutUrl: string;
  subject: string;
  socialPost: string;
  outreach: string;
};

const ownerEmail = process.env.TO_EMAIL || "Hudsonhotshotsmoving@yahoo.com";

const campaigns: Campaign[] = [
  {
    audience: "roofers",
    painPoint: "their site does not clearly connect roofing services, city pages, reviews, and emergency intent",
    product: "AI Visibility Audit",
    checkoutUrl: "https://buy.stripe.com/aFacMY8gQ7kP0mV3eh3ZK04",
    subject: "Can AI find your roofing company?",
    socialPost:
      "Roofing companies are losing leads when their websites do not clearly show service area, emergency services, proof, and FAQs. A $49 AI Visibility Audit shows the top fixes that help Google and AI tools understand the business.",
    outreach:
      "I noticed many roofing websites bury the city, service area, emergency services, and proof customers need before calling. The $49 AI Visibility Audit shows what is blocking visibility in Google, AI answers, and local search.",
  },
  {
    audience: "dentists",
    painPoint: "their pages do not answer treatment, location, insurance, urgency, and trust questions clearly",
    product: "FAQ + Schema Kit",
    checkoutUrl: "https://buy.stripe.com/dRmfZa1Ss34z9Xv5mp3ZK08",
    subject: "Make dental pages easier for AI to quote",
    socialPost:
      "Dental practices need service pages that answer real patient questions: cost, appointments, insurance, emergency care, location, and trust. The FAQ + Schema Kit helps turn those answers into search-ready page content.",
    outreach:
      "Your dental site can earn more visibility when each treatment page answers the questions patients and AI tools are already asking. The FAQ + Schema Kit gives you page-ready answers and schema guidance.",
  },
  {
    audience: "HVAC companies",
    painPoint: "their homepage and service pages do not make repair, replacement, maintenance, city, and booking signals obvious",
    product: "Local AI Visibility Fix Kit",
    checkoutUrl: "https://buy.stripe.com/aFadR2fJi0Wr7Pn4il3ZK06",
    subject: "HVAC visibility starts with clearer local signals",
    socialPost:
      "HVAC websites need clear service, city, service-area, repair, replacement, and maintenance signals. The Local AI Visibility Fix Kit helps make those details easier for customers, Google, and answer engines to understand.",
    outreach:
      "HVAC searches are local and urgent. If the site does not clearly connect services, cities, and booking actions, it is harder for customers and AI tools to choose the company.",
  },
  {
    audience: "local service businesses",
    painPoint: "their homepage sounds generic and does not explain what they do, where they work, or why customers should act",
    product: "Homepage Rewrite Kit",
    checkoutUrl: "https://buy.stripe.com/00waEQ0OobB52v35mp3ZK07",
    subject: "Your homepage should make the offer obvious",
    socialPost:
      "A homepage should quickly tell customers what the business does, where it works, who it helps, and what to do next. The Homepage Rewrite Kit gives local businesses a clearer structure for search, AI answers, and conversion.",
    outreach:
      "If your homepage could apply to almost any business, Google and AI tools have less evidence to recommend it. The Homepage Rewrite Kit helps make the offer, service area, proof, and next step clearer.",
  },
];

function thisWeekCampaign() {
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return campaigns[week % campaigns.length];
}

function campaignText(campaign: Campaign) {
  return [
    "Weekly Fix My Site Kit marketing pack",
    "",
    `Audience: ${campaign.audience}`,
    `Pain point: ${campaign.painPoint}`,
    `Product to promote: ${campaign.product}`,
    `Checkout link: ${campaign.checkoutUrl}`,
    "",
    `Email subject: ${campaign.subject}`,
    "",
    "Social post:",
    campaign.socialPost,
    "",
    "Direct outreach:",
    campaign.outreach,
    "",
    "Call to action:",
    `Buy here: ${campaign.checkoutUrl}`,
  ].join("\n");
}

function campaignHtml(campaign: Campaign) {
  return `
    <h2>Weekly Fix My Site Kit marketing pack</h2>
    <p><strong>Audience:</strong> ${campaign.audience}</p>
    <p><strong>Pain point:</strong> ${campaign.painPoint}</p>
    <p><strong>Product to promote:</strong> ${campaign.product}</p>
    <p><strong>Email subject:</strong> ${campaign.subject}</p>
    <h3>Social post</h3>
    <p>${campaign.socialPost}</p>
    <h3>Direct outreach</h3>
    <p>${campaign.outreach}</p>
    <p><a href="${campaign.checkoutUrl}">Open checkout link</a></p>
  `;
}

async function sendOwnerEmail(campaign: Campaign) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: "email_not_configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || "orders@fixmysitekit.com",
      to: [ownerEmail],
      subject: `Weekly marketing pack: ${campaign.audience}`,
      html: campaignHtml(campaign),
      text: campaignText(campaign),
    }),
  });

  if (!response.ok) {
    throw new Error(`Marketing email failed with status ${response.status}`);
  }

  return { sent: true };
}

export default async () => {
  const campaign = thisWeekCampaign();
  const email = await sendOwnerEmail(campaign);

  return Response.json(
    {
      ok: true,
      email,
      campaign,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
};

export const config: Config = {
  schedule: "0 14 * * 1",
};
