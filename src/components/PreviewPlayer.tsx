import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Crop,
  ShieldAlert,
  Flame,
  ZoomIn,
} from 'lucide-react';
import { TimelineClip, VideoClip, Project } from '../types/editor';
import { renderFrameToCanvas } from '../utils/gpuRenderer';

interface PreviewPlayerProps {
  timelineClips: TimelineClip[];
  allSourceClips: VideoClip[];
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  selectedClip: TimelineClip | null;
  project: Project;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  timelineClips,
  allSourceClips,
  currentTime,
  totalDuration,
  isPlaying,
  onPlayPause,
  onSeek,
  selectedClip,
  project,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [audioMeterLevel, setAudioMeterLevel] = useState({ left: 75, right: 70 });

  const clipMap = React.useMemo(() => new Map(allSourceClips.map((c) => [c.id, c])), [allSourceClips]);

  // Find active clip at currentTime
  const activeClipInfo = React.useMemo(() => {
    let accumulated = 0;
    for (let i = 0; i < timelineClips.length; i++) {
      const c = timelineClips[i];
      const clipDuration = (c.outPoint - c.inPoint) / (c.speed || 1.0);
      if (currentTime >= accumulated && currentTime < accumulated + clipDuration) {
        return {
          clip: c,
          timeWithinClip: (currentTime - accumulated) * (c.speed || 1.0),
          clipIndex: i,
        };
      }
      accumulated += clipDuration;
    }
    return timelineClips.length > 0
      ? { clip: timelineClips[timelineClips.length - 1], timeWithinClip: 0, clipIndex: timelineClips.length - 1 }
      : null;
  }, [timelineClips, currentTime]);

  // Render canvas frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (!activeClipInfo || timelineClips.length === 0) {
      // Empty slate
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Timeline chưa có video clip', width / 2, height / 2 - 10);
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText('Nhấn "Tự Động Cắt 70s" hoặc chọn clip từ kho bên trái', width / 2, height / 2 + 15);
      return;
    }

    const { clip, timeWithinClip } = activeClipInfo;
    const source = clipMap.get(clip.clipId);

    renderFrameToCanvas(
      ctx,
      width,
      height,
      clip,
      source,
      timeWithinClip,
      currentTime,
      {
        burnSubtitles: project.subtitlesEnabled,
        subtitleStyle: project.subtitleStyle,
      }
    );

    // Audio VU simulation
    if (isPlaying) {
      const vol = isMuted ? 0 : clip.volume;
      const baseL = Math.min(100, (vol / 100) * (65 + Math.random() * 30));
      const baseR = Math.min(100, (vol / 100) * (60 + Math.random() * 35));
      setAudioMeterLevel({ left: baseL, right: baseR });
    }
  }, [activeClipInfo, currentTime, isPlaying, isMuted, project, clipMap, timelineClips]);

  // Format timecode (00:00.0)
  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const isVertical = project.aspectRatio === '9:16';

  return (
    <div className="h-full flex flex-col bg-slate-950 select-none">
      {/* Top Preview Controls Bar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/60 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-cyan-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {formatTimecode(currentTime)}
          </span>
          <span className="text-slate-500">/</span>
          <span className="font-mono text-slate-400 font-medium">
            {formatTimecode(totalDuration)}
          </span>
          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            Target 70s
          </span>
        </div>

        {/* Framing & Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSafeZones(!showSafeZones)}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
              showSafeZones
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Bật/Tắt khung an toàn TikTok / Reels UI"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Khung SafeZone</span>
          </button>

          <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
            <Crop className="w-3 h-3 text-slate-500" />
            <span className="font-semibold text-slate-300">{project.aspectRatio}</span>
          </div>

          {activeClipInfo && (
            <div className="flex items-center space-x-1.5 text-[11px] bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
              <ZoomIn className="w-3 h-3 text-cyan-400" />
              <span>Zoom: {activeClipInfo.clip.zoom}%</span>
              <span className="text-slate-500">|</span>
              <span>Speed: {activeClipInfo.clip.speed}x</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Canvas Player Container */}
      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-radial from-slate-900 to-slate-950">
        <div
          className={`relative rounded-xl overflow-hidden shadow-2xl border border-slate-800/80 bg-black flex items-center justify-center ${
            isVertical ? 'aspect-[9/16] h-[92%]' : 'aspect-[16/9] w-[90%]'
          }`}
        >
          {/* Real GPU Accelerated Canvas */}
          <canvas
            ref={canvasRef}
            width={isVertical ? 720 : 1280}
            height={isVertical ? 1280 : 720}
            className="w-full h-full object-contain"
          />

          {/* TikTok / Shorts UI Safe Margin Overlays */}
          {showSafeZones && isVertical && (
            <div className="absolute inset-0 pointer-events-none border border-cyan-500/30">
              {/* Right side interaction bar overlay */}
              <div className="absolute right-2 bottom-24 flex flex-col items-center space-y-3 opacity-60">
                <div className="w-8 h-8 rounded-full border border-dashed border-red-400/80 flex items-center justify-center text-[9px] text-red-300">
                  Like
                </div>
                <div className="w-8 h-8 rounded-full border border-dashed border-red-400/80 flex items-center justify-center text-[9px] text-red-300">
                  Cmt
                </div>
                <div className="w-8 h-8 rounded-full border border-dashed border-red-400/80 flex items-center justify-center text-[9px] text-red-300">
                  Share
                </div>
              </div>
              {/* Bottom caption zone */}
              <div className="absolute bottom-2 left-3 right-16 h-16 border-t border-dashed border-amber-400/50 flex items-center text-[10px] text-amber-300/80 px-2">
                [Vùng Tiêu đề & Caption TikTok / Reels]
              </div>
            </div>
          )}

          {/* Active dialogue pill floating on top */}
          {activeClipInfo?.clip.dialogueSnippet && (
            <div className="absolute top-3 left-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white flex items-center justify-between shadow-lg">
              <div className="truncate mr-2 font-medium">
                <span className="text-cyan-400 mr-1.5 font-bold">Thoại:</span>
                &ldquo;{activeClipInfo.clip.dialogueSnippet}&rdquo;
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                Clip #{activeClipInfo.clipIndex + 1}
              </span>
            </div>
          )}
        </div>

        {/* Audio VU Meter (Right Side) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-lg flex items-center space-x-1 shadow-lg">
          {/* Left channel */}
          <div className="w-1.5 h-28 bg-slate-950 rounded-full overflow-hidden flex flex-col justify-end">
            <div
              className="w-full rounded-full transition-all duration-75"
              style={{
                height: `${audioMeterLevel.left}%`,
                background:
                  audioMeterLevel.left > 85
                    ? '#ef4444'
                    : audioMeterLevel.left > 65
                    ? '#f59e0b'
                    : '#10b981',
              }}
            />
          </div>
          {/* Right channel */}
          <div className="w-1.5 h-28 bg-slate-950 rounded-full overflow-hidden flex flex-col justify-end">
            <div
              className="w-full rounded-full transition-all duration-75"
              style={{
                height: `${audioMeterLevel.right}%`,
                background:
                  audioMeterLevel.right > 85
                    ? '#ef4444'
                    : audioMeterLevel.right > 65
                    ? '#f59e0b'
                    : '#10b981',
              }}
            />
          </div>
          <div className="text-[8px] text-slate-500 flex flex-col justify-between h-28 font-mono">
            <span>0</span>
            <span>-6</span>
            <span>-12</span>
            <span>-24</span>
          </div>
        </div>
      </div>

      {/* Transport Controls Bar */}
      <div className="h-12 border-t border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between">
        {/* Left: Quick Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSeek(0)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Quay lại đầu timeline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSeek(Math.max(0, currentTime - 1))}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Lùi 1 giây"
          >
            <SkipBack className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Big Play/Pause Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onPlayPause}
            className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-transform active:scale-95"
            title="Phát / Tạm dừng (Space)"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Right: Next & Volume Mute */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSeek(Math.min(totalDuration, currentTime + 1))}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Tiến 1 giây"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
