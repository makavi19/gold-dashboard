// config.js
const TWELVE_DATA_KEY = '1692a383c16d40deb168cda462e9a7e3';
const NEWS_API_KEY = 'd7p3gnhr01qr68pbiu00d7p3gnhr01qr68pbiu0g';

let apiCallsThisMinute = 0;

// Upgraded Volatility Variables
let windowTicks = 0;         
let windowVolume = 0;   
let cumulativeVolume = parseFloat(localStorage.getItem('goldHub_volume')) || 0;