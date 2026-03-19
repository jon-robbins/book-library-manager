# DevFleet Troubleshooting Guide

Based on your logs, there are **two distinct issues** to fix.

---

## Issue 1: Broken `/usr/local/bin/claude` Binary (macOS → Linux)

**Error:**
```
/usr/local/bin/claude: 1: ����H: not found
/usr/local/bin/claude: 1: Syntax error: word unexpected (expecting ")")
```

**Cause:** You're mounting the **host** `claude` binary into the container:
```yaml
- ${HOME}/.local/bin/claude:/usr/local/bin/claude:ro
```
On macOS, that binary is **Mach-O**. The container runs **Linux** and needs an **ELF** binary. A macOS binary cannot run on Linux.

**Fix:** Stop mounting the host binary. Install the Linux `claude` **inside** the container.

### Step 1: Remove the binary mount from docker-compose.yml

```yaml
# REMOVE this line:
# - ${HOME}/.local/bin/claude:/usr/local/bin/claude:ro

# KEEP these (config is usually platform-agnostic):
# - ${HOME}/.local/share/claude:/home/devfleet/.local/share/claude:ro
# - ${HOME}/.claude:/home/devfleet/.claude
# - ${HOME}/.claude.json:/home/devfleet/.claude.json
```

### Step 2: Add Claude install to backend/Dockerfile

Add this **before** the `CMD` or `ENTRYPOINT`:

```dockerfile
# Install Claude CLI for Linux (container runs Linux, host binary is macOS)
USER devfleet
RUN curl -fsSL https://claude.ai/install.sh | bash -s stable
ENV PATH="/home/devfleet/.local/bin:$PATH"

# SDK hardcodes /usr/local/bin/claude — symlink so it finds the Linux binary
USER root
RUN ln -sf /home/devfleet/.local/bin/claude /usr/local/bin/claude
USER devfleet
```

### Step 3: Rebuild

```bash
docker compose build devfleet-api --no-cache
docker compose up -d
```

### docker-compose.yml changes

```yaml
# BEFORE (broken — mounts macOS binary into Linux):
volumes:
  - ${HOME}/.local/bin/claude:/usr/local/bin/claude:ro

# AFTER (remove that line; Claude installed in container):
volumes:
  # - ${HOME}/.local/bin/claude:/usr/local/bin/claude:ro   # REMOVE
  - ${HOME}/.local/share/claude:/home/devfleet/.local/share/claude:ro
  - ${HOME}/.claude:/home/devfleet/.claude
  - ${HOME}/.claude.json:/home/devfleet/.claude.json
  - ${HOME}/projects:/workspace/projects
  - ${HOME}/GitHub/library:/workspace/projects/library
```

---

## Issue 2: Permission Denied on `/Users` (Host Path)

**Error:**
```
PermissionError: [Errno 13] Permission denied: '/Users'
os.makedirs(project_path, exist_ok=True)
```

**Cause:** You're passing a **host path** (`/Users/jon.robbins/GitHub/library`) to `plan_project` or `create_project`. Inside Docker, `/Users` either doesn't exist or isn't writable.

**Fix:** Use a path **inside the container** and mount your repo there.

### Step 1: Mount your repo in docker-compose

```yaml
# docker-compose.yml (or wherever DevFleet is defined)
services:
  devfleet-api:
    volumes:
      - /Users/jon.robbins/GitHub/library:/workspace/projects/library:ro  # or :rw if agents need to write
```

### Step 2: Use the container path when calling MCP

When calling `plan_project` or `create_project`, use the **mounted path**:

```
project_path: "/workspace/projects/library"
```

**Do not** pass `/Users/jon.robbins/GitHub/library` — that path is not valid inside the container.

### Step 3: Ensure it's a git repo

The log also says:
```
Project /workspace/projects/tla-jira-backlog is not a git repo — skipping worktree isolation
```

The mounted path must be a git repository. Your library repo is, so mounting it at `/workspace/projects/library` should fix this.

---

## Issue 3: Project Path When No Path Is Given

When you omit `project_path`, DevFleet creates projects at `/workspace/projects/<slug>`. That directory is **empty** (not your code). So:

- Either **always** pass `project_path` with the mounted path
- Or configure DevFleet's default project root to the mounted path

---

## Summary Checklist

| Issue | Fix |
|-------|-----|
| `claude: 1: ����H: not found` | Reinstall Claude CLI in the container via `curl -fsSL https://claude.ai/install.sh \| bash` |
| `Permission denied: '/Users'` | Mount host repo into container; use container path (e.g. `/workspace/projects/library`) in MCP calls |
| `not a git repo` | Mount your actual repo, not an empty dir |

---

## Issue 4: Authentication Failed (plan_project / dispatch)

**Error:**
```
"Not logged in · Please run /login"
"error":"authentication_failed"
```

**Cause:** The Claude CLI inside the container has no API key. The host's `.claude` / `.claude.json` mounts may not include credentials (Claude login often stores them elsewhere).

**Fix:** Pass `ANTHROPIC_API_KEY` to the container:

```yaml
# docker-compose.yml
services:
  devfleet-api:
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}  # Set in .env or export before compose
```

Create a `.env` file (do not commit):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Or run: `ANTHROPIC_API_KEY=sk-ant-... docker compose up -d`

---

## Quick Test After Fixes

1. **Verify Claude in container:**
   ```bash
   docker exec -it <devfleet-api-container> claude --version
   ```

2. **Verify auth (after adding API key):**
   ```bash
   docker exec -it devfleet-api sh -c 'cd /workspace/projects/library && echo "hello" | claude -p - --output-format stream-json --verbose --dangerously-skip-permissions 2>&1' | head -5
   ```

3. **Verify mount:**
   ```bash
   docker exec -it <devfleet-api-container> ls -la /workspace/projects/library
   ```

4. **Call plan_project with container path:**
   ```
   plan_project(prompt="...", project_path="/workspace/projects/library")
   ```
