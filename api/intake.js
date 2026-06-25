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

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL || 'orders@localaiaudit.com';
  const toEmail = process.env.TO_EMAIL || 'Hudsonhotshotsmoving@yahoo.com';

  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not set' });
  }

  const text = [
    `Product: ${product}`,
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
    <h2>New Local AI Audit Order</h2>
    <p><strong>Product:</strong> ${product}</p>
    <p><strong>Business Name:</strong> ${business}</p>
    <p><strong>Website URL:</strong> ${website}</p>
    <p><strong>City:</strong> ${city}</p>
    <p><strong>Main Service:</strong> ${service}</p>
    <p><strong>Website Platform:</strong> ${platform}</p>
    <p><strong>Customer Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone || ''}</p>
    <p><strong>Competitors:</strong><br/>${(competitors || '').replace(/\n/g, '<br/>')}</p>
    <p><strong>Key Pages To Improve First:</strong><br/>${(pages || '').replace(/\n/g, '<br/>')}</p>
    <p><strong>Additional Notes:</strong><br/>${(notes || '').replace(/\n/g, '<br/>')}</p>
  `;

  const emailResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: `New Local AI Audit Order - ${business}`,
      html,
      text,
    }),
  });

  const result = await emailResp.json();

  if (!emailResp.ok) {
    return res.status(500).json({ error: 'Email send failed', details: result });
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: 'We received your Local AI Audit order',
        html: `<p>Thanks for your order.</p><p>We received your details for <strong>${business}</strong> and will use them to prepare your ${product}.</p><p>If you need to add anything, reply to this email.</p>`,
        text: `Thanks for your order. We received your details for ${business} and will use them to prepare your ${product}. If you need to add anything, reply to this email.`,
      }),
    });
  } catch (e) {
    // Non-fatal if confirmation email fails.
  }

  return res.status(200).json({ ok: true, result });
}
