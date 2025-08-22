# 판교어 번역기 (Pangyo Translator)

표준어 ↔ 판교체(판교어) 변환 웹앱. 기본은 로컬 규칙 기반, 선택적으로 LLM 번역 모드 지원.

## 빠른 실행(로컬 규칙 기반)
1) `index/index.html`을 브라우저로 열기(또는 VS Code Live Server 사용).
2) 번역 방향 선택 → 텍스트 입력 → 번역.
3) 옵션: “판교 바이브 강화” 체크.

## 선택: LLM 번역 모드
키를 브라우저에 직접 넣지 않고, 작은 서버를 통해 호출합니다.

- 서버 준비
  1) `server/` 폴더 생성 후 아래 파일 추가
     - `server/package.json`
       ```json
       {
         "name": "pangyo-translator-server",
         "private": true,
         "type": "module",
         "version": "0.1.0",
         "main": "index.js",
         "scripts": { "dev": "node ./index.js", "start": "node ./index.js" },
         "dependencies": {
           "cors": "^2.8.5",
           "dotenv": "^16.4.5",
           "express": "^4.19.2",
           "node-fetch": "^3.3.2"
         }
       }
       ```
     - `server/.env` (예시는 아래)
       ```bash
       OPENAI_API_KEY=sk-xxx
       OPENAI_MODEL=gpt-4o-mini
       PORT=8787
       ```
     - `server/index.js`
       ```javascript
       import 'dotenv/config';
       import express from 'express';
       import cors from 'cors';
       import fetch from 'node-fetch';

       const app = express();
       app.use(cors());
       app.use(express.json());

       const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
       const API_KEY = process.env.OPENAI_API_KEY;

       app.post('/api/translate', async (req, res) => {
         try {
           const { text = '', direction = 'toPangyo', vibe = true } = req.body || {};
           const system = `You are a Korean copywriter who translates between Standard Korean and "Pangyo corporate lingo" (판교체).
       - When direction is toPangyo: convert to Pangyo-ese (if vibe, add light corporate flair).
       - When direction is toStandard: convert back to clear Standard Korean.
       - Output only the converted text.`;
           const user = `direction=${direction} vibe=${vibe}\n\n${text}`;

           const resp = await fetch('https://api.openai.com/v1/chat/completions', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
             body: JSON.stringify({
               model: MODEL,
               messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
               temperature: 0.4
             })
           });

           if (!resp.ok) return res.status(502).json({ error: 'upstream_error' });
           const data = await resp.json();
           const textOut = data.choices?.[0]?.message?.content?.trim() ?? '';
           res.json({ text: textOut });
         } catch {
           res.status(500).json({ error: 'LLM translation failed' });
         }
       });

       const port = Number(process.env.PORT || 8787);
       app.listen(port, () => console.log(`Server on http://localhost:${port}`));
       ```
  2) 실행
     ```bash
     cd server
     npm i
     npm run dev
     ```

- 프런트엔드(간단 연결 가이드)
  - `index/index.html` 컨트롤 영역에 토글 추가:
    ```html
    <label class="vibe">
      <input type="checkbox" id="llmToggle"> LLM 번역 사용
    </label>
    ```
  - `index/app.js`에서 `llmToggle`를 읽어 켜져 있으면 `POST http://localhost:8787/api/translate`로 `{ text, direction, vibe }` 전송해 받은 `data.text`를 출력하세요. 꺼져 있으면 기존 규칙 기반을 사용합니다.

## 개발 메모
- 사전(규칙 기반)은 `index/app.js`의 `phrasePairs`, `wordPairs`에 정의되어 있습니다.
- LLM 모드는 백엔드를 통해 호출하며 키는 서버 환경변수로만 보관합니다.

## 라이선스
ttneck.053

## 🚀 최신 업데이트 (2024-12-19)

### **개념 단위(Concept) 기반 번역 시스템 도입**
- **기존**: 단순 단어→단어 매칭 방식
- **새로운**: 개념→개념 매칭 방식으로 완전 업그레이드

#### **구현된 개념들**
- **URGENCY**: "빠르게" ↔ "ASAP", "아삽", "아쌉"
- **SECURITY**: "보안" ↔ "세커티", "시큐리티"
- **DEADLINE**: "마감일" ↔ "듀데잇", "데드라인"
- **MEETING**: "회의" ↔ "미팅"
- **ISSUE**: "문제" ↔ "이슈"
- **CONFIRM**: "확인" ↔ "컨펌"
- **SHARE**: "공유" ↔ "쉐어"
- **REVIEW**: "검토" ↔ "리뷰"
- **SCHEDULE**: "일정" ↔ "스케줄"
- **REFERENCE**: "자료" ↔ "레퍼런스"
- **KICKOFF**: "시작" ↔ "킥오프"
- **WRAPUP**: "정리" ↔ "랩업"
- **REQUEST**: "부탁" ↔ "리퀘스트"

#### **핵심 개선사항**
✅ **정규식 기반 패턴 매칭**: 단순 단어 교체가 아닌 복잡한 패턴 처리  
✅ **컨텍스트 인식**: "ASAP하게" 같은 복합 표현 처리  
✅ **양방향 변환**: 판교어 ↔ 표준어 완벽 호환  
✅ **확장 가능한 구조**: 새로운 개념 추가가 쉬움  

#### **테스트 예시**
```javascript
// 입력: "이거 내일까지 ASAP하게 끝내주세요."
// 출력: "이거 내일까지 빨리 끝내주세요."

// 입력: "세커티 쪽 이슈 있나요? 듀데잇은 내일로 잡을게요."
// 출력: "보안 쪽 문제 있나요? 마감일은 내일로 잡을게요."
```

---