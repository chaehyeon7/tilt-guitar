import ctypes
import ctypes.util
import numpy as np
import sounddevice as sd
import time
import sys

# --- SMS 센서 ---
IOKit = ctypes.cdll.LoadLibrary(ctypes.util.find_library("IOKit"))

kern_return_t = ctypes.c_int
io_object_t = ctypes.c_uint
io_connect_t = ctypes.c_uint
io_iterator_t = ctypes.c_uint

class SMSData(ctypes.Structure):
    _fields_ = [("x", ctypes.c_int16), ("y", ctypes.c_int16), ("z", ctypes.c_int16)]

def get_sms_connection():
    result = io_iterator_t()
    IOKit.IOServiceGetMatchingServices(
        0,
        IOKit.IOServiceMatching(b"SMCMotionSensor"),
        ctypes.byref(result)
    )
    service = IOKit.IOIteratorNext(result)
    if not service:
        return None
    conn = io_connect_t()
    IOKit.IOServiceOpen(service, IOKit.mach_task_self(), 0, ctypes.byref(conn))
    IOKit.IOObjectRelease(service)
    IOKit.IOObjectRelease(result)
    return conn

def read_sms(conn):
    data = SMSData()
    size = ctypes.c_uint(ctypes.sizeof(SMSData))
    IOKit.IOConnectCallStructMethod(conn, 5, None, 0, ctypes.byref(data), ctypes.byref(size))
    return data.x, data.y, data.z

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

def angle_to_note(y_val):
    # SMS y값 범위 대략 -60~60 → 0~14 인덱스
    clamped = max(-60, min(60, y_val))
    idx = round(((clamped + 60) / 120) * (len(NOTE_NAMES) - 1))
    return NOTE_NAMES[idx], NOTE_FREQS[idx]

# --- 메인 ---
def main():
    conn = get_sms_connection()
    if conn is None:
        print("SMS 센서를 찾을 수 없습니다. Intel 맥북에서 실행해주세요.")
        sys.exit(1)

    print("Guitar Tilt - 맥북을 기울여서 연주하세요!")
    print("종료: Ctrl+C\n")

    last_note = ""
    try:
        while True:
            x, y, z = read_sms(conn)
            name, freq = angle_to_note(y)
            print(f"\r기울기: x={x:4d} y={y:4d} z={z:4d} | 음: {name}  ", end="", flush=True)
            if name != last_note:
                last_note = name
                samples = pluck(freq)
                sd.play(samples, SAMPLE_RATE)
            time.sleep(0.05)
    except KeyboardInterrupt:
        print("\n종료")
        IOKit.IOServiceClose(conn)

if __name__ == "__main__":
    main()
