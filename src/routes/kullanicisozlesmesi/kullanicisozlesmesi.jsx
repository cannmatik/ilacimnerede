import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// sozlesme.txt dosyasını içe aktar
import sozlesme from './sozlesme.txt';

const KullaniciSozlesmesi = () => {
  const [markdownContent, setMarkdownContent] = useState('');
  const [openSections, setOpenSections] = useState({});

  // Dosya içeriğini yükle
  useEffect(() => {
    fetch(sozlesme)
      .then((response) => response.text())
      .then((text) => setMarkdownContent(text))
      .catch((error) => console.error('Sözleşme dosyası yüklenemedi:', error));
  }, []);

  const toggleSection = (id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Başlıkları ve alt içeriklerini işlemek için özel bir yapı
  const HeadingWithContent = ({ level, children }) => {
    // children'ın bir dizi olup olmadığını kontrol et
    const isArray = Array.isArray(children);
    const text = isArray
      ? children.find((child) => typeof child === 'string') || children[0] || ''
      : children || '';

    const id = text
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const isCollapsible = level <= 2;
    const isOpen = openSections[id];

    return (
      <div className="heading-wrapper">
        {isCollapsible ? (
          <>
            <div
              className={`collapsible-heading h${level}`}
              onClick={() => toggleSection(id)}
            >
              <span>{text}</span>
              <span className="toggle-icon">{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
              <div className="collapsible-content">
                {isArray ? children.slice(1) : null}
              </div>
            )}
          </>
        ) : (
          <div className={`h${level}`}>{text}</div>
        )}
      </div>
    );
  };

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
      <main>
        <div className="container">
          <article>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <HeadingWithContent level={1} children={children} />,
                h2: ({ children }) => <HeadingWithContent level={2} children={children} />,
                h3: ({ children }) => <HeadingWithContent level={3} children={children} />,
                h4: ({ children }) => <HeadingWithContent level={4} children={children} />,
                h5: ({ children }) => <HeadingWithContent level={5} children={children} />,
                h6: ({ children }) => <HeadingWithContent level={6} children={children} />,
                p: ({ children }) => <p>{children}</p>,
                ul: ({ children }) => <ul>{children}</ul>,
                ol: ({ children }) => <ol>{children}</ol>,
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </article>
        </div>
      </main>
    </>
  );
};

export default KullaniciSozlesmesi;