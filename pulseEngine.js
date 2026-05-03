/* ========================================================== */
/* GOLD HUB PRO - INTERMARKET PULSE (PERSISTENT ANCHOR)       */
/* ========================================================== */

const PULSE_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

// 1. Start the engine automatically (Called on page load)
function initPulseEngine() {
    console.log("> Initializing Auto-Poller for DXY Pulse (Persistent 15m)...");
    
    // Fire immediately to catch up, then run exactly once per second
    updatePulseTimer();
    setInterval(updatePulseTimer, 1000);
}

// 2. The Persistent Countdown Clock (Immune to Refresh)
function updatePulseTimer() {
    const now = new Date().getTime();
    let targetTime = localStorage.getItem('goldHub_pulseAnchor');

    // A. THE TRIGGER: If no anchor exists, or the anchor is in the past
    if (!targetTime || now >= parseInt(targetTime)) {
        runPulseEngine(); // Fire the API and Grading logic
        
        // Set the brand new anchor exactly 15 minutes into the future
        targetTime = now + PULSE_DURATION_MS;
        localStorage.setItem('goldHub_pulseAnchor', targetTime);
    }

    // B. THE MATH: Calculate the exact distance between NOW and the ANCHOR
    const timeLeftMs = parseInt(targetTime) - now;
    const minutes = Math.floor(timeLeftMs / (1000 * 60));
    const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

    // Format into MM:SS with leading zeros
    const minStr = String(minutes).padStart(2, '0');
    const secStr = String(seconds).padStart(2, '0');

    // C. THE UI: Push to HTML
    const timerEl = document.getElementById('dxy-timer');
    if (timerEl) {
        timerEl.innerText = `${minStr}:${secStr}`;
        
        // Visual warning: Turn red during the final 60 seconds
        if (minutes === 0) {
            timerEl.style.color = "var(--red)";
            timerEl.style.textShadow = "0 0 8px rgba(239, 68, 68, 0.4)";
        } else {
            timerEl.style.color = "var(--text-main)"; // Default text color
            timerEl.style.textShadow = "none";
        }
    }
}

// 3. The API and Grading Logic (PRESERVED)
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
