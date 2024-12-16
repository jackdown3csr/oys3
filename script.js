let usedKeys = new Set();
let wordsAndHints = [];
let currentWord = "";
let currentHint = "";
let attemptsRemaining = 7;
let level = 0;
let maxLevels = 10;
let isOverlayActive = false; // Added flag to track overlay activity

const successSound = new Audio("success.mp3");
const errorSound = new Audio("error.mp3");
const winSound = new Audio("win.mp3");
const loseSound = new Audio("lose.mp3");

let backgroundMusic; // Variable to hold the background music

// Function to load random background music
function loadBackgroundMusic() {
  const musicFiles = ['bgmusic/bgmusic1.mp3', 'bgmusic/bgmusic2.mp3']; // Add your music file names here
  const randomMusicFile = musicFiles[Math.floor(Math.random() * musicFiles.length)];
  
  backgroundMusic = new Audio(randomMusicFile);
  backgroundMusic.loop = true; // Set the music to loop
  backgroundMusic.volume = 0.5; // Set the volume to 50%
}

// Function to play background music
function playBackgroundMusic() {
  if (backgroundMusic) {
    backgroundMusic.play().catch(error => {
      console.log("Background music playback failed due to: ", error);
    });
  }
}

// Function to stop background music
function stopBackgroundMusic() {
  if (backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  }
}

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

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function toggleOverlay(overlayId) {
  // Hide all overlays
  document.querySelectorAll("#overlays > div").forEach(div => div.style.display = "none");
  
  // Show the specified overlay if it's inside #overlays
  if (document.getElementById(overlayId).parentElement.id === 'overlays') {
    document.getElementById(overlayId).style.display = "block";
    isOverlayActive = true; // Set flag to true when an overlay is active
    // Set focus on the button inside the overlay
    const button = document.getElementById(overlayId).querySelector('button');
    if (button) {
      button.focus();
    }
  } else {
    // Handle elements outside of #overlays
    document.getElementById(overlayId).style.display = "block";
    isOverlayActive = false; // Set flag to false when game area is active
  }
  
  if (overlayId === "gameOver" || overlayId === "gameWin") {
    document.getElementById("gameArea").style.pointerEvents = "none"; // Disable interactions
  } else {
    document.getElementById("gameArea").style.pointerEvents = "auto"; // Enable interactions
  }
}

function startGame() {
  loadBackgroundMusic(); // Load background music
  loadWords().then(() => {
    shuffleArray(wordsAndHints);
    maxLevels = Math.min(wordsAndHints.length, 10);
    level = 0;
    attemptsRemaining = 7;
    usedKeys.clear();
    createVirtualKeyboard();
    toggleOverlay("gameArea");
    isOverlayActive = false; // Set flag to false when starting the game
    nextLevel();
    playBackgroundMusic(); // Play background music when starting the game
  });
}

function restartGame() {
  stopBackgroundMusic(); // Stop the current background music
  loadBackgroundMusic(); // Load a new random background music
  loadWords().then(() => {
    shuffleArray(wordsAndHints);
    maxLevels = Math.min(wordsAndHints.length, 10);
    level = 0;
    attemptsRemaining = 7;
    usedKeys.clear();
    createVirtualKeyboard();
    toggleOverlay("howToPlay");
    document.getElementById("gameArea").style.display = "none";
    isOverlayActive = true; // Set flag to true when restarting the game
    playBackgroundMusic(); // Play the new background music
  });
}

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
  document.getElementById("hint").textContent = `Hint: ${currentHint}`;
  updateUI();
}

function handleKeyPress(key) {
  if (isOverlayActive) return; // Do not process key presses if an overlay is active
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

function updateUI() {
  document.getElementById("attempts").textContent = `Attempts Remaining: ${attemptsRemaining}`;
  document.getElementById("level").textContent = `Level: ${level + 1}`;
}

function revealLetter(key) {
  currentWord.split("").forEach((letter, index) => {
    if (letter === key) {
      const letterElement = document.querySelectorAll("#word .letter")[index];
      letterElement.textContent = key;
      letterElement.classList.add("letter-reveal");
      letterElement.style.animationDelay = index * 0.1 + "s"; // 100ms delay per letter
    }
  });
}

function checkWinCondition() {
  const allLettersRevealed = Array.from(document.querySelectorAll("#word .letter"))
    .every(letter => letter.textContent !== "X");

  if (allLettersRevealed) {
    // Add fade out animation to the current word
    document.getElementById("word").classList.add("word-fade-out");
    // Add animation to level display
    document.getElementById("level").classList.add("level-increase");
    // Prevent key presses during transition
    isOverlayActive = true;
    setTimeout(() => {
      level++;
      nextLevel();
      // Reset flag after transition
      isOverlayActive = false;
      // Remove fade out class after transition
      document.getElementById("word").classList.remove("word-fade-out");
      document.getElementById("level").classList.remove("level-increase");
    }, 1500); // 1.5 second delay
  }
}

function checkGameOver() {
  if (attemptsRemaining <= 0) {
    loseSound.play();
    toggleOverlay("gameOver");
  }
}

function initializeWord() {
  const wordDisplay = document.getElementById("word");
  wordDisplay.innerHTML = currentWord
    .split("")
    .map(letter => `<span class="letter">${letter === " " ? "&nbsp;" : "X"}</span>`)
    .join("");
}

function createVirtualKeyboard() {
  const keyboard = document.getElementById("keyboard");
  keyboard.innerHTML = "";

  const rows = [
    "Q W E R T Z U I O P".split(" "),
    "A S D F G H J K L".split(" "),
    "Y X C V B N M".split(" ")
  ];

  rows.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "key-row";
    row.forEach(key => {
      const keyElement = document.createElement("div");
      keyElement.className = "key";
      keyElement.textContent = key;
      keyElement.dataset.key = key;
      keyElement.onclick = () => handleKeyPress(key);
      rowDiv.appendChild(keyElement);
    });
    keyboard.appendChild(rowDiv);
  });
}

// Add event listener for Enter key press
document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && event.target.tagName === 'BUTTON' && event.target.closest('#overlays')) {
    event.target.click();
  }
});

document.addEventListener("keydown", event => {
  if (document.getElementById("gameArea").style.display === "block") {
    handleKeyPress(event.key);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // Initialize any necessary functions here
  // For this game, initialization is handled by startGame()
});