/* ========================================================== */
/* GOLD HUB PRO - CONSENSUS ENGINE (STABILIZER & SNIPER)      */
/* ========================================================== */

// Helper function to format dates as "DD MMM" (e.g., "03 May")
function formatEngineDate(date) {
    const options = { day: '2-digit', month: 'short' };
    return date.toLocaleDateString('en-GB', options);
}

// Helper function to get past dates based on the lookback requirement
function getLookbackDates(days1D, days4H) {
    const today = new Date(); // Current system date
    
    const start1D = new Date(today);
    start1D.setDate(today.getDate() - days1D);
    
    const start4H = new Date(today);
    start4H.setDate(today.getDate() - days4H);
    
    const endStr = formatEngineDate(today);
    const start1DStr = formatEngineDate(start1D);
    const start4HStr = formatEngineDate(start4H);
    
    return `1D: ${start1DStr}–${endStr} | 4H: ${start4HStr}–${endStr}`;
}

// Master function to execute the Consensus Scan
function runConsensusEngine() {
    console.log("> Running Consensus Engine: Stabilizer (7D/3D) & Sniper (5D/2D)...");

    // 1. GENERATE LOOKBACK DATES
    const stabilizerLookback = getLookbackDates(7, 3);
    const sniperLookback = getLookbackDates(5, 2);

    // 2. SIMULATED MARKET DATA (Plug your actual API/Logic here later)
    // For now, this simulates a Bullish long-term trend with a short-term Sniper pullback.
    
    const stabilizerData = {
        d1Bias: "🟢 BULLISH",
        h4Bias: "🟢 BULLISH",
        lookback: stabilizerLookback,
        d1Details: "Price is maintaining a 7-day bullish structure. Higher Highs confirmed, respecting the macro Order Block.",
        h4Details: "3-day flow shows institutional accumulation. Fair Value Gap (FVG) filled, preparing for expansion.",
        glowClass: "bullish-glow"
    };

    const sniperData = {
        d1Bias: "⚪ NEUTRAL",
        h4Bias: "🔴 BEARISH",
        lookback: sniperLookback,
        d1Details: "5-day momentum is stalling at premium arrays. Awaiting clear displacement.",
        h4Details: "2-day flow swept Buy-Side Liquidity. Short-term pullback active. Monitor for optimal 1:2 RR entry at discount.",
        glowClass: "bearish-glow" // Flips red to warn you of the short-term pullback
    };

    // 3. UPDATE THE UI
    updateModelUI("stab", stabilizerData);
    updateModelUI("snip", sniperData);
}

// Reusable function to inject data into the DOM and handle the Glow CSS
function updateModelUI(prefix, data) {
    // Update Text Elements
    document.getElementById(`${prefix}-d1-bias`).innerText = data.d1Bias;
    document.getElementById(`${prefix}-h4-bias`).innerText = data.h4Bias;
    document.getElementById(`${prefix}-lookback`).innerText = data.lookback;
    document.getElementById(`${prefix}-d1-details`).innerText = data.d1Details;
    document.getElementById(`${prefix}-h4-details`).innerText = data.h4Details;

    // Update Box Glow States
    const boxElement = document.getElementById(prefix === "stab" ? "box-stabilizer" : "box-sniper");
    
    // Clear old glows
    boxElement.classList.remove("bullish-glow", "bearish-glow");
    
    // Apply new glow if bias dictates it
    if (data.glowClass) {
        boxElement.classList.add(data.glowClass);
    }
    
    // Change text color to match bias tag
    const d1BiasElement = document.getElementById(`${prefix}-d1-bias`);
    const h4BiasElement = document.getElementById(`${prefix}-h4-bias`);
    
    d1BiasElement.className = "bias-tag " + getBiasTextColor(data.d1Bias);
    h4BiasElement.className = "bias-tag " + getBiasTextColor(data.h4Bias);
}

// Helper to colorize the AWAITING/BULLISH/BEARISH text specifically
function getBiasTextColor(biasText) {
    if (biasText.includes("BULLISH")) return "green-text";
    if (biasText.includes("BEARISH")) return "red-text";
    return "muted-text"; // For Neutral or Awaiting
}