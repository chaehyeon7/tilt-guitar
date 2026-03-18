# Guitar Tilt

기울기 센서를 이용한 웹 기타 악기

## 기능
- 기기를 기울여서 음 높낮이 조절
- Karplus-Strong 알고리즘 기반 기타 소리 합성
- 데스크톱: 마우스 폴백 지원

## 실행 방법
1. `npx serve src` 또는 Live Server로 `src/index.html` 실행
2. 모바일: 같은 와이파이에서 `http://IP:포트` 접속
3. "시작" 버튼 누르고 기울여서 연주

## 기술 스택
- HTML / CSS / JavaScript (순수 웹)
- Web Audio API
- DeviceOrientation API
