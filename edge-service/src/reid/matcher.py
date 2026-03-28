"""
Cross-Camera Matcher — re-identifies individuals across different camera views.
Uses cosine similarity of appearance embeddings + Hungarian algorithm for optimal matching.
"""

import logging
import time
from dataclasses import dataclass

import numpy as np
from scipy.optimize import linear_sum_assignment

logger = logging.getLogger(__name__)


@dataclass
class AppearanceRecord:
    """Temporary appearance record for a tracked person."""
    person_id: int
    camera_id: str
    embedding: np.ndarray
    first_seen: float
    last_seen: float
    zone_id: str | None = None


class CrossCameraMatcher:
    """
    Matches people across cameras using appearance similarity.
    All data is in-memory only — never persisted to disk (GDPR compliance).
    """

    def __init__(
        self,
        same_floor_threshold: float = 0.70,
        cross_floor_threshold: float = 0.60,
        max_time_window_sec: float = 600,  # 10 minutes default
    ):
        self.same_floor_threshold = same_floor_threshold
        self.cross_floor_threshold = cross_floor_threshold
        self.max_time_window = max_time_window_sec
        self._records: dict[str, AppearanceRecord] = {}  # key: "{camera_id}_{track_id}"
        self._next_global_id = 1
        self._global_map: dict[str, int] = {}  # local key → global person ID

    def register(self, camera_id: str, track_id: int, embedding: np.ndarray, zone_id: str | None = None) -> int:
        """Register or update a tracked person's appearance."""
        key = f"{camera_id}_{track_id}"
        now = time.time()

        if key in self._records:
            self._records[key].embedding = embedding
            self._records[key].last_seen = now
            return self._global_map[key]

        # Try to match against recent records from other cameras
        match_id = self._find_match(camera_id, embedding)

        if match_id is not None:
            self._records[key] = AppearanceRecord(
                person_id=match_id, camera_id=camera_id,
                embedding=embedding, first_seen=now, last_seen=now,
                zone_id=zone_id,
            )
            self._global_map[key] = match_id
            return match_id

        # New person
        global_id = self._next_global_id
        self._next_global_id += 1
        self._records[key] = AppearanceRecord(
            person_id=global_id, camera_id=camera_id,
            embedding=embedding, first_seen=now, last_seen=now,
            zone_id=zone_id,
        )
        self._global_map[key] = global_id
        return global_id

    def _find_match(self, source_camera: str, embedding: np.ndarray) -> int | None:
        """Find the best matching person from other cameras within the time window."""
        now = time.time()
        candidates: list[tuple[str, AppearanceRecord, float]] = []

        for key, record in self._records.items():
            # Skip same camera
            if record.camera_id == source_camera:
                continue
            # Skip stale records
            if now - record.last_seen > self.max_time_window:
                continue

            # Cosine similarity
            sim = float(np.dot(embedding, record.embedding))
            candidates.append((key, record, sim))

        if not candidates:
            return None

        # Find best match above threshold
        best_key, best_record, best_sim = max(candidates, key=lambda x: x[2])

        # Use relaxed threshold for cross-floor matches
        threshold = self.same_floor_threshold  # TODO: determine from camera floor info
        if best_sim >= threshold:
            logger.debug(f"Matched person {best_record.person_id} (sim={best_sim:.3f})")
            return best_record.person_id

        return None

    def match_batch(
        self,
        source_camera: str,
        embeddings: list[np.ndarray],
        target_camera: str,
        threshold: float | None = None,
    ) -> list[int | None]:
        """
        Optimal 1:1 matching using Hungarian algorithm.
        Returns list of matched global IDs (None for unmatched).
        """
        if not embeddings:
            return []

        now = time.time()
        target_records = [
            (k, r) for k, r in self._records.items()
            if r.camera_id == target_camera and (now - r.last_seen) < self.max_time_window
        ]

        if not target_records:
            return [None] * len(embeddings)

        th = threshold or self.same_floor_threshold

        # Build cost matrix (negative similarity for minimization)
        cost_matrix = np.zeros((len(embeddings), len(target_records)))
        for i, emb in enumerate(embeddings):
            for j, (_, rec) in enumerate(target_records):
                sim = float(np.dot(emb, rec.embedding))
                cost_matrix[i, j] = -sim if sim >= th else 1e6  # High cost for below threshold

        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        results: list[int | None] = [None] * len(embeddings)
        for r, c in zip(row_ind, col_ind):
            if cost_matrix[r, c] < 0:  # Valid match (negative = above threshold)
                results[r] = target_records[c][1].person_id

        return results

    def purge_stale(self, max_age_sec: float | None = None):
        """Remove old appearance records (GDPR: TTL-based eviction)."""
        cutoff = time.time() - (max_age_sec or self.max_time_window)
        stale_keys = [k for k, r in self._records.items() if r.last_seen < cutoff]
        for key in stale_keys:
            del self._records[key]
            self._global_map.pop(key, None)
        if stale_keys:
            logger.info(f"Purged {len(stale_keys)} stale appearance records")

    def clear_all(self):
        """Purge all appearance data (call after job completion)."""
        count = len(self._records)
        self._records.clear()
        self._global_map.clear()
        self._next_global_id = 1
        logger.info(f"Cleared all {count} appearance records (GDPR cleanup)")

    @property
    def active_count(self) -> int:
        return len(self._records)
