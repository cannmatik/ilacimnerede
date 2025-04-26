// Supabase client’ı esm.sh üzerinden import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0?target=deno";
// Google Auth Library’yi esm.sh üzerinden import
import { JWT } from "https://esm.sh/google-auth-library@9.3.0?target=deno";
// JSON’ı Deno JSON modülü olarak import et
import serviceAccount from "../service-account.json" assert { type: "json" };

// Özel env değişkenleri
const supabase = createClient(
  Deno.env.get("IlacimNerede_SUPABASE_URL") ?? "",
  Deno.env.get("IlacimNerede_SUPABASE_KEY") ?? ""
);

// Google OAuth2 access token alma
async function getAccessToken({ clientEmail, privateKey }) {
  return new Promise((resolve, reject) => {
    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });
    jwtClient.authorize((err, tokens) => {
      if (err) return reject(err);
      resolve(tokens.access_token);
    });
  });
}

// Edge Function tetikleyicisi
export default async (req) => {
  try {
    const { record } = await req.json();              // INSERT edilen response kaydı
    const requestId = record.request_id;              

    // 1) request tablosundan user_id al
    const { data: reqData, error: reqErr } = await supabase
      .from("request")
      .select("user_id")
      .eq("id", requestId)
      .single();
    if (reqErr || !reqData) throw new Error("Request bulunamadı");

    const userId = reqData.user_id;

    // 2) profiles tablosundan fcm_token al
    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("fcm_token")
      .eq("id", userId)
      .single();
    if (profErr || !prof?.fcm_token) throw new Error("FCM token bulunamadı");

    const fcmToken = prof.fcm_token;

    // 3) Google OAuth token al
    const accessToken = await getAccessToken({
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    });

    // 4) FCM bildirimi gönder
    const fcmRes = await fetch(
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
              title: "Talebiniz Yanıtlandı",
              body: record.message_text || "Eczacınız talebinizi yanıtladı.",
            },
          },
        }),
      }
    );

    const fcmJson = await fcmRes.json();
    if (fcmRes.status < 200 || fcmRes.status > 299) {
      throw new Error(JSON.stringify(fcmJson));
    }

    return new Response(JSON.stringify(fcmJson), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Push Gönderme Hatası:", err);
    return new Response(
      JSON.stringify({ error: "Push gönderilemedi" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
