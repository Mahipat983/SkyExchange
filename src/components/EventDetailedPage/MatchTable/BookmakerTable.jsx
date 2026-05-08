import React from 'react';
import { getRunnerRates, getMarketStatus } from '../../../utils/rateRefiner';
import InlineBetBox from './InlineBetBox';

/**
 * BookmakerTable Component
 * 
 * Renders the Bookmaker market table (0% Commission markets).
 */
const BookmakerTable = ({ bookmakerData, onBetClick, liveRates = {}, selectedBet, onCancelBet }) => {
  // Extract runners from bookmakerData
  const runnersList = bookmakerData?.runners ? Object.values(bookmakerData.runners) : [];
  const runners = runnersList.length > 0 ? runnersList : [];

  // Market ID for rates
  const marketId = (bookmakerData?.MarketId?.toString().startsWith('1.') || bookmakerData?.marketid?.toString().startsWith('1.'))
    ? (bookmakerData?.MarketId || bookmakerData?.marketid)
    : (bookmakerData?.eid || bookmakerData?.MarketId || bookmakerData?.marketid);

  const rateData = liveRates[marketId];
  const { isSuspended: isMarketSuspended, msg: marketSuspensionMsg } = getMarketStatus(rateData, 'BOOKMAKER');

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

  return (
    <div className="mb-4">
      {/* Header Bar */}
      <div className="bg-[#1f2933] text-white flex items-center px-3 py-2">
        <a id="multiMarketPin" className="add-pin" title="Add to Multi Markets">Add Pin</a>
        <span className="font-bold text-sm">{bookmakerData?.name || 'Bookmaker Market'}</span>
        <span className="mx-2 text-gray-400">|</span>
        <span className="text-sm text-gray-300">Zero Commission</span>
      </div>

      {/* Sub-Header */}
      <div className="bg-[#f0f4f7] flex justify-between items-center px-2 py-1.5 border-b border-[#cdd4d9]">
        <div className="text-sm text-gray-800 font-medium">Bookmaker</div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <div className="flex items-center gap-1">
            <span className="bg-[#4b5965] text-white px-2 py-0.5 rounded-sm">Min</span>
            <span className="text-gray-800">{bookmakerData?.min || '0.00'}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-[#4b5965] text-white px-2 py-0.5 rounded-sm">Max</span>
            <span className="text-gray-800">{bookmakerData?.max || '0.00'}</span>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="w-full">
        {/* Table Header Row */}
        <div className="flex bg-[#fffce3] h-[24px]" style={{ borderBottom: '1px solid rgb(228, 231, 237)' }}>
          <div className="flex-1 border-r border-[#e4e7ed]"></div>
          <div className="w-[688.128px] flex text-center">
            <div className="w-[114.688px]"></div>
            <div className="w-[114.688px]"></div>
            <div
              className="w-[114.688px] flex items-center justify-center"
              style={{ fontFamily: 'Tahoma, Helvetica, sans-serif', fontSize: '12px', lineHeight: '22px', fontWeight: 400, letterSpacing: 'normal', color: '#1E1E1E' }}
            >
              Back
            </div>
            <div
              className="w-[114.688px] flex items-center justify-center"
              style={{ fontFamily: 'Tahoma, Helvetica, sans-serif', fontSize: '12px', lineHeight: '22px', fontWeight: 400, letterSpacing: 'normal', color: '#1E1E1E' }}
            >
              Lay
            </div>
            <div className="w-[114.688px]"></div>
            <div className="w-[114.688px]"></div>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex flex-col">
          {runners.map((runner, idx) => {
            const runnerId = runner.selectionId || runner.SelectionId || runner.id || idx;
            const rates = getRunnerRates(rateData, runnerId, idx, 'BOOKMAKER');
            const isSuspended = isMarketSuspended || rates?.isRunnerSuspended;
            const suspensionMsg = rates?.suspensionMsg || marketSuspensionMsg;

            return (
              <React.Fragment key={idx}>
                <div className="flex bg-[#fffce3] min-h-[42px]" style={{ borderBottom: '1px solid rgb(228, 231, 237)' }}>
                  {/* Runner Name */}
                  <div className="flex-1 px-4 flex flex-col justify-center border-r border-[#e4e7ed]">
                    <span className="font-bold text-sm text-black">{runner.RunnerName}</span>
                    {(() => {
                      const chartVal = rates?.chart ??
                        (runner.Chart !== undefined && runner.Chart !== null ? parseFloat(runner.Chart) :
                          runner.Chart1 !== undefined && runner.Chart1 !== null ? parseFloat(runner.Chart1) :
                            runner.Chart2 !== undefined && runner.Chart2 !== null ? parseFloat(runner.Chart2) : null);

                      if (chartVal !== null && !isNaN(chartVal) && chartVal !== 0) {
                        return (
                          <div className={`text-[11px] font-bold mt-0.5 ${chartVal < 0 ? 'text-[#d0021b]' : 'text-[#2aa84a]'}`}>
                            {chartVal < 0 ? chartVal.toFixed(0) : `(${chartVal.toFixed(2)})`}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Odds Area */}
                  <div className="relative flex w-[688.128px] h-[42px]">
                    {/* Back 3 */}
                    <div
                      className="flex flex-col items-center justify-center bg-[#e4eff6] cursor-pointer hover:opacity-80 transition-opacity border-r border-white/50"
                      style={{ fontFamily: 'Tahoma, Helvetica, sans-serif', fontSize: '12px', lineHeight: '15px', fontWeight: 400, letterSpacing: 'normal', color: '#1E1E1E', width: '114.688px', height: '42px', boxSizing: 'border-box' }}
                      onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'back', rates?.back?.p3, idx)}
                    >
                      <span className="font-bold">{rates?.back?.p3 || '-'}</span>
                      <span className="text-[10px] text-gray-500">{rates?.back?.v3 || '-'}</span>
                    </div>

                    {/* Back 2 */}
                    <div
                      className="flex flex-col items-center justify-center bg-[#cfe3f1] cursor-pointer hover:opacity-80 transition-opacity border-r border-white/50"
                      style={{ fontFamily: 'Tahoma, Helvetica, sans-serif', fontSize: '12px', lineHeight: '15px', fontWeight: 400, letterSpacing: 'normal', color: '#1E1E1E', width: '114.688px', height: '42px', boxSizing: 'border-box' }}
                      onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'back', rates?.back?.p2, idx)}
                    >
                      <span className="font-bold">{rates?.back?.p2 || '-'}</span>
                      <span className="text-[10px] text-gray-500">{rates?.back?.v2 || '-'}</span>
                    </div>

                    {/* Back 1 (Main) */}
                    <div
                      className="flex flex-col items-center justify-center bg-[#72bbef] border border-white cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ fontFamily: 'Tahoma, Helvetica, sans-serif', fontSize: '12px', lineHeight: '15px', fontWeight: 400, letterSpacing: 'normal', color: '#1E1E1E', width: '114.688px', height: '42px', boxSizing: 'border-box' }}
                      onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'back', rates?.back?.p1, idx)}
                    >
                      <span className="font-bold">{rates?.back?.p1 || '-'}</span>
                      <span className="text-[10px]">{rates?.back?.v1 || '-'}</span>
                    </div>

                    {/* Lay 1 (Main) */}
                    <div
                      className="flex flex-col items-center justify-center bg-[#faa9ba] border border-white cursor-pointer hover:opacity-80 transition-opacity"
                      style={{ fontFamily: 'Tahoma, Helvetica, sans-serif', fontSize: '12px', lineHeight: '15px', fontWeight: 400, letterSpacing: 'normal', color: '#1E1E1E', width: '114.688px', height: '42px', boxSizing: 'border-box' }}
                      onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'lay', rates?.lay?.p1, idx)}
                    >
                      <span className="font-bold">{rates?.lay?.p1 || '-'}</span>
                      <span className="text-[10px]">{rates?.lay?.v1 || '-'}</span>
                    </div>

                    {/* Lay 2 */}
                    <div
                      className="flex flex-col items-center justify-center bg-[#f2cfd5] cursor-pointer hover:opacity-80 transition-opacity border-l border-white/50"
                      style={{ fontFamily: 'Tahoma, Helvetica, sans-serif', fontSize: '12px', lineHeight: '15px', fontWeight: 400, letterSpacing: 'normal', color: '#1E1E1E', width: '114.688px', height: '42px', boxSizing: 'border-box' }}
                      onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'lay', rates?.lay?.p2, idx)}
                    >
                      <span className="font-bold">{rates?.lay?.p2 || '-'}</span>
                      <span className="text-[10px] text-gray-500">{rates?.lay?.v2 || '-'}</span>
                    </div>

                    {/* Lay 3 */}
                    <div
                      className="flex flex-col items-center justify-center bg-[#f6e3e7] cursor-pointer hover:opacity-80 transition-opacity border-l border-white/50"
                      style={{ fontFamily: 'Tahoma, Helvetica, sans-serif', fontSize: '12px', lineHeight: '15px', fontWeight: 400, letterSpacing: 'normal', color: '#1E1E1E', width: '114.688px', height: '42px', boxSizing: 'border-box' }}
                      onClick={() => !isSuspended && onBetClick(runner.RunnerName, 'lay', rates?.lay?.p3, idx)}
                    >
                      <span className="font-bold">{rates?.lay?.p3 || '-'}</span>
                      <span className="text-[10px] text-gray-500">{rates?.lay?.v3 || '-'}</span>
                    </div>

                    {/* Single Suspension Overlay across all 6 cells */}
                    {isSuspended && (
                      <div style={{ ...suspensionOverlayStyle, width: '100%' }}>
                        <span style={suspensionTextStyle}>{suspensionMsg}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Render Inline Bet Box if this runner is selected */}
                {selectedBet?.runner === runner.RunnerName && (selectedBet?.market === bookmakerData?.name || selectedBet?.market === 'Match Odds' || selectedBet?.market === 'Bookmaker Market') && (
                  <div className="w-full">
                    <InlineBetBox
                      selection={selectedBet}
                      matchId={marketId}
                      onCancel={onCancelBet}
                    />
                  </div>
                )}

                {/* Runner Message Row */}
                {runner.Msg && runner.Msg !== '' && (
                  <div className="flex bg-transparent py-0.5 px-4 overflow-hidden" style={{ borderBottom: '1px solid rgb(228, 231, 237)' }}>
                    <div className="flex items-center gap-2 w-full h-[20px]">
                      <div className="flex-1 overflow-hidden whitespace-nowrap">
                        <span className="animate-ticker text-[10px] font-black text-[#d0021b] uppercase tracking-wider">
                          {runner.Msg}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Market-level Message Row */}
          {bookmakerData?.Msg && bookmakerData?.Msg !== '' && (
            <div className="flex bg-transparent py-0.5 px-4 overflow-hidden" style={{ borderBottom: '1px solid rgb(228, 231, 237)' }}>
              <div className="flex items-center gap-2 w-full h-[20px]">
                <div className="flex-1 overflow-hidden whitespace-nowrap">
                  <span className="animate-ticker text-[10px] font-black text-[#d0021b] uppercase tracking-wider">
                    {bookmakerData.Msg}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmakerTable;
