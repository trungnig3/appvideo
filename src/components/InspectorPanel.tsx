import React, { useState } from 'react';
import {
  Sliders,
  Gauge,
  Volume2,
  ZoomIn,
  Palette,
  Sparkles,
  Flame,
  Scissors,
  Check,
  RotateCcw,
  FastForward,
  Mic,
  Maximize2,
  Sparkle,
} from 'lucide-react';
import { TimelineClip, VideoClip } from '../types/editor';

interface InspectorPanelProps {
  selectedClip: TimelineClip | null;
  sourceClip: VideoClip | undefined;
  onUpdateClip: (updated: Partial<TimelineClip>) => void;
  onAutoAssemble: (customPrompt?: string) => void;
  isAiProcessing: boolean;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedClip,
  sourceClip,
  onUpdateClip,
  onAutoAssemble,
  isAiProcessing,
}) => {
  const [activeTab, setActiveTab] = useState<'speed' | 'audio' | 'zoom' | 'dialogue' | 'color'>('speed');
  const [aiPrompt, setAiPrompt] = useState('');

  if (!selectedClip) {
    return (
      <div className="h-full bg-slate-900 border-l border-slate-800 p-4 flex flex-col items-center justify-center text-center text-slate-500 select-none">
        <Sliders className="w-8 h-8 mb-2 text-slate-600" />
        <span className="text-xs font-semibold text-slate-400">Chưa chọn clip trên timeline</span>
        <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
          Nhấp chuột vào một phân đoạn clip trên thanh timeline để tùy chỉnh tốc độ, âm lượng, zoom khung hình và lời thoại.
        </p>
      </div>
    );
  }

  const durationOnTimeline = (
    (selectedClip.outPoint - selectedClip.inPoint) / (selectedClip.speed || 1.0)
  ).toFixed(2);

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-800 select-none">
      {/* Inspector Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <div className="truncate">
              <div className="text-xs font-bold text-slate-200 truncate">
                {selectedClip.title}
              </div>
              <div className="text-[10px] text-slate-400">
                Thời lượng timeline: <span className="font-mono text-cyan-400 font-bold">{durationOnTimeline}s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-5 gap-1 mt-3 bg-slate-900 p-1 rounded-lg border border-slate-800 text-[10px]">
          <button
            onClick={() => setActiveTab('speed')}
            className={`flex flex-col items-center py-1.5 rounded transition-colors ${
              activeTab === 'speed' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 mb-0.5" />
            <span>Tốc độ</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex flex-col items-center py-1.5 rounded transition-colors ${
              activeTab === 'audio' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 mb-0.5" />
            <span>Âm lượng</span>
          </button>

          <button
            onClick={() => setActiveTab('zoom')}
            className={`flex flex-col items-center py-1.5 rounded transition-colors ${
              activeTab === 'zoom' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5 mb-0.5" />
            <span>Zoom</span>
          </button>

          <button
            onClick={() => setActiveTab('dialogue')}
            className={`flex flex-col items-center py-1.5 rounded transition-colors ${
              activeTab === 'dialogue' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 mb-0.5" />
            <span>Thoại</span>
          </button>

          <button
            onClick={() => setActiveTab('color')}
            className={`flex flex-col items-center py-1.5 rounded transition-colors ${
              activeTab === 'color' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5 mb-0.5" />
            <span>Màu/FX</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {/* TAB 1: SPEED (TĂNG TỐC VIDEO) */}
        {activeTab === 'speed' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Tốc độ phát (Speed)</span>
                <span className="font-mono text-cyan-400 font-bold text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {selectedClip.speed}x
                </span>
              </div>

              <input
                type="range"
                min="0.25"
                max="4.0"
                step="0.05"
                value={selectedClip.speed}
                onChange={(e) => onUpdateClip({ speed: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.25x (Slow-mo)</span>
                <span>1.0x (Chuẩn)</span>
                <span>2.0x (Tua nhanh)</span>
                <span>4.0x</span>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {[0.5, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => onUpdateClip({ speed: spd })}
                    className={`py-1 rounded text-[11px] font-semibold transition-colors ${
                      selectedClip.speed === spd
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* In / Out Cut points */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>Điểm Cắt (Trim Range)</span>
              </span>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-slate-400">Điểm bắt đầu (In):</div>
                  <div className="font-mono text-white font-bold">{selectedClip.inPoint.toFixed(1)}s</div>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <div className="text-slate-400">Điểm kết thúc (Out):</div>
                  <div className="font-mono text-white font-bold">{selectedClip.outPoint.toFixed(1)}s</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIO (TĂNG GIẢM ÂM LƯỢNG) */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Âm lượng (Volume)</span>
                <span className="font-mono text-cyan-400 font-bold text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {selectedClip.volume}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="200"
                step="5"
                value={selectedClip.volume}
                onChange={(e) => onUpdateClip({ volume: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0% (Tắt tiếng)</span>
                <span>100% (Gốc)</span>
                <span>150%</span>
                <span>200% (Tối đa)</span>
              </div>

              {/* Volume presets */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[0, 80, 100, 150].map((vol) => (
                  <button
                    key={vol}
                    onClick={() => onUpdateClip({ volume: vol })}
                    className={`py-1 rounded text-[11px] font-semibold transition-colors ${
                      selectedClip.volume === vol
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {vol}%
                  </button>
                ))}
              </div>
            </div>

            {/* Vocal Enhancement & Audio Ducking */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2.5">
              <span className="font-semibold text-slate-300">Tối ưu giọng nói & Thoại</span>

              <label className="flex items-center justify-between p-2 rounded bg-slate-900/80 cursor-pointer hover:bg-slate-900">
                <div className="space-y-0.5">
                  <div className="font-medium text-slate-200">Kích âm giọng đọc (Vocal Boost)</div>
                  <div className="text-[10px] text-slate-400">Lọc tạp âm và tăng độ rõ câu từ</div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedClip.vocalBoost}
                  onChange={(e) => onUpdateClip({ vocalBoost: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-slate-900/80 cursor-pointer hover:bg-slate-900">
                <div className="space-y-0.5">
                  <div className="font-medium text-slate-200">Audio Ducking</div>
                  <div className="text-[10px] text-slate-400">Tự động giảm nhạc nền khi có lời thoại</div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedClip.audioDucking}
                  onChange={(e) => onUpdateClip({ audioDucking: e.target.checked })}
                  className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: ZOOM & KHUNG HÌNH */}
        {activeTab === 'zoom' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Độ phóng to (Zoom Scale)</span>
                <span className="font-mono text-cyan-400 font-bold text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {selectedClip.zoom}%
                </span>
              </div>

              <input
                type="range"
                min="100"
                max="250"
                step="5"
                value={selectedClip.zoom}
                onChange={(e) => onUpdateClip({ zoom: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-500">
                <span>100% (Khung chuẩn)</span>
                <span>125%</span>
                <span>150%</span>
                <span>250% (Cận cảnh)</span>
              </div>

              {/* Preset Zooms */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[100, 115, 130, 160].map((z) => (
                  <button
                    key={z}
                    onClick={() => onUpdateClip({ zoom: z })}
                    className={`py-1 rounded text-[11px] font-semibold transition-colors ${
                      selectedClip.zoom === z
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {z}%
                  </button>
                ))}
              </div>
            </div>

            {/* Pan Offset X / Y */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Dịch chuyển vị trí (Pan Offset)</span>
                <button
                  onClick={() => onUpdateClip({ panX: 0, panY: 0, zoom: 100 })}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Trục ngang (X):</span>
                    <span className="font-mono text-cyan-400">{selectedClip.panX}%</span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    value={selectedClip.panX}
                    onChange={(e) => onUpdateClip({ panX: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                    <span>Trục dọc (Y):</span>
                    <span className="font-mono text-cyan-400">{selectedClip.panY}%</span>
                  </div>
                  <input
                    type="range"
                    min="-80"
                    max="80"
                    value={selectedClip.panY}
                    onChange={(e) => onUpdateClip({ panY: parseInt(e.target.value, 10) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LỜI THOẠI & PHÂN TÍCH */}
        {activeTab === 'dialogue' && (
          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kịch bản câu thoại</span>
                </span>
                <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 font-bold">
                  AI Analyzed
                </span>
              </div>

              {sourceClip?.dialogueTranscript.map((sent) => {
                const isSelected = selectedClip.dialogueSnippet === sent.text;
                return (
                  <div
                    key={sent.id}
                    onClick={() => {
                      onUpdateClip({
                        inPoint: Math.max(0, sent.startTime - 0.2),
                        outPoint: Math.min(sourceClip.duration, sent.endTime + 0.5),
                        dialogueSnippet: sent.text,
                      });
                    }}
                    className={`p-2 rounded border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/80 text-white'
                        : 'bg-slate-900 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-cyan-400 font-semibold">{sent.speaker}</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-mono text-slate-400">
                          {sent.startTime.toFixed(1)}s - {sent.endTime.toFixed(1)}s
                        </span>
                        {sent.isHook && (
                          <span className="bg-red-500/20 text-red-400 px-1 rounded font-bold">
                            HOOK
                          </span>
                        )}
                        <span className="bg-amber-500/20 text-amber-300 px-1 rounded font-bold">
                          {sent.excitementScore}đ
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] italic">&ldquo;{sent.text}&rdquo;</div>
                  </div>
                );
              })}
            </div>

            {/* Custom AI Prompt Box */}
            <div className="bg-gradient-to-tr from-purple-950/40 to-slate-950 p-3 rounded-lg border border-purple-900/40 space-y-2">
              <span className="font-semibold text-purple-300 flex items-center space-x-1.5">
                <Sparkle className="w-3.5 h-3.5 text-purple-400" />
                <span>Yêu cầu chủ đề cắt thoại 70s</span>
              </span>

              <input
                type="text"
                placeholder="VD: Cắt các câu thoại truyền cảm hứng nhất..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full bg-slate-900 text-slate-200 px-2.5 py-1.5 rounded text-xs border border-purple-900/50 focus:outline-none focus:border-purple-400"
              />

              <button
                onClick={() => onAutoAssemble(aiPrompt)}
                disabled={isAiProcessing}
                className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold shadow transition-colors"
              >
                {isAiProcessing ? 'Đang phân tích...' : 'Lọc & Ghép Lại 70 Giây'}
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: COLOR & TRANSITIONS */}
        {activeTab === 'color' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300">Bộ lọc màu điện ảnh (LUT)</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'normal', name: 'Chuẩn (Normal)' },
                  { id: 'cinematic', name: 'Teal & Orange' },
                  { id: 'vivid', name: 'Vivid Rực Rỡ' },
                  { id: 'warm', name: 'Ấm Áp (Warm)' },
                  { id: 'cool', name: 'Lạnh (Cool)' },
                  { id: 'glitch', name: 'Glitch Cyber' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onUpdateClip({ filter: f.id as any })}
                    className={`py-1.5 px-2 rounded text-[11px] border text-left transition-colors ${
                      selectedClip.filter === f.id
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-300">Hiệu ứng chuyển cảnh (Transition)</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'none', name: 'Cắt trực tiếp (Cut)' },
                  { id: 'crossfade', name: 'Hòa tan (Crossfade)' },
                  { id: 'zoomWhip', name: 'Zoom Chớp (Whip)' },
                  { id: 'dipToBlack', name: 'Nháy Đen (Dip)' },
                ].map((tr) => (
                  <button
                    key={tr.id}
                    onClick={() => onUpdateClip({ transition: tr.id as any })}
                    className={`py-1.5 px-2 rounded text-[11px] border text-left transition-colors ${
                      selectedClip.transition === tr.id
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {tr.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
