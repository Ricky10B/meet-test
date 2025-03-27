import './App.css'
import { useEffect, useState, useRef } from 'react'
import { useWebsocket } from './hooks/useWebSocket'
import { useWebRTC } from './hooks/useWebRTC'

function App () {
	const [usersConnected, setUsersConnected] = useState([])
	// const [isSocketConnected, setIsSocketConnected] = useState(false)
	// const [mute, setMute] = useState(false)
	// const [video, setVideo] = useState(false)

	// const localStream = useRef()
	// const videoLocal = useRef()
	// const videoRemote = useRef()
	const user = useRef({ id: crypto.randomUUID() })
	

	useEffect(() => {
		// clear prev users saved
		window.localStorage.setItem('usersConnected', '')

		// const onopen = (event) => {
		// 	console.log('socket conectado', event)
		// 	setIsSocketConnected(true)
		// }

		// const onmessage = (event) => {
		// 	console.log(event.data)
		// 	handlerPeerMessages(event.data)
		// }

		// const onclose = (event) => {
		// 	console.log('socket cerrado', event)
		// 	setIsSocketConnected(false)
		// 	closePeerconnection()
		// }

		// createConnectionWebSocket({
		// 	url: 'wss://meet.estoesunaprueba.fun:8050/ws/webrtc/',
		// 	onopen,
		// 	onmessage,
		// 	onclose
		// })

		// navigator.mediaDevices
		// 	.getUserMedia({
		// 		audio: true,
		// 		video: true,
		// 	})
		// 	.then((stream) => {
		// 		localStream.current = stream
		// 		videoLocal.current.srcObject = stream
		// 	})
	}, [])

	useEffect(() => {
		console.log({ usersConnected })
		window.localStorage.setItem('usersConnected', JSON.stringify(usersConnected))
	}, [usersConnected])

	const sendMessage = () => {
		console.log('enviando mensaje...')
		sendSocketMessage({ message: 'Hola Perra sarnosa' })
	}

	const startVideo = async () => {
		createOffer()
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

	// function handlerSendTrack () {
	// 	const tracks = localStream.current.getTracks()
	// 	return { tracks, stream: localStream.current }
	// }

	// function handlerListenTrack (event) {
	// 	console.log({ event })
	// 	videoRemote.current.srcObject = event.streams[0]
	// }

	const connectUser = () => {
		addUserConnected(user.current)
		// const onopen = (event) => {
		// 	console.log('socket conectado', event)
		// 	addUserConnected(user.current)
		// 	sendSocketMessage({ type: 'userConnected', user: user.current })
		// }

		// const onmessage = (event) => {
		// 	console.log(event.data)
		// 	handlerPeerMessages(event.data)
		// }

		// const onclose = (event) => {
		// 	console.log('socket cerrado', event)
		// 	closePeerconnection()
		// }

		// createConnectionWebSocket({
		// 	url: 'wss://meet.estoesunaprueba.fun:8050/ws/webrtc/',
		// 	onopen,
		// 	onmessage,
		// 	onclose
		// })
	}

	function addUserConnected(user) {
		setUsersConnected(prevUsers => {
			const isUserExist = prevUsers.find(prevUser => prevUser.id === user.id)
			if (!isUserExist) return prevUsers.concat(user)
			return prevUsers
		})
	}

	return (
		<div>
			<p>Hola</p>

			<button onClick={connectUser}
				className='btnSendMessage'>sala de conexion</button>

			{usersConnected.length > 0 && (
				usersConnected.map(user => (
					<ShowVideoUser user={user} />
				))
			)}

			{/* <button onClick={startVideo} disabled={!isSocketConnected}>
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
			</div> */}
		</div>
	)
}

export default App

function ShowVideoUser ({ user, addUserConnected }) {
	const videoLocal = useRef()

	const { createConnectionWebSocket, sendSocketMessage } = useWebsocket()
	const { handlerPeerMessages, createOffer, closePeerconnection } = useWebRTC({
		user,
		sendSocketMessage,
		handlerSendTrack,
		handlerListenTrack,
		addUserConnected
	})

	useEffect(() => {
		const onopen = (event) => {
			console.log('socket conectado', event)
			createOffer()
			sendSocketMessage({ type: 'userConnected', user })
		}

		const onmessage = (event) => {
			console.log(event.data)
			handlerPeerMessages(event.data)
		}

		const onclose = (event) => {
			console.log('socket cerrado', event)
			closePeerconnection()
		}

		createConnectionWebSocket({
			url: 'wss://meet.estoesunaprueba.fun:8050/ws/webrtc/',
			onopen,
			onmessage,
			onclose
		})
	}, [])

	function handlerSendTrack () {
		const tracks = localStream.current.getTracks()
		return { tracks, stream: localStream.current }
	}

	function handlerListenTrack (event) {
		console.log({ event })
		videoRemote.current.srcObject = event.streams[0]
	}

	return (
		<video ref={videoLocal} autoPlay muted></video>
	)
}
