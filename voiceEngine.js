// VOICE MODULE
const synth = window.speechSynthesis;

function speak(text) {
    if (synth.speaking) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9; // Institutional tone
    synth.speak(utter);
}

// 2.1 Welcome Voice
window.addEventListener('load', () => {
    setTimeout(() => speak("System Online. Gold Hub Pro is ready for analysis."), 1000);
});

// 2.2 First Scan Report
function handleVoiceScanReport(data) {
    const today = new Date().toDateString();
    if (localStorage.getItem('lastScanVoiceDate') !== today) {
        speak(`Scanning complete. 1D Bias is ${data.bias}. DXY correlation is ${data.pulse}.`);
        localStorage.setItem('lastScanVoiceDate', today);
    }
}