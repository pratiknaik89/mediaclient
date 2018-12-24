#!/usr/bin/env python

import os
from bluetooth import *
from wifi import Cell, Scheme
import subprocess
import time
import uuid
from threading import Thread
import urllib
import urllib2
# contents = urllib2.urlopen("http://example.com/foo/bar").read()

wpa_supplicant_conf = "/etc/wpa_supplicant/wpa_supplicant.conf"
bluetooth_conf = "/etc/machine-info"
sudo_mode = "sudo "
bluettothid = ''.join(['{:02x}'.format((uuid.getnode() >> i) & 0xff) for i in range(0,8*6,8)][::-1])
url = 'http://localhost:8976'
headers = {'Content-Type': 'application/json'}


class Worker(Thread):
    def run(self):
        time.sleep(10)
        # cmd = sudo_mode + "echo -e 'power on\ndiscoverable on\npairable on\nconnect \t \nquit' | bluetoothctl"
        # cmd_result = os.system(cmd)
        # time.sleep(10)
        f = open('bluetooth.conf', 'w')
        f.write('PRETTY_HOSTNAME='+ 'mk'+bluettothid +'\n')
        f.close()
        cmd = 'mv bluetooth.conf ' + bluetooth_conf
        cmd_result = ""
        cmd_result = os.system(cmd)
        print cmd + " - " + str(cmd_result)
        time.sleep(4)
        cmd = sudo_mode + 'service bluetooth restart'
        cmd_result = os.system(cmd)

def callUrl(values):
    data = urllib.urlencode(values)
    req = urllib2.Request(url, data, headers)
    response = urllib2.urlopen(req)
    return response.read()

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


    # restart wifi adapter
    # cmd = sudo_mode + 'ifdown wlan0'
    # cmd_result = os.system(cmd)
    # print cmd + " - " + str(cmd_result)

    # time.sleep(2)

    # cmd = sudo_mode + 'ifup wlan0'
    # cmd_result = os.system(cmd)
    # print cmd + " - " + str(cmd_result)

    # time.sleep(10)

    # cmd = 'iwconfig wlan0'
    # cmd_result = os.system(cmd)
    # print cmd + " - " + str(cmd_result)

    # cmd = 'ifconfig wlan0'
    # cmd_result = os.system(cmd)
    # print cmd + " - " + str(cmd_result)

    # p = subprocess.Popen(['ifconfig', 'wlan0'], stdout=subprocess.PIPE,
    #                         stderr=subprocess.PIPE)

    # out, err = p.communicate()

    # ip_address = "<Not Set>"

    # for l in out.split('\n'):
    #     if l.strip().startswith("inet addr:"):
    #         ip_address = l.strip().split(' ')[1].split(':')[1]

    # if ip_address != '<Not Set>':
	cmd = sudo_mode +  ' wpa_cli -i wlan0 reconfigure'
	cmd_result = os.system(cmd)

    return 'Done'


def ssid_discovered():
    Cells = Cell.all('wlan0')

    wifi_info = 'Found ssid : \n'

    for current in range(len(Cells)):
        wifi_info +=  Cells[current].ssid + "\n"

    wifi_info+="!"

    print wifi_info
    return wifi_info

def handle_client(client_sock) :
    # get ssid
    client_sock.send(ssid_discovered())
    print "Waiting for SSID..."


    ssid = client_sock.recv(1024)
    if ssid == '' :
        return

    print "ssid received"
    print ssid

    # get psk
    client_sock.send("waiting-psk!")
    print "Waiting for PSK..."
    psk = client_sock.recv(1024)
    # if psk == '' :
        # return

    print "psk received"

    print psk

    ip_address = wifi_connect(ssid, psk)

    print "ip address: " + ip_address

    client_sock.send("ip-addres:" + ip_address + "!")

    return

def handle_client_1(client_sock) :
    # get ssid\
    try:
       
   
        print "Waiting for SSID..."
        cmd = client_sock.recv(1024)
        command = cmd.strip().split("|")

        print command
    
        if(command[0] == "getwifi") :
            connectedInfo(client_sock)
        elif(command[0] == "setwifi") :
            ssid = command[1]
            psk = command[2]
            wifi_connect(ssid, psk)
            client_sock.send("!!!!!!!!!!Reseting Wifi Adapter!!!!!!!!!!")
            # cmd = sudo_mode + 'reboot'
            # cmd_result = os.system(cmd) 
        elif(command[0] == "register") :
            regid = command[1]
            client_sock.send("!!!!!!!!!!Done!!!!!!!!!!")
        elif(command[0] == "reboot") :
            cmd = sudo_mode + 'reboot'
            cmd_result = os.system(cmd) 
            client_sock.send("!!!!!!!!!!Rebooting!!!!!!!!!!")
        elif(command[0] == "api") :
            reply = callUrl(command[1])
            client_sock.send(reply)
        # ssid = client_sock.recv(1024)
        # if ssid == '' :
        #     return

        # print "ssid received"
        # print ssid

        # # get psk
        # client_sock.send("waiting-psk!")
        # print "Waiting for PSK..."
        # psk = client_sock.recv(1024)
        # # if psk == '' :
        #     # return

        # print "psk received"

        # print psk

        # ip_address = wifi_connect(ssid, psk)

        # print "ip address: " + ip_address

        # client_sock.send("ip-addres:" + ip_address + "!")
    except :
        print "Error"
    return

def connectedInfo(client_sock) :
    client_sock.send(ssid_discovered())


try:
    while True:
        server_sock=BluetoothSocket( RFCOMM )
        server_sock.bind(("",PORT_ANY))
        server_sock.listen(1)

        port = server_sock.getsockname()[1]

        uuid = "815425a5-bfac-47bf-9321-c5ff980b5e11"

        advertise_service( server_sock, "RPi Wifi config",
                           service_id = uuid,
                           service_classes = [ uuid, SERIAL_PORT_CLASS ],
                           profiles = [ SERIAL_PORT_PROFILE ])


        print "Waiting for connection on RFCOMM channel %d" % port
        
        client_sock, client_info = server_sock.accept()
        print "Accepted connection from ", client_info

        handle_client_1(client_sock)

        client_sock.close()
        server_sock.close()

        # finished config
        print 'Finished configuration\n'


except (KeyboardInterrupt, SystemExit):
	print '\nExiting\n'




