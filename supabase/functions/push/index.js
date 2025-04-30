import { createClient } from "@supabase/supabase-js";
import { encodeBase64Url } from "std/encoding/base64url.ts";
import { create, getNumericDate } from "djwt";

// Çevre değişkenlerini kontrol et
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const serviceAccount = {
  client_email: Deno.env.get("SERVICE_ACCOUNT_CLIENT_EMAIL"),
  private_key: Deno.env.get("SERVICE_ACCOUNT_PRIVATE_KEY"),
  project_id: Deno.env.get("SERVICE_ACCOUNT_PROJECT_ID"),
};

if (!SUPABASE_URL || !SUPABASE_KEY) {
  const msg = `Çevre değişkenleri eksik: SUPABASE_URL=${SUPABASE_URL}, SUPABASE_KEY=${SUPABASE_KEY ? "tanımlı" : "tanımsız"}`;
  console.error(msg);
  throw new Error(msg);
}

if (!serviceAccount.client_email || !serviceAccount.private_key || !serviceAccount.project_id) {
  const msg = `Service account bilgileri eksik: client_email=${serviceAccount.client_email}, private_key=${serviceAccount.private_key ? "tanımlı" : "tanımsız"}, project_id=${serviceAccount.project_id}`;
  console.error(msg);
  throw new Error(msg);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Google OAuth2 access token alma (djwt ile)
async function getAccessToken({ clientEmail, privateKey }) {
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: getNumericDate(new Date()),
    exp: getNumericDate(new Date(Date.now() + 3600 * 1000)),
  };

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const jwt = await create({ alg: "RS256", typ: "JWT" }, payload, key);

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
    const { data: requestData, error: requestError } = await supabase
      .from("request")
      .select("uuid")
      .eq("id", request_id)
      .single();

    if (requestError || !requestData) {
      throw new Error(`Request bulunamadı: ${requestError?.message || "Veri yok"}`);
    }

    const userUuid = requestData.uuid;

    // 2) user tablosundan fcm_token al
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("fcm_token, name")
      .eq("uuid", userUuid)
      .single();

    if (userError || !userData?.fcm_token) {
      throw new Error(`FCM token bulunamadı: ${userError?.message || "Token yok"}`);
    }

    const fcmToken = userData.fcm_token;
    const userName = userData.name || "Kullanıcı";

    // 3) Eczane bilgisi
    let pharmacyName = "Eczane";
    if (pharmacy_id) {
      const { data: pharmacyData } = await supabase
        .from("pharmacy")
        .select("name")
        .eq("id", pharmacy_id)
        .single();
      if (pharmacyData?.name) pharmacyName = pharmacyData.name;
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