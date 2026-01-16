import asyncio
import subprocess

async def get_git_diff(workspace_path: str) -> str:
    print(f"[Tool] get_git_status called with path: {workspace_path}")
    
    if not workspace_path:
        return "Error: No workspace_path provided."

    def run_git_operations():
        try:
            result = subprocess.run(
                ["git", "-C", workspace_path, "status", "--porcelain"],
                capture_output=True, text=True, check=True
            )
            
            if not result.stdout:
                return "No changes (staged, unstaged, or untracked) found."
            
            print("[Tool] Returning REAL git status.")
            return f"--- Git Status Output ---\n{result.stdout}"

        except subprocess.CalledProcessError as e:
            return f"Error running git status: {e.stderr}"
        except Exception as e:
            return f"An unexpected error occurred: {str(e)}"

    return await asyncio.to_thread(run_git_operations)