import { fetchAPI } from '../../utils/api';

export const statementController = {
  getAccountStatement: (loginToken, sdate, edate) => fetchAPI('/statement', { LoginToken: loginToken, sdate, edate }),
  getBetStatement: (eid, loginToken) => fetchAPI('/statementbet', { Eid: eid, LoginToken: loginToken }),
};
