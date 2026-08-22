import crypto from "crypto";

const BASE = {
  sandbox: "https://api.lipila.dev",
  live: "https://blz.lipila.io",
} as const;

export type LipilaMode = "offline" | "sandbox" | "live";

export function lipilaMode(): LipilaMode {
  const mode = (process.env.LIPILA_MODE || "offline").toLowerCase();
  const hasKey = Boolean(process.env.LIPILA_API_KEY);
  if (mode === "live" && hasKey) return "live";
  if (mode === "sandbox" && hasKey) return "sandbox";
  return "offline";
}

function lipilaBase(): string {
  const mode = lipilaMode();
  if (mode === "offline") throw new Error("Lipila is in offline mode");
  return BASE[mode];
}

/** Convert a local phone like +260 97 700 0000 to the 2609700000000 format Lipila expects. */
export function normalizeZmPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("260")) return digits;
  if (digits.startsWith("0")) return "260" + digits.slice(1);
  return "260" + digits;
}

export type LipilaCollection = {
  status: string;
  identifier: string;
  referenceId: string;
  cardRedirectionUrl?: string | null;
  message?: string;
};

export async function lipilaCreateCardCollection(opts: {
  orderId: string;
  amountCents: number;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    zip: string;
  };
  backUrl: string;
  callbackUrl: string;
}): Promise<LipilaCollection> {
  if (lipilaMode() === "offline") throw new Error("Lipila is in offline mode");

  const res = await fetch(`${lipilaBase()}/api/v1/collections/card`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": process.env.LIPILA_API_KEY as string,
      callbackUrl: opts.callbackUrl,
    },
    body: JSON.stringify({
      customerInfo: {
        firstName: opts.customer.firstName,
        lastName: opts.customer.lastName,
        phoneNumber: normalizeZmPhone(opts.customer.phone),
        city: opts.customer.city,
        country: "ZM",
        address: opts.customer.address,
        email: opts.customer.email,
        zip: opts.customer.zip || "10101",
      },
      collectionRequest: {
        referenceId: opts.orderId,
        amount: opts.amountCents / 100,
        narration: "Online store order",
        accountNumber: normalizeZmPhone(opts.customer.phone),
        currency: "ZMW",
        backUrl: opts.backUrl,
        referenceData: opts.orderId,
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Lipila card collection ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    status?: string;
    identifier?: string;
    referenceId?: string;
    cardRedirectionUrl?: string | null;
    message?: string;
  };

  return {
    status: String(data.status || "Pending"),
    identifier: String(data.identifier || ""),
    referenceId: String(data.referenceId || opts.orderId),
    cardRedirectionUrl: data.cardRedirectionUrl ?? null,
    message: data.message,
  };
}

export async function lipilaCreateMoMoCollection(opts: {
  orderId: string;
  amountCents: number;
  accountNumber: string;
  email?: string;
  callbackUrl: string;
}): Promise<LipilaCollection> {
  if (lipilaMode() === "offline") throw new Error("Lipila is in offline mode");

  const res = await fetch(`${lipilaBase()}/api/v1/collections/mobile-money`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "x-api-key": process.env.LIPILA_API_KEY as string,
      callbackUrl: opts.callbackUrl,
    },
    body: JSON.stringify({
      referenceId: opts.orderId,
      amount: opts.amountCents / 100,
      narration: "Online store order",
      accountNumber: normalizeZmPhone(opts.accountNumber),
      currency: "ZMW",
      email: opts.email || undefined,
      referenceData: opts.orderId,
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Lipila MoMo collection ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    status?: string;
    identifier?: string;
    referenceId?: string;
    message?: string;
  };

  return {
    status: String(data.status || "Pending"),
    identifier: String(data.identifier || ""),
    referenceId: String(data.referenceId || opts.orderId),
    message: data.message,
  };
}

export async function lipilaCheckStatus(referenceId: string): Promise<{
  status: string;
  identifier?: string;
  message?: string;
}> {
  if (lipilaMode() === "offline") return { status: "Successful" };

  const res = await fetch(
    `${lipilaBase()}/api/v1/collections/check-status?referenceId=${encodeURIComponent(referenceId)}`,
    {
      headers: {
        accept: "application/json",
        "x-api-key": process.env.LIPILA_API_KEY as string,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) throw new Error(`Lipila check-status ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { status?: string; identifier?: string; message?: string };
  return {
    status: String(data.status || "Pending"),
    identifier: data.identifier,
    message: data.message,
  };
}

/**
 * Verify a Lipila webhook using the Standard Webhooks HMAC-SHA256 scheme
 * (webhook-id.timestamp.body signed with the base64 secret from the dashboard).
 */
export function verifyLipilaWebhook(rawBody: string, headers: Headers): { ok: boolean; reason?: string } {
  const secret = process.env.LIPILA_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: "LIPILA_WEBHOOK_SECRET not configured" };

  const webhookId = headers.get("webhook-id") || "";
  const timestamp = headers.get("webhook-timestamp") || "";
  const signature = headers.get("webhook-signature") || "";

  if (!webhookId || !timestamp || !signature) return { ok: false, reason: "Missing webhook headers" };

  // Reject replays older than 5 minutes.
  const ageSec = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (Number.isNaN(ageSec) || ageSec > 300) return { ok: false, reason: "Webhook timestamp too old" };

  const key = Buffer.from(secret, "base64");
  const signedPayload = `${webhookId}.${timestamp}.${rawBody}`;
  const expected = "v1," + crypto.createHmac("sha256", key).update(signedPayload).digest("base64");

  const received = signature.split(" ");
  const valid = received.some((sig) => {
    const a = Buffer.from(expected);
    const b = Buffer.from(sig.trim());
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });

  return valid ? { ok: true } : { ok: false, reason: "Signature mismatch" };
}
