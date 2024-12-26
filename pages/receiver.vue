<template>
  <div>
    <video ref="remoteVideo" muted autoplay></video>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import io from "socket.io-client";

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

const remoteVideo = ref(null);
const socket = io("https://112.187.200.140:3000"); // 서버 주소
const peerConnection = new RTCPeerConnection(servers, pcConstraints);
let pendingCandidates = [];

onMounted(() => {
  // Offer 수신
  socket.on("offer", async (offer) => {
    console.log("offer", offer);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    // Remote Description 설정 후 대기 중인 ICE 후보 처리
    for (const candidate of pendingCandidates) {
      console.log("receiver 후보등록");
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
    pendingCandidates = []; // 대기 후보 초기화
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", peerConnection.localDescription);
  });

  // ICE 후보 처리
  socket.on("candidate", (candidate) => {
    if (peerConnection.remoteDescription) {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      console.log("Waiting for remote description before adding candidate.");
      pendingCandidates.push(candidate); // 대기 후보에 저장
    }
  });

  peerConnection.onaddstream = (event) => {
    remoteVideo.value.srcObject = event.stream;
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("receiver onicecandidate", event.candidate);
      socket.emit("candidate", event.candidate);
    }
  };
});
</script>
