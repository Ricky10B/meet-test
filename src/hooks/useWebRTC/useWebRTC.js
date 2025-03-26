import { useRef } from 'react'
import { useWebSocket } from '../useWebSocket/useWebSocket'

export function useWebRTC() {
	const peerConnection = useRef()

	const { socketSendMessage } = useWebSocket()

	const crearPeer = ({ handlerOnTrack }) => {
		const configuracion = {
			iceServers: [
				{
					urls: 'stun:stun.l.google.com:19302',
				},
			],
		}

		peerConnection.current = new RTCPeerConnection(configuracion)
		peerConnection.current.ontrack = handlerOnTrack
		peerConnection.current.onicecandidate = (event) => {
			if (event.candidate) {
				socketSendMessage({ type: 'candidate', candidate: event.candidate })
			}
		}
	}

	const handlerMessagesWebRTC = (dataPeer) => {
		const dataParsed = JSON.parse(dataPeer)
		switch (dataParsed.type) {
			case 'offer':
				manejarOferta(dataParsed)
				break
			case 'answer':
				manejarRespuesta(dataParsed)
				break
			case 'candidate':
				manejarCandidato(dataParsed)
				break
			case 'closeCall':
				closeConnection()
				break
			default:
				console.log('opción inválida')
				break
		}
	}

	const createOffer = async () => {
		crearPeer()
		const offer = await peerConnection.current.createOffer()
		await peerConnection.current.setLocalDescription(offer)
		socketSendMessage(offer)
	}

	const manejarOferta = async (offer) => {
		crearPeer()
		await peerConnection.current.setRemoteDescription(
			new RTCSessionDescription(offer)
		)
		const answer = await peerConnection.current.createAnswer()
		await peerConnection.current.setLocalDescription(answer)
		socketSendMessage(answer)
	}

	const manejarRespuesta = async (answer) => {
		if (peerConnection.current.signalingState !== 'stable') {
			await peerConnection.current.setRemoteDescription(
				new RTCSessionDescription(answer)
			)
		}
	}

	const manejarCandidato = async (candidato) => {
		if (candidato.candidate) {
			const iceCandidate = new RTCIceCandidate(candidato.candidate)
			await peerConnection.current.addIceCandidate(iceCandidate)
		}
	}

	const closeConnection = () => {
		peerConnection.current.close()
	}

	return {
		peerConnection: peerConnection.current,
		handlerMessagesWebRTC,
		crearPeer,
		createOffer,
		closeConnection,
	}
}
