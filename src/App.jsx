import './App.css'
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { useWebsocket } from './hooks/useWebSocket'
import { useWebRTC } from './hooks/useWebRTC'

function App () {
	const [usersConnected, setUsersConnected] = useState([])
	const [isCloseAllPeerConnections, setIsCloseAllPeerConnections] = useState(false)
	const objectFunctionsWebSocket = useRef({})
	// const [objectFunctionsWebSocket, setObjectFunctionsWebSocket] = useState({
	// 	'userConnected': handlerUserConnected,
	// 	'responseUserConnected': handlerAddUserConnected,
	// })
	// const [isSocketConnected, setIsSocketConnected] = useState(false)
	// const [mute, setMute] = useState(false)
	// const [video, setVideo] = useState(false)

	const localStream = useRef()
	const videoLocal = useRef()
	// const videoRemote = useRef()
	const user = useRef({ id: crypto.randomUUID() })

	const { createConnectionWebSocket, sendSocketMessage, updateOnMessages } = useWebsocket()
	// const { handlerPeerMessages, createOffer, closePeerconnection } = useWebRTC({
	// 	user,
	// 	sendSocketMessage,
	// 	handlerSendTrack,
	// 	handlerListenTrack,
	// 	addUserConnected
	// })

	useEffect(() => {
		// clear prev users saved
		window.localStorage.setItem('usersConnected', '')

		// connectUser()

		objectFunctionsWebSocket.current = {
			'userConnected': handlerUserConnected,
			'responseUserConnected': handlerAddUserConnected,
		}
	}, [])

	useEffect(() => {
		console.log({ usersConnected })
		window.localStorage.setItem('usersConnected', JSON.stringify(usersConnected))
	}, [usersConnected])

	// const sendMessage = () => {
	// 	console.log('enviando mensaje...')
	// 	sendSocketMessage({ message: 'Hola Perra sarnosa' })
	// }

	// const startVideo = async () => {
	// 	createOffer()
	// }

	// const closeCall = () => {
	// 	closePeerconnection()
	// }

	// const muteCall = () => {
	// 	setMute((prev) => !prev)

	// 	const tracks = localStream.current.getAudioTracks()
	// 	tracks.forEach((track) => (track.enabled = mute))
	// }

	// const showCall = () => {
	// 	setVideo((prev) => !prev)

	// 	const tracks = localStream.current.getVideoTracks()
	// 	tracks.forEach((track) => (track.enabled = video))
	// }

	// function handlerSendTrack () {
	// 	const tracks = localStream.current.getTracks()
	// 	return { tracks, stream: localStream.current }
	// }

	// function handlerListenTrack (event) {
	// 	console.log({ event })
	// 	videoRemote.current.srcObject = event.streams[0]
	// }

	const handlerUserConnected = (data) => {
    addUserConnected(data.user)
    sendSocketMessage({ type: 'responseUserConnected', user: user.current })
  }

	const handlerPeerMessages = (dataPeer) => {
		const dataParsed = JSON.parse(dataPeer)

		const functionWebsocket = objectFunctionsWebSocket.current[dataParsed.type]
		if (typeof functionWebsocket === 'function') functionWebsocket(dataParsed)
		else console.log('opción inválida')
		// switch (dataParsed.type) {
			// case 'offer':
			// 	handlerOffer(dataParsed)
			// 	break
			// case 'answer':
			// 	handlerAnswer(dataParsed)
			// 	break
			// case 'candidate':
			// 	handlerCandidate(dataParsed)
			// 	break
			// case 'userConnected':
			// 	handlerUserConnected(dataParsed)
			// 	break
			// case 'responseUserConnected':
			// 	addUserConnected(dataParsed)
			// 	break
			// default:
			// 	console.log('opción inválida')
			// 	break
		// }
	}

	const connectUser = () => {
		const onopen = (event) => {
			console.log('socket conectado', event)
			// addUserConnected(user.current)
			sendSocketMessage({ type: 'userConnected', user: user.current })
			setIsCloseAllPeerConnections(false)
		}

		const onmessage = (event) => {
			console.log(event.data)
			handlerPeerMessages(event.data)
			// if (typeof window.handlerPeerMessages === 'function') {
			// 	hijo.current.executeHandlerPeerMessages(event.data)
			// }
		}

		const onclose = (event) => {
			console.log('socket cerrado', event)
			// closePeerconnection()
			setIsCloseAllPeerConnections(true)
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
	}

	const handlerAddUserConnected = (data) => {
		addUserConnected(data.user)
	}

	function addUserConnected(user) {
		setUsersConnected(prevUsers => {
			const isUserExist = prevUsers.find(prevUser => prevUser.id === user.id)
			if (!isUserExist) return prevUsers.concat(user)
			return prevUsers
		})
	}

	const updateOnMesageWebSocket = (newFunctions) => {
		objectFunctionsWebSocket.current = {
			...objectFunctionsWebSocket.current,
			...newFunctions
		}

		updateOnMessages(objectFunctionsWebSocket.current)
	}

	return (
		<div>
			<p>Hola</p>

			<button onClick={connectUser}
				className='btnSendMessage'>sala de conexion</button>

			<div>
				<video ref={videoLocal} autoPlay muted></video>
				{usersConnected.map((user) => (
					<ShowVideoUser key={user} localStream={localStream.current} sendSocketMessage={sendSocketMessage} isCloseAllPeerConnections={isCloseAllPeerConnections} updateOnMesageWebSocket={updateOnMesageWebSocket} />
				))}
			</div>

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

function ShowVideoUser ({ localStream, sendSocketMessage, isCloseAllPeerConnections, updateOnMesageWebSocket }) {
	const videoRemote = useRef()

	const { handlerOffer, handlerAnswer, handlerCandidate, createOffer, closePeerConnection } = useWebRTC({
		sendSocketMessage,
		handlerSendTrack,
		handlerListenTrack,
	})

	useEffect(() => {
		updateOnMesageWebSocket({
			'offer': handlerOffer,
			'answer': handlerAnswer,
			'candidate': handlerCandidate
		})
	}, [])
	

	useEffect(() => {
		createOffer()
	}, [])

	useEffect(() => {
		if (isCloseAllPeerConnections) {
			closePeerConnection()
		}
	}, [isCloseAllPeerConnections])

	function handlerSendTrack () {
		const tracks = localStream.getTracks()
		return { tracks, stream: localStream }
	}

	function handlerListenTrack (event) {
		console.log({ event })
		// guardar los streams en variables y mostrar un video por cada stream
		videoRemote.current.srcObject = event.streams[0]
	}

	return (
		<video ref={videoRemote} autoPlay muted></video>
	)
}
