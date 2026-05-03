// marketLogic.js - The Data Engine (SUNDAY BYPASS ONLY, NO WEEKEND LOCK)

// 1. LIVE PRICE & VOLUME (BINANCE WEBSOCKET)
const binanceSocket = new WebSocket('wss://stream.binance.com:9443/ws/paxgusdt@trade');
let previousPrice = null;

binanceSocket.onmessage = function(event) { 
    const data = JSON.parse(event.data); 
    const currentPrice = parseFloat(data.p);
    const tradeQty = parseFloat(data.q); 

    if (typeof windowTicks !== 'undefined') windowTicks++; 
    if (typeof windowVolume !== 'undefined') windowVolume += tradeQty;
    if (typeof cumulativeVolume !== 'undefined') cumulativeVolume += tradeQty;
    
    // Save to browser memory
    if (typeof cumulativeVolume !== 'undefined') {
        localStorage.setItem('goldHub_volume', cumulativeVolume);
    }
    
    // Pass data to UI safely
    if (typeof window.updatePriceUI === "function") window.updatePriceUI(currentPrice, previousPrice);
    previousPrice = currentPrice;
};

// 2. THE CREDIT ENGINE (Auto-Resets at Midnight)
window.initLocalCredits = function() {
    const today = new Date().toISOString().split('T')[0];
    const lastReset = localStorage.getItem('goldHub_lastReset');
    let currentCredits = localStorage.getItem('goldHub_credits');

    // If it's a new day, or if credits have never been saved before, reset to 800
    if (lastReset !== today || currentCredits === null) {
        currentCredits = 800;
        localStorage.setItem('goldHub_credits', currentCredits);
        localStorage.setItem('goldHub_lastReset', today);
        console.log("> Midnight Reset: Credits restored to 800");
    }
    
    // Send the loaded credits to the UI
    if (typeof window.updateCreditsUI === "function") {
        window.updateCreditsUI(currentCredits);
    }
};

window.deductCredits = function(cost) {
    let currentCredits = parseInt(localStorage.getItem('goldHub_credits')) || 800;
    currentCredits -= cost; // Subtract the API cost
    
    // Save the new balance and update the UI
    localStorage.setItem('goldHub_credits', currentCredits);
    if (typeof window.updateCreditsUI === "function") {
        window.updateCreditsUI(currentCredits);
    }
};

// 3. API FETCHING LOGIC
async function fetchInitialPrice() {
    try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT');
        const data = await res.json();
        const price = parseFloat(data.price);
        if (typeof window.updatePriceUI === "function") window.updatePriceUI(price, null);
        previousPrice = price;
    } catch (e) { console.error("Initial Price Load Failed", e); }
}

async function fetchTwelveData() {
    try {
        if (typeof apiCallsThisMinute !== 'undefined') apiCallsThisMinute += 5;
        
        // Deduct Local Credits
        if (typeof window.deductCredits === "function") window.deductCredits(5); 
        if (typeof window.updateRateUI === "function") window.updateRateUI();

        // outputsize is 5 so we can scan backward past the weekend
        const res = await fetch(`https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=1day&outputsize=5&apikey=${TWELVE_DATA_KEY}`);
        const data = await res.json();

        if (data.code === 429 || data.status === "error") {
            console.error("API BLOCKED: " + data.message);
            return; 
        }

        if (data.values && data.values.length > 0) {
            const candles = data.values;
            let currentCandle = candles[0]; // Always today's live/running candle
            let truePreviousCandle = null;

            // 2. THE SUNDAY BYPASS (Scanning backwards for institutional volume)
            // Start at index 1 (yesterday) and look backward
            for (let i = 1; i < candles.length; i++) {
                const candleDate = new Date(candles[i].datetime);
                const dayOfWeek = candleDate.getDay(); // 0 = Sunday, 6 = Saturday

                // If the candle is NOT Sunday and NOT Saturday
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    truePreviousCandle = candles[i];
                    console.log(`> INSTITUTIONAL SENSOR DATA PULLED FOR DATE: ${candles[i].datetime}`);
                    break; // Stop looking, we found the true Friday/Weekday!
                }
            }

            // 3. Arm the system using the verified data
            if (truePreviousCandle) {
                const finalPDH = parseFloat(truePreviousCandle.high);
                const finalPDL = parseFloat(truePreviousCandle.low);
                
                if (typeof window.armSensors === "function") {
                    window.armSensors(finalPDH, finalPDL);
                }

                if (typeof window.renderMacroBias === "function") {
                    window.renderMacroBias([currentCandle, truePreviousCandle]);
                }
            } else {
                console.error("Could not locate a valid weekday candle in the API data.");
            }
        }
    } catch (e) { console.error("Twelve Data Fetch Failed", e); }
}

async function fetchNewsData() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch(`https://finnhub.io/api/v1/calendar/economic?from=${today}&to=${today}&token=${NEWS_API_KEY}`);
        const data = await res.json();
        
        const newsItems = (data.economicCalendar || []).filter(item => item.country === 'US');
        if (typeof window.renderNews === "function") window.renderNews(newsItems);
    } catch (e) { console.error("News Fetch Failed", e); }
}