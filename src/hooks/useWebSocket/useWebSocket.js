import { useRef } from "react";

export function useWebSocket() {
  const webSocket = useRef();

  const createWebSocket = ({
    url = "",
    onopen = () => {},
    onmessage = () => {},
    onerror = () => {},
    onclose = () => {},
  }) => {
    webSocket.current = new WebSocket(url);

    webSocket.current.onopen = onopen;
    webSocket.current.onmessage = onmessage;
    webSocket.current.onerror = onerror;
    webSocket.current.onclose = onclose;
  };

  const socketSendMessage = (dataToSend) => {
    if (webSocket.current?.readyState !== webSocket.current?.OPEN)
      webSocket.current.send(JSON.stringify(dataToSend));
  };

  return {
    webSocket: webSocket.current,
    createWebSocket,
    socketSendMessage,
  };
}
