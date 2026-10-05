import React, { useState, useMemo, useRef } from 'react';
import {
  FolderOpen,
  Search,
  SlidersHorizontal,
  Flame,
  Plus,
  Play,
  Film,
  Sparkles,
  Database,
  Tag,
  Volume2,
} from 'lucide-react';
import { VideoClip } from '../types/editor';

interface MediaPoolProps {
  clips: VideoClip[];
  onAddClipToTimeline: (clip: VideoClip) => void;
  onPreviewClip: (clip: VideoClip) => void;
  onImportFolder: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoad1000SampleClips: () => void;
  onAutoAssemble: () => void;
  isAiProcessing: boolean;
}

export const MediaPool: React.FC<MediaPoolProps> = ({
  clips,
  onAddClipToTimeline,
  onPreviewClip,
  onImportFolder,
  onLoad1000SampleClips,
  onAutoAssemble,
  isAiProcessing,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sentimentFilter, setSentimentFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'score' | 'duration' | 'name'>('score');
  const [page, setPage] = useState(1);
  const pageSize = 40;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered and sorted clips
  const filteredClips = useMemo(() => {
    return clips.filter((clip) => {
      // Category filter
      if (selectedCategory !== 'All' && clip.category !== selectedCategory) {
        return false;
      }

      // Sentiment filter
      if (sentimentFilter === 'Hook') {
        const hasHook = clip.dialogueTranscript.some((d) => d.isHook);
        if (!hasHook) return false;
      } else if (sentimentFilter === 'Funny') {
        const isFunny = clip.dialogueTranscript.some((d) => d.sentiment === 'funny');
        if (!isFunny) return false;
      } else if (sentimentFilter === 'HighEnergy') {
        if (clip.bestCutRecommendation.score < 90) return false;
      }

      // Search query filter (matches title, dialogue text, or speaker)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = clip.title.toLowerCase().includes(q);
        const inFilename = clip.filename.toLowerCase().includes(q);
        const inDialogue = clip.dialogueTranscript.some(
          (d) => d.text.toLowerCase().includes(q) || d.speaker.toLowerCase().includes(q)
        );
        return inTitle || inFilename || inDialogue;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'score') return b.bestCutRecommendation.score - a.bestCutRecommendation.score;
      if (sortBy === 'duration') return b.duration - a.duration;
      return a.title.localeCompare(b.title);
    });
  }, [clips, searchQuery, selectedCategory, sentimentFilter, sortBy]);

  // Paginated view for fast rendering of 1000 clips
  const visibleClips = useMemo(() => {
    return filteredClips.slice(0, page * pageSize);
  }, [filteredClips, page]);

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800 select-none">
      {/* Media Header */}
      <div className="p-3 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Kho Video Ngắn ({clips.length})
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Hidden directory input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={onImportFolder}
              // @ts-expect-error webkitdirectory attribute
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition-colors"
              title="Chọn thư mục chứa video trên máy tính của bạn"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Nhập Thư Mục</span>
            </button>

            <button
              onClick={onLoad1000SampleClips}
              className="flex items-center space-x-1 px-2 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 text-xs rounded border border-cyan-800/60 transition-colors"
              title="Nạp 1000 video mẫu có sẵn kịch bản lời thoại"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nạp 1000 Mẫu</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo lời thoại, từ khóa, người nói..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950 text-slate-200 pl-8 pr-3 py-1.5 rounded-md text-xs border border-slate-800 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter chips & Sort */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5 max-w-[280px]">
            {['All', 'Comedy', 'Drama', 'Tech', 'Vlog', 'Podcast'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat === 'All' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1">
            <select
              value={sentimentFilter}
              onChange={(e) => {
                setSentimentFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 text-slate-300 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
            >
              <option value="All">Cảm xúc: Tất cả</option>
              <option value="Hook">Chỉ chọn Hook</option>
              <option value="Funny">Hài hước</option>
              <option value="HighEnergy">Điểm cao (&gt;90)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Auto Assemble Banner */}
      <div className="p-2.5 bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border-b border-purple-900/30 flex items-center justify-between">
        <div className="text-[11px] text-purple-200">
          <div className="font-semibold flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>AI Quét Thoại Tự Động</span>
          </div>
          <div className="text-[10px] text-purple-300/70">
            Lọc cảnh đỉnh nhất &rarr; Ghép đúng 1m10s
          </div>
        </div>
        <button
          onClick={onAutoAssemble}
          disabled={isAiProcessing}
          className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition-all shadow shadow-purple-600/30"
        >
          {isAiProcessing ? 'Đang Xử Lý...' : 'Cắt Tự Động'}
        </button>
      </div>

      {/* Clip List Virtualized / Paginated */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {visibleClips.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Không tìm thấy video nào phù hợp với bộ lọc.
          </div>
        ) : (
          visibleClips.map((clip) => {
            const topSent = clip.dialogueTranscript[0];
            const hasHook = clip.dialogueTranscript.some((d) => d.isHook);

            return (
              <div
                key={clip.id}
                className="group p-2 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col space-y-1.5 shadow-sm"
              >
                {/* Row 1: Header & Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: clip.thumbnailColor }}
                    />
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {clip.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                      {clip.duration}s
                    </span>
                    <span
                      className={`text-[10px] px-1 py-0.5 rounded font-bold flex items-center space-x-0.5 ${
                        clip.bestCutRecommendation.score >= 95
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      <Flame className="w-2.5 h-2.5" />
                      <span>{clip.bestCutRecommendation.score}</span>
                    </span>
                  </div>
                </div>

                {/* Row 2: Dialogue Snippet */}
                <div className="text-[11px] text-slate-300 italic line-clamp-2 bg-slate-900/80 p-1.5 rounded border border-slate-800/60">
                  <span className="text-cyan-400 font-normal not-italic mr-1">
                    [{topSent?.speaker || 'Thoại'}]:
                  </span>
                  &ldquo;{clip.bestCutRecommendation.highlightText}&rdquo;
                </div>

                {/* Row 3: Meta & Action Buttons */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                    {hasHook && (
                      <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-1 rounded font-bold">
                        HOOK
                      </span>
                    )}
                    <span className="bg-slate-900 px-1 rounded">{clip.category}</span>
                    <span>
                      Cắt đề xuất: {clip.bestCutRecommendation.inPoint}s - {clip.bestCutRecommendation.outPoint}s
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onPreviewClip(clip)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Xem trước clip"
                    >
                      <Play className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => onAddClipToTimeline(clip)}
                      className="flex items-center space-x-0.5 px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-medium transition-colors shadow"
                      title="Chèn clip vào timeline dựng"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Load more if list is long */}
        {visibleClips.length < filteredClips.length && (
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded font-medium transition-colors mt-2"
          >
            Hiển thị thêm video ({visibleClips.length}/{filteredClips.length})
          </button>
        )}
      </div>
    </div>
  );
};
