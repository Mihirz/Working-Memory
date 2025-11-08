import uvicorn
import os
import json
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import the agent, tracer, and client
from agents import set_tracing_disabled
from agent import context_agent, client  # <-- Import the working client
from tools import get_git_diff             # <-- Import our NORMAL async tool

# Load environment variables from .env file
load_dotenv()

# --- 0. DISABLE TRACING ---
set_tracing_disabled(True)

# --- 1. FastAPI App & CORS Setup ---
app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. Pydantic Models (API Request Bodies) ---
class HeartbeatRequest(BaseModel):
    user_id: str
    app_name: str
    window_title: str
    workspace_path: str

class WorkflowEndRequest(BaseModel):
    user_id: str
    task_description: str
    project_path: str

# --- 3. API Endpoints ---

@app.get("/")
def read_root():
    return {"Hello": "Context Agent Backend"}

@app.post("/api/v1/heartbeat")
async def handle_heartbeat(request: HeartbeatRequest):
    print(f"[Heartbeat] User: {request.user_id}, App: {request.app_name}, Window: {request.window_title}")
    return {"status": "received"}

@app.post("/api/v1/workflow/end")
async def handle_workflow_end(request: WorkflowEndRequest):
    """
    This is the main agentic workflow, now implemented manually.
    """
    print(f"[Workflow End] Starting summary for: {request.task_description}")
    
    try:
        # --- 1. Manually call our tool ---
        print("[Agent] Calling tool: get_git_diff")
        
        # vvv THIS IS THE FIX vvv
        # We can now call our tool like a normal async function.
        git_diff = await get_git_diff(request.project_path)
        # ^^^ THIS IS THE FIX ^^^
        
        print("[Agent] Tool returned.")

        # --- 2. Manually format the prompt for the LLM ---
        final_prompt_messages = [
            {"role": "system", "content": context_agent.instructions}, # Get instructions from our agent
            {"role": "user", "content": f"Task: {request.task_description}\n\nGit Diff:\n{git_diff}"}
        ]

        # --- 3. Manually call the LLM using our working client ---
        print("[Agent] Calling LLM for final summary...")
        completion = await client.chat.completions.create(
            model=os.getenv("AGENT_MODEL"),
            messages=final_prompt_messages
        )
        
        summary_markdown = completion.choices[0].message.content
        print(f"[Agent Result] Summary generated.")

        return {
            "summary_title": request.task_description,
            "summary_markdown": summary_markdown
        }

    except Exception as e:
        print(f"Error during agent run: {e}")
        return {"error": str(e)}, 500

# --- 4. Run the Server ---
if __name__ == "__main__":
    print("--- Starting Agent Server ---")
    print(f"Using model: {os.getenv('AGENT_MODEL')}")
    print(f"Access server at: http://127.0.0.1:8000")
    print("-------------------------------")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)