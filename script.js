// Define audio elements
const successSound = new Audio("success.mp3");
const errorSound = new Audio("error.mp3");
const winSound = new Audio("win.mp3");
const loseSound = new Audio("lose.mp3");
const backgroundMusic = document.getElementById('bgMusic');

// Array of music tracks
const musicFiles = ['bgmusic/bgmusic1.mp3', 'bgmusic/bgmusic2.mp3'];

// Variables for game state
let usedKeys = new Set();
let wordsAndHints = [];
let currentWord = "";
let currentHint = "";
let attemptsRemaining = 7;
let level = 0;
let maxLevels = 10;
let isOverlayActive = false;

// Function to load a random background track
function loadBackgroundTrack() {
  const randomTrack = musicFiles[Math.floor(Math.random() * musicFiles.length)];
  backgroundMusic.src = randomTrack;
  backgroundMusic.volume = parseFloat(localStorage.getItem('musicVolume')) || 0.5;
  backgroundMusic.load();
}

// Function to start background music
function startBackgroundMusic() {
  if (!backgroundMusic.src || backgroundMusic.paused) {
    loadBackgroundTrack();
    backgroundMusic.play().catch(error => {
      console.error("Error playing background music:", error);
    });
    backgroundMusic.addEventListener('ended', loadBackgroundTrack);
  }
}

// Function to stop background music
function stopBackgroundMusic() {
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
  backgroundMusic.removeEventListener('ended', loadBackgroundTrack);
}

// Function to set up background music volume control
function setupVolumeControl() {
  const soundSlider = document.getElementById('soundslider');
  
  // Set initial value from localStorage or default to 50
  soundSlider.value = (parseFloat(localStorage.getItem('musicVolume')) || 0.5) * 100;
  
  // Update background music volume immediately
  backgroundMusic.volume = soundSlider.value / 100;
  
  // Add event listener for slider changes
  soundSlider.addEventListener('input', function() {
    backgroundMusic.volume = soundSlider.value / 100;
    localStorage.setItem('musicVolume', soundSlider.value / 100);
  });
}

// Function to set up SFX volume control
function setupSFXVolumeControl() {
  const sfxSlider = document.getElementById('sfxslider');
  
  // Set initial value from localStorage or default to 50
  sfxSlider.value = (parseFloat(localStorage.getItem('sfxVolume')) || 0.5) * 100;
  
  // Function to update SFX volumes
  function updateSFXVolume() {
    const volume = sfxSlider.value / 100;
    successSound.volume = volume;
    errorSound.volume = volume;
    winSound.volume = volume;
    loseSound.volume = volume;
  }
  
  // Set initial volume
  updateSFXVolume();
  
  // Add event listener for slider changes
  sfxSlider.addEventListener('input', function() {
    updateSFXVolume();
    localStorage.setItem('sfxVolume', sfxSlider.value / 100);
  });
}

// Function to load words and hints from file
async function loadWords() {
  const response = await fetch("slova.txt");
  const text = await response.text();
  wordsAndHints = text
    .split("\n")
    .filter(line => line.trim())
    .map(line => {
      const [word, hint] = line.split(",");
      return { word: word.trim().toUpperCase(), hint: hint.trim() };
    });
}

// Function to shuffle the array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Function to toggle overlays
function toggleOverlay(overlayId) {
  document.querySelectorAll("#overlays > div").forEach(div => div.style.display = "none");
  
  // Show the specified overlay
  document.getElementById(overlayId).style.display = "block";
  
  // Control background music based on the overlay
  if (overlayId === "gameArea") {
    startBackgroundMusic();
  } else if (overlayId === "gameOver" || overlayId === "gameWin") {
    stopBackgroundMusic();
  } else if (overlayId === "howToPlay") {
    stopBackgroundMusic();
  }
  
  // Disable gameArea interactions if game over or win
  if (overlayId === "gameOver" || overlayId === "gameWin") {
    document.getElementById("gameArea").style.pointerEvents = "none";
  } else {
    document.getElementById("gameArea").style.pointerEvents = "auto";
  }
}

// Function to start the game
function startGame() {
  loadBackgroundTrack();
  loadWords().then(() => {
    shuffleArray(wordsAndHints);
    maxLevels = Math.min(wordsAndHints.length, 10);
    level = 0;
    attemptsRemaining = 7;
    usedKeys.clear();
   
    toggleOverlay("gameArea"); // This will start the background music
    isOverlayActive = false;
    nextLevel();
  });
}

// Function to restart the game
function restartGame() {
  stopBackgroundMusic();
  loadBackgroundTrack();
  loadWords().then(() => {
    shuffleArray(wordsAndHints);
    maxLevels = Math.min(wordsAndHints.length, 10);
    level = 0;
    attemptsRemaining = 7;
    usedKeys.clear();
  
    toggleOverlay("howToPlay"); // This will stop the background music
    isOverlayActive = true;
  });
}

// Function to handle the next level
function nextLevel() {
  if (level >= maxLevels) {
    winSound.play();
    toggleOverlay("gameWin");
    return;
  }
  if (attemptsRemaining <= 0) {
    loseSound.play();
    toggleOverlay("gameOver");
    return;
  }
  
  usedKeys.clear();
  document.querySelectorAll(".key").forEach(key => key.classList.remove("disabled"));
  
  currentWord = wordsAndHints[level].word;
  currentHint = wordsAndHints[level].hint;
  
  initializeWord();
  document.getElementById("hint").textContent = `${currentHint}`;
  updateUI();
}

// Function to handle key presses
function handleKeyPress(key) {
  if (isOverlayActive) return;
  key = key.toUpperCase();
  if (!/^[A-Z]$/.test(key) || usedKeys.has(key)) return;
  
  usedKeys.add(key);
  const keyElement = document.querySelector(`.key[data-key="${key}"]`);
  if (keyElement) keyElement.classList.add("disabled");
  
  if (currentWord.includes(key)) {
    successSound.play();
    revealLetter(key);
    checkWinCondition();
  } else {
    errorSound.play();
    attemptsRemaining--;
    checkGameOver();
  }
  updateUI();
}

// Function to update UI elements
function updateUI() {
  document.getElementById("attempts").textContent = `Attempts Remaining: ${attemptsRemaining}`;
  document.getElementById("level").textContent = `Level: ${level + 1}`;
}

// Function to reveal letters in the word
function revealLetter(key) {
  currentWord.split("").forEach((letter, index) => {
    if (letter === key) {
      const letterElement = document.querySelectorAll("#word .letter")[index];
      letterElement.textContent = key;
      letterElement.classList.add("letter-reveal");
      letterElement.style.animationDelay = index * 0.1 + "s";
    }
  });
}

// Function to check win condition
function checkWinCondition() {
  const allLettersRevealed = Array.from(document.querySelectorAll("#word .letter"))
    .every(letter => letter.textContent !== "X");
  
  if (allLettersRevealed) {
    document.getElementById("word").classList.add("word-fade-out");
    document.getElementById("level").classList.add("level-increase");
    isOverlayActive = true;
    setTimeout(() => {
      level++;
      nextLevel();
      isOverlayActive = false;
      document.getElementById("word").classList.remove("word-fade-out");
      document.getElementById("level").classList.remove("level-increase");
    }, 1500);
  }
}

// Function to check game over condition
function checkGameOver() {
  if (attemptsRemaining <= 0) {
    loseSound.play();
    toggleOverlay("gameOver");
  }
}

// Function to initialize the word display
function initializeWord() {
  const wordDisplay = document.getElementById("word");
  wordDisplay.innerHTML = currentWord
    .split("")
    .map(letter => `<span class="letter">${letter === " " ? "&nbsp;" : "X"}</span>`)
    .join("");
}



// Event listener for Enter key on buttons within overlays
document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && event.target.tagName === 'BUTTON' && event.target.closest('#overlays')) {
    event.target.click();
  }
});

// Event listener for key presses in gameArea
document.addEventListener("keydown", event => {
  if (document.getElementById("gameArea").style.display === "block") {
    handleKeyPress(event.key);
  }
});

// Event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  setupVolumeControl();
  setupSFXVolumeControl();

  document.querySelectorAll('.key').forEach(key => {
    key.addEventListener('click', () => handleKeyPress(key.dataset.key));
  });
});

function redirect() {
  stopBackgroundMusic();
  window.location.href = "https://www.shardsofgalactica.org/";
}

// Function to toggle mute
function toggleMute() {
  const isMuted = backgroundMusic.muted;

  // Toggle background music mute
  backgroundMusic.muted = !isMuted;

  // Toggle SFX mute
  successSound.muted = !isMuted;
  errorSound.muted = !isMuted;
  winSound.muted = !isMuted;
  loseSound.muted = !isMuted;

  // Update the mute button text
  document.getElementById('muteButton').textContent = isMuted ? '[Mute]' : '[Unmute]';
}

// Event listener for mute button
document.getElementById('muteButton').addEventListener('click', toggleMute);