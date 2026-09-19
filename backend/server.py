"""Preview ingress bridge only; application APIs remain in Express/Supabase."""
import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
import httpx

load_dotenv(Path(__file__).resolve().parents[1] / '.env')
app = FastAPI()

@app.api_route('/api/{path:path}', methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])
async def bridge(path: str, request: Request):
    async with httpx.AsyncClient(timeout=30) as client:
        upstream = await client.request(request.method, f"{os.environ['PREVIEW_UPSTREAM_URL']}/api/{path}",
            params=request.query_params, content=await request.body(),
            headers={k: v for k, v in request.headers.items() if k.lower() not in ('host', 'content-length')})
    return Response(upstream.content, status_code=upstream.status_code,
        headers={k: v for k, v in upstream.headers.items() if k.lower() not in ('content-encoding', 'transfer-encoding', 'content-length')})