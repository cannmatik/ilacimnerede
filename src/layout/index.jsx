import React from "react";

// 3rd Party
import { useSelector } from "react-redux";

import "./style.scss";
import Success from "../Pages/Success";
import Main from "./Main";
import { useLocation } from "react-router-dom";
import Header from "./Header";

const Public = React.lazy(() => import("../routes/public.jsx"));

function Layout() {
  const userLoggedIn = useSelector((state) => {
    console.log(state);
    return state.user.isLoggedIn;
  });
  console.log(userLoggedIn, "Logged in?");

  return (
    <React.Suspense fallback={<div>Loading dialog box...</div>}>
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
