'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import {
  Camera,
  Check,
  Copy,
  Download,
  ImageUp,
  QrCode,
  ScanLine,
} from 'lucide-react';
import { ModalType, WalletProfile } from '@/lib/wallet-types';

interface QrScanAndPayProps {
  profile: WalletProfile;
  onScanned: (
    targetModal: Extract<ModalType, 'send' | 'payment'>,
    prefill: { recipient: string; note: string }
  ) => void;
}

type QrTab = 'scan' | 'my-qr';

function parseQrPayload(raw: string): {
  targetModal: 'send' | 'payment';
  recipient: string;
  note: string;
} {
  const trimmed = raw.trim();

  if (trimmed.toLowerCase().startsWith('nottpay://pay')) {
    try {
      const parsed = new URL(trimmed);
      const phone = parsed.searchParams.get('phone')?.trim();
      const name = parsed.searchParams.get('name')?.trim();
      if (phone) {
        return {
          targetModal: 'send',
          recipient: phone.slice(0, 32),
          note: name ? `QR Pay to ${name.slice(0, 40)}` : 'NOTTPAY QR transfer',
        };
      }
    } catch {
      // Fallback to generic parsing below
    }
  }

  const compactPhone = trimmed.replace(/[\s\-()]/g, '');
  if (/^(\+?88)?01[3-9]\d{8}$/.test(compactPhone) || /^\+?[1-9]\d{7,14}$/.test(compactPhone)) {
    return {
      targetModal: 'send',
      recipient: compactPhone.slice(0, 24),
      note: 'NOTTPAY QR transfer',
    };
  }

  // Strip control characters and keep plain text merchant reference
  const safeText = trimmed.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 80);
  return {
    targetModal: 'payment',
    recipient: safeText || 'QR Merchant',
    note: 'QR merchant payment',
  };
}

export default function QrScanAndPay({
  profile,
  onScanned,
}: QrScanAndPayProps) {
  const [tab, setTab] = useState<QrTab>('scan');
  const [cameraState, setCameraState] = useState<
    'starting' | 'active' | 'error'
  >('starting');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handledScanRef = useRef(false);

  const rawPhone = profile.rawPhone || profile.phone;
  const qrPayload = `nottpay://pay?phone=${encodeURIComponent(
    rawPhone
  )}&name=${encodeURIComponent(profile.name)}`;

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Generate unique QR code image for the signed-in user
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(qrPayload, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#201735',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  // Manage live camera stream when on Scan QR tab
  useEffect(() => {
    if (tab !== 'scan') {
      stopCamera();
      return;
    }

    let cancelled = false;
    handledScanRef.current = false;

    const startCameraAndScan = async () => {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        if (!cancelled) {
          setCameraState('error');
          setCameraError(
            'Camera is not available in this browser. Upload a QR image below instead.'
          );
        }
        return;
      }

      try {
        setCameraState('starting');
        setCameraError(null);
        setScanError(null);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 720 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const videoEl = videoRef.current;
        if (!videoEl) return;

        videoEl.srcObject = stream;
        await videoEl.play();
        if (cancelled) return;

        setCameraState('active');

        const scanFrame = () => {
          if (cancelled || handledScanRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (
            video &&
            canvas &&
            video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA &&
            video.videoWidth > 0 &&
            video.videoHeight > 0
          ) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
              const code = jsQR(
                imageData.data,
                imageData.width,
                imageData.height,
                { inversionAttempts: 'dontInvert' }
              );
              if (code && code.data) {
                handledScanRef.current = true;
                stopCamera();
                const parsed = parseQrPayload(code.data);
                onScanned(parsed.targetModal, {
                  recipient: parsed.recipient,
                  note: parsed.note,
                });
                return;
              }
            }
          }
          rafRef.current = requestAnimationFrame(scanFrame);
        };

        rafRef.current = requestAnimationFrame(scanFrame);
      } catch {
        if (!cancelled) {
          setCameraState('error');
          setCameraError(
            'Camera access was blocked or unavailable. Allow camera permission or upload a QR image below.'
          );
        }
      }
    };

    void startCameraAndScan();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [tab, onScanned, stopCamera]);

  const handleUploadQrImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setScanError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setScanError('Could not read the selected image.');
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (!code || !code.data) {
          setScanError('No valid QR code found in that image.');
          return;
        }
        stopCamera();
        const parsed = parseQrPayload(code.data);
        onScanned(parsed.targetModal, {
          recipient: parsed.recipient,
          note: parsed.note,
        });
      };
      img.onerror = () => {
        setScanError('Could not load the selected image.');
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `nottpay-qr-${rawPhone.replace(/\W+/g, '')}.png`;
    link.click();
  };

  const handleCopyPayId = async () => {
    try {
      await navigator.clipboard.writeText(rawPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Segmented Switch: Scan QR vs My QR */}
      <div
        role="tablist"
        aria-label="QR options"
        className="grid grid-cols-2 gap-1 rounded-xl bg-[#f4f0fa] p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'scan'}
          onClick={() => setTab('scan')}
          className={`flex min-h-[40px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-bold transition-colors ${
            tab === 'scan'
              ? 'bg-white text-[#6d28d9] shadow-sm'
              : 'text-[#6e6580] hover:text-[#201735]'
          }`}
        >
          <ScanLine className="h-4 w-4" aria-hidden="true" />
          Scan QR
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'my-qr'}
          onClick={() => setTab('my-qr')}
          className={`flex min-h-[40px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-bold transition-colors ${
            tab === 'my-qr'
              ? 'bg-white text-[#6d28d9] shadow-sm'
              : 'text-[#6e6580] hover:text-[#201735]'
          }`}
        >
          <QrCode className="h-4 w-4" aria-hidden="true" />
          My QR
        </button>
      </div>

      {/* Live Camera QR Scanner Tab */}
      {tab === 'scan' && (
        <div className="space-y-3.5">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#180d2c]">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover ${
                cameraState === 'active' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Viewfinder Frame */}
            {cameraState === 'active' && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center p-10"
              >
                <div className="relative h-full w-full rounded-2xl border-2 border-white/75 shadow-[0_0_0_999px_rgba(20,10,38,0.45)]">
                  <span className="absolute -left-0.5 -top-0.5 h-6 w-6 rounded-tl-xl border-l-4 border-t-4 border-[#a78bfa]" />
                  <span className="absolute -right-0.5 -top-0.5 h-6 w-6 rounded-tr-xl border-r-4 border-t-4 border-[#a78bfa]" />
                  <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-xl border-b-4 border-l-4 border-[#a78bfa]" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-xl border-b-4 border-r-4 border-[#a78bfa]" />
                </div>
              </div>
            )}

            {cameraState === 'starting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-6 text-center text-white">
                <Camera className="h-8 w-8 text-[#c4b5fd]" aria-hidden="true" />
                <p className="text-xs font-semibold">Starting camera scanner...</p>
              </div>
            )}

            {cameraState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-6 text-center text-white">
                <Camera className="h-8 w-8 text-[#f472b6]" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-[#e9ddff]">
                  {cameraError}
                </p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-[#6e6580]">
            Point your camera at another user&apos;s NOTTPAY QR code to send money instantly.
          </p>

          {scanError && (
            <p
              role="alert"
              className="rounded-xl bg-[#fff0f5] px-3.5 py-2 text-center text-xs font-semibold text-[#be264c]"
            >
              {scanError}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadQrImage}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#e9e3f1] bg-[#faf8fd] px-4 py-2.5 text-xs font-bold text-[#6d28d9] transition-colors hover:border-[#cfc1ec] hover:bg-[#f2ecfb]"
          >
            <ImageUp className="h-4 w-4" aria-hidden="true" />
            Scan from QR image
          </button>
        </div>
      )}

      {/* User's Own Real Scannable QR Tab */}
      {tab === 'my-qr' && (
        <div className="space-y-4 text-center">
          <div className="rounded-2xl border border-[#eeeaf5] bg-[#faf8fd] p-5">
            <div className="mx-auto flex h-56 w-56 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#f0eaff] bg-white p-2 shadow-sm">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`NOTTPAY QR code for ${profile.name}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <QrCode className="h-24 w-24 text-[#6d28d9]" aria-hidden="true" />
              )}
            </div>

            <p className="mt-3.5 text-sm font-extrabold text-[#201735]">
              {profile.name}
            </p>
            <p className="mt-0.5 font-mono text-xs text-[#6e6580]">
              {profile.phone}
            </p>
          </div>

          <p className="text-xs leading-relaxed text-[#6e6580]">
            Share or scan this QR code from another NOTTPAY wallet to receive money directly into your account.
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopyPayId}
              className="flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#e9e3f1] bg-white px-3 py-2 text-xs font-bold text-[#5c536f] transition-colors hover:bg-[#faf8fd] hover:text-[#201735]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-[#159b70]" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span>Copy number</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-[#7134d5] to-[#a044c8] px-3 py-2 text-xs font-bold text-white shadow-[0_6px_14px_rgba(113,52,213,0.2)] disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Save QR</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
