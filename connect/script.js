// --- INIT FIREBASE ---
if (typeof firebaseConfig === 'undefined') console.error("Error: initialfirebase.js not loaded.");
else if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

// --- CONFIG ---
const servers = { iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }] };
let pc = null;
let localStream = null;
let currentCallId = null;
let amICaller = false;
let roomIdFromUrl = null;
let localUserName = "Guest";

// State
let videoEnabled = false; 
let audioEnabled = false;
let isChatOpen = false;

// --- ELEMENTS ---
const lobby = document.getElementById('lobby-container');
const room = document.getElementById('room-container');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const mainJoinBtn = document.getElementById('mainJoinBtn');
const joinInput = document.getElementById('joinInput');
const usernameInput = document.getElementById('usernameInput');
const manualEntry = document.getElementById('manual-entry');

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const localNameTag = document.getElementById('localNameTag');
const remoteNameTag = document.getElementById('remoteNameTag');
const localAvatar = document.getElementById('localAvatar');
const remoteAvatar = document.getElementById('remoteAvatar');
const remoteStatus = document.getElementById('remoteStatus');
const localWrapper = document.getElementById('localWrapper');
const remoteWrapper = document.getElementById('remoteWrapper');

const localMicIcon = document.getElementById('localMicIcon');
const localCamIcon = document.getElementById('localCamIcon');
const remoteMicIcon = document.getElementById('remoteMicIcon');
const remoteCamIcon = document.getElementById('remoteCamIcon');

// Controls
const toggleCam = document.getElementById('toggleCam');
const toggleMic = document.getElementById('toggleMic');
const shareBtn = document.getElementById('shareBtn');
const hangupBtn = document.getElementById('hangupBtn');

// Chat Elements
const toggleChat = document.getElementById('toggleChat');
const chatPanel = document.getElementById('chat-panel');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatMessages = document.getElementById('chat-messages');
const msgInput = document.getElementById('msgInput');
const sendMsgBtn = document.getElementById('sendMsgBtn');
const chatNotification = document.getElementById('chatNotification');
const videoGrid = document.querySelector('.video-grid');

// Modals
const modal = document.getElementById('modalOverlay');
const modalCode = document.getElementById('modalCode');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

const alertOverlay = document.getElementById('alertOverlay');
const alertMessage = document.getElementById('alertMessage');
const alertCloseBtn = document.getElementById('alertCloseBtn');

// --- HELPER: INITIALIZE PEER CONNECTION ---
function initPC() {
  pc = new RTCPeerConnection(servers);
  
  pc.ontrack = event => {
    const stream = event.streams[0];
    remoteVideo.srcObject = stream;
    remoteStatus.style.display = 'none';
  };

  pc.oniceconnectionstatechange = () => {
    if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
      remoteVideo.srcObject = null;
      remoteStatus.style.display = 'block';
      remoteWrapper.classList.add('cam-off');
    }
  };
}

// --- ALERT SYSTEM ---
let alertCallback = null;
function showAlert(msg, callback = null) {
  alertMessage.innerText = msg;
  alertCallback = callback;
  alertOverlay.style.display = 'flex';
  setTimeout(() => alertOverlay.classList.add('show'), 10);
}
alertCloseBtn.onclick = () => {
  alertOverlay.classList.remove('show');
  setTimeout(() => {
    alertOverlay.style.display = 'none';
    if (alertCallback) { alertCallback(); alertCallback = null; }
  }, 200);
};

// --- URL CHECK ---
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('id')) {
  roomIdFromUrl = urlParams.get('id');
  manualEntry.style.display = 'none';
  mainJoinBtn.style.display = 'block';
  mainJoinBtn.innerText = `Join Call`;
}

// --- MEDIA LOGIC ---
async function startLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    
    // Push tracks to the PC
    localStream.getTracks().forEach(track => {
      if(pc) pc.addTrack(track, localStream);
    });

    localVideo.srcObject = localStream;
    videoEnabled = true;
    audioEnabled = true;
    updateLocalUI(true, true);
    return true;
  } catch (err) {
    console.warn("Media access failed:", err);
    videoEnabled = false;
    audioEnabled = false;
    updateLocalUI(false, false);
    return false;
  }
}

function updateLocalUI(camOn, micOn) {
  toggleCam.classList.toggle('active', camOn);
  toggleCam.classList.toggle('inactive', !camOn);
  toggleCam.querySelector('i').innerText = camOn ? 'videocam' : 'videocam_off';
  localCamIcon.innerText = camOn ? 'videocam' : 'videocam_off';
  localCamIcon.classList.toggle('off', !camOn);
  if (camOn) localWrapper.classList.remove('cam-off');
  else localWrapper.classList.add('cam-off');

  toggleMic.classList.toggle('active', micOn);
  toggleMic.classList.toggle('inactive', !micOn);
  toggleMic.querySelector('i').innerText = micOn ? 'mic' : 'mic_off';
  localMicIcon.innerText = micOn ? 'mic' : 'mic_off';
  localMicIcon.classList.toggle('off', !micOn);
}

function updateRemoteStatus(camOn, micOn) {
  if (camOn !== undefined) {
    remoteCamIcon.innerText = camOn ? 'videocam' : 'videocam_off';
    remoteCamIcon.classList.toggle('off', !camOn);
    if (camOn) remoteWrapper.classList.remove('cam-off');
    else remoteWrapper.classList.add('cam-off');
  }
  if (micOn !== undefined) {
    remoteMicIcon.innerText = micOn ? 'mic' : 'mic_off';
    remoteMicIcon.classList.toggle('off', !micOn);
  }
}

// --- ID GENERATOR ---
function generateRoomId() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${year}${month}${day}-${random}`;
}

// --- CREATE ---
createBtn.onclick = async () => {
  const rawName = usernameInput.value.trim();
  if (!rawName) return showAlert("Please enter a valid name.");
  
  localUserName = rawName;
  setupLocalProfile(localUserName);
  amICaller = true; 
  
  initPC();
  enterRoom();
  await startLocalStream();

  currentCallId = generateRoomId();
  document.title = "Connected to " + currentCallId;
  
  const callDoc = firestore.collection('calls').doc(currentCallId);
  const offerCandidates = callDoc.collection('offerCandidates');
  const answerCandidates = callDoc.collection('answerCandidates');

  showModal(currentCallId);
  setupChat(currentCallId);

  pc.onicecandidate = event => event.candidate && offerCandidates.add(event.candidate.toJSON());

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  await callDoc.set({ 
    offer: { sdp: offerDescription.sdp, type: offerDescription.type },
    callerName: localUserName, callerCam: videoEnabled, callerMic: audioEnabled, calleeCam: false, calleeMic: false
  });

  setupSnapshotListeners(callDoc, 'callee');
  answerCandidates.onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
    });
  });
};

// --- JOIN ---
joinBtn.onclick = () => { 
  const id = joinInput.value.trim();
  if (id) joinCallLogic(id); 
  else showAlert("Please enter a Room ID"); 
};
mainJoinBtn.onclick = () => { if (roomIdFromUrl) joinCallLogic(roomIdFromUrl); };

async function joinCallLogic(callId) {
  const rawName = usernameInput.value.trim();
  if (!rawName) return showAlert("Please enter a valid name.");

  localUserName = rawName;
  setupLocalProfile(localUserName);
  amICaller = false; 
  currentCallId = callId;
  
  try {
    const callDoc = firestore.collection('calls').doc(callId);
    const callSnapshot = await callDoc.get();

    if (!callSnapshot.exists) {
      return showAlert("Room does not exist.", () => { location.href = "/"; });
    }

    const callData = callSnapshot.data();
    if (!callData || !callData.offer) {
      return showAlert("Invalid room data. Please create a new room.", () => { location.href = "/"; });
    }

    document.title = "Connected to " + currentCallId;
    
    initPC();
    enterRoom();
    await startLocalStream();
    setupChat(currentCallId);

    const answerCandidates = callDoc.collection('answerCandidates');
    const offerCandidates = callDoc.collection('offerCandidates');

    pc.onicecandidate = event => event.candidate && answerCandidates.add(event.candidate.toJSON());

    if (callData.callerName) updateRemoteProfile(callData.callerName);
    updateRemoteStatus(callData.callerCam, callData.callerMic);

    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    await callDoc.update({ 
      answer: { type: answerDescription.type, sdp: answerDescription.sdp },
      calleeName: localUserName, calleeCam: videoEnabled, calleeMic: audioEnabled 
    });

    setupSnapshotListeners(callDoc, 'caller');
    offerCandidates.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      });
    });

  } catch (err) {
    console.error(err);
    showAlert("Connection failed: " + err.message, () => location.reload());
  }
}

// --- UTILS ---
function enterRoom() {
  lobby.style.display = 'none';
  room.style.display = 'block';
  setTimeout(() => room.classList.add('visible'), 50);
}

function setupSnapshotListeners(callDoc, remoteRolePrefix) {
  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
    const remoteName = data?.[remoteRolePrefix + 'Name'];
    if (remoteName) updateRemoteProfile(remoteName);
    if (data) updateRemoteStatus(data[remoteRolePrefix + 'Cam'], data[remoteRolePrefix + 'Mic']);
  });
}

function setupLocalProfile(name) { localNameTag.innerText = name; localAvatar.innerText = name.charAt(0).toUpperCase(); }
function updateRemoteProfile(name) { remoteNameTag.innerText = name; remoteAvatar.innerText = name.charAt(0).toUpperCase(); }

// --- CONTROLS ---
toggleCam.onclick = async () => {
  if (!localStream) { if(await startLocalStream()) syncDbState(); return; }
  videoEnabled = !videoEnabled;
  localStream.getVideoTracks()[0].enabled = videoEnabled;
  updateLocalUI(videoEnabled, audioEnabled);
  syncDbState();
};

toggleMic.onclick = async () => {
  if (!localStream) { if(await startLocalStream()) syncDbState(); return; }
  audioEnabled = !audioEnabled;
  localStream.getAudioTracks()[0].enabled = audioEnabled;
  updateLocalUI(videoEnabled, audioEnabled);
  syncDbState();
};

async function syncDbState() {
  if (currentCallId && pc) {
    const callDoc = firestore.collection('calls').doc(currentCallId);
    if (amICaller) await callDoc.update({ callerCam: videoEnabled, callerMic: audioEnabled });
    else await callDoc.update({ calleeCam: videoEnabled, calleeMic: audioEnabled });
  }
}

hangupBtn.onclick = () => location.href = window.location.origin + window.location.pathname;

// --- CHAT LOGIC ---
function setupChat(callId) {
  const messagesRef = firestore.collection('calls').doc(callId).collection('messages');
  messagesRef.orderBy('createdAt').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        renderMessage(change.doc.data());
        if (!isChatOpen) chatNotification.style.display = 'block';
      }
    });
  });
}

function renderMessage(msg) {
  const emptyState = document.getElementById('chatEmptyState');
  if (emptyState) emptyState.remove();

  const div = document.createElement('div');
  const isMine = msg.sender === localUserName;
  div.classList.add('message-bubble', isMine ? 'mine' : 'theirs');
  if(!isMine) {
    const nameSpan = document.createElement('span');
    nameSpan.classList.add('msg-sender');
    nameSpan.innerText = msg.sender;
    div.appendChild(nameSpan);
  }
  const textSpan = document.createElement('span');
  textSpan.innerText = msg.text;
  div.appendChild(textSpan);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
  const text = msgInput.value.trim();
  if(!text || !currentCallId) return;
  const messagesRef = firestore.collection('calls').doc(currentCallId).collection('messages');
  messagesRef.add({ text: text, sender: localUserName, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  msgInput.value = '';
}

toggleChat.onclick = () => {
  isChatOpen = !isChatOpen;
  if(isChatOpen) {
    chatPanel.classList.add('open');
    videoGrid.classList.add('chat-open');
    toggleChat.classList.add('active');
    toggleChat.classList.remove('inactive');
    chatNotification.style.display = 'none';
  } else {
    chatPanel.classList.remove('open');
    videoGrid.classList.remove('chat-open');
    toggleChat.classList.remove('active');
    toggleChat.classList.add('inactive');
  }
};

closeChatBtn.onclick = () => {
  isChatOpen = false;
  chatPanel.classList.remove('open');
  videoGrid.classList.remove('chat-open');
  toggleChat.classList.remove('active');
  toggleChat.classList.add('inactive');
};

sendMsgBtn.onclick = sendMessage;
msgInput.onkeypress = (e) => { if(e.key === 'Enter') sendMessage(); };

// --- MODAL ---
function showModal(id) { modalCode.innerText = id; modal.style.display = 'flex'; setTimeout(()=> modal.classList.add('show'), 10); }
shareBtn.onclick = () => { if (currentCallId) showModal(currentCallId); };
closeModalBtn.onclick = () => { modal.classList.remove('show'); setTimeout(()=> modal.style.display = 'none', 300); };
copyCodeBtn.onclick = () => { navigator.clipboard.writeText(currentCallId); copyCodeBtn.innerText = "Copied!"; setTimeout(() => copyCodeBtn.innerText = "Copy Code", 2000); };
copyLinkBtn.onclick = () => { const link = `${window.location.origin}${window.location.pathname}?id=${currentCallId}`; navigator.clipboard.writeText(link); copyLinkBtn.innerText = "Copied!"; setTimeout(() => copyLinkBtn.innerText = "Copy Link", 2000); };