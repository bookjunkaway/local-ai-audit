import { desc, eq, inArray, or } from "drizzle-orm";
import { db } from "../../db/index.js";
import { orders } from "../../db/schema.js";

export const PRODUCT_CONFIG: Record<
  string,
  { label: string; fulfillment: "custom" | "download"; downloadUrl?: string }
> = {
  "ai-visibility-audit": {
    label: "AI Visibility Audit",
    fulfillment: "custom",
  },
  "implementation-kit": {
    label: "Implementation Kit",
    fulfillment: "download",
    downloadUrl: process.env.IMPLEMENTATION_KIT_URL || "",
  },
  "local-ai-visibility-fix-kit": {
    label: "Local AI Visibility Fix Kit",
    fulfillment: "download",
    downloadUrl: process.env.LOCAL_AI_VISIBILITY_FIX_KIT_URL || "",
  },
  "homepage-rewrite-kit": {
    label: "Homepage Rewrite Kit",
    fulfillment: "download",
    downloadUrl: process.env.HOMEPAGE_REWRITE_KIT_URL || "",
  },
  "faq-schema-kit": {
    label: "FAQ + Schema Kit",
    fulfillment: "download",
    downloadUrl: process.env.FAQ_SCHEMA_KIT_URL || "",
  },
  "google-business-kit": {
    label: "Google Business Profile Fix Kit",
    fulfillment: "download",
    downloadUrl: process.env.GOOGLE_BUSINESS_KIT_URL || "",
  },
};

const PRODUCT_ALIASES: Record<string, string> = {
  "AI Visibility Audit - $49": "ai-visibility-audit",
  "Implementation Kit - $159": "implementation-kit",
};

type IntakePayload = {
  product?: string;
  business?: string;
  website?: string;
  city?: string;
  service?: string;
  platform?: string;
  email?: string;
  phone?: string;
  competitors?: string;
  pages?: string;
  notes?: string;
};

type IntakeData = {
  product: string;
  business: string;
  website: string;
  city: string;
  service: string;
  platform: string;
  email: string;
  phone: string;
  competitors: string;
  pages: string;
  notes: string;
};

type FixPlan = {
  problem: string;
  outcome: string;
  priority: string[];
  customerSteps: string[];
  platformSteps: string[];
  ownerChecklist: string[];
};

const PLATFORM_GUIDANCE: Record<string, string[]> = {
  WordPress: [
    "Update the target page in Pages or the active page builder, then refresh the SEO title and meta description in the SEO plugin.",
    "Publish the page, clear cache, and confirm the updated title, copy, FAQs, and schema appear on the live URL.",
  ],
  Wix: [
    "Edit the target page, update the visible copy, then use SEO Settings to update title tags, descriptions, and structured data.",
    "Publish the site and inspect the live page because Wix changes stay staged until the site is republished.",
  ],
  Squarespace: [
    "Update page sections, then use Page Settings for SEO title, description, URL, and any code-injection schema.",
    "Publish changes and check the live mobile layout for headline, service, city, and FAQ readability.",
  ],
  Shopify: [
    "Update Online Store pages, products, or theme sections, then edit Search engine listing fields for each affected URL.",
    "Preview the theme on desktop and mobile before publishing copy or schema changes.",
  ],
  Webflow: [
    "Update the page canvas and Page Settings SEO fields, then publish to the production domain.",
    "Use custom code fields for schema only after validating the JSON-LD.",
  ],
  default: [
    "Update the visible page copy first, then update the SEO title, meta description, headings, internal links, and schema fields in the site editor.",
    "Publish to the live domain and check the final page in an incognito browser window.",
  ],
};

const PRODUCT_FIXES: Record<string, Omit<FixPlan, "platformSteps">> = {
  "ai-visibility-audit": {
    problem: "The business is not giving search engines and AI answer engines enough clear evidence about services, location, trust, and page purpose.",
    outcome: "A prioritized audit queue that identifies the highest-impact SEO, AEO, GEO, homepage, FAQ, schema, and Google Business Profile fixes.",
    priority: [
      "Confirm the homepage clearly states the service, city, service area, and customer problem above the fold.",
      "Check title tags, meta descriptions, headings, and internal links for local service intent.",
      "Compare the site against known competitors and capture the three fixes most likely to improve visibility first.",
    ],
    customerSteps: [
      "Review the audit priorities in order instead of changing every page at once.",
      "Start with the homepage, primary service page, and Google Business Profile because those usually influence local AI visibility fastest.",
      "Use the focused fix kits for any audit issue that needs ready-to-publish copy or schema support.",
    ],
    ownerChecklist: [
      "Inspect the submitted website, service, city, competitors, and requested pages.",
      "Score the site for local clarity, page structure, FAQ coverage, schema readiness, and Google Business Profile consistency.",
      "Send the customer the top issues, competitor observations, and three priority fixes.",
    ],
  },
  "implementation-kit": {
    problem: "The customer needs a complete repair path instead of a diagnosis only.",
    outcome: "A guided implementation plan covering homepage copy, service-page improvements, FAQ content, schema, metadata, local trust signals, and publishing checks.",
    priority: [
      "Rewrite the homepage message around the main service, city, proof, and conversion action.",
      "Add or improve service pages so each page answers what the service is, who it is for, where it is offered, and why the business is credible.",
      "Add FAQ content and schema-ready answers that match customer search and AI answer questions.",
    ],
    customerSteps: [
      "Open the homepage and replace vague headline copy with service, city, and outcome language.",
      "Update title tags and meta descriptions for the homepage and priority service pages.",
      "Add a short FAQ block, proof section, service-area language, and a clear contact action on the pages listed in the intake form.",
    ],
    ownerChecklist: [
      "Review the submitted pages and map each issue to a homepage, service-page, FAQ, schema, or GBP fix.",
      "Prepare ready-to-paste copy blocks and metadata recommendations for the customer's platform.",
      "Confirm the customer receives enough instruction to publish without another consultation.",
    ],
  },
  "local-ai-visibility-fix-kit": {
    problem: "AI and local search systems may not understand what the business does, where it works, or why it should be recommended.",
    outcome: "Clear local entity signals across the site: service, city, service area, business category, proof, and consistent contact details.",
    priority: [
      "Place service and city language in the homepage headline, intro, title tag, and primary service page.",
      "Add service-area context and proof that the business serves the submitted city.",
      "Make business name, phone, address or service-area wording, and Google Business Profile details consistent.",
    ],
    customerSteps: [
      "Add the main service and city to the first screen of the homepage.",
      "Add a service-area paragraph near the main content, not only in the footer.",
      "Check that website contact details match the Google Business Profile exactly.",
    ],
    ownerChecklist: [
      "Check homepage, footer, contact page, and Google Business Profile consistency.",
      "Send the exact local wording the customer should add to the homepage and priority pages.",
      "Flag any missing city, service-area, category, review, or contact-detail signals.",
    ],
  },
  "homepage-rewrite-kit": {
    problem: "The homepage may be too generic for customers, Google, and AI answer engines to quickly understand the offer.",
    outcome: "A clearer homepage structure with a specific headline, service proof, local relevance, FAQs, and a stronger call to action.",
    priority: [
      "Rewrite the hero headline to include the main service and location or service area.",
      "Replace vague intro copy with customer problem, business outcome, and proof.",
      "Add sections for services, service area, reviews or trust signals, FAQs, and contact action.",
    ],
    customerSteps: [
      "Update the homepage headline and first paragraph before changing deeper sections.",
      "Add a simple service list with links to the strongest service pages.",
      "End the homepage with FAQs and one clear contact or booking action.",
    ],
    ownerChecklist: [
      "Draft a homepage outline and ready-to-paste hero, intro, service, proof, FAQ, and call-to-action copy.",
      "Make the copy match the submitted service, city, platform, and priority pages.",
      "Keep the final copy specific enough for both human buyers and AI answer extraction.",
    ],
  },
  "faq-schema-kit": {
    problem: "The site may not answer common buyer questions in a format that search engines and answer engines can parse.",
    outcome: "Useful FAQ content paired with schema-ready JSON-LD guidance for the submitted service and city.",
    priority: [
      "Write FAQs that answer pricing, timing, location, process, trust, and service-fit questions.",
      "Place FAQs on the homepage or relevant service pages where customers actually need them.",
      "Validate FAQ schema before publishing so malformed markup does not create errors.",
    ],
    customerSteps: [
      "Add five to eight FAQs to the highest-priority page listed in the intake form.",
      "Keep each answer direct, local, and specific to the service.",
      "Paste schema only in the platform area that supports custom code or structured data.",
    ],
    ownerChecklist: [
      "Generate service-specific FAQ questions and answers from the intake details.",
      "Prepare JSON-LD FAQ schema that matches the visible page copy.",
      "Include validation instructions before the customer publishes.",
    ],
  },
  "google-business-kit": {
    problem: "The Google Business Profile may not match the website closely enough to support local trust and map visibility.",
    outcome: "A cleaner Google Business Profile with stronger category alignment, service wording, description, photos, posts, reviews, and website consistency.",
    priority: [
      "Confirm the primary category, services, business description, phone, website URL, and service areas match the site.",
      "Add service-specific wording that matches the homepage and priority service page.",
      "Create a review and photo update routine that reinforces active local trust.",
    ],
    customerSteps: [
      "Compare the Google Business Profile name, phone, website, category, and service area to the website.",
      "Update service descriptions with the same service and city terms used on the homepage.",
      "Add fresh photos and ask recent customers for reviews that mention the specific service performed.",
    ],
    ownerChecklist: [
      "Review profile consistency against the submitted website and service area.",
      "Send the customer profile description, service wording, posting prompts, and review request copy.",
      "Flag any mismatch between profile categories, service names, website copy, and contact details.",
    ],
  },
};

function buildFixPlan(productSlug: string, data: IntakeData): FixPlan {
  const base = PRODUCT_FIXES[productSlug] || PRODUCT_FIXES["implementation-kit"];
  const platformSteps = PLATFORM_GUIDANCE[data.platform] || PLATFORM_GUIDANCE.default;
  const requestedPages = data.pages ? `Focus first on these submitted pages: ${data.pages}.` : "Focus first on the homepage and highest-value service page.";

  return {
    ...base,
    priority: [
      `Business context: ${data.business} offers ${data.service} in ${data.city}.`,
      requestedPages,
      ...base.priority,
    ],
    platformSteps,
  };
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers || {}),
    },
  });
}

export function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeProduct(product: unknown) {
  const value = normalizeText(product);
  return PRODUCT_ALIASES[value] || value;
}

export function validateIntake(payload: IntakePayload) {
  const productSlug = normalizeProduct(payload.product);
  const required = {
    product: productSlug,
    business: normalizeText(payload.business),
    website: normalizeText(payload.website),
    city: normalizeText(payload.city),
    service: normalizeText(payload.service),
    platform: normalizeText(payload.platform),
    email: normalizeText(payload.email).toLowerCase(),
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  const productConfig = PRODUCT_CONFIG[productSlug];
  if (!productConfig) {
    return { ok: false as const, error: "Invalid product", status: 400 };
  }

  if (missing.length > 0) {
    return { ok: false as const, error: "Missing required fields", missing, status: 400 };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(required.email)) {
    return { ok: false as const, error: "Invalid email", status: 400 };
  }

  let websiteUrl: URL;
  try {
    websiteUrl = new URL(required.website);
  } catch {
    return { ok: false as const, error: "Invalid website URL", status: 400 };
  }

  if (!["http:", "https:"].includes(websiteUrl.protocol)) {
    return { ok: false as const, error: "Invalid website URL", status: 400 };
  }

  return {
    ok: true as const,
    productSlug,
    productConfig,
    data: {
      ...required,
      website: websiteUrl.toString(),
      phone: normalizeText(payload.phone),
      competitors: normalizeText(payload.competitors),
      pages: normalizeText(payload.pages),
      notes: normalizeText(payload.notes),
    },
  };
}

export function createOrderNumber() {
  return `order_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

export async function createOrder(payload: IntakePayload) {
  const validation = validateIntake(payload);
  if (!validation.ok) {
    return validation;
  }

  const fixPlan = buildFixPlan(validation.productSlug, validation.data);

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: createOrderNumber(),
      productSlug: validation.productSlug,
      productLabel: validation.productConfig.label,
      fulfillment: validation.productConfig.fulfillment,
      downloadUrl: validation.productConfig.downloadUrl || null,
      status: "in_progress",
      business: validation.data.business,
      website: validation.data.website,
      city: validation.data.city,
      service: validation.data.service,
      platform: validation.data.platform,
      email: validation.data.email,
      phone: validation.data.phone || null,
      competitors: validation.data.competitors || null,
      pages: validation.data.pages || null,
      notes: validation.data.notes || null,
      metadata: {
        userAgent: "",
        fixPlan,
      },
      completedAt: null,
    })
    .returning();

  return { ok: true as const, order };
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getFixPlan(order: typeof orders.$inferSelect): FixPlan | null {
  const metadata = order.metadata as Record<string, unknown> | null;
  const plan = metadata?.fixPlan;
  if (!plan || typeof plan !== "object") {
    return null;
  }

  return plan as FixPlan;
}

function textList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function htmlList(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function orderText(order: typeof orders.$inferSelect) {
  const plan = getFixPlan(order);
  const details = [
    `Order ID: ${order.orderNumber}`,
    `Product: ${order.productLabel}`,
    `Status: ${order.status}`,
    `Business Name: ${order.business}`,
    `Website URL: ${order.website}`,
    `City: ${order.city}`,
    `Main Service: ${order.service}`,
    `Website Platform: ${order.platform}`,
    `Customer Email: ${order.email}`,
    `Phone: ${order.phone || ""}`,
    "",
    `Competitors: ${order.competitors || ""}`,
    "",
    `Key Pages To Improve First: ${order.pages || ""}`,
    "",
    `Additional Notes: ${order.notes || ""}`,
  ];

  if (plan) {
    details.push(
      "",
      "Generated Fix Plan",
      `Problem: ${plan.problem}`,
      `Outcome: ${plan.outcome}`,
      "",
      "Priority Fixes:",
      textList(plan.priority),
      "",
      "Customer Steps:",
      textList(plan.customerSteps),
      "",
      "Platform Steps:",
      textList(plan.platformSteps),
      "",
      "Owner Checklist:",
      textList(plan.ownerChecklist),
    );
  }

  return details.join("\n");
}

function adminHtml(order: typeof orders.$inferSelect) {
  const safe = Object.fromEntries(
    Object.entries(order).map(([key, value]) => [key, escapeHtml(value == null ? "" : String(value))]),
  );

  const plan = getFixPlan(order);

  return `
    <h2>New Local AI Audit Order</h2>
    <p><strong>Order ID:</strong> ${safe.orderNumber}</p>
    <p><strong>Status:</strong> ${safe.status}</p>
    <p><strong>Product:</strong> ${safe.productLabel}</p>
    <p><strong>Business Name:</strong> ${safe.business}</p>
    <p><strong>Website URL:</strong> ${safe.website}</p>
    <p><strong>City:</strong> ${safe.city}</p>
    <p><strong>Main Service:</strong> ${safe.service}</p>
    <p><strong>Website Platform:</strong> ${safe.platform}</p>
    <p><strong>Customer Email:</strong> ${safe.email}</p>
    <p><strong>Phone:</strong> ${safe.phone}</p>
    <p><strong>Competitors:</strong><br>${escapeHtml(order.competitors || "").replace(/\n/g, "<br>")}</p>
    <p><strong>Key Pages To Improve First:</strong><br>${escapeHtml(order.pages || "").replace(/\n/g, "<br>")}</p>
    <p><strong>Additional Notes:</strong><br>${escapeHtml(order.notes || "").replace(/\n/g, "<br>")}</p>
    ${
      plan
        ? `
          <h3>Generated Fix Plan</h3>
          <p><strong>Problem:</strong> ${escapeHtml(plan.problem)}</p>
          <p><strong>Outcome:</strong> ${escapeHtml(plan.outcome)}</p>
          <p><strong>Priority Fixes:</strong></p>${htmlList(plan.priority)}
          <p><strong>Customer Steps:</strong></p>${htmlList(plan.customerSteps)}
          <p><strong>Platform Steps:</strong></p>${htmlList(plan.platformSteps)}
          <p><strong>Owner Checklist:</strong></p>${htmlList(plan.ownerChecklist)}
        `
        : ""
    }
  `;
}

function customerMessage(order: typeof orders.$inferSelect) {
  const plan = getFixPlan(order);

  if (plan) {
    return {
      subject: `Your ${order.productLabel} fix plan is ready`,
      html: `
        <p>Thanks for your order.</p>
        <p>Your <strong>${escapeHtml(order.productLabel)}</strong> fix plan for <strong>${escapeHtml(order.business)}</strong> is ready to start.</p>
        <p><strong>Problem this fixes:</strong> ${escapeHtml(plan.problem)}</p>
        <p><strong>Target outcome:</strong> ${escapeHtml(plan.outcome)}</p>
        <p><strong>Priority fixes:</strong></p>${htmlList(plan.priority)}
        <p><strong>Your next steps:</strong></p>${htmlList(plan.customerSteps)}
        <p><strong>${escapeHtml(order.platform)} publishing steps:</strong></p>${htmlList(plan.platformSteps)}
        ${order.downloadUrl ? `<p><a href="${escapeHtml(order.downloadUrl)}">Download supporting kit files</a></p>` : ""}
        <p>Your order ID is <strong>${escapeHtml(order.orderNumber)}</strong>.</p>
        <p>If you need to add anything, reply to this email.</p>
      `,
      text: [
        "Thanks for your order.",
        `Your ${order.productLabel} fix plan for ${order.business} is ready to start.`,
        `Problem this fixes: ${plan.problem}`,
        `Target outcome: ${plan.outcome}`,
        "",
        "Priority fixes:",
        textList(plan.priority),
        "",
        "Your next steps:",
        textList(plan.customerSteps),
        "",
        `${order.platform} publishing steps:`,
        textList(plan.platformSteps),
        order.downloadUrl ? `Supporting kit files: ${order.downloadUrl}` : "",
        `Order ID: ${order.orderNumber}.`,
        "If you need to add anything, reply to this email.",
      ].join(" "),
    };
  }

  return {
    subject: `We received your ${order.productLabel} order`,
    html: `
      <p>Thanks for your order.</p>
      <p>We received your details for <strong>${escapeHtml(order.business)}</strong> and will use them to prepare your <strong>${escapeHtml(order.productLabel)}</strong>.</p>
      <p>Your order ID is <strong>${escapeHtml(order.orderNumber)}</strong>.</p>
      <p>If you need to add anything, reply to this email.</p>
    `,
    text: [
      "Thanks for your order.",
      `We received your details for ${order.business} and will use them to prepare your ${order.productLabel}.`,
      `Your order ID is ${order.orderNumber}.`,
      "If you need to add anything, reply to this email.",
    ].join(" "),
  };
}

async function sendEmail(message: { to: string[]; replyTo?: string; subject: string; html: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Email service is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || "orders@localaiaudit.com",
      to: message.to,
      reply_to: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email send failed with status ${response.status}`);
  }
}

export async function notifyOrder(order: typeof orders.$inferSelect) {
  const ownerEmail = process.env.TO_EMAIL || "Hudsonhotshotsmoving@yahoo.com";
  let notificationStatus = "sent";
  let notificationError: string | null = null;
  let customerNotificationStatus = "sent";
  let customerNotificationError: string | null = null;

  try {
    await sendEmail({
      to: [ownerEmail],
      replyTo: order.email,
      subject: `New Order - ${order.productLabel} - ${order.business}`,
      html: adminHtml(order),
      text: orderText(order),
    });
  } catch (error) {
    notificationStatus = "failed";
    notificationError = error instanceof Error ? error.message : "Owner notification failed";
  }

  try {
    const customer = customerMessage(order);
    await sendEmail({
      to: [order.email],
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    });
  } catch (error) {
    customerNotificationStatus = "failed";
    customerNotificationError = error instanceof Error ? error.message : "Customer notification failed";
  }

  const [updated] = await db
    .update(orders)
    .set({
      notificationStatus,
      notificationError,
      customerNotificationStatus,
      customerNotificationError,
      lastNotifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id))
    .returning();

  return updated;
}

export async function listOrders(status?: string | null) {
  if (status) {
    return db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.submittedAt)).limit(100);
  }

  return db.select().from(orders).orderBy(desc(orders.submittedAt)).limit(100);
}

export async function getOrder(orderNumber: string) {
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return order;
}

export async function updateOrderStatus(orderNumber: string, status: string) {
  const allowed = new Set(["new", "in_progress", "fulfilled", "cancelled"]);
  if (!allowed.has(status)) {
    return null;
  }

  const [order] = await db
    .update(orders)
    .set({
      status,
      completedAt: status === "fulfilled" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(orders.orderNumber, orderNumber))
    .returning();

  return order;
}

export async function retryFailedNotifications() {
  const retryable = await db
    .select()
    .from(orders)
    .where(
      or(
        inArray(orders.notificationStatus, ["pending", "failed"]),
        inArray(orders.customerNotificationStatus, ["pending", "failed"]),
      ),
    )
    .orderBy(desc(orders.submittedAt))
    .limit(10);

  const results = [];
  for (const order of retryable) {
    results.push(await notifyOrder(order));
  }

  return results;
}
