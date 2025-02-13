import React, { useEffect } from "react";
import Layout from "./layout";
import { useLocation } from "react-router-dom";
import { privateRoutes } from "@routes/private";

function App() {
  const location = useLocation();

  useEffect(() => {
    const privatePath = privateRoutes.find(
      (route) => route.path === location.pathname
    )?.path;

    if (privatePath) {
      localStorage.setItem("redirectPath", privatePath);
    }
  }, [location]);

  return (
    <>
      <Layout />
    </>
  );
}

export default App;
