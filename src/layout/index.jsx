import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import "./style.scss";
import Main from "./Main";
import Header from "./Header";

const Public = React.lazy(() => import("../routes/public.jsx"));

function Layout() {
  const userLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [progress, setProgress] = useState(0);

  // Kullanıcı doğrulama işlemi
  useEffect(() => {
    // Asenkron auth kontrolü yapılması gerekebilir
    const checkAuth = async () => {
      // Burada gerçek auth kontrolünü yapın
      const authCheckResult = await checkUserAuth(); // Auth kontrol fonksiyonu

      setIsAuthChecked(true);
    };

    checkAuth();
  }, []);

  // Yükleme ilerlemesi
  useEffect(() => {
    if (isAuthChecked) {
      const progressInterval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return Math.min(prevProgress + Math.random() * 10, 100);
        });
      }, 300);

      return () => clearInterval(progressInterval);
    }
  }, [isAuthChecked]);

  // Eğer auth kontrolü tamamlanmadıysa veya yükleme devam ediyorsa
  if (!isAuthChecked || progress < 100) {
    return (
      <div className="loading-container">
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="loading-text">Sayfa yükleniyor...</p>
      </div>
    );
  }

  // Eğer auth kontrolü tamamlandıysa ve progress %100 olduysa:
  return (
    <React.Suspense fallback={<div>Yükleniyor...</div>}>
      {userLoggedIn ? (
        <div className="layout-wrapper">
          <Header />
          <Main />
        </div>
      ) : (
        <Public />
      )}
    </React.Suspense>
  );
}

export default Layout;

// Kullanıcı doğrulama işlemi örneği
const checkUserAuth = async () => {
  // Burada gerçek auth kontrolünü yapın. Örnek olarak localStorage'dan auth token alınıyor
  const token = localStorage.getItem("authToken");
  return token !== null;
};
