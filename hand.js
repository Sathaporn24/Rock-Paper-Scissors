const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const scoreElement = document.getElementById('score');
const waitingEl = document.getElementById('waiting');
const showHandViewEl = document.getElementById('show_hand');
const playerSelectHandEl = document.getElementById('player_hand');
const playerResultEl = document.getElementById('player_result');
const computerResultEl = document.getElementById('computer_result');
const playerScoreEl = document.getElementById('player_score');
const computerScoreEl = document.getElementById('computer_score');
const resultEl = document.getElementById('result');
const restartBTN = document.getElementById('reset').addEventListener('click', restart);
const drawingUtils = window;
const waitHands = 1;
const countDown = 2;
let state = waitHands;
let isDetected = false;
let gameBegin = false;
let displayShow = 'initial';
let displayDisable = 'none';
let playerScore = 0;
let computerScore = 0;
let gesture = '';
const holistic = new Holistic({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`;
  },
});
holistic.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
holistic.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await holistic.send({ image: videoElement });
    if (state == waitHands) {
      showHandViewEl.style.display = displayShow;
      if (checkHands()) {
        startCountDown();
      }
    }
  },
  width: 640,
  height: 480,
});
camera.start();

function checkHands() {
  if (isDetected) {
    showHandViewEl.style.display = displayDisable;
    return true;
  } else return false;
}

async function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  // Flip the video horizontally
  canvasCtx.translate(canvasElement.width, 0);
  canvasCtx.scale(-1, 1);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  const hands = [
    { landmarks: results.leftHandLandmarks, label: 'Left' },
    { landmarks: results.rightHandLandmarks, label: 'Right' },
  ];
  let textResultContent = '';

  for (const hand of hands) {
    if (hand.landmarks && !gameBegin) {
      isDetected = true;
      // Draw hand landmarks
      drawingUtils.drawConnectors(canvasCtx, hand.landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
      for (const landmark of hand.landmarks) {
        drawingUtils.drawLandmarks(canvasCtx, [landmark], { color: '#00FF00', lineWidth: 2 });
      }
      gesture = detectGesture(hand.landmarks);
      // Add hand label to textResult
      textResultContent += `${hand.label} Hand: ${gesture}\n`;
    } else if (hands.every((h) => h.landmarks == undefined) && !gameBegin) {
      //ตรวจสอบว่าถ้าไม่พบค่าทั้งมือซ้ายและขวา
      gesture = ''; //ถ้าเอาตรงนี้ออก จะจำลักษณะมือล่าสุดที่แสดง
      isDetected = false;
    }
  }
  playerSelectHandEl.textContent = textResultContent;
  canvasCtx.restore();
}
function detectGesture(landmarks) {
  const allFingersFolded =
    landmarks[8].y > landmarks[6].y && // นิ้วชี้กำ
    landmarks[12].y > landmarks[10].y && // นิ้วกลางกำ
    landmarks[16].y > landmarks[14].y && // นิ้วนางกำ
    landmarks[20].y > landmarks[18].y; // นิ้วก้อยกำ
  if (allFingersFolded) return 'Rock';
  // Check if only index and middle fingers are extended (Scissors)
  const onlyIndexAndMiddleExtended =
    landmarks[8].y < landmarks[6].y && // Index finger extended
    landmarks[12].y < landmarks[10].y && // Middle finger extended
    landmarks[16].y > landmarks[14].y && // Ring finger not extended
    landmarks[20].y > landmarks[18].y; // Pinky finger not extended
  if (onlyIndexAndMiddleExtended) return 'Scissors';
  // Otherwise, assume it's Rock
  return 'Paper'; //ถ้ากระดาษมัน detect เงื่อนไขยากไป กำหนดเงื่อนไขตรวจจับค้อน ที่ตรวจสอบง่ายกว่าเยอะ
}
// Start countdown 3 time after that game begins.
function startCountDown() {
  if (state == countDown) {
    return;
  }
  state = countDown;
  showHandViewEl.style.display = displayDisable;
  /*   restartButtonEl.style.display = displayDisable; */
  waitingEl.style.display = displayShow;
  let countDownTime = 3;
  waitingEl.innerHTML = countDownTime.toString();
  let x = setInterval(function () {
    if (countDownTime == 0) {
      gameBegin = true;
      clearInterval(x);
      waitingEl.style.display = displayDisable;
      startRound(gesture);
    } else {
      countDownTime -= 1;
      waitingEl.innerHTML = countDownTime.toString();
    }
  }, 1000);
}

function startRound(playerHand) {
  const computerResult = ['Paper', 'Rock', 'Scissors'];
  const index = Math.floor(Math.random() * computerResult.length);
  switch (computerResult[index]) {
    case 'Paper':
      computerResultEl.src = 'paper.png';
      break;
    case 'Rock':
      computerResultEl.src = 'rock.png';
      break;
    case 'Scissors':
      computerResultEl.src = 'scissors.png';
      break;
    default:
      computerResultEl.src = 'RPS.jpg';
      break;
  }
  checkResult(playerHand, computerResult[index]);
}
function checkResult(playerHand, botResult) {
  if (playerHand == botResult) {
    resultEl.innerText = `คุณออก:${gesture} เสมอ`;
  } else if (
    (botResult == 'Paper' && playerHand == 'Rock') ||
    (botResult == 'Rock' && playerHand == 'Scissors') ||
    (botResult == 'Scissors' && playerHand == 'Paper')
  ) {
    resultEl.innerText = `คุณออก:${gesture} คุณแพ้`;
    computerScore += 1;
    computerScoreEl.innerText = `คะแนน : ${computerScore.toString()}`;
  } else if (playerHand == '') {
    resultEl.innerText = `คุณไม่ได้ออกอะไร คุณแพ้`;
    computerScore += 1;
    computerScoreEl.innerText = `คะแนน : ${computerScore.toString()}`;
  } else {
    resultEl.innerText = `คุณออก:${gesture} คุณชนะ`;
    playerScore += 1;
    playerScoreEl.innerText = `คะแนน : ${playerScore.toString()}`;
  }
  resultEl.style.display = displayShow;

  setTimeout(function () {
    computerResultEl.src = 'RPS.jpg';
    resultEl.style.display = displayDisable;

    state = waitHands;
    gameBegin = false;
    gesture = '';
  }, 3000);
}

function restart() {
  playerScore = 0;
  computerScore = 0;
  state = waitHands;
  gameBegin = false;
  playerScoreEl.innerText = `คะแนน : ${playerScore.toString()}`;
  computerScoreEl.innerText = `คะแนน : ${computerScore.toString()}`;
  showHandViewEl.style.display = initialState;
}
