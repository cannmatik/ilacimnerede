import React from "react";
import Layout from "./layout";
import { useLocation } from "react-router-dom";
import { privateRoutes } from "@routes/private";

function App() {
  const location = useLocation();

  const privatePath = privateRoutes.find(
    (route) => route.path === location.pathname
  )?.path;

  if (privatePath) {
    localStorage.setItem("redirectPath", privatePath);
  }
  return (
    <>
      <Layout />
    </>
  );
}

export default App;
