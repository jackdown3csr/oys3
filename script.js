let usedKeys = new Set();
let wordsAndHints = [];
let currentWord = "";
let currentHint = "";
let attemptsRemaining = 7;
let level = 0;
let maxLevels = 10;

const successSound = new Audio("success.mp3");
const errorSound = new Audio("error.mp3");
const winSound = new Audio("win.mp3");
const loseSound = new Audio("lose.mp3");

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
  document.querySelectorAll("#overlays > div").forEach(div => div.style.display = "none");
  document.getElementById(overlayId).style.display = "block";
  
  if (overlayId === "gameOver" || overlayId === "gameWin") {
    document.getElementById("gameArea").style.pointerEvents = "none"; // Disable interactions
  } else {
    document.getElementById("gameArea").style.pointerEvents = "auto"; // Enable interactions
  }
}

function startGame() {
  loadWords().then(() => {
    shuffleArray(wordsAndHints);
    maxLevels = Math.min(wordsAndHints.length, 10);
    level = 0;
    attemptsRemaining = 7;
    usedKeys.clear();
    toggleOverlay("gameArea");
    nextLevel();
  });
}

function restartGame() {
  loadWords().then(() => {
    shuffleArray(wordsAndHints);
    maxLevels = Math.min(wordsAndHints.length, 10);
    level = 0;
    attemptsRemaining = 7;
    usedKeys.clear();
    toggleOverlay("howToPlay");
    document.getElementById("gameArea").style.display = "none";
    document.getElementById("gameArea").style.pointerEvents = "auto"; // Enable interactions
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

  animateWordAndLevel(); // Animate the word and level indicator

  toggleOverlay("gameArea"); // Ensures game area is visible
}

function handleKeyPress(key) {
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
    level++;
    nextLevel();
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

document.addEventListener("keydown", event => {
  if (document.getElementById("gameArea").style.display === "block") {
    handleKeyPress(event.key);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  initializeGame();
});

function initializeGame() {
  createVirtualKeyboard();
}

function animateWordAndLevel() {
  const wordDisplay = document.getElementById("word");
  const levelIndicator = document.getElementById("level");

  // Add animation class to word and level indicator
  wordDisplay.classList.add("word-reveal-animation");
  levelIndicator.classList.add("level-reveal-animation");

  // Reset the animation classes after the animation completes
  setTimeout(() => {
    wordDisplay.classList.remove("word-reveal-animation");
    levelIndicator.classList.remove("level-reveal-animation");
  }, 1000); // Duration must match the CSS animation duration
}
