import './App.css'
import { useEffect, useState, useRef } from 'react'
import { useWebsocket } from './hooks/useWebSocket'
import { useWebRTC } from './hooks/useWebRTC'

function App () {
	const [isSocketConnected, setIsSocketConnected] = useState(false)
	const [mute, setMute] = useState(false)
	const [video, setVideo] = useState(false)

	const localStream = useRef()
	const videoLocal = useRef()
	const videoRemote = useRef()

	const { createConnectionWebSocket, sendSocketMessage } = useWebsocket()
	const { handlerPeerMessages, createOffer, closePeerconnection, handlerAddTrack } = useWebRTC({ sendSocketMessage, handlerListenTrack })

	useEffect(() => {
		const onopen = (event) => {
			console.log('socket conectado', event)
			setIsSocketConnected(true)
		}

		const onmessage = (event) => {
			console.log(event.data)
			handlerPeerMessages(event.data)
		}

		const onclose = (event) => {
			console.log('socket cerrado', event)
			setIsSocketConnected(false)
			closePeerconnection()
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
		createOffer()
		localStream.current.getTracks().forEach(track => {
			handlerAddTrack(track, localStream.current)
		})
	}

	const closeCall = () => {
		closePeerconnection()
	}

	const muteCall = () => {
		setMute((prev) => !prev)

		const tracks = localStream.current.getAudioTracks()
		tracks.forEach((track) => (track.enabled = mute))
	}

	const showCall = () => {
		setVideo((prev) => !prev)

		const tracks = localStream.current.getVideoTracks()
		tracks.forEach((track) => (track.enabled = video))
	}

	function handlerListenTrack (event) {
		console.log({ event })
		videoRemote.current.srcObject = event.streams[0]
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
