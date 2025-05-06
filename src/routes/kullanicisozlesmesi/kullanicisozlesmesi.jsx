import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// sozlesme.txt dosyasını içe aktar
import sozlesme from './sozlesme.txt';

// Hata sınırı bileşeni
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '32px', color: 'red' }}>
          Bir hata oluştu: {this.state.error?.message || 'Bilinmeyen hata'}
        </div>
      );
    }
    return this.props.children;
  }
}

const KullaniciSozlesmesi = () => {
  const [sections, setSections] = useState([]);
  const [openSections, setOpenSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dosya içeriğini yükle ve bölümlere ayır
  useEffect(() => {
    setLoading(true);
    fetch(sozlesme)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Dosya yüklenemedi');
        }
        return response.text();
      })
      .then((text) => {
        // Markdown içeriğini satır satır böl
        const lines = text.split('\n');
        const parsedSections = [];
        let currentSection = null;

        lines.forEach((line) => {
          // Başlık satırlarını tespit et
          const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
          if (headingMatch) {
            const level = headingMatch[1].length;
            const title = headingMatch[2].trim();
            const id = title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');

            // Yeni bir bölüm başlat
            if (currentSection) {
              parsedSections.push(currentSection);
            }
            currentSection = {
              id,
              level,
              title,
              content: [],
            };
          } else if (currentSection) {
            // Başlık değilse, içeriği mevcut bölüme ekle
            currentSection.content.push(line);
          }
        });

        // Son bölümü ekle
        if (currentSection) {
          parsedSections.push(currentSection);
        }

        setSections(parsedSections);

        // Tüm bölümleri varsayılan olarak açık yap
        const initialOpenSections = {};
        parsedSections.forEach((section) => {
          initialOpenSections[section.id] = true;
        });
        setOpenSections(initialOpenSections);

        setLoading(false);
      })
      .catch((err) => {
        setError('Sözleşme yüklenemedi: ' + err.message);
        setLoading(false);
      });
  }, []);

  const toggleSection = (id) => {
    setOpenSections((prev) => {
      const newState = { ...prev, [id]: !prev[id] };
      console.log('Toggling section:', id, 'New state:', newState); // Hata ayıklama için
      return newState;
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '32px' }}>Yükleniyor...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '32px', color: 'red' }}>{error}</div>;
  }

  return (
    <>
      <style>
        {`
          body {
            margin: 0;
            padding: 0;
          }
          main {
            background-color: white;
            color: black;
            padding: 32px 16px;
            min-height: 100vh;
            box-sizing: border-box;
          }
          .container {
            max-width: 1280px;
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          article {
            padding: 32px;
            max-width: 100%;
          }
          .heading-wrapper {
            position: relative;
          }
          .collapsible-heading {
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: color 0.3s ease;
          }
          .collapsible-heading:hover {
            color: #4b5563;
          }
          .toggle-icon {
            margin-left: 12px;
            color: #6b7280;
            font-size: 14px;
          }
          .collapsible-content {
            border-left: 2px solid #d1d5db;
            padding-left: 16px;
            margin-top: 8px;
          }
          .collapsible-content.closed {
            display: none;
          }
          .collapsible-content.open {
            display: block;
          }
          h1 {
            font-size: 36px;
            font-weight: 800;
            color: black;
            margin-top: 40px;
            margin-bottom: 24px;
          }
          h2 {
            font-size: 28px;
            font-weight: 700;
            color: black;
            margin-top: 32px;
            margin-bottom: 16px;
          }
          h3 {
            font-size: 24px;
            font-weight: 600;
            color: black;
            margin-top: 24px;
            margin-bottom: 12px;
          }
          h4 {
            font-size: 20px;
            font-weight: 600;
            color: black;
            margin-top: 20px;
            margin-bottom: 8px;
          }
          h5 {
            font-size: 16px;
            font-weight: 500;
            color: black;
            margin-top: 16px;
            margin-bottom: 8px;
          }
          h6 {
            font-size: 14px;
            font-weight: 500;
            color: black;
            margin-top: 12px;
            margin-bottom: 4px;
          }
          p {
            margin-bottom: 16px;
            color: black;
            line-height: 1.75;
          }
          ul {
            list-style-type: disc;
            padding-left: 24px;
            margin-bottom: 16px;
            color: black;
          }
          ol {
            list-style-type: decimal;
            padding-left: 24px;
            margin-bottom: 16px;
            color: black;
          }

          /* Responsive kenar boşlukları */
          @media (min-width: 640px) {
            main {
              padding: 32px 24px;
            }
            article {
              padding: 40px;
            }
          }
          @media (min-width: 768px) {
            main {
              padding: 32px 48px;
            }
            article {
              padding: 48px;
            }
          }
          @media (min-width: 1024px) {
            main {
              padding: 32px 80px;
            }
          }
          @media (min-width: 1280px) {
            main {
              padding: 32px 112px;
            }
          }
        `}
      </style>
      <ErrorBoundary>
        <main>
          <div className="container">
            <article>
              {sections.map((section) => {
                const isCollapsible = section.level <= 2;
                const isOpen = openSections[section.id] !== undefined ? openSections[section.id] : true;
                const headingTag = `h${section.level}`;

                return (
                  <div key={section.id} className="heading-wrapper">
                    {isCollapsible ? (
                      <>
                        <div
                          className={`collapsible-heading h${section.level}`}
                          onClick={() => toggleSection(section.id)}
                          data-section-id={section.id}
                        >
                          <span>{section.title}</span>
                          <span className="toggle-icon">{isOpen ? '▲' : '▼'}</span>
                        </div>
                        <div className={`collapsible-content ${isOpen ? 'open' : 'closed'}`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p>{children}</p>,
                              ul: ({ children }) => <ul>{children}</ul>,
                              ol: ({ children }) => <ol>{children}</ol>,
                            }}
                          >
                            {section.content.join('\n')}
                          </ReactMarkdown>
                        </div>
                      </>
                    ) : (
                      <>
                        {React.createElement(headingTag, { className: `h${section.level}` }, section.title)}
                        <div>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p>{children}</p>,
                              ul: ({ children }) => <ul>{children}</ul>,
                              ol: ({ children }) => <ol>{children}</ol>,
                            }}
                          >
                            {section.content.join('\n')}
                          </ReactMarkdown>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </article>
          </div>
        </main>
      </ErrorBoundary>
    </>
  );
};

export default KullaniciSozlesmesi;