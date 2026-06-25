import type { Config, Context } from "@netlify/functions";
import { createOrder, getOrder, json, listOrders, notifyOrder, updateOrderStatus } from "./_intake-shared.mjs";

function isAuthorized(req: Request) {
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    return false;
  }

  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${adminToken}`;
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);

  if (req.method === "POST" && !context.params.orderNumber) {
    const payload = await req.json().catch(() => null);
    if (!payload) {
      return json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const created = await createOrder(payload);
    if (!created.ok) {
      return json({ error: created.error, missing: "missing" in created ? created.missing : undefined }, { status: created.status });
    }

    context.waitUntil(notifyOrder(created.order));

    return json(
      {
        ok: true,
        orderId: created.order.orderNumber,
        product: created.order.productLabel,
        fulfillment: created.order.fulfillment,
        status: created.order.status,
      },
      { status: 201 },
    );
  }

  if (!isAuthorized(req)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (req.method === "GET" && context.params.orderNumber) {
    const order = await getOrder(context.params.orderNumber);
    if (!order) {
      return json({ error: "Not found" }, { status: 404 });
    }

    return json({ order });
  }

  if (req.method === "GET") {
    const status = url.searchParams.get("status");
    const found = await listOrders(status);
    return json({ orders: found });
  }

  if (req.method === "PATCH" && context.params.orderNumber) {
    const payload = await req.json().catch(() => null);
    const order = await updateOrderStatus(context.params.orderNumber, payload?.status);
    if (!order) {
      return json({ error: "Invalid order or status" }, { status: 400 });
    }

    return json({ order });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: ["/api/intake", "/api/orders", "/api/orders/:orderNumber"],
};
