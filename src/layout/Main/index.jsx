import React from "react";
import "./style.scss";

const Private = React.lazy(() => import("@routes/private"));

function Main() {
  return (
    <main>
      <Private />
    </main>
  );
}

export default Main;
