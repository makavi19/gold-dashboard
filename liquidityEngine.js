// liquidityEngine.js - Multi-Level Deep Order Book (Side-by-Side UI)

window.fetchLiquidityData = async function() {
    try {
        // --- STEP 1: FETCH DEEP LIVE ORDER BOOK ---
        // We use 5000 because Binance requires specific limit tiers
        const resDepth = await fetch('https://api.binance.com/api/v3/depth?symbol=PAXGUSDT&limit=5000');
        const dataDepth = await resDepth.json();

        // --- STEP 2: SORT DATA BY VOLUME (HIGHEST TO LOWEST) ---
        const sortedAsks = dataDepth.asks.sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
        const sortedBids = dataDepth.bids.sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));

        // --- STEP 3: EXTRACT THE TOP 5 LEVELS ---
        const top5Asks = sortedAsks.slice(0, 5);
        const top5Bids = sortedBids.slice(0, 5);

        // --- STEP 4: UPDATE THE MAIN UI BOXES ---
        // Keep the absolute #1 highest levels for the big ceiling/floor UI boxes
        document.getElementById('liq-high').innerText = parseFloat(top5Asks[0][0]).toFixed(2);
        document.getElementById('liq-low').innerText = parseFloat(top5Bids[0][0]).toFixed(2);
        
        // --- STEP 5: BUILD THE SIDE-BY-SIDE TERMINAL LOG ---
        let terminalLog = "> Deep Order Book Scan Complete (5000 Levels).<br><br>";
        
        // We use a Flexbox container to put the lists side-by-side
        terminalLog += `<div style="display: flex; justify-content: space-between; width: 100%;">`;

        // Column 1: Top 5 Sells (Left Side)
        terminalLog += `<div style="flex: 1; padding-right: 10px;">`;
        terminalLog += `<span class="red-text bold">TOP 5 SELL LIMITS:</span><br>`;
        top5Asks.forEach((ask, index) => {
            const price = parseFloat(ask[0]).toFixed(2);
            const volume = parseFloat(ask[1]).toFixed(2);
            terminalLog += `  #${index + 1}: $${price} <span class="muted-text">(Vol: ${volume})</span><br>`;
        });
        terminalLog += `</div>`; // Close Column 1

        // Column 2: Top 5 Buys (Right Side)
        terminalLog += `<div style="flex: 1; padding-left: 10px; border-left: 1px solid #333;">`;
        terminalLog += `<span class="green-text bold">TOP 5 BUY LIMITS:</span><br>`;
        top5Bids.forEach((bid, index) => {
            const price = parseFloat(bid[0]).toFixed(2);
            const volume = parseFloat(bid[1]).toFixed(2);
            terminalLog += `  #${index + 1}: $${price} <span class="muted-text">(Vol: ${volume})</span><br>`;
        });
        terminalLog += `</div>`; // Close Column 2

        terminalLog += `</div>`; // Close Flexbox Container

        // Inject the final HTML into the dashboard
        document.getElementById('heatmap-zones').innerHTML = terminalLog;

    } catch (e) {
        console.error("Liquidity Engine Error:", e);
        document.getElementById('heatmap-zones').innerHTML = `> ERROR: Could not fetch order book. Retrying on next scan.`;
    }
};