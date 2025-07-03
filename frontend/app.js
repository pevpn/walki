
let token = "";

function login() {
  fetch("/api/login.php", {
    method: "POST",
    body: JSON.stringify({
      username: document.getElementById("username").value,
      password: document.getElementById("password").value
    })
  }).then(r => r.json()).then(res => {
    token = res.token;
    alert("ورود موفق");
  });
}

function sendLocation() {
  navigator.geolocation.getCurrentPosition(pos => {
    fetch("/api/gps.php", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      })
    }).then(r => r.json()).then(console.log);
  });
}

function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  const formData = new FormData();
  formData.append("file", file);
  formData.append("room", "room1");

  fetch("/api/upload.php", {
    method: "POST",
    headers: { "Authorization": "Bearer " + token },
    body: formData
  }).then(r => r.json()).then(console.log);
}

function connectWS() {
  const ws = new WebSocket("ws://localhost:8080");
  ws.onopen = () => {
    console.log("Connected to WS server");
    ws.send("User joined");
  };
  ws.onmessage = (msg) => console.log("MSG:", msg.data);
}
