import React from 'react';
import {
  Film,
  Sparkles,
  Download,
  Cpu,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { Project } from '../types/editor';

interface TopBarProps {
  currentProject: Project;
  totalTimelineDuration: number;
  gpuInfo: {
    name: string;
    tier: string;
    vendor: string;
  };
  onOpenProjectManager: () => void;
  onAutoAssemble: () => void;
  onOpenExport: () => void;
  onSaveProject: () => void;
  isAiProcessing: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentProject,
  totalTimelineDuration,
  gpuInfo,
  onOpenProjectManager,
  onAutoAssemble,
  onOpenExport,
  onSaveProject,
  isAiProcessing,
}) => {
  const target = currentProject.targetDuration || 70.0;
  const diff = Math.abs(totalTimelineDuration - target);
  const isExactTarget = diff <= 0.5 && totalTimelineDuration > 0;
  const isClose = diff <= 3.0 && totalTimelineDuration > 0;

  const formatSec = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${mins.toString().padStart(2, '0')}:${parseFloat(s) < 10 ? '0' : ''}${s}s`;
  };

  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Film className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-white tracking-wide text-sm">CinePro Studio</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO 70S
              </span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Project Selector Trigger */}
        <button
          onClick={onOpenProjectManager}
          className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-slate-800/80 border border-slate-800 transition-colors text-left group"
          title="Quản lý & Chuyển đổi dự án"
        >
          <FolderKanban className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300" />
          <div className="max-w-[200px] truncate text-xs font-medium text-slate-200">
            {currentProject.name}
          </div>
          <span className="text-[10px] text-slate-500 bg-slate-900 px-1 py-0.5 rounded">
            {currentProject.aspectRatio}
          </span>
        </button>

        <button
          onClick={onSaveProject}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded transition-colors"
          title="Lưu dự án hiện tại"
        >
          <Save className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target Duration 1:10 Gauge */}
      <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg shadow-inner">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Mục tiêu:</span>
          <span className="font-mono font-bold text-slate-200">01:10.0</span>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Hiện tại:</span>
          <span
            className={`font-mono font-bold text-xs ${
              isExactTarget
                ? 'text-emerald-400'
                : isClose
                ? 'text-yellow-400'
                : 'text-slate-300'
            }`}
          >
            {formatSec(totalTimelineDuration)}
          </span>

          {isExactTarget ? (
            <span className="flex items-center space-x-1 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Chuẩn 1m10s</span>
            </span>
          ) : totalTimelineDuration > 0 ? (
            <span className="flex items-center space-x-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
              <AlertCircle className="w-3 h-3" />
              <span>{totalTimelineDuration < 70 ? `Thiếu ${(70 - totalTimelineDuration).toFixed(1)}s` : `Dư ${(totalTimelineDuration - 70).toFixed(1)}s`}</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-500">Chưa có clip</span>
          )}
        </div>
      </div>

      {/* Hardware & Actions */}
      <div className="flex items-center space-x-2.5">
        {/* GPU Acceleration Indicator */}
        <div
          className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
          title={`GPU: ${gpuInfo.name} (${gpuInfo.tier})`}
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-medium text-emerald-400">GPU ON</span>
          <span className="text-slate-500 max-w-[120px] truncate">{gpuInfo.tier.split(' ')[0]}</span>
        </div>

        {/* AI Auto-Cut Button */}
        <button
          onClick={onAutoAssemble}
          disabled={isAiProcessing}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-md ${
            isAiProcessing
              ? 'bg-purple-600/50 text-purple-200 cursor-wait'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/20'
          }`}
          title="Tự động chọn lọc lời thoại hay nhất & ghép nối đúng 1 phút 10 giây"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAiProcessing ? 'animate-spin' : ''}`} />
          <span>{isAiProcessing ? 'AI Đang Quét Thoại...' : 'Tự Động Cắt 70s'}</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Xuất Video (GPU)</span>
        </button>
      </div>
    </header>
  );
};
