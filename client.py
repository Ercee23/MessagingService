import socketio
import json
import time
import sys
    
    
token = sys.argv[1]
sio = socketio.Client()

@sio.event
def connect():
    print('connection established')

def send_id():
    print(token)
    sio.emit('SEND_ID', {'token': token})

def send_message(data):
    print(data)
    sio.emit('SEND_MESSAGE', {'username': "ercee12", "content": data})

@sio.on('message/')
def receive_message(data):
    print(data)

@sio.on('error/')
def receive_error(data):
    print(data)

@sio.event
def disconnect():
    print('disconnected from server')

sio.connect('http://localhost:8000', namespaces=['/', '/message', '/SEND_ID'])
#sio.wait()
time.sleep(1)
send_id()
time.sleep(1)
send_message("Heyyo")
