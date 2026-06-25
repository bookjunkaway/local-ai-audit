import { desc, eq, inArray } from "drizzle-orm";
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

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber: createOrderNumber(),
      productSlug: validation.productSlug,
      productLabel: validation.productConfig.label,
      fulfillment: validation.productConfig.fulfillment,
      downloadUrl: validation.productConfig.downloadUrl || null,
      status: validation.productConfig.fulfillment === "download" ? "fulfilled" : "new",
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
      },
      completedAt: validation.productConfig.fulfillment === "download" ? new Date() : null,
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

function orderText(order: typeof orders.$inferSelect) {
  return [
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
  ].join("\n");
}

function adminHtml(order: typeof orders.$inferSelect) {
  const safe = Object.fromEntries(
    Object.entries(order).map(([key, value]) => [key, escapeHtml(value == null ? "" : String(value))]),
  );

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
  `;
}

function customerMessage(order: typeof orders.$inferSelect) {
  if (order.fulfillment === "download" && order.downloadUrl) {
    return {
      subject: `Your ${order.productLabel} is ready`,
      html: `
        <p>Thanks for your order.</p>
        <p>Your <strong>${escapeHtml(order.productLabel)}</strong> is ready.</p>
        <p><a href="${escapeHtml(order.downloadUrl)}">Download your kit</a></p>
        <p>Your order ID is <strong>${escapeHtml(order.orderNumber)}</strong>.</p>
      `,
      text: [
        "Thanks for your order.",
        `Your ${order.productLabel} is ready.`,
        `Download: ${order.downloadUrl}`,
        `Order ID: ${order.orderNumber}.`,
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
    .where(inArray(orders.notificationStatus, ["pending", "failed"]))
    .orderBy(desc(orders.submittedAt))
    .limit(10);

  const results = [];
  for (const order of retryable) {
    results.push(await notifyOrder(order));
  }

  return results;
}
