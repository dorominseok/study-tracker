# Study Tracker

Study Tracker는 사용자의 공부 시간을 기록하고 관리하기 위한 웹 애플리케이션입니다.  
사용자는 회원가입과 로그인 후 과목을 관리하고, 공부 세션을 시작하거나 일시정지/재개/종료할 수 있으며, 일간/주간 통계와 오늘의 목표 공부 시간을 확인할 수 있습니다.

현재 프로젝트는 개인 서버에서 실제로 동작하는 수준까지 구현하는 것을 목표로 진행 중이며, 백엔드 API와 React 프론트엔드 화면이 함께 구성되어 있습니다.

## Tech Stack

- Frontend: React, React Router
- Backend: Node.js, Express
- Database: MariaDB
- DB Driver: mysql2
- Authentication: JWT, bcrypt

## Current Status

현재까지 구현된 기능은 다음과 같습니다.

### Backend

- 회원가입 / 로그인 API
- JWT 기반 인증 미들웨어
- 과목(Subject) 관리
  - 과목 생성
  - 과목 목록 조회
  - 과목 삭제
- 공부 세션(StudySession) 관리
  - 공부 시작
  - 공부 일시정지
  - 공부 재개
  - 공부 종료
  - 공부 기록 조회
- 통계(Statistics)
  - 일일 공부시간 통계 조회
  - 주간 공부시간 통계 조회
- Daily Goal 관리
  - 목표 공부시간 설정
  - 목표 공부시간 조회
- React 프론트엔드 UI
  - 메인화면
  - 로그인 / 회원가입 화면
  - 공부 타이머 화면
  - 과목 관리 화면
  - 공부 기록 조회 화면
  - 통계 화면
  - 오늘 목표 공부시간 설정 화면

- JWT 인증 미들웨어
- 과목(Subject) 생성 / 조회 / 삭제
- 공부 세션 시작 / 일시정지 / 재개 / 종료
- 공부 기록 조회
- 일일 공부시간 통계 조회
- 주간 공부시간 통계 조회
- 목표 공부시간 설정 / 조회

### Frontend

- 메인 대시보드 화면
- 로그인 / 회원가입 화면
- 공부 타이머 화면
- 과목 관리 화면
- 공부 기록 조회 화면
- 통계 화면
- 오늘 목표 공부시간 설정 화면

## Project Structure

```text
study_tracker_pj/
  backend/
    db.js
    server.js
    middleware/
      authMiddleware.js
    routes/
      auth.js
      subject.js
      session.js
      statistics.js
      dailyGoal.js
  frontend/
    public/
    src/
      api/
      components/
      pages/
        DashboardPage.js
        LoginPage.js
        RegisterPage.js
        TimerPage.js
        SubjectPage.js
        HistoryPage.js
        StatisticsPage.js
        DailyGoalPage.js
      App.js
```

## Backend API Summary

### Auth

- `POST /register`
- `POST /login`

### Subjects


- 집중 모드 화면
- `GET /subjects`
- `POST /subjects`
- `DELETE /subjects/:id`

### Sessions

- `POST /sessions/start`
- `POST /sessions/pause`
- `POST /sessions/resume`
- `POST /sessions/end`
- `GET /sessions`

### Statistics

- `GET /statistics/daily`
- `GET /statistics/weekly`

### Daily Goal

- `GET /daily-goal`
- `PUT /daily-goal`

## Frontend Routes

- `/` : 대시보드
- `/login` : 로그인
- `/register` : 회원가입
- `/timer` : 공부 타이머
- `/subjects` : 과목 관리
- `/history` : 공부 기록 조회
- `/statistics` : 통계 조회
- `/goal` : 오늘 목표 공부시간 설정

`/timer`, `/subjects`, `/history`, `/statistics`, `/goal` 경로는 로그인한 사용자만 접근할 수 있습니다.

## Database Tables

### User

- `id`
- `email`
- `password_hash`
- `created_at`

### Subject

- `id`
- `user_id`
- `name`
- `created_at`

### StudySession

- `id`
- `user_id`
- `subject_id`
- `start_time`
- `end_time`
- `duration`
- `memo`
- `status`
- `last_resume_time`
- `created_at`

### DailyGoal

- `id`
- `user_id`
- `target_minutes`
- `created_at`

## Authentication

보호된 API는 JWT 토큰이 필요합니다.  
로그인 성공 시 발급된 토큰을 아래 형식으로 요청 헤더에 포함해야 합니다.

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## How to Run

### 1. Database 준비

MariaDB에서 `study_tracker` 데이터베이스가 생성되어 있어야 합니다.

필요한 테이블:

- `User`
- `Subject`
- `StudySession`
- `DailyGoal`

참고:

- `StudySession`의 `status`, `last_resume_time` 컬럼은 백엔드 실행 시 자동 보정되도록 구성되어 있습니다.

### 2. Backend 실행

```bash
cd backend
npm install
node server.js
```

기본 포트:

- `backend/server.js` 기준 `3000`

### 3. Frontend 실행

```bash
cd frontend
npm install
npm start
```

### 4. 포트 설정 확인

현재 프론트 API 클라이언트는 `frontend/src/api/client.js`에서 아래 주소를 사용합니다.

```js
const API_BASE_URL = "http://localhost:4000";
```

반면 현재 백엔드 기본 포트는 `3000`입니다.  
따라서 실제 실행 전에는 아래 둘 중 하나로 맞춰야 합니다.

- 백엔드 포트를 `4000`으로 변경
- 또는 프론트의 `API_BASE_URL`을 `http://localhost:3000`으로 변경

이 부분을 맞추지 않으면 프론트에서 API 호출이 정상 동작하지 않습니다.

## Main User Flow

1. 회원가입 또는 로그인
2. 과목 생성
3. 공부 세션 시작
4. 필요 시 일시정지 / 재개
5. 공부 종료
6. 기록과 통계 확인
7. 오늘 목표 공부시간 설정

## Not Yet Implemented

현재 아래 항목은 아직 구현되지 않았거나, 추후 보완이 필요한 부분입니다.

- Focus Mode 전용 UI
- Fullscreen 학습 모드
- 탭 전환 감지 기능
- 일정 시간 탭 이탈 시 자동 일시정지
- 통계 시각화 개선
- 입력값 검증 강화
- 공통 에러 처리 구조 정리
- `.env` 기반 설정 분리
- 테스트 코드 작성
- 개인 서버 환경에서 전체 기능 통합 점검

## Notes

- 이 README는 2026년 3월 현재 구현 상태 기준으로 작성되었습니다.
- 프로젝트가 계속 진행 중이므로 구조와 기능은 이후 변경될 수 있습니다.
