/* ========================================================== */
/* GOLD HUB PRO - INSTITUTIONAL WEEKEND LOCK (IRON CURTAIN)   */
/* ========================================================== */

// Global Flag that all other files will check before running
window.isSystemLocked = false;

function checkWeekendLock() {
    // 1. Fetch exact New York Time (Bypasses Daylight Saving Time math completely)
    const now = new Date();
    const nyString = now.toLocaleString("en-US", { timeZone: "America/New_York", hour12: false });
    const nyDate = new Date(nyString);

    const day = nyDate.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    const hours = nyDate.getHours();

    // 2. Define the Ghost Market Window (Fri 17:00 NY to Sun 17:00 NY)
    let shouldLock = false;

    if (day === 5 && hours >= 17) {
        // Friday: Lock engages at exactly 5:00 PM NY
        shouldLock = true;
    } else if (day === 6) {
        // Saturday: Locked all day
        shouldLock = true;
    } else if (day === 0 && hours < 17) {
        // Sunday: Remains locked until 5:00 PM NY
        shouldLock = true;
    }

    // 3. Throw the Switch
    if (shouldLock && !window.isSystemLocked) {
        engageLock();
    } else if (!shouldLock && window.isSystemLocked) {
        disengageLock();
    }
}

function engageLock() {
    console.warn("[!] IRON CURTAIN ENGAGED: GHOST MARKET DETECTED.");
    window.isSystemLocked = true;

    // A. Disable the Main Button
    const scanBtn = document.getElementById('btn-scan');
    if (scanBtn) {
        scanBtn.innerText = "[ SYSTEM LOCKED: WEEKEND ]";
        scanBtn.style.opacity = "0.3";
        scanBtn.style.cursor = "not-allowed";
        scanBtn.style.backgroundColor = "var(--red)"; 
        scanBtn.style.color = "#ffffff";
        scanBtn.style.boxShadow = "none";
    }

    // B. Inject a Warning Banner
    const statusEl = document.getElementById('cycle-status');
    if (statusEl) {
        statusEl.innerText = "[!] MARKETS CLOSED - DATA FROZEN";
        statusEl.className = "bold red-text";
    }
}

function disengageLock() {
    console.log("[>] SYSTEM UNLOCKED: MARKET OPEN.");
    window.isSystemLocked = false;

    // A. Restore the Main Button
    const scanBtn = document.getElementById('btn-scan');
    if (scanBtn) {
        scanBtn.innerText = "INITIATE SYSTEM SCAN";
        scanBtn.style.opacity = "1";
        scanBtn.style.cursor = "pointer";
        scanBtn.style.backgroundColor = "var(--gold)"; 
        scanBtn.style.color = "#000000";
        scanBtn.style.boxShadow = "0 0 15px rgba(250, 204, 21, 0.4)";
    }

    // B. Clear the Warning Banner
    const statusEl = document.getElementById('cycle-status');
    if (statusEl) {
        statusEl.innerText = "[*] SYSTEM READY";
        statusEl.className = "muted-text";
    }
}

// 4. The Ignition Switch (Checked once per minute)
window.initWeekendLock = function() {
    checkWeekendLock(); // Check immediately on load
    setInterval(checkWeekendLock, 60000); // Re-check every 60 seconds
};