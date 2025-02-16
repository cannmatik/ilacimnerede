import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import "./style.scss";
import Main from "./Main";
import Header from "./Header";

const Public = React.lazy(() => import("../routes/public.jsx"));

function Layout() {
  const userLoggedIn = useSelector((state) => state.user.isLoggedIn);

  // Kullanıcı doğrulama işlemi (isteğe bağlı, burada auth kontrolü devam ediyorsa bile ekran hemen render edilir)
  useEffect(() => {
    const checkAuth = async () => {
      const authCheckResult = await checkUserAuth();
      if (authCheckResult) {
        window.location.href = "/home";
      }
    };

    checkAuth();
  }, []);

  // Yükleme ekranını kaldırdığımız için, direkt içerikleri render ediyoruz
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
