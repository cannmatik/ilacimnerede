import React, { useRef, useState } from "react";
import { Box, Typography, Container, Grid, Button, Modal, Paper } from "@mui/material";
import { Favorite, Medication, Phone, Group, Close, LinkedIn, WhatsApp } from "@mui/icons-material";
import { motion, useInView } from "framer-motion";
import "./home.scss";

// Ana sayfa bileşenimiz: Tüm bölümleri (CuraNodus'a Hoş Geldiniz, Neden CuraNodus, İlacım Nerede, İletişim) içerir.
function Home() {
  // Modal'ın (popup) açık/kapalı durumunu kontrol eden state
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true); // Modal'ı açar
  const handleClose = () => setOpen(false); // Modal'ı kapatır

  // Her bölüm için kaydırma animasyonlarını tetiklemek amacıyla referanslar oluşturuyoruz
  const introRef = useRef(null); // Giriş bölümü için referans
  const whyUsRef = useRef(null); // Neden CuraNodus bölümü için referans
  const appRef = useRef(null); // İlacım Nerede bölümü için referans
  const contactRef = useRef(null); // İletişim bölümü için referans

  // Her bölümün görünürlüğünü kontrol eden useInView hook'ları
  // Bölüm ekrana geldiğinde animasyon tetiklenir (once: true ile bir kez çalışır)
  const introInView = useInView(introRef, { once: true, margin: "-100px" });
  const whyUsInView = useInView(whyUsRef, { once: true, margin: "-100px" });
  const appInView = useInView(appRef, { once: true, margin: "-100px" });
  const contactInView = useInView(contactRef, { once: true, margin: "-100px" });

  // Animasyon varyantları: Bölümlerin giriş animasyonlarını tanımlar
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 }, // Başlangıç durumu: Saydam, hafif küçültülmüş ve aşağıda
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut", type: "spring", stiffness: 100 }, // Görünür hale gelirken yumuşak bir yay efekti
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 }, // Başlangıç: Saydam ve yukarıda
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }, // Görünür hale gelirken yumuşak geçiş
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 }, // Başlangıç: Saydam ve aşağıda
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut", delay: 0.2 }, // Görünür hale gelirken hafif gecikme
    },
  };

  return (
    <>
      {/* Ana İçerik Alanı: Tüm bölümleri kapsar */}
      <Box className="homemain-content">
        {/* Parallax arka plan: Hafif bir derinlik efekti yaratır */}
        <div className="homeparallax-bg" />
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {/* Giriş Bölümü: Şirket tanıtımı */}
            <Grid item xs={12} ref={introRef}>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={introInView ? "visible" : "hidden"}
                className="homecard"
              >
                <motion.div variants={titleVariants} initial="hidden" animate={introInView ? "visible" : "hidden"}>
                  <Typography variant="h4" className="hometitle">
                    <Favorite className="homeicon" /> CuraNodus'a Hoş Geldiniz
                  </Typography>
                </motion.div>
                <motion.div variants={contentVariants} initial="hidden" animate={introInView ? "visible" : "hidden"}>
                  <Typography className="homebody-text">
                    CuraNodus Yazılım Teknolojileri Limited Şirketi, 2025 yılında kurulan yenilikçi
                    bir teknoloji şirketidir. Sağlık sektöründe devrim yaratan çözümler sunarak,
                    kullanıcıların hayatını kolaylaştırmayı hedefliyoruz. Teknolojiyi kullanarak
                    sağlık hizmetlerine erişimi daha hızlı, güvenli ve etkili hale getiriyoruz.
                  </Typography>
                </motion.div>
              </motion.div>
            </Grid>

            {/* Neden CuraNodus Bölümü: Ekibimizin farkını anlatır */}
            <Grid item xs={12} ref={whyUsRef}>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={whyUsInView ? "visible" : "hidden"}
                className="homecard"
              >
                <motion.div variants={titleVariants} initial="hidden" animate={whyUsInView ? "visible" : "hidden"}>
                  <Typography variant="h5" className="homesubtitle">
                    <Group className="homeicon" /> Neden CuraNodus?
                  </Typography>
                </motion.div>
                <motion.div variants={contentVariants} initial="hidden" animate={whyUsInView ? "visible" : "hidden"}>
                  <Typography className="homebody-text" sx={{ mb: 2 }}>
                    Ekibimiz, sektörde uzun yıllar tecrübe edinmiş ancak genç ve dinamik bireylerden
                    oluşuyor. Bu benzersiz kombinasyon, bize yeni teknolojilere hızla adapte olma ve
                    yenilikçi çözümler üretme gücü veriyor. Sağlık sektöründeki ihtiyaçları
                    derinlemesine analiz ederek, kullanıcı odaklı ve sürdürülebilir çözümler sunuyoruz.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleOpen}
                    className="homebutton"
                  >
                    Biz Kimiz?  
                  </Button>
                </motion.div>
              </motion.div>
            </Grid>

            {/* İlacım Nerede Bölümü: İlk uygulamamızı tanıtır */}
            <Grid item xs={12} ref={appRef}>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={appInView ? "visible" : "hidden"}
                className="homecard"
              >
                <motion.div variants={titleVariants} initial="hidden" animate={appInView ? "visible" : "hidden"}>
                  <Typography variant="h5" className="homesubtitle">
                    <Medication className="homeicon" /> İlk Uygulamamız: İlacım Nerede
                  </Typography>
                </motion.div>
                <motion.div variants={contentVariants} initial="hidden" animate={appInView ? "visible" : "hidden"}>
                  <Typography className="homebody-text" sx={{ mb: 2 }}>
                    İlacım Nerede, eczaneleri tek tek aramak veya fiziksel olarak ziyaret etmek yerine,
                    kullanıcıların ilaç taleplerini hızlıca oluşturup yüzlerce eczaneye sorgu
                    göndermesini sağlar. Bu sayede, ilaç arayanları en kısa sürede doğru eczanelerle
                    buluşturur. Uygulamamız, hem kullanıcıların zamanını korur hem de eczanelerin iş
                    süreçlerini optimize eder.
                  </Typography>
                  <Button
                    variant="contained"
                    href="https://www.ilacimnerede.com"
                    className="homebutton"
                  >
                    Detaylar için Tıklayın
                  </Button>
                </motion.div>
              </motion.div>
            </Grid>

            {/* İletişim Bilgileri Bölümü: İletişim bilgilerimizi içerir */}
            <Grid item xs={12} ref={contactRef}>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate={contactInView ? "visible" : "hidden"}
                className="homecard homecontact-card"
              >
                <motion.div variants={titleVariants} initial="hidden" animate={contactInView ? "visible" : "hidden"}>
                  <Typography variant="h5" className="homesubtitle">
                    <Phone className="homeicon" /> İletişim Bilgileri
                  </Typography>
                </motion.div>
                <motion.div variants={contentVariants} initial="hidden" animate={contactInView ? "visible" : "hidden"}>
                  <Typography className="homebody-text homecontact-info" sx={{ mb: 1 }}>
                    <strong>Adres:</strong> Kolektif House Levent, İstanbul, Esentepe, Talatpaşa Cd.
                    No: 5/1, 34394 Şişli/İstanbul
                  </Typography>
                  <Typography className="homebody-text homecontact-info" sx={{ mb: 1 }}>
                    <strong>Telefon:</strong> 0850 304 21 93 
                  </Typography>
                  <Typography className="homebody-text homecontact-info" sx={{ mb: 1 }}>
                    <strong>E-posta:</strong>{" "}
                    <a href="mailto:ilacimnerede@curanodus.com">ilacimnerede@curanodus.com</a>
                  </Typography>
                  <Button
                    variant="contained"
                    href="https://api.whatsapp.com/send/?phone=908503042193&text&type=phone_number&app_absent=0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="homebutton"
                    startIcon={<WhatsApp />}
                    sx={{ mt: 2 }}
                  >
                    Bize WhatsApp'tan Mesaj Göndermek İçin Tıklayın
                  </Button>
                </motion.div>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Altbilgi (Footer): Telif hakkı bilgisi */}
      <Box className="homefooter">
        <Typography className="homefooter-text">
          ©2025, CuraNodus Yazılım Teknolojileri Limited Şirketi. Tüm Hakları Saklıdır.
        </Typography>
      </Box>

      {/* Modal (Popup): Neden CuraNodus butonuna tıklayınca ekibimiz hakkında bilgi gösterir */}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="home-team-modal-title"
        className="homemodal"
      >
        <Paper className="homemodal-content">
          <Box className="homemodal-header">
            <Typography id="home-team-modal-title" variant="h6" className="homemodal-title">
              Ekibimiz
            </Typography>
            <Button onClick={handleClose} className="homemodal-close-button">
              <Close />
            </Button>
          </Box>
          <Box className="homemodal-body">
            {/* Can Matik Bilgileri */}
            <Typography variant="h6" className="hometeam-member-title" sx={{ mt: 2 }}>
              Can Matik - Kurucu
            </Typography>
            <Typography className="hometeam-member-info">
              CuraNodus’un kurucusu, web paneli ve veritabanı geliştirme ve diğer tüm süreçlerin sorumlusu. Sovos Türkiye ve Sorgera Yazılım Teknolojileri’de SAP ABAP Danışmanı olarak çalışıyor, daha önce Microsoft’ta görev aldı. Bulut uygulamaları ve sunum becerilerinde uzman. Mimar Sinan Güzel Sanatlar Üniversitesi ve İstanbul Bilgi Üniversitesi Matematik mezunu.
            </Typography>
            <Button
              href="https://www.linkedin.com/in/can-matik/"
              target="_blank"
              rel="noopener noreferrer"
              className="homelinkedin-button"
              startIcon={<LinkedIn />}
            >
              LinkedIn
            </Button>
            {/* Alper Ürker Bilgileri */}
            <Typography variant="h6" className="hometeam-member-title">
              Alper Ürker - Mobil / Backend Geliştirici
            </Typography>
            <Typography className="hometeam-member-info">
              10 yılı aşkın deneyime sahip Kıdemli Uygulama Geliştiricisi. Daha önce Gedik Yatırım, Demirören, Scorp ve Huawei’de çalıştı. Castaway Studios’un kurucu ortağı. Koç Üniversitesi Bilgisayar Mühendisliği mezunu.
            </Typography>
            <Button
              href="https://www.linkedin.com/in/alper-tolga-urker/"
              target="_blank"
              rel="noopener noreferrer"
              className="homelinkedin-button"
              startIcon={<LinkedIn />}
            >
              LinkedIn
            </Button>
            {/* Mustafa Acar Bilgileri */}
            <Typography variant="h6" className="hometeam-member-title" sx={{ mt: 2 }}>
              Mustafa Acar - İş Geliştirme ve Süreç Yöneticisi
            </Typography>
            <Typography className="hometeam-member-info">
              İş geliştirme ve süreç optimizasyonunda deneyimli lider. NTT DATA Business Solutions’ta Ürün Geliştirme Direktör Yardımcısı, Sovos Türkiye’de SAP ABAP ve Teknik Süpervizör, Detaysoft’ta Kıdemli SAP ABAP Danışmanı olarak görev yaptı. SAP HANA, Salesforce entegrasyonu ve Workday gibi projelerde uzman. İstanbul Teknik Üniversitesi İşletme ve Teknoloji Yönetimi Yüksek Lisans, Mimar Sinan Güzel Sanatlar Üniversitesi Matematik mezunu.
            </Typography>
            <Button
              href="https://www.linkedin.com/in/mustafa34acar/"
              target="_blank"
              rel="noopener noreferrer"
              className="homelinkedin-button"
              startIcon={<LinkedIn />}
            >
              LinkedIn
            </Button>
          </Box>
        </Paper>
      </Modal>
    </>
  );
}

export default Home;