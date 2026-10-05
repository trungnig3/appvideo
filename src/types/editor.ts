export interface DialogueSentence {
  id: string;
  startTime: number; // in seconds
  endTime: number;
  text: string;
  speaker: string;
  sentiment: 'positive' | 'dramatic' | 'funny' | 'inspirational' | 'action' | 'neutral';
  excitementScore: number; // 0 - 100
  isHook: boolean;
  isPunchline: boolean;
}

export interface VideoClip {
  id: string;
  filename: string;
  title: string;
  category: 'Drama' | 'Vlog' | 'Podcast' | 'Review' | 'Comedy' | 'Tech' | 'Action' | 'Lifestyle';
  duration: number; // in seconds, typically 6s to 45s
  resolution: string; // e.g., '1080x1920'
  fps: number;
  fileSizeMb: number;
  thumbnailColor: string;
  videoUrl?: string; // blob url or synthetic visual pattern
  dialogueTranscript: DialogueSentence[];
  bestCutRecommendation: {
    inPoint: number;
    outPoint: number;
    reason: string;
    score: number;
    highlightText: string;
  };
  tags: string[];
}

export interface TimelineClip {
  instanceId: string; // unique on timeline
  clipId: string;
  title: string;
  sourceDuration: number;
  inPoint: number; // seconds
  outPoint: number; // seconds
  
  // Custom Controls required by user:
  speed: number; // 0.25 to 4.0
  volume: number; // 0 to 200 (percent)
  zoom: number; // 100 to 250 (percent)
  panX: number; // -100 to 100 (%)
  panY: number; // -100 to 100 (%)
  
  // Enhancements
  filter: 'normal' | 'cinematic' | 'vivid' | 'bw' | 'warm' | 'cool' | 'glitch';
  transition: 'none' | 'crossfade' | 'zoomWhip' | 'glitch' | 'dipToBlack';
  transitionDuration: number;
  audioDucking: boolean;
  vocalBoost: boolean;
  colorGrade: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  dialogueSnippet?: string;
  highlightReason?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  targetDuration: number; // 70.0 seconds
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  resolutionPreset: '1080x1920' | '1920x1080' | '2160x3840' | '1080x1080';
  fps: 30 | 60;
  timelineClips: TimelineClip[];
  subtitlesEnabled: boolean;
  subtitleStyle: 'tiktok-bold' | 'minimal-modern' | 'cinema-yellow' | 'box-badge';
  bgmTrack: {
    enabled: boolean;
    title: string;
    volume: number;
    genre: 'Energetic Phonk' | 'Cinematic Bass' | 'Lofi Chill' | 'Upbeat Vlog';
  };
  gpuEngine: 'nvenc' | 'cuda' | 'metal' | 'webgl' | 'prefer-hardware';
}

export interface ExportSettings {
  format: 'mp4' | 'webm' | 'prores' | 'gif';
  resolution: '1080x1920' | '1920x1080' | '2160x3840' | '1080x1080';
  fps: 30 | 60;
  bitrateMbps: number;
  hardwareAcceleration: boolean;
  burnSubtitles: boolean;
  normalizeAudio: boolean;
}

export interface RenderProgress {
  isRendering: boolean;
  currentFrame: number;
  totalFrames: number;
  percent: number;
  fps: number;
  elapsedSec: number;
  etaSec: number;
  currentStage: string;
  completedBlobUrl: string | null;
  outputSizeMb: number;
}
