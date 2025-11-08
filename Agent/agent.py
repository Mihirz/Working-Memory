import os
from agents import Agent, OpenAIChatCompletionsModel
from openai import AsyncOpenAI

# We don't need the tool here anymore, main.py imports it.
# from tools import get_git_diff 

# 1. CREATE THE ASYNC OPENAI CLIENT
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL"),
    default_headers={
         "HTTP-Referer": "http://localhost:3000",
         "X-Title": "HackUTD Context Agent"
    }
)

# 2. CONFIGURE THE MODEL
llm_model = OpenAIChatCompletionsModel(
    model=os.getenv("AGENT_MODEL", "mistralai/mistral-7b-instruct"),
    openai_client=client
)

# 3. Define the agent's instructions (the System Prompt)
#    vvv THIS IS THE FIX vvv
SYSTEM_PROMPT = """
You are an expert "Context Re-Entry" agent. You will be given a "Task" description 
from a user and a "Git Diff" showing their work.

Your ONLY job is to combine these two pieces of information and generate a 
comprehensive summary in Markdown format.

The summary MUST include:
- A high-level title.
- A "Summary" section of what was done.
- A "Key Changes" section (use bullet points based on the diff).
- A "Suggested Next Steps" section (e.g., "run tests", "commit changes", "push branch").
"""
#    ^^^ THIS IS THE FIX ^^^

# 4. Create the agent
context_agent = Agent(
    name="ContextAgent",
    instructions=SYSTEM_PROMPT,
    # The agent itself no longer needs the tool, since main.py is calling it.
    # tools=[get_git_diff], 
    model=llm_model,
)