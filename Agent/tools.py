# 1. REMOVE THE "@function_tool" DECORATOR
# from agents import function_tool

# @function_tool <-- DELETE THIS LINE
async def get_git_diff(workspace_path: str) -> str:  # <-- This is now a NORMAL async function
    """
    Gets all uncommitted (staged and unstaged) git diffs from
    the specified local repository path.
    
    Args:
        workspace_path: The absolute file path to the local git repository.
    """
    print(f"[Tool Stub] get_git_diff was called with path: {workspace_path}")
    
    # We are bypassing all subprocess calls and returning a fake diff.
    fake_diff = """
    --- FAKE UNSTAGED CHANGES ---
    --- a/agent.py
    +++ b/agent.py
    @@ -1,5 +1,6 @@
     import os
     from agents import Agent, OpenAIChatCompletionsModel
+    # This is a new line
     from openai import OpenAI
     
     # Import our custom tool
    """
    
    print("[Tool Stub] Returning fake git diff.")
    return fake_diff