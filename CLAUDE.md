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
- 데이터는 **브라우저 localStorage**에 저장 → 브라우저별 개별 저장, 사용자 간 공유 안 됨.
- React를 **unpkg.com**에서 로드 → 인터넷 필요.
- PDF/PPTX 출력은 이 사이트에 없음 → 별도 파이프라인(아래) 담당.

## 배포
- GitHub: `ledlaputa72/avycon-accessory-guide`
- Vercel: 저장소 Import → Framework "Other" → Deploy. push 시 자동 재배포.
- 재export 시: `cp "결합 가이드 템플릿.dc.html" index.html` 후 커밋.

## 연관 도구 (이 저장소 밖)
상위 폴더 `07.Camera-Accessory-PDF/_build/` 에 CSV/엑셀 → PDF·PPTX 자동 생성
파이프라인이 있음(generate.py / generate_pptx.py). 필요 시 별도 저장소로 분리 권장.
