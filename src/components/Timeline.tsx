import React, { useRef, useState, useEffect } from 'react';
import {
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
  Magnet,
  Layers,
  Music,
  Type,
  Volume2,
  Sparkles,
  FastForward,
} from 'lucide-react';
import { TimelineClip, VideoClip } from '../types/editor';

interface TimelineProps {
  timelineClips: TimelineClip[];
  allSourceClips: VideoClip[];
  currentTime: number;
  totalDuration: number;
  selectedClipId: string | null;
  onSelectClip: (clip: TimelineClip) => void;
  onSeek: (time: number) => void;
  onSplitClip: () => void;
  onDeleteClip: (instanceId: string) => void;
  onUpdateClipTrim: (instanceId: string, inPoint: number, outPoint: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  timelineClips,
  allSourceClips,
  currentTime,
  totalDuration,
  selectedClipId,
  onSelectClip,
  onSeek,
  onSplitClip,
  onDeleteClip,
  onUpdateClipTrim,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timelineZoom, setTimelineZoom] = useState(12); // pixels per second
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [trimmingState, setTrimmingState] = useState<{
    instanceId: string;
    type: 'in' | 'out';
    startX: number;
    initialIn: number;
    initialOut: number;
    sourceDur: number;
    speed: number;
  } | null>(null);

  const clipMap = React.useMemo(() => new Map(allSourceClips.map((c) => [c.id, c])), [allSourceClips]);

  // Target 70s marker position in px
  const target70sPx = 70.0 * timelineZoom;
  const playheadPx = currentTime * timelineZoom;
  const timelineWidthPx = Math.max(containerRef.current?.clientWidth || 800, 75 * timelineZoom, totalDuration * timelineZoom + 200);

  // Time ruler ticks (every 5 seconds)
  const timeRulerTicks: number[] = [];
  for (let s = 0; s <= Math.max(80, totalDuration + 10); s += 5) {
    timeRulerTicks.push(s);
  }

  // Handle Scrubbing
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (trimmingState) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    const newSec = Math.max(0, clickX / timelineZoom);
    onSeek(newSec);
    setIsScrubbing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left + containerRef.current.scrollLeft;
        const newSec = Math.max(0, mouseX / timelineZoom);
        onSeek(newSec);
      } else if (trimmingState) {
        const deltaX = e.clientX - trimmingState.startX;
        const deltaSec = (deltaX / timelineZoom) * trimmingState.speed;
        if (trimmingState.type === 'in') {
          const newIn = Math.max(0, Math.min(trimmingState.initialOut - 0.5, trimmingState.initialIn + deltaSec));
          onUpdateClipTrim(trimmingState.instanceId, newIn, trimmingState.initialOut);
        } else {
          const newOut = Math.min(
            trimmingState.sourceDur,
            Math.max(trimmingState.initialIn + 0.5, trimmingState.initialOut + deltaSec)
          );
          onUpdateClipTrim(trimmingState.instanceId, trimmingState.initialIn, newOut);
        }
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      setTrimmingState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isScrubbing, trimmingState, timelineZoom, onSeek, onUpdateClipTrim]);

  // Compute start position for each clip on timeline
  let accumulatedSec = 0;
  const clipsWithPositions = timelineClips.map((clip) => {
    const clipDuration = (clip.outPoint - clip.inPoint) / (clip.speed || 1.0);
    const startSec = accumulatedSec;
    accumulatedSec += clipDuration;
    return {
      clip,
      startSec,
      clipDuration,
      leftPx: startSec * timelineZoom,
      widthPx: Math.max(20, clipDuration * timelineZoom),
    };
  });

  return (
    <div className="h-full flex flex-col bg-slate-950 border-t border-slate-800 select-none">
      {/* Timeline Toolbar */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/70 text-xs">
        {/* Left tools */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onSplitClip}
            className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
            title="Tách clip tại vị trí con trỏ (Ctrl+B / S)"
          >
            <Scissors className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tách Clip (S)</span>
          </button>

          {selectedClipId && (
            <button
              onClick={() => onDeleteClip(selectedClipId)}
              className="flex items-center space-x-1 px-2 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded border border-red-900/50 transition-colors"
              title="Xóa clip đang chọn khỏi timeline (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Target 70s reminder indicator */}
          <div className="flex items-center space-x-1.5 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-900/50 px-2 py-0.5 rounded">
            <span>🎯 Vạch đích: 01:10 (70.0s)</span>
          </div>
        </div>

        {/* Right tools: Zoom */}
        <div className="flex items-center space-x-2 text-slate-400">
          <button
            onClick={() => setTimelineZoom((z) => Math.max(4, z - 2))}
            className="p-1 hover:text-white rounded"
            title="Thu nhỏ timeline"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[10px] font-mono w-10 text-center">{timelineZoom}x</span>

          <button
            onClick={() => setTimelineZoom((z) => Math.min(30, z + 2))}
            className="p-1 hover:text-white rounded"
            title="Phóng to timeline"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Track Workspace & Ruler */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative bg-slate-950"
      >
        <div
          className="relative h-full"
          style={{ width: `${timelineWidthPx}px` }}
          onMouseDown={handleTimelineMouseDown}
        >
          {/* Time Ruler Bar (Top 22px) */}
          <div className="h-6 border-b border-slate-800 bg-slate-900/90 relative">
            {timeRulerTicks.map((sec) => (
              <div
                key={sec}
                className="absolute top-0 bottom-0 border-l border-slate-800 flex flex-col justify-between pl-1"
                style={{ left: `${sec * timelineZoom}px` }}
              >
                <span className="text-[9px] font-mono text-slate-500">
                  {sec === 70 ? '01:10 ★' : `${sec}s`}
                </span>
                <div className="w-px h-1.5 bg-slate-700" />
              </div>
            ))}
          </div>

          {/* TARGET 70S VERTICAL GUIDE LINE (Golden Neon line at exactly 70.0s) */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
            style={{ left: `${target70sPx}px` }}
          >
            <div className="bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
              01:10 (70s)
            </div>
            <div className="w-0.5 flex-1 bg-gradient-to-b from-amber-400 via-amber-500 to-transparent shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          </div>

          {/* SCRUBBING PLAYHEAD */}
          <div
            className="absolute top-0 bottom-0 z-40 pointer-events-none flex flex-col items-center"
            style={{ left: `${playheadPx}px` }}
          >
            <div className="w-3 h-3 bg-cyan-400 rotate-45 -translate-y-1 shadow-md shadow-cyan-400/50" />
            <div className="w-0.5 flex-1 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          </div>

          {/* TRACK 1: Video Track (V1) */}
          <div className="h-20 mt-2 mx-1 relative bg-slate-900/40 border border-slate-800/80 rounded-lg overflow-hidden flex items-center">
            <div className="absolute left-2 top-2 z-10 flex items-center space-x-1 text-[10px] font-bold text-slate-500 bg-slate-950/80 px-1 rounded">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>V1 • VIDEO & CẢNH CẮT</span>
            </div>

            {clipsWithPositions.map(({ clip, leftPx, widthPx, clipDuration }) => {
              const source = clipMap.get(clip.clipId);
              const isSelected = selectedClipId === clip.instanceId;

              return (
                <div
                  key={clip.instanceId}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectClip(clip);
                  }}
                  style={{
                    left: `${leftPx}px`,
                    width: `${widthPx}px`,
                  }}
                  className={`absolute top-1 bottom-1 rounded-md border text-xs overflow-hidden cursor-pointer transition-shadow shadow-sm flex flex-col justify-between p-1.5 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/70 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                      : 'border-slate-700 bg-slate-800/90 hover:border-slate-500'
                  }`}
                >
                  {/* Clip Header: Title & Badges */}
                  <div className="flex items-center justify-between pointer-events-none">
                    <span className="font-semibold text-slate-200 truncate text-[11px]">
                      {clip.title}
                    </span>
                    <div className="flex items-center space-x-1 shrink-0 ml-1">
                      {clip.speed !== 1.0 && (
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded font-mono font-bold">
                          {clip.speed}x
                        </span>
                      )}
                      {clip.zoom > 100 && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 rounded font-mono">
                          {clip.zoom}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dialogue snippet in timeline */}
                  <div className="text-[10px] text-slate-300 truncate italic opacity-90 pointer-events-none">
                    &ldquo;{clip.dialogueSnippet || source?.bestCutRecommendation.highlightText}&rdquo;
                  </div>

                  {/* Audio Waveform Simulation Bar */}
                  <div className="h-2 flex items-center space-x-0.5 opacity-60 pointer-events-none">
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-cyan-400 rounded-full"
                        style={{ height: `${20 + Math.sin(idx * 0.7) * 70}%` }}
                      />
                    ))}
                  </div>

                  {/* Left Trim Handle (In-Point) */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setTrimmingState({
                        instanceId: clip.instanceId,
                        type: 'in',
                        startX: e.clientX,
                        initialIn: clip.inPoint,
                        initialOut: clip.outPoint,
                        sourceDur: clip.sourceDuration,
                        speed: clip.speed || 1.0,
                      });
                    }}
                    className="absolute left-0 top-0 bottom-0 w-2.5 bg-cyan-500/30 hover:bg-cyan-400 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                    title="Kéo để chỉnh điểm bắt đầu (In-Point)"
                  />

                  {/* Right Trim Handle (Out-Point) */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setTrimmingState({
                        instanceId: clip.instanceId,
                        type: 'out',
                        startX: e.clientX,
                        initialIn: clip.inPoint,
                        initialOut: clip.outPoint,
                        sourceDur: clip.sourceDuration,
                        speed: clip.speed || 1.0,
                      });
                    }}
                    className="absolute right-0 top-0 bottom-0 w-2.5 bg-cyan-500/30 hover:bg-cyan-400 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                    title="Kéo để chỉnh điểm kết thúc (Out-Point)"
                  />
                </div>
              );
            })}
          </div>

          {/* TRACK 2: Dialogue Audio Track (A1) */}
          <div className="h-10 mt-1 mx-1 relative bg-slate-900/30 border border-slate-800/60 rounded-md overflow-hidden flex items-center">
            <div className="absolute left-2 top-1.5 z-10 flex items-center space-x-1 text-[9px] font-bold text-slate-500 bg-slate-950/80 px-1 rounded">
              <Volume2 className="w-2.5 h-2.5 text-blue-400" />
              <span>A1 • LỜI THOẠI & GIỌNG NÓI</span>
            </div>

            {clipsWithPositions.map(({ clip, leftPx, widthPx }) => (
              <div
                key={`audio_${clip.instanceId}`}
                style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                className="absolute top-1 bottom-1 bg-blue-950/40 border border-blue-900/50 rounded flex items-center px-2 pointer-events-none"
              >
                <div className="h-3 w-full flex items-center space-x-0.5 opacity-70">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-blue-400 rounded-sm"
                      style={{ height: `${30 + (Math.sin(i * 0.8) + 1) * 35}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* TRACK 3: Subtitles / Phụ đề tự động (S1) */}
          <div className="h-8 mt-1 mx-1 relative bg-slate-900/20 border border-slate-800/40 rounded-md overflow-hidden flex items-center">
            <div className="absolute left-2 top-1 z-10 flex items-center space-x-1 text-[9px] font-bold text-slate-500 bg-slate-950/80 px-1 rounded">
              <Type className="w-2.5 h-2.5 text-yellow-400" />
              <span>S1 • PHỤ ĐỀ TỰ ĐỘNG BÙNG NỔ</span>
            </div>

            {clipsWithPositions.map(({ clip, leftPx, widthPx }) => (
              <div
                key={`sub_${clip.instanceId}`}
                style={{ left: `${leftPx}px`, width: `${widthPx}px` }}
                className="absolute top-1 bottom-1 bg-yellow-950/30 border border-yellow-900/40 rounded flex items-center px-2 pointer-events-none truncate text-[9px] text-yellow-300 font-bold"
              >
                Tự động tạo phụ đề
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
