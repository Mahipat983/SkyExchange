import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { bettingController } from '../../../controllers';
import { userController } from '../../../controllers/user/userController';
import { useSnackbarStore } from '../../../store/snackbarStore';
import { useBettingStore } from '../../../store/bettingStore';

const InlineBetBox = ({ selection, matchId, onCancel, onSuccess, sport }) => {
  const { loginToken } = useAuthStore();
  const showSnackbar = useSnackbarStore(state => state.show);
  const { stakes: globalStakes, setStakes: setGlobalStakes } = useBettingStore();
  const [stake, setStake] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [acceptAnyOdds, setAcceptAnyOdds] = useState(true);

  useEffect(() => {
    if (loginToken) {
      userController.getStakeButtons(loginToken).then((res) => {
        if (res && typeof res === 'object') {
          const stakeData = [];
          for (let i = 1; i <= 6; i++) {
            const item = res[i.toString()] || res[i];
            if (item) {
              stakeData.push({ 
                label: item.Btnname || item.btnname || `S${i}`, 
                value: parseInt(item.Btnval || item.btnval || '0') 
              });
            }
          }
          if (stakeData.length > 0) {
            setGlobalStakes(stakeData);
          }
        }
      }).catch(err => {
        console.error('Failed to fetch stake buttons:', err);
      });
    }
  }, [loginToken, setGlobalStakes]);

  const isBack = selection?.type === 'back' || selection?.type === 'yes';
  const bgColor = isBack ? '#d0e6f6' : '#f5d5d6';
  const borderColor = isBack ? '#a5d9fe' : '#f8d0ce';

  const handleStakeClick = (val) => {
    setStake((prev) => {
      const current = parseFloat(prev) || 0;
      return (current + val).toString();
    });
  };

  const handlePlaceBet = async () => {
    if (!stake || parseFloat(stake) <= 0) {
      showSnackbar('Please enter a valid stake amount', 'error');
      return;
    }
    if (!loginToken) {
      showSnackbar('Please login to place a bet', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const market = selection.marketData;
      const mType = market?.Type?.toUpperCase() || 'ODDS';
      const isRacing = sport?.toLowerCase() === 'horse racing' || 
                       sport?.toLowerCase() === 'greyhound racing' ||
                       sport?.toLowerCase() === 'horse-racing' ||
                       sport?.toLowerCase() === 'greyhound-racing';

      const common = {
        LoginToken: loginToken,
        Eid: market?.eid || matchId || market?.MarketId || market?.marketid,
        Amount: stake,
        Rate: selection.price,
        IP: '127.0.0.1' // or dynamic if needed
      };

      const teamMap = { 0: 'A', 1: 'B', 2: 'C' };
      const teamLetter = teamMap[selection.runnerIndex] || 'A';

      const isFancyMarket = mType === 'FANCY' || mType === 'LINE';
      // Inverse logic for Fancy/Line: Back clicked -> 'L', Lay clicked -> 'B'
      const betTypeChar = isFancyMarket
        ? (isBack ? 'L' : 'B')
        : (isBack ? 'B' : 'L');

      let res;

      if (isRacing) {
        // Implementation for /dealwinner for Racing as requested
        res = await bettingController.placeWinnerBet({
          ...common,
          SelectionId: selection.selectionId || selection.runnerIndex || '',
          Type: betTypeChar
        });
      } else {
        switch (mType) {
          case 'BOOKMAKER':
            res = await bettingController.placeBookmakerBet({
              ...common,
              Team: teamLetter,
              Type: betTypeChar
            });
            break;

          case 'FANCY':
            res = await bettingController.placeFancyBet({
              ...common,
              No: market?.noVal || 100, // typically need to pass actual min/max if required, but betting-pwa used 100
              Yes: market?.yesVal || 100,
              Type: betTypeChar
            });
            break;

          case 'LINE':
            res = await bettingController.placeLineBet({
              ...common,
              Type: betTypeChar
            });
            break;

          case 'EXTRA':
            res = await bettingController.placeExtraBet({
              ...common,
              Team: teamLetter,
              Type: betTypeChar
            });
            break;

          case 'GOAL':
          case 'GOALS':
          case 'WINNETSET':
            res = await bettingController.placeGoalBet({
              ...common,
              Team: teamLetter,
              Type: betTypeChar
            });
            break;

          default: // ODDS
            const runnersCount = Object.keys(market?.runners || {}).length;
            if (runnersCount === 3) {
              res = await bettingController.place3TeamOddBet({
                ...common,
                Team: teamLetter,
                Type: betTypeChar
              });
            } else {
              res = await bettingController.place2TeamOddBet({
                ...common,
                Team: teamLetter,
                Type: betTypeChar
              });
            }
            break;
        }
      }

      if (res && (res.status === 'Success' || res.status === 200 || res.success || res.error === '0')) {
        showSnackbar(`Bet placed successfully @ ${selection.price} of ${stake}!`, 'success');
        
        // Dispatch event to signal data refresh (for exposure/charts)
        window.dispatchEvent(new CustomEvent('bet-placed', { 
          detail: { matchId: market?.eid || matchId || market?.MarketId || market?.marketid } 
        }));

        if (onSuccess) onSuccess();
        onCancel();
      } else {
        showSnackbar(res?.msg || res?.message || res?.description || "Failed to place bet", 'error');
      }
    } catch (err) {
      console.error(err);
      showSnackbar("An error occurred while placing bet", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: bgColor, borderBottom: `2px solid ${borderColor}`, fontSize: '12px' }}>
      {/* Top Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="checkbox"
            checked={acceptAnyOdds}
            onChange={(e) => setAcceptAnyOdds(e.target.checked)}
            id="accept-odds"
            style={{ cursor: 'pointer', margin: 0, width: '14px', height: '14px' }}
          />
          <label htmlFor="accept-odds" style={{ color: '#00508a', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
            Accept Any Odds
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'stretch', gap: '6px', height: '32px' }}>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: '#f8f8f8',
              border: '1px solid #c9c9c9',
              borderRadius: '3px',
              padding: '0 16px',
              fontWeight: 'bold',
              color: '#333',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
            Cancel
          </button>

          <div style={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '3px',
            minWidth: '55px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px 6px'
          }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', lineHeight: '1', color: '#1e1e1e' }}>{selection.price}</span>
            <span style={{ fontSize: '10px', color: '#888', lineHeight: '1', marginTop: '1px' }}>100</span>
          </div>

          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            style={{
              width: '100px',
              border: '1px solid #ccc',
              borderRadius: '3px',
              padding: '0 8px',
              fontWeight: 'bold',
              fontSize: '14px',
              outline: 'none'
            }}
          />

          <button
            onClick={handlePlaceBet}
            disabled={isLoading || !stake}
            style={{
              background: (!stake || isLoading)
                ? '#9e9e9e'
                : 'linear-gradient(180deg, #9f9b99 0%, #877f7d 100%)',
              border: '1px solid #7a716e',
              borderRadius: '3px',
              padding: '0 24px',
              fontWeight: 'bold',
              color: (!stake || isLoading) ? '#e0e0e0' : '#fac973',
              fontSize: '14px',
              cursor: (!stake || isLoading) ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
            {isLoading ? 'Placing...' : 'Place Bets'}
          </button>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', padding: '0 10px 10px 10px' }}>
        {globalStakes.map((stakeObj, idx) => (
          <button
            key={idx}
            onClick={() => handleStakeClick(stakeObj.value)}
            style={{
              backgroundColor: '#fdfdfd',
              border: '1px solid #c9c9c9',
              borderRadius: '3px',
              padding: '5px 0',
              width: '75px',
              fontWeight: 'bold',
              color: '#333',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
            {stakeObj.value}
          </button>
        ))}
      </div>
    </div>
  );
};

export default InlineBetBox;
