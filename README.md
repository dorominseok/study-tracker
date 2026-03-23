# Study Tracker

Study Tracker는 PC 환경에서 학습 시간 데이터를 기록하고 시각화하여 사용자가 자신의 공부 패턴을 분석하고 효율적으로 관리할 수 있도록 지원하는 웹 기반 학습 관리 시스템입니다.

## 기술 스택

- Backend: Node.js, Express
- Database: MariaDB
- Authentication: JWT, bcrypt
- DB Driver: mysql2
- Frontend: React

## 구현된 기능

현재까지 다음 기능이 구현되어 있습니다.

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


현재 백엔드의 핵심 API 기능은 구현된 상태이며, 인증이 필요한 API는 JWT 토큰 기반으로 보호되고 있습니다.

## 주요 API

### 인증 (Auth)
- `POST /register` : 회원가입
- `POST /login` : 로그인
-  JWT 인증 미들웨어

### 과목 관리 (Subject)
- `GET /subjects` : 과목 목록 조회
- `POST /subjects` : 과목 생성
- `DELETE /subjects/:id` : 과목 삭제

### 공부 세션 (Study Session)
- `POST /sessions/start` : 공부 시작
- `POST /sessions/pause` : 공부 일시정지
- `POST /sessions/resume` : 공부 재개
- `POST /sessions/end` : 공부 종료
- `GET /sessions` : 공부 기록 조회

### 통계 (Statistics)
- `GET /statistics/daily` : 일일 공부시간 조회
- `GET /statistics/weekly` : 주간 공부시간 조회

### 목표 공부시간 (Daily Goal)
- `GET /daily-goal` : 목표 공부시간 조회
- `PUT /daily-goal` : 목표 공부시간 설정
- 
## 미구현 기능

현재 아래 기능들은 아직 구현되지 않았거나, 추후 보완이 필요한 항목입니다.


- 집중 모드 화면
- Fullscreen 학습 모드
- 탭 전환 감지 기능
- 사용자가 일정 시간 동안 탭을 벗어났을 때 자동 일시정지 기능
- 통계 시각화 UI
- 테스트 코드 작성
- 개인 서버 환경에서의 최종 실행 점검 및 통합 확인

