export type SportType = 'court_volleyball' | 'beach_volleyball';

export type CameraPositionId =
  | 'pos_fundo_cima'
  | 'pos_fundo_baixo'
  | 'pos_rede_esq'
  | 'pos_rede_dir'
  | 'pos_lateral';

export interface CameraPositionConfig {
  id: CameraPositionId;
  label: string;
  shortLabel: string;
  defaultAngle: string;
  description: string;
  suggestedAction: string;
}

export interface CameraDevice {
  id: string;
  name: string;
  positionId: CameraPositionId | null;
  xPercent: number; // 0 to 100% on court board
  yPercent: number; // 0 to 100% on court board
  rotationDegrees: number; // 0 to 360 degrees orientation of lens
  fovAngle?: number; // Cone angle, e.g. 50 deg
  customLabel?: string;
  status: 'connected' | 'recording' | 'syncing' | 'transferring' | 'offline';
  batteryLevel: number;
  fps: number;
  resolution: '720p' | '1080p';
  bufferSeconds: number; // Max 40s
  isWebcam: boolean;
  streamTrack?: MediaStreamTrack | null;
  lensType: 'standard' | 'wide' | 'telephoto';
}

export type SubscriptionTier = 'free' | 'pro';

export interface SavedHighlight {
  id: string;
  title: string;
  sport: SportType;
  timestamp: string;
  duration: number; // 40s
  camerasCount: number;
  thumbnail: string;
  fileSizeMb: number;
  resolution: '720p' | '1080p';
  hasWatermark: boolean;
  tags: string[];
}

export type VarVerdict =
  | 'IN'
  | 'OUT'
  | 'TOUCH_BLOCK'
  | 'TOUCH_NET'
  | 'INVASION'
  | 'CONFIRMED'
  | 'OVERTURNED';

export interface VarVerdictDetail {
  id: VarVerdict;
  title: string;
  color: string;
  iconName: string;
  description: string;
}
