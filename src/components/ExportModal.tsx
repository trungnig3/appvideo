import React, { useState } from 'react';
import {
  X,
  Download,
  Cpu,
  Film,
  CheckCircle2,
  Sparkles,
  Settings2,
  HardDrive,
  Gauge,
  Layers,
  FileVideo,
} from 'lucide-react';
import { TimelineClip, VideoClip, ExportSettings, RenderProgress } from '../types/editor';
import { exportVideoWithGpu } from '../utils/gpuRenderer';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  timelineClips: TimelineClip[];
  allSourceClips: VideoClip[];
  totalDuration: number;
  gpuInfo: {
    name: string;
    vendor: string;
    tier: string;
    supportedEncoders: string[];
  };
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  timelineClips,
  allSourceClips,
  totalDuration,
  gpuInfo,
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'mp4',
    resolution: '1080x1920',
    fps: 30,
    bitrateMbps: 16,
    hardwareAcceleration: true,
    burnSubtitles: true,
    normalizeAudio: true,
  });

  const [progress, setProgress] = useState<RenderProgress>({
    isRendering: false,
    currentFrame: 0,
    totalFrames: 0,
    percent: 0,
    fps: 0,
    elapsedSec: 0,
    etaSec: 0,
    currentStage: '',
    completedBlobUrl: null,
    outputSizeMb: 0,
  });

  if (!isOpen) return null;

  const handleStartExport = async () => {
    try {
      await exportVideoWithGpu(
        timelineClips,
        allSourceClips,
        settings,
        (prog) => setProgress(prog)
      );
    } catch (e: any) {
      alert('Lỗi xuất video: ' + e.message);
      setProgress((p) => ({ ...p, isRendering: false }));
    }
  };

  const handleDownload = () => {
    if (!progress.completedBlobUrl) return;
    const a = document.createElement('a');
    a.href = progress.completedBlobUrl;
    a.download = `CinePro_Highlights_70s_${Date.now()}.${settings.format === 'prores' ? 'mov' : settings.format}`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Xuất Video Thành Phẩm (Render GPU)</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono">
                  {totalDuration.toFixed(1)}s
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Tăng tốc phần cứng GPU • Đa định dạng • Chuẩn 01:10
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={progress.isRendering}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Hardware Detection Badge */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  {gpuInfo.name}
                </div>
                <div className="text-[11px] text-slate-400">
                  Công nghệ: <span className="text-emerald-400 font-medium">{gpuInfo.tier}</span> • Phần cứng cục bộ máy tính
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                GPU NVENC/METAL SẴN SÀNG
              </span>
            </div>
          </div>

          {/* Configuration Settings */}
          {!progress.isRendering && !progress.completedBlobUrl && (
            <div className="space-y-4">
              {/* Format selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Định Dạng Xuất File (Format)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'mp4', name: 'MP4 (H.264)', desc: 'Tương thích cao nhất, TikTok, YT' },
                    { id: 'webm', name: 'WebM (VP9)', desc: 'Nén cực nhẹ, tối ưu web' },
                    { id: 'prores', name: 'ProRes (MOV)', desc: 'Chất lượng phòng dựng Master' },
                    { id: 'gif', name: 'GIF Highlight', desc: 'Ảnh động vòng lặp nhẹ' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setSettings({ ...settings, format: fmt.id as any })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        settings.format === fmt.id
                          ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{fmt.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution & FPS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Độ Phân Giải (Resolution)
                  </label>
                  <select
                    value={settings.resolution}
                    onChange={(e) => setSettings({ ...settings, resolution: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="1080x1920">1080x1920 (9:16 Dọc TikTok / Shorts / Reels)</option>
                    <option value="1920x1080">1920x1080 (16:9 Ngang YouTube Standard)</option>
                    <option value="2160x3840">2160x3840 (4K Ultra HD Dọc)</option>
                    <option value="1080x1080">1080x1080 (1:1 Vuông Instagram / Feed)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Tốc Độ Khung Hình (Framerate)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[30, 60].map((f) => (
                      <button
                        key={f}
                        onClick={() => setSettings({ ...settings, fps: f as any })}
                        className={`py-2 rounded-lg border text-xs font-bold transition-colors ${
                          settings.fps === f
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {f} FPS {f === 60 ? 'Mượt Mà' : 'Chuẩn'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bitrate & Hardware Toggles */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Chất lượng Bitrate:</span>
                    <span className="font-mono text-cyan-400 font-bold">{settings.bitrateMbps} Mbps</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="40"
                    step="2"
                    value={settings.bitrateMbps}
                    onChange={(e) => setSettings({ ...settings, bitrateMbps: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>6 Mbps (Nhẹ)</span>
                    <span>16 Mbps (Rất Đẹp)</span>
                    <span>40 Mbps</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-300 font-medium">Render GPU Tăng Tốc</span>
                    <input
                      type="checkbox"
                      checked={settings.hardwareAcceleration}
                      onChange={(e) => setSettings({ ...settings, hardwareAcceleration: e.target.checked })}
                      className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-slate-300 font-medium">Ghim Phụ Đề Tự Động</span>
                    <input
                      type="checkbox"
                      checked={settings.burnSubtitles}
                      onChange={(e) => setSettings({ ...settings, burnSubtitles: e.target.checked })}
                      className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Live Render Progress */}
          {progress.isRendering && (
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-300 flex items-center space-x-1.5">
                  <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>{progress.currentStage}</span>
                </span>
                <span className="font-mono text-cyan-400 font-bold text-sm">
                  {progress.percent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-100"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800 font-mono">
                <div>
                  <div className="text-[10px] text-slate-500">Khung hình</div>
                  <div className="text-slate-200 font-bold">
                    {progress.currentFrame}/{progress.totalFrames}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Tốc độ Render</div>
                  <div className="text-emerald-400 font-bold">{progress.fps} FPS</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Đã chạy</div>
                  <div className="text-slate-200 font-bold">{progress.elapsedSec}s</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Còn lại (ETA)</div>
                  <div className="text-amber-400 font-bold">{progress.etaSec}s</div>
                </div>
              </div>
            </div>
          )}

          {/* Completion Success View */}
          {progress.completedBlobUrl && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-950/50 via-slate-950 to-slate-900 border border-emerald-500/50 space-y-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white">Xuất Video 70s Hoàn Tất!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Video đã được render bằng GPU cục bộ với độ sắc nét tuyệt đối, đầy đủ hiệu ứng âm lượng, tốc độ và zoom.
                </p>
              </div>

              <div className="inline-flex items-center space-x-3 text-xs bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 font-mono">
                <span>Dung lượng: <strong className="text-emerald-400">{progress.outputSizeMb} MB</strong></span>
                <span className="text-slate-600">|</span>
                <span>Thời gian: <strong className="text-white">{progress.elapsedSec}s</strong></span>
                <span className="text-slate-600">|</span>
                <span>Định dạng: <strong className="text-cyan-400 uppercase">{settings.format}</strong></span>
              </div>

              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={handleDownload}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/25 transition-transform active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải Video Về Máy Ngay</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!progress.completedBlobUrl && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Tổng thời lượng timeline: <strong className="text-cyan-400">{totalDuration.toFixed(1)}s</strong> (Chuẩn 1:10)
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                disabled={progress.isRendering}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                Hủy
              </button>

              <button
                onClick={handleStartExport}
                disabled={progress.isRendering || timelineClips.length === 0}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
              >
                <Cpu className="w-4 h-4" />
                <span>Bắt Đầu Render GPU</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
