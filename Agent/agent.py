import os
from agents import Agent, OpenAIChatCompletionsModel
from openai import AsyncOpenAI

# 1. CREATE THE ASYNC OPENAI CLIENT (No changes here)
client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL"),
    default_headers={
         "HTTP-Referer": "http://localhost:3000",
         "X-Title": "HackUTD Context Agent"
    }
)

# 2. CONFIGURE THE MODEL (No changes here)
llm_model = OpenAIChatCompletionsModel(
    model=os.getenv("AGENT_MODEL", "mistralai/mistral-7b-instruct"),
    openai_client=client
)

# 3. Define the agent's instructions (the System Prompt)
#    vvv THIS IS THE NEW PROMPT vvv
SYSTEM_PROMPT = """
You are an expert "Context Re-Entry" agent. You will be given a "Git Status Report" showing a developer's file changes.

Your job is to analyze this file list and infer what task the developer was performing.

Based on your inference, generate a one-sentence comprehensive summary of the key changes.

The Git Status Report is a list of files:
- Files starting with ' M' are Modified.
- Files starting with '??' are Untracked (new).
"""

# The summary MUST include:
# - A high-level title (e.g., "Refactoring the Agent Logic").
# - A "Summary" section describing the *inferred task* (e.g., "It looks like you were refactoring the main agent workflow and git tools.").
# - A "Key Files Changed" section (use bullet points from the list).
# - A "Suggested Next Steps" section (e.g., "commit changes", "push branch").
#    ^^^ THIS IS THE NEW PROMPT ^^^

# 4. Create the agent
context_agent = Agent(
    name="ContextAgent",
    instructions=SYSTEM_PROMPT,
    model=llm_model,
)