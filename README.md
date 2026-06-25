# AVYCON 카메라 악세서리 결합 가이드 (웹)

Claude Design에서 내보낸 정적 사이트입니다. **빌드 단계 없이** GitHub → Vercel로 바로 배포됩니다.

## 구성
```
avycon-accessory-guide/
 ├─ index.html                 ← 진입점 (메인 디자인 문서 복사본)
 ├─ support.js                 ← Claude Design 런타임 (React를 unpkg CDN에서 로드)
 ├─ 결합 가이드 템플릿.dc.html       ← 원본 디자인 문서 (재export 시 이 파일로 갱신)
 ├─ 결합 가이드 템플릿-print-*.dc.html ← 인쇄용 변형본
 ├─ uploads/                   ← 이미지·PPTX 등 에셋
 ├─ screenshots/               ← 작업 스크린샷(배포에 불필요, 삭제 가능)
 ├─ vercel.json                ← 정적 호스팅 설정 (cleanUrls)
 └─ .gitignore
```

## 1) 기존 GitHub 계정에 올리기
이 폴더에서(터미널/깃배시):
```bash
git init -b main
git add .
git commit -m "AVYCON accessory guide - initial deploy"
# 깃허브에서 빈 저장소를 먼저 만든 뒤, 그 주소를 넣으세요:
git remote add origin https://github.com/<your-id>/avycon-accessory-guide.git
git push -u origin main
```
이때부터 **이 폴더가 곧 깃과 동기화되는 로컬 클론**입니다.
(또는 깃허브에서 저장소를 먼저 만들고 `git clone` 한 폴더에 위 파일들을 넣어도 됩니다.)

## 2) Vercel 연결 (자동 배포)
1. vercel.com 로그인 → **Add New… → Project**
2. 방금 만든 GitHub 저장소 **Import**
3. Framework Preset: **Other** (정적), Build/Output 설정 비움 → **Deploy**
4. 끝나면 `https://avycon-accessory-guide.vercel.app` 같은 URL이 생깁니다.

이후 `git push` 할 때마다 Vercel이 **자동 재배포**합니다.

## 3) 로컬에서 코드로 수정하는 흐름
```bash
# 동기화된 폴더에서
# (파일 수정 후)
git add .
git commit -m "수정 내용"
git push          # → Vercel 자동 재배포
```
로컬 미리보기는 아무 정적 서버나 사용하면 됩니다(예: `npx serve .` 또는 VS Code Live Server).

## ⚠️ 알아둘 한계 (정적 사이트라서)
- **데이터는 브라우저 localStorage에 저장** → 추가한 제품은 **그 브라우저에서만** 보입니다. 팀원끼리 **공유되지 않습니다.** 공유가 필요하면 별도 백엔드(폼/시트/DB) 또는 CSV 번들 방식이 필요합니다.
- **PDF/PPTX Export 버튼은 Claude UI 기능이라 따라오지 않습니다.** 자체 호스팅 페이지에서 PDF는 브라우저 인쇄(Ctrl/⌘+P)로, PPTX는 우리가 만든 파이프라인으로 처리합니다.
- React를 **unpkg.com CDN**에서 불러오므로 인터넷 연결이 필요합니다(오프라인이면 React를 로컬에 받아 경로 교체 필요).

## 4) 디자인을 다시 export 했을 때
새 `.dc.html`로 교체 후, 진입점도 갱신:
```bash
cp "결합 가이드 템플릿.dc.html" index.html
git add . && git commit -m "update design" && git push
```
