"""
Person Detector — YOLOv8 wrapper for person-class-only detection.
"""

import logging
from dataclasses import dataclass

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class Detection:
    """Single person detection."""
    bbox: tuple[int, int, int, int]  # x1, y1, x2, y2
    confidence: float
    centroid: tuple[float, float]


class PersonDetector:
    def __init__(self, model_name: str = "yolov8n.pt", confidence_threshold: float = 0.4):
        from ultralytics import YOLO
        self.model = YOLO(model_name)
        self.confidence_threshold = confidence_threshold
        self.person_class_id = 0  # COCO class 0 = person
        logger.info(f"Loaded {model_name} for person detection")

    def detect(self, frame: np.ndarray) -> list[Detection]:
        """Run person detection on a single frame."""
        results = self.model(frame, verbose=False, classes=[self.person_class_id])
        detections = []

        for result in results:
            if result.boxes is None:
                continue
            for box in result.boxes:
                conf = float(box.conf[0])
                if conf < self.confidence_threshold:
                    continue
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                cx = (x1 + x2) / 2
                cy = (y1 + y2) / 2
                detections.append(Detection(
                    bbox=(x1, y1, x2, y2),
                    confidence=conf,
                    centroid=(cx, cy),
                ))

        return detections
