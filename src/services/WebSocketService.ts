type MessageHandler = (data: any) => void;

export function createWebSocket(url: string, onMessage: MessageHandler) {
  if (!url) throw new Error("URL required for WebSocket");
  try {
    const ws = new (WebSocket as any)(url);
    ws.onmessage = (evt: any) => {
      try {
        const data = JSON.parse(evt?.data);
        onMessage(data);
      } catch {
        onMessage(evt?.data);
      }
    };
    ws.onerror = () => {
      // swallow; caller can retry
    };
    return ws;
  } catch (e) {
    // Environment may not provide WebSocket; return null wrapper
    return null as any;
  }
}
