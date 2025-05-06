import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const ConfrimUser = React.lazy(() => import("./ConfrimUser"));
const ResetPassword = React.lazy(() => import("./resetpassword"));
const Login = React.lazy(() => import("./Login"));
const homepage = React.lazy(() => import("./homepage"));

const publicRoutes = [
  {
    path: "/homepage",
    element: homepage,
    title: "CuraNodus Ana Sayfa",
  },
  {
    path: "/login",
    element: Login,
    title: "İlacım Nerede",
  },
  {
    path: "/confrimuser",
    element: ConfrimUser,
    title: "İlacım Nerede Doğrulama",
  },
  {
    path: "/resetpassword",
    element: ResetPassword,
    title: "İlacım Nerede Şifre Sıfırlama",
  },
  {
    path: "/*",
    element: () => <Navigate to="/homepage" />,
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