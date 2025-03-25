import './App.css'
import { useState } from 'react'
import { useRef } from 'react'
import { useEffect } from 'react'

function App() {
	const [isSocketConnected, setIsSocketConnected] = useState(false)
	const [mute, setMute] = useState(false)
	const [video, setVideo] = useState(false)

	const localStream = useRef()
	const webSocket = useRef()
	const pc = useRef()
	const videoLocal = useRef()
	const videoRemote = useRef()

	useEffect(() => {
		if (webSocket.current?.readyState !== 1) {
			webSocket.current = new WebSocket(
				'wss://meet.estoesunaprueba.fun:8050/ws/webrtc/'
			)

			webSocket.current.onopen = (event) => {
				console.log('socket conectado', event)
				setIsSocketConnected(true)
			}

			webSocket.current.onmessage = (event) => {
				console.log(event.data)
				conexionPeer(event.data)
			}

			webSocket.current.onclose = (event) => {
				console.log('socket cerrado', event)
				setIsSocketConnected(false)
				pc.current.close()
			}

			navigator.mediaDevices
				.getUserMedia({
					audio: true,
					video: true,
				})
				.then((stream) => {
					localStream.current = stream
					videoLocal.current.srcObject = stream
				})
		}
	}, [])

	const sendMessage = () => {
		if (webSocket.current?.readyState === 1) {
			console.log('enviando mensaje...')
			webSocket.current.send(JSON.stringify({ message: 'Hola Perra sarnosa' }))
		}
	}

	const startVideo = async () => {
		await crearPeer()
		const offer = await pc.current.createOffer()
		// solo se usa el socketId
		// socket.emit("iniciarConexionPeer", { type: 'offer', sdp: offer.sdp }, mensaje);
		await pc.current.setLocalDescription(offer)
		webSocket.current.send(JSON.stringify(offer))
	}

	function conexionPeer(dataPeer) {
		dataPeer = JSON.parse(dataPeer)
		switch (dataPeer.type) {
			case 'offer':
				manejarOferta(dataPeer)
				break
			case 'answer':
				manejarRespuesta(dataPeer)
				break
			case 'candidate':
				manejarCandidato(dataPeer)
				break
			default:
				console.log('opción inválida')
				break
		}
	}

	async function crearPeer() {
		const configuracion = {
			iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
		}
		pc.current = new RTCPeerConnection(configuracion)

		pc.current.onicecandidate = (event) => {
			if (event.candidate) {
				webSocket.current.send(
					JSON.stringify({ type: 'candidate', candidate: event.candidate })
				)
				console.log(event.candidate)
			}
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
		webSocket.current.send(JSON.stringify(answer))
	}

	async function manejarRespuesta(answer) {
		await pc.current.setRemoteDescription(new RTCSessionDescription(answer))
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

			<div>
				<video ref={videoLocal} autoPlay muted></video>
				<video ref={videoRemote} autoPlay></video>
			</div>
		</div>
	)
}

export default App
