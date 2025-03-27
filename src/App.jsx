import './App.css'
import { useEffect, useState, useRef } from 'react'
import { useWebsocket } from './hooks/useWebSocket'

function App () {
	const [isSocketConnected, setIsSocketConnected] = useState(false)
	const [mute, setMute] = useState(false)
	const [video, setVideo] = useState(false)

	const localStream = useRef()
	const pc = useRef()
	const videoLocal = useRef()
	const videoRemote = useRef()

	const { createConnectionWebSocket, sendSocketMessage } = useWebsocket()

	useEffect(() => {
		const onopen = (event) => {
			console.log('socket conectado', event)
			setIsSocketConnected(true)
		}

		const onmessage = (event) => {
			console.log(event.data)
			conexionPeer(event.data)
		}

		const onclose = (event) => {
			console.log('socket cerrado', event)
			setIsSocketConnected(false)
			pc.current.close()
		}

		createConnectionWebSocket({
			url: 'wss://meet.estoesunaprueba.fun:8050/ws/webrtc/',
			onopen,
			onmessage,
			onclose
		})

		navigator.mediaDevices
			.getUserMedia({
				audio: true,
				video: true,
			})
			.then((stream) => {
				localStream.current = stream
				videoLocal.current.srcObject = stream
			})
	}, [])

	const sendMessage = () => {
		console.log('enviando mensaje...')
		sendSocketMessage({ message: 'Hola Perra sarnosa' })
	}

	const startVideo = async () => {
		await crearPeer()
		const offer = await pc.current.createOffer()
		// solo se usa el socketId
		// socket.emit("iniciarConexionPeer", { type: 'offer', sdp: offer.sdp }, mensaje);
		await pc.current.setLocalDescription(offer)
		sendSocketMessage(offer)
	}

	function conexionPeer(dataPeer) {
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
			default:
				console.log('opción inválida')
				break
		}
	}

	async function crearPeer() {
		const configuracion = {
			iceServers: [
				{
					urls: 'stun:stun.l.google.com:19302',
				},
			],
		}

		pc.current = new RTCPeerConnection(configuracion)

		pc.current.ontrack = (event) => {
			console.log({ event })
			videoRemote.current.srcObject = event.streams[0]
			// event.streams[0].getTracks().forEach(track => {
			// 	videoRemote.current.srcObject = track
			// })
		}

		pc.current.onicecandidate = (event) => {
			if (event.candidate) {
				sendSocketMessage({ type: 'candidate', candidate: event.candidate })
			}
		}

		pc.current.oniceconnectionstatechange = () => {
			const state = pc.current.iceConnectionState
			console.log('ICE Connection State:', state)
		}

		localStream.current
			.getTracks()
			.forEach((track) => pc.current.addTrack(track, localStream.current))
	}

	async function manejarOferta(offer) {
		await crearPeer()
		await pc.current.setRemoteDescription(new RTCSessionDescription(offer))
		const answer = await pc.current.createAnswer()
		await pc.current.setLocalDescription(answer)
		sendSocketMessage(answer)
	}

	async function manejarRespuesta(answer) {
		if (pc.current.signalingState !== 'stable') {
			await pc.current.setRemoteDescription(new RTCSessionDescription(answer))
		}
	}

	async function manejarCandidato(candidato) {
		if (candidato.candidate) {
			const iceCandidate = new RTCIceCandidate(candidato.candidate)
			await pc.current.addIceCandidate(iceCandidate)
		}
	}

	function closeCall() {
		pc.current.close()
	}

	function muteCall() {
		setMute((prev) => !prev)

		const tracks = localStream.current.getAudioTracks()
		tracks.forEach((track) => (track.enabled = mute))
	}

	function showCall() {
		setVideo((prev) => !prev)

		const tracks = localStream.current.getVideoTracks()
		tracks.forEach((track) => (track.enabled = video))
	}

	return (
		<div>
			<p>Hola</p>

			<button onClick={startVideo} disabled={!isSocketConnected}>
				iniciar llamada
			</button>
			<button
				onClick={sendMessage}
				disabled={!isSocketConnected}
				className='btnSendMessage'
			>
				enviar mensaje
			</button>
			<button onClick={closeCall} disabled={!isSocketConnected}>
				terminar llamada
			</button>
			<button onClick={muteCall} disabled={!isSocketConnected}>
				{mute ? 'desmutear' : 'mutear'}
			</button>
			<button onClick={showCall} disabled={!isSocketConnected}>
				{video ? 'ver video' : 'quitar video'}
			</button>
			<button onClick={startVideo}>iniciar llamada</button>
			<button
				onClick={sendMessage}
				disabled={!isSocketConnected}
				className='btnSendMessage'
			>
				send message
			</button>

			<div>
				<video ref={videoLocal} autoPlay muted></video>
				<video ref={videoRemote} autoPlay></video>
			</div>
		</div>
	)
}

export default App
