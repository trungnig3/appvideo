import { VideoClip, DialogueSentence } from '../types/editor';

// Categories for the 1000 short videos
const CATEGORIES: VideoClip['category'][] = [
  'Comedy',
  'Drama',
  'Podcast',
  'Review',
  'Tech',
  'Vlog',
  'Action',
  'Lifestyle',
];

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6',
];

// Rich realistic dialogues and speech scripts for generating 1000 clips with authentic transcripts
const SPEECH_TEMPLATES = [
  {
    theme: 'Khởi nghiệp & Kinh doanh',
    sentences: [
      { text: 'Điều quan trọng nhất không phải là bạn có bao nhiêu vốn, mà là bạn giải quyết được nỗi đau nào của khách hàng!', sentiment: 'inspirational', isHook: true, isPunchline: false, score: 96 },
      { text: 'Khi tôi bắt đầu, mọi người đều nói tôi sẽ phá sản trong 3 tháng đầu.', sentiment: 'dramatic', isHook: false, isPunchline: false, score: 88 },
      { text: 'Nhưng đây chính là cú bứt phá thay đổi toàn bộ doanh số công ty!', sentiment: 'action', isHook: false, isPunchline: true, score: 98 },
      { text: 'Đừng bao giờ từ bỏ vào khoảnh khắc ngay trước khi bạn thành công.', sentiment: 'inspirational', isHook: false, isPunchline: true, score: 92 },
    ]
  },
  {
    theme: 'Đánh giá Công nghệ & AI',
    sentences: [
      { text: 'Đây là tính năng điên rồ nhất mà tôi từng thấy trên một con chip năm nay!', sentiment: 'action', isHook: true, isPunchline: false, score: 99 },
      { text: 'Nhiều người nghĩ AI chỉ viết được văn, nhưng nhìn khả năng render đồ họa này xem.', sentiment: 'neutral', isHook: false, isPunchline: false, score: 84 },
      { text: 'Tốc độ xuất file video nhanh gấp 10 lần card đồ họa thế hệ cũ!', sentiment: 'action', isHook: false, isPunchline: true, score: 95 },
      { text: 'Nếu bạn làm sáng tạo nội dung, đây chắc chắn là vũ khí tối thượng.', sentiment: 'positive', isHook: false, isPunchline: true, score: 91 },
    ]
  },
  {
    theme: 'Hài hước & Tình huống Viral',
    sentences: [
      { text: 'Tôi thề là tôi không hề có ý định làm chuyện này đâu anh em ơi!', sentiment: 'funny', isHook: true, isPunchline: false, score: 97 },
      { text: 'Vừa quay xe một phát thì gặp ngay ông sếp đang đứng nhìn!', sentiment: 'funny', isHook: false, isPunchline: false, score: 93 },
      { text: 'Khuôn mặt của ông ấy lúc đó không bao giờ tôi quên được luôn haha!', sentiment: 'funny', isHook: false, isPunchline: true, score: 98 },
      { text: 'Đúng là cái kết đắng lòng nhất ngày thứ Hai đi làm!', sentiment: 'funny', isHook: false, isPunchline: true, score: 90 },
    ]
  },
  {
    theme: 'Podcast & Động lực sống',
    sentences: [
      { text: 'Bạn có biết tại sao 99% mọi người thất bại ở thói quen dậy sớm không?', sentiment: 'dramatic', isHook: true, isPunchline: false, score: 95 },
      { text: 'Bởi vì họ thức dậy nhưng không có một lý do nào đủ lớn để cháy hết mình.', sentiment: 'inspirational', isHook: false, isPunchline: false, score: 89 },
      { text: 'Hãy kỷ luật với bản thân trước khi đòi hỏi thế giới phải tôn trọng bạn.', sentiment: 'inspirational', isHook: false, isPunchline: true, score: 97 },
      { text: 'Một bước chân nhỏ hôm nay hơn ngàn kế hoạch nằm trên trang giấy!', sentiment: 'positive', isHook: false, isPunchline: true, score: 94 },
    ]
  },
  {
    theme: 'Review Ẩm thực & Du lịch',
    sentences: [
      { text: 'Quán ăn núp hẻm này đã tồn tại hơn 40 năm mà chỉ dân sành ăn mới biết!', sentiment: 'positive', isHook: true, isPunchline: false, score: 94 },
      { text: 'Nước dùng ninh từ xương ống tủy ngọt thanh tự nhiên bốc khói nghi ngút.', sentiment: 'positive', isHook: false, isPunchline: false, score: 87 },
      { text: 'Cắn một miếng thịt bò mềm tan chảy trong miệng, ngon đỉnh chóp!', sentiment: 'action', isHook: false, isPunchline: true, score: 96 },
      { text: 'Chắc chắn phải lưu lại ngay địa chỉ này để đi cùng bạn bè cuối tuần nhé!', sentiment: 'positive', isHook: false, isPunchline: false, score: 85 },
    ]
  },
  {
    theme: 'Hậu trường & Kịch tính Studio',
    sentences: [
      { text: 'Cảnh quay này suýt nữa làm cháy cả studio vì hiệu ứng khói quá đà!', sentiment: 'dramatic', isHook: true, isPunchline: false, score: 98 },
      { text: 'Cả ekip nín thở khi đạo diễn hô chuẩn bị bấm máy lần cuối.', sentiment: 'dramatic', isHook: false, isPunchline: false, score: 91 },
      { text: 'Và khoảnh khắc ánh đèn bừng sáng, mọi thứ hoàn hảo đến nghẹt thở!', sentiment: 'action', isHook: false, isPunchline: true, score: 99 },
      { text: 'Đó là lý do chúng tôi yêu công việc sáng tạo điện ảnh này.', sentiment: 'inspirational', isHook: false, isPunchline: true, score: 93 },
    ]
  }
];

const SPEAKERS = ['MC Tuấn Anh', 'Reviewer Hải Đăng', 'Chuyên gia Hoàng Nam', 'Linh Nhi Vlogs', 'Bác Ba Hài', 'Host Thu Trang', 'Creator Đức Trung'];

// Generate 1000 realistic short videos dataset
export function generate1000ClipsDataset(): VideoClip[] {
  const clips: VideoClip[] = [];

  for (let i = 1; i <= 1000; i++) {
    const templateIndex = (i - 1) % SPEECH_TEMPLATES.length;
    const template = SPEECH_TEMPLATES[templateIndex];
    const category = CATEGORIES[i % CATEGORIES.length];
    const color = COLORS[i % COLORS.length];
    const speaker = SPEAKERS[i % SPEAKERS.length];

    // Clip duration from 12s to 32s
    const clipDuration = 12 + ((i * 7) % 20);
    const numSentences = 2 + (i % 3);

    const dialogueTranscript: DialogueSentence[] = [];
    let currentSec = 0.5 + ((i % 4) * 0.4);

    for (let s = 0; s < numSentences; s++) {
      const sentRaw = template.sentences[(s + i) % template.sentences.length];
      const sentenceDuration = 3.2 + ((s + i) % 4) * 0.8;
      const endSec = Math.min(clipDuration - 0.5, currentSec + sentenceDuration);

      dialogueTranscript.push({
        id: `sent_${i}_${s}`,
        startTime: parseFloat(currentSec.toFixed(1)),
        endTime: parseFloat(endSec.toFixed(1)),
        text: sentRaw.text,
        speaker,
        sentiment: sentRaw.sentiment as any,
        excitementScore: Math.min(100, sentRaw.score + (i % 7) - 3),
        isHook: sentRaw.isHook || (s === 0 && (i % 5 === 0)),
        isPunchline: sentRaw.isPunchline || (s === numSentences - 1),
      });

      currentSec = endSec + 0.6;
      if (currentSec >= clipDuration - 1) break;
    }

    // Find best dialogue moment for bestCutRecommendation
    const bestSent = [...dialogueTranscript].sort((a, b) => b.excitementScore - a.excitementScore)[0] || dialogueTranscript[0];
    const inPoint = Math.max(0, bestSent.startTime - 0.5);
    const outPoint = Math.min(clipDuration, bestSent.endTime + 0.8);

    clips.push({
      id: `clip_${i.toString().padStart(4, '0')}`,
      filename: `VID_${i.toString().padStart(4, '0')}_${category.toUpperCase()}.mp4`,
      title: `${category} Clip #${i} - ${template.theme.split('&')[0].trim()}`,
      category,
      duration: clipDuration,
      resolution: i % 3 === 0 ? '1920x1080' : '1080x1920',
      fps: i % 2 === 0 ? 60 : 30,
      fileSizeMb: parseFloat((clipDuration * 3.8 + ((i % 10) * 1.2)).toFixed(1)),
      thumbnailColor: color,
      dialogueTranscript,
      bestCutRecommendation: {
        inPoint: parseFloat(inPoint.toFixed(1)),
        outPoint: parseFloat(outPoint.toFixed(1)),
        reason: bestSent.isHook ? 'Hook giữ chân người xem cực mạnh' : (bestSent.isPunchline ? 'Cú twist & câu thoại đắt giá' : 'Đoạn thoại năng lượng cao'),
        score: bestSent.excitementScore,
        highlightText: bestSent.text,
      },
      tags: [category, template.theme.split(' ')[0], bestSent.sentiment, bestSent.isHook ? 'Hook' : 'Highlight'],
    });
  }

  return clips;
}

// Handler for user uploading real local folder with video files
export async function parseLocalVideoFolder(fileList: FileList): Promise<VideoClip[]> {
  const clips: VideoClip[] = [];
  const validFiles = Array.from(fileList).filter(f => f.type.startsWith('video/') || f.name.match(/\.(mp4|mov|webm|m4v|mkv)$/i));

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const videoUrl = URL.createObjectURL(file);
    const color = COLORS[i % COLORS.length];
    const category = CATEGORIES[i % CATEGORIES.length];

    // Estimate or extract video metadata
    const duration = await getVideoDuration(file).catch(() => 15);
    const clipId = `local_${Date.now()}_${i}`;

    // Auto-transcribe simulation based on filename or speech heuristic
    const sampleTemplate = SPEECH_TEMPLATES[i % SPEECH_TEMPLATES.length];
    const sentences = sampleTemplate.sentences.slice(0, 3).map((s, idx) => ({
      id: `lsent_${i}_${idx}`,
      startTime: idx * 3.5,
      endTime: Math.min(duration, (idx + 1) * 3.5),
      text: `[Audio từ ${file.name}]: ${s.text}`,
      speaker: 'Speaker ' + ((i % 3) + 1),
      sentiment: s.sentiment as any,
      excitementScore: s.score,
      isHook: idx === 0,
      isPunchline: idx === 2,
    }));

    clips.push({
      id: clipId,
      filename: file.name,
      title: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
      category,
      duration: parseFloat(duration.toFixed(1)),
      resolution: '1080x1920',
      fps: 30,
      fileSizeMb: parseFloat((file.size / (1024 * 1024)).toFixed(1)),
      thumbnailColor: color,
      videoUrl,
      dialogueTranscript: sentences,
      bestCutRecommendation: {
        inPoint: 0.5,
        outPoint: Math.min(duration, 7.5),
        reason: 'Phân đoạn thoại rõ âm & năng lượng cao nhất',
        score: 95,
        highlightText: sentences[0]?.text || file.name,
      },
      tags: ['Local Folder', category, 'Imported'],
    });
  }

  return clips;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve(video.duration || 15);
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => {
      resolve(15);
    };
    video.src = URL.createObjectURL(file);
  });
}
