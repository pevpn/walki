class WalkieTalkieApp {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.currentChannel = 'main';
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.initElements();
        this.initEventListeners();
    }

    initElements() {
        this.elements = {
            loginSection: document.getElementById('login-section'),
            appSection: document.getElementById('app-section'),
            usernameInput: document.getElementById('username'),
            roleSelect: document.getElementById('role'),
            loginBtn: document.getElementById('login-btn'),
            currentUserSpan: document.getElementById('current-user'),
            currentChannelSpan: document.getElementById('current-channel'),
            talkBtn: document.getElementById('talk-btn'),
            userCountSpan: document.getElementById('user-count'),
            usersList: document.getElementById('users-list'),
            audioContainer: document.getElementById('audio-container')
        };
    }

    initEventListeners() {
        this.elements.loginBtn.addEventListener('click', () => this.login());

        this.elements.talkBtn.addEventListener('mousedown', () => this.startRecording());
        this.elements.talkBtn.addEventListener('mouseup', () => this.stopRecording());
        this.elements.talkBtn.addEventListener('touchstart', () => this.startRecording());
        this.elements.talkBtn.addEventListener('touchend', () => this.stopRecording());

        document.querySelectorAll('.channels button').forEach(btn => {
            btn.addEventListener('click', () => this.changeChannel(btn.dataset.channel));
        });
    }

    login() {
        const username = this.elements.usernameInput.value.trim();
        const role = this.elements.roleSelect.value;

        if (!username) {
            alert('لطفا نام کاربری را وارد کنید');
            return;
        }

        this.currentUser = { name: username, role };
        this.connectToServer();

        this.elements.loginSection.style.display = 'none';
        this.elements.appSection.style.display = 'block';
        this.elements.currentUserSpan.textContent = username;
    }

    connectToServer() {
        this.socket = new WebSocket('ws://localhost:8080');

        this.socket.onopen = () => {
            console.log('Connected to server');
            this.socket.send(JSON.stringify({
                type: 'register',
                name: this.currentUser.name,
                role: this.currentUser.role,
                channel: this.currentChannel
            }));
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'user_list':
                    this.updateUserList(data.users);
                    break;

                case 'audio':
                    this.playAudio(data);
                    break;
            }
        };

        this.socket.onclose = () => {
            console.log('Disconnected from server');
        };
    }

    updateUserList(users) {
        this.elements.userCountSpan.textContent = users.length;
        this.elements.usersList.innerHTML = '';

        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = `${user.name} (${user.role}) - کانال: ${user.channel}`;
            this.elements.usersList.appendChild(li);
        });
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();
            this.elements.talkBtn.classList.add('recording');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('خطا در دسترسی به میکروفون');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();

                reader.onload = () => {
                    if (this.socket) {
                        this.socket.send(JSON.stringify({
                            type: 'audio',
                            audioData: Array.from(new Uint8Array(reader.result)),
                            channel: this.currentChannel
                        }));
                    }
                };

                reader.readAsArrayBuffer(audioBlob);
                this.elements.talkBtn.classList.remove('recording');

                // قطع کردن استریم
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            };
        }
    }

    playAudio(data) {
        const audioBlob = new Blob([new Uint8Array(data.audioData)], { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = new Audio(audioUrl);

        const messageDiv = document.createElement('div');
        messageDiv.className = 'audio-message';
        messageDiv.innerHTML = `
            <p><strong>${data.sender}</strong> (${new Date(data.timestamp).toLocaleTimeString()})</p>
            <audio controls src="${audioUrl}"></audio>
        `;

        this.elements.audioContainer.appendChild(messageDiv);
        audioElement.play();
    }

    changeChannel(channel) {
        this.currentChannel = channel;
        this.elements.currentChannelSpan.textContent = channel;

        if (this.socket) {
            this.socket.send(JSON.stringify({
                type: 'change_channel',
                channel: channel
            }));
        }
    }
}

// راه اندازی اپلیکیشن
document.addEventListener('DOMContentLoaded', () => {
    new WalkieTalkieApp();
});