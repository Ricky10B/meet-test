import "./App.css"
import { useEffect, useState, useRef } from "react"
import { useWebsocket } from "./hooks/useWebSocket"
import { useWebRTC } from "./hooks/useWebRTC"

function App() {
  const [usersConnected, setUsersConnected] = useState([])
  const [isCloseAllPeerConnections, setIsCloseAllPeerConnections] =
    useState(false)
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
  const user = useRef()
  const isSendOffer = useRef(true)

  const { createConnectionWebSocket, sendSocketMessage, updateOnMessages } =
    useWebsocket()
  // const { handlerPeerMessages, createOffer, closePeerconnection } = useWebRTC({
  // 	user,
  // 	sendSocketMessage,
  // 	handlerSendTrack,
  // 	handlerListenTrack,
  // 	addUserConnected
  // })

  useEffect(() => {
    // clear prev users saved
    window.localStorage.setItem("usersConnected", "")

    // connectUser()

    objectFunctionsWebSocket.current = {
      userConnected: handlerUserConnected,
      responseUserConnected: handlerAddUserConnected,
      // isCaller: handlerReceiveIdChannel
    }
  }, [])

  useEffect(() => {
    console.log({ usersConnected })
    window.localStorage.setItem(
      "usersConnected",
      JSON.stringify(usersConnected)
    )

    if (usersConnected.length) isSendOffer.current = false
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
    addUserConnected(data)
    // sendSocketMessage({ type: "responseUserConnected", user: user.current })
  }

  const handlerPeerMessages = (event) => {
    const dataParsed = JSON.parse(event.data)
    console.log({ dataParsed })

    if (dataParsed.id && user.current == null) {
      user.current = { id: dataParsed.id }
      sendSocketMessage({ type: "userConnected", user: { id: dataParsed.id } })
    }

    // if (dataParsed) {}

    if (dataParsed.users) {
      handlerReceiveTotalUsers(dataParsed)
      return
    }

    const functionWebsocket = objectFunctionsWebSocket.current[dataParsed.type]
    if (typeof functionWebsocket === "function") functionWebsocket(dataParsed)
    else console.log("opción inválida")

    // if (dataParsed.type === "answer") isSendOffer.current = true
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

  const connectUser = async () => {
    const stream = await navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true,
      })
      // .then((stream) => {
    localStream.current = stream
    videoLocal.current.srcObject = stream
      // })

    const onopen = (event) => {
      console.log("socket conectado", event)
      // addUserConnected(user.current)
      sendSocketMessage({ type: 'users' })
      setIsCloseAllPeerConnections(false)
    }

    const onmessage = handlerPeerMessages

    const onclose = (event) => {
      console.log("socket cerrado", event)
      // closePeerconnection()
      setIsCloseAllPeerConnections(true)
    }

    createConnectionWebSocket({
      url: "wss://mtbk.estoesunaprueba.fun:8050/ws/webrtc/",
      onopen,
      onmessage,
      onclose,
    })
  }

  const handlerAddUserConnected = (data) => {
    console.log('agregar usuario')
    isSendOffer.current = false
    addUserConnected(data.user)
  }

  function addUserConnected(user) {
    user = user.user
    setUsersConnected((prevUsers) => {
      const isUserExist = prevUsers.find((prevUser) => prevUser.channel_name === user.id)
      if (!isUserExist) return prevUsers.concat({ channel_name: user.id })
      return prevUsers
    })
  }

  const updateOnMesageWebSocket = (newFunctions) => {
    objectFunctionsWebSocket.current = {
      ...objectFunctionsWebSocket.current,
      ...newFunctions,
    }

    console.log('new functions', newFunctions)

    updateOnMessages(handlerPeerMessages)
  }

  const handlerReceiveTotalUsers = (data) => {
    const { users } = data
    if (users.length <= 1) isSendOffer.current = false
    console.log('Total users:', users)

    const listUsers = []
    for (let i = 0; i < users.length; i++) {
      if (users[i].channel_name !== user.current.id) listUsers.push(users[i])
    }

    setUsersConnected(listUsers)
    // setUsersConnected(prevUsers => {
    //   const listUsers = [...prevUsers]
    //   for (let i = listUsers.length + 1; i < users.length; i++) {
    //     listUsers.push(i)
    //   }

    //   return listUsers
    // })
  }

  // const handlerReceiveIdChannel = (data) => {
  //   console.log({ data })
  //   user.current = { id: data.id }
  // }

  return (
    <div>
      <p>Hola</p>

      <button onClick={connectUser} className="btnSendMessage">
        sala de conexion
      </button>

      <div>
        <video ref={videoLocal} autoPlay muted></video>
        {usersConnected.map((userConnected, i) => (
          <ShowVideoUser
            key={i}
            senderUser={user.current}
            user={userConnected}
            isSendOffer={isSendOffer.current}
            localStream={localStream.current}
            sendSocketMessage={sendSocketMessage}
            isCloseAllPeerConnections={isCloseAllPeerConnections}
            updateOnMesageWebSocket={updateOnMesageWebSocket}
          />
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

function ShowVideoUser({
  senderUser,
  user,
  localStream,
  isSendOffer,
  sendSocketMessage,
  isCloseAllPeerConnections,
  updateOnMesageWebSocket,
}) {
  const videoRemote = useRef()

  const {
    handlerOffer,
    handlerAnswer,
    handlerCandidate,
    createOffer,
    closePeerConnection,
  } = useWebRTC({
    idSenderUser: senderUser.id,
    idUser: user.channel_name,
    sendSocketMessage,
    handlerSendTrack,
    handlerListenTrack,
  })

  useEffect(() => {
    console.log("enviando oferta", isSendOffer)
    if (isSendOffer) createOffer()

    updateOnMesageWebSocket({
      offer: handlerOffer,
      answer: handlerAnswer,
      candidate: handlerCandidate,
    })

    return () => {
      closePeerConnection()
    }
  }, [])

  useEffect(() => {
    if (isCloseAllPeerConnections) {
      closePeerConnection()
    }
  }, [isCloseAllPeerConnections])

  function handlerSendTrack() {
    const tracks = localStream.getTracks()
    return { tracks, stream: localStream }
  }

  function handlerListenTrack(event) {
    console.log({ event, srcObject: videoRemote.current.srcObject })
    // guardar los streams en variables y mostrar un video por cada stream
    videoRemote.current.srcObject = event.streams[0]
  }

  return (
    <video ref={videoRemote} autoPlay muted></video>
  )
}
