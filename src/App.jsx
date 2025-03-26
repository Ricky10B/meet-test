import "./App.css";
import { useEffect, useState, useRef } from "react";
import { useWebSocket } from "./hooks/useWebSocket/useWebSocket";
import { CloseCallIcon, HideShowCameraIcon, ShowCameraIcon } from "./icons";
import { useWebRTC } from "./hooks/useWebRTC/useWebRTC";

function App() {
  const [showVideoChannel, setShowVideoChannel] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isMuteCall, setIsMuteCall] = useState(false);
  const [isShowCamera, setIsShowCamera] = useState(false);

  const localStream = useRef();
  const videoLocal = useRef();
  const videoRemote = useRef();

  const { createWebSocket, socketSendMessage } = useWebSocket();
  const {
    handlerMessagesWebRTC,
    createOffer,
    closeConnection,
    handlerAddTracks,
  } = useWebRTC({ handlerOnTrack, socketSendMessage });

  useEffect(() => {
    const onopen = (event) => {
      console.log("socket conectado", event);
      setIsSocketConnected(true);
    };

    const onmessage = (event) => {
      console.log(event.data);
      handlerMessagesWebRTC(event.data);
    };

    const onclose = (event) => {
      console.log("socket cerrado", event);
      setIsSocketConnected(false);
      closeConnection();
    };

    createWebSocket({
      url: "wss://meet.estoesunaprueba.fun:8050/ws/webrtc/",
      onopen,
      onmessage,
      onclose,
    });

    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true,
      })
      .then((stream) => {
        localStream.current = stream;
        videoLocal.current.srcObject = stream;
      })
      .catch((error) => {
        alert("no tiene camara");
        console.error(error);
      });
  }, []);

  // const sendMessage = () => {
  // 	if (webSocket?.readyState === webSocket?.OPEN) {
  // 		console.log('enviando mensaje...')
  // 		socketSendMessage({ message: 'Hola Perra sarnosa' })
  // 	}
  // }

  const startVideo = async () => {
    await createOffer();
    localStream.current
      .getTracks()
      .forEach((track) => handlerAddTracks(track, localStream.current));
  };

  const handlerCloseCall = () => {
    closeConnection();
    setShowVideoChannel(false);
    socketSendMessage({ type: "closeCall" });
  };

  const handlerMuteCall = () => {
    setIsMuteCall((prev) => !prev);

    const tracks = localStream.current.getAudioTracks();
    tracks.forEach((track) => (track.enabled = isMuteCall));
  };

  const handlerShowCall = () => {
    setIsShowCamera((prev) => !prev);

    const tracks = localStream.current.getVideoTracks();
    tracks.forEach((track) => (track.enabled = isShowCamera));
  };

  const joinVideoChannel = () => {
    // setShowVideoChannel(true);

    // navigator.mediaDevices
    //   .getUserMedia({
    //     audio: true,
    //     video: true,
    //   })
    //   .then((stream) => {
    //     localStream.current = stream;
    //     videoLocal.current.srcObject = stream;
    //     startVideo();
    //   })
    //   .catch((error) => {
    //     alert("no tiene camara");
    //     console.error(error);
    //   });
    startVideo();
  };

  function handlerOnTrack(event) {
    console.log({ event });
    videoRemote.current.srcObject = event.streams[0];
  }

  return (
    <main>
      <aside>
        <div>
          <ul className="list-channels">
            <li>
              <button onClick={joinVideoChannel} className="btnJoinChannel">
                canal de video
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* {showVideoChannel && ( */}
      <section>
        <div>
          <div>
            <video ref={videoLocal} autoPlay muted></video>
            <video ref={videoRemote} autoPlay></video>
          </div>

          <div>
            {/* <button onClick={startVideo} disabled={!isSocketConnected}>
							iniciar llamada
						</button> */}
            {/* <button
							onClick={sendMessage}
							disabled={!isSocketConnected}
							className='btnSendMessage'
						>
							enviar mensaje
						</button> */}
            <button onClick={handlerCloseCall} disabled={!isSocketConnected}>
              <CloseCallIcon />
            </button>
            <button onClick={handlerMuteCall} disabled={!isSocketConnected}>
              {isMuteCall ? "desmutear" : "mutear"}
            </button>
            <button onClick={handlerShowCall} disabled={!isSocketConnected}>
              {isShowCamera ? <ShowCameraIcon /> : <HideShowCameraIcon />}
            </button>
          </div>
        </div>
      </section>
      {/* )} */}

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
			<button onClick={handlerCloseCall} disabled={!isSocketConnected}>
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
    </main>
  );
}

export default App;
