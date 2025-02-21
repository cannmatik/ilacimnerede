import React, { useState, useEffect } from 'react';
import './style.scss';
import { supabase } from '@routes/Login/useCreateClient'; // Supabase client'ını import ediyoruz

const ResetPassword = () => {
  const [session, setSession] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  useEffect(() => {
    // URL'den token_hash ve type parametrelerini alıyoruz
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type');

    if (tokenHash && type === 'recovery') {
      // Supabase'in recovery session'ını oluşturuyoruz
      supabase.auth
        .verifyOtp({
          type: 'recovery',
          token_hash: tokenHash,
        })
        .then(({ data, error }) => {
          if (error) {
            console.error('verifyOtp error:', error);
            setMessage('Geçerli oturum oluşturulamadı.');
            setStatus('error');
          } else if (data.session) {
            setSession(data.session);
          }
        });
    } else {
      setMessage('Lütfen şifre sıfırlama e-postasındaki bağlantıya tıklayarak bu sayfaya erişiniz.');
      setStatus('error');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Şifrelerin eşleşip eşleşmediğini kontrol ediyoruz
    if (newPassword !== confirmPassword) {
      setMessage('Girilen şifreler eşleşmiyor!');
      setStatus('error');
      return;
    }

    setStatus('loading');

    // Oturum kontrolü
    if (!session) {
      setMessage('Geçerli oturum bulunamadı.');
      setStatus('error');
      return;
    }

    // Şifreyi güncelleme işlemi
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage(`Şifre güncelleme hatası: ${error.message}`);
      setStatus('error');
    } else {
      setMessage('Şifreniz başarıyla güncellendi.');
      setStatus('success');
    }
  };

  if (!session) {
    return (
      <div className="reset-password-container">
        <h1>Yeni Şifre Belirleme</h1>
        <p className={`message ${status}`}>{message}</p>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <h1>Yeni Şifre Belirleme</h1>
      <form onSubmit={handleSubmit} className="reset-password-form">
        <div className="form-group">
          <label htmlFor="newPassword">Yeni Şifre:</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6} // Şifre en az 6 karakter olmalı
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Yeni Şifre (Tekrar):</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6} // Şifre en az 6 karakter olmalı
          />
        </div>
        <button type="submit" className="reset-button" disabled={status === 'loading'}>
          {status === 'loading' ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
        </button>
      </form>
      {message && <p className={`message ${status}`}>{message}</p>}
    </div>
  );
};

export default ResetPassword;