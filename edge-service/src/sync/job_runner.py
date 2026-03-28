"""
Job Runner — polls for pending jobs and orchestrates the analysis pipeline.
"""

import asyncio
import logging
from typing import Any

from sync.cloud_client import CloudClient

logger = logging.getLogger(__name__)


class JobRunner:
    def __init__(self, client: CloudClient, poll_interval: int = 30):
        self.client = client
        self.poll_interval = poll_interval
        self.active_job: dict | None = None

    async def run(self):
        while True:
            try:
                if self.active_job is None:
                    jobs = await self.client.fetch_pending_jobs()
                    if jobs:
                        job = jobs[0]  # Take the oldest pending job
                        await self.process_job(job)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Job runner error: {e}")
            await asyncio.sleep(self.poll_interval)

    async def process_job(self, job: dict[str, Any]):
        """Process a single analysis job through the appropriate pipeline."""
        job_id = job["id"]
        mode = job["mode"]
        logger.info(f"Processing job {job_id} mode={mode}")

        self.active_job = job
        await self.client.update_job_status(job_id, "PROCESSING", progress=0)

        try:
            if mode == "ZONE_COUNT":
                await self._run_zone_count(job)
            elif mode == "AB_TRACKING":
                await self._run_ab_tracking(job)
            elif mode == "JOURNEY_MAP":
                await self._run_journey_map(job)
            elif mode == "STORE_BEHAVIOR":
                await self._run_store_behavior(job)
            else:
                logger.warning(f"Unknown mode: {mode}")
                await self.client.update_job_status(job_id, "FAILED", error=f"Unknown mode: {mode}")
                return

            await self.client.update_job_status(job_id, "COMPLETE", progress=100)
            logger.info(f"Job {job_id} completed successfully")

            # Generate LLM insight after completion
            await self._generate_insight(job_id)

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            await self.client.update_job_status(job_id, "FAILED", error=str(e))
        finally:
            self.active_job = None

    async def _run_zone_count(self, job: dict):
        """ZONE_COUNT pipeline: count visitors per zone per hour."""
        # TODO: Implement with detection.detector + analysis.zone_counter
        # 1. Open RTSP stream for job.cameraId
        # 2. Extract frames at snapshot interval
        # 3. Run YOLOv8 person detection
        # 4. Count persons in zone polygons per hour
        # 5. Push results to cloud
        logger.info("ZONE_COUNT pipeline — not yet implemented")
        await self.client.update_job_status(job["id"], "PROCESSING", progress=50)

    async def _run_ab_tracking(self, job: dict):
        """AB_TRACKING pipeline: track individuals between two cameras."""
        # TODO: Implement with detection + reid + analysis.ab_tracker
        # 1. Open RTSP streams for both cameras
        # 2. Run detection + ByteTrack on each
        # 3. Extract OSNet embeddings
        # 4. Match across cameras using cosine similarity
        # 5. Record transit times and match rates
        # 6. Push journey session to cloud
        logger.info("AB_TRACKING pipeline — not yet implemented")
        await self.client.update_job_status(job["id"], "PROCESSING", progress=50)

    async def _run_journey_map(self, job: dict):
        """JOURNEY_MAP pipeline: multi-camera journey tracking."""
        # TODO: Implement with full reid chain
        # 1. Open all relevant camera streams
        # 2. Run detection + tracking + reid across camera chain
        # 3. Build zone sequences with timestamps
        # 4. Push journey paths to cloud
        logger.info("JOURNEY_MAP pipeline — not yet implemented")
        await self.client.update_job_status(job["id"], "PROCESSING", progress=50)

    async def _run_store_behavior(self, job: dict):
        """STORE_BEHAVIOR pipeline: classify walk-by/stop/enter per store."""
        # TODO: Implement with analysis.behavior_classifier
        # 1. Open camera streams covering store fronts
        # 2. Run detection + tracking
        # 3. Estimate velocity from centroid displacement
        # 4. Classify behavior using zone polygon boundaries
        # 5. Push behavior counts to cloud
        logger.info("STORE_BEHAVIOR pipeline — not yet implemented")
        await self.client.update_job_status(job["id"], "PROCESSING", progress=50)

    async def _generate_insight(self, job_id: str):
        """Generate LLM insight after job completion using local Ollama."""
        try:
            from llm.insight_engine import InsightEngine
            engine = InsightEngine()
            await engine.generate_for_job(job_id, self.client)
        except Exception as e:
            logger.warning(f"Insight generation skipped: {e}")
