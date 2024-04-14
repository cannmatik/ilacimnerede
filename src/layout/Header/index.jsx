import { INButton } from "@components";
import { supabase } from "@routes/Login/useCreateClient";
import React from "react";
import { useDispatch } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { ilacimNeredeLogo, ilacimNerede } from "@assets";
import "./style.module.scss";

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  async function signOutUser() {
    debugger;
    localStorage.clear();
    const { error } = await supabase.auth.signOut();
    setTimeout(() => {
      dispatch({ type: "CLEAR_STORE" });
    }, 1);
    debugger;
    if (error) {
      console.log(error);
    }
    navigate("/login");
  }
  return (
    <header>
      <div
        className="header-logo-container"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/success")}
      >
        <img src={ilacimNeredeLogo} alt="logo" />
      </div>

      <nav>
        <NavLink to="/request" style={{ fontWeight: 500 }}>
          Açık Talepler
        </NavLink>
        <NavLink to="#" style={{ fontWeight: 500 }}>
          Cevaplanan Talepler
        </NavLink>
        <NavLink to="#" style={{ fontWeight: 500 }}>
          Kapanan Talepler
        </NavLink>
      </nav>

      <INButton text="Log out" onClick={signOutUser}>
        Sign out
      </INButton>
    </header>
  );
}

export default Header;
