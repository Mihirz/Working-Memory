import uvicorn
import os
import json
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import the agent, tracer, and client
from agents import set_tracing_disabled
from agent import context_agent, client
from tools import get_git_diff

# Load environment variables
load_dotenv()

set_tracing_disabled(True)

# FastAPI app and CORS setup
app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class HeartbeatRequest(BaseModel):
    user_id: str
    app_name: str
    window_title: str
    workspace_path: str

class WorkflowEndRequest(BaseModel):
    user_id: str
    task_description: str | None = None
    project_path: str

# API Endpoints
@app.get("/")
def read_root():
    return {"Hello": "Context Agent Backend"}

@app.post("/api/v1/heartbeat")
async def handle_heartbeat(request: HeartbeatRequest):
    print(f"[Heartbeat] User: {request.user_id}, App: {request.app_name}, Window: {request.window_title}")
    return {"status": "received"}

@app.post("/api/v1/workflow/end")
async def handle_workflow_end(request: WorkflowEndRequest):
    print(f"[Workflow End] Starting summary for project: {request.project_path}")
    
    try:
        print("[Agent] Calling tool: get_git_diff")
        git_diff = await get_git_diff(request.project_path)
        print("[Agent] Tool returned.")

        user_prompt_content = ""
        if request.task_description:
            user_prompt_content = f"Task: {request.task_description}\n\nGit Status Report:\n{git_diff}"
        else:
            user_prompt_content = f"Git Status Report:\n{git_diff}"
        
        final_prompt_messages = [
            {"role": "system", "content": context_agent.instructions},
            {"role": "user", "content": user_prompt_content}
        ]

        summary_markdown = ""
        i = 1
        while True:
            print(f"[Agent] Calling LLM for final summary (Attempt {i})...")
            completion = await client.chat.completions.create(
                model=os.getenv("AGENT_MODEL"),
                messages=final_prompt_messages,
            )
            
            summary_markdown = completion.choices[0].message.content
            
            if summary_markdown and len(summary_markdown.strip()) > 10:
                print(f"[Agent Result] Summary generated on attempt {i}.")
                break
            else:
                print(f"[Agent Warning] LLM returned an empty/short summary. Retrying...")
            
            i += 1
        
        if not summary_markdown or not summary_markdown.strip():
            print("\n" + "="*50)
            print("[CRITICAL ERROR] LLM failed after 5 retries. Input Sent:")
            print(json.dumps(final_prompt_messages, indent=2))
            print("="*50 + "\n")
            return {"error": "LLM failed to generate summary, please try again."}, 500

        return {
            "summary_title": request.task_description or "Automated Context Summary",
            "summary_markdown": summary_markdown + "\n\n" + git_diff
        }

    except Exception as e:
        print(f"Error during agent run: {e}")
        return {"error": str(e)}, 500

# Run server
if __name__ == "__main__":
    print("--- Starting Agent Server ---")
    print(f"Using model: {os.getenv('AGENT_MODEL')}")
    print(f"Access server at: http://127.0.0.1:8000")
    print("-------------------------------")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)