import React from 'react';
import { getRunnerRates, getMarketStatus } from '../../../utils/rateRefiner';
import InlineBetBox from './InlineBetBox';
import CashoutButton from './CashoutButton';

const OddsTable = ({ marketData, onBetClick, marketName, liveRates = {}, selectedBet, onCancelBet, sport, isInPlay, mobileView = false, isGrouped = false, onCashout, isCashoutLoading }) => {
  const displayName = marketData?.name || marketName || 'Match Odds';
  const oddsWidth = mobileView ? '50px' : '114.688px';
  const uniformHeight = mobileView ? '45px' : '35px';

  // Market ID for rates (only used if not grouped)
  const marketId = (marketData?.MarketId?.toString().startsWith('1.') || marketData?.marketid?.toString().startsWith('1.'))
    ? (marketData?.MarketId || marketData?.marketid)
    : (marketData?.eid || marketData?.MarketId || marketData?.marketid);

  const rateData = isGrouped ? null : liveRates[marketId];
  const { isSuspended: isMarketSuspended, msg: marketSuspensionMsg } = isGrouped 
    ? { isSuspended: false, msg: '' } 
    : getMarketStatus(rateData, marketData?.Type);

  const baseFont = {
    fontFamily: 'Tahoma, Helvetica, sans-serif',
    fontSize: mobileView ? '11px' : '12px',
    lineHeight: '15px',
    fontWeight: '400',
    letterSpacing: 'normal'
  };

  const cellStyle = (bgColor, customWidth) => ({
    width: customWidth || oddsWidth,
    minWidth: customWidth || oddsWidth,
    height: uniformHeight,
    backgroundColor: bgColor,
    textAlign: 'center',
    cursor: 'pointer',
    borderRight: '1px solid #fff',
    borderBottom: '1px solid #fff',
    verticalAlign: 'middle',
    padding: '2px 0',
    position: 'relative',
    ...baseFont
  });

  const suspensionOverlayStyle = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(224, 224, 224, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'none'
  };

  const suspensionTextStyle = {
    color: '#0d47a1',
    fontSize: '9px',
    fontWeight: '900',
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: '1',
    whiteSpace: 'nowrap'
  };

  const headerTabStyle = (bgColor, textColor, isBack) => ({
    height: '20px',
    width: '100%',
    backgroundColor: bgColor,
    color: textColor || '#1e1e1e',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    marginTop: '0px',
    border: '1px solid rgba(0,0,0,0.08)',
    borderBottom: 'none',
    clipPath: isBack
      ? 'polygon(10px 0, 100% 0, 100% 100%, 0 100%)'
      : 'polygon(0 0, calc(100% - 10px) 0, 100% 100%, 0 100%)'
  });

  return (
    <div style={{ width: '100%', marginBottom: '16px', overflow: 'hidden' }}>

      {/* HEADER SECTION */}
      {marketData?.Type === 'ODDS' && !isGrouped ? (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          border: '1px solid #d9d9d9',
          borderBottom: 'none',
          height: mobileView ? '36px' : '42px',
          position: 'relative',
          ...baseFont
        }}>
          {/* Left Section */}
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
            <div style={{
              background: '#cfd8dc',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              padding: mobileView ? '0 8px' : '0 12px',
              fontWeight: '700',
              color: '#2b3a47',
              fontSize: mobileView ? '12px' : '14px',
              whiteSpace: 'nowrap'
            }}>
              {displayName}
            </div>
          </div>

          <div style={{ display: 'flex', gap: mobileView ? '8px' : '15px', alignItems: 'center', paddingRight: mobileView ? '8px' : '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: mobileView ? '10px' : '11px' }}>
              <span style={{ background: '#4b5965', color: '#fff', padding: '1px 4px', borderRadius: '2px', fontSize: '9px' }}>Min</span>
              <span style={{ fontWeight: '700', color: '#2b3a47' }}>{marketData?.min || '0'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: mobileView ? '10px' : '11px' }}>
              <span style={{ background: '#4b5965', color: '#fff', padding: '1px 4px', borderRadius: '2px', fontSize: '9px' }}>Max</span>
              <span style={{ fontWeight: '700', color: '#2b3a47' }}>{marketData?.max || '0'}</span>
            </div>
            {onCashout && (
              <CashoutButton
                onCashout={() => onCashout(marketId, displayName, Object.values(marketData?.runners || {}), marketData?.Type)}
                isLoading={isCashoutLoading}
                mobileView={mobileView}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#1f2933] text-white flex items-center justify-between px-3 py-2">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            <span className="font-bold text-sm">{displayName}</span>
            <span className="mx-2 text-gray-400">|</span>
            <span className="text-sm text-gray-300">Zero Commission</span>
          </div>
          <div className="flex gap-2 sm:gap-4 items-center pr-1 sm:pr-2">
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px]">
              <span className="bg-gray-600 px-1 rounded-sm text-[9px]">Min</span>
              <span className="font-bold">{marketData?.min || '0'}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px]">
              <span className="bg-gray-600 px-1 rounded-sm text-[9px]">Max</span>
              <span className="font-bold">{marketData?.max || '0'}</span>
            </div>
          </div>
        </div>
      )}

      {/* TABLE */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: '#e4e7ed',
        border: '1px solid #d9d9d9',
        tableLayout: 'fixed'
      }}>

        <thead>
          <tr style={{
            height: mobileView ? '24px' : '32px',
            color: '#1e1e1e',
            borderBottom: '1px solid #d9d9d9',
            position: 'relative',
            ...baseFont
          }}>
            <th style={{ textAlign: 'left', paddingLeft: '12px', width: '100%', fontSize: mobileView ? '10px' : '12px', position: 'relative' }}>
              {Object.keys(marketData?.runners || {}).length} selections
            </th>

            {/* Fixed Rate Columns */}
            {(!mobileView && marketData?.Type !== 'LINE') && (
              <>
                <th style={{ width: oddsWidth }}></th>
                <th style={{ width: oddsWidth }}></th>
              </>
            )}
            
            <th style={{ width: oddsWidth, padding: 0, verticalAlign: 'bottom' }}>
              <div style={{ overflow: 'hidden', borderTopLeftRadius: '6px' }}>
                <div style={headerTabStyle(marketData?.Type === 'LINE' ? '#faa9ba' : '#72bbef', '#1e1e1e', true)}>
                  {marketData?.Type === 'LINE' ? 'No' : (mobileView ? 'Back' : 'Back all')}
                </div>
              </div>
            </th>
            <th style={{ width: oddsWidth, padding: 0, verticalAlign: 'bottom' }}>
              <div style={{ overflow: 'hidden', borderTopRightRadius: '6px' }}>
                <div style={headerTabStyle(marketData?.Type === 'LINE' ? '#72bbef' : '#faa9ba', '#1e1e1e', false)}>
                  {marketData?.Type === 'LINE' ? 'Yes' : (mobileView ? 'Lay' : 'Lay all')}
                </div>
              </div>
            </th>

            {(!mobileView && marketData?.Type !== 'LINE') && (
              <>
                <th style={{ width: oddsWidth }}></th>
                <th style={{ width: oddsWidth }}></th>
              </>
            )}
          </tr>
        </thead>

        <tbody style={{ backgroundColor: 'white' }}>
          {Object.values(marketData?.runners || {}).map((runner, idx) => {
            const runnerId = runner.selectionId || runner.SelectionId || runner.id || idx;
            const currentMarketId = isGrouped 
              ? (runner.MarketId || runner.marketid || runner.eid || runner.id) 
              : marketId;
            
            const currentRateData = isGrouped ? liveRates[currentMarketId] : rateData;
            const currentMarketType = isGrouped ? runner.Type : marketData?.Type;

            const rates = getRunnerRates(currentRateData, isGrouped ? 0 : runnerId, idx, currentMarketType);
            const { isSuspended: isMarketSuspendedInner, msg: marketSuspensionMsgInner } = isGrouped 
              ? getMarketStatus(currentRateData, currentMarketType)
              : { isSuspended: isMarketSuspended, msg: marketSuspensionMsg };

            const isSuspended = isMarketSuspendedInner || rates?.isRunnerSuspended;
            const suspensionMsg = rates?.suspensionMsg || marketSuspensionMsgInner;

            const isLine = currentMarketType === 'LINE';

            return (
              <React.Fragment key={idx}>
                <tr style={{ height: uniformHeight, borderBottom: '1px solid #e4e7ed' }}>
                  <td style={{ paddingLeft: mobileView ? '8px' : '16px', width: '100%', fontWeight: '700', color: '#2b3a47', borderRight: '1px solid #e4e7ed', wordBreak: 'break-word', overflow: 'hidden' }}>
                    <div style={{ fontSize: mobileView ? '12px' : '14px', lineHeight: '1.2' }}>{runner.RunnerName}</div>
                    {(() => {
                      const chartVal = rates?.chart ??
                        (runner.Chart !== undefined && runner.Chart !== null ? parseFloat(runner.Chart) :
                          runner.Chart1 !== undefined && runner.Chart1 !== null ? parseFloat(runner.Chart1) :
                            runner.Chart2 !== undefined && runner.Chart2 !== null ? parseFloat(runner.Chart2) : null);

                      if (chartVal !== null && !isNaN(chartVal) && chartVal !== 0) {
                        return (
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            marginTop: '2px',
                            color: chartVal < 0 ? '#d0021b' : '#2aa84a'
                          }}>
                            {chartVal < 0 ? chartVal.toFixed(0) : `(${chartVal.toFixed(2)})`}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </td>

                  <td colSpan={mobileView || isLine ? 2 : 6} style={{ padding: 0, position: 'relative' }}>
                    <div style={{ display: 'flex', width: '100%', height: uniformHeight, justifyContent: 'flex-end' }}>
                      {(!mobileView && !isLine) && (
                        <>
                          {/* Back 3 */}
                          <div style={cellStyle('#e2f2fe')} onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'back', rates?.back?.p3, idx, runnerId, isGrouped ? runner : null)}>
                            <div style={{ fontWeight: '700' }}>{rates?.back?.p3 || '-'}</div>
                            <div style={{ fontSize: '10px', color: '#707c8a' }}>{rates?.back?.v3 || '-'}</div>
                          </div>

                          {/* Back 2 */}
                          <div style={cellStyle('#add8f4')} onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'back', rates?.back?.p2, idx, runnerId, isGrouped ? runner : null)}>
                            <div style={{ fontWeight: '700' }}>{rates?.back?.p2 || '-'}</div>
                            <div style={{ fontSize: '10px', color: '#707c8a' }}>{rates?.back?.v2 || '-'}</div>
                          </div>
                        </>
                      )}

                      {/* Back 1 / NO for Line */}
                      <div 
                        style={cellStyle(isLine ? '#faa9ba' : '#72bbef', mobileView || isLine ? '50%' : null)} 
                        onClick={() => !isSuspended && onBetClick(isLine ? 'No' : runner.RunnerName, isLine ? 'lay' : 'back', rates?.back?.p1, idx, runnerId, isGrouped ? runner : null)}
                      >
                        <div style={{ fontWeight: '900', fontSize: mobileView || isLine ? '14px' : '12px' }}>{rates?.back?.p1 || '-'}</div>
                        <div style={{ fontSize: '10px' }}>{rates?.back?.v1 || '-'}</div>
                      </div>

                      {/* Lay 1 / YES for Line */}
                      <div 
                        style={cellStyle(isLine ? '#72bbef' : '#faa9ba', mobileView || isLine ? '50%' : null)} 
                        onClick={() => !isSuspended && onBetClick(isLine ? 'Yes' : runner.RunnerName, isLine ? 'back' : 'lay', rates?.lay?.p1, idx, runnerId, isGrouped ? runner : null)}
                      >
                        <div style={{ fontWeight: '900', fontSize: mobileView || isLine ? '14px' : '12px' }}>{rates?.lay?.p1 || '-'}</div>
                        <div style={{ fontSize: '10px' }}>{rates?.lay?.v1 || '-'}</div>
                      </div>

                      {(!mobileView && !isLine) && (
                        <>
                          {/* Lay 2 */}
                          <div style={cellStyle('#fbcbd5')} onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'lay', rates?.lay?.p2, idx, runnerId, isGrouped ? runner : null)}>
                            <div style={{ fontWeight: '700' }}>{rates?.lay?.p2 || '-'}</div>
                            <div style={{ fontSize: '10px', color: '#707c8a' }}>{rates?.lay?.v2 || '-'}</div>
                          </div>

                          {/* Lay 3 */}
                          <div style={{ ...cellStyle('#fde4ea'), borderRight: 'none' }} onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'lay', rates?.lay?.p3, idx, runnerId, isGrouped ? runner : null)}>
                            <div style={{ fontWeight: '700' }}>{rates?.lay?.p3 || '-'}</div>
                            <div style={{ fontSize: '10px', color: '#707c8a' }}>{rates?.lay?.v3 || '-'}</div>
                          </div>
                        </>
                      )}

                      {/* Single Suspension Overlay */}
                      {isSuspended && (
                        <div style={suspensionOverlayStyle}>
                          <span style={suspensionTextStyle}>{suspensionMsg}</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Render Inline Bet Box if this runner is selected */}
                {selectedBet?.runner === runner.RunnerName && selectedBet?.market === (isGrouped ? runner.RunnerName : displayName) && (
                  <tr>
                    <td colSpan={mobileView ? 3 : 7} style={{ padding: 0 }}>
                      <InlineBetBox
                        selection={selectedBet}
                        matchId={isGrouped ? currentMarketId : marketId}
                        onCancel={onCancelBet}
                        sport={sport}
                        mobileView={mobileView}
                      />
                    </td>
                  </tr>
                )}

                {/* Runner Message Row */}
                {runner.Msg && runner.Msg !== '' && (
                  <tr style={{ backgroundColor: 'transparent' }}>
                    <td colSpan={mobileView ? 3 : 7} style={{ padding: '2px 16px', overflow: 'hidden', borderBottom: '1px solid rgb(228, 231, 237)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '20px' }}>
                        <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          <span className="animate-ticker" style={{ fontSize: '10px', fontWeight: '800', color: '#d0021b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {runner.Msg}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}

          {/* Market-level Message Row */}
          {marketData?.Msg && marketData?.Msg !== '' && (
            <tr style={{ backgroundColor: 'transparent' }}>
              <td colSpan={mobileView ? 3 : 7} style={{ padding: '2px 16px', overflow: 'hidden', borderBottom: '1px solid rgb(228, 231, 237)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '20px' }}>
                  <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <span className="animate-ticker" style={{ fontSize: '10px', fontWeight: '800', color: '#d0021b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {marketData.Msg}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OddsTable;