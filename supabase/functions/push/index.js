import { encodeBase64Url } from "https://deno.land/std@0.224.0/encoding/base64url.ts";
import serviceAccount from "../service-account.json" assert { type: "json" };

// Çevre değişkenlerini kontrol et
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  const msg = `Çevre değişkenleri eksik: SUPABASE_URL=${SUPABASE_URL}, SUPABASE_KEY=${SUPABASE_KEY ? "tanımlı" : "tanımsız"}`;
  console.error(msg);
  throw new Error(msg);
}

// Supabase REST API sorguları
async function getRequestUuid(requestId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/request?id=eq.${requestId}&select=uuid`, {
    headers: {
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "apikey": SUPABASE_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Request sorgusu başarısız: ${error}`);
  }
  const [data] = await res.json();
  if (!data) throw new Error("Request bulunamadı");
  return data.uuid;
}

async function getUserData(userUuid) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user?uuid=eq.${userUuid}&select=fcm_token,name`, {
    headers: {
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "apikey": SUPABASE_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`User sorgusu başarısız: ${error}`);
  }
  const [data] = await res.json();
  if (!data?.fcm_token) throw new Error("FCM token bulunamadı");
  return data;
}

async function getPharmacyName(pharmacyId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/pharmacy?id=eq.${pharmacyId}&select=name`, {
    headers: {
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "apikey": SUPABASE_KEY,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Pharmacy sorgusu başarısız: ${error}`);
  }
  const [data] = await res.json();
  return data?.name || "Eczane";
}

// Google OAuth2 access token alma (manuel JWT)
async function getAccessToken({ clientEmail, privateKey }) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj) => encodeBase64Url(new TextEncoder().encode(JSON.stringify(obj)));
  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const jwt = `${unsignedToken}.${encodeBase64Url(new Uint8Array(signature))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Access token alınamadı: ${error}`);
  }

  const { access_token } = await res.json();
  return access_token;
}

function pemToArrayBuffer(pem) {
  const cleaned = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(cleaned);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}

// Edge fonksiyonu
export default async (req) => {
  try {
    console.log("Fonksiyon tetiklendi");
    const rawBody = await req.text();
    console.log("Gelen istek gövdesi:", rawBody);

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (err) {
      console.error("JSON parse hatası:", err);
      throw new Error("Geçersiz JSON formatı");
    }

    const { request_id, message_text, pharmacy_id } = payload;
    if (!request_id) throw new Error("request_id zorunlu");

    // 1) request tablosundan uuid al
    const userUuid = await getRequestUuid(request_id);

    // 2) user tablosundan fcm_token al
    const { fcm_token: fcmToken, name: userName = "Kullanıcı" } = await getUserData(userUuid);

    // 3) Eczane bilgisi
    let pharmacyName = "Eczane";
    if (pharmacy_id) {
      pharmacyName = await getPharmacyName(pharmacy_id);
    }

    // 4) Access token al
    const accessToken = await getAccessToken({
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    });

    // 5) FCM bildirimi gönder
    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: {
              title: `${pharmacyName} Talebinizi Yanıtladı`,
              body: `${userName}, talebinize yanıt: ${message_text || "Eczacınız talebinizi yanıtladı."}`,
            },
            data: {
              request_id: request_id.toString(),
              pharmacy_id: pharmacy_id?.toString() || "",
            },
          },
        }),
      }
    );

    const fcmJson = await fcmResponse.json();
    if (!fcmResponse.ok) {
      throw new Error(`FCM hatası: ${JSON.stringify(fcmJson)}`);
    }

    return new Response(JSON.stringify({ success: true, data: fcmJson }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Push gönderme hatası:", err);
    return new Response(
      JSON.stringify({ error: `Push gönderilemedi: ${err.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};