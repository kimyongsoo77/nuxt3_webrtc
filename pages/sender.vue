<template>
  <div>
    <button @click="startSharing">화면 공유 시작</button>
    <video ref="localVideo" muted autoplay></video>
  </div>
</template>

<script setup>
import { ref } from "vue";
import io from "socket.io-client";

const servers = {
  iceServers: [
    // {url: 'stun:stun01.sipphone.com'},
    // {url: 'stun:stun.ekiga.net'},
    // {url: 'stun:stun.fwdnet.net'},
    // {url: 'stun:stun.ideasip.com'},
    // {url: 'stun:stun.iptel.org'},
    // {url: 'stun:stun.rixtelecom.se'},
    // {url: 'stun:stun.schlund.de'},
    { url: "stun:stun.l.google.com:19302" },
    { url: "stun:stun1.l.google.com:19302" },
    { url: "stun:stun2.l.google.com:19302" },
    // {url: 'stun:stun3.l.google.com:19302'},
    // {url: 'stun:stun4.l.google.com:19302'},
    // {url: 'stun:stunserver.org'},
    // {url: 'stun:stun.softjoys.com'},
    // {url: 'stun:stun.voiparound.com'},
    // {url: 'stun:stun.voipbuster.com'},
    // {url: 'stun:stun.voipstunt.com'},
    // {url: 'stun:stun.voxgratia.org'},
    // {url: 'stun:stun.xten.com'},
    // {
    //     url: 'turn:numb.viagenie.ca',
    //     credential: 'muazkh',
    //     username: 'webrtc@live.com',
    // },
    // {
    //     url: 'turn:192.158.29.39:3478?transport=udp',
    //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //     username: '28224511:1379330808',
    // },
    // {
    //     url: 'turn:192.158.29.39:3478?transport=tcp',
    //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //     username: '28224511:1379330808',
    // },
  ],
};
const localVideo = ref(null);

const pcConstraints = {
  optional: [{ DtlsSrtpKeyAgreement: true }],
};

const socket = io("https://112.187.200.140:3000"); // 서버 주소
const peerConnection = new RTCPeerConnection(servers, pcConstraints);

async function startSharing() {
  // 화면 캡처
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  });
  // stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
  // localVideo.value.srcObject = stream;
  peerConnection.addStream(stream);

  // peerConnection.onicecandidate = gotLocalIceCandidateOffer;
  // Offer 생성 및 Signal Server로 전송
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer);
}

// ICE 후보 처리
socket.on("candidate", (candidate) => {
  if (peerConnection.remoteDescription) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } else {
    console.log("Waiting for remote description before adding candidate.");
  }
});

socket.on("answer", async (answer) => {
  console.log("answer", answer);
  peerConnection.setRemoteDescription(answer);
});

// sender에서 발생
// const gotLocalIceCandidateOffer = (event) => {
//   if (!event.candidate) {
//     socket.emit("offer", peerConnection.localDescription);
//   }
// };

// Signal Server로부터 받은 Offer 처리
// socket.on("offer", async (offer) => {
//   await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

//   // 응답 생성
//   const answer = await peerConnection.createAnswer();
//   await peerConnection.setLocalDescription(answer);
//   socket.emit("answer", peerConnection.localDescription);
// });

// ICE 후보 처리
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    console.log("sender onicecandidate", event.candidate);
    socket.emit("candidate", event.candidate);
  }
};
</script>
