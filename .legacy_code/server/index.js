const io = require("socket.io");
const server = io.listen(8000);

const startingDice = 5;
let state = {
  currentBet: null,
  activePlayer: 0,
  id: {},
  players: {},
};

/*
state = {
  currentBet:{numDice:int, dieValue:int}
  turn:int(0/1)
  id:{player1id:0, player2id:1}
  players: 
  {
    0:{
      id:int
      hand:[int],
      numDice:int
    }
    1:{
      id:int
      hand:[int],
      numDice:int
    }
  }
}
*/

const generateValidBetOptions = () => {
  let currentBet = state["currentBet"];
  let totalDice =
    state["players"][0]["numDice"] + state["players"][1]["numDice"];
  let validBetOptions = [];

  //Only valid dice are above current num and current die
  for (let numDice = currentBet[numDice]; numDice <= totalDice; numDice++) {
    for (let dieValue = currentBet[dieValue] + 1; dieValue < 5; dieValue++) {
      validBetOptions.push(numDice + "-" + dieValue);
    }
  }

  return validBetOptions;
};

const emitState = () => {
  let player1Socket = state["players"][0]["id"];
  let player2Socket = state["players"][1]["id"];

  io.to(player1Socket).emit("update", state["players"][0]);
  io.to(player1Socket).emit("updateEnemyDice", state["players"][1]["numDice"]);

  io.to(player2Socket).emit("update", state["players"][1]);
  io.to(player2Socket).emit("updateEnemyDice", state["players"][0]["numDice"]);
};

const startGame = () => {
  let players = state["players"];
  players[0]["hand"] = generateHand(players[0]["numDice"]);
  players[1]["hand"] = generateHand(players[1]["numDice"]);
  emitState();
};

const getNumPlayers = () => {
  return Object.keys(state["players"]).length;
};

const addPlayer = (socket) => {
  if (getNumPlayers() < 2) {
    let newPlayer = {
      id: socket.id,
      hand: null,
      numDice: startingDice,
    };

    state["id"][socket.id] = getNumPlayers();
    state["players"][getNumPlayers()] = newPlayer;
  } else {
    return null;
  }
};

const generateHand = (numDice) => {
  let hand = [];

  for (let i = 0; i < numDice; i++) {
    hand.push(Math.ceil(Math.random() * 4));
  }

  return hand;
};

const updateCurrentBet = (numDice, dieValue) => {
  state["currentBet"]["numDice"] = parseInt(numDice);
  state["currentBet"]["dieValue"] = parseInt(dieValue);
};

// Call FAILS if there are less dice than current bet says there are
const isCallValid = () => {
  let player1 = state["players"][0];
  let player2 = state["players"][1];
  let allDice = player1["hand"].concat(player2["hand"]);
  let sum = 0;

  for (const die of allDice) {
    if (die === state["currentBet"]["dieValue"]) {
      sum++;
    }
  }

  if (sum > state["currentBet"]["numDice"]) {
    return false;
  } else {
    return true;
  }
};

const removeDie = (playerNum) => {
  player["numDice"]--;
  player["hand"] = generateHand(player.key);
};

//on = listener
//emit = sender
io.on("connection", (socket) => {
  socket.on("join", () => {
    addPlayer(socket);
    socket.emit("validBets", generateValidBetOptions());

    if (getNumPlayers() === 2) {
      startGame();
    }
  });

  socket.on("bet", (bet) => {
    if (state["activePlayer"] === state["id"][socket.id]) {
      if (bet === "call" && state["currentBet"] === null) {
        return;
      } else if (bet === "call") {
        let callResult = isCallValid();

        if (callResult) {
          removeDie((state["activePlayer"] + 1) % 2);
        } else {
          removeDie(state["activePlayer"]);
        }

        socket.emit("callResult", callResult);
        emitState();

        return;
      }

      let [numDice, dieValue] = bet.split("-");
      updateCurrentBet(numDice, dieValue);
      socket.emit("validBets", generateValidBetOptions());
      state["activePlayer"] = (state["activePlayer"] + 1) % 2;
    }
  });
});
