import { fetchAPI } from '../../utils/api';

export const userController = {
  getBalance: (loginToken) => fetchAPI('/balance', { LoginToken: loginToken }),
  editStake: (loginToken, stakes) => fetchAPI('/editstake', { LoginToken: loginToken, ...stakes }),
  getStakeButtons: (loginToken) => fetchAPI('/stakebutton', { LoginToken: loginToken }),
  getOffers: (loginToken) => fetchAPI('/offers', { LoginToken: loginToken }),
  getOfferDetail: (loginToken, offerId) => fetchAPI('/offersdetail', { LoginToken: loginToken, OfferId: offerId }),
  claimOffer: (loginToken, offerId) => fetchAPI('/claimoffers', { LoginToken: loginToken, OfferId: offerId }),
  getNews: (loginToken) => fetchAPI('/news', { LoginToken: loginToken }),
  getPopupImage: (loginToken) => fetchAPI('/popupimg', { LoginToken: loginToken }),
  toggleFavourite: (loginToken, eid) => fetchAPI('/favourite', { LoginToken: loginToken, Eid: eid }),
  getWhatsAppLink: () => fetchAPI('/wplink', { LoginToken: '' }),
  getTurnover: (loginToken) => fetchAPI('/turnover', { LoginToken: loginToken }),
  getAccountStatement: (loginToken, sdate, edate) => fetchAPI('/pl', { LoginToken: loginToken, sdate, edate }),
};
