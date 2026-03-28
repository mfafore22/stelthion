"""
Edge LLM Insight Engine — generates insights using local Ollama.
Primary intelligence layer — runs on-premise, no data leaves the network.
"""

import logging
import os
import json

import httpx
import yaml

logger = logging.getLogger(__name__)

_config_path = os.path.join(os.path.dirname(__file__), "../../config/service.yaml")
with open(_config_path) as f:
    _config = yaml.safe_load(f)


class InsightEngine:
    def __init__(self):
        self.ollama_url = os.environ.get("OLLAMA_URL", _config.get("ollama", {}).get("url", "http://localhost:11434"))
        self.model = os.environ.get("OLLAMA_MODEL", _config.get("ollama", {}).get("model", "llama3.1:8b"))
        self._client = httpx.AsyncClient(timeout=120.0)

    async def generate_for_job(self, job_id: str, cloud_client):
        """Generate insight for a completed job and push to cloud."""
        # TODO: Fetch job results from local analysis data
        # For now, this is a stub that will be connected to the actual pipeline
        logger.info(f"Generating insight for job {job_id}")

        prompt = self._build_prompt({})
        summary, recommendations = await self._call_ollama(prompt)

        if summary:
            await cloud_client.push_insight(job_id, summary, recommendations)
            logger.info(f"Insight pushed for job {job_id}")

    async def generate_alert(self, context: dict, cloud_client, job_id: str | None = None):
        """Generate real-time anomaly alert."""
        prompt = self._build_alert_prompt(context)
        summary, _ = await self._call_ollama(prompt)

        if summary:
            alert_level = "warning"
            if context.get("severity") == "high":
                alert_level = "critical"
            await cloud_client.push_alert(summary, alert_level, job_id)

    async def _call_ollama(self, prompt: str) -> tuple[str, list[str]]:
        """Call local Ollama and parse response."""
        try:
            res = await self._client.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 1024},
                },
            )

            if res.status_code != 200:
                logger.warning(f"Ollama returned {res.status_code}")
                return "", []

            data = res.json()
            response = data.get("response", "")

            # Parse: summary + recommendations
            parts = response.split("\nRecommendations:", 1)
            summary = parts[0].strip()
            recommendations = []

            if len(parts) > 1:
                recommendations = [
                    line.strip().lstrip("- •")
                    for line in parts[1].strip().split("\n")
                    if line.strip()
                ]

            return summary, recommendations

        except httpx.ConnectError:
            logger.warning("Ollama not available — skipping insight generation")
            return "", []
        except Exception as e:
            logger.error(f"Ollama error: {e}")
            return "", []

    def _build_prompt(self, results: dict) -> str:
        lines = [
            "You are a mall analytics expert for Ideapark Lempäälä shopping center in Finland.",
            "Analyze the following visitor tracking data and provide:",
            "1. A brief summary of key findings (2-3 sentences)",
            "2. Actionable recommendations for the mall administrator to improve visitor engagement and conversion",
            "",
            "Data:",
            json.dumps(results, indent=2, default=str) if results else "(No detailed results available)",
            "",
            "Respond with the summary first, then 'Recommendations:' followed by bullet points.",
        ]
        return "\n".join(lines)

    def _build_alert_prompt(self, context: dict) -> str:
        lines = [
            "You are a mall safety and operations monitor for Ideapark Lempäälä.",
            "An anomaly has been detected. Describe what is happening and suggest immediate actions.",
            "",
            "Anomaly data:",
            json.dumps(context, indent=2, default=str),
        ]
        return "\n".join(lines)
