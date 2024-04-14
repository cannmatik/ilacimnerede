import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const Login = React.lazy(() => import("./Login"));

const publicRoutes = [
  {
    path: "/login",
    element: Login,
    title: "Ilacım Nerede",
  },
  {
    path: "/*",
    element: () => <Navigate to="/login" />,
  },
];

function RenderRoutes() {
  return (
    <Routes>
      {publicRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={<route.element />} />
      ))}
    </Routes>
  );
}

export { publicRoutes };

export default RenderRoutes;
