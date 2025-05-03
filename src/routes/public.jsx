import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const ConfrimUser = React.lazy(() => import("./ConfrimUser"));
const ResetPassword = React.lazy(() => import("./resetpassword"));
const Login = React.lazy(() => import("./Login"));

const publicRoutes = [
  {
    path: "/login",
    element: Login,
    title: "Ilacım Nerede",
  },
  {
    path: "/confrimuser",
    element: ConfrimUser,
    title: "Ilacım Nerede Doğrulama",
  },
  {
    path: "/resetpassword",
    element: ResetPassword,
    title: "Ilacım Nerede Şifre Sıfırlama",
  },
  {
    path: "/*",
    element: () => <Navigate to="/login" />,
  },
];

function RenderRoutes() {
  return (
    <React.Suspense
      fallback={
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Yükleniyor...</div>
        </div>
      }
    >
      <Routes>
        {publicRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<route.element />}
          />
        ))}
      </Routes>
    </React.Suspense>
  );
}

export { publicRoutes };

export default RenderRoutes;