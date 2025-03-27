import { useRef } from "react";

export function useWebRTC ({ user, sendSocketMessage, handlerSendTrack, handlerListenTrack, addUserConnected }) {
  const peerConnection = useRef()

  const handlerPeerMessages = (dataPeer) => {
		const dataParsed = JSON.parse(dataPeer)
		switch (dataParsed.type) {
			case 'offer':
				handlerOffer(dataParsed)
				break
			case 'answer':
				handlerAnswer(dataParsed)
				break
			case 'candidate':
				handlerCandidate(dataParsed)
				break
			case 'userConnected':
				handlerUserConnected(dataParsed)
				break
			case 'responseUserConnected':
				addUserConnected(dataParsed.user)
				break
			default:
				console.log('opción inválida')
				break
		}
	}

  const createOffer = async () => {
    await createPeer()
		const offer = await peerConnection.current.createOffer()
		await peerConnection.current.setLocalDescription(offer)
		sendSocketMessage(offer)
  }

  const createPeer = async () => {
		const configuracion = {
			iceServers: [{
				urls: 'stun:stun.l.google.com:19302',
			}],
		}

		peerConnection.current = new RTCPeerConnection(configuracion)

		// peerConnection.current.ontrack = (event) => {
		// 	console.log({ event })
		// 	videoRemote.current.srcObject = event.streams[0]
		// }
    peerConnection.current.ontrack = handlerListenTrack

		peerConnection.current.onicecandidate = (event) => {
			if (event.candidate) {
				sendSocketMessage({ type: 'candidate', candidate: event.candidate })
			}
		}

		peerConnection.current.oniceconnectionstatechange = () => {
			const state = peerConnection.current.iceConnectionState
			console.log('ICE Connection State:', state)

      if (state === 'disconnected') {
        alert('RTC Desconectado')
      }
		}

		// localStream.current
		// 	.getTracks()
		// 	.forEach((track) => peerConnection.current.addTrack(track, localStream.current))
    const { tracks, stream } = handlerSendTrack()
    tracks.forEach(track => {
      peerConnection.current.addTrack(track, stream)
    })
	}

  const handlerOffer = async (offer) => {
		await createPeer()
		await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer))
		const answer = await peerConnection.current.createAnswer()
		await peerConnection.current.setLocalDescription(answer)
		sendSocketMessage(answer)
	}

	const handlerAnswer = async (answer) => {
		if (peerConnection.current.signalingState !== 'stable') {
			await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer))
		}
	}

	const handlerCandidate = async (candidato) => {
		if (candidato.candidate) {
			const iceCandidate = new RTCIceCandidate(candidato.candidate)
			await peerConnection.current.addIceCandidate(iceCandidate)
		}
	}

  const handlerAddTrack = (track, stream) => {
    peerConnection.current.addTrack(track, stream)
  }

  const handlerUserConnected = (data) => {
    addUserConnected(data.user)
    sendSocketMessage({ type: 'responseUserConnected', user })
  }

  const closePeerconnection = () => {
    peerConnection.current.close()
  }

  return {
    handlerPeerMessages,
    createOffer,
    handlerAddTrack,
    closePeerconnection
  }
}
