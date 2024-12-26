<template>
  <div>
    <h1>WebRTC Application</h1>
    <p>Enter a channel name and your user ID to start using this app.</p>
    <input v-model="state.userId" placeholder="User ID" />
    <input v-model="state.channelName" placeholder="Channel Name" />
    <button @click="start" :disabled="state.startButtonDisabled">Start</button>
    <button @click="join" :disabled="state.joinButtonDisabled">Join</button>
    <button @click="callOnClick" :disabled="state.callButtonDisabled">
      Call
    </button>
    <button @click="hangupOnClick" :disabled="state.hangupButtonDisabled">
      Hangup
    </button>
    <textarea v-model="state.sendMessage"></textarea>
    <button @click="sendOnClick" :disabled="state.sendButtonDisabled">
      Send
    </button>
    <div>
      <p>Received Message:</p>
      <p>{{ state.receiveMessage }}</p>
    </div>
    <video id="peerPlayer" autoPlay style="width: 640px; height: 480px" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";

const URL_WEB_SOCKET = "wss://112.187.200.140:8090";

let localStream;
let localPeerConnection;
let sendChannel;
let receiveChannel;

const servers = {
  iceServers: [
    { url: "stun:stun.l.google.com:19302" },
    { url: "stun:stun1.l.google.com:19302" },
    { url: "stun:stun2.l.google.com:19302" },
  ],
};
const pcConstraints = {
  optional: [{ DtlsSrtpKeyAgreement: true }],
};

const ws = ref(null);

const state = reactive({
  startButtonDisabled: true,
  joinButtonDisabled: true,
  callButtonDisabled: true,
  hangupButtonDisabled: true,
  sendButtonDisabled: true,
  sendMessage: "",
  receiveMessage: "",
  channelName: "",
  userId: Math.floor(Math.random() * 1000000),
});

const start = async () => {
  state.startButtonDisabled = true;
  state.joinButtonDisabled = false;

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });

  localStream = stream;
};

const join = () => {
  if (!state.channelName || !state.userId) {
    alert("Channel Name or User ID is empty");
    return;
  }

  state.joinButtonDisabled = true;
  state.callButtonDisabled = false;

  sendWsMessage("join", {
    channelName: state.channelName,
    userId: state.userId,
  });
};

const callOnClick = () => {
  state.callButtonDisabled = true;
  state.hangupButtonDisabled = false;

  localPeerConnection = new RTCPeerConnection(servers, pcConstraints);

  localPeerConnection.onicecandidate = gotLocalIceCandidateOffer;
  localPeerConnection.onaddstream = gotRemoteStream;

  createDataChannel();

  localPeerConnection.addStream(localStream);
  localPeerConnection.createOffer().then(gotLocalDescription);
};

// sender에서 발생
const gotLocalIceCandidateOffer = (event) => {
  console.log(
    "gotLocalIceCandidateOffer invoked",
    event.candidate,
    localPeerConnection.localDescription
  );
  if (!event.candidate) {
    sendWsMessage("send_offer", {
      channelName: state.channelName,
      userId: state.userId,
      sdp: localPeerConnection.localDescription,
    });
  }
};

const gotLocalDescription = (offer) => {
  localPeerConnection.setLocalDescription(offer);
};

// receive에서 발생
// 1번
const onAnswer = (offer) => {
  console.log("onAnswer invoked");
  state.callButtonDisabled = true;
  state.hangupButtonDisabled = false;

  if (localStream.getVideoTracks().length > 0) {
    console.log(`Using video device: ${localStream.getVideoTracks()[0].label}`);
  }
  if (localStream.getAudioTracks().length > 0) {
    console.log(`Using audio device: ${localStream.getAudioTracks()[0].label}`);
  }

  console.log("new RTCPeerConnection for local");
  localPeerConnection = new RTCPeerConnection(servers, pcConstraints);
  console.log("setup gotLocalIceCandidateAnswer");
  localPeerConnection.onicecandidate = gotLocalIceCandidateAnswer;

  console.log("setup gotRemoteStream");
  localPeerConnection.onaddstream = gotRemoteStream;

  createDataChannel();

  console.log("localPeerConnection.addStream invoked");
  localPeerConnection.addStream(localStream);

  // Set the received offer as the remote description
  localPeerConnection.setRemoteDescription(offer);

  // Create an answer and send it back
  localPeerConnection.createAnswer().then(gotAnswerDescription);
};

// 2번번
const gotAnswerDescription = (answer) => {
  localPeerConnection.setLocalDescription(answer);
};

// 3번
const gotLocalIceCandidateAnswer = (event) => {
  if (!event.candidate) {
    sendWsMessage("send_answer", {
      channelName: state.channelName,
      userId: state.userId,
      sdp: localPeerConnection.localDescription,
    });
  }
};

// 공용
const gotRemoteStream = (event) => {
  const remotePlayer = document.getElementById("peerPlayer");
  remotePlayer.srcObject = event.stream;
};

// answer_sdp_received 응답 왔을때
const gotRemoteDescription = (answer) => {
  localPeerConnection.setRemoteDescription(answer);
};

//버튼 이벤트트
const hangupOnClick = () => {
  closeDataChannel();
  localPeerConnection.close();
  localPeerConnection = null;
  state.hangupButtonDisabled = true;
  state.callButtonDisabled = false;
};

const sendOnClick = () => {
  sendChannel.send(state.sendMessage);
  state.sendMessage = "";
};

const sendWsMessage = (type, body) => {
  ws.value.send(JSON.stringify({ type, body }));
};

const createDataChannel = () => {
  try {
    sendChannel = localPeerConnection.createDataChannel("sendDataChannel", {
      reliable: true,
    });
  } catch (error) {
    console.error("Failed to create data channel", error);
  }

  sendChannel.onopen = handleSendChannelStateChange;
  sendChannel.onclose = handleSendChannelStateChange;

  localPeerConnection.ondatachannel = gotReceiveChannel;
};

const closeDataChannel = () => {
  sendChannel?.close();
  receiveChannel?.close();
  state.sendButtonDisabled = true;
};

const gotReceiveChannel = (event) => {
  receiveChannel = event.channel;
  receiveChannel.onmessage = handleMessage;
  receiveChannel.onopen = handleReceiveChannelStateChange;
  receiveChannel.onclose = handleReceiveChannelStateChange;
};

const handleReceiveChannelStateChange = () => {
  const readyState = receiveChannel.readyState;
  console.log("handleReceiveChannelStateChange invoked", readyState);
};

const handleMessage = (event) => {
  state.receiveMessage = event.data;
};

const handleSendChannelStateChange = () => {
  state.sendButtonDisabled = sendChannel.readyState !== "open";
};

onMounted(() => {
  const wsClient = new WebSocket(URL_WEB_SOCKET);
  ws.value = wsClient;

  wsClient.onopen = () => {
    console.log("WebSocket opened");
    state.startButtonDisabled = false;
  };

  wsClient.onmessage = (message) => {
    const parsedMessage = JSON.parse(message.data);
    console.log("@@@@@@@@", parsedMessage);
    switch (parsedMessage.type) {
      case "joined":
        console.log("Users in this channel:", parsedMessage.body);
        break;
      case "offer_sdp_received":
        onAnswer(parsedMessage.body);
        break;
      case "answer_sdp_received":
        gotRemoteDescription(parsedMessage.body);
        break;
      case "quit":
        break;
      default:
        break;
    }
  };

  wsClient.onclose = () => console.log("WebSocket closed");

  return () => {
    wsClient.close();
  };
});
</script>

<style scoped>
button {
  margin-right: 10px;
}
</style>
