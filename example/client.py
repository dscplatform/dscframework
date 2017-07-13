import sys
import asyncio
import dscframework
import json

async def on_connect(cli):
    print("subbing", flush=True)
    await cli.subscribe("test", testsub)

# Guid is created by the sensor that first broadcasts this data
# TODO implement it, to track predictions etc
# TODO maybe the node server should add the python client to PYTHONPATH, if it does not already exist
async def testsub(head, data):
    print("got sub data", flush=True)
    print(json.dumps(head), flush=True)
    print(data, flush=True)


async def main():
    cli = dscframework.Client("ws://localhost:8080")
    await cli.start(on_connect)


if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(main())
