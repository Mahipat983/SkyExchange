import { fetchAPI } from '../../utils/api';

export const bettingController = {
  place2TeamOddBet: (data) => fetchAPI('/livedealodd2', data),
  place3TeamOddBet: (data) => fetchAPI('/livedealodd3', data),
  placeBookmakerBet: (data) => fetchAPI('/bookdealbodd', data),
  placeFancyBet: (data) => fetchAPI('/dealfancy', data),
  getFancyChart: (loginToken, eid) => fetchAPI('/fancychart', { LoginToken: loginToken, Eid: eid }),
  placeLineBet: (data) => fetchAPI('/dealline', data),
  placeExtraBet: (data) => fetchAPI('/dealextra', data),
  placeGoalBet: (data) => fetchAPI('/dealgoal', data),
  placeWinnerBet: (data) => fetchAPI('/dealwinner', data),
  cashout: (loginToken, eid) => fetchAPI('/cashout', { LoginToken: loginToken, Eid: eid }),
  getMyBets: (loginToken) => fetchAPI('/mybets', { LoginToken: loginToken }),
  getBetsByGame: (loginToken, gid) => fetchAPI('/sidebetlist', { LoginToken: loginToken, gid }),
  getProfitLoss: (loginToken, sdate, edate) => fetchAPI('/pl', { LoginToken: loginToken, sdate, edate }),
  getBetStatement: (eid, loginToken) => fetchAPI('/statementbet', { Eid: eid, LoginToken: loginToken }),
};
