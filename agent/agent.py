import os
from dotenv import load_dotenv
from agents import Agent, OpenAIChatCompletionsModel
from openai import AsyncOpenAI

load_dotenv()

client = AsyncOpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL"),
    default_headers={
         "HTTP-Referer": "http://localhost:3000",
         "X-Title": "HackUTD Context Agent"
    }
)

llm_model = OpenAIChatCompletionsModel(
    model=os.getenv("AGENT_MODEL", "mistralai/mistral-7b-instruct"),
    openai_client=client
)

SYSTEM_PROMPT = """
You are an expert "Context Re-Entry" agent. You will be given a "Git Status Report" showing a developer's file changes.

Your job is to analyze this file list and infer what task the developer was performing based on the changelog and file names.

Based on your inference, generate a few bullet points describing the following:
- High-level goal of the change
- Modules or features affected
- Possible next steps or unfinished tasks
- Potential risks or things to test

Format your response in plain text.
"""

context_agent = Agent(
    name="ContextAgent",
    instructions=SYSTEM_PROMPT,
    model=llm_model,
)