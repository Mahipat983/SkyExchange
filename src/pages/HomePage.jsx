import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import GameHall from '../components/GameHall';
import Footer from '../components/Footer';
import { marketController } from '../controllers';
import { useAuthStore } from '../store/authStore';

function HomePage() {
  const { loginToken, isLoggedIn } = useAuthStore();
  const [banners, setBanners] = useState([]);
  const [news, setNews] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Banners and News in parallel using dynamic loginToken
      const [bannerRes, newsRes] = await Promise.all([
        marketController.getHomeBanners('Web'),
        marketController.getNews(loginToken || '')
      ]);

      // Handle Banners
      let dataArray = [];
      if (Array.isArray(bannerRes)) {
        dataArray = bannerRes;
      } else if (bannerRes && typeof bannerRes === 'object') {
        dataArray = Object.values(bannerRes).filter(item => item && typeof item === 'object' && item.image);
      }
      setBanners(dataArray);

      // Handle News
      if (newsRes && newsRes.error === "0") {
        setNews(newsRes.msg);
      } else {
        setNews(''); // Clear if invalid or error
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [loginToken]); // Refetch when loginToken changes

  useEffect(() => {
    if (banners.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
    }
    return () => clearInterval(timerRef.current);
  }, [banners]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    resetTimer();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    resetTimer();
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
    }
  };

  // Helper to format date as "25 Apr 2026"
  const getFormattedDate = () => {
    const date = new Date();
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <Layout>
      {/* Inline styles for Spinner and News Marquee */}
      <style>{`
        .ios-spinner {
          display: inline-block;
          position: relative;
          width: 40px;
          height: 40px;
        }
        .ios-spinner div {
          transform-origin: 20px 20px;
          animation: ios-spinner 1.2s linear infinite;
        }
        .ios-spinner div:after {
          content: " ";
          display: block;
          position: absolute;
          top: 3px;
          left: 18px;
          width: 3px;
          height: 10px;
          border-radius: 20%;
          background: #fff;
        }
        .ios-spinner div:nth-child(1) { transform: rotate(0deg); animation-delay: -1.1s; }
        .ios-spinner div:nth-child(2) { transform: rotate(30deg); animation-delay: -1s; }
        .ios-spinner div:nth-child(3) { transform: rotate(60deg); animation-delay: -0.9s; }
        .ios-spinner div:nth-child(4) { transform: rotate(90deg); animation-delay: -0.8s; }
        .ios-spinner div:nth-child(5) { transform: rotate(120deg); animation-delay: -0.7s; }
        .ios-spinner div:nth-child(6) { transform: rotate(150deg); animation-delay: -0.6s; }
        .ios-spinner div:nth-child(7) { transform: rotate(180deg); animation-delay: -0.5s; }
        .ios-spinner div:nth-child(8) { transform: rotate(210deg); animation-delay: -0.4s; }
        .ios-spinner div:nth-child(9) { transform: rotate(240deg); animation-delay: -0.3s; }
        .ios-spinner div:nth-child(10) { transform: rotate(270deg); animation-delay: -0.2s; }
        .ios-spinner div:nth-child(11) { transform: rotate(300deg); animation-delay: -0.1s; }
        .ios-spinner div:nth-child(12) { transform: rotate(330deg); animation-delay: 0s; }
        @keyframes ios-spinner {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        .news-marquee-container {
          display: flex;
          align-items: center;
          background: #1e293b;
          height: 32px;
          overflow: hidden;
          position: relative;
          border-bottom: 1px solid #334155;
        }
        .news-label {
          background: #334155;
          color: #fff;
          padding: 0 15px;
          height: 100%;
          display: flex;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          position: relative;
          z-index: 10;
          clip-path: polygon(0 0, 85% 0, 100% 100%, 0% 100%);
        }
        .news-text-wrap {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          padding-left: 10px;
          position: relative;
        }
        .news-marquee {
          display: inline-flex;
          align-items: center;
          animation: marquee 15s linear infinite;
          color: #6AC2FF;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .news-marquee:hover {
          text-decoration: underline;
        }
        .news-date-badge {
          background: #6AC2FF;
          color: #000000;
          padding: 2px 8px;
          height: 20px;
          display: flex;
          align-items: center;
          font-size: 10px;
          font-weight: 700;
          border-radius: 4px;
          margin-right: 12px;
          font-style: italic;
          white-space: nowrap;
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

      <div className="full-wrap" style={{ display: 'block' }}>
        <div id="centerColumn" className="col-center gamehall" style={{ display: 'block', paddingTop: 0 }}>
          <div id="overWrap" className="over-wrap" style={{
            paddingTop: 0,
            marginTop: 0,
            display: 'block',
            height: 'auto'
          }}>

            {/* News Section with Scrolling Date Badge */}
            {news && (
              <div className="news-marquee-container">
                <div className="news-label">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: '8px' }}
                  >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                    <line x1="8" y1="22" x2="16" y2="22"></line>
                  </svg>
                  News
                </div>
                <div className="news-text-wrap">
                  <div className="news-marquee">
                    <div className="news-date-badge">
                      {getFormattedDate()}
                    </div>
                    {news}
                  </div>
                </div>
              </div>
            )}

            {/* Promo Banner Slider with Custom Spinner */}
            <div className="promo-banner-wrap" style={{
              position: 'relative',
              width: '100%',
              height: 'auto',
              minHeight: loading ? '300px' : 'auto',
              overflow: 'hidden',
              marginTop: 0,
              paddingTop: 0,
              background: loading ? '#000' : 'transparent',
              marginBottom: '10px',
              display: 'block'
            }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <div className="ios-spinner">
                    <div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>
                  </div>
                </div>
              ) : banners.length > 0 ? (
                <>
                  <div style={{
                    display: 'flex',
                    width: '100%',
                    transform: `translateX(-${currentIndex * 100}%)`,
                    transition: 'transform 0.5s ease-in-out',
                    margin: 0, padding: 0
                  }}>
                    {banners.map((banner, idx) => (
                      <div key={idx} style={{ width: '100%', flexShrink: 0, margin: 0, padding: 0 }}>
                        <img
                          src={banner.image}
                          alt={`Banner ${idx}`}
                          style={{ width: '100%', display: 'block', height: 'auto', border: 'none', margin: 0, padding: 0 }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Navigation Arrows */}

                  {/* Indicators */}

                </>
              ) : null}
            </div>

            <GameHall />
            <Footer />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default HomePage;
