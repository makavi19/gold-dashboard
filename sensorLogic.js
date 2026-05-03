// sensorLogic.js - Standalone PDH/PDL Radar (WITH MEMORY LOCK)

// 1. GLOBAL VARIABLES & MEMORY LATCHES
let pdhValue = 0;
let pdlValue = 0;
let pdhSweeps = 0;
let pdlSweeps = 0;
let isCurrentlyAbovePDH = false;
let isCurrentlyBelowPDL = false;

// NEW: The Memory Latches for the rest of the day
let pdhSweptToday = false;
let pdlSweptToday = false;

// 2. THE RECEIVER (Gets data directly from the API)
window.armSensors = function(high, low) {
    pdhValue = high;
    pdlValue = low;

    // Reset memory latches when new daily data arrives from TwelveData
    pdhSweptToday = false;
    pdlSweptToday = false;
    pdhSweeps = 0;
    pdlSweeps = 0;

    // Inject the targets into your HTML placeholders
    document.getElementById('sensor-pdh').innerText = pdhValue.toFixed(2);
    document.getElementById('sensor-pdl').innerText = pdlValue.toFixed(2);
    
    console.log(`> SENSORS ARMED VIA API: PDH ${pdhValue} | PDL ${pdlValue}`);
};

// 3. UI UPDATER (Connected directly to your new CSS Paint)
window.updateSensorUI = function(type, state, sweeps) {
    const box = document.getElementById(`box-${type}`);
    const statusText = document.getElementById(`status-${type}`);
    const sweepsText = document.getElementById(`sweeps-${type}`);

    if (!box || !statusText || !sweepsText) return;

    sweepsText.innerText = `[ SWEEPS: ${sweeps} ]`;
    
    // Wipe clean any old CSS classes
    box.classList.remove('sensor-distant', 'sensor-approach', 'sensor-breach', 'sensor-tapped');

    // Apply the correct CSS based on the math
    if (state === 'distant') {
        box.classList.add('sensor-distant');
        statusText.innerText = "[⚪] DISTANT";
        statusText.className = "bold green-text";
    } else if (state === 'approach') {
        box.classList.add('sensor-approach');
        statusText.innerText = "[🟡] APPROACHING"; 
        statusText.className = "bold yellow-text";
    } else if (state === 'breached') {
        box.classList.add('sensor-breach');
        statusText.innerText = "[🔴] ACTIVE SWEEP"; 
        statusText.className = "bold red-text";
    } else if (state === 'tapped') {
        box.classList.add('sensor-tapped');
        statusText.innerText = "[🔴] TAPPED (WELL DRY)"; 
        statusText.className = "bold red-text";
    }
};

/// 4. LIVE PRICE ENGINE (Binance WebSocket)
const sensorSocket = new WebSocket('wss://stream.binance.com:9443/ws/paxgusdt@trade');

sensorSocket.onmessage = function(event) { 
    const data = JSON.parse(event.data); 
    const currentPrice = parseFloat(data.p);
    checkSensors(currentPrice);
};

// 5. SENSOR MATH (The Proximity Radar with Memory Lock)
function checkSensors(currentPrice) {
    if (pdhValue === 0 || pdlValue === 0) return;

    // ==========================================
    // PDH LOGIC (Previous Daily High)
    // ==========================================
    if (currentPrice >= pdhValue) {
        // 1. Price is actively crossing or above the High
        if (!isCurrentlyAbovePDH) { 
            pdhSweeps++; 
            isCurrentlyAbovePDH = true; 
            pdhSweptToday = true; // TRIGGER THE MEMORY LOCK
        }
        window.updateSensorUI('pdh', 'breached', pdhSweeps); // Fast Red Pulse
    } else {
        // 2. Price is currently below the High
        isCurrentlyAbovePDH = false;
        
        if (pdhSweptToday === true) {
            // It was swept earlier today. Show the slow blinking lock.
            window.updateSensorUI('pdh', 'tapped', pdhSweeps);
        } else if (pdhValue - currentPrice <= 2.50) { 
            // $2.50 warning zone (Not swept yet, but getting close)
            window.updateSensorUI('pdh', 'approach', pdhSweeps);
        } else {
            // Safe
            window.updateSensorUI('pdh', 'distant', pdhSweeps);
        }
    }

    // ==========================================
    // PDL LOGIC (Previous Daily Low)
    // ==========================================
    if (currentPrice <= pdlValue) {
        // 1. Price is actively crossing or below the Low
        if (!isCurrentlyBelowPDL) { 
            pdlSweeps++; 
            isCurrentlyBelowPDL = true; 
            pdlSweptToday = true; // TRIGGER THE MEMORY LOCK
        }
        window.updateSensorUI('pdl', 'breached', pdlSweeps); // Fast Red Pulse
    } else {
        // 2. Price is currently above the Low
        isCurrentlyBelowPDL = false;
        
        if (pdlSweptToday === true) {
            // It was swept earlier today. Show the slow blinking lock.
            window.updateSensorUI('pdl', 'tapped', pdlSweeps);
        } else if (currentPrice - pdlValue <= 2.50) { 
            // $2.50 warning zone (Not swept yet, but getting close)
            window.updateSensorUI('pdl', 'approach', pdlSweeps);
        } else {
            // Safe
            window.updateSensorUI('pdl', 'distant', pdlSweeps);
        }
    }
}