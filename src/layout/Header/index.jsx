import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@routes/Login/useCreateClient";
import { ilacimNeredeLogo } from "@assets";
import styles from "./style.module.scss";

// MUI Components
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  Typography,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

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

  const navLinks = [
    { to: "/request", label: "Açık Talepler" },
    { to: "/answered-request", label: "Cevaplanan Talepler" },
    { to: "/finished-request", label: "Kapanan Talepler" },
    { to: "/duty-selection", label: "Nöbet Seçimi" },
  ];

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <AppBar
      position="fixed"
      className={styles.header}
      sx={{ backgroundColor: "#25b597 !important" }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          minHeight: "80px !important",
          padding: "0 16px",
        }}
      >
        {/* Logo */}
        <Box
          onClick={() => navigate("/home")}
          sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <img
            src={ilacimNeredeLogo}
            alt="İlaçım Nerede Logosu"
            className={styles.logo}
          />
        </Box>

        {/* Hamburger Menu Icon */}
        <IconButton
          edge="end"
          color="inherit"
          aria-label="menu"
          onClick={() => setIsMenuOpen(true)}
          sx={{ display: { xs: "block", md: "none" } }}
        >
          <MenuIcon />
        </IconButton>

        {/* Desktop Navigation */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 3,
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            height: "100%",
            justifyContent: "center",
          }}
        >
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive
                  ? `${styles.navLink} ${styles.activeLink}`
                  : `${styles.navLink} ${styles.inactiveLink}`
              }
              onClick={handleNavClick}
            >
              <Typography
                variant="body1"
                sx={{ fontWeight: 700, lineHeight: "normal" }}
              >
                {link.label}
              </Typography>
            </NavLink>
          ))}
        </Box>

        {/* Logout Button */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            position: "absolute",
            right: "16px",
          }}
        >
          <Button
            variant="contained"
            onClick={signOutUser}
            className={`${styles.logoutButton} ${styles.navLink}`}
            sx={{
              backgroundColor: "#000000",
              color: "white",
              fontWeight: 700,
              padding: "6px 12px",
              minWidth: "auto",
              height: "fit-content",
              "&:hover": {
                backgroundColor: "#333333",
              },
            }}
          >
            Çıkış Yap
          </Button>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        PaperProps={{
          sx: { backgroundColor: "#25b597 !important" },
          className: styles.drawer,
        }}
      >
        <Box className={styles.drawerHeader}>
          <IconButton onClick={() => setIsMenuOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {navLinks.map((link) => (
            <ListItem
              key={link.to}
              component={NavLink}
              to={link.to}
              onClick={handleNavClick}
              sx={{
                fontWeight: 700,
                color: (theme) => theme.palette.text.primary,
                "&.active": {
                  color: "white",
                },
                "&:hover": {
                  color: "white",
                },
                textDecoration: "none",
              }}
              className={({ isActive }) =>
                isActive
                  ? `${styles.navLink} ${styles.activeLink}`
                  : `${styles.navLink} ${styles.inactiveLink}`
              }
            >
              <ListItemText primary={link.label} />
            </ListItem>
          ))}
          <ListItem>
            <Button
              variant="contained"
              onClick={signOutUser}
              className={`${styles.logoutButton} ${styles.mobileLogout} ${styles.navLink}`}
              sx={{
                backgroundColor: "#000000",
                color: "white",
                fontWeight: 700,
                padding: "6px 12px",
                minWidth: "auto",
                height: "fit-content",
                "&:hover": {
                  backgroundColor: "#333333",
                },
                width: "100%",
              }}
            >
              Çıkış Yap
            </Button>
          </ListItem>
        </List>
      </Drawer>
    </AppBar>
  );
}

export default Header;