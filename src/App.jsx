import './App.css'
import { useRef } from 'react'
import { useEffect } from 'react'

function App() {
	const localStream = useRef()
	const remoteConnection = useRef()
	const bc = useRef()
	const pc = useRef()
	const videoLocal = useRef()
	const videoRemote = useRef()

	useEffect(() => {
		bc.current = new BroadcastChannel('channel')

		bc.current.onmessage = (event) => {
			console.log(event)
			conexionPeer(event.data)
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
	}, [])

	const sendMessage = () => {
		bc.current.postMessage('Hola Perra sarnosa')
	}

	const startVideo = async () => {
		crearPeer()
		const offer = await pc.current.createOffer()
		// solo se usa el socketId
		// socket.emit("iniciarConexionPeer", { type: 'offer', sdp: offer.sdp }, mensaje);
		await pc.current.setLocalDescription(offer)
		bc.current.postMessage(JSON.stringify(offer))
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

	function crearPeer() {
		const configuracion = {
			iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
		}
		pc.current = new RTCPeerConnection()
		remoteConnection.current = new RTCPeerConnection()

		pc.current.onicecandidate = (event) => {
			if (event.candidate) {
				bc.current.postMessage(
					JSON.stringify({ type: 'candidate', candidate: event.candidate })
				)
				console.log(event.candidate)
			}
		}
		remoteConnection.current.onicecandidate = (event) => {
			if (event.candidate) {
				bc.current.postMessage(
					JSON.stringify({ type: 'candidate', candidate: event.candidate })
				)
				console.log(event.candidate)
			}
		}

		remoteConnection.current.ontrack = (e) => {
			console.log({ streams: e.streams })
			videoRemote.current.srcObject = e.streams[0]
		}

		localStream.current
			.getTracks()
			.forEach((track) => pc.current.addTrack(track, localStream.current))
	}

	async function manejarOferta(offer) {
		crearPeer()
		await remoteConnection.current.setRemoteDescription(
			new RTCSessionDescription(offer)
		)
		const answer = await remoteConnection.current.createAnswer()
		await remoteConnection.current.setLocalDescription(answer)
		bc.current.postMessage(JSON.stringify(answer))
	}

	async function manejarRespuesta(answer) {
		await pc.current.setRemoteDescription(new RTCSessionDescription(answer))
	}

	async function manejarCandidato(candidato) {
		if (candidato.candidate) {
			const iceCandidate = new RTCIceCandidate(candidato.candidate)
			await pc.current.addIceCandidate(iceCandidate)
			await remoteConnection.current.addIceCandidate(iceCandidate)
		}
	}

	return (
		<div>
			<p>Hola</p>

			<button onClick={startVideo}>iniciar llamada</button>
			<button onClick={sendMessage}>send message</button>

			<div>
				<video ref={videoLocal} autoPlay></video>
				<video ref={videoRemote} autoPlay muted></video>
			</div>
		</div>
	)
}

export default App
