import React, { useEffect, useState } from "react";
import Layout from "./layout";
import { useLocation } from "react-router-dom";
import { privateRoutes } from "@routes/private";
import { Modal } from "antd";

// Logo veya görsel yolunuz
const LOGO_PATH = "/src/assets/ilacimNeredeLogo.svg";

function App() {
  const location = useLocation();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [alreadyAsked, setAlreadyAsked] = useState(false);

  useEffect(() => {
    // localStorage içinde "notificationPromptShown" varsa tekrar sormuyoruz
    const hasShown = localStorage.getItem("notificationPromptShown");
    if (hasShown) {
      setAlreadyAsked(true);
    }

    // Mevcut mantık: private route yakalama
    const privatePath = privateRoutes.find(
      (route) => route.path === location.pathname
    )?.path;
    if (privatePath) {
      localStorage.setItem("redirectPath", privatePath);
    }
  }, [location]);

  useEffect(() => {
    // Eğer tarayıcı Notification API destekliyorsa ve 
    // izin hala "default" ise ve daha önce popup göstermediysek => modal aç
    if (
      "Notification" in window &&
      Notification.permission === "default" &&
      !alreadyAsked
    ) {
      setShowPermissionModal(true);
    }
  }, [alreadyAsked]);

  // Modal onOk => kullanıcı "Evet" dedi
  const handleOk = () => {
    setShowPermissionModal(false);
    localStorage.setItem("notificationPromptShown", "true");
    // Tarayıcıya izin talebi gönder
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Kullanıcı bildirim izni verdi.");
      } else {
        console.log("Kullanıcı bildirim iznini reddetti veya kapattı.");
      }
    });
  };

  // Modal onCancel => kullanıcı "Hayır" dedi
  const handleCancel = () => {
    setShowPermissionModal(false);
    localStorage.setItem("notificationPromptShown", "true");
    console.log("Kullanıcı bildirim izni popup'ını kapattı/reddetti.");
  };

  return (
    <>
      <Layout />

      {/* İzin modalı */}
      <Modal
        open={showPermissionModal}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Evet"
        cancelText="Hayır"
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <img src={LOGO_PATH} alt="logo" width={40} height={40} />
            <span style={{ fontWeight: 600, color: "#333333" }}>
              Önemli Taleplerden Anında Haberdar Olmak İster misin?
            </span>
          </div>
        }
        bodyStyle={{
          backgroundColor: "#f1ecec", // Arkaplan
        }}
        okButtonProps={{
          style: {
            backgroundColor: "#25b597",
            borderColor: "#25b597",
            color: "#f1ecec",
          },
        }}
        cancelButtonProps={{
          style: {
            backgroundColor: "#333333",
            borderColor: "#333333",
            color: "#f1ecec",
          },
        }}
      >
        <div style={{ color: "#333333", marginTop: "0.75rem" }}>
          Yeni talepleri anında görmek için tarayıcı bildirimlerine izin
          verebilirsiniz.
        </div>
      </Modal>
    </>
  );
}

export default App;
