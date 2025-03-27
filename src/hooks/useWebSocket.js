import { useRef } from "react"

export function useWebsocket () {
  const webSocket = useRef()

  const createConnectionWebSocket = ({ url = '', onopen = () => {}, onmessage = () => {}, onerror = () => {}, onclose = () => {} }) => {
    if (webSocket.current?.readyState === WebSocket.OPEN) return
    webSocket.current = new WebSocket(url)

    webSocket.current.onopen = onopen
    webSocket.current.onmessage = onmessage
    webSocket.current.onerror = onerror
    webSocket.current.onclose = onclose

    return webSocket.current
  }

  const sendSocketMessage = (dataMessage) => {
    if (webSocket.current?.readyState === WebSocket.OPEN) {
      webSocket.current.send(JSON.stringify(dataMessage))
    }
  }

  const updateOnMessages = (onmessage) => {
    console.log({ onmessage })
    webSocket.current.onmessage = onmessage
    console.log({ onm: webSocket.current.onmessage })
  }

  return {
    createConnectionWebSocket,
    sendSocketMessage,
    updateOnMessages
  }
}
