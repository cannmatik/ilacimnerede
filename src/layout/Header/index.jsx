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
      // console.log(error);
    }
    navigate("/login");
  }

  // Aktif link için stil objesi
  const activeStyle = {
    fontWeight: 500,
    color: "white", // Aktif link rengi (istediğiniz gibi değiştirin)
  };

  // Pasif link için stil objesi (isteğe bağlı)
  const inactiveStyle = {
    fontWeight: 500,
    color: "black", // Pasif link rengi (varsayılan)
  };

  return (
    <header>
      <div
        className="header-logo-container"
        style={{ cursor: "pointer" }}
        onClick={() => navigate("/home")}
      >
        <img src={ilacimNeredeLogo} alt="logo" />
      </div>

      <nav>
        <NavLink
          to="/request"
          style={({ isActive }) =>
            isActive ? activeStyle : inactiveStyle
          }
        >
          Açık Talepler
        </NavLink>
        <NavLink
          to="/answered-request"
          style={({ isActive }) =>
            isActive ? activeStyle : inactiveStyle
          }
        >
          Cevaplanan Talepler
        </NavLink>
        <NavLink
          to="/finished-request"
          style={({ isActive }) =>
            isActive ? activeStyle : inactiveStyle
          }
        >
          Kapanan Talepler
        </NavLink>
      </nav>

      <INButton text="Çıkış Yap" onClick={signOutUser}>
        Sign out
      </INButton>
    </header>
  );
}

export default Header;