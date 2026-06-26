# CLAUDE.md — AVYCON 카메라 악세서리 결합 가이드 (웹)

Claude Code 작업용 프로젝트 컨텍스트.

## 프로젝트 개요
Claude Design에서 내보낸 **정적 웹사이트**. 카메라 악세서리 결합 조합을 보여주는
문서 뷰어 + 제품 관리 드로어(클라이언트 사이드). 빌드 단계 없음 → GitHub→Vercel 정적 배포.

## 구조
- `index.html` — 진입점 (메인 디자인 문서 `결합 가이드 템플릿.dc.html` 의 복사본)
- `support.js` — Claude Design 런타임 (React를 unpkg CDN에서 로드)
- `uploads/` — 이미지·PPTX 등 에셋
- `결합 가이드 템플릿*.dc.html` — 원본/인쇄용 디자인 문서
- `vercel.json` — 정적 호스팅 설정
- `screenshots/` — 작업 스크린샷(배포 불필요, 삭제 가능)

## 핵심 동작 / 제약
- 제품 **데이터**(productDb/accNames/layout 등)는 **브라우저 localStorage**에 저장 → 브라우저별 개별. 팀 공유는 **CSV 내보내기/가져오기**로 수동 동기화.
- **이미지는 Vercel Blob(공개 스토어)에 온라인 저장**됨 → 업로드 시 `/api/upload`(서버리스)로 올라가 **공개 URL**을 받고, 그 URL을 `imgByName[모델명]`에 저장. CSV의 **`ImageURL`** 컬럼으로 함께 공유되어 **다른 사용자도 동일 이미지**를 봄. (업로드 실패/로컬 미리보기 시 base64로 자동 폴백)
  - 업로드 전 클라이언트에서 1280px·JPEG로 자동 축소.
  - 관련 코드: `api/upload.js`, `index.html`의 `_uploadImage`/`_resizeImage`, `exportProductCsv`/`importProductCsv`.
  - ⚠️ 이 이미지 호스팅 로직은 Claude Design 산출물인 `index.html`(및 `.dc.html`)의 JS에 직접 삽입됨 → **디자인 재export 시 사라짐**. 재export 후 재적용 필요(변경 내역은 git에 보존).
- **다국어(i18n)**: UI 전체가 한 가지 언어로만 표시됨(이중언어 라벨 제거). 설정 드로어 상단 **언어** 선택(영어/한국어/일본어/스페인어), `localStorage('avycon_lang')`에 저장, 기본 영어. 문구는 `index.html`의 `I18N` 사전 + `{{ t.* }}` 바인딩으로 관리(사용자 입력 데이터는 번역 안 함). 폰트는 모두 Pretendard.
- **Export(인쇄/PDF)**: 브라우저 인쇄(Ctrl/⌘+P) 한 번으로 **커버 + 모든 location 페이지**가 하나의 문서로 출력됨. 화면에서는 한 번에 한 페이지만 보이지만(현재 view), 인쇄 시 `.print-page` 전체가 나옴(`@media print`). 화면 전용 요소는 `.screen-only`.
- **커버 페이지**: `#9E1B32` 배경 + B/W 요소 + location 카드. 설정 드로어의 **커버 페이지** 버튼 → 별도 편집 화면(`view:'cover'`). 대부분 내용은 설정·데이터에서 자동 반영, 커버 전용 편집 필드는 푸터 문구/버전(`settings.coverFooter`/`coverVersion`).
- 화면 view는 `main`(선택 location 1개) / `cover` / `db` 3가지.
- React를 **unpkg.com**에서 로드 → 인터넷 필요.
- PDF/PPTX 출력은 이 사이트에 없음 → 별도 파이프라인(아래) 담당.

## 배포
- GitHub: `ledlaputa72/avycon-accessory-guide`
- Vercel: 저장소 Import → Framework "Other" → Deploy. push 시 자동 재배포.
- 재export 시: `cp "결합 가이드 템플릿.dc.html" index.html` 후 커밋.

### Vercel Blob (이미지 호스팅) 설정 — 1회
- Vercel Storage에서 **Public** Blob 스토어 생성(예: `avycon-accessory-guide-image-pub`). ⚠️ 비공개(Private) 스토어는 `access:'public'` 업로드가 막혀 안 됨(공개 URL 필요).
- 프로젝트에 Connect 시 **"Add a read-write token env var to this connection" 체크** 필수 → `BLOB_READ_WRITE_TOKEN`(접두사 `BLOB`)이 주입됨. 이게 빠지면 `/api/upload`가 503.
- 환경변수 변경 후에는 **새 배포**가 떠야 적용됨(기존 운영 배포는 옛 토큰 유지).
- `package.json`의 `@vercel/blob` 의존성을 Vercel이 함수 빌드 시 설치.

## 연관 도구 (이 저장소 밖)
상위 폴더 `07.Camera-Accessory-PDF/_build/` 에 CSV/엑셀 → PDF·PPTX 자동 생성
파이프라인이 있음(generate.py / generate_pptx.py). 필요 시 별도 저장소로 분리 권장.
