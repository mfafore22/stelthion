"""
GDPR Compliance Utilities
- Appearance vector cleanup and audit logging
- All visual data stays in-memory only
- No biometric data, no face recognition, no persistent identity
"""

import logging
import time

logger = logging.getLogger(__name__)


class GDPRAuditLog:
    """
    Logs creation/deletion of appearance vectors for compliance auditing.
    Logs only metadata (timestamps, counts) — never the vectors themselves.
    """

    def __init__(self):
        self._created = 0
        self._deleted = 0
        self._session_start: float | None = None

    def start_session(self, job_id: str):
        self._session_start = time.time()
        self._created = 0
        self._deleted = 0
        logger.info(f"[GDPR] Analysis session started for job {job_id}")

    def log_vector_created(self, camera_id: str, count: int = 1):
        self._created += count

    def log_vector_deleted(self, count: int):
        self._deleted += count

    def end_session(self, job_id: str):
        duration = time.time() - (self._session_start or time.time())
        logger.info(
            f"[GDPR] Session ended for job {job_id}: "
            f"created={self._created}, deleted={self._deleted}, "
            f"duration={duration:.0f}s, "
            f"all_vectors_purged={'yes' if self._created == self._deleted else 'PENDING'}"
        )
        self._session_start = None

    def verify_cleanup(self, remaining_count: int) -> bool:
        """Verify all appearance data has been purged after session."""
        if remaining_count == 0:
            logger.info("[GDPR] Cleanup verified: 0 appearance vectors remain")
            return True
        logger.error(f"[GDPR] CLEANUP FAILED: {remaining_count} vectors still in memory!")
        return False
