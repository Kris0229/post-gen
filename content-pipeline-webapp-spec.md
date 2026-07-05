# 巨人情報站 內容工作台｜規格 v2

> 從 RSS 新聞到部落格成稿的一站式網頁工具。
> 四個工作區：**新聞流 → 文章頁（抓全文＋翻譯）→ 素材庫 → 寫作工作台**。
> 本文件供 Claude Code 分階段實作，每個 Phase 完成後停下來等使用者驗收。

---

## 1. 核心流程（使用者旅程）

1. 開啟網頁 → 新聞流列出各來源最新巨人隊新聞（標題＋AI 摘要＋評分）
2. 點擊文章 → 進入文章頁，自動經 n8n 代理抓取全文；抓取失敗或內容殘缺 → 顯示手動貼上輸入區
3. 點「翻譯」→ 送 OpenAI GPT-5 串流翻譯成繁體中文（台灣用語）
4. 翻譯完成 → 選「略過」（該新聞標記結案）或「儲存為素材」
5. 儲存為素材 → 原文＋翻譯存入素材庫，可加多個標籤（如：交易傳聞、Chapman、農場）
6. 素材庫勾選一或多份素材 →「開始寫文章」→ 寫作工作台以「部落格文章助手」instructions 為 system prompt，與使用者多輪互動完成文章

FB 貼文階段本期不做（維持在 claude.ai），資料結構預留欄位。

## 2. 系統架構

```
n8n RSS workflow（不變）──寫入──▶ Firestore ◀──讀寫──▶ React 前端（GitHub Pages）
n8n Webhook「抓全文」◀──代理請求── 前端                前端 ──串流──▶ OpenAI API（GPT-5）
```

- Firebase：Firestore＋Auth（Google 登入、UID 白名單），Spark 免費方案
- OpenAI API：瀏覽器直呼，key 存 localStorage（個人工具模式）
- n8n（Zeabur）：既有 RSS 收集線改寫 Firestore；新增「抓全文」webhook

## 3. 技術棧

React 18 + TypeScript + Vite、Tailwind CSS、Zustand、react-router-dom、firebase。
不用 dnd-kit（v2 無看板拖曳需求）。OpenAI 串流用原生 fetch 解析 SSE，不裝 SDK。

## 4. Firestore 資料模型

### `articles`（新聞流，n8n 寫入）
```typescript
interface Article {
  id: string;
  title: string;
  link: string;          // 查重 key
  source: string;        // 'MLBTR' | 'MLB.com' | ... | '手動' | '其他'
  aiSummary: string;     // n8n AI 摘要
  angles: string[];      // n8n AI 建議切角
  score: number;         // 1–5，手動新增為 0
  pubDate: string;       // ISO
  createdAt: Timestamp;
  state: 'new' | 'skipped' | 'saved';  // saved＝已轉素材
  fullText: string;      // 抓取或手貼的全文（快取，抓過不重抓）
  translation: string;   // 翻譯稿（快取）
}
```

### `materials`（素材庫）
```typescript
interface Material {
  id: string;
  articleId: string;     // 來源文章，手動素材可為 ''
  title: string;
  link: string;
  source: string;
  originalText: string;
  translation: string;
  tags: string[];
  note: string;          // 選填備註
  createdAt: Timestamp;
  usedInSessions: string[]; // 被哪些寫作 session 用過
}
```

### `sessions`（寫作工作台對話）
```typescript
interface Session {
  id: string;
  title: string;             // 預設取第一份素材標題，可改
  materialIds: string[];
  messages: { role: 'user' | 'assistant'; content: string }[];
  finalDraft: string;        // 定稿另存，供之後 FB 階段使用
  fbPost: string;            // 預留
  status: 'writing' | 'done';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `settings/config`（單一 document）
```typescript
interface AppConfig {
  translatorInstructions: string;  // 翻譯 system prompt（自 Baseball Translator 遷入）
  blogInstructions: string;        // 部落格文章助手 instructions＋去AI感守則＋文筆範例
  fetchWebhookUrl: string;         // n8n 抓全文 webhook
}
```

### 安全規則
四個 collection 一律 `request.auth.uid == OWNER_UID` 才可讀寫（Phase 1 填入實際 UID）。
n8n 走 service account（IAM），不受規則限制。

## 5. 頁面規格

行動優先 RWD。頂部導覽三分頁：**新聞流｜素材庫｜寫作**，＋右上設定齒輪。

### 5.1 新聞流 `/`
- Firestore 即時訂閱 `articles`，`state == 'new'` 依 pubDate 降冪
- 列表項：標題、來源 tag（各來源固定色）、score badge（4–5 分橘底）、AI 摘要兩行、相對時間
- 篩選：來源多選、關鍵字搜尋、「顯示已略過/已儲存」切換
- 列表項右滑或長按 → 快速「略過」（不用進文章頁）
- 右下 FAB「＋」：手動貼網址新增（link 查重；`source: '手動'`）

### 5.2 文章頁 `/article/:id`
- 進入時若 `fullText` 為空 → 呼叫 `fetchWebhookUrl` 抓全文 → 存回 document（快取）
- 抓取中顯示 skeleton；失敗或回傳字數 < 500 → 顯示警示＋「手動貼上全文」textarea（貼上存為 fullText）
- 版面：上方標題＋來源＋「開啟原文」；內文區可切換「原文｜譯文｜對照」三種檢視
- 主要動作列（固定底部）：
  - **翻譯**：以 translatorInstructions 為 system prompt，fullText 為 user message，GPT-5 串流輸出到譯文區，完成後存回 `translation`
  - 翻譯完成後動作列變為：**略過**（state='skipped'，返回新聞流）｜**儲存為素材**
- 儲存為素材 → Modal：標籤輸入（既有標籤 chips 可點選＋自由輸入新標籤）、備註 → 建立 material、article.state='saved'

### 5.3 素材庫 `/materials`
- 卡片：標題、標籤 chips、來源、儲存日期、是否已用過（usedInSessions 非空顯示「已使用」淡標）
- 標籤篩選列（全部標籤聚合顯示）、關鍵字搜尋
- 點卡片 → 素材詳情（譯文全文、編輯標籤/備註、刪除）
- **多選模式**：長按或勾選按鈕進入，底部浮出「開始寫文章（n）」按鈕 → 建立 session 跳轉寫作工作台

### 5.4 寫作工作台 `/write/:sessionId`
- 聊天介面：system prompt = blogInstructions；首則 user message 由系統組裝：
  「以下是本次寫作素材：【素材1標題】譯文全文…【素材2…】。請先根據素材提出 2–3 個主題與大綱建議，與我討論後再動筆。」
- GPT-5 串流回覆；輸入框支援多行；每輪訊息即時寫回 session.messages（斷線可續）
- 側欄（桌面）／頂部抽屜（手機）：本次素材清單可點開對照
- 工具列：「存為定稿」（把指定的 assistant 訊息存進 finalDraft、status='done'）、「複製全文」
- `/write` 列表頁：所有 sessions（進行中／已完成），可繼續舊對話

### 5.5 設定 `/settings`
- OpenAI API key（localStorage，欄位遮罩）
- translatorInstructions / blogInstructions 兩個大 textarea（存 Firestore，附「字數／預估 token」提示）
- fetchWebhookUrl
- 連線測試按鈕（打一個最小 GPT-5 請求驗證 key）

## 6. OpenAI 呼叫規範

- 端點 `POST https://api.openai.com/v1/chat/completions`，`stream: true`
- 翻譯：`model: 'gpt-5', reasoning_effort: 'minimal'`（翻譯不需推理，求快）
- 寫作：`model: 'gpt-5'`（預設 effort，重品質）
- GPT-5 不接受自訂 temperature，一律不帶
- 寫作對話每輪傳完整 messages（instructions＋素材＋歷史）；session 過長（>50k 字）時 UI 提示開新 session
- 錯誤處理：401 → 導向設定頁；429/5xx → toast 重試按鈕；串流中斷 → 保留已收到內容

## 7. n8n 變更（使用者手動執行，寫入 README）

1. **RSS 線**：「建立 Notion 卡片」節點後並聯 Firestore 節點（Google Cloud Firestore node，service account 憑證），寫入 `articles`（state='new'，fullText/translation 空字串）。雙寫一週後停 Notion。
2. **新增「抓全文」webhook workflow**：
   Webhook(POST {url}) → HTTP Request 抓 HTML（User-Agent 設常見瀏覽器）→ Code 節點去 script/style/tag、取 <article> 或最長文字區塊 → Respond {title, text, chars}。失敗回 {error}。
   Webhook 網址填入 app 設定頁。

## 8. 分階段實作計畫（Claude Code）

- **Phase 0 初始化**：Vite+React+TS、Tailwind、router、資料夾結構、config placeholder、README（Firebase 與 n8n 設定步驟）。驗收：dev server 三分頁空殼可切換。
- **Phase 1 Firebase＋新聞流**：auth 白名單、articles 訂閱、新聞流列表＋篩選＋略過＋手動新增。驗收：n8n 測試寫入一筆，畫面即時出現。
- **Phase 2 文章頁與抓全文**：文章頁、webhook 代理呼叫、快取、失敗手貼 fallback、三檢視切換。驗收：一篇可自動抓、一篇付費牆走手貼。
- **Phase 3 翻譯**：設定頁（key＋instructions）、GPT-5 串流翻譯、略過／儲存為素材＋標籤 Modal。驗收：完整走完步驟 2–5。
- **Phase 4 素材庫**：列表、標籤篩選、詳情編輯、多選。驗收：標籤管理順手。
- **Phase 5 寫作工作台**：session 建立、聊天串流、素材側欄、定稿與複製、session 列表續聊。驗收：用真素材完成一篇文章草稿。
- **Phase 6 部署**：GitHub Actions → GitHub Pages（SPA 路由 404 fallback 處理）、n8n 正式切換。驗收：手機用正式網址走完整流程。

### 給 Claude Code 的工作守則
- 一次一個 Phase，完成後總結變更、停下等驗收
- TypeScript strict；Firestore 寫入集中 services 層；OpenAI 呼叫集中 lib/openai.ts
- 介面文字一律繁體中文（台灣用語）；設計主色 Giants 橘 #FD5A1E、黑 #27251F
- 不引入規格外套件；不提前實作 FB 階段
