const storyContainer = document.getElementById('story-container');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const scoreDisplay = document.getElementById('score-display');

// Modal Elements
const puzzleModal = document.getElementById('puzzle-modal');
const puzzleQuestion = document.getElementById('puzzle-question');
const puzzleOptions = document.getElementById('puzzle-options');

let score = 0;
let currentPuzzleAnswer = null;
let chatHistory = [];

const aiAvatar = '/guide.png';
const userAvatar = '/player.png';

// Scroll to bottom of chat
function scrollToBottom() {
  setTimeout(() => {
    storyContainer.scrollTop = storyContainer.scrollHeight;
  }, 100);
}

// Add a message to the chat
function addMessage(text, sender = 'ai') {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  
  const avatarUrl = sender === 'ai' ? aiAvatar : userAvatar;
  
  msgDiv.innerHTML = `
    <img src="${avatarUrl}" alt="${sender} avatar" class="avatar" />
    <div class="bubble">${text}</div>
  `;
  
  storyContainer.appendChild(msgDiv);
  scrollToBottom();
}

// Update the score
function addScore(points) {
  score += points;
  scoreDisplay.innerText = score;
  
  // Animate the score badge
  const badge = document.querySelector('.score-badge');
  badge.style.transform = 'scale(1.2)';
  badge.style.color = '#10b981';
  setTimeout(() => {
    badge.style.transform = 'scale(1)';
    badge.style.color = '#fbbf24';
  }, 300);
}

// Generate a math puzzle
function triggerMathPuzzle(callback) {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  currentPuzzleAnswer = num1 + num2;
  
  puzzleQuestion.innerText = `What is ${num1} + ${num2}?`;
  
  // Generate options (1 correct, 3 wrong)
  let options = [currentPuzzleAnswer];
  while(options.length < 4) {
    let wrongAnswer = currentPuzzleAnswer + Math.floor(Math.random() * 10) - 5;
    if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // Shuffle options
  options = options.sort(() => Math.random() - 0.5);
  
  puzzleOptions.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerText = opt;
    btn.onclick = () => handlePuzzleAnswer(btn, opt, callback);
    puzzleOptions.appendChild(btn);
  });
  
  puzzleModal.classList.add('active');
}

// Handle answer selection
function handlePuzzleAnswer(btn, selectedValue, callback) {
  const buttons = puzzleOptions.querySelectorAll('button');
  buttons.forEach(b => b.style.pointerEvents = 'none');
  
  if (selectedValue === currentPuzzleAnswer) {
    btn.classList.add('correct');
    addScore(10);
    setTimeout(() => {
      puzzleModal.classList.remove('active');
      callback(true);
    }, 1000);
  } else {
    btn.classList.add('wrong');
    buttons.forEach(b => {
      if (parseInt(b.innerText) === currentPuzzleAnswer) {
        b.classList.add('correct');
      }
    });
    setTimeout(() => {
      puzzleModal.classList.remove('active');
      callback(false);
    }, 1500);
  }
}

// Generate a scene image from the backend
async function generateSceneImage(sceneDescription) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ai`;
  
  msgDiv.innerHTML = `
    <img src="${aiAvatar}" alt="ai avatar" class="avatar" />
    <div class="bubble">
      <div class="scene-image-container">
        <div class="loading-spinner">✨ Visualizing the magic... ✨</div>
      </div>
    </div>
  `;
  
  storyContainer.appendChild(msgDiv);
  scrollToBottom();

  try {
    const response = await fetch('/api/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sceneDescription })
    });
    
    if (!response.ok) throw new Error('Image generation failed');

    // Convert the raw image response to a blob URL
    const blob = await response.blob();
    const localUrl = URL.createObjectURL(blob);

    const container = msgDiv.querySelector('.scene-image-container');
    container.innerHTML = `<img src="${localUrl}" class="scene-image" alt="Scene Image" onload="scrollToBottom()" />`;
  } catch (err) {
    console.error(err);
    const container = msgDiv.querySelector('.scene-image-container');
    container.innerHTML = `<div style="padding: 1rem; color: #ef4444;">Oops! My visualization spell fizzled out.</div>`;
  }
  scrollToBottom();
}

// AI Backend Logic
async function handleUserInput(text) {
  // Show a loading state or just wait
  chatInput.placeholder = "Pixel is thinking...";
  chatInput.disabled = true;
  sendBtn.disabled = true;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        history: chatHistory,
        userMessage: text
      })
    });

    const data = await response.json();

    if (data.error) {
      addMessage("Oops! My magical circuits are jammed. Check the API key!");
    } else {
      const aiResponse = data.message;
      addMessage(aiResponse, 'ai');
      
      // Save to history
      chatHistory.push({ sender: 'user', text });
      chatHistory.push({ sender: 'ai', text: aiResponse });

      // Trigger image generation
      generateSceneImage(aiResponse);

      // Randomly trigger a math puzzle after some responses
      if (Math.random() < 0.25) {
        setTimeout(() => {
          triggerMathPuzzle((success) => {
             if (success) {
               addMessage("Great job solving that! What do we do next?");
             } else {
               addMessage("Nice try! We'll get the next one. Where to now?");
             }
          });
        }, 3000); // Increased delay slightly to let image load
      }
    }
  } catch (error) {
    console.error(error);
    addMessage("Something went wrong with the magical connection! Is the server running?");
  } finally {
    chatInput.placeholder = "What do you do next?";
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

// Handle sending messages
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  
  addMessage(text, 'user');
  chatInput.value = '';
  
  handleUserInput(text);
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Real Voice Recognition
let isListening = false;
let recognition = null;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    voiceBtn.classList.add('listening');
    chatInput.placeholder = "Listening... Speak now!";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    sendMessage();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    alert(`Voice Error: ${event.error}. Please make sure your microphone is connected and permissions are allowed.`);
    chatInput.placeholder = "What do you do next?";
  };

  recognition.onend = () => {
    isListening = false;
    voiceBtn.classList.remove('listening');
    if (chatInput.placeholder === "Listening... Speak now!") {
        chatInput.placeholder = "What do you do next?";
    }
  };
}

voiceBtn.addEventListener('click', () => {
  if (!recognition) {
    alert("Oops! Voice recognition isn't supported in this browser. Try Chrome or Edge!");
    return;
  }
  
  if (isListening) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      alert("Error starting voice recognition. It might already be listening, or mic access is blocked.");
    }
  }
});

// Start Game
function startGame() {
  const introMsg = "Hi! I'm Pixel, your magical robot guide! Welcome to PromptQuest. We have a big adventure ahead of us. Where should we go first: the 'Enchanted Forest' or the 'Whispering Mountains'?";
  addMessage(introMsg, 'ai');
  chatHistory.push({ sender: 'ai', text: introMsg });
}

// Init
window.onload = startGame;
