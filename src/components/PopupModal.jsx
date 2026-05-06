import React, { useState, useEffect, useRef } from 'react';
import { userController } from '../controllers';
import { useAuthStore } from '../store/authStore';

export default function PopupModal() {
  const { isLoggedIn, loginToken } = useAuthStore();
  const [content, setContent] = useState(null);
  const [isHtml, setIsHtml] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    // Prevent multiple triggers in the same component lifecycle
    if (hasTriggered.current) return;

    const fetchPopup = async () => {
      // Check if popup was already shown in this session
      const shown = sessionStorage.getItem('skyexchange-popup-shown');
      if (shown === 'true') {
        return;
      }

      if (!isLoggedIn || !loginToken) {
        return;
      }

      try {
        const response = await userController.getPopupImage(loginToken);
        
        let rawData = response;
        if (Array.isArray(response) && response.length > 0) {
          rawData = response[0];
        }

        const value = rawData?.image || rawData;

        if (value && typeof value === 'string' && value.length > 10) {
          hasTriggered.current = true;
          sessionStorage.setItem('skyexchange-popup-shown', 'true');

          const HTML_REGEX = /<[a-z][\s\S]*>/i;
          const isTextHtml = HTML_REGEX.test(value);

          if (isTextHtml) {
            setContent(value);
            setIsHtml(true);
          } else {
            const formattedUrl = value.startsWith('data:') 
              ? value 
              : `data:image/png;base64,${value}`;
            setContent(formattedUrl);
            setIsHtml(false);
          }
          
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Failed to fetch popup content:', error);
      }
    };

    fetchPopup();
  }, [isLoggedIn, loginToken]);

  if (!isOpen || !content) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-10 pointer-events-none" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
      <div 
        className="absolute inset-0 bg-black/60 pointer-events-auto"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={() => setIsOpen(false)}
      />
      
      <div className="relative max-w-[90vw] lg:max-w-[800px] max-h-[85vh] pointer-events-auto animate-popup" style={{ position: 'relative', zIndex: 10001 }}>
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute -top-4 -right-4 z-10 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#ffb400] transition-all shadow-xl border-2 border-white"
          style={{ 
            position: 'absolute', 
            top: '-15px', 
            right: '-15px', 
            width: '30px', 
            height: '30px', 
            borderRadius: '50%', 
            backgroundColor: '#000', 
            color: '#fff', 
            border: '2px solid #fff', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
          }}
        >
          ×
        </button>

        {isHtml ? (
          <div 
            className="bg-white p-6 rounded-lg shadow-2xl overflow-auto max-w-[85vw] lg:max-w-[600px]"
            style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', color: '#333' }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <img 
            src={content} 
            alt="Promotion" 
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl block border-2 border-white/20"
            style={{ maxWidth: '100%', height: 'auto', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', display: 'block' }}
          />
        )}
      </div>

      <style>
        {`
          @keyframes popupShow {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-popup {
            animation: popupShow 0.3s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}
