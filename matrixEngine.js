// matrixEngine.js - Untested Liquidity Matrix (10-Day) [UTC/IST SYNCED]

const MATRIX_DATA_KEY = 'liquidityMatrixData';
const MATRIX_DATE_KEY = 'liquidityMatrixDate';

// SESSIONS MAPPED TO UTC (Aligns perfectly with IST on TradingView)
const SESSIONS = {
    asian:   { start: 0,  end: 9 },   // 05:30 to 14:30 IST
    london:  { start: 7,  end: 15 },  // 12:30 to 20:30 IST
    overlap: { start: 12, end: 15 },  // 17:30 to 20:30 IST
    ny:      { start: 12, end: 21 }   // 17:30 to 02:30 IST
};

window.initMatrix = async function() {
    const today = new Date().toISOString().split('T')[0]; 
    const savedDate = localStorage.getItem(MATRIX_DATE_KEY);

    if (savedDate === today) {
        document.getElementById('matrix-alert').innerText = "> CACHE LOADED";
        const cachedData = JSON.parse(localStorage.getItem(MATRIX_DATA_KEY));
        renderMatrix(cachedData);
    } else {
        document.getElementById('matrix-alert').innerText = "> FETCHING HISTORY...";
        await fetchAndBuildMatrix(today);
    }
};

async function fetchAndBuildMatrix(today) {
    try {
        // UPGRADE: outputsize=1500 and timezone=UTC added to guarantee exact sync
        const res = await fetch(`https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=15min&outputsize=1500&timezone=UTC&exchange=OANDA&apikey=${TWELVE_DATA_KEY}`);
        const data = await res.json();

        if (!data.values) throw new Error("API Limit Reached or Data Missing");

        const processedData = processCandles(data.values);
        localStorage.setItem(MATRIX_DATA_KEY, JSON.stringify(processedData));
        localStorage.setItem(MATRIX_DATE_KEY, today);
        
        document.getElementById('matrix-alert').innerText = "> MONITORING";
        renderMatrix(processedData);
    } catch (e) {
        console.error("Matrix Engine Error:", e);
        document.getElementById('matrix-alert').innerText = "> API ERROR";
    }
}

function processCandles(candles) {
    candles.reverse(); 
    let daysObj = {};

    candles.forEach((candle, index) => {
        const dateStr = candle.datetime.split(' ')[0]; 
        const dateObj = new Date(dateStr);
        const dayOfWeek = dateObj.getDay();
        
        // Skip Weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) return; 

        let high = parseFloat(candle.high);
        let low = parseFloat(candle.low);
        
        // Parse the exact UTC hour from the timestamp
        let hour = parseInt(candle.datetime.split(' ')[1].split(':')[0]);

        // THE SANITY CHECK: Ignore corrupted $0.00 server glitches
        if (high < 1000 || low < 1000) return;

        if (!daysObj[dateStr]) {
            daysObj[dateStr] = { 
                date: dateStr, 
                dh: {val: 0, idx: -1}, dl: {val: 999999, idx: -1}, 
                ah: {val: 0, idx: -1}, al: {val: 999999, idx: -1}, 
                lh: {val: 0, idx: -1}, ll: {val: 999999, idx: -1}, 
                oh: {val: 0, idx: -1}, ol: {val: 999999, idx: -1}, 
                nyh: {val: 0, idx: -1}, nyl: {val: 999999, idx: -1} 
            };
        }

        let day = daysObj[dateStr];

        // Daily High/Low
        if (high > day.dh.val) { day.dh.val = high; day.dh.idx = index; }
        if (low < day.dl.val) { day.dl.val = low; day.dl.idx = index; }

        // Session Allocations (Using the new UTC rules)
        if (hour >= SESSIONS.asian.start && hour <= SESSIONS.asian.end) {
            if (high > day.ah.val) { day.ah.val = high; day.ah.idx = index; }
            if (low < day.al.val) { day.al.val = low; day.al.idx = index; }
        }
        if (hour >= SESSIONS.london.start && hour <= SESSIONS.london.end) {
            if (high > day.lh.val) { day.lh.val = high; day.lh.idx = index; }
            if (low < day.ll.val) { day.ll.val = low; day.ll.idx = index; }
        }
        if (hour >= SESSIONS.overlap.start && hour <= SESSIONS.overlap.end) {
            if (high > day.oh.val) { day.oh.val = high; day.oh.idx = index; }
            if (low < day.ol.val) { day.ol.val = low; day.ol.idx = index; }
        }
        if (hour >= SESSIONS.ny.start && hour <= SESSIONS.ny.end) {
            if (high > day.nyh.val) { day.nyh.val = high; day.nyh.idx = index; }
            if (low < day.nyl.val) { day.nyl.val = low; day.nyl.idx = index; }
        }
    });

    // Extract the last 10 valid trading days
    let daysArray = Object.values(daysObj).slice(-10);
    let finalProcessedData = [];

    daysArray.forEach(day => {
        let finalDay = { date: day.date, states: {} };
        const keys = ['dh', 'dl', 'ah', 'al', 'lh', 'll', 'oh', 'ol', 'nyh', 'nyl'];

        keys.forEach(key => {
            let levelData = day[key];
            let isHigh = key.endsWith('h');

            // Format dead data (sessions that had no candles)
            if ((isHigh && levelData.val === 0) || (!isHigh && levelData.val === 999999)) {
                finalDay[key] = 0;
                finalDay.states[key] = 'active'; 
                return;
            }

            finalDay[key] = levelData.val;
            finalDay.states[key] = 'active'; 

            // THE EXHAUSTION SCANNER
            for (let c = levelData.idx + 1; c < candles.length; c++) {
                let futureCandle = candles[c];
                if (isHigh && parseFloat(futureCandle.high) >= levelData.val) {
                    finalDay.states[key] = 'exhausted';
                    break; 
                }
                if (!isHigh && parseFloat(futureCandle.low) <= levelData.val) {
                    finalDay.states[key] = 'exhausted';
                    break;
                }
            }
        });
        finalProcessedData.push(finalDay);
    });

    return finalProcessedData; 
}

function renderMatrix(dataArray) {
    const tbody = document.getElementById('matrix-body');
    tbody.innerHTML = ""; 

    dataArray.forEach(day => {
        const tr = document.createElement('tr');
        
        // VISUAL CLEANUP: Uses "TAPPED" and "-----" for dead levels
        const buildCell = (val, state) => {
            if (val === 0) return `<td class="muted-text">--</td>`;
            if (state === 'breached') return `<td class="level-breached">-----</td>`;
            if (state === 'exhausted') return `<td class="level-exhausted" style="font-size: 10px;">TAPPED</td>`;
            return `<td class="level-${state}">${val.toFixed(2)}</td>`; 
        };

        tr.innerHTML = `
            <td>${day.date}</td>
            ${buildCell(day.dh, day.states.dh)}
            ${buildCell(day.dl, day.states.dl)}
            ${buildCell(day.ah, day.states.ah)}
            ${buildCell(day.al, day.states.al)}
            ${buildCell(day.lh, day.states.lh)}
            ${buildCell(day.ll, day.states.ll)}
            ${buildCell(day.oh, day.states.oh)}
            ${buildCell(day.ol, day.states.ol)}
            ${buildCell(day.nyh, day.states.nyh)}
            ${buildCell(day.nyl, day.states.nyl)}
        `;
        tbody.appendChild(tr);
    });
}

// THE LIVE BREACH TRACKER
window.checkMatrixBreach = function(livePrice) {
    let data = JSON.parse(localStorage.getItem(MATRIX_DATA_KEY));
    if (!data) return;

    let matrixUpdated = false;
    const keys = ['dh', 'dl', 'ah', 'al', 'lh', 'll', 'oh', 'ol', 'nyh', 'nyl'];
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });

    data.forEach(day => {
        keys.forEach(key => {
            // Only check Green/Active targets
            if (day.states[key] === 'active' && day[key] > 0) {
                let isHigh = key.endsWith('h');
                let isBreached = false;

                if (isHigh && livePrice >= day[key]) isBreached = true;
                if (!isHigh && livePrice <= day[key]) isBreached = true;

                if (isBreached) {
                    day.states[key] = 'breached'; 
                    matrixUpdated = true;
                    
                    const logBox = document.getElementById('matrix-breach-log');
                    if (logBox) {
                        if (logBox.innerHTML.includes("Waiting")) logBox.innerHTML = ""; 
                        logBox.innerHTML = `<div class="red-text bold">[${timeString}] ALERT: ${day.date} ${key.toUpperCase()} SWEEP at $${livePrice.toFixed(2)}</div>` + logBox.innerHTML;
                    }
                }
            }
        });
    });

    if (matrixUpdated) {
        localStorage.setItem(MATRIX_DATA_KEY, JSON.stringify(data));
        renderMatrix(data);
    }
};