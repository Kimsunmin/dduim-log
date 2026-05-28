# 뜀로그 (dduim.log)

> **🏃 [https://dduim-log.vercel.app](https://dduim-log.vercel.app)**

러너들이 나만의 동네 러닝 코스를 직접 그리고 공유하는 모바일 최적화 웹 앱입니다.

## 주요 기능

- **코스 그리기** — 지도에서 경로를 찍어 나만의 러닝 코스 생성
- **코스 탐색** — 다른 러너들의 코스를 지도·목록으로 탐색
- **즐겨찾기** — 마음에 드는 코스 저장
- **코스 공유** — 링크 복사로 코스 URL 공유
- **지역 필터링** — 시·구 단위로 코스 필터
- **모바일 최적화** — 430px 기준 모바일 퍼스트 UI

## Stack

- **Next.js** 15 App Router + Turbopack
- **TypeScript** (strict)
- **Tailwind CSS**
- **Kakao Maps Web API** (경로 그리기, 역지오코딩)
- **Vercel** 배포

## 개발 서버 실행

```bash
pnpm install
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 환경 변수

`.env.local` 파일에 Kakao Maps 앱키를 설정합니다.

```
NEXT_PUBLIC_KAKAO_MAP_KEY=your_kakao_app_key
```

## 배포

[https://dduim-log.vercel.app](https://dduim-log.vercel.app) (Vercel)
