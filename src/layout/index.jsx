import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";

import "./style.scss";
import Main from "./Main";
import Header from "./Header";

const Public = React.lazy(() => import("../routes/public.jsx"));

function Layout() {
  const userLoggedIn = useSelector((state) => state.user.isLoggedIn);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef(null);

  // Kullanıcı doğrulama işlemi
  useEffect(() => {
    const checkAuth = async () => {
      const authCheckResult = await checkUserAuth();
      setIsAuthChecked(true);
      if (authCheckResult) {
        // Progressi 100'e ayarla ve ardından yönlendir
        setProgress(100);
        window.location.href = "/home";
      }
    };

    checkAuth();
  }, []);

  // Yükleme ilerlemesi
  useEffect(() => {
    if (isAuthChecked && progressIntervalRef.current === null) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
            return 100;
          }
          return Math.min(prevProgress + Math.random() * 10, 100);
        });
      }, 60);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isAuthChecked]);

  // Auth kontrolü tamamlanmadıysa veya yükleme devam ediyorsa
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

  // Auth kontrolü tamamlandığında
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
  const token = localStorage.getItem("authToken");
  if (token) {
    try {
      const response = await fetch("/api/validate-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Token doğrulama hatası:", error);
      return false;
    }
  }
  return false;
};
