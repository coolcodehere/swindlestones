const io = require("./node_modules/socket.io")
const server = io.listen(8008)

const startingDice = 5
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

let state = {
  currentBet: {
    numDice: 1,
    dieValue: 0,
  },
  activePlayer: 0,
  id: {},
  players: {},
}

const generateValidBetOptions = (isFirstRound) => {
  let currentBet = state["currentBet"]
  let numEnemyDice = startingDice
  let numDice = startingDice
  let validBetOptions = []

  if (!isFirstRound) {
    numEnemyDice = state["players"][1]["numDice"]
    numDice = state["players"][0]["numDice"]
    validBetOptions.push("Call")
  }

  let totalDice = numDice + numEnemyDice

  //Only valid dice are above current num and current die

  for (let i = currentBet.numDice; i <= totalDice; i++) {
    let j = i === currentBet.numDice ? currentBet.dieValue + 1 : 1
    for (j; j <= 4; j++) {
      validBetOptions.push(i + "-" + j)
    }
  }

  return validBetOptions
}

const getPlayerSocketByNumber = (playerNumber) => {
  return server.sockets.connected[state.players[playerNumber].id]
}

const emitState = () => {
  let player1socket = getPlayerSocketByNumber(0)
  let player2socket = getPlayerSocketByNumber(1)

  player1socket.emit("update", state["players"][0])
  player1socket.emit("updateEnemyDice", state["players"][1]["numDice"])

  player2socket.emit("update", state["players"][1])
  player2socket.emit("updateEnemyDice", state["players"][0]["numDice"])
}

const generateHand = (numDice) => {
  let hand = []
  console.log(state.players)
  for (let i = 0; i < numDice; i++) {
    hand.push(Math.ceil(Math.random() * 4))
  }

  return hand
}

const getNumPlayers = () => {
  return Object.keys(state["players"]).length
}

const startGame = () => {
  console.log("Game Starting...")

  let players = state.players
  players[0]["hand"] = generateHand(players[0]["numDice"])
  players[1]["hand"] = generateHand(players[1]["numDice"])
  emitState()
}

const addPlayer = (socket) => {
  if (getNumPlayers() < 2) {
    let newPlayer = {
      id: socket.id,
      hand: null,
      numDice: startingDice,
    }

    state.id[socket.id] = getNumPlayers()
    state.players[getNumPlayers()] = newPlayer
  } else {
    return null
  }
}

const removePlayer = (socket) => {
  delete state.players[socket.id]
}

const updateCurrentBet = (numDice, dieValue) => {
  state["currentBet"]["numDice"] = parseInt(numDice)
  state["currentBet"]["dieValue"] = parseInt(dieValue)
}

const isCallValid = () => {
  let player1 = state["players"][0]
  let player2 = state["players"][1]
  let allDice = player1["hand"].concat(player2["hand"])
  let sum = 0

  for (const die of allDice) {
    if (die === state["currentBet"]["dieValue"]) {
      sum++
    }
  }
  console.log(sum, state["currentBet"])
  if (sum > state["currentBet"]["numDice"]) {
    return false
  } else {
    return true
  }
}

const removeDie = (playerNum) => {
  let player = state.players[playerNum]
  player.numDice--
  player.hand = generateHand(player.key)
}

// event fired every time a new client connects:
server.on("connection", (socket) => {
  console.info(`Client connected [id=${socket.id}]`)
  addPlayer(socket)
  socket.emit("validBets", generateValidBetOptions(true))
  console.log(getNumPlayers())

  if (getNumPlayers() === 2) {
    startGame()
    getPlayerSocketByNumber(state.activePlayer).emit("turnNotification")
  }

  // when socket disconnects, remove it from the list:
  socket.on("disconnect", () => {
    console.info(`Client disconnected [id=${socket.id}]`)
    removePlayer(socket)
  })

  socket.on("bet", (bet) => {
    if (state.activePlayer === state["id"][socket.id]) {
      if (bet === "Call") {
        let callResult = isCallValid()
        console.log(callResult)
        if (callResult) {
          removeDie((state.activePlayer + 1) % 2)
        } else {
          removeDie(state.activePlayer)
        }
        socket.emit("callResult", callResult)
        state.currentBet = {
          numDice: 1,
          dieValue: 0,
        }
        emitState()
        return
      }
      let [numDice, dieValue] = bet.split("-")

      updateCurrentBet(numDice, dieValue)
      state.activePlayer = (state.activePlayer + 1) % 2
      getPlayerSocketByNumber(0).emit("validBets", generateValidBetOptions(false))
      getPlayerSocketByNumber(1).emit("validBets", generateValidBetOptions(false))
      getPlayerSocketByNumber(state.activePlayer).emit("turnNotification")
    }
  })
})
