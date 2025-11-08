import asyncio
import subprocess  # <-- We are using subprocess, not GitPython

async def get_git_diff(workspace_path: str) -> str:
    """
    Gets all uncommitted (staged and unstaged) git diffs from
    the specified local repository path using a subprocess.
    
    Args:
        workspace_path: The absolute file path to the local git repository.
    """
    print(f"[Tool] get_git_diff called with path: {workspace_path}")
    
    if not workspace_path:
        return "Error: No workspace_path provided."

    def run_git_operations():
        # This is the synchronous code that will run in a thread
        try:
            # 1. Get unstaged changes
            unstaged_result = subprocess.run(
                ["git", "-C", workspace_path, "diff"],
                capture_output=True, text=True, check=True
            )
            
            # 2. Get staged changes
            staged_result = subprocess.run(
                ["git", "-C", workspace_path, "diff", "--staged"],
                capture_output=True, text=True, check=True
            )
            
            full_diff = ""
            if unstaged_result.stdout:
                full_diff += f"--- UNSTAGED CHANGES ---\n{unstaged_result.stdout}\n"
            if staged_result.stdout:
                full_diff += f"--- STAGED CHANGES ---\n{staged_result.stdout}\n"

            if not full_diff:
                return "No uncommitted changes (staged or unstaged) found."
            
            print("[Tool] Returning REAL git diff.")
            return full_diff

        except subprocess.CalledProcessError as e:
            return f"Error running git diff: {e.stderr}"
        except FileNotFoundError:
            return "Error: 'git' command not found. Is it installed and in your system PATH?"
        except Exception as e:
            return f"An unexpected error occurred: {str(e)}"

    # Run the blocking subprocess calls in a separate thread
    return await asyncio.to_thread(run_git_operations)

# what is going on