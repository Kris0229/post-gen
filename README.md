# 巨人情報站 內容工作台

從 RSS 新聞到部落格成稿的一站式網頁工具。詳細規格見 [content-pipeline-webapp-spec.md](./content-pipeline-webapp-spec.md)。

## 開發

```bash
npm install
npm run dev
```

## 環境變數

複製 `.env.example` 為 `.env`，填入 Firebase 設定：

```bash
cp .env.example .env
```

| 變數 | 說明 |
| --- | --- |
| `VITE_FIREBASE_API_KEY` 等 | Firebase 專案設定（Firebase Console → 專案設定 → 一般 → 你的應用程式） |
| `VITE_OWNER_UID` | 白名單用的 Google 帳號 UID（Firebase Console → Authentication → Users，登入一次後複製 UID） |

OpenAI API key 不放在 `.env`，由使用者在網頁「設定」頁輸入，存於瀏覽器 localStorage。

## Firebase 設定步驟

1. [Firebase Console](https://console.firebase.google.com/) 建立新專案（Spark 免費方案即可）。
2. **Authentication** → Sign-in method → 啟用 Google 登入。
3. **Firestore Database** → 建立資料庫（production mode）。
4. 部署安全規則（四個 collection 僅限 `OWNER_UID` 讀寫）：

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       function isOwner() {
         return request.auth != null && request.auth.uid == "b5KQnyxRogf0LRjx1ATOg8AnBN33";
       }
       match /articles/{id}   { allow read, write: if isOwner(); }
       match /materials/{id}  { allow read, write: if isOwner(); }
       match /sessions/{id}   { allow read, write: if isOwner(); }
       match /settings/{id}   { allow read, write: if isOwner(); }
     }
   }
   ```

5. 專案設定 → 新增網頁應用程式 → 複製設定值填入 `.env`。
6. 用 Google 帳號登入一次網頁（`VITE_OWNER_UID` 留空時，登入後畫面會直接顯示你的 UID 供複製），填入 `.env` 的 `VITE_OWNER_UID` 並更新上方規則中的 UID，然後到 Firestore Database → 規則分頁貼上整段規則並發布。
7. n8n 走 service account（IAM 金鑰），不受上述規則限制，另見下方 n8n 設定。
8. 新聞流查詢（`state == 'new'` 且依 `pubDate` 排序）需要 Firestore 複合索引。第一次執行時畫面會顯示錯誤訊息附帶建立連結，點擊該連結並在 Console 按「建立索引」即可（生效約 1–3 分鐘）。

## n8n 設定步驟

### 1. RSS 收集線改寫 Firestore

既有「建立 Notion 卡片」節點後，並聯新增一個 **Google Cloud Firestore** node：

- 憑證：Google service account（IAM，於 Google Cloud Console 建立金鑰，並在 Firestore 給予寫入權限）
- Collection：`articles`
- 寫入欄位對應規格 `Article` 型別，其中 `state` 固定寫入 `'new'`，`fullText` / `translation` 留空字串
- 建議雙寫（Notion ＋ Firestore）觀察一週穩定後，再停用 Notion 節點

### 2. 新增「抓全文」webhook workflow

```
Webhook (POST {url})
  → HTTP Request 抓 HTML（User-Agent 設常見瀏覽器 UA，避免被擋）
  → Code 節點：去除 script/style 等標籤，取 <article> 或最長文字區塊
  → Respond to Webhook：{ title, text, chars }
  失敗時 Respond：{ error }
```

可直接匯入 [n8n/fetch-fulltext-workflow.json](./n8n/fetch-fulltext-workflow.json)：n8n Console → Workflows → Import from File，匯入後啟用（Active）。

前端會用 `POST { url: <文章連結> }` 呼叫這個 webhook，預期回應 `{ title, text, chars }` 或 `{ error }`。

建立完成後，將 webhook 網址（n8n 顯示的 Production URL）填入網頁「設定」頁的 `fetchWebhookUrl` 欄位。

## 技術棧

React 18 + TypeScript + Vite、Tailwind CSS v4、Zustand、react-router-dom、Firebase（Firestore + Auth）。OpenAI 串流使用原生 `fetch` 解析 SSE，不使用官方 SDK。

## 資料夾結構

```
src/
  components/   共用元件（Layout 等）
  pages/        各分頁（新聞流／文章頁／素材庫／寫作工作台／設定）
  services/     Firestore 讀寫與 Firebase 初始化
  lib/          OpenAI 呼叫封裝
  store/        Zustand store
  types/        Firestore 資料模型型別
```

## 分階段實作進度

- [x] Phase 0　初始化
- [x] Phase 1　Firebase＋新聞流
- [x] Phase 2　文章頁與抓全文
- [ ] Phase 3　翻譯
- [ ] Phase 4　素材庫
- [ ] Phase 5　寫作工作台
- [ ] Phase 6　部署
