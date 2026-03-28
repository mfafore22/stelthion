"""
Cloud API Client — HTTPS communication with Stelthion cloud.
All requests include edge authentication headers.
"""

import os
import logging
from typing import Any

import httpx
import yaml

logger = logging.getLogger(__name__)

# Load config
_config_path = os.path.join(os.path.dirname(__file__), "../../config/service.yaml")
with open(_config_path) as f:
    _config = yaml.safe_load(f)


class CloudClient:
    def __init__(self):
        self.api_url = os.environ.get("CLOUD_API_URL", _config["cloud"]["api_url"]).rstrip("/")
        self.api_key = os.environ.get("EDGE_API_KEY", _config["cloud"]["api_key"])
        self.edge_id = os.environ.get("EDGE_ID", _config["edge"]["id"])
        self.mall_id = os.environ.get("MALL_ID", _config["edge"]["mall_id"])

        self._client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "X-Edge-Id": self.edge_id,
                "X-Mall-Id": self.mall_id,
                "Content-Type": "application/json",
            },
        )

    async def register(self) -> bool:
        """Register this edge device with the cloud."""
        try:
            res = await self._client.post(
                f"{self.api_url}/api/edge/register",
                json={
                    "edgeId": self.edge_id,
                    "mallId": self.mall_id,
                    "apiKey": self.api_key,
                    "version": "0.1.0",
                    "gpuInfo": self._detect_gpu(),
                },
            )
            if res.status_code == 200:
                data = res.json()
                logger.info(f"Registered: deviceId={data.get('deviceId')}")
                return True
            logger.error(f"Registration failed: {res.status_code} {res.text}")
            return False
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return False

    async def fetch_pending_jobs(self) -> list[dict[str, Any]]:
        """Poll for PENDING analysis jobs."""
        try:
            res = await self._client.get(
                f"{self.api_url}/api/edge/jobs",
                params={"status": "PENDING"},
            )
            if res.status_code == 200:
                return res.json()
            return []
        except Exception as e:
            logger.error(f"Job fetch error: {e}")
            return []

    async def update_job_status(self, job_id: str, status: str, progress: int = 0, error: str | None = None):
        """Update job status and progress."""
        payload: dict[str, Any] = {"status": status, "progress": progress}
        if error:
            payload["error"] = error
        try:
            await self._client.patch(
                f"{self.api_url}/api/edge/jobs/{job_id}/status",
                json=payload,
            )
        except Exception as e:
            logger.error(f"Status update error: {e}")

    async def push_results(self, job_id: str, results: list[dict]):
        """Push ZONE_COUNT results to cloud."""
        try:
            res = await self._client.post(
                f"{self.api_url}/api/edge/results",
                json={"jobId": job_id, "results": results},
            )
            logger.info(f"Pushed {len(results)} results: {res.status_code}")
        except Exception as e:
            logger.error(f"Results push error: {e}")

    async def push_journeys(self, job_id: str, session: dict):
        """Push AB_TRACKING / JOURNEY_MAP results to cloud."""
        try:
            res = await self._client.post(
                f"{self.api_url}/api/edge/journeys",
                json={"jobId": job_id, "session": session},
            )
            logger.info(f"Pushed journey session: {res.status_code}")
        except Exception as e:
            logger.error(f"Journey push error: {e}")

    async def push_behaviors(self, job_id: str, behaviors: list[dict]):
        """Push store behavior data to cloud."""
        try:
            res = await self._client.post(
                f"{self.api_url}/api/edge/behavior",
                json={"jobId": job_id, "behaviors": behaviors},
            )
            logger.info(f"Pushed {len(behaviors)} behaviors: {res.status_code}")
        except Exception as e:
            logger.error(f"Behavior push error: {e}")

    async def push_footfall(self, readings: list[dict]):
        """Push visitor counter readings to cloud."""
        try:
            await self._client.post(
                f"{self.api_url}/api/edge/footfall",
                json={"readings": readings},
            )
        except Exception as e:
            logger.error(f"Footfall push error: {e}")

    async def push_insight(self, job_id: str, summary: str, recommendations: list[str] | None = None):
        """Push LLM-generated insight to cloud."""
        try:
            await self._client.post(
                f"{self.api_url}/api/edge/insights",
                json={
                    "jobId": job_id,
                    "summary": summary,
                    "recommendations": recommendations,
                },
            )
        except Exception as e:
            logger.error(f"Insight push error: {e}")

    async def push_alert(self, summary: str, alert_level: str, job_id: str | None = None):
        """Push real-time anomaly alert to cloud."""
        try:
            await self._client.post(
                f"{self.api_url}/api/edge/alerts",
                json={
                    "jobId": job_id,
                    "summary": summary,
                    "alertLevel": alert_level,
                },
            )
        except Exception as e:
            logger.error(f"Alert push error: {e}")

    async def heartbeat(self):
        """Send health ping to cloud."""
        try:
            await self._client.post(
                f"{self.api_url}/api/edge/heartbeat",
                json={
                    "edgeId": self.edge_id,
                    "version": "0.1.0",
                },
            )
        except Exception as e:
            logger.warning(f"Heartbeat error: {e}")

    def _detect_gpu(self) -> str:
        try:
            import torch
            if torch.cuda.is_available():
                return torch.cuda.get_device_name(0)
        except ImportError:
            pass
        return "unknown"
