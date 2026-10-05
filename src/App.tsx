import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TopBar } from './components/TopBar';
import { MediaPool } from './components/MediaPool';
import { PreviewPlayer } from './components/PreviewPlayer';
import { Timeline } from './components/Timeline';
import { InspectorPanel } from './components/InspectorPanel';
import { ExportModal } from './components/ExportModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { Project, TimelineClip, VideoClip } from './types/editor';
import { generate1000ClipsDataset, parseLocalVideoFolder } from './utils/mediaLibrary';
import { autoAssemble70sHighlights, calculateTotalTimeline } from './utils/aiCutter';
import { detectGpuHardware } from './utils/gpuRenderer';
import {
  loadAllProjects,
  saveAllProjects,
  getActiveProjectId,
  setActiveProjectId,
  getInitialDefaultProject,
} from './utils/projectStorage';

export default function App() {
  // 1. Projects State
  const [projects, setProjects] = useState<Project[]>(() => loadAllProjects());
  const [activeProjectId, setActiveId] = useState<string>(() => getActiveProjectId());

  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0] || getInitialDefaultProject();
  }, [projects, activeProjectId]);

  // 2. 1000 Short Videos Media Pool State
  const [allSourceClips, setAllSourceClips] = useState<VideoClip[]>(() => generate1000ClipsDataset());

  // 3. Playhead & Playback State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // 4. Processing & Modals
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 5. Hardware Info
  const [gpuInfo] = useState(() => detectGpuHardware());

  // Total duration of current timeline
  const totalTimelineDuration = useMemo(() => {
    return calculateTotalTimeline(currentProject.timelineClips || []);
  }, [currentProject.timelineClips]);

  // Selected clip object
  const selectedClip = useMemo(() => {
    return currentProject.timelineClips?.find((c) => c.instanceId === selectedClipId) || null;
  }, [currentProject.timelineClips, selectedClipId]);

  const selectedSourceClip = useMemo(() => {
    return selectedClip ? allSourceClips.find((c) => c.id === selectedClip.clipId) : undefined;
  }, [selectedClip, allSourceClips]);

  // Auto-trigger 70s highlight assembly on fresh startup if empty timeline
  useEffect(() => {
    if (currentProject.timelineClips?.length === 0 && allSourceClips.length > 0) {
      handleAutoAssemble();
    }
  }, []);

  // Show Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Playback timer ticker
  useEffect(() => {
    let animId: number;
    let lastStamp = performance.now();

    const loop = (timestamp: number) => {
      const delta = (timestamp - lastStamp) / 1000;
      lastStamp = timestamp;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= totalTimelineDuration && totalTimelineDuration > 0) {
            setIsPlaying(false);
            return totalTimelineDuration;
          }
          return next;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, totalTimelineDuration]);

  // Keyboard Shortcuts: Space (Play/Pause), S (Split), Del (Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSplitClip();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          handleDeleteClip(selectedClipId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipId, currentTime, currentProject]);

  // Project updater helper
  const updateCurrentProject = (partial: Partial<Project>) => {
    const updated = {
      ...currentProject,
      ...partial,
      updatedAt: Date.now(),
    };
    const nextList = projects.map((p) => (p.id === currentProject.id ? updated : p));
    setProjects(nextList);
    saveAllProjects(nextList);
  };

  // AI Auto-Cut 70s Highlights Handler
  const handleAutoAssemble = async (customPrompt?: string) => {
    if (allSourceClips.length === 0) return;
    setIsAiProcessing(true);
    showToast('AI đang quét và phân tích lời thoại trong 1000 video...');

    try {
      const result = await autoAssemble70sHighlights(
        allSourceClips,
        customPrompt,
        currentProject.targetDuration || 70.0
      );

      updateCurrentProject({
        timelineClips: result.timelineClips,
      });

      setCurrentTime(0);
      setSelectedClipId(result.timelineClips[0]?.instanceId || null);
      showToast(`✨ ${result.summary} (Chuẩn ${result.totalDuration.toFixed(1)}s - ${result.engineUsed})`);
    } catch (err: any) {
      alert('Lỗi tạo video 70s: ' + err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Add individual clip to timeline
  const handleAddClipToTimeline = (clip: VideoClip) => {
    const newTimelineClip: TimelineClip = {
      instanceId: `tclip_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      clipId: clip.id,
      title: clip.title,
      sourceDuration: clip.duration,
      inPoint: clip.bestCutRecommendation.inPoint,
      outPoint: clip.bestCutRecommendation.outPoint,
      speed: 1.15,
      volume: 100,
      zoom: 110,
      panX: 0,
      panY: 0,
      filter: 'normal',
      transition: 'crossfade',
      transitionDuration: 0.5,
      audioDucking: true,
      vocalBoost: true,
      colorGrade: { brightness: 100, contrast: 105, saturation: 105 },
      dialogueSnippet: clip.bestCutRecommendation.highlightText,
      highlightReason: clip.bestCutRecommendation.reason,
    };

    const nextClips = [...(currentProject.timelineClips || []), newTimelineClip];
    updateCurrentProject({ timelineClips: nextClips });
    setSelectedClipId(newTimelineClip.instanceId);
    showToast(`Đã thêm clip "${clip.title}" vào timeline`);
  };

  // Update selected clip parameters (Speed, Volume, Zoom, Filter, Dialogue)
  const handleUpdateSelectedClip = (updated: Partial<TimelineClip>) => {
    if (!selectedClipId) return;
    const nextClips = (currentProject.timelineClips || []).map((c) =>
      c.instanceId === selectedClipId ? { ...c, ...updated } : c
    );
    updateCurrentProject({ timelineClips: nextClips });
  };

  // Split clip at current playhead
  const handleSplitClip = () => {
    const clips = currentProject.timelineClips || [];
    let accumulated = 0;
    let splitIndex = -1;
    let splitClip: TimelineClip | null = null;
    let localTimeInClip = 0;

    for (let i = 0; i < clips.length; i++) {
      const c = clips[i];
      const dur = (c.outPoint - c.inPoint) / (c.speed || 1.0);
      if (currentTime > accumulated + 0.3 && currentTime < accumulated + dur - 0.3) {
        splitIndex = i;
        splitClip = c;
        localTimeInClip = (currentTime - accumulated) * (c.speed || 1.0);
        break;
      }
      accumulated += dur;
    }

    if (splitIndex === -1 || !splitClip) {
      showToast('Đặt con trỏ playhead vào bên trong một clip để tách');
      return;
    }

    const splitPointSourceTime = splitClip.inPoint + localTimeInClip;

    const firstHalf: TimelineClip = {
      ...splitClip,
      outPoint: splitPointSourceTime,
    };

    const secondHalf: TimelineClip = {
      ...splitClip,
      instanceId: `tclip_${Date.now()}_split`,
      inPoint: splitPointSourceTime,
    };

    const nextClips = [...clips];
    nextClips.splice(splitIndex, 1, firstHalf, secondHalf);
    updateCurrentProject({ timelineClips: nextClips });
    setSelectedClipId(secondHalf.instanceId);
    showToast('Đã tách clip thành 2 phân đoạn');
  };

  // Delete clip from timeline
  const handleDeleteClip = (instanceId: string) => {
    const nextClips = (currentProject.timelineClips || []).filter((c) => c.instanceId !== instanceId);
    updateCurrentProject({ timelineClips: nextClips });
    if (selectedClipId === instanceId) {
      setSelectedClipId(nextClips[0]?.instanceId || null);
    }
    showToast('Đã xóa clip khỏi timeline');
  };

  // Trim clip handles (In/Out)
  const handleUpdateClipTrim = (instanceId: string, inPoint: number, outPoint: number) => {
    const nextClips = (currentProject.timelineClips || []).map((c) =>
      c.instanceId === instanceId ? { ...c, inPoint, outPoint } : c
    );
    updateCurrentProject({ timelineClips: nextClips });
  };

  // Import real user video folder
  const handleImportFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    showToast(`Đang nhập và lập chỉ mục ${files.length} video từ thư mục...`);
    try {
      const imported = await parseLocalVideoFolder(files);
      if (imported.length > 0) {
        setAllSourceClips((prev) => [...imported, ...prev]);
        showToast(`Đã nhập thành công ${imported.length} video từ máy tính!`);
      } else {
        alert('Không tìm thấy file video hợp lệ trong thư mục được chọn.');
      }
    } catch (err: any) {
      alert('Lỗi nhập thư mục: ' + err.message);
    }
  };

  // Re-generate / Reset to 1000 sample clips
  const handleLoad1000SampleClips = () => {
    const dataset = generate1000ClipsDataset();
    setAllSourceClips(dataset);
    showToast('Đã nạp đầy đủ kho 1000 video ngắn kèm lời thoại và điểm cao trào!');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-cyan-500/50 text-white text-xs px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP BAR */}
      <TopBar
        currentProject={currentProject}
        totalTimelineDuration={totalTimelineDuration}
        gpuInfo={gpuInfo}
        onOpenProjectManager={() => setIsProjectModalOpen(true)}
        onAutoAssemble={() => handleAutoAssemble()}
        onOpenExport={() => setIsExportModalOpen(true)}
        onSaveProject={() => {
          saveAllProjects(projects);
          showToast('Đã lưu dự án thành công vào bộ nhớ máy!');
        }}
        isAiProcessing={isAiProcessing}
      />

      {/* 2. MIDDLE WORKSPACE (Left: Media Pool | Center: Canvas Player | Right: Inspector) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Media Pool (1000 Clips & Folder Explorer) */}
        <div className="w-80 shrink-0 h-full">
          <MediaPool
            clips={allSourceClips}
            onAddClipToTimeline={handleAddClipToTimeline}
            onPreviewClip={(clip) => {
              // preview clip dialog or seek
              handleAddClipToTimeline(clip);
            }}
            onImportFolder={handleImportFolder}
            onLoad1000SampleClips={handleLoad1000SampleClips}
            onAutoAssemble={() => handleAutoAssemble()}
            isAiProcessing={isAiProcessing}
          />
        </div>

        {/* Center: Preview Player */}
        <div className="flex-1 h-full min-w-0">
          <PreviewPlayer
            timelineClips={currentProject.timelineClips || []}
            allSourceClips={allSourceClips}
            currentTime={currentTime}
            totalDuration={totalTimelineDuration}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onSeek={(t) => setCurrentTime(t)}
            selectedClip={selectedClip}
            project={currentProject}
          />
        </div>

        {/* Right: Inspector (Speed, Volume, Zoom, Dialogue) */}
        <div className="w-84 shrink-0 h-full">
          <InspectorPanel
            selectedClip={selectedClip}
            sourceClip={selectedSourceClip}
            onUpdateClip={handleUpdateSelectedClip}
            onAutoAssemble={handleAutoAssemble}
            isAiProcessing={isAiProcessing}
          />
        </div>
      </div>

      {/* 3. BOTTOM WORKSPACE: NLE TIMELINE (70s Target Line) */}
      <div className="h-48 shrink-0">
        <Timeline
          timelineClips={currentProject.timelineClips || []}
          allSourceClips={allSourceClips}
          currentTime={currentTime}
          totalDuration={totalTimelineDuration}
          selectedClipId={selectedClipId}
          onSelectClip={(clip) => setSelectedClipId(clip.instanceId)}
          onSeek={(t) => setCurrentTime(t)}
          onSplitClip={handleSplitClip}
          onDeleteClip={handleDeleteClip}
          onUpdateClipTrim={handleUpdateClipTrim}
        />
      </div>

      {/* Export Modal with GPU Accelerated Canvas Render */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        timelineClips={currentProject.timelineClips || []}
        allSourceClips={allSourceClips}
        totalDuration={totalTimelineDuration}
        gpuInfo={gpuInfo}
      />

      {/* Projects Storage & Manager Modal */}
      <ProjectManagerModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projects={projects}
        currentProjectId={currentProject.id}
        onSelectProject={(proj) => {
          setActiveId(proj.id);
          setActiveProjectId(proj.id);
          setCurrentTime(0);
        }}
        onProjectsUpdated={(newProjects) => {
          setProjects(newProjects);
          saveAllProjects(newProjects);
        }}
      />
    </div>
  );
}
