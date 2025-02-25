import React, { useEffect } from "react";
import Layout from "./layout";
import { useLocation } from "react-router-dom";
import { privateRoutes } from "@routes/private";
import { SpeedInsights } from "@vercel/speed-insights/react";

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
      {/* Vercel Speed Insights entegrasyonu. 
           */}
      <SpeedInsights projectId="prj_XlxS1b6hBbV76nFQLGQ6ehRriEPS" />
      <Layout />
    </>
  );
}

export default App;
