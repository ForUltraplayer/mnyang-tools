# PC Optimizer 유틸리티 등록

PC Optimizer의 유틸리티 탭에 표시되는 외부 도구 34개를 `src/content/items/`에 등록했다. 기존 11개와 중복된 도구는 없으며, 등록 후 전체 45개, Windows 40개, Android 5개, 웹 1개이다. 한 도구가 여러 디바이스에 포함될 수 있다.

## 원본

- 저장소: [ForUltraplayer/pc_optimizer](https://github.com/ForUltraplayer/pc_optimizer)
- 확인한 커밋: `118423655f162d181676a10b2bbfca05219c93c5`
- [도구 설명과 연결 ID](https://github.com/ForUltraplayer/pc_optimizer/blob/118423655f162d181676a10b2bbfca05219c93c5/rules/troubleshooting-tools.json)
- [공식 사이트 URL과 보조 링크](https://github.com/ForUltraplayer/pc_optimizer/blob/118423655f162d181676a10b2bbfca05219c93c5/rules/vendor-links.json)
- [유틸리티 탭의 대상 선정](https://github.com/ForUltraplayer/pc_optimizer/blob/118423655f162d181676a10b2bbfca05219c93c5/src/PcOptimizer.App/ViewModels/TroubleshootingViewModel.cs): `mode=external`인 도구 전체를 표시한다.

## 등록 기준

- 파일 이름은 원본 도구의 `id`를 사용했다.
- 모든 신규 항목은 `source: external`, `devices: [windows]`이다. 원본의 Windows 유틸리티 사용 맥락을 옮겼으며, 다른 운영체제 지원 여부를 새로 판정하지 않았다.
- 공식 사이트 URL은 `linkId`에 대응하는 원본 값을 그대로 사용했다. GitHub 링크도 사이트 링크로 등록하여 기존 빌드의 Release API 조회 대상을 늘리지 않았다.
- 제목에서 괄호 안 용도를 분리하고, 목록용 한국어 요약을 작성했다. 상세 본문에는 원본의 용도와 사용 전 확인 사항을 옮겼다. USB 생성과 Windows 파티션 삭제의 차이, 정품 인증 확인 문구는 명확하게 다듬었다.
- Rufus의 보조 링크인 홍차의 꿈 블로그는 Rufus 상세 페이지의 참고 링크로 포함했다.
- 라이선스와 무료 이용 범위는 원본 설명 기준이며, 각 사이트 전체의 현재 이용 약관을 재검증한 기록은 아니다.

이 작업은 콘텐츠를 한 번 옮긴 것이다. PC Optimizer의 카탈로그가 바뀌어도 자동 동기화하지 않는다.
