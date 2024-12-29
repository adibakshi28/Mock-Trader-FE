// src/api/stockApi.js
import axiosClient from '../utils/axiosClient';

// GET /stock/search?ticker=xxx&asset_type=STOCK|CRYPTO|FOREX (optional)
export const searchStocks = async (ticker, assetType) => {
  // build query params
  const params = { ticker };
  if (assetType) {
    params.asset_type = assetType; // optional
  }
  const res = await axiosClient.get('/stock/search', { params });
  return res.data; // array of top matches
};

// GET /stock?ticker=xxx
// returns asset_type, quote, profile, financials, news
export const getStockInfo = async (ticker) => {
  const res = await axiosClient.get('/stock', {
    params: { ticker },
  });
  return res.data;
};

// GET /stock/historical?ticker=xxx
// returns { historical_price: [ { close, high, low, open, volume, ...}, ... ] }
export const getStockHistorical = async (ticker) => {
  const res = await axiosClient.get('/stock/historical', {
    params: { ticker },
  });
  return res.data;
};

// POST /stock/transaction?ticker=xxx&direction=BUY&quantity=10
export const placeStockTransaction = async ({ ticker, direction, quantity }) => {
  const res = await axiosClient.post('/stock/transaction', null, {
    params: { ticker, direction, quantity },
  });
  return res.data;
};


// GET /stock/quote?ticker=xxx
export const getStockQuote = async (ticker) => {
  const res = await axiosClient.get('/stock/quote', {
    params: { ticker },
  });
  return res.data; // e.g. { c, d, dp, stock_ticker, stock_name, ... }
};