import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI endpoint: Analyze video batch dialogue to select the best scenes for a 70-second video
app.post('/api/ai/analyze-batch', async (req, res) => {
  try {
    const { clips, prompt, targetDuration = 70 } = req.body;

    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return res.status(400).json({ error: 'Danh sách video clips không hợp lệ' });
    }

    // Prepare a compact representation of clips transcripts for Gemini
    const clipsSummary = clips.slice(0, 100).map((c: any, index: number) => ({
      index,
      id: c.id,
      title: c.title,
      duration: c.duration,
      dialogue: c.dialogueTranscript?.map((d: any) => `[${d.startTime.toFixed(1)}s-${d.endTime.toFixed(1)}s] (${d.speaker}): "${d.text}"`).join(' | ') || c.transcript || 'Không có lời thoại',
      tags: c.tags || [],
    }));

    const systemPrompt = `Bạn là một đạo diễn và chuyên gia dựng video viral (Shorts / Reels / TikTok) chuyên nghiệp.
Nhiệm vụ của bạn là từ danh sách các video ngắn chứa lời thoại được cung cấp, hãy lựa chọn những phân đoạn hay nhất (Hook hấp dẫn, cao trào, câu thoại đắt giá, bất ngờ, hài hước, hoặc truyền cảm hứng) để ghép thành một video thành phẩm CÓ TỔNG THỜI LƯỢNG ĐÚNG KHOẢNG ${targetDuration} GIÂY (1 phút 10 giây).

Yêu cầu cấu trúc video 70 giây:
1. 0s - 5s: Hook giữ chân người xem cực mạnh (câu nói gây tò mò, bất ngờ)
2. 5s - 25s: Phần diễn tiến, tình tiết lôi cuốn
3. 25s - 55s: Cao trào, những phát ngôn hay nhất, điểm nhấn nội dung
4. 55s - 70s: Kết bài ấn tượng hoặc cú twist/kêu gọi hành động

Với mỗi phân đoạn được chọn, bạn cần chỉ định:
- clipId: id của clip nguồn
- inPoint: thời điểm bắt đầu cắt (giây)
- outPoint: thời điểm kết thúc cắt (giây)
- speed: tốc độ phát đề xuất (1.0 đến 1.5 để tăng nhịp độ nếu cần)
- zoom: mức zoom khung hình đề xuất (1.0 đến 1.3 để tạo điểm nhấn)
- reason: lý do chọn cảnh này (ví dụ: "Hook mở đầu gây sốc", "Câu thoại hài hước", "Cao trào kịch tính")
- dialogueHighlight: câu thoại nổi bật trong đoạn cắt này

Trả về định dạng JSON theo schema được chỉ định.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Yêu cầu chủ đề: "${prompt || 'Cắt ghép những cảnh có lời thoại hay nhất, hấp dẫn nhất thành video 1 phút 10 giây'}"
Danh sách các clip và lời thoại nguồn:
${JSON.stringify(clipsSummary, null, 2)}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING },
            summary: { type: Type.STRING },
            totalDuration: { type: Type.NUMBER },
            selectedScenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  clipId: { type: Type.STRING },
                  inPoint: { type: Type.NUMBER },
                  outPoint: { type: Type.NUMBER },
                  speed: { type: Type.NUMBER },
                  zoom: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                  dialogueHighlight: { type: Type.STRING },
                },
                required: ['clipId', 'inPoint', 'outPoint', 'speed', 'zoom', 'reason'],
              },
            },
          },
          required: ['theme', 'summary', 'selectedScenes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Lỗi phân tích Gemini AI:', error);
    return res.status(500).json({
      error: error.message || 'Lỗi xử lý AI',
      fallback: true,
    });
  }
});

// Endpoint to check GPU / AI status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    gpuAcceleration: 'WebGL2 / Hardware VideoEncoder Supported',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CinePro Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
