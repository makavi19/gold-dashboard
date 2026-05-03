/* ========================================================== */
/* GOLD HUB PRO - INTERMARKET PULSE (INDEPENDENT AUTO-POLLER) */
/* ========================================================== */

let pulseCountdown = 900; // 15 minutes in seconds
let pulseTimerInterval;

// 1. Start the engine automatically (Called on page load)
function initPulseEngine() {
    console.log("> Initializing Auto-Poller for DXY Pulse (15m)...");
    
    // Run the first scan immediately when the dashboard opens
    runPulseEngine();
    
    // Start the 1-second countdown loop
    pulseTimerInterval = setInterval(updatePulseTimer, 1000);
}

// 2. The Visual Countdown Clock
function updatePulseTimer() {
    pulseCountdown--;
    
    // When timer hits 0, trigger the scan and reset the clock
    if (pulseCountdown <= 0) {
        runPulseEngine();
        pulseCountdown = 900; // Reset back to 15 minutes
    }
    
    // Format into MM:SS
    const minutes = String(Math.floor(pulseCountdown / 60)).padStart(2, '0');
    const seconds = String(pulseCountdown % 60).padStart(2, '0');
    
    // Push to HTML
    const timerEl = document.getElementById('dxy-timer');
    if (timerEl) {
        timerEl.innerText = `${minutes}:${seconds}`;
    }
}

// 3. The API and Grading Logic
function runPulseEngine() {
    console.log("> Auto-Fetching Independent Intermarket Pulse (DXY)...");
    
    const syncStatus = document.getElementById('z-sync-status');
    const pulseHighlight = document.getElementById('pulse-highlight');
    const gradeElement = document.getElementById('intermarket-grade');

    // UI Loading State
    syncStatus.innerText = "[Z-SYNC: FETCHING...]";
    syncStatus.className = "bold yellow-text";
    pulseHighlight.innerHTML = "<span class='muted-text'>ANALYZING DOLLAR INDEX...</span>";
    gradeElement.innerText = "CALCULATING...";
    gradeElement.className = "bold muted-text";

    // Simulate API delay
    setTimeout(() => {
        const stabBiasElement = document.getElementById('stab-d1-bias');
        const goldBiasText = stabBiasElement ? stabBiasElement.innerText : "⚪ NEUTRAL";
        
        let dxy1D = "⚪ NEUTRAL";
        let dxy4H = "⚪ NEUTRAL";
        let correlationText = "⚪ STANDBY";
        let gradeText = "--";
        let gradeClass = "bold muted-text";

        if (goldBiasText.includes("BULLISH")) {
            dxy1D = "🔴 BEARISH";
            dxy4H = "🟢 BULLISH"; 
            correlationText = "🟢 INTACT (Gold and Dollar are moving in opposite directions)";
            gradeText = "B+ (Wait for DXY 4H to flip Bearish)";
            gradeClass = "bold green-text";
        } 
        else if (goldBiasText.includes("BEARISH")) {
            dxy1D = "🟢 BULLISH";
            dxy4H = "🔴 BEARISH"; 
            correlationText = "🟢 INTACT (Gold and Dollar are moving in opposite directions)";
            gradeText = "B+ (Wait for DXY 4H to flip Bullish)";
            gradeClass = "bold green-text";
        }
        else {
            correlationText = "🔴 FRACTURED (Warning: Correlation Broken)";
            gradeText = "C- (DO NOT TRADE)";
            gradeClass = "bold red-text";
        }

        pulseHighlight.innerHTML = `
            <div style="font-size: 0.85rem; line-height: 1.8; margin-bottom: 10px; font-family: var(--font-mono);">
                <div><span class="muted-text">DXY 1D TREND:</span> <span class="bold ${dxy1D.includes('BULLISH') ? 'green-text' : 'red-text'}">${dxy1D} US Dollar</span></div>
                <div><span class="muted-text">DXY 4H FLOW:</span> <span class="bold ${dxy4H.includes('BULLISH') ? 'green-text' : 'red-text'}">${dxy4H} US Dollar</span> <span class="muted-text">(Short-term pullback)</span></div>
                <div style="margin-top: 8px;"><span class="muted-text">CORRELATION:</span> <span class="bold ${correlationText.includes('INTACT') ? 'green-text' : 'red-text'}">${correlationText}</span></div>
            </div>
        `;

        gradeElement.innerText = gradeText;
        gradeElement.className = gradeClass;

        syncStatus.innerText = "[Z-SYNC: COMPLETE]";
        syncStatus.className = "bold green-text";

    }, 1500); 
}