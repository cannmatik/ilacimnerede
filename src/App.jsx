import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import Layout from "./layout";
import { privateRoutes } from "@routes/private";

// Opsiyonel AdBlock Popup tasarımı için basit stiller
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
    backgroundColor: "#25b597", // buton
    border: "none",
    padding: "0.75rem 1.5rem",
    color: "#f1ecec", // metin
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 600,
    marginRight: "1rem",
  },
  secondaryButton: {
    backgroundColor: "#333333", // koyu buton
    border: "none",
    padding: "0.75rem 1.5rem",
    color: "#f1ecec", // metin
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 600,
  },
};

// Basit popup bileşeni (modal gibi)
function AdBlockPopup({ onClose, onDisableForever }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.popupContainer}>
        <h2 style={styles.title}>AdBlock Tespit Edildi</h2>
        <p style={styles.message}>
          Görünüşe göre reklam engelleyici kullanıyorsunuz. Bu durum site
          analitiği ve bazı servislerin çalışmasını engelleyebilir. Lütfen
          devre dışı bırakmayı veya bu siteyi istisnaya eklemeyi düşünün.
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

  // AdBlock tespiti state'i
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  // Popup görünür mü?
  const [showAdBlockPopup, setShowAdBlockPopup] = useState(false);

  // Sayfa görüntüleme, route geçişlerinde analytics tetikleme
  useEffect(() => {
    // Kullanıcı daha önce "Bir Daha Gösterme" demişse tekrar attempt etmiyoruz
    const dismissed = localStorage.getItem("adBlockDismissed") === "forever";
    if (dismissed) return;

    // Dinamik import ile Vercel Analytics'i çekiyoruz
    import("@vercel/analytics")
      .then(({ track }) => {
        // track fonksiyonunu başarıyla aldık, sayfa görüntüleme
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
        // Eğer AdBlock veya başka bir sebepten dolayı engellendiyse
        console.warn("Analytics import edilemedi, muhtemelen AdBlock etkin:", err);
        setAdBlockDetected(true);
      });
  }, [location]);

  // AdBlock tespit edildiğinde popup aç
  useEffect(() => {
    const dismissed = localStorage.getItem("adBlockDismissed") === "forever";
    if (adBlockDetected && !dismissed) {
      setShowAdBlockPopup(true);
    }
  }, [adBlockDetected]);

  // Analytics'e gönderilecek diğer event'ler
  const handleButtonClick = () => {
    import("@vercel/analytics")
      .then(({ track }) => {
        track("button_click", {
          category: "User Interaction",
          label: "Custom Event Button",
          value: 1,
        });
      })
      .catch((err) => {
        console.warn("AdBlock engeli yüzünden track fonksiyonu yok:", err);
        setAdBlockDetected(true);
      });
  };

  const handleLinkClick = () => {
    import("@vercel/analytics")
      .then(({ track }) => {
        track("link_click", {
          category: "Navigation",
          label: "Special Link",
        });
      })
      .catch((err) => {
        console.warn("AdBlock engeli yüzünden track fonksiyonu yok:", err);
        setAdBlockDetected(true);
      });
  };

  // Popup düğmeleri
  const handleClosePopup = () => {
    // Yalnızca bu oturum için kapat
    setShowAdBlockPopup(false);
  };

  const handleDismissForever = () => {
    // Bir daha gösterme
    localStorage.setItem("adBlockDismissed", "forever");
    setShowAdBlockPopup(false);
  };

  return (
    <>
      {/* İsterseniz SpeedInsights'i bu şekilde de kullanabilirsiniz */}
      <SpeedInsights projectId="prj_XlxS1b6hBbV76nFQLGQ6ehRriEPS" />

      <Layout />

      <button onClick={handleButtonClick}>Tıklayın</button>
      <a href="#!" onClick={handleLinkClick}>
        Özel Link
      </a>

      {/* Analytics bileşeni yine duruyor, engellense bile site çökmez */}
      <Analytics />

      {showAdBlockPopup && (
        <AdBlockPopup
          onClose={handleClosePopup}
          onDisableForever={handleDismissForever}
        />
      )}
    </>
  );
}
