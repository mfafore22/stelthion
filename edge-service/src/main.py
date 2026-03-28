"""
Stelthion Edge Processing Service
==================================
On-premise video analysis for mall visitor tracking.
Processes camera feeds locally, sends only anonymized numerical results to cloud.
"""

import asyncio
import logging
import signal
import sys

from sync.cloud_client import CloudClient
from sync.heartbeat import HeartbeatService
from sync.job_runner import JobRunner

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("stelthion-edge")


async def main():
    logger.info("Starting Stelthion Edge Processing Service")

    # Initialize cloud client
    client = CloudClient()

    # Register with cloud
    registered = await client.register()
    if not registered:
        logger.error("Failed to register with cloud. Retrying in 30s...")
        await asyncio.sleep(30)
        registered = await client.register()
        if not registered:
            logger.error("Registration failed. Exiting.")
            sys.exit(1)

    logger.info("Registered with cloud successfully")

    # Start heartbeat
    heartbeat = HeartbeatService(client)
    heartbeat_task = asyncio.create_task(heartbeat.run())

    # Start job runner (polls for pending jobs, processes them)
    runner = JobRunner(client)
    runner_task = asyncio.create_task(runner.run())

    # Graceful shutdown
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda: asyncio.create_task(shutdown(heartbeat_task, runner_task)))

    logger.info("Edge service running. Waiting for jobs...")
    await asyncio.gather(heartbeat_task, runner_task)


async def shutdown(*tasks):
    logger.info("Shutting down edge service...")
    for task in tasks:
        task.cancel()


if __name__ == "__main__":
    asyncio.run(main())
