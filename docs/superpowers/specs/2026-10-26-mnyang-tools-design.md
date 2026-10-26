# mnyang-tools 설계

작성일: 2026-10-26
상태: 사용자 검토 대기

## 1. 의도

내 GitHub 저장소, 다른 사람의 저장소, 외부 웹사이트의 유틸리티를 한곳에 모아 **디바이스별로 찾고 받아갈 수 있는 정적 사이트**를 만든다. 원본 저장소에는 없는 사용법과 팁을 항목마다 직접 써서 덧붙이는 것이 핵심이다. 제목만 나열하면 무엇인지 알 수 없으므로, 목록에서는 한 줄 요약을, 상세 페이지에서는 설치 방법과 팁을 보여 준다.

## 2. 목표, 비목표, 반목표

목표
- 디바이스(Windows, Android, 웹)별로 항목을 거르고 검색할 수 있다.
- 항목마다 마크다운으로 쓴 상세 페이지(설치 방법, 팁, 스크린샷)가 있다.
- 항목 추가는 마크다운 파일 하나를 만드는 것으로 끝난다.
- 내가 만들었거나 고친 항목은 GitHub 프로필 이미지로 표시된다.
- 비용 0원, 상시 운영할 서버 없음.

비목표
- 디바이스 아래 세부 카테고리. 사용자가 명시적으로 빼기로 했다.
- 로그인, 댓글, 평점, 방문자 통계.
- 관리자 화면이나 웹에서 항목 편집.
- 다국어. 한국어만 쓴다.

반목표 (동작해도 실패로 보는 경우)
- 다른 사람의 실행 파일이나 설치 파일을 이 사이트나 저장소에 복사해 재배포하는 것. 외부 항목은 원본으로 링크만 한다.
- 방문자 브라우저에서 GitHub API를 호출해 IP당 시간당 60회 제한에 걸리는 구조.
- 카드에 제목만 있어 무엇인지 알 수 없는 목록.

## 3. 제약

| 항목 | 값 |
|---|---|
| 호스팅 | GitHub Pages (무료, 정적) |
| GitHub 계정 | ForUltraplayer |
| 저장소 | `ForUltraplayer/mnyang-tools` (신규, 공개) |
| 사이트 주소 | `https://forultraplayer.github.io/mnyang-tools/` |
| 프레임워크 | Astro |
| 로컬 작업 폴더 | `J:\Coding_project\Mnyang_github_io` |

- 하위 경로 호스팅이므로 Astro 설정의 `site`와 `base`(`/mnyang-tools`)를 반드시 지정하고, 모든 내부 링크와 이미지 경로가 base를 따르게 한다. 빠뜨리면 배포 후 링크와 이미지가 깨진다.
- GitHub Pages 경로는 대소문자를 구분하므로 저장소 이름은 소문자 `mnyang-tools`로 고정한다.
- 사이트 크기 권장 한도는 1GB이다. 스크린샷은 적당히 압축해서 넣는다.
- 저장소 루트 대표 사이트(`ForUltraplayer.github.io`)는 비워 둔다. 사용자가 나중에 다른 용도로 쓰려고 남겨 둔 자리다.

## 4. 정보 구조

### 4.1 디바이스

`Windows`, `Android`, `web`(화면 표기는 "웹") 세 가지로 시작한다. 한 항목이 여러 디바이스를 가질 수 있고, 그런 항목은 해당 탭마다 모두 보인다(예: Vencord는 Windows와 웹). 상세 페이지는 하나이며, 기기별 설치법은 본문 안에서 나눠 쓴다. 디바이스 종류는 나중에 macOS 등이 필요해지면 늘린다.

### 4.2 출처

| 값 | 화면 표기 | 프로필 배지 | 예시 |
|---|---|---|---|
| `mine` | 직접 만듦 | 있음 | pc_optimizer |
| `modified` | 수정판 | 있음 | Notifications_Pro_mnyang |
| `external` | 외부 | 없음 | Vencord |

출처 구분은 설계자 제안으로 넣었고, 사용자가 반대하지 않았다.

### 4.3 항목 데이터

항목 하나가 마크다운 파일 하나다(Astro content collection). 앞부분(frontmatter)에 메타데이터를, 본문에 사용법과 팁을 쓴다.

| 필드 | 필수 | 설명 |
|---|---|---|
| `title` | 예 | 화면에 보이는 이름 |
| `summary` | 예 | 카드와 상세 상단에 보이는 한 줄 설명 (한국어) |
| `devices` | 예 | `windows`, `android`, `web` 중 하나 이상 |
| `source` | 예 | `mine`, `modified`, `external` |
| `repo` | 아니오 | `owner/name` 형식 GitHub 저장소 |
| `website` | 아니오 | 외부 사이트 주소 |
| `download` | 아니오 | 받기 버튼 주소를 직접 지정할 때 |
| `order` | 아니오 | 목록 정렬 가중치 |

`repo`와 `website` 중 하나는 반드시 있어야 한다. 스키마 검증으로 빌드 시 누락을 잡는다.

예시 (제안):

```markdown
---
title: pc_optimizer
summary: Windows PC 진단, 정리, 최적화 도구
devices: [windows]
source: mine
repo: ForUltraplayer/pc_optimizer
---

## 설치 방법
1. 받기 버튼으로 zip을 받아 압축을 푼다.

![실행 화면](./pc_optimizer-main.png)

## 팁
- 관리자 권한으로 실행해야 정리 기능이 켜진다.
```

본문이 비어 있어도 빌드는 되어야 한다. 처음에는 요약만 있고 본문은 사용자가 차차 채운다.

## 5. 화면

시안은 브라우저 미리보기에서 사용자가 확인하고 승인했다(A안 + 검색바).

### 5.1 목록 화면 (첫 화면)

위에서 아래로 다음 순서다.

1. 헤더: GitHub 프로필 이미지, 사이트 이름 `mnyang-tools`, 계정명 `ForUltraplayer`. 프로필 영역은 `https://github.com/ForUltraplayer`로 연결한다.
2. 검색바: 제목과 요약을 대상으로 즉시 거른다. 상세 본문은 검색 대상이 아니다.
3. 디바이스 탭: `전체`, `Windows`, `Android`, `웹`. 탭마다 항목 수를 표시한다. 검색과 탭은 함께 적용된다.
4. 카드 그리드: 카드마다 제목, 요약, 디바이스 칩, 출처가 `mine` 또는 `modified`이면 작은 프로필 배지. 카드를 누르면 상세 페이지로 간다.

선택한 탭은 주소에 반영해(예: `?device=android`) 링크를 공유할 수 있게 한다. 이는 설계자 판단이다.

### 5.2 상세 페이지

1. 목록으로 돌아가는 링크
2. 제목, 프로필 배지(해당 시), 요약
3. 칩: 디바이스, 출처, 최신 Release 태그(있을 때)
4. 버튼
   - 받기: `download`가 있으면 그 주소, 없고 `repo`에 Release가 있으면 그 저장소의 최신 Release 페이지(`https://github.com/<repo>/releases/latest`)
   - GitHub 저장소: `repo`가 있을 때
   - 사이트: `website`가 있을 때
   - 받을 것이 없으면 받기 버튼을 숨긴다.
5. 마크다운 본문(설치 방법, 팁, 스크린샷)

### 5.3 반응형

휴대폰 폭에서도 쓸 수 있어야 한다. Android 항목을 휴대폰에서 바로 찾는 경우가 많을 것이다(설계자 추정). 좁은 화면에서는 카드가 한 줄에 하나로 바뀌고, 탭은 가로로 스크롤된다.

## 6. GitHub 정보와 프로필 이미지

- 프로필 이미지는 빌드할 때 `https://github.com/ForUltraplayer.png`에서 받아 사이트에 같이 넣는다. 방문자는 GitHub에 직접 요청하지 않는다. 설계자 판단이다.
- 최신 Release 태그와 Release 유무는 빌드할 때 GitHub API로 가져온다. GitHub Actions에서는 기본 제공 `GITHUB_TOKEN`을 쓴다. 이 토큰은 다른 저장소에 대해서는 공개 정보만 읽을 수 있으므로, 사이트에 올리는 `repo`는 공개 저장소여야 한다. 2026-10-26 기준 초기 항목의 저장소 7개는 모두 공개이다.
- API 실패 처리 (설계자 판단)
  - GitHub Actions 빌드에서 API 호출이 실패하면 **빌드를 실패시킨다**. 조용히 넘어가면 받기 버튼이 전부 사라진 사이트가 배포되기 때문이다. 이전 배포는 그대로 남는다.
  - 로컬 빌드(`CI` 환경 변수 없음)에서 실패하면 경고만 남기고, 버전 칩과 Release 기반 받기 버튼을 숨긴 채 빌드를 마친다.
  - Release가 없는 저장소(API가 404를 돌려주는 경우)는 정상 상황으로 보고 받기 버튼을 숨긴다. `/releases/latest`로 무조건 연결하지 않는다.
  - frontmatter의 `download`가 있으면 API 결과와 상관없이 그 주소로 받기 버튼을 만든다.
- 빌드 시 받은 GitHub 정보는 화면 보조용이다. 제목과 요약은 항상 마크다운 파일의 값을 쓴다.

## 7. 빌드와 배포

- `J:\Coding_project\Mnyang_github_io`가 저장소 루트이다. 설계 문서(`docs/`)도 저장소에 같이 올라가며, 공개되어도 문제없는 내용만 담는다. `.superpowers/`와 `node_modules/`, 빌드 결과물은 `.gitignore`로 뺀다.
- 구현은 로컬 빌드와 로컬 미리보기 확인까지 먼저 끝낸다. GitHub 공개 저장소 생성, 첫 push, Pages 설정 변경은 외부 공개 작업이므로 사용자 승인을 받은 뒤 진행한다.

- `main` 브랜치에 push하면 GitHub Actions가 빌드하고 GitHub Pages로 배포한다. Astro 공식 GitHub Pages 배포 방식을 따른다.
- 저장소 설정에서 Pages 소스를 "GitHub Actions"로 지정해야 한다.
- 예약 실행(매일 다시 빌드 등)은 넣지 않는다. 다른 저장소에 새 Release가 나와도 사이트의 버전 칩은 다음 push 때 갱신된다. 이는 설계자 판단이며, 수동 실행 버튼(`workflow_dispatch`)은 둔다.

## 8. 초기 항목 (10개)

| 제목 | 요약 (초안) | 디바이스 | 출처 | 링크 | Release |
|---|---|---|---|---|---|
| Vencord | Discord 클라이언트 모드 | Windows, 웹 | external | vencord.dev | 해당 없음 |
| Morphe | YouTube, YouTube Music, Reddit 앱 패치 도구 | Android | external | morphe.software | 해당 없음 |
| Morphe Patches | Morphe용 커뮤니티 패치 모음 | Android | external | morphe-patches.software | 해당 없음 |
| pc_optimizer | Windows PC 진단, 정리, 최적화 도구 | Windows | mine | ForUltraplayer/pc_optimizer | 있음 |
| notification-filter | 키워드로 Android 알림 차단, 앱 예외와 차단 기록 | Android | modified | ForUltraplayer/notification-filter | 있음 |
| Notifications Pro (mnyang) | 한국어 UI와 앱별 알림음을 넣은 Notifications Pro 수정판 | Windows | modified | ForUltraplayer/Notifications_Pro_mnyang | 있음 |
| SPOTIFY_PC | Spotify 가사 한글 발음 표시 패치 (Windows) | Windows | modified | ForUltraplayer/SPOTIFY_PC | 없음 |
| SPOTIFY_ANDROID | 한글 발음 표시를 넣은 Myspoti 수정판 | Android | modified | ForUltraplayer/SPOTIFY_ANDROID | 없음 |
| GalaxyBookEnabler | 일반 Windows PC에서 갤럭시 북 기능(Quick Share 등) 사용 | Windows | modified | ForUltraplayer/GalaxyBookEnabler | 없음 |
| ShutterSoundZero | 카메라 셔터음 끄기 앱 | Android | external | hoons1994/ShutterSoundZero | 있음 |

- 요약은 각 저장소 설명과 사이트를 바탕으로 쓴 초안이며, 사용자가 다듬는다.
- notification-filter는 저장소 설명에 Push Filter 기반이라고 적혀 있어 `modified`로 분류했다.
- ShutterSoundZero의 요약은 이름에서 추정했다. 저장소 설명이 "ShutterSoundZero App repository"뿐이라 확인이 필요하다.
- Release 유무는 2026-10-26에 `gh repo view`로 확인한 값이다.

## 9. 빌더에게 맡기는 부분

- Astro Directory 템플릿(`alekblom/c00d-astro-directory`, MIT, Astro 7)을 가져다 고칠지, 빈 Astro 프로젝트에서 시작할지. 이 템플릿은 평점과 카테고리 박스 중심이라 이번 화면 구성(탭 + 카드 + 마크다운 상세)과 차이가 크다. 설계자 의견은 빈 Astro 프로젝트에서 시작하고 템플릿은 참고만 하는 쪽이다. 템플릿 코드를 가져오면 MIT 라이선스 고지를 남긴다.
- 색상, 글꼴, 간격 등 시각 디자인 세부. 시안의 밝은 파랑 강조색과 다크 모드 대응은 참고 수준이다.
- 검색 구현 방식(클라이언트 스크립트로 충분하다).
- 스크린샷 파일 위치와 이미지 최적화 방식.

## 10. 열려 있는 사항

- 사용자는 초기 항목 10개를 모두 첫 배포에 넣기로 했다.
- 정정: 처음에는 내 저장소 7개 모두 LICENSE가 없다고 보고했으나, 2026-10-26에 각 저장소 루트를 다시 확인한 결과 pc_optimizer를 뺀 저장소에는 LICENSE 파일이 있다(notification-filter와 GalaxyBookEnabler는 MIT, SPOTIFY_PC와 SPOTIFY_ANDROID는 GPL-3.0, Notifications_Pro_mnyang은 GPL 본문 앞에 원저작자 고지가 붙어 GitHub가 종류를 판별하지 못함). 처음 보고는 `gh repo view` 조회 결과를 잘못 읽은 것이다. LICENSE가 없던 저장소는 pc_optimizer뿐이었고, 사용자 결정에 따라 2026-10-26에 GPL-3.0 LICENSE를 기본 브랜치(`codex/sp1-actions`)에 추가했다(커밋 `1184236`). GitHub도 GPL-3.0으로 인식한다.
- 브레인스토밍 시안 파일이 `.superpowers/` 폴더에 있다. 저장소를 만들 때 `.gitignore`에 넣는다.
