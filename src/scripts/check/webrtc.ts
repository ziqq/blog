import { WEBRTC_TIMEOUT_MS } from './config';
import { isPublicIp } from './trace';
import type { WebRtcData, WebRtcResult } from './types';

function add(values: Set<string>, value: string): void {
  if (isPublicIp(value)) values.add(value);
}

export async function checkWebRtc(signal: AbortSignal): Promise<WebRtcResult> {
  if (signal.aborted) return { status: 'cancelled' };
  if (typeof RTCPeerConnection === 'undefined') return { status: 'unavailable' };

  const connection = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  });
  const publicIps = new Set<string>();
  const publicHostV6 = new Set<string>();
  let localCount = 0;
  let mdnsCount = 0;
  let timedOut = false;

  try {
    const gathered = new Promise<void>((resolve) => {
      const timer = window.setTimeout(() => {
        timedOut = true;
        resolve();
      }, WEBRTC_TIMEOUT_MS);
      const abort = () => {
        window.clearTimeout(timer);
        resolve();
      };
      signal.addEventListener('abort', abort, { once: true });

      connection.onicecandidate = (event) => {
        if (!event.candidate) {
          window.clearTimeout(timer);
          signal.removeEventListener('abort', abort);
          resolve();
          return;
        }

        const fields = event.candidate.candidate.split(' ');
        const address = (event.candidate.address || fields[4] || '').toLowerCase();
        const type = event.candidate.type || fields[7] || '';
        if (!address) return;

        if (address.endsWith('.local')) {
          mdnsCount += 1;
        } else if (type === 'srflx' || type === 'prflx') {
          add(publicIps, address);
        } else if (type === 'host') {
          if (address.includes(':') && isPublicIp(address)) add(publicHostV6, address);
          else localCount += 1;
        }
      };
    });

    connection.createDataChannel('network-check');
    await connection.setLocalDescription(await connection.createOffer());
    await gathered;

    if (signal.aborted) return { status: 'cancelled' };

    const data: WebRtcData = {
      publicIps: [...publicIps],
      publicHostV6: [...publicHostV6],
      localCount,
      mdnsCount,
    };

    return { status: timedOut ? 'timeout' : 'success', data };
  } catch {
    return signal.aborted ? { status: 'cancelled' } : { status: 'unavailable' };
  } finally {
    connection.onicecandidate = null;
    connection.close();
  }
}
