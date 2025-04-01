import { useRef } from "react"

export function useWebRTC({
  idSenderUser,
  idUser,
  sendSocketMessage,
  handlerSendTrack,
  handlerListenTrack,
  addNextUser
}) {
  const peerConnection = useRef(new RTCPeerConnection())
  const idPeerConnection = useRef(crypto.randomUUID())

  // const handlerPeerMessages = (dataPeer) => {
  // 	const dataParsed = JSON.parse(dataPeer)
  // 	switch (dataParsed.type) {
  // 		case 'offer':
  // 			handlerOffer(dataParsed)
  // 			break
  // 		case 'answer':
  // 			handlerAnswer(dataParsed)
  // 			break
  // 		case 'candidate':
  // 			handlerCandidate(dataParsed)
  // 			break
  // 		case 'userConnected':
  // 			handlerUserConnected(dataParsed)
  // 			break
  // 		case 'responseUserConnected':
  // 			addUserConnected(dataParsed.user)
  // 			break
  // 		default:
  // 			console.log('opción inválida')
  // 			break
  // 	}
  // }

  const createPeer = async () => {
    const configuracion = {
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    }

    // peerConnection.current = new RTCPeerConnection(configuracion)
    peerConnection.current.setConfiguration(configuracion)

    // peerConnection.current.ontrack = (event) => {
    // 	console.log({ event })
    // 	videoRemote.current.srcObject = event.streams[0]
    // }
    peerConnection.current.ontrack = handlerListenTrack

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        sendSocketMessage({ type: "candidate", candidate: event.candidate, channel_name: idUser, idSenderUser, idPeerConnection: idPeerConnection.current })
      }
    }

    peerConnection.current.oniceconnectionstatechange = () => {
      const state = peerConnection.current.iceConnectionState
      console.log("ICE Connection State:", state)

      if (state === "connected") {
        console.log("RTC Conectado")
        addNextUser()
      } else if (state === "disconnected") {
        alert("RTC Desconectado")
      }
    }

    // localStream.current
    // 	.getTracks()
    // 	.forEach((track) => peerConnection.current.addTrack(track, localStream.current))
    const { tracks, stream } = handlerSendTrack()
    tracks.forEach((track) => {
      // const existingTracks = peerConnection.current.getSenders().map(sender => sender.track)
      // if (!existingTracks.includes(track)) {
        peerConnection.current.addTrack(track, stream)
      // }
    })
  }

  const createOffer = async () => {
    await createPeer()
    const offer = await peerConnection.current.createOffer()
    await peerConnection.current.setLocalDescription(offer)

    console.log('creando oferta', {
      type: offer.type,
      sdp: offer.sdp,
      channel_name: idUser,
      idSenderUser,
      idPeerConnection: idPeerConnection.current
    })

    sendSocketMessage({
      type: offer.type,
      sdp: offer.sdp,
      channel_name: idUser,
      idSenderUser,
      idPeerConnection: idPeerConnection.current
    })
  }

  const handlerOffer = async (offer) => {
    console.log('Oferta Recivida', offer)
    await createPeer()
    const objOffer = {
      type: offer.type,
      sdp: offer.sdp
    }

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(objOffer)
    )
    const answer = await peerConnection.current.createAnswer()
    await peerConnection.current.setLocalDescription(answer)
    // answer.channel_name = offer.idSenderUser
    sendSocketMessage({
      type: 'answer',
      sdp: answer.sdp,
      channel_name: offer.idSenderUser,
      idSenderUser: offer.channel_name,
      idPeerConnection: offer.idPeerConnection,
    })
  }

  const handlerAnswer = async (answer) => {
    if (answer.idPeerConnection !== idPeerConnection.current) return
    if (peerConnection.current.signalingState === "stable") return

    const objAnswer = {
      type: answer.type,
      sdp: answer.sdp
    }

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(objAnswer)
    )
  }

  const handlerCandidate = async (candidato) => {
    console.log({ candidato, idUser, idSenderUser, idPeerConnection: idPeerConnection.current })
    // if (candidato.idPeerConnection === idPeerConnection.current) return
    // if (candidato.idSenderUser === idSenderUser && candidato.candidate) {
    // if (candidato.channel_name === idSenderUser && candidato.candidate) {
    if (peerConnection.current.signalingState === "stable") return

    console.log('SETEANDO ICE CANDIDATE')
    const iceCandidate = new RTCIceCandidate(candidato.candidate)
    await peerConnection.current.addIceCandidate(iceCandidate)
    // }
  }

  const handlerAddTrack = (track, stream) => {
    peerConnection.current.addTrack(track, stream)
  }

  // const handlerUserConnected = (data) => {
  //   addUserConnected(data.user)
  //   sendSocketMessage({ type: 'responseUserConnected', user })
  // }

  const closePeerConnection = () => {
    peerConnection.current.close()
  }

  return {
    createOffer,
    handlerOffer,
    handlerAnswer,
    handlerCandidate,
    handlerAddTrack,
    closePeerConnection,
  }
}
