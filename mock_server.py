#!/usr/bin/env python

import asyncio
import datetime
import random
import math
import websockets

"""
1.56,0.73,1.71
"""


async def time(websocket, path):
    step = 0
    while True:
        now = datetime.datetime.utcnow().isoformat() + 'Z'
        step += 1
        await websocket.send("{},{},{}".format(math.cos(step * 0.01) + random.random()*0.1,
                                               math.sin(step*0.01) + random.random()*0.1,
                                               1.71))
        await asyncio.sleep(0.10)

start_server = websockets.serve(time, '127.0.0.1', 8080)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
