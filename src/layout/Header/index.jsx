import { INButton } from "@components";
import { supabase } from "@routes/Login/useCreateClient";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { ilacimNeredeLogo } from "@assets";
import styles from "./style.module.scss";

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function signOutUser() {
    try {
      localStorage.clear();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Çıkış sırasında hata:", error);
      } else {
        dispatch({ type: "CLEAR_STORE" });
        navigate("/login");
      }
    } catch (err) {
      console.error("Çıkış yaparken bir hata oluştu", err);
    }
  }

  const activeStyle = {
    fontWeight: 500,
    color: "white",
  };

  const inactiveStyle = {
    fontWeight: 500,
    color: "black",
  };

  return (
    <header className={styles.header}>
      {/* Hamburger Menü */}
      <div 
        className={`${styles.hamburgerMenu} ${isMenuOpen ? styles.active : ""}`} 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Logo */}
      <div 
        className={styles.logoContainer} 
        onClick={() => navigate("/home")}
      >
        <img src={ilacimNeredeLogo} alt="İlaçım Nerede Logosu" />
      </div>

      {/* Navigasyon Menüsü */}
      <nav className={`${styles.nav} ${isMenuOpen ? styles.show : ""}`}>
        <NavLink
          to="/request"
          style={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
          onClick={() => setIsMenuOpen(false)}
        >
          Açık Talepler
        </NavLink>
        <NavLink
          to="/answered-request"
          style={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
          onClick={() => setIsMenuOpen(false)}
        >
          Cevaplanan Talepler
        </NavLink>
        <NavLink
          to="/finished-request"
          style={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
          onClick={() => setIsMenuOpen(false)}
        >
          Kapanan Talepler
        </NavLink>
        
        <INButton 
          text="Çıkış Yap" 
          onClick={signOutUser}
          className={styles.mobileLogout}
        />
      </nav>
    </header>
  );
}

export default Header;
