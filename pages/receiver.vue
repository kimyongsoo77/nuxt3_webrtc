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
const pcConstraints = {
  optional: [{ DtlsSrtpKeyAgreement: true }],
};

const remoteVideo = ref(null);
const socket = io("https://112.187.200.140:3000"); // 서버 주소
const peerConnection = new RTCPeerConnection(servers, pcConstraints);

onMounted(() => {
  // Offer 수신
  socket.on("offer", async (offer) => {
    console.log("offer", offer);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    peerConnection.onicecandidate = gotLocalIceCandidateAnswer;
    // socket.emit("answer", peerConnection.localDescription);
  });

  // ICE 후보 처리
  //   socket.on("candidate", (candidate) => {
  //     peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  //   });

  peerConnection.onaddstream = (event) => {
    //remoteVideo.value.srcObject = event.streams[0];
    remoteVideo.value.srcObject = event.stream;
  };

  const gotLocalIceCandidateAnswer = (event) => {
    if (!event.candidate) {
      socket.emit("answer", peerConnection.localDescription);
    }
  };

  //   peerConnection.onicecandidate = (event) => {
  //     if (event.candidate) {
  //       socket.emit("candidate", event.candidate);
  //     }
  //   };
});
</script>
