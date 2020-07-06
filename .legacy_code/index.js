const io = require("socket.io-client");
const ioClient = io.connect("http://localhost:8000");

// Accepts validBets as strings in form "numDice-dieValue"
const populateBets = (validBets) => {
  let betSelector = document.getElementById("bet-select");
  betSelector.innerHTML = "";

  let call = document.createElement("option");
  call.value = "call";
  call.innerHTML = "Call";

  betSelector.appendChild(call);

  for (option of validBets) {
    let newBet = document.createElement("option");
    newBet.value = option;
    newBet.innerHTML = option;
    betSelector.appendChild(newBet);
  }
};

const submitBet = (dice, numDice) => {
  let isCall = false;
  if (dice === 0) {
    isCall = true;
  }

  //server call
};

const getContainer = (isMyDice) => {
  let container;
  if (isMyDice) {
    container = document.getElementById("mydice");
  } else {
    container = document.getElementById("enemydice");
  }
  return container;
};

//server send
const addDice = (diceArray, isMyDice) => {
  let container = getContainer(isMyDice);

  container.innerHTML = "";

  for (const die of diceArray) {
    let dieImage = document.createElement("img");
    switch (die) {
      case 1:
        dieImage.src = "./img/1.JPG";
        break;
      case 2:
        dieImage.src = "./img/2.JPG";
        break;
      case 3:
        dieImage.src = "./img/3.JPG";
        break;
      case 4:
        dieImage.src = "./img/4.JPG";
        break;
      default:
        break;
    }
    container.appendChild(dieImage);
  }
};
