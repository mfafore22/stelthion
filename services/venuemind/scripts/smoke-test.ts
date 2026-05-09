const baseUrl = process.env.VENUEMIND_SMOKE_BASE_URL;
const token = process.env.VENUEMIND_INTERNAL_TOKEN;

if (!baseUrl || !token) {
  console.warn('venuemind_smoke_not_configured');
  process.exit(0);
}

const checks = ['/internal/health', '/internal/governance', '/internal/metrics'];

for (const path of checks) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    console.error(`venuemind_smoke_failed ${path} ${response.status}`);
    process.exit(1);
  }
}

console.warn('venuemind_smoke_ok');

export {};
