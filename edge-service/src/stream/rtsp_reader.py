"""
RTSP Frame Reader — one thread per camera.
Maintains a ring buffer of latest frames. Auto-reconnects on stream loss.
"""

import logging
import threading
import time
from dataclasses import dataclass, field

import cv2
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class FrameBuffer:
    frame: np.ndarray | None = None
    timestamp: float = 0.0
    frame_count: int = 0
    lock: threading.Lock = field(default_factory=threading.Lock)


class RTSPReader:
    def __init__(self, camera_id: str, rtsp_url: str, target_fps: int = 10):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.target_fps = target_fps
        self.buffer = FrameBuffer()
        self._running = False
        self._thread: threading.Thread | None = None

    def start(self):
        self._running = True
        self._thread = threading.Thread(target=self._read_loop, daemon=True)
        self._thread.start()
        logger.info(f"Started RTSP reader for {self.camera_id}")

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)

    def get_frame(self) -> tuple[np.ndarray | None, float]:
        with self.buffer.lock:
            return self.buffer.frame, self.buffer.timestamp

    @property
    def is_connected(self) -> bool:
        return self.buffer.frame is not None and (time.time() - self.buffer.timestamp) < 5.0

    def _read_loop(self):
        backoff = 1.0
        while self._running:
            cap = cv2.VideoCapture(self.rtsp_url)
            if not cap.isOpened():
                logger.warning(f"{self.camera_id}: Cannot open {self.rtsp_url}, retrying in {backoff}s")
                time.sleep(backoff)
                backoff = min(backoff * 2, 60)
                continue

            backoff = 1.0
            frame_interval = 1.0 / self.target_fps
            logger.info(f"{self.camera_id}: Connected at {self.target_fps} FPS")

            while self._running:
                ret, frame = cap.read()
                if not ret:
                    logger.warning(f"{self.camera_id}: Frame read failed, reconnecting...")
                    break

                with self.buffer.lock:
                    self.buffer.frame = frame
                    self.buffer.timestamp = time.time()
                    self.buffer.frame_count += 1

                time.sleep(frame_interval)

            cap.release()
