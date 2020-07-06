const io = require("socket.io-client");
const ioClient = io.connect("http://localhost:8008");

let state = {
  hand: [],
  numEnemyDice: 0,
};

// Accepts validBets as strings in form "numDice-dieValue"
const populateBets = (validBets) => {
  let betSelector = document.getElementById("bet-select");
  document.getElementById("bet-select").innerHTML = "";

  for (option of validBets) {
    let newBet = document.createElement("option");
    newBet.value = option;
    newBet.innerHTML = option;
    betSelector.appendChild(newBet);
  }
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

const updateDice = (diceArray, isMyDice) => {
  let container = getContainer(isMyDice);

  container.innerHTML = "";
  if (isMyDice) {
    for (const die of diceArray) {
      let dieImage = document.createElement("img");
      switch (die) {
        case 1:
          dieImage.src = "img/1.JPG";
          break;
        case 2:
          dieImage.src = "img/2.JPG";
          break;
        case 3:
          dieImage.src = "img/3.JPG";
          break;
        case 4:
          dieImage.src = "img/4.JPG";
          break;
        default:
          break;
      }
      container.appendChild(dieImage);
    }
  } else {
    for (let i = 0; i < diceArray.length; i++) {
      let dieImage = document.createElement("img");
      dieImage.src = "img/back.JPG";
      container.appendChild(dieImage);
    }
  }
};

ioClient.on("update", (newState) => {
  console.log("Got Update: ", newState);
  // hand - update my hand
  // num dice - update my hand
  if (newState.hand.length === 0) {
    alert("You Lose!");
  } else {
    state.hand = newState.hand;
    updateDice(state.hand, true);
  }
});

ioClient.on("updateEnemyDice", (numEnemyDice) => {
  console.log("Got Update: ", numEnemyDice);

  if (numEnemyDice === 0) {
    alert("You Win!");
  } else {
    state.numEnemyDice = numEnemyDice;
    updateDice(new Array(numEnemyDice), false);
  }
});

ioClient.on("validBets", (validBets) => {
  populateBets(validBets);
});

document.getElementById("bet").addEventListener("click", () => {
  ioClient.emit("bet", document.getElementById("bet-select").value);
});

ioClient.on("turnNotification", () => {
  alert("Your Turn");
});
