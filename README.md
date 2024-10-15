# Queue Management System With API

## Overview

This is a Queue Management System built using Express, Socket.IO, and Text-to-Speech (TTS) functionality. The system allows for queue management across multiple counters, announcing queue numbers, recalling numbers, and resetting queues. The real-time display is achieved using Socket.IO to update all connected clients without needing page refreshes.

---

## Base URL

```
http://localhost:3000
```

---

## API Endpoints

### 1. Get Current Queue Status

#### **Endpoint**: `/api/queue-status`

- **Method**: `GET`
- **Description**: Returns the current status of all counters (i.e., the last queue number called at each counter).

#### **Response Example**:

```json
{
  "loket1": 5,
  "loket2": 3,
  "loket3": 7
}
```

- `loket1`, `loket2`, `loket3`: The last queue numbers called to Counter 1, 2, and 3 respectively. If no queue has been called yet, the value will be `"-"`.

---

### 2. Call a New Queue to a Counter

#### **Endpoint**: `/api/call/loket/:counter`

- **Method**: `POST`
- **Description**: Calls a new queue number to the specified counter (1, 2, or 3). The queue number will be incremented and announced at the specified counter.

#### **Parameters**:

- `counter` (Path Parameter): The counter number where the queue is to be called (1, 2, or 3).

#### **Request Example**:

```
POST /api/call/loket/1
```

#### **Response Example**:

```json
{
  "success": true,
  "message": "Calling queue number 5 to counter 1",
  "queueNumber": 5,
  "counter": 1
}
```

#### **Error Response**:

- Invalid counter number:
  ```json
  {
    "success": false,
    "message": "Invalid counter number"
  }
  ```

---

### 3. Recall the Last Queue at a Counter

#### **Endpoint**: `/api/recall/loket/:counter`

- **Method**: `POST`
- **Description**: Recalls the last queue number called at the specified counter (1, 2, or 3). This does not increment the queue; it simply re-announces the last queue number.

#### **Parameters**:

- `counter` (Path Parameter): The counter number where the last queue is to be recalled (1, 2, or 3).

#### **Request Example**:

```
POST /api/recall/loket/2
```

#### **Response Example**:

```json
{
  "success": true,
  "message": "Recalling queue number 3 to counter 2",
  "queueNumber": 3,
  "counter": 2
}
```

#### **Error Response**:

- No queue number to recall or invalid counter:
  ```json
  {
    "success": false,
    "message": "No number to recall or invalid counter"
  }
  ```

---

### 4. Reset the Queue

#### **Endpoint**: `/api/reset`

- **Method**: `POST`
- **Description**: Resets the queue numbers for all counters to their initial state. The next queue number will start from 1 again.

#### **Request Example**:

```
POST /api/reset
```

#### **Response Example**:

```json
{
  "success": true,
  "message": "Queue has been reset"
}
```

---

## Real-time Updates Using Socket.IO

This system uses Socket.IO for real-time updates, so all connected devices automatically receive updates about the queue status without needing to refresh the page.

### Socket.IO Events

#### 1. `initialQueueStatus`

- **Triggered**: When a client connects to the server.
- **Description**: Sends the current queue status to the connected client.

#### **Data Example**:

```json
{
  "loket1": 5,
  "loket2": 3,
  "loket3": 7
}
```

#### 2. `queueUpdate`

- **Triggered**: When a new queue number is called or the queue is reset.
- **Description**: Broadcasts the updated queue status to all connected clients.

#### **Data Example**:

```json
{
  "loket1": 6,
  "loket2": 3,
  "loket3": 7
}
```

---

## Front-end Integration (Client-side)

The front-end interface is automatically updated using Socket.IO. The client listens for the `initialQueueStatus` and `queueUpdate` events to update the display in real time.

### Example Socket.IO Event Handling (Client-side):

```javascript
const socket = io();

// Receive the initial queue status when the user connects
socket.on("initialQueueStatus", (data) => {
  updateDisplay(data);
});

// Update the display when a new queue number is called
socket.on("queueUpdate", (data) => {
  updateDisplay(data);
});

function updateDisplay(data) {
  document.getElementById("loket1").innerText = data.loket1;
  document.getElementById("loket2").innerText = data.loket2;
  document.getElementById("loket3").innerText = data.loket3;
}
```

---

## Running the Application

1. Install dependencies:

```bash
npm install
```

2. Start the server:

```bash
node app.js
```

3. Access the application by navigating to:

```
http://localhost:3000
```

All connected devices will automatically receive updates to the queue status in real time. Use the API endpoints to manage the queue from the server-side.

---

## Conclusion

This Queue Management System provides a complete solution for managing queues across multiple counters with real-time updates to all connected clients. The API is flexible and easy to integrate with other systems.

---

## Credits

© BandrewDev
