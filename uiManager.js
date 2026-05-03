// uiManager.js - The Visual Controller (UPDATED WITH WEEKEND LOCK)

// 1. GLOBAL BUTTON TRIGGERS & RATE LIMITER
let isScanLocked = false; 

window.triggerScan = function() {
    // 1. Block if a scan is already running
    if (isScanLocked) return; 
    
    // 2. THE IRON CURTAIN: Block the button if the weekend lock is active
    if (window.isSystemLocked) return; 

    const scanBtn = document.getElementById('btn-scan');
    if (!scanBtn) {
        console.error("Scan button not found! Make sure your HTML button has id='btn-scan'");
        return;
    }
    
    console.log("Scan Started...");
    document.getElementById('cycle-status').innerText = "[*] SCANNING ENGINE ACTIVE...";
    
    isScanLocked = true;
    scanBtn.innerText = "[*] SCANNING...";
    scanBtn.style.opacity = "0.7"; 
    scanBtn.style.cursor = "not-allowed"; 

    // Fire the APIs (Twelve Data is kept here too, just in case you leave the dash open overnight and need a fresh daily candle)
    if (typeof fetchTwelveData === "function") fetchTwelveData();
    if (typeof fetchNewsData === "function") fetchNewsData();
    
    // Trigger Internal Engines
    if (typeof runConsensusEngine === "function") runConsensusEngine();
    if (typeof window.fetchLiquidityData === "function") window.fetchLiquidityData();
    
    const now = new Date();
    document.getElementById('footer-sync').innerText = `LAST SYNC: ${now.toLocaleTimeString('en-US', { hour12: false })}`;

    setTimeout(() => {
        startScanCooldown(scanBtn);
    }, 2000);
};

function startScanCooldown(btnElement) {
    let timeLeft = 60;
    
    btnElement.innerText = `SCAN COMPLETE (${timeLeft}s)`;
    
    const timerInterval = setInterval(() => {
        timeLeft--;
        
        if (timeLeft > 0) {
            btnElement.innerText = `SCAN COMPLETE (${timeLeft}s)`;
        } else {
            clearInterval(timerInterval); 
            isScanLocked = false;
            
            // Only reset the button visually if the system IS NOT locked for the weekend
            if (!window.isSystemLocked) {
                btnElement.innerText = "INITIATE SYSTEM SCAN";
                btnElement.style.opacity = "1";
                btnElement.style.cursor = "pointer";
            }
            
            if (typeof apiCallsThisMinute !== 'undefined') {
                apiCallsThisMinute = 0;
                if (typeof window.updateRateUI === "function") window.updateRateUI();
            }
        }
    }, 1000);
}

window.manualRefresh = function() {
    document.getElementById('refresh-news-btn').innerText = "UPDATING...";
    if (typeof fetchNewsData === "function") fetchNewsData();
};

// 2. THE WAKE-UP SEQUENCE (Runs automatically on page load)
window.onload = () => {
    console.log("System Initializing...");
    
    // --> START THE WEEKEND LOCK ENGINE <--
    if (typeof window.initWeekendLock === "function") window.initWeekendLock();
    
    updateEnvironment(); 
    setInterval(updateEnvironment, 1000); 
    
    if (typeof fetchInitialPrice === "function") fetchInitialPrice();
    
    // --> INSTANT SENSOR ARMING: Fetch PDH/PDL the millisecond the page loads <--
    if (typeof fetchTwelveData === "function") fetchTwelveData();
    
    if (typeof window.initLocalCredits === "function") window.initLocalCredits();
    if (typeof window.initMatrix === "function") window.initMatrix();
    if (typeof initPulseEngine === "function") initPulseEngine(); 
    
    setInterval(() => {
        const cumulativeVolume = parseFloat(localStorage.getItem('goldHub_volume')) || 0;
        document.getElementById('live-volume').innerText = cumulativeVolume.toFixed(2);
    }, 1000);
};

// 3. TIME, SESSIONS, AND THEME
function updateEnvironment() {
    const now = new Date();
    
    const nyTime = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
    document.getElementById('clock-nyk').innerText = nyTime;

    const istTime = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
    document.getElementById('clock-ist').innerText = istTime;

    const hour = now.getHours();
    if (hour >= 18 || hour < 6) {
        document.body.classList.add('night-mode');
    } else {
        document.body.classList.remove('night-mode');
    }

    updateSessionLogic(istTime);
}

// Exactly 4 Sessions Based on Your Rules
function updateSessionLogic(istTime) {
    const sessionEl = document.getElementById('active-session');
    const sessionBox = document.getElementById('box-session');
    
    if (istTime >= "17:30:00" && istTime <= "20:30:00") {
        sessionEl.innerText = "[🔴] LON+NY OVERLAP";
        sessionBox.className = "panel sensor-box session-overlap";
    } else if (istTime >= "17:30:00" || istTime < "02:30:00") {
        sessionEl.innerText = "[🟢] NEW YORK SESSION";
        sessionBox.className = "panel sensor-box session-newyork";
    } else if (istTime >= "12:30:00" && istTime < "20:30:00") {
        sessionEl.innerText = "[🔵] LONDON SESSION";
        sessionBox.className = "panel sensor-box session-london";
    } else if (istTime >= "05:30:00" && istTime < "14:30:00") {
        sessionEl.innerText = "[🟡] ASIAN SESSION";
        sessionBox.className = "panel sensor-box session-asian";
    } else {
        sessionEl.innerText = "[⚪] OFF HOURS";
        sessionBox.className = "panel sensor-box";
    }
}

// 4. UI INJECTION BRIDGES (Updating the HTML)
window.updatePriceUI = function(currentPrice, previousPrice) {
    const priceElement = document.getElementById('xau-price');
    priceElement.innerText = currentPrice.toFixed(2);
    
    if (previousPrice !== null) {
        if (currentPrice > previousPrice) priceElement.className = 'mono bold green-text';
        else if (currentPrice < previousPrice) priceElement.className = 'mono bold red-text';
    } else {
        priceElement.className = 'mono bold gold-text';
    }

    if (typeof window.checkMatrixBreach === "function") window.checkMatrixBreach(currentPrice);
};

window.updateCreditsUI = function(remaining) {
    const creditEl = document.getElementById('sys-credits');
    creditEl.innerText = remaining;
    creditEl.className = remaining < 100 ? "bold red-text" : "bold green-text";
};

window.updateRateUI = function() {
    const rateEl = document.getElementById('sys-rate');
    if (typeof apiCallsThisMinute !== 'undefined') {
        rateEl.innerText = apiCallsThisMinute;
        rateEl.className = apiCallsThisMinute >= 8 ? "bold red-text" : "bold yellow-text";
    }
};

window.renderMacroBias = function(values) {
    const latestD1 = parseFloat(values[0].close);
    const oldestD1 = parseFloat(values[1].close);
    const biasEl = document.getElementById('d1-bias');
    
    if (!biasEl) return; 
    
    const box = biasEl.closest('.panel');
    
    box.classList.remove('macro-bullish', 'macro-bearish', 'macro-neutral');
    
    if (latestD1 >= oldestD1) {
        biasEl.innerHTML = '🟢 BULLISH'; biasEl.className = 'bold green-text';
        box.classList.add('macro-bullish');
    } else {
        biasEl.innerHTML = '🔴 BEARISH'; biasEl.className = 'bold red-text';
        box.classList.add('macro-bearish');
    }
    document.getElementById('cycle-status').innerText = "[*] SCAN COMPLETE";
};

window.renderNews = function(newsItems) {
    document.getElementById('refresh-news-btn').innerText = "REFRESH ↻";
    const activeState = document.getElementById('news-active-state');
    const emptyState = document.getElementById('news-empty-state');
    
    if (newsItems.length === 0) {
        activeState.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    activeState.style.display = 'block';
    activeState.innerHTML = '';
    
    newsItems.slice(0, 3).forEach(item => {
        const eventTime = new Date(item.time + "Z").toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });
        activeState.innerHTML += `
            <div class="news-row" style="grid-template-columns: 1fr 2fr 1fr;">
                <div class="news-time bold muted-text">[🔴] ${eventTime}</div>
                <div class="news-event">${item.event}</div>
                <div class="news-data">ACT: <span class="white-text bold">${item.actual !== null ? item.actual : '--'}</span></div>
            </div>`;
    });
};