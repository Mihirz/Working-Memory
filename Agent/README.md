# Context Re-Entry Agent Backend

This is the complete backend for the hackathon project. It's a FastAPI server that runs an agent (using `openai-agent-sdk`) to summarize a developer's work.

## 🚀 How to Run

1.  **Clone / Setup:**
    * Create a folder, and put all these files inside it.
    * Create a Python virtual environment: `python -m venv venv`
    * Activate it: `source venv/bin/activate` (or `.\venv\Scripts\activate` on Windows)

2.  **Install Dependencies:**
    * `pip install -r requirements.txt`

3.  **Set Environment Variables:**
    * Rename `.env.example` to `.env`.
    * Edit `.env` and add your **OpenRouter API Key**.
    * Make sure `git` is installed on your machine and accessible in your path.

4.  **Run the Server:**
    * `python main.py`
    * You should see: `Starting agent server on http://127.0.0.1:8000`

5.  **Test the Agent:**
    * You can't test this with a browser (it's a `POST` request).
    * Use a tool like Postman, Insomnia, or a simple `curl` command.
    * **Make sure you `git init` a real project folder and make some uncommitted changes for the `git diff` tool to find.**

    **Test Command (run in a separate terminal):**
    ```bash
    curl -X POST [http://127.0.0.1:8000/api/v1/workflow/end](http://127.0.0.1:8000/api/v1/workflow/end) \
    -H "Content-Type: application/json" \
    -d '{
          "user_id": "garysun",
          "task_description": "Just finished refactoring the user authentication logic",
          "project_path": "/path/to/your/git/test/project"
        }'
    ```
    (Replace `/path/to/your/git/test/project` with an *actual* path on your computer.)