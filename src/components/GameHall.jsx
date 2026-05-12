import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketController, userController } from '../controllers';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { casinoController } from '../controllers/casino/casinoController';
import GameOverlay from './GameOverlay';

// All game banners from the original index.html gamehall-wrap-simple section
const gameItems = [
  {
    cls: '',
    title: 'Sports',
    subtitle: 'Play Now',
    img: '/images/banner_sports.png',
    href: '/in-play',
    isInPlay: true,
  },
  {
    cls: 'entrance',
    title: null,
    img: '/images/banner_skyexchangeBlog.png',
    href: 'https://go.wa.link/ambikaexchangesupport',
    external: true,
    isWhatsApp: true,
  },
  {
    cls: '',
    title: 'Premium sportBook',
    subtitle: 'Play Now',
    img: '/images/banner_virtualsports.png',
    href: '#',
    isSportsBook: true,
  },
  {
    cls: 'entrance-half',
    title: 'EVO',
    subtitle: 'Play Now',
    img: '/images/banner_evo-half.png',
    href: '/provider/Evolution-Gaming',
  },
  {
    cls: 'entrance-half',
    title: 'Smartsoft',
    subtitle: 'Play Now',
    img: '/images/banner_smartsoft-half.png',
    href: '/provider/Smartsoft-Gaming',
  },
  {
    cls: '',
    title: 'Royal Gaming',
    subtitle: 'Play Now',
    img: '/images/banner_royalgaming.png',
    href: '/provider/Royal-Gaming-Virtual',
  },
  {
    cls: 'entrance-half',
    title: 'EZUGI',
    subtitle: 'Play Now',
    img: '/images/banner_ezugi-half.png',
    href: '/provider/Ezugi',
  },
  {
    cls: 'entrance-half mobile-only',
    title: 'SKYCASINO',
    subtitle: 'Play Now',
    img: '/images/banner_skycasino-half.png',
    href: '/title/SKYCASINO',
  },
  {
    cls: 'entrance-half',
    title: 'Live Casino',
    subtitle: 'Play Now',
    img: '/images/banner_casino-half.png',
    href: '/casino',
  },
  {
    cls: 'entrance-half',
    title: 'AVIATORX',
    subtitle: 'Play Now',
    img: '/images/banner_aviator_xtreme-half.png',
    href: '/title/AVIATORX',
  },
  {
    cls: 'entrance-half',
    title: 'Mines',
    subtitle: 'Play Now',
    img: '/images/banner_mines-half.png',
    href: '/title/Mines',
  },
  {
    cls: 'entrance-half',
    title: 'KiteX',
    subtitle: 'Play Now',
    img: '/images/banner_kitex-half.png',
    href: '/title/kitex',
  },
  {
    cls: 'entrance-half',
    title: 'Turbo Vortex',
    subtitle: 'Play Now',
    img: '/images/banner_turbo_vortex-half.png',
    href: '/title/Turbo-Vortex',
  },
  {
    cls: 'entrance-half',
    title: 'Spribe',
    subtitle: 'Play Now',
    img: '/images/banner_spribe.png',
    href: '/provider/Spribe',
  },
  {
    cls: 'entrance-half',
    title: 'Blackjack',
    subtitle: 'Play Now',
    img: '/images/banner_blackjack-half.png',
    href: '/title/Blackjack',
  },
  {
    cls: 'entrance-half',
    title: '7 Up Down',
    subtitle: 'Play Now',
    img: '/images/banner_7up7down-half.png',
    href: '/title/7-Up-Down',
  },
  {
    cls: 'entrance-half',
    title: 'Andar Bahar VR',
    subtitle: 'Play Now',
    img: '/images/banner_andarBaharVR-half.png',
    href: '/title/Andar-Bahar-VR',
  },
  {
    cls: 'entrance-half',
    title: 'Supernowa',
    subtitle: 'Play Now',
    img: '/images/banner_supernowa-half.png',
    href: '/provider/SuperNowa',
  },
  {
    cls: 'entrance-half',
    title: 'HORSEBOOK',
    subtitle: 'Play Now',
    img: '/images/banner_horsebook-half.png',
    href: '/provider/HORSEBOOK',
  },
  {
    cls: 'entrance-half',
    title: 'Minesweeper',
    subtitle: 'Play Now',
    img: '/images/banner_minesweeper-half.png',
    href: '/title/Minesweeper',
  },
  {
    cls: 'entrance-half',
    title: 'Teen Patti',
    subtitle: 'Play Now',
    img: '/images/banner_teenPatti-half.png',
    href: '/title/Teen-Patti',
  },
  {
    cls: 'entrance-half',
    title: 'Super Over VR',
    subtitle: 'Play Now',
    img: '/images/banner_superOverVR-half.png',
    href: '/title/Super-Over-VR',
  },
  {
    cls: 'entrance-half',
    title: 'TeenPatti 20-20',
    subtitle: 'Play Now',
    img: '/images/banner_TeenPatti2020-half.png',
    href: '/title/TeenPatti-20-20',
  },
  {
    cls: 'entrance-half',
    title: 'Big small',
    subtitle: 'Play Now',
    img: '/images/banner_BigSmall-half.png',
    href: '/title/Big-small',
  },
  {
    cls: 'entrance-half',
    title: 'TeenPatti Joker',
    subtitle: 'Play Now',
    img: '/images/banner_TeenPattiJoker-half.png',
    href: '/title/TeenPatti-Joker',
  },
  {
    cls: 'entrance-half',
    title: '7up7down',
    subtitle: 'Play Now',
    img: '/images/mobile/gamehall/banner_7up7down-half.png',
    href: '/title/7up7down',
  },
  {
    cls: 'entrance-half',
    title: 'Dragon & Tiger',
    subtitle: 'Play Now',
    img: '/images/banner_DragonNTiger-half.png',
    href: '/title/Dragon-Tiger-Name',
  },
  {
    cls: 'entrance-half',
    title: 'Auto Roulette',
    subtitle: 'Play Now',
    img: '/images/banner_autoRoulette-half.png',
    href: '/title/Auto-Roulette',
  },
  {
    cls: 'entrance-half',
    title: 'Dus Ka Dum (Cards) VR',
    subtitle: 'Play Now',
    img: '/images/banner_DusKaDumVR-half.png',
    href: '/title/Dus-Ka-Dum',
  },
  {
    cls: 'entrance-half',
    title: 'Callbreak Quick',
    subtitle: 'Play Now',
    img: '/images/banner_CallbreakQuick-half.png',
    href: '/title/Callbreak-Quick',
  },
  {
    cls: 'entrance-half',
    title: 'Sic Bo',
    subtitle: 'Play Now',
    img: '/images/banner_SicBo-Jili-half.png',
    href: '/title/Sic-Bo',
  },
  {
    cls: 'entrance-half',
    title: 'Baccarat',
    subtitle: 'Play Now',
    img: '/images/banner_Baccarat-half.png',
    href: '/title/Baccarat',
  },
  {
    cls: 'entrance-half',
    title: 'Bonus Dice',
    subtitle: 'Play Now',
    img: '/images/banner_BonusDice-half.png',
    href: '/title/Bonus-Dice',
  },
  {
    cls: 'entrance-half',
    title: 'Heist',
    subtitle: 'Play Now',
    img: '/images/banner_Heist-half.png',
    href: '/title/Heist',
  },
  {
    cls: 'entrance-half',
    title: '5 Card Poker',
    subtitle: 'Play Now',
    img: '/images/banner_5CardPoker-half.png',
    href: '/title/5-Card-Poker',
  },
  {
    cls: 'entrance-half',
    title: 'Color Game',
    subtitle: 'Play Now',
    img: '/images/banner_ColorGame-half.png',
    href: '/title/Color-Game',
  },
  {
    cls: 'entrance-half',
    title: '32 Cards',
    subtitle: 'Play Now',
    img: '/images/banner_32card-half.png',
    href: '/title/32-Cards',
  },
  {
    cls: 'entrance-half',
    title: 'Rummy',
    subtitle: 'Play Now',
    img: '/images/banner_rummy-half.png',
    href: '/title/Rummy',
  },
  {
    cls: 'entrance-half',
    title: 'Dragon Tiger',
    subtitle: 'Play Now',
    img: '/images/banner_dragonTiger-half.png',
    href: '/title/Dragon-Tiger',
  },
  {
    cls: 'entrance-half',
    title: 'Worli Matka VR',
    subtitle: 'Play Now',
    img: '/images/banner_worliMatkaVR-half.png',
    href: '/title/Worli-Matka-VR',
  },
  {
    cls: 'entrance-half',
    title: 'BetGames',
    subtitle: 'Play Now',
    img: '/images/banner_betgames-half.png',
    href: '/provider/BetGames-TV',
  },
  {
    cls: 'entrance-half',
    title: 'Andar Bahar',
    subtitle: 'Play Now',
    img: '/images/banner_andarBahar-half.png',
    href: '/title/Andar-Bahar',
  },
  {
    cls: 'entrance-half',
    title: 'Sicbo',
    subtitle: 'Play Now',
    img: '/images/banner_sicbo-half.png',
    href: '/title/Sicbo',
  },
  {
    cls: 'entrance-half',
    title: 'Coin Toss',
    subtitle: 'Play Now',
    img: '/images/banner_CoinToss-half.png',
    href: '/title/Coin-Toss',
  },
  {
    cls: 'entrance-half',
    title: 'Number Matka',
    subtitle: 'Play Now',
    img: '/images/banner_numberMatka-half.png',
    href: '/title/Number-Matka',
  },
];

function GameHall() {
  const navigate = useNavigate();
  const { isLoggedIn, loginToken } = useAuthStore();
  const openLoginModal = useUIStore(state => state.openLoginModal);
  const [overlayState, setOverlayState] = useState({ isOpen: false, url: '', title: '' });
  const [matchCounts, setMatchCounts] = useState({
    Cricket: 0,
    Football: 0,
    Tennis: 0,
    HorseRacing: 0,
    GreyhoundRacing: 0
  });

  useEffect(() => {
    const fetchMatchCounts = async () => {
      try {
        const sports = ['Cricket', 'Football', 'Tennis', 'Horse Racing', 'Greyhound Racing'];
        const res = await marketController.getGameList(sports.join(','));

        let matchData = [];
        if (res && res.matches) {
          matchData = res.matches;
        } else if (res && typeof res === 'object') {
          matchData = Object.values(res).filter(v => typeof v === 'object' && v !== null && (v.MarketId || v.marketid || v.Gid || v.gid));
        } else if (Array.isArray(res)) {
          matchData = res;
        }

        const counts = { Cricket: 0, Football: 0, Tennis: 0, HorseRacing: 0, GreyhoundRacing: 0 };
        const now = new Date();

        const parseDate = (str) => {
          if (!str) return null;
          const dateVal = str.includes('T') ? str : str.replace(' ', 'T');
          let d = new Date(dateVal);
          if (isNaN(d.getTime())) {
            const parts = str.split(/[-/ :]/);
            if (parts.length >= 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1;
              const year = parseInt(parts[2], 10);
              if (day <= 31 && month <= 11) {
                const hour = parseInt(parts[3] || '0', 10);
                const minute = parseInt(parts[4] || '0', 10);
                const second = parseInt(parts[5] || '0', 10);
                d = new Date(year, month, day, hour, minute, second);
              }
            }
          }
          return d && !isNaN(d.getTime()) ? d : null;
        };

        matchData.forEach(m => {
          const sport = m.sportname || m.Type || m.sport || 'Other';
          const startTimeStr = m.DateTime || m.dateTime || m.Datetime || m.staredtime || m.StartTime || '';
          const startTime = parseDate(startTimeStr);
          const isWinnerMarket = (m.Game_Type || m.GameType || '').toLowerCase() === 'winner' ||
            (m.Team2 || '').includes('TOURNAMENT_WINNER');

          if ((startTime && startTime <= now) || isWinnerMarket) {
            if (sport === 'Cricket') counts.Cricket++;
            else if (sport === 'Football' || sport === 'Soccer') counts.Football++;
            else if (sport === 'Tennis') counts.Tennis++;
            else if (sport === 'Horse Racing') counts.HorseRacing++;
            else if (sport === 'Greyhound Racing') counts.GreyhoundRacing++;
          }
        });

        setMatchCounts(counts);
      } catch (err) {
        console.error('Failed to fetch GameHall match counts:', err);
      }
    };

    fetchMatchCounts();
    const interval = setInterval(fetchMatchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSportsbookLaunch = async () => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    try {
      setOverlayState({ isOpen: true, url: '', title: 'Premium SportBook' });
      const res = await casinoController.openSportsbook(loginToken);

      if (res && res.error === '0' && res.url) {
        setOverlayState(prev => ({ ...prev, url: res.url }));
      } else {
        alert(res?.msg || 'Failed to launch SportsBook');
        setOverlayState({ isOpen: false, url: '', title: '' });
      }
    } catch (err) {
      console.error('SportsBook Launch Error:', err);
      alert('Error launching SportsBook');
      setOverlayState({ isOpen: false, url: '', title: '' });
    }
  };

  const handleWhatsAppClick = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await userController.getWhatsAppLink();
      // Use the project fallback from Layout/Deposit if API fails completely
      let targetLink = 'https://go.wa.link/ambikaexchangesupport'; 

      if (res) {
        if (res.error === '0' && res.Link) {
          targetLink = res.Link;
        } else if (res.url) {
          targetLink = res.url;
        } else if (typeof res === 'string' && res.startsWith('http')) {
          targetLink = res;
        } else if (res.link) {
          targetLink = res.link;
        }
      }
      
      window.open(targetLink, '_blank');
    } catch (err) {
      console.error('WhatsApp redirect error:', err);
      window.open('https://go.wa.link/ambikaexchangesupport', '_blank');
    }
  };

  return (
    <div className="gamehall-wrap-simple">
      {/* Sports Live Board */}
      <a href="/in-play" style={{ cursor: 'pointer' }}>
        <dl id="onLiveBoard" className="on_live">
          <dt>
            <p className="live_icon"><span></span> LIVE</p>
          </dt>
          <dd id="onLiveCount_CRICKET">
            <p>Cricket</p>
            <span id="count">{matchCounts.Cricket}</span>
          </dd>
          <dd id="onLiveCount_SOCCER">
            <p>Football</p>
            <span id="count">{matchCounts.Football}</span>
          </dd>
          <dd id="onLiveCount_TENNIS">
            <p>Tennis</p>
            <span id="count">{matchCounts.Tennis}</span>
          </dd>
          <dd id="onLiveCount_HORSERACING">
            <p>Horse Racing</p>
            <span id="count">{matchCounts.HorseRacing}</span>
          </dd>
          <dd id="onLiveCount_GREYHOUNDRACING">
            <p>Greyhound Racing</p>
            <span id="count">{matchCounts.GreyhoundRacing}</span>
          </dd>
        </dl>
        <dl className="entrance-title">
          <dt>Sports</dt>
          <dd>Play Now</dd>
        </dl>
        <img src="/images/banner_sports.png" alt="" draggable="false" />
      </a>

      {/* Blog / WhatsApp */}
      <a className="entrance" href="https://go.wa.link/ambikaexchangesupport" onClick={handleWhatsAppClick} target="_blank" rel="noreferrer">
        <img src="/images/banner_skyexchangeBlog.png" alt="" draggable="false" />
      </a>

      {/* All other game items */}
      {gameItems.slice(2).map((game, idx) => {
        return (
          <a
            key={idx}
            className={game.cls}
            href={game.isSportsBook ? 'javascript:void(0)' : game.href}
            onClick={(e) => {
              if (game.isSportsBook) {
                e.preventDefault();
                handleSportsbookLaunch();
              }
            }}
            style={{ cursor: 'pointer' }}
            rel="noreferrer"
          >
            {game.title && (
              <dl className="entrance-title">
                <dt>{game.title}</dt>
                <dd>{game.subtitle}</dd>
              </dl>
            )}
            <img src={game.img} alt="" draggable="false" />
          </a>
        );
      })}

      <GameOverlay
        isOpen={overlayState.isOpen}
        url={overlayState.url}
        title={overlayState.title}
        onClose={() => setOverlayState({ isOpen: false, url: '', title: '' })}
      />
    </div>
  );
}

export default GameHall;
