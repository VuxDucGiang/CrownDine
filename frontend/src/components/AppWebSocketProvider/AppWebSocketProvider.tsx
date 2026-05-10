import { StompSessionProvider } from 'react-stomp-hooks'
import { jwtDecode } from 'jwt-decode'
import { useAuthStore } from '@/stores/useAuthStore'
import { WebSocketEnabledProvider } from '@/contexts/WebSocketEnabledProvider'
import NotificationRealtimeListener from '@/components/NotificationRealtimeListener/NotificationRealtimeListener'

type Props = {
  children: React.ReactNode
}

function isAccessTokenStillValid(accessToken: string | null) {
  if (!accessToken) {
    return false
  }

  const rawAccessToken = accessToken.startsWith('Bearer ') ? accessToken.slice(7) : accessToken

  try {
    const decoded = jwtDecode<{ exp?: number }>(rawAccessToken)
    if (!decoded.exp) {
      return false
    }

    return decoded.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export default function AppWebSocketProvider({ children }: Props) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const hasValidAccessToken = isAccessTokenStillValid(accessToken)

  if (!hasValidAccessToken || !accessToken) {
    return <WebSocketEnabledProvider enabled={false}>{children}</WebSocketEnabledProvider>
  }

  const rawAccessToken = accessToken.startsWith('Bearer ') ? accessToken.slice(7) : accessToken
  const defaultWsBaseUrl = import.meta.env.PROD ? 'wss://crowndine.onrender.com' : 'ws://localhost:8080'
  const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || defaultWsBaseUrl
  const websocketUrl = `${wsBaseUrl}/ws-restaurant?access_token=${encodeURIComponent(rawAccessToken)}`

  return (
    <WebSocketEnabledProvider enabled={true}>
      <StompSessionProvider
        key={accessToken}
        url={websocketUrl}
        reconnectDelay={5000}
        heartbeatIncoming={10000}
        heartbeatOutgoing={10000}
        onConnect={() => console.log('WebSocket Connected!')}
        onDisconnect={() => console.log('WebSocket Disconnected!')}
        debug={(str) => console.log(str)}
      >
        <NotificationRealtimeListener />
        {children}
      </StompSessionProvider>
    </WebSocketEnabledProvider>
  )
}
