# Tilt Guitar

기울기 센서를 이용한 기타 악기 프로젝트

## 구성

### desktop/ - 맥북용 (Python)
- SMS 가속도계로 맥북 기울기 감지
- Karplus-Strong 알고리즘 기타 합성
- Intel 맥북 전용 (SMS 센서 필요)

```bash
cd desktop
pip3 install -r requirements.txt
python3 main.py
```

### web/ - 모바일용 (웹앱)
- DeviceOrientation API로 핸드폰 기울기 감지
- Web Audio API 기타 합성
- 데스크톱에서는 마우스 폴백

```bash
cd web
npx serve src
```

## 기술 스택
- Python: numpy, sounddevice, pyobjc-framework-IOKit
- Web: HTML/CSS/JavaScript, Web Audio API, DeviceOrientation API
