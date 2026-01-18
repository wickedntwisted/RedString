import json
import asyncio
from asyncio.subprocess import PIPE

async def stream_sherlock(username: str):
    proc = await asyncio.create_subprocess_exec(
        "sherlock", username,
        "--output", "/dev/null",
        stdout=PIPE,
        stderr=asyncio.subprocess.DEVNULL,
    )
    async for line in proc.stdout:
        line = line.decode()
        split_line = line.split()
        if len(split_line) == 3 and split_line[0] == "[+]":
            name = split_line[1][:-1]
            url = split_line[2]
            yield json.dumps({"source": "sherlock", "name": name, "url": url}) + "\n"

    # Wait for the process to complete
    await proc.wait()

    # Send completion message
    yield json.dumps({"done": True}) + "\n"
