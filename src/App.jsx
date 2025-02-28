import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import Layout from "./layout";
import { privateRoutes } from "@routes/private";

// Opsiyonel AdBlock Popup tasarımı için örnek stiller
const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(51,51,51,0.7)", // #333333 yarı saydam
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  popupContainer: {
    backgroundColor: "#f1ecec",
    color: "#333333",
    padding: "2rem",
    borderRadius: "8px",
    maxWidth: "500px",
    width: "90%",
    textAlign: "center",
  },
  title: {
    marginBottom: "1rem",
  },
  message: {
    marginBottom: "1.5rem",
  },
  buttonRow: {
    display: "flex",
    justifyContent: "space-between",
  },
  primaryButton: {
    backgroundColor: "#25b597", 
    border: "none",
    padding: "0.75rem 1.5rem",
    color: "#f1ecec",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 600,
    marginRight: "1rem",
  },
  secondaryButton: {
    backgroundColor: "#333333",
    border: "none",
    padding: "0.75rem 1.5rem",
    color: "#f1ecec",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 600,
  },
};

// Popup bileşeni
function AdBlockPopup({ onClose, onDisableForever }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.popupContainer}>
        <h2 style={styles.title}>AdBlock Tespit Edildi</h2>
        <p style={styles.message}>
          Görünüşe göre reklam engelleyici kullanıyorsunuz. Bu durum site
          analitiği ve bazı servislerin çalışmasını engelleyebilir.
          Lütfen devre dışı bırakmayı veya bu siteyi istisnaya eklemeyi düşünün.
        </p>
        <div style={styles.buttonRow}>
          <button style={styles.primaryButton} onClick={onClose}>
            Kapat
          </button>
          <button style={styles.secondaryButton} onClick={onDisableForever}>
            Bir Daha Gösterme
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();

  // AdBlock tespiti
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [showAdBlockPopup, setShowAdBlockPopup] = useState(false);

  useEffect(() => {
    // Kullanıcı "Bir Daha Gösterme" demişse pop-up hiç açmayalım
    const dismissed = localStorage.getItem("adBlockDismissed") === "forever";
    if (dismissed) return;

    // Vercel Analytics'i dinamik (runtime) import ediyoruz
    import("@vercel/analytics")
      .then(({ track }) => {
        // track fonksiyonunu alıp sayfa görüntüleme kaydediyoruz
        track("page_view", { page: location.pathname });

        // privateRoutes ile localStorage'a path yazma örneği
        const privatePath = privateRoutes.find(
          (route) => route.path === location.pathname
        )?.path;
        if (privatePath) {
          localStorage.setItem("redirectPath", privatePath);
        }
      })
      .catch((err) => {
        // AdBlock engellemesi vb. durum
        console.warn("Analytics import edilemedi, muhtemelen AdBlock etkin:", err);
        setAdBlockDetected(true);
      });
  }, [location]);

  // AdBlock tespit edilirse ve kullanıcı "Bir Daha Gösterme" demediyse popup aç
  useEffect(() => {
    const dismissed = localStorage.getItem("adBlockDismissed") === "forever";
    if (adBlockDetected && !dismissed) {
      setShowAdBlockPopup(true);
    }
  }, [adBlockDetected]);

  // Kullanıcı Popup "Kapat" dediğinde sadece bu oturum için kapatıyoruz
  const handleClosePopup = () => {
    setShowAdBlockPopup(false);
  };

  // Kullanıcı "Bir Daha Gösterme" derse localStorage'a "forever" kaydedip tamamen kapatıyoruz
  const handleDismissForever = () => {
    localStorage.setItem("adBlockDismissed", "forever");
    setShowAdBlockPopup(false);
  };

  return (
    <>
      <SpeedInsights projectId="prj_XlxS1b6hBbV76nFQLGQ6ehRriEPS" />

      {/* Sayfa içeriği */}
      <Layout />

      {/* Vercel Analytics bileşeni – eğer AdBlock engellerse yine de siteyi çökertmez */}
      <Analytics />

      {/* AdBlock uyarısı */}
      {showAdBlockPopup && (
        <AdBlockPopup
          onClose={handleClosePopup}
          onDisableForever={handleDismissForever}
        />
      )}
    </>
  );
}
