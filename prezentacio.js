const slides = document.querySelectorAll(".slide");
const progressBar = document.getElementById("progress-bar");
const counter = document.getElementById("counter");
const playButton = document.getElementById("play");
const AUTO_DELAY = 6000;

let current = 0;
let timer = null;

function showSlide(index) {
  current = Math.max(0, Math.min(index, slides.length - 1));

  slides.forEach(function (slide, i) {
    slide.classList.toggle("active", i === current);
    slide.classList.toggle("past", i < current);
  });

  progressBar.style.width = ((current + 1) / slides.length) * 100 + "%";
  counter.textContent = current + 1 + " / " + slides.length;
}

function nextSlide() {
  if (current < slides.length - 1) {
    showSlide(current + 1);
  } else {
    stopAuto();
  }
}

function prevSlide() {
  showSlide(current - 1);
}

function startAuto() {
  timer = setInterval(nextSlide, AUTO_DELAY);
  playButton.textContent = "⏸ Megállítás";
}

function stopAuto() {
  clearInterval(timer);
  timer = null;
  playButton.textContent = "▶ Automatikus";
}

document.getElementById("next").addEventListener("click", function () {
  stopAuto();
  nextSlide();
});

document.getElementById("prev").addEventListener("click", function () {
  stopAuto();
  prevSlide();
});

playButton.addEventListener("click", function () {
  if (timer) {
    stopAuto();
  } else {
    startAuto();
  }
});

document.getElementById("restart").addEventListener("click", function () {
  showSlide(0);
});

document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    stopAuto();
    nextSlide();
  } else if (event.key === "ArrowLeft") {
    stopAuto();
    prevSlide();
  }
});

// 3D döntés az egér vízszintes mozgásával
document.addEventListener("mousemove", function (event) {
  const x = event.clientX / window.innerWidth - 0.5;
  document.documentElement.style.setProperty("--mx", (x * 16).toFixed(1));
});

showSlide(0);

// ===== Zene: Cyberpunk hangulatú synthwave, a böngészőben generálva =====
const soundButton = document.getElementById("sound");
const BPM = 96;
const STEP_TIME = 60 / BPM / 4; // egy tizenhatod hang hossza másodpercben

// Am – F – C – G akkordmenet (MIDI hangok)
const BASS = [33, 29, 36, 31];
const CHORDS = [
  [57, 60, 64, 67],
  [53, 57, 60, 65],
  [55, 60, 64, 67],
  [55, 59, 62, 67],
];
const ARP_PATTERN = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 1, 2, 1];

let audioCtx = null;
let master = null;
let noiseBuffer = null;
let schedulerId = null;
let nextNoteTime = 0;
let step = 0;
let musicOn = false;
let userChose = false;

function midiToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function tone(note, time, duration, type, volume, cutoff) {
  const osc = audioCtx.createOscillator();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = midiToFreq(note);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoff, time);
  filter.frequency.exponentialRampToValueAtTime(Math.max(cutoff / 4, 80), time + duration);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(volume, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  osc.start(time);
  osc.stop(time + duration + 0.05);
}

function pad(notes, time, duration) {
  notes.forEach(function (note) {
    [-6, 6].forEach(function (detune) {
      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();

      osc.type = "sawtooth";
      osc.frequency.value = midiToFreq(note);
      osc.detune.value = detune;
      filter.type = "lowpass";
      filter.frequency.value = 700;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.025, time + duration * 0.4);
      gain.gain.linearRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    });
  });
}

function kick(time) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(160, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
  gain.gain.setValueAtTime(0.9, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
  osc.connect(gain);
  gain.connect(master);
  osc.start(time);
  osc.stop(time + 0.35);
}

function noise(time, duration, volume, highpass) {
  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  source.buffer = noiseBuffer;
  filter.type = "highpass";
  filter.frequency.value = highpass;
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start(time);
  source.stop(time + duration + 0.05);
}

function scheduleStep(index, time) {
  const inBar = index % 16;
  const chord = Math.floor(index / 16) % 4;

  if (inBar === 0) {
    pad(CHORDS[chord], time, STEP_TIME * 16);
  }

  if ([0, 8, 10].includes(inBar)) {
    kick(time);
  }
  if (inBar === 4 || inBar === 12) {
    noise(time, 0.18, 0.35, 1500); // pergő
  }
  if (inBar % 2 === 0) {
    noise(time, 0.05, inBar % 4 === 2 ? 0.16 : 0.08, 7000); // hi-hat
  }

  if (inBar % 2 === 0) {
    const octave = inBar % 8 === 6 ? 12 : 0;
    tone(BASS[chord] + octave, time, STEP_TIME * 1.8, "sawtooth", 0.22, 600);
  }

  const arpNote = CHORDS[chord][ARP_PATTERN[inBar]] + 12;
  tone(arpNote, time, STEP_TIME * 1.5, "sawtooth", 0.07, 3200);
}

function scheduler() {
  while (nextNoteTime < audioCtx.currentTime + 0.15) {
    scheduleStep(step, nextNoteTime);
    nextNoteTime += STEP_TIME;
    step += 1;
  }
}

function setupAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  master = audioCtx.createGain();
  master.gain.value = 0;

  // enyhe visszhang a térhatásért
  const delay = audioCtx.createDelay();
  const feedback = audioCtx.createGain();
  delay.delayTime.value = (60 / BPM) * 0.75;
  feedback.gain.value = 0.3;
  delay.connect(feedback);
  feedback.connect(delay);

  master.connect(audioCtx.destination);
  master.connect(delay);
  delay.connect(audioCtx.destination);

  noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
}

function startMusic() {
  if (!audioCtx) {
    setupAudio();
  }
  audioCtx.resume();
  master.gain.cancelScheduledValues(audioCtx.currentTime);
  master.gain.setTargetAtTime(0.5, audioCtx.currentTime, 0.2);

  nextNoteTime = audioCtx.currentTime + 0.1;
  step = 0;
  schedulerId = setInterval(scheduler, 25);

  musicOn = true;
  soundButton.textContent = "🔊";
  soundButton.title = "Zene kikapcsolása";
  soundButton.classList.add("playing");
}

function stopMusic() {
  clearInterval(schedulerId);
  schedulerId = null;
  master.gain.cancelScheduledValues(audioCtx.currentTime);
  master.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);

  musicOn = false;
  soundButton.textContent = "🔇";
  soundButton.title = "Zene bekapcsolása";
  soundButton.classList.remove("playing");
}

soundButton.addEventListener("click", function () {
  userChose = true;
  if (musicOn) {
    stopMusic();
  } else {
    startMusic();
  }
});

// A böngészők csak felhasználói művelet után engedik a hangot,
// ezért az első kattintásra vagy billentyűre indul a zene.
function firstInteraction(event) {
  if (userChose || soundButton.contains(event.target)) {
    return;
  }
  userChose = true;
  startMusic();
}

document.addEventListener("pointerdown", firstInteraction, { once: true });
document.addEventListener("keydown", firstInteraction, { once: true });

// ===== Függőleges artefaktok a képernyőn =====
const glitchLayer = document.getElementById("glitch-layer");
const STREAK_COUNT = 34;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomizeStreak(streak) {
  const isBlock = Math.random() < 0.22;
  const height = randomBetween(18, 80);

  streak.classList.toggle("block", isBlock);
  streak.style.setProperty("--w", (isBlock ? randomBetween(40, 110) : randomBetween(2, 12)).toFixed(0) + "px");
  streak.style.setProperty("--h", height.toFixed(0) + "vh");
  streak.style.setProperty("--left", randomBetween(0, 100).toFixed(1) + "%");
  streak.style.setProperty("--top", randomBetween(-10, 100 - height * 0.6).toFixed(0) + "vh");
  streak.style.setProperty("--o", (isBlock ? randomBetween(0.1, 0.25) : randomBetween(0.25, 0.7)).toFixed(2));
  streak.style.setProperty("--dur", randomBetween(1.2, 4).toFixed(1) + "s");
  streak.style.setProperty("--delay", "-" + randomBetween(0, 4).toFixed(1) + "s");
}

const streaks = [];
for (let i = 0; i < STREAK_COUNT; i++) {
  const streak = document.createElement("div");
  streak.className = "glitch-streak";
  randomizeStreak(streak);
  glitchLayer.appendChild(streak);
  streaks.push(streak);
}

// időnként néhány csík új helyre ugrik, így "glitchel" a kép
setInterval(function () {
  const count = 1 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    randomizeStreak(streaks[Math.floor(Math.random() * streaks.length)]);
  }
}, 450);
