<template>
  <div>
    <h1>WebRTC 화면 공유</h1>
    <button @click="startScreenShare">화면 공유 시작</button>
    <button @click="stopScreenShare">화면 공유 종료</button>

    <video ref="localVideo" autoplay muted></video>
    <video ref="remoteVideo" autoplay></video>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

// WebSocket 연결 설정
let socket;
const localVideo = ref(null);
const remoteVideo = ref(null);
let localStream;
let peerConnection;
let remoteStream;
const signalingServerUrl = "wss://175.193.249.35:3000"; // WebSocket 서버 URL

const startScreenShare = async () => {
  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    localVideo.value.srcObject = localStream;

    // WebRTC 연결 설정
    peerConnection = new RTCPeerConnection();
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // ICE 후보 정보 수신
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(
          JSON.stringify({ type: "ice-candidate", candidate: event.candidate })
        );
      }
    };

    // 원격 스트림 수신
    peerConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      remoteVideo.value.srcObject = remoteStream;
    };

    // Offer 만들기
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.send(JSON.stringify({ type: "offer", offer: offer }));
  } catch (err) {
    console.error("Error accessing display media: ", err);
  }
};

const stopScreenShare = () => {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
  if (peerConnection) {
    peerConnection.close();
  }
  if (localVideo.value) {
    localVideo.value.srcObject = null;
  }
  if (remoteVideo.value) {
    remoteVideo.value.srcObject = null;
  }
};

const handleMessage = async (message) => {
  const data = JSON.parse(message);

  if (data.type === "offer") {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.send(JSON.stringify({ type: "answer", answer: answer }));
  } else if (data.type === "answer") {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
  } else if (data.type === "ice-candidate") {
    const candidate = new RTCIceCandidate(data.candidate);
    await peerConnection.addIceCandidate(candidate);
  }
};

onMounted(() => {
  // WebSocket 연결
  socket = new WebSocket(signalingServerUrl);

  socket.onopen = () => {
    socket.binaryType = "string";
    console.log("WebSocket connection established");
  };

  socket.onmessage = (event) => {
    handleMessage(event.data);
  };
});

onBeforeUnmount(() => {
  if (socket) {
    socket.close();
  }
  if (peerConnection) {
    peerConnection.close();
  }
});
</script>
