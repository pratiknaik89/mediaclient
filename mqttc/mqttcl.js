var mqtt = require('mqtt')

module.exports = function (api, global) {
    var options = {
        port: 1883,
        clientId: 'MQ' + global.SerialNo,
        username: 'xxxxxxxxxxxxxxxxxx',
        password: 'xxxxxxxxxxxxxxxxxx',
        keepalive: 60,
        reconnectPeriod: 1000,
        protocolId: 'MQIsdp',
        protocolVersion: 3,
        clean: true,
        encoding: 'utf8',
        will: {
            topic: 'client/' + global.SerialNo + '/status',
            payload: JSON.stringify({
                status: 'offline',
                mac: global.mac,
                iplocal: global.localip,
                clientid: global.SerialNo
            }),
            retain: true
        },
    };

    var client = mqtt.connect(global.mqtt, options)

    client.on('connect', function () { // When connected
        console.log('connected');
        // subscribe to a topic
        // client.subscribe('client/api', function () {
        //     // when a message arrives, do something with it
        //     client.on('message', function (topic, message, packet) {
        //         var apis = JSON.parse(message);
        //         api[apis.func](apis.data);

        //         //console.log("Received '" + message + "' on '" + topic + "'");
        //     });
        // });

        client.subscribe('client/' + global.SerialNo + '/cmd', function () {
            // when a message arrives, do something with it
            client.on('message', function (topic, message, packet) {
                var apis = JSON.parse(message);
                api[apis.func](apis.data, global.SerialNo, client);
                // console.log("Received '" + message + "' on '" + topic + "'");
            });
        });

        client.publish('client/' + global.SerialNo + '/status',
            JSON.stringify({
                status: 'online',
                mac: global.mac,
                iplocal: global.localip,
                clientid: global.SerialNo
            }), {
                retain: true
            },
            function () {
                console.log("Status Message is published ");
                //   client.end(); // Close the connection when published
            });


        client.publish('client/connected', JSON.stringify({
                clientid: global.SerialNo,
            }),
            function () {
                console.log("Connection message sent");
                //   client.end(); // Close the connection when published
            });



        // publish a message to a topic
        // client.publish('topic1/#', 'my message', function () {
        //     console.log("Message is published");
        //     client.end(); // Close the connection when published
        // });
    });
};