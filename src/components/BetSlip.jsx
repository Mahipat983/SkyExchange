import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { bettingController } from '../controllers';

const BetSlip = ({ sport }) => {
  const { matchId } = useParams();
  const { loginToken, isLoggedIn } = useAuthStore();
  const [bets, setBets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && loginToken) {
      fetchBets();
    }

    const handleBetPlaced = () => {
      if (isLoggedIn && loginToken) {
        fetchBets();
      }
    };

    window.addEventListener('bet-placed', handleBetPlaced);
    return () => window.removeEventListener('bet-placed', handleBetPlaced);
  }, [isLoggedIn, loginToken, matchId, sport]);

  const fetchBets = async () => {
    try {
      setIsLoading(true);
      const res = await bettingController.getMyBets(loginToken);
      if (res && typeof res === 'object' && !res.error) {
        let betArray = Object.values(res).filter(item => typeof item === 'object' && item !== null);
        
        if (matchId) {
          // Filter bets for the current match if matchId is present in URL
          betArray = betArray.filter(b => {
            const gid = b.gid || b.Gid || b.eventId || b.matchId || b.MatchId || b.Eid || b.eid;
            return gid && gid.toString() === matchId.toString();
          });
        } else if (sport) {
          // Filter bets by sport if on a sport page (e.g. /football)
          const targetSport = sport.toLowerCase();
          betArray = betArray.filter(b => {
            // Check Type and Sport fields first as they usually contain the sport name
            const bSport = (b.Type || b.Sport || b.sport || b.SportName || b.sportName || '').toLowerCase();
            const bGameType = (b.Game_Type || '').toLowerCase();
            const bGame = (b.Game || '').toLowerCase();
            
            return bSport.includes(targetSport) || 
                   targetSport.includes(bSport) || 
                   bGameType.includes(targetSport) ||
                   bGame.includes(targetSport);
          });
        }
        
        setBets(betArray);
      }
    } catch (err) {
      console.error('Failed to fetch bets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  const groupedBets = bets.reduce((acc, bet) => {
    const gameName = bet.Game || bet.Market || 'Other Market';
    if (!acc[gameName]) acc[gameName] = [];
    acc[gameName].push(bet);
    return acc;
  }, {});

  return (
    <div className="bg-[#eee] border border-gray-300">
      <div className="bg-[#243a48] text-white text-[13px] font-black py-2 px-3 flex justify-between items-center uppercase tracking-tighter">
        <span>My Bets</span>
        <button onClick={fetchBets} className="text-[10px] text-[#ffb400] hover:underline cursor-pointer font-bold">REFRESH</button>
      </div>
      
      {isLoading ? (
        <div className="p-10 text-center">
          <div className="w-6 h-6 border-2 border-[#ffb400] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Loading bets...</span>
        </div>
      ) : bets.length === 0 ? (
        <div className="p-8 text-center text-[10px] font-bold text-gray-400 uppercase bg-white">
          No open bets found
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-1">
          {Object.entries(groupedBets).map(([gameName, gameBets], gIdx) => {
            const firstBet = gameBets[0];
            const sportName = (firstBet.Sport || firstBet.sport || firstBet.SportName || sport || 'SPORTS').toUpperCase();

            return (
              <div key={gIdx} className="bg-white shadow-sm border border-black/5 overflow-hidden">
                {/* Tournament Header */}
                <div className="bg-[#3b5160] flex items-center justify-between px-3 py-1.5 border-l-4 border-[#ffb400]">
                  <h3 className="text-[10px] font-black text-white uppercase truncate pr-2">{gameName}</h3>
                  <span className="text-[9px] font-black text-[#ffb400] uppercase shrink-0">{sportName}</span>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-[1fr_1.5fr_0.8fr_0.8fr_1.2fr] bg-[#dce5ec] text-[#253845] text-[8px] font-black uppercase py-1.5 px-2 tracking-tighter border-b border-black/5">
                  <div>Market</div>
                  <div>Selection</div>
                  <div className="text-center">Rate</div>
                  <div className="text-center">Stake</div>
                  <div className="text-right">Date</div>
                </div>

                {/* Bet Rows */}
                <div className="flex flex-col">
                  {gameBets.map((bet, idx) => {
                    const sideRaw = bet.Side || bet.type || bet.Type || '';
                    const isBack = sideRaw.toLowerCase() === 'back' || sideRaw.toLowerCase() === 'yes';
                    const bgColor = isBack ? 'bg-[#e2f2ff]' : 'bg-[#fdf1f3]';
                    const dateStr = bet.Matched_Date || bet.Date || bet.datetime || '---';

                    return (
                      <div key={idx} className={`grid grid-cols-[1fr_1.5fr_0.8fr_0.8fr_1.2fr] items-center text-[9px] border-b border-black/5 py-2 px-2 last:border-b-0 ${bgColor}`}>
                        <div className="font-bold text-gray-700 truncate pr-1" title={bet.Game_Type || bet.Type}>{bet.Game_Type || bet.Type || 'Odds'}</div>
                        <div className="font-black text-black truncate pr-1 uppercase" title={bet.Selection}>{bet.Selection}</div>
                        <div className="text-center font-black text-black">{bet.Rate}</div>
                        <div className="text-center font-black text-black">{bet.Stake}</div>
                        <div className="text-right font-bold text-gray-500 whitespace-nowrap overflow-hidden text-[7.5px]">{dateStr}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BetSlip;
