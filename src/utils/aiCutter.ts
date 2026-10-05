import { VideoClip, TimelineClip } from '../types/editor';

export interface AutoCutResult {
  theme: string;
  summary: string;
  timelineClips: TimelineClip[];
  totalDuration: number;
  engineUsed: 'Gemini 3.8 Flash' | 'CinePro Heuristic Engine';
}

/**
 * Analyzes video clips dialogue, extracts best moments,
 * and stitches them into a perfect 70-second (1 min 10 sec) sequence.
 */
export async function autoAssemble70sHighlights(
  clips: VideoClip[],
  customPrompt?: string,
  targetDuration: number = 70.0
): Promise<AutoCutResult> {
  if (clips.length === 0) {
    throw new Error('Thư viện video trống! Vui lòng thêm video vào kho dữ liệu.');
  }

  // 1. Try Server-side Gemini AI first
  try {
    const response = await fetch('/api/ai/analyze-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clips: clips.slice(0, 100),
        prompt: customPrompt,
        targetDuration,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data?.selectedScenes?.length > 0) {
        const assembled = buildTimelineFromAiScenes(clips, result.data.selectedScenes, targetDuration);
        return {
          theme: result.data.theme || 'Tuyển tập thoại xuất sắc nhất',
          summary: result.data.summary || 'Đã phân tích các câu thoại và chọn lọc những khoảnh khắc vàng.',
          timelineClips: assembled.clips,
          totalDuration: assembled.totalDuration,
          engineUsed: 'Gemini 3.8 Flash',
        };
      }
    }
  } catch (err) {
    console.warn('Không kết nối được Gemini API backend, chuyển sang CinePro Local Engine:', err);
  }

  // 2. Local Fallback Heuristic Engine (deterministic, instant, high-quality)
  return runLocalSpeechCutEngine(clips, customPrompt, targetDuration);
}

function buildTimelineFromAiScenes(
  clips: VideoClip[],
  scenes: any[],
  targetDuration: number
): { clips: TimelineClip[]; totalDuration: number } {
  const timelineClips: TimelineClip[] = [];
  const clipMap = new Map(clips.map(c => [c.id, c]));

  let accumulatedTime = 0;

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const sourceClip = clipMap.get(sc.clipId);
    if (!sourceClip) continue;

    const inPoint = Math.max(0, Number(sc.inPoint) || 0);
    const rawOut = Math.min(sourceClip.duration, Number(sc.outPoint) || (inPoint + 5));
    const outPoint = rawOut > inPoint ? rawOut : inPoint + 4;
    const speed = Math.max(0.75, Math.min(2.0, Number(sc.speed) || 1.1));
    const zoom = Math.max(100, Math.min(180, Number(sc.zoom) ? Number(sc.zoom) * 100 : 110));

    const durationOnTimeline = (outPoint - inPoint) / speed;

    timelineClips.push({
      instanceId: `tclip_${Date.now()}_${i}`,
      clipId: sourceClip.id,
      title: sourceClip.title,
      sourceDuration: sourceClip.duration,
      inPoint,
      outPoint,
      speed,
      volume: 100,
      zoom,
      panX: (i % 2 === 0 ? 5 : -5),
      panY: 0,
      filter: i === 0 ? 'vivid' : (i % 3 === 0 ? 'cinematic' : 'normal'),
      transition: i === 0 ? 'none' : 'crossfade',
      transitionDuration: 0.5,
      audioDucking: true,
      vocalBoost: true,
      colorGrade: { brightness: 100, contrast: 105, saturation: 110 },
      dialogueSnippet: sc.dialogueHighlight || sourceClip.bestCutRecommendation.highlightText,
      highlightReason: sc.reason || 'Khoảnh khắc thoại đắt giá',
    });

    accumulatedTime += durationOnTimeline;
  }

  // Fine-tune last clip to hit EXACT target duration (70.0s)
  adjustToExactTarget(timelineClips, targetDuration);
  const finalDuration = calculateTotalTimeline(timelineClips);

  return { clips: timelineClips, totalDuration: finalDuration };
}

/**
 * Local Smart Heuristic Cutter:
 * 1. Filter clips by dialogue excitement score and hook sentences.
 * 2. Stage 1 (0-5s): Opening Hook (High punchy sentence).
 * 3. Stage 2 (5-25s): Pacing & Story Build (2-3 dynamic clips).
 * 4. Stage 3 (25-55s): Climax & Punchlines (3-4 top emotional/funny lines).
 * 5. Stage 4 (55-70s): Punchy resolution / Outro hook.
 */
function runLocalSpeechCutEngine(
  clips: VideoClip[],
  prompt?: string,
  targetDuration: number = 70.0
): AutoCutResult {
  // Sort clips by excitement and hook presence
  const sortedClips = [...clips].sort((a, b) => {
    return b.bestCutRecommendation.score - a.bestCutRecommendation.score;
  });

  // Pick diverse clips across categories
  const selectedPool: VideoClip[] = [];
  const usedCategories = new Set<string>();

  for (const c of sortedClips) {
    if (!usedCategories.has(c.category) || selectedPool.length < 12) {
      selectedPool.push(c);
      usedCategories.add(c.category);
    }
    if (selectedPool.length >= 15) break;
  }

  // Target 8-10 cuts to make a punchy 70s video (avg 7-8s per cut)
  const timelineClips: TimelineClip[] = [];
  let remainingTime = targetDuration;

  // 1. Hook (First clip: 0 - 5.5s)
  const hookClip = selectedPool.find(c => c.dialogueTranscript.some(d => d.isHook)) || selectedPool[0];
  const hookSentence = hookClip.dialogueTranscript.find(d => d.isHook) || hookClip.dialogueTranscript[0];
  const hookDuration = 5.2;

  timelineClips.push({
    instanceId: `tclip_hook_${Date.now()}`,
    clipId: hookClip.id,
    title: hookClip.title,
    sourceDuration: hookClip.duration,
    inPoint: Math.max(0, hookSentence.startTime - 0.2),
    outPoint: Math.min(hookClip.duration, hookSentence.startTime + hookDuration * 1.15),
    speed: 1.15, // slightly faster for snappy hook
    volume: 110,
    zoom: 118, // punchy zoom-in
    panX: 0,
    panY: -5,
    filter: 'vivid',
    transition: 'none',
    transitionDuration: 0.4,
    audioDucking: true,
    vocalBoost: true,
    colorGrade: { brightness: 105, contrast: 110, saturation: 115 },
    dialogueSnippet: hookSentence.text,
    highlightReason: '🔥 Hook mở đầu 5s giữ chân khán giả tuyệt đối',
  });

  remainingTime -= (hookDuration);

  // 2. Middle scenes: 6 to 8 clips
  const middlePool = selectedPool.filter(c => c.id !== hookClip.id);
  const targetPerClip = 7.5;
  const numMiddle = Math.floor(remainingTime / targetPerClip);

  for (let i = 0; i < numMiddle && i < middlePool.length; i++) {
    const clip = middlePool[i];
    const bestSent = clip.dialogueTranscript.find(d => d.isPunchline) || clip.dialogueTranscript[0];
    const clipDuration = i === numMiddle - 1 ? remainingTime : targetPerClip;
    const speed = 1.05 + ((i % 3) * 0.1); // 1.05x, 1.15x, 1.25x
    const zoom = 105 + ((i % 4) * 8); // subtle varied framing: 105%, 113%, 121%
    const inPoint = Math.max(0, bestSent.startTime - 0.3);
    const outPoint = Math.min(clip.duration, inPoint + (clipDuration * speed));

    timelineClips.push({
      instanceId: `tclip_scene_${Date.now()}_${i}`,
      clipId: clip.id,
      title: clip.title,
      sourceDuration: clip.duration,
      inPoint,
      outPoint,
      speed,
      volume: 100,
      zoom,
      panX: i % 2 === 0 ? 4 : -4,
      panY: 0,
      filter: i % 2 === 0 ? 'cinematic' : 'normal',
      transition: i % 3 === 0 ? 'zoomWhip' : 'crossfade',
      transitionDuration: 0.5,
      audioDucking: true,
      vocalBoost: true,
      colorGrade: { brightness: 100, contrast: 105, saturation: 108 },
      dialogueSnippet: bestSent.text,
      highlightReason: bestSent.isPunchline ? '⚡ Câu thoại đắt giá / Điểm nhấn' : '🎬 Cao trào hành động & diễn biến',
    });

    remainingTime -= ((outPoint - inPoint) / speed);
  }

  // Adjust mathematically to hit exact 70.0 seconds
  adjustToExactTarget(timelineClips, targetDuration);

  const finalDuration = calculateTotalTimeline(timelineClips);

  return {
    theme: prompt ? `Chủ đề: ${prompt}` : 'Tuyển tập thoại hay nhất từ kho 1000 video',
    summary: `Đã tự động rà soát lời thoại, phát hiện Hook mở đầu, điểm cao trào và ghép nối thành video chuẩn 01:10 (${finalDuration.toFixed(1)}s).`,
    timelineClips,
    totalDuration: finalDuration,
    engineUsed: 'CinePro Heuristic Engine',
  };
}

/**
 * Calculates current sum of timeline durations considering speed
 */
export function calculateTotalTimeline(clips: TimelineClip[]): number {
  return clips.reduce((acc, c) => {
    const clipDur = (c.outPoint - c.inPoint) / (c.speed || 1.0);
    return acc + Math.max(0.1, clipDur);
  }, 0);
}

/**
 * Modifies outPoint or speed of clips to achieve EXACT 70.0s timeline duration
 */
function adjustToExactTarget(clips: TimelineClip[], targetSec: number) {
  if (clips.length === 0) return;

  const currentTotal = calculateTotalTimeline(clips);
  const diff = targetSec - currentTotal;

  if (Math.abs(diff) < 0.05) return;

  // Distribute slight adjustment to last 2 clips
  const lastIndex = clips.length - 1;
  const lastClip = clips[lastIndex];

  const neededDuration = (lastClip.outPoint - lastClip.inPoint) / lastClip.speed + diff;
  if (neededDuration > 2.0 && neededDuration < 15.0) {
    lastClip.outPoint = lastClip.inPoint + (neededDuration * lastClip.speed);
  } else {
    // If last clip can't stretch, distribute evenly across all clips
    const perClipAdjustment = diff / clips.length;
    for (const c of clips) {
      const curDur = (c.outPoint - c.inPoint) / c.speed;
      const newDur = Math.max(1.5, curDur + perClipAdjustment);
      c.outPoint = c.inPoint + (newDur * c.speed);
    }
  }
}
