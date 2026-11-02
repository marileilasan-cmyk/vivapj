const find = (re) => { const k = Object.keys(process.env).find((n) => re.test(n) && process.env[n]); return k ? process.env[k] : ''; };
const url = () => find(/(REST_API_URL|REDIS_REST_URL)$/);
const token = () => find(/(REST_API_TOKEN|REDIS_REST_TOKEN)$/);
export async function db(cmd) {
  if (!url() || !token()) throw new Error('storage_not_configured');
  const r = await fetch(url(), { method:'POST', headers:{Authorization:'Bearer '+token(),'Content-Type':'application/json'}, body:JSON.stringify(cmd) });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || 'storage_error');
  return j.result;
}
export const configured = () => !!(url() && token());
