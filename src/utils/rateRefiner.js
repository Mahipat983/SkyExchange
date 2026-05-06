/**
 * rateRefiner.js
 * Centralized logic for parsing diverse market rates from the API.
 * Ported and refined from betting-pwa sportsbook logic.
 */

export const getRunnerRates = (rateData, runnerId, rIdx, marketType) => {
  if (!rateData) return null;

  let isRunnerSuspended = false;

  // 1. Identify the list of runners in this rate update
  const runnersData = rateData.runner || rateData.runners || rateData.rates || [];
  const runnerArr = Array.isArray(runnersData) ? runnersData : Object.values(runnersData);

  // 2. Find the specific runner
  let r = runnerArr.find((item) =>
    (item.selectionId && item.selectionId.toString() === runnerId?.toString()) ||
    (item.id && item.id.toString() === runnerId?.toString()) ||
    (item.team === (rIdx === 0 ? 'A' : (rIdx === 1 ? 'B' : 'C')))
  );

  // Fallback to index if not found by ID/Team
  if (!r && runnerArr.length > 0) {
    // For Fancy/Line, we often only have one runner object in the rateData itself or at index 0
    if (marketType === 'FANCY' || marketType === 'LINE') {
      r = runnerArr[0] || rateData;
    } else {
      r = runnerArr[rIdx];
    }
  }

  // If still no runner found, but it's a flat rate object (Fancy/Line)
  if (!r && (marketType === 'FANCY' || marketType === 'LINE')) {
    r = rateData;
  }

  if (!r) return null;

  // 3. Determine Suspension Status
  if (marketType === 'BOOKMAKER') {
    const s = (r.selectionStatus || r.selectionstatus || '').toUpperCase();
    if (s !== 'ACTIVE' && s !== 'OPEN') isRunnerSuspended = true;
  } else if (
    r.selectionStatus === 'SUSPENDED' || 
    r.status === 'SUSPENDED' || 
    r.selectionStatus === '1' || 
    r.status === '1' ||
    rateData.suspended === 'Y' ||
    rateData.status === 'SUSPENDED'
  ) {
    isRunnerSuspended = true;
  }

  // 4. Fancy specific suspension (Ball Running)
  if (marketType === 'FANCY' || marketType === 'LINE') {
    const n1 = parseFloat(r.no1 || '0');
    const n2 = parseFloat(r.no2 || '0');
    // If both are zero, it's typically "Ball Running" or "Suspended"
    if (n1 === 0 && n2 === 0 && (r.no1 !== undefined || r.no2 !== undefined)) {
      isRunnerSuspended = true;
    }
  }

  // 5. Price Extraction Logic
  const getPrices = (target, type) => {
    if (!target) return { p1: '', v1: '', p2: '', v2: '', p3: '', v3: '' };
    
    // Check for nested exchange data first (typical for ODDS)
    const exData = type === 'back' 
      ? (target.back || target.availableToBack || target.ex?.availableToBack) 
      : (target.lay || target.availableToLay || target.ex?.availableToLay);

    if (exData) {
      const arr = Array.isArray(exData) ? exData : Object.values(exData);
      return {
        p1: (arr[0]?.rate || arr[0]?.price || '')?.toString(),
        v1: (arr[0]?.size || '')?.toString(),
        p2: (arr[1]?.rate || arr[1]?.price || '')?.toString(),
        v2: (arr[1]?.size || '')?.toString(),
        p3: (arr[2]?.rate || arr[2]?.price || '')?.toString(),
        v3: (arr[2]?.size || '')?.toString(),
      };
    }

    // Flat field fallback (Typical for BOOKMAKER/FANCY)
    if (marketType === 'BOOKMAKER') {
      // Bookmaker: no1 is BACK, no2 is LAY
      return {
        p1: (type === 'back' ? (target.no1 ?? target.BackPrice1 ?? target.rate) : (target.no2 ?? target.LayPrice1 ?? target.rate))?.toString() || '',
        v1: (type === 'back' ? (target.valy ?? target.size) : (target.valn ?? target.size))?.toString() || '',
        p2: (type === 'back' ? target.BackPrice2 : target.LayPrice2)?.toString() || '',
        v2: (type === 'back' ? target.BackSize2 : target.LaySize2)?.toString() || '',
        p3: (type === 'back' ? target.BackPrice3 : target.LayPrice3)?.toString() || '',
        v3: (type === 'back' ? target.BackSize3 : target.LaySize3)?.toString() || '',
      };
    }

    // FANCY Logic: no1 is typically NO (Lay), no2 is typically YES (Back)
    const formatP = (v) => {
      if (!v) return '';
      const num = parseFloat(v);
      return isNaN(num) ? v.toString() : Math.round(num).toString();
    };

    return {
      p1: (type === 'back' ? formatP(target.no2 ?? target.BackPrice1 ?? target.rate) : formatP(target.no1 ?? target.LayPrice1 ?? target.rate)) || '',
      v1: (type === 'back' ? (target.valy ?? target.size) : (target.valn ?? target.size))?.toString() || '',
      p2: '', v2: '', p3: '', v3: ''
    };
  };

  const chartVal = (r.Chart !== undefined && r.Chart !== null) ? parseFloat(r.Chart) :
    (r.Chart1 !== undefined && r.Chart1 !== null) ? parseFloat(r.Chart1) :
    (r.Chart2 !== undefined && r.Chart2 !== null) ? parseFloat(r.Chart2) : null;

  return {
    back: getPrices(r, 'back'),
    lay: getPrices(r, 'lay'),
    isRunnerSuspended,
    suspensionMsg: rateData.Msg || (rateData.ball_run === 'Y' ? 'BALL RUNNING' : 'SUSPENDED'),
    chart: chartVal
  };
};

/**
 * Extracts the correct market status message
 */
export const getMarketStatus = (rateData, marketType) => {
  if (!rateData) return { isSuspended: false, msg: '' };

  let isSuspended = false;
  let msg = rateData.Msg || 'SUSPENDED';

  if (marketType === 'LINE') {
    isSuspended = rateData.status === 'SUSPENDED';
  } else if (marketType === 'FANCY') {
    if (rateData.suspended === 'Y' || rateData.suspended === '1' || rateData.status === 'SUSPENDED') {
      isSuspended = true;
    } else {
      const n1 = parseFloat(rateData.no1 || '0');
      const n2 = parseFloat(rateData.no2 || '0');
      if (n1 === 0 && n2 === 0 && (rateData.no1 !== undefined || rateData.no2 !== undefined)) {
        isSuspended = true;
        msg = 'BALL RUNNING';
      } else if (rateData.ball_run === 'Y' || rateData.status1 === '1' || rateData.status1 === '2') {
        isSuspended = true;
        msg = 'BALL RUNNING';
      }
    }
  } else if (marketType === 'BOOKMAKER') {
    isSuspended = rateData.suspended === 'Y' || rateData.ball_run === 'Y' || rateData.status === 'SUSPENDED';
  } else {
    isSuspended = rateData.status === 'SUSPENDED' || rateData.suspended === 'Y' || rateData.active === 'No';
  }

  return { isSuspended, msg };
};
