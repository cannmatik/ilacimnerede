import React, { useEffect } from "react";
import Layout from "./layout";
import { useLocation } from "react-router-dom";
import { privateRoutes } from "@routes/private";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics, trackEvent } from "@vercel/analytics/react";

function App() {
  const location = useLocation();

  useEffect(() => {
    // Sayfa görüntüleme takibi (Analytics bileşeni otomatik toplasa da örnek olması açısından)
    trackEvent({
      eventName: "page_view",
      page: location.pathname,
    });

    const privatePath = privateRoutes.find(
      (route) => route.path === location.pathname
    )?.path;
    if (privatePath) {
      localStorage.setItem("redirectPath", privatePath);
    }
  }, [location]);

  // Buton tıklama ile özel olay takibi
  const handleButtonClick = () => {
    trackEvent({
      eventName: "button_click",
      category: "User Interaction",
      label: "Custom Event Button",
      value: 1,
    });
  };

  // Link tıklaması ile özel olay takibi
  const handleLinkClick = () => {
    trackEvent({
      eventName: "link_click",
      category: "Navigation",
      label: "Special Link",
    });
  };

  return (
    <>
      <SpeedInsights projectId="prj_XlxS1b6hBbV76nFQLGQ6ehRriEPS" />
      <Layout />
      <button onClick={handleButtonClick}>Tıklayın</button>
      <a href="#!" onClick={handleLinkClick}>
        Özel Link
      </a>
      <Analytics />
    </>
  );
}

export default App;
