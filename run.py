#!/usr/bin/env python

import os
from bluetooth import *
from wifi import Cell, Scheme
import time
import uuid
# from threading import Thread
import urllib
import urllib2
from subprocess import PIPE, Popen
import subprocess
import argparse
from thread import start_new_thread
import psutil
import json
import requests 
from subprocess import check_output
# contents = urllib2.urlopen("http://example.com/foo/bar").read()

wpa_supplicant_conf = "/etc/wpa_supplicant/wpa_supplicant.conf"
bluetooth_conf = "/etc/machine-info"
sudo_mode = "sudo "
bluettothid = ''.join(['{:02x}'.format((uuid.getnode() >> i) & 0xff) for i in range(0,8*6,8)][::-1])
urlr = 'http://localhost:8976/api'
headers = {'Content-Type': 'application/json'}
client_sock = None
isThreadRun = False



def cmdline(command):
    process = Popen(
        args=command,
        stdout=PIPE,
        shell=True
    )
    return process.communicate()[0]

def callUrl(datas):
    r = requests.post(url = urlr, data = datas) 
    print r.text


def getIP():
    # hostname = socket.gethostname()    
    # IPAddr = socket.gethostbyname(hostname)    
    ip = check_output(['hostname', '-I'])
    ip = ip.split(' ')[0]
    return ip

print getIP()
#class Worker(Thread):   
    # def run(self):
    #     time.sleep(10)
    #     # cmd = sudo_mode + "echo -e 'power on\ndiscoverable on\npairable on\nconnect \t \nquit' | bluetoothctl"
    #     # cmd_result = os.system(cmd)
    #     # time.sleep(10)

def run():    
    try:
        temp = os.popen("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2").readline()
        # f = open('bluetooth.conf', 'w')
        # f.write('PRETTY_HOSTNAME='+ 'mk'+ str(temp) +'\n')
        # f.close()
        cmdline('sudo hostnamectl set-hostname "mk'+ str(temp).replace('\n', '') +'" --pretty')

        cmdline('sudo hciconfig hci0 name ' + str(temp))
        # cmd = 'mv bluetooth.conf ' + bluetooth_conf
        # cmd_result = ""
        # cmd_result = os.system(cmd)
        time.sleep(2)
        cmdline('sudo hciconfig hci0 name ' + str(temp))
        time.sleep(2)
        cmdline('sudo service bluetooth stop')
        time.sleep(5)
        cmdline('sudo service bluetooth start')
        print("service restarted")
    except Exception, ex:
        print "Error" + str(ex)
    #     print cmd + " - " + str(cmd_result)
    #     time.sleep(4)
    #     cmd = sudo_mode + 'service bluetooth restart'
    #     cmd_result = os.system(cmd)
run()

def wifiStreangth():
    cmd = "iwconfig wlan0 | grep Signal | /usr/bin/awk '{print $4}' | /usr/bin/cut -d'=' -f2"
    #while isThreadRun:
    temp = measure_temp()
    
    RAM_stats = getRAMinfo()
    
    disk = psutil.disk_usage('/')
    
    disk_total = disk.total / 2**30     # GiB.
    
    disk_used = disk.used / 2**30
    strDbm = 0
    try:
        strDbm = os.popen(cmd).read()
    except:
        print ""
   
    # print psutil.getDiskSpace()
    if strDbm:
        dbm = int(strDbm)
        quality = 2 * (dbm + 100)
        # print("{0} dbm = {1}%".format(dbm,quality))
        # try:
        #     # data = {}
        #     # data['func'] = 'bluetooth'
        #     # data['data'] = data                
        #     # callUrl(data)
        # except Exception, ex:
        #     ex[]
        #     print "Error" + str(ex)
        data = 'status|'+ str(quality)+ '|' + temp + '|' + str(psutil.cpu_percent()) + '%|' + str(round(int(RAM_stats[1]) / 1000,1)) + '(' + str(round(int(RAM_stats[0]) / 1000,1)) + ')MB|' +str(disk_used) +'('+ str(disk_total)  +')GB-' + str(disk.percent) + '%|' + getIP()
        print data
        client_sock.send(data)   
    else:
        print("Wifi router connection signal strength not found")
        # time.sleep(2)

def getDiskSpace():
    p = os.popen("df -h /")
    i = 0
    while 1:
        i = i +1
        line = p.readline()
        if i==2:
            return(line.split()[1:5])

def measure_temp():
        temp = os.popen("vcgencmd measure_temp").readline()
        return (temp.replace("temp=","").replace("\n",""))

def getCPUuse():
    return(str(os.popen("top -n1 | awk '/Cpu\(s\):/ {print $2}'").readline().strip()))

def getserialid(client_sock):
    temp = os.popen("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2").readline()
    client_sock.send("clientid|"+ str(temp))
    time.sleep(3)

def getRAMinfo():
    p = os.popen('free')
    i = 0
    while 1:
        i = i + 1
        line = p.readline()
        if i==2:
            return(line.split()[1:4])

def wifi_connect(ssid, psk):
    # write wifi config to file
    f = open('wifi.conf', 'w')
    f.write('country=GB\n')
    f.write('ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev\n')
    f.write('update_config=1\n')
    f.write('\n')
    f.write('network={\n')
    f.write('    ssid="' + ssid + '"\n')
    f.write('    psk="' + psk + '"\n')
    f.write('}\n')
    f.close()

    cmd = 'mv wifi.conf ' + wpa_supplicant_conf
    cmd_result = ""
    cmd_result = os.system(cmd)
    print cmd + " - " + str(cmd_result)

    cmd = sudo_mode +  ' wpa_cli -i wlan0 reconfigure'
    os.system(cmd)

    return 'Done'

def getcurrentssid(client_sock):
    client_sock.send('Connected wifi - ' + cmdline('iwgetid wlan0 --raw'))

def ssid_discovered():
    Cells = Cell.all('wlan0')
    wifi_info = 'ssid\n'
    for current in range(len(Cells)):
        wifi_info +=  Cells[current].ssid + "\n"
    print wifi_info
    return wifi_info

def handle_client_1(client_sock, cmd) :
    # get ssid\
    # try:
    print cmd
    command = cmd.strip().split("|")
    if(command[0] == "st"):
        wifiStreangth()
        callUrl({"func":"toast","data":'{"evt":"show","msg":"Remote Control Connected"}'})
    elif(command[0] == "getwifi") :
        client_sock.send("OK")
        connectedInfo(client_sock)
    elif(command[0] == "setwifi") :
        client_sock.send("OK!")
        ssid = command[1]
        psk = command[2]
        wifi_connect(ssid, psk)
        client_sock.send("Wifi Setting Done")
        # cmd = sudo_mode + 'reboot'
        # cmd_result = os.system(cmd) 
    elif(command[0] == "reboot") :
        client_sock.send("OK!")
        cmd = sudo_mode + 'reboot'
        cmd_result = os.system(cmd) 
        client_sock.send("!!!!!!!!!!Rebooting!!!!!!!!!!")
    elif(command[0] == "api") :
        client_sock.send("OK!")
        d = json.loads(command[1])
        reply = callUrl(d)
        client_sock.send("api|" +reply)
    elif(command[0] == "getwificonec"):
        client_sock.send("OK!")
        getcurrentssid(client_sock)
    elif(command[0] == "clientid"):
        client_sock.send("OK!")
        getserialid(client_sock)
    elif(command[0] == "orent"):
        client_sock.send("OK!")
        dt = {"func":"rotate","orientation":"" }
        dt['orientation'] = command[1]
        print dt
        callUrl(dt)
    else:
        client_sock.send("INVALID COMMAND")
    # except Exception, ex:
    #     print "Error" + str(ex)
    # return

def connectedInfo(client_sock) :
    client_sock.send(ssid_discovered())

def callservice():
    callUrl({"func":"toast","data":'{"evt":"show","msg":"Remote Control Connected"}'})

try:
    while True:
        server_sock=BluetoothSocket( RFCOMM )
        server_sock.bind(("",PORT_ANY))
        server_sock.listen(1)

        port = server_sock.getsockname()[1]
        uuid = "815425a5-bfac-47bf-9321-c5ff980b5e11"

        advertise_service(server_sock, "RPi Wifi config",
                           service_id = uuid,
                           service_classes = [ uuid, SERIAL_PORT_CLASS ],
                           profiles = [ SERIAL_PORT_PROFILE ])

        print "Ready for connection"
        client_sock = None
        # isThreadRun = False
        client_sock, client_info = server_sock.accept()
        # start_new_thread(wifiStreangth,())
        getserialid(client_sock)
        # isThreadRun = True
        start_new_thread(callservice,())
        print "Waiting for connection on RFCOMM channel %d" % port
        print "Accepted connection from ", client_info            
        while True:
            print "Waiting for SSID..."
            try:
                cmd = client_sock.recv(1024)
                handle_client_1(client_sock, cmd)
            except :
                break
            print "Recieved Message"
        client_sock.close()
        server_sock.close()

        # finished config
        print 'Finished configuration\n'


except (KeyboardInterrupt, SystemExit):
	print '\nExiting\n'




