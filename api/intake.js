function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function createOrderId() {
  return `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const PRODUCT_CONFIG = {
  'ai-visibility-audit': {
    label: 'AI Visibility Audit',
    fulfillment: 'custom',
  },
  'implementation-kit': {
    label: 'Implementation Kit',
    fulfillment: 'download',
    downloadUrl: process.env.IMPLEMENTATION_KIT_URL || '',
  },
  'local-ai-visibility-fix-kit': {
    label: 'Local AI Visibility Fix Kit',
    fulfillment: 'download',
    downloadUrl: process.env.LOCAL_AI_VISIBILITY_FIX_KIT_URL || '',
  },
  'homepage-rewrite-kit': {
    label: 'Homepage Rewrite Kit',
    fulfillment: 'download',
    downloadUrl: process.env.HOMEPAGE_REWRITE_KIT_URL || '',
  },
  'faq-schema-kit': {
    label: 'FAQ + Schema Kit',
    fulfillment: 'download',
    downloadUrl: process.env.FAQ_SCHEMA_KIT_URL || '',
  },
  'google-business-kit': {
    label: 'Google Business Profile Fix Kit',
    fulfillment: 'download',
    downloadUrl: process.env.GOOGLE_BUSINESS_KIT_URL || '',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    product,
    business,
    website,
    city,
    service,
    platform,
    email,
    phone,
    competitors,
    pages,
    notes,
  } = req.body || {};

  if (!product || !business || !website || !city || !service || !platform || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const productConfig = PRODUCT_CONFIG[product];
  if (!productConfig) {
    return res.status(400).json({ error: 'Invalid product' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'orders@fixmysitekit.com';
  const toEmail = process.env.TO_EMAIL || 'Hudsonhotshotsmoving@yahoo.com';

  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not set' });
  }

  const orderId = createOrderId();

  const safe = {
    product: escapeHtml(productConfig.label),
    business: escapeHtml(business),
    website: escapeHtml(website),
    city: escapeHtml(city),
    service: escapeHtml(service),
    platform: escapeHtml(platform),
    email: escapeHtml(email),
    phone: escapeHtml(phone || ''),
    competitors: escapeHtml(competitors || '').replace(/\n/g, '<br/>'),
    pages: escapeHtml(pages || '').replace(/\n/g, '<br/>'),
    notes: escapeHtml(notes || '').replace(/\n/g, '<br/>'),
  };

  const text = [
    `Order ID: ${orderId}`,
    `Product: ${productConfig.label}`,
    `Business Name: ${business}`,
    `Website URL: ${website}`,
    `City: ${city}`,
    `Main Service: ${service}`,
    `Website Platform: ${platform}`,
    `Customer Email: ${email}`,
    `Phone: ${phone || ''}`,
    '',
    `Competitors: ${competitors || ''}`,
    '',
    `Key Pages To Improve First: ${pages || ''}`,
    '',
    `Additional Notes: ${notes || ''}`,
  ].join('\n');

  const html = `
    <h2>New Order</h2>
    <p><strong>Order ID:</strong> ${orderId}</p>
    <p><strong>Product:</strong> ${safe.product}</p>
    <p><strong>Business Name:</strong> ${safe.business}</p>
    <p><strong>Website URL:</strong> ${safe.website}</p>
    <p><strong>City:</strong> ${safe.city}</p>
    <p><strong>Main Service:</strong> ${safe.service}</p>
    <p><strong>Website Platform:</strong> ${safe.platform}</p>
    <p><strong>Customer Email:</strong> ${safe.email}</p>
    <p><strong>Phone:</strong> ${safe.phone}</p>
    <p><strong>Competitors:</strong><br/>${safe.competitors}</p>
    <p><strong>Key Pages To Improve First:</strong><br/>${safe.pages}</p>
    <p><strong>Additional Notes:</strong><br/>${safe.notes}</p>
  `;

  const emailResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: `New Order - ${productConfig.label} - ${business}`,
      html,
      text,
    }),
  });

  const result = await emailResp.json();

  if (!emailResp.ok) {
    return res.status(500).json({ error: 'Email send failed', details: result });
  }

  let customerSubject = `We received your ${productConfig.label} order`;
  let customerHtml = `
    <p>Thanks for your order.</p>
    <p>We received your details for <strong>${safe.business}</strong> and will use them to prepare your <strong>${safe.product}</strong>.</p>
    <p>Your order ID is <strong>${orderId}</strong>.</p>
    <p>If you need to add anything, reply to this email.</p>
  `;

  let customerText = [
    'Thanks for your order.',
    `We received your details for ${business} and will use them to prepare your ${productConfig.label}.`,
    `Your order ID is ${orderId}.`,
    'If you need to add anything, reply to this email.',
  ].join(' ');

  if (productConfig.fulfillment === 'download' && productConfig.downloadUrl) {
    customerSubject = `Your ${productConfig.label} is ready`;
    customerHtml = `
      <p>Thanks for your order.</p>
      <p>Your <strong>${safe.product}</strong> is ready.</p>
      <p><a href="${productConfig.downloadUrl}">Download your kit</a></p>
      <p>Your order ID is <strong>${orderId}</strong>.</p>
      <p>If you want us to tailor the guidance to your site, reply with your website details.</p>
    `;
    customerText = [
      'Thanks for your order.',
      `Your ${productConfig.label} is ready.`,
      `Download: ${productConfig.downloadUrl}`,
      `Order ID: ${orderId}.`,
      'If you want us to tailor the guidance to your site, reply with your website details.',
    ].join(' ');
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: customerSubject,
        html: customerHtml,
        text: customerText,
      }),
    });
  } catch (e) {
    // non-fatal
  }

  return res.status(200).json({
    ok: true,
    orderId,
    product: productConfig.label,
    fulfillment: productConfig.fulfillment,
  });
}
