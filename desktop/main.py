import numpy as np
import sounddevice as sd
import time
import sys

# --- Karplus-Strong 기타 합성 ---
SAMPLE_RATE = 44100
NOTES = {
    'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00,
    'A3': 220.00, 'B3': 246.94, 'C4': 261.63, 'D4': 293.66, 'E4': 329.63
}
NOTE_NAMES = list(NOTES.keys())
NOTE_FREQS = list(NOTES.values())

def pluck(freq, duration=1.5):
    buf_size = int(SAMPLE_RATE / freq)
    buf = np.random.uniform(-1, 1, buf_size).astype(np.float32)
    samples = np.zeros(int(SAMPLE_RATE * duration), dtype=np.float32)
    for i in range(len(samples)):
        samples[i] = buf[i % buf_size]
        buf[i % buf_size] = (buf[i % buf_size] + buf[(i + 1) % buf_size]) * 0.498
    return samples

def angle_to_note(val):
    clamped = max(-60, min(60, val))
    idx = round(((clamped + 60) / 120) * (len(NOTE_NAMES) - 1))
    return NOTE_NAMES[idx], NOTE_FREQS[idx]

# --- 센서 감지 ---
def try_macimu():
    """Apple Silicon (M2+) MEMS 가속도계"""
    try:
        from macimu import IMU
        if not IMU.available():
            return None
        return 'macimu'
    except ImportError:
        return None

def try_sms():
    """Intel 맥북 SMS 센서"""
    import ctypes, ctypes.util
    try:
        IOKit = ctypes.cdll.LoadLibrary(ctypes.util.find_library("IOKit"))
        result = ctypes.c_uint()
        IOKit.IOServiceGetMatchingServices(
            0, IOKit.IOServiceMatching(b"SMCMotionSensor"), ctypes.byref(result)
        )
        service = IOKit.IOIteratorNext(result)
        IOKit.IOObjectRelease(result)
        if service:
            IOKit.IOObjectRelease(service)
            return 'sms'
    except:
        pass
    return None

def detect_sensor():
    sensor = try_macimu()
    if sensor:
        return sensor
    sensor = try_sms()
    if sensor:
        return sensor
    return None

# --- Apple Silicon MEMS 모드 ---
def run_macimu():
    from macimu import IMU
    print("[Apple Silicon] MEMS 가속도계 사용")
    print("맥북을 기울여서 연주하세요! (종료: Ctrl+C)\n")

    last_note = ""
    with IMU() as imu:
        try:
            while True:
                accel = imu.latest_accel()
                if accel is None:
                    time.sleep(0.01)
                    continue
                name, freq = angle_to_note(accel.y * 60)
                print(f"\r기울기: x={accel.x:.2f}g y={accel.y:.2f}g z={accel.z:.2f}g | 음: {name}  ", end="", flush=True)
                if name != last_note:
                    last_note = name
                    samples = pluck(freq)
                    sd.play(samples, SAMPLE_RATE)
                time.sleep(0.05)
        except KeyboardInterrupt:
            print("\n종료")

# --- Intel SMS 모드 ---
def run_sms():
    import ctypes, ctypes.util

    class SMSData(ctypes.Structure):
        _fields_ = [("x", ctypes.c_int16), ("y", ctypes.c_int16), ("z", ctypes.c_int16)]

    IOKit = ctypes.cdll.LoadLibrary(ctypes.util.find_library("IOKit"))
    result = ctypes.c_uint()
    IOKit.IOServiceGetMatchingServices(
        0, IOKit.IOServiceMatching(b"SMCMotionSensor"), ctypes.byref(result)
    )
    service = IOKit.IOIteratorNext(result)
    conn = ctypes.c_uint()
    IOKit.IOServiceOpen(service, IOKit.mach_task_self(), 0, ctypes.byref(conn))
    IOKit.IOObjectRelease(service)
    IOKit.IOObjectRelease(result)

    print("[Intel] SMS 센서 사용")
    print("맥북을 기울여서 연주하세요! (종료: Ctrl+C)\n")

    last_note = ""
    try:
        while True:
            data = SMSData()
            size = ctypes.c_uint(ctypes.sizeof(SMSData))
            IOKit.IOConnectCallStructMethod(conn.value, 5, None, 0, ctypes.byref(data), ctypes.byref(size))
            name, freq = angle_to_note(data.y)
            print(f"\r기울기: x={data.x:4d} y={data.y:4d} z={data.z:4d} | 음: {name}  ", end="", flush=True)
            if name != last_note:
                last_note = name
                samples = pluck(freq)
                sd.play(samples, SAMPLE_RATE)
            time.sleep(0.05)
    except KeyboardInterrupt:
        print("\n종료")
        IOKit.IOServiceClose(conn)

# --- 메인 ---
def main():
    print("Guitar Tilt - 센서 감지 중...\n")
    sensor = detect_sensor()

    if sensor == 'macimu':
        run_macimu()
    elif sensor == 'sms':
        run_sms()
    else:
        print("센서를 찾을 수 없습니다.")
        print("- Apple Silicon (M2+): sudo로 실행 + macimu 설치 필요")
        print("- Intel: SMS 센서가 있는 모델만 지원")
        print("\n  pip install macimu  (Apple Silicon)")
        sys.exit(1)

if __name__ == "__main__":
    main()
