"""Periodic heartbeat to cloud — every 60 seconds."""

import asyncio
import logging

from sync.cloud_client import CloudClient

logger = logging.getLogger(__name__)


class HeartbeatService:
    def __init__(self, client: CloudClient, interval_sec: int = 60):
        self.client = client
        self.interval = interval_sec

    async def run(self):
        while True:
            try:
                await self.client.heartbeat()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.warning(f"Heartbeat failed: {e}")
            await asyncio.sleep(self.interval)
