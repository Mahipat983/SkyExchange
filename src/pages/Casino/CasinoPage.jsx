import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import { casinoController } from '../../controllers/casino/casinoController';
import { useAuthStore } from '../../store/authStore';
import GameOverlay from '../../components/GameOverlay';
import { useUIStore } from '../../store/uiStore';

// Custom hook for draggable horizontal scroll
const useDraggableScroll = () => {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll speed
    ref.current.scrollLeft = scrollLeft - walk;
  };

  return {
    ref,
    onMouseDown,
    onMouseLeave: onMouseUp,
    onMouseUp,
    onMouseMove,
    style: { cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }
  };
};

const CasinoPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialProvider = queryParams.get('provider') || 'ALL';
  const initialSearch = queryParams.get('search') || '';

  const { isLoggedIn, loginToken } = useAuthStore();
  const openLoginModal = useUIStore(state => state.openLoginModal);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(initialSearch ? 'ALL' : 'Lobby');
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [overlayState, setOverlayState] = useState({ isOpen: false, url: '', title: '' });
  const sectionRefs = useRef({});

  // Draggable refs
  const categoryScroll = useDraggableScroll();
  const providerScroll = useDraggableScroll();

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const res = await casinoController.getCasinoGames('ALL');
        
        let gamesData = [];
        if (Array.isArray(res)) {
          gamesData = res;
        } else if (res && res.data && Array.isArray(res.data)) {
          gamesData = res.data;
        } else if (res && typeof res === 'object') {
          gamesData = Object.values(res).filter(item => item && typeof item === 'object' && item.game_code);
        }

        if (gamesData.length > 0) {
          const uniqueGames = [];
          const seen = new Set();
          gamesData.forEach(game => {
            if (!seen.has(game.game_code)) {
              uniqueGames.push(game);
              seen.add(game.game_code);
            }
          });
          setGames(uniqueGames);
        }
      } catch (err) {
        console.error('Failed to fetch casino games:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(['Lobby']);
    games.forEach(game => {
      if (game.Category) cats.add(game.Category);
    });
    return Array.from(cats);
  }, [games]);

  const providers = useMemo(() => {
    const activeGames = activeCategory === 'Lobby' 
      ? games 
      : games.filter(g => g.Category === activeCategory);
    
    const provs = new Set(['ALL']);
    activeGames.forEach(game => {
      if (game.provider) provs.add(game.provider);
    });
    return Array.from(provs).sort();
  }, [games, activeCategory]);

  const filteredGames = useMemo(() => {
    let result = games;
    if (activeCategory !== 'Lobby' && activeCategory !== 'ALL') {
      result = result.filter(g => g.Category === activeCategory);
    }
    if (selectedProvider !== 'ALL') {
      result = result.filter(g => g.provider === selectedProvider);
    }
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(g => 
        g.name?.toLowerCase().includes(lowSearch) || 
        g.provider?.toLowerCase().includes(lowSearch)
      );
    }
    return result;
  }, [games, activeCategory, selectedProvider, searchTerm]);

  const groupedGames = useMemo(() => {
    const groups = {};
    games.forEach(game => {
      const cat = game.Category || 'Others';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(game);
    });
    return groups;
  }, [games]);

  const handleGameLaunch = async (game) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    try {
      setOverlayState({ isOpen: true, url: '', title: game.name });
      const res = await casinoController.openCasinoGame({
        LoginToken: loginToken,
        Game_id: game.game_id,
        Game_code: game.game_code
      });

      if (res && res.error === '0' && res.url) {
        setOverlayState(prev => ({ ...prev, url: res.url }));
      } else {
        alert(res?.msg || 'Failed to launch game');
        setOverlayState({ isOpen: false, url: '', title: '' });
      }
    } catch (err) {
      console.error('Launch Error:', err);
      alert('Error launching game');
      setOverlayState({ isOpen: false, url: '', title: '' });
    }
  };

  const scrollToSection = (cat) => {
    setActiveCategory(cat);
    setSelectedProvider('ALL');
    
    if (cat === 'Lobby') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = sectionRefs.current[cat];
      if (el) {
        const offset = 120;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-[#ffb400] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="casino-container bg-[#eee] min-h-screen">
        <div className="z-[30] bg-[#eee] shadow-sm">
          {/* Categories Row */}
          <div 
            {...categoryScroll}
            className="flex overflow-x-auto no-scrollbar bg-[#253845] text-white"
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => scrollToSection(cat)}
                className={`px-6 py-3 text-xs font-bold uppercase whitespace-nowrap transition-all border-r border-white/5 ${activeCategory === cat ? 'bg-[#ffb400] text-black' : 'hover:bg-white/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {/* Providers Row */}
          <div 
            {...providerScroll}
            className="flex overflow-x-auto no-scrollbar bg-white border-b border-black/10"
          >
            {providers.map(prov => (
              <button
                key={prov}
                onClick={() => setSelectedProvider(prov)}
                className={`px-4 py-2 text-[10px] font-bold uppercase whitespace-nowrap border-r border-black/5 ${selectedProvider === prov ? 'text-[#ffb400] bg-[#f9f9f9]' : 'text-gray-500 hover:text-black'}`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2 md:p-4 max-w-7xl mx-auto">
          {activeCategory === 'Lobby' && selectedProvider === 'ALL' && !searchTerm ? (
            Object.entries(groupedGames).map(([cat, catGames]) => (
              <div key={cat} ref={el => sectionRefs.current[cat] = el} className="mb-8">
                <div className="flex items-center justify-between mb-3 border-l-4 border-[#ffb400] pl-3">
                  <h2 className="text-sm font-black uppercase text-[#253845]">{cat}</h2>
                  <button 
                    onClick={() => scrollToSection(cat)}
                    className="text-[10px] font-bold text-[#253845] uppercase hover:underline"
                  >
                    View All
                  </button>
                </div>
                {/* Lobby Game Sliders - Also Draggable */}
                <LobbySlider catGames={catGames} onLaunch={handleGameLaunch} />
              </div>
            ))
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
              {filteredGames.map(game => (
                <GameCard key={game.game_code} game={game} onLaunch={() => handleGameLaunch(game)} />
              ))}
              {filteredGames.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-500 font-bold uppercase text-xs">
                  No games found for this selection
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-20"></div>
      </div>

      <GameOverlay 
        isOpen={overlayState.isOpen}
        url={overlayState.url}
        title={overlayState.title}
        onClose={() => setOverlayState({ isOpen: false, url: '', title: '' })}
      />
    </Layout>
  );
};

const LobbySlider = ({ catGames, onLaunch }) => {
  const scroll = useDraggableScroll();
  return (
    <div 
      {...scroll}
      className="flex overflow-x-auto no-scrollbar gap-2 pb-2"
    >
      {catGames.slice(0, 15).map(game => (
        <GameCard key={game.game_code} game={game} onLaunch={() => onLaunch(game)} isSlider />
      ))}
    </div>
  );
};

const GameCard = ({ game, onLaunch, isSlider }) => {
  return (
    <div 
      onClick={onLaunch}
      className={`relative group bg-white rounded-md overflow-hidden shadow-sm border border-black/5 cursor-pointer active:scale-95 transition-all ${isSlider ? 'min-w-[160px] md:min-w-[200px] w-[160px] md:w-[200px]' : 'w-full'} aspect-[3/2]`}
    >
      <img 
        src={game.image?.startsWith('/drmicon/') ? game.image : `/drmicon/${game.image}`}
        alt={game.name}
        className="w-full h-full object-cover pointer-events-none"
        loading="lazy"
        onError={(e) => {
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(game.name)}&background=253845&color=fff&size=128`;
        }}
      />
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <button className="bg-[#ffb400] text-black text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-tighter">
          Play Now
        </button>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-white p-1.5 md:p-2 pointer-events-none border-t border-black/5">
        <p className="text-[9px] md:text-[10px] font-black text-black truncate leading-tight uppercase">{game.name}</p>
        <p className="text-[7px] md:text-[8px] font-bold text-gray-500 uppercase tracking-tighter">{game.provider}</p>
      </div>
    </div>
  );
};

export default CasinoPage;
