import React, { Suspense, useEffect } from "react";
import { useSelector } from "react-redux";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";

const Request = React.lazy(() => import("./Request"));
const AnsweredResponse = React.lazy(() => import("./AnsweredResponse"));
const FinishedResponse = React.lazy(() => import("./FinishedResponse"));
const Home = React.lazy(() => import("./Welcome"));
const DutySelection = React.lazy(() => import("./duty-selection"));

const privateRoutes = [
  {
    path: "/welcome",
    element: Home,
    title: "Ana Sayfa",
    pageName: "Home",
    checkRole: true,
  },
  {
    path: "/request",
    element: Request,
    title: "Talep Oluştur",
    pageName: "Request",
    checkRole: true,
  },
  {
    path: "/answered-request",
    element: AnsweredResponse,
    title: "Yanıtlanan Talepler",
    pageName: "AnsweredResponse",
    checkRole: true,
  },
  {
    path: "/finished-request",
    element: FinishedResponse,
    title: "Tamamlanan Talepler",
    pageName: "FinishedResponse",
    checkRole: true,
  },
  {
    path: "/duty-selection",
    element: DutySelection,
    title: "Nöbet Seçimi",
    pageName: "DutySelection",
    checkRole: true,
  },
];

function RenderRoutes() {
  const user = useSelector((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();

  const isAllowed = privateRoutes.find(
    (route) => route.path === location.pathname
  );

  const navigated = location?.state?.navigated;

  const redirectPath = privateRoutes.find(
    (item) => item.path === localStorage.getItem("redirectPath")
  )?.path;

  const navigateToDefault = () => {
    navigate("/welcome", {
      state: {
        navigated: true,
      },
    });
  };

  useEffect(() => {
    if (isAllowed) {
      navigate(isAllowed.path);
    }
    if (!isAllowed) {
      navigateToDefault();
    }
  }, [isAllowed]);

  return (
    <Suspense>
      <Routes>
        {privateRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<route.element />}
          />
        ))}
      </Routes>
    </Suspense>
  );
}

export { privateRoutes };

export default RenderRoutes;