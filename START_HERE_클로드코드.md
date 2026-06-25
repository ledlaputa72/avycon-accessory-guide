# 실행 지시서 (Claude Code 전용)

이 폴더를 Claude Code로 열고 이렇게만 말하면 됩니다:
> **"START_HERE_클로드코드.md 읽고 그대로 실행해줘"**

---

## Claude Code가 수행할 작업 (순서대로 그대로 실행)

이 저장소를 깃허브에 올리고 Vercel 배포까지 준비한다. 사용자 GitHub: `ledlaputa72`, email: `steve@avycon.com`.

1. 현재 폴더에 불완전한 `.git` 폴더가 있으면 삭제한다 (`rm -rf .git` / 윈도우면 `Remove-Item -Recurse -Force .git`).
2. `git init -b main` 후 `git config user.name "ledlaputa72"`, `git config user.email "steve@avycon.com"`.
3. `.gitignore`, `.gitattributes`, `vercel.json` 은 이미 있으니 건드리지 않는다.
4. `git add -A` → `git commit -m "Initial deploy: AVYCON accessory combination guide"`.
5. GitHub CLI(`gh`)가 설치·로그인돼 있는지 확인(`gh auth status`).
   - 되면: `gh repo create ledlaputa72/avycon-accessory-guide --public --source=. --remote=origin --push`
   - `gh` 미설치/미로그인이면: 먼저 `gh auth login` 안내하거나, 사용자가 github.com에서 빈 저장소 `avycon-accessory-guide` 를 만들게 한 뒤
     `git remote add origin https://github.com/ledlaputa72/avycon-accessory-guide.git && git push -u origin main`
6. push 성공하면 저장소 URL을 알려주고, 아래 Vercel 단계를 사용자에게 안내한다.

## Vercel (사용자가 브라우저에서)
1. vercel.com → **Add New… → Project**
2. `avycon-accessory-guide` 저장소 **Import**
3. Framework Preset: **Other** (Build/Output 비움) → **Deploy**
4. 이후 `git push` 할 때마다 자동 재배포.

## 프로젝트 메모 (참고)
- 정적 사이트. `index.html` 이 진입점, `support.js` 가 런타임(React를 unpkg CDN에서 로드 → 인터넷 필요).
- 데이터는 브라우저 localStorage 저장 → 사용자 간 공유 안 됨.
- PDF/PPTX 자동 생성은 상위 `_build/` 파이프라인(generate.py / generate_pptx.py) 담당. 필요 시 별도 저장소로 가져오기.
- 디자인 재export 시: `cp "결합 가이드 템플릿.dc.html" index.html` 후 커밋.
