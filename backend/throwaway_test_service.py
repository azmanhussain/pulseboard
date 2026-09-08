from fastapi import FastAPI

app = FastAPI()
IS_HEALTHY = True

@app.get("/health")
def health():
    if IS_HEALTHY:
        return {"status": "ok"}
    raise Exception("Simulated failure")