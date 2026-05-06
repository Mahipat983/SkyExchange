import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import { casinoController } from '../../controllers/casino/casinoController';
import { useAuthStore } from '../../store/authStore';
import GameOverlay from '../../components/GameOverlay';
import { useUIStore } from '../../store/uiStore';

const CasinoProviderPage = () => {
  const { providerTag } = useParams();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn, loginToken } = useAuthStore();
  const openLoginModal = useUIStore(state => state.openLoginModal);
  const [overlayState, setOverlayState] = useState({ isOpen: false, url: '', title: '' });

  // Mapping tags from URL to actual provider names in the API
  const providerMapping = {
    'Evolution-Gaming': 'Evolution Gaming',
    'Smartsoft-Gaming': 'Smartsoft Gaming',
    'Royal-Gaming-Virtual': 'Royal Gaming Virtual',
    'Ezugi': 'Ezugi',
    'Spribe': 'Spribe',
    'SuperNowa': 'SuperNowa',
    'HORSEBOOK': 'HORSEBOOK',
    'BetGames-TV': 'BetGames.TV'
  };

  const providerName = providerMapping[providerTag] || providerTag.replace(/-/g, ' ');

  useEffect(() => {
    const fetchGames = async () => {
      if (games.length > 0) return;
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
        
        setGames(gamesData);
      } catch (err) {
        console.error('Failed to fetch games:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, [games.length, setGames, setLoading]);

  const filteredGames = useMemo(() => {
    return games.filter(g => g.provider === providerName);
  }, [games, providerName]);

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
      <div className="casino-category-page bg-[#eee] min-h-screen">
        <div className="bg-[#253845] text-white p-3 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/casino')}
                className="p-1 hover:bg-white/10 rounded"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              </button>
              <h1 className="text-sm font-black uppercase tracking-tight">{providerName}</h1>
            </div>
            <span className="text-[10px] font-bold text-[#ffb400] uppercase bg-black/20 px-2 py-1 rounded">
              {filteredGames.length} Games
            </span>
          </div>
        </div>

        <div className="p-2 md:p-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
            {filteredGames.map(game => (
              <GameCard
                key={game.game_code}
                game={game}
                onLaunch={() => handleGameLaunch(game)}
              />
            ))}
            {filteredGames.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-500 font-bold uppercase text-xs">
                No games found for {providerName}
              </div>
            )}
          </div>
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

const GameCard = ({ game, onLaunch }) => (
  <div
    onClick={onLaunch}
    className="relative group bg-white rounded-md overflow-hidden shadow-sm border border-black/5 cursor-pointer active:scale-95 transition-all w-full aspect-[3/2]"
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

export default CasinoProviderPage;
