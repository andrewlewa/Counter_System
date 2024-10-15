const express = require("express");
const say = require("say");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());

let currentQueue = 1;
let lastQueueLoket = { loket1: "-", loket2: "-", loket3: "-" };

// Function to call the queue number and announce it via Text-to-Speech in English
const callQueue = (counter, recall = false) => {
  let queueNumber = lastQueueLoket[`loket${counter}`];

  if (!recall) {
    queueNumber = currentQueue;
    lastQueueLoket[`loket${counter}`] = currentQueue;
    currentQueue++;
  }

  const message = `Queue number ${queueNumber}, please proceed to counter ${counter}`;
  console.log(message);

  // Use say to announce the queue in English
  say.speak(message, "Microsoft Zira Desktop", 1.0, (err) => {
    if (err) {
      console.error("Error during speech:", err);
    }
  });

  // Emit the update to all clients via Socket.IO
  io.emit("queueUpdate", lastQueueLoket);

  return queueNumber;
};

// Serve HTML for the user interface
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Queue Caller</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          background-color: #f4f4f4;
          padding: 20px;
        }
        h1 {
          color: #333;
        }
        .queue-display {
          display: flex;
          justify-content: center;
          margin: 20px 0;
        }
        .counter {
          background-color: #fff;
          border: 2px solid #333;
          padding: 20px;
          margin: 0 10px;
          width: 150px;
          box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
        }
        .counter h2 {
          margin: 0;
          font-size: 18px;
        }
        .counter .number {
          font-size: 36px;
          font-weight: bold;
          color: #ff5733;
        }
        button {
          margin: 10px;
          padding: 10px 20px;
          font-size: 16px;
          background-color: #007bff;
          color: white;
          border: none;
          cursor: pointer;
        }
        button:hover {
          background-color: #0056b3;
        }
        .status {
          margin-top: 20px;
          font-size: 18px;
          color: #333;
        }
      </style>
    </head>
    <body>
      <h1>Queue Caller</h1>

      <div class="queue-display">
        <div class="counter">
          <h2>Counter 1</h2>
          <div class="number" id="loket1">-</div>
          <button onclick="callCounter(1)">Call to Counter 1</button>
          <button onclick="recallCounter(1)">Recall Number</button>
        </div>
        <div class="counter">
          <h2>Counter 2</h2>
          <div class="number" id="loket2">-</div>
          <button onclick="callCounter(2)">Call to Counter 2</button>
          <button onclick="recallCounter(2)">Recall Number</button>
        </div>
        <div class="counter">
          <h2>Counter 3</h2>
          <div class="number" id="loket3">-</div>
          <button onclick="callCounter(3)">Call to Counter 3</button>
          <button onclick="recallCounter(3)">Recall Number</button>
        </div>
      </div>

      <div class="status" id="status">Waiting for queue...</div>

      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io();

        // Receive the initial queue status when the user connects
        socket.on('initialQueueStatus', (data) => {
          // Update the display with the current queue status
          updateDisplay(data);
        });

        // Update the display when a new queue number is called
        socket.on('queueUpdate', (data) => {
          updateDisplay(data); // Fetch latest data from Socket.IO
        });

        // Function to update the display with provided data
        function updateDisplay(data) {
          document.getElementById('loket1').innerText = data.loket1;
          document.getElementById('loket2').innerText = data.loket2;
          document.getElementById('loket3').innerText = data.loket3;
        }

        function callCounter(counter) {
          fetch(\`/api/call/loket/\${counter}\`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
              document.getElementById('status').innerText = data.message;
            })
            .catch(err => console.error('Error:', err));
        }

        function recallCounter(counter) {
          fetch(\`/api/recall/loket/\${counter}\`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
              document.getElementById('status').innerText = data.message;
            })
            .catch(err => console.error('Error:', err));
        }
      </script>
    </body>
    </html>
  `);
});

// REST API Endpoints

// Get the current queue status for all counters
app.get("/api/queue-status", (req, res) => {
  res.json(lastQueueLoket);
});

// Call a specific counter (via POST request)
app.post("/api/call/loket/:counter", (req, res) => {
  const counter = req.params.counter;
  if (counter >= 1 && counter <= 3) {
    const queueNumber = callQueue(counter);
    res.json({
      success: true,
      message: `Calling queue number ${queueNumber} to counter ${counter}`,
      queueNumber: queueNumber,
      counter: counter,
    });
  } else {
    res.status(400).json({ success: false, message: "Invalid counter number" });
  }
});

// Recall the last called number at a specific counter (via POST request)
app.post("/api/recall/loket/:counter", (req, res) => {
  const counter = req.params.counter;
  if (
    counter >= 1 &&
    counter <= 3 &&
    lastQueueLoket[`loket${counter}`] !== "-"
  ) {
    const queueNumber = callQueue(counter, true); // true = recall
    res.json({
      success: true,
      message: `Recalling queue number ${queueNumber} to counter ${counter}`,
      queueNumber: queueNumber,
      counter: counter,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "No number to recall or invalid counter",
    });
  }
});

// Reset the queue (via POST request)
app.post("/api/reset", (req, res) => {
  currentQueue = 1;
  lastQueueLoket = { loket1: "-", loket2: "-", loket3: "-" };
  io.emit("queueUpdate", lastQueueLoket); // Notify all clients of the reset
  res.json({ success: true, message: "Queue has been reset" });
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("New client connected");

  // Send the current queue status to the newly connected client
  socket.emit("initialQueueStatus", lastQueueLoket);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start the server on port 3000
server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
