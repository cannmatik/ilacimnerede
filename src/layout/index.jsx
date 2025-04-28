import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import "./style.scss";
import Main from "./Main";
import Header from "./Header";

const Public = React.lazy(() => import("../routes/public.jsx"));

function Layout() {
  const userLoggedIn = useSelector((state) => state.user.isLoggedIn);

  useEffect(() => {
    const checkAuth = async () => {
      const authCheckResult = await checkUserAuth();
      if (authCheckResult) {
        window.location.href = "/home";
      }
    };

    checkAuth();
  }, []);

  return (
    <React.Suspense
      fallback={
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Yükleniyor...</div>
        </div>
      }
    >
      <div className="layout-wrapper">
        {userLoggedIn ? (
          <>
            <Header />
            <Main />
          </>
        ) : (
          <Public />
        )}
      </div>
    </React.Suspense>
  );
}

export default Layout;

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