/* ========================================================== */
/* GOLD HUB PRO - CLOCK-SYNCED INTERMARKET PULSE (15M CANDLES)*/
/* ========================================================== */

// 1. Start the engine automatically (Called on page load)
function initPulseEngine() {
    console.log("> Initializing Clock-Synced DXY Pulse (Candle Closes)...");
    
    // A. INSTANT UI RESTORE (State Rehydration)
    // Pull the "photograph" of the last scan from the hard drive
    const savedHtml = localStorage.getItem('goldHub_pulseHtml');
    const savedGrade = localStorage.getItem('goldHub_pulseGrade');
    const savedGradeClass = localStorage.getItem('goldHub_pulseClass');

    if (savedHtml) {
        document.getElementById('pulse-highlight').innerHTML = savedHtml;
        document.getElementById('intermarket-grade').innerText = savedGrade;
        document.getElementById('intermarket-grade').className = savedGradeClass;
        
        document.getElementById('z-sync-status').innerText = "[Z-SYNC: MEMORY RESTORED]";
        document.getElementById('z-sync-status').className = "bold green-text";
    }

    // B. Start the Global Clock
    updatePulseTimer();
    setInterval(updatePulseTimer, 1000);
}

// 2. The Global Clock Engine (Synched to real-world 15m intervals)
function updatePulseTimer() {
    const now = new Date();

    // A. IDENTIFY THE CURRENT CANDLE (e.g., 12:00, 12:15)
    const currentCandleStart = new Date(now);
    currentCandleStart.setMinutes(Math.floor(now.getMinutes() / 15) * 15);
    currentCandleStart.setSeconds(0);
    currentCandleStart.setMilliseconds(0);
    
    const currentPulseId = currentCandleStart.getTime().toString(); 

    // B. THE TRIGGER: Check if we have already fired for this specific candle
    const lastPulseId = localStorage.getItem('goldHub_lastPulseId');
    
    if (lastPulseId !== currentPulseId) {
        runPulseEngine(); 
        localStorage.setItem('goldHub_lastPulseId', currentPulseId);
    }

    // C. THE MATH: Calculate the exact distance to the NEXT candle close
    const nextCandleClose = new Date(currentCandleStart);
    nextCandleClose.setMinutes(nextCandleClose.getMinutes() + 15); 

    const timeLeftMs = nextCandleClose.getTime() - now.getTime();
    const minutes = Math.floor(timeLeftMs / (1000 * 60));
    const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

    const minStr = String(minutes).padStart(2, '0');
    const secStr = String(seconds).padStart(2, '0');

    // D. THE UI: Push to HTML
    const timerEl = document.getElementById('dxy-timer');
    if (timerEl) {
        timerEl.innerText = `${minStr}:${secStr}`;
        
        if (minutes === 0) {
            timerEl.style.color = "var(--red)";
            timerEl.style.textShadow = "0 0 8px rgba(239, 68, 68, 0.4)";
        } else {
            timerEl.style.color = "var(--text-main)"; 
            timerEl.style.textShadow = "none";
        }
    }
}

// 3. The API and Grading Logic (PRESERVED & UPGRADED)
function runPulseEngine() {
    console.log("> Auto-Fetching Independent Intermarket Pulse (DXY)...");
    
    const syncStatus = document.getElementById('z-sync-status');
    const pulseHighlight = document.getElementById('pulse-highlight');
    const gradeElement = document.getElementById('intermarket-grade');

    syncStatus.innerText = "[Z-SYNC: FETCHING...]";
    syncStatus.className = "bold yellow-text";
    pulseHighlight.innerHTML = "<span class='muted-text'>ANALYZING DOLLAR INDEX...</span>";
    gradeElement.innerText = "CALCULATING...";
    gradeElement.className = "bold muted-text";

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

        const finalHtml = `
            <div style="font-size: 0.85rem; line-height: 1.8; margin-bottom: 10px; font-family: var(--font-mono);">
                <div><span class="muted-text">DXY 1D TREND:</span> <span class="bold ${dxy1D.includes('BULLISH') ? 'green-text' : 'red-text'}">${dxy1D} US Dollar</span></div>
                <div><span class="muted-text">DXY 4H FLOW:</span> <span class="bold ${dxy4H.includes('BULLISH') ? 'green-text' : 'red-text'}">${dxy4H} US Dollar</span> <span class="muted-text">(Short-term pullback)</span></div>
                <div style="margin-top: 8px;"><span class="muted-text">CORRELATION:</span> <span class="bold ${correlationText.includes('INTACT') ? 'green-text' : 'red-text'}">${correlationText}</span></div>
            </div>
        `;

        pulseHighlight.innerHTML = finalHtml;
        gradeElement.innerText = gradeText;
        gradeElement.className = gradeClass;

        syncStatus.innerText = "[Z-SYNC: COMPLETE]";
        syncStatus.className = "bold green-text";

        // --> THE STATE REHYDRATOR: Take the photograph and save it <--
        localStorage.setItem('goldHub_pulseHtml', finalHtml);
        localStorage.setItem('goldHub_pulseGrade', gradeText);
        localStorage.setItem('goldHub_pulseClass', gradeClass);

    }, 1500); 
}
