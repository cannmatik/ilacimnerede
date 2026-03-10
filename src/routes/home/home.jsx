import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Avatar,
  Chip,
  Divider,
} from "@mui/material";
import {
  Favorite,
  Medication,
  Phone,
  Group,
  Close,
  LinkedIn,
  WhatsApp,
  Email,
  LocationOn,
  ArrowForward,
  AutoAwesome,
  HealthAndSafety,
  Speed,
  Verified,
} from "@mui/icons-material";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./home.scss";

gsap.registerPlugin(ScrollTrigger);

// ─── Floating Particles ────────────────────────────────────────────────
function FloatingParticles() {
  return (
    <div className="particles-container">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Feature Card for "Neden CuraNodus" ────────────────────────────────
function FeatureCard({ icon, title, description, delay }) {
  const ref = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 40, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        delay,
        ease: "back.out(1.4)",
        scrollTrigger: { trigger: ref.current, start: "top 85%" },
      }
    );
  }, [delay]);

  return (
    <Box ref={ref} className="feature-card">
      <Box className="feature-icon-wrapper">{icon}</Box>
      <Typography variant="h6" className="feature-title">
        {title}
      </Typography>
      <Typography className="feature-desc">{description}</Typography>
    </Box>
  );
}

// ─── Team Member Card ──────────────────────────────────────────────────
function TeamMember({ name, role, description, linkedin, avatarLetter }) {
  return (
    <Box className="team-member-card">
      <Avatar className="team-avatar">{avatarLetter}</Avatar>
      <Typography variant="h6" className="team-name">
        {name}
      </Typography>
      <Chip label={role} size="small" className="team-role-chip" />
      <Typography className="team-desc">{description}</Typography>
      <Button
        href={linkedin}
        target="_blank"
        rel="noopener noreferrer"
        startIcon={<LinkedIn />}
        className="team-linkedin-btn"
        size="small"
      >
        LinkedIn
      </Button>
    </Box>
  );
}

// ─── Main Home Component ───────────────────────────────────────────────
function Home() {
  const [teamOpen, setTeamOpen] = useState(false);

  // GSAP refs
  const heroRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroDescRef = useRef(null);
  const heroBtnRef = useRef(null);
  const sectionRefs = useRef([]);

  // Hero animation
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      heroTitleRef.current,
      { opacity: 0, y: 60, clipPath: "inset(0 0 100% 0)" },
      { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)", duration: 1 }
    )
      .fromTo(
        heroDescRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8 },
        "-=0.4"
      )
      .fromTo(
        heroBtnRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.5 },
        "-=0.3"
      );
  }, []);

  // Section scroll animations
  useEffect(() => {
    sectionRefs.current.forEach((el) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
          },
        }
      );
    });
  }, []);

  const addSectionRef = (el) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };

  return (
    <>
      {/* ═══════════ HERO SECTION ═══════════ */}
      <Box ref={heroRef} className="hero-section">
        <FloatingParticles />
        <Box className="hero-gradient-overlay" />
        <Container maxWidth="md" className="hero-content">
          <Box className="hero-badge">
            <AutoAwesome sx={{ fontSize: 16 }} />
            <Typography variant="caption">Sağlık Teknolojisinde Yenilik</Typography>
          </Box>
          <Typography
            ref={heroTitleRef}
            variant="h2"
            component="h1"
            className="hero-title"
          >
            CuraNodus'a
            <br />
            <span className="hero-title-accent">Hoş Geldiniz</span>
          </Typography>
          <Typography ref={heroDescRef} className="hero-description">
            CuraNodus Yazılım Teknolojileri, 2025 yılında kurulan yenilikçi bir
            teknoloji şirketidir. Sağlık sektöründe devrim yaratan çözümler
            sunarak, kullanıcıların hayatını kolaylaştırmayı hedefliyoruz.
          </Typography>
          <Box ref={heroBtnRef}>
            <Button
              variant="contained"
              size="large"
              className="hero-cta"
              endIcon={<ArrowForward />}
              onClick={() => {
                document
                  .getElementById("why-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Keşfet
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ═══════════ WHY CURANODUS ═══════════ */}
      <Box id="why-section" className="section section-why" ref={addSectionRef}>
        <Container maxWidth="lg">
          <Typography variant="h4" className="section-title">
            <Group className="section-icon" /> Neden CuraNodus?
          </Typography>
          <Typography className="section-subtitle">
            Genç, dinamik ve tecrübeli ekibimizle sağlık sektörüne yenilikçi
            çözümler sunuyoruz.
          </Typography>
          <Box className="features-grid">
            <FeatureCard
              icon={<HealthAndSafety sx={{ fontSize: 40, color: "#0097b2" }} />}
              title="Sağlık Odaklı"
              description="Sağlık sektöründeki ihtiyaçları derinlemesine analiz ederek, kullanıcı odaklı çözümler üretiyoruz."
              delay={0}
            />
            <FeatureCard
              icon={<Speed sx={{ fontSize: 40, color: "#25b597" }} />}
              title="Hızlı & Güvenilir"
              description="Teknolojiyi kullanarak sağlık hizmetlerine erişimi daha hızlı, güvenli ve etkili hale getiriyoruz."
              delay={0.15}
            />
            <FeatureCard
              icon={<Verified sx={{ fontSize: 40, color: "#007a93" }} />}
              title="Yenilikçi Çözümler"
              description="Yeni teknolojilere hızla adapte olarak, sürdürülebilir ve yenilikçi çözümler sunuyoruz."
              delay={0.3}
            />
          </Box>
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button
              variant="outlined"
              className="section-btn-outlined"
              onClick={() => setTeamOpen(true)}
            >
              Ekibimizi Tanıyın
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ═══════════ İLACIM NEREDE ═══════════ */}
      <Box className="section section-app" ref={addSectionRef}>
        <Container maxWidth="lg">
          <Box className="app-card">
            <Box className="app-card-glow" />
            <Box className="app-card-content">
              <Chip
                icon={<Medication />}
                label="İlk Uygulamamız"
                className="app-chip"
              />
              <Typography variant="h4" className="app-title">
                İlacım Nerede
              </Typography>
              <Typography className="app-description">
                İlacım Nerede, eczaneleri tek tek aramak veya fiziksel olarak
                ziyaret etmek yerine, kullanıcıların ilaç taleplerini hızlıca
                oluşturup yüzlerce eczaneye sorgu göndermesini sağlar. Bu sayede,
                ilaç arayanları en kısa sürede doğru eczanelerle buluşturur.
              </Typography>
              <Typography className="app-description" sx={{ mt: 1 }}>
                Uygulamamız, hem kullanıcıların zamanını korur hem de eczanelerin
                iş süreçlerini optimize eder.
              </Typography>
              <Button
                variant="contained"
                href="https://www.ilacimnerede.com"
                target="_blank"
                className="app-cta"
                endIcon={<ArrowForward />}
                sx={{ mt: 3 }}
              >
                Detaylar için Tıklayın
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ═══════════ CONTACT ═══════════ */}
      <Box className="section section-contact" ref={addSectionRef}>
        <Container maxWidth="md">
          <Typography variant="h4" className="section-title" sx={{ color: "#fff" }}>
            <Phone className="section-icon" /> İletişim
          </Typography>
          <Box className="contact-grid">
            <Box className="contact-item">
              <LocationOn className="contact-icon" />
              <Box>
                <Typography className="contact-label">Adres</Typography>
                <Typography className="contact-value">
                  Kolektif House Levent, Talatpaşa Cd. No: 5/1, 34394
                  Şişli/İstanbul
                </Typography>
              </Box>
            </Box>
            <Box className="contact-item">
              <Phone className="contact-icon" />
              <Box>
                <Typography className="contact-label">Telefon</Typography>
                <Typography className="contact-value">0850 304 21 93</Typography>
              </Box>
            </Box>
            <Box className="contact-item">
              <Email className="contact-icon" />
              <Box>
                <Typography className="contact-label">E-posta</Typography>
                <Typography className="contact-value">
                  <a href="mailto:ilacimnerede@curanodus.com">
                    ilacimnerede@curanodus.com
                  </a>
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button
              variant="contained"
              href="https://api.whatsapp.com/send/?phone=908503042193&text&type=phone_number&app_absent=0"
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<WhatsApp />}
              className="whatsapp-btn"
              size="large"
            >
              WhatsApp'tan Yazın
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ═══════════ FOOTER ═══════════ */}
      <Box className="home-footer">
        <Typography className="footer-text">
          ©2025, CuraNodus Yazılım Teknolojileri Limited Şirketi. Tüm Hakları
          Saklıdır.
        </Typography>
      </Box>

      {/* ═══════════ TEAM DIALOG ═══════════ */}
      <Dialog
        open={teamOpen}
        onClose={() => setTeamOpen(false)}
        maxWidth="sm"
        fullWidth
        className="team-dialog"
        PaperProps={{ className: "team-dialog-paper" }}
      >
        <DialogTitle className="team-dialog-title">
          <Typography variant="h5" component="span" fontWeight={700}>
            Ekibimiz
          </Typography>
          <IconButton onClick={() => setTeamOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent className="team-dialog-content">
          <TeamMember
            name="Can Matik"
            role="Kurucu"
            avatarLetter="CM"
            description="CuraNodus'un kurucusu, web paneli ve veritabanı geliştirme sorumlusu. Sovos Türkiye ve Sorgera'da SAP ABAP Danışmanı, daha önce Microsoft'ta görev aldı. Mimar Sinan ve İstanbul Bilgi Üniversitesi Matematik mezunu."
            linkedin="https://www.linkedin.com/in/can-matik/"
          />
          <Divider sx={{ my: 2 }} />
          <TeamMember
            name="Alper Ürker"
            role="Mobil / Backend Geliştirici"
            avatarLetter="AÜ"
            description="10 yılı aşkın deneyime sahip Kıdemli Uygulama Geliştiricisi. Gedik Yatırım, Demirören, Scorp ve Huawei'de çalıştı. Koç Üniversitesi Bilgisayar Mühendisliği mezunu."
            linkedin="https://www.linkedin.com/in/alper-tolga-urker/"
          />
          <Divider sx={{ my: 2 }} />
          <TeamMember
            name="Mustafa Acar"
            role="İş Geliştirme ve Süreç Yöneticisi"
            avatarLetter="MA"
            description="İş geliştirme ve süreç optimizasyonunda deneyimli lider. NTT DATA, Sovos Türkiye ve Detaysoft'ta görev yaptı. İTÜ İşletme ve Teknoloji Yönetimi YL, MSGSÜ Matematik mezunu."
            linkedin="https://www.linkedin.com/in/mustafa34acar/"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Home;