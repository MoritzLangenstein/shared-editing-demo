/* global Y */
'use strict'

var freeice = require('freeice');
var quickconnect = require('rtc-quickconnect');

function extend (Y) {
    class WebRTC extends Y.AbstractConnector {
        constructor (y, options) {
            if (options === undefined) {
                throw new Error('Options must not be undefined!')
            }
            if (options.room == null) {
                throw new Error('You must define a room name!')
            }
            options.role = 'slave'
            super(y, options)
            this.webrtcOptions = options
            this.connect()
        }

        connect () {
            var qc = quickconnect(this.webrtcOptions.url, {
                room: this.webrtcOptions.room,
                iceServers: freeice()
            });

            this.qc = qc
            var self = this
            this.peers = new Map()

            qc.createDataChannel("yjs").on("channel:opened:yjs", function(id, dc) {
                dc.onopen = function() {
                    console.log("channel with peer " + id + " opened")
                    self.peers.set(id, dc)
                    self.userJoined(id, 'master')
                }

                dc.onmessage = function(evt) {
                    console.log("raw:", evt.data)
                    var message = JSON.parse(evt.data)

                    console.log("message from peer " + id + ":", message);
                    self.receiveMessage(id, message)
                };

                dc.onclose = function() {
                    console.log("channel with peer " + id + " closed")
                    self.peers.delete(id)
                    self.userLeft(id)
                };

                console.log("channel with peer " + id + " opened")
                self.peers.set(id, dc)
                self.userJoined(id, 'master')
            });

            qc.on("channel:closed:yjs", function(id, dc) {
                console.log("channel with peer " + id + " closed");
                self.peers.delete(id)
                self.userLeft(id)
            });

            qc.on("message:me", function(id) {
                console.log("user id: " + id)
                self.setUserId(id)
            });
        }

        disconnect () {
            this.qc.close()
            super.disconnect()
        }

        reconnect () {
            this.connect()
            super.reconnect()
        }

        send (uid, message) {
            console.log("send", uid, message)
            message = JSON.stringify(message)

            var self = this

            var send = function () {
                // check if the clients still exists
                var peer = self.peers.get(uid)
                var success = false
                if (peer) {
                    try {
                        peer.send(message)
                        success = true
                    } catch (error) {
                        //
                    }
                }
                if (!success) {
                    // resend the message if it didn't work
                    setTimeout(send, 500)
                }
            }

            // try to send the message
            send()
        }

        broadcast (message) {
            console.log("broadcast", message, this.peers)
            this.peers.forEach((dc, id) => dc.send(JSON.stringify(message)))
        }

        isDisconnected () {
            return false
        }
    }

  Y.extend('webrtc', WebRTC)
}

module.exports = extend
if (typeof Y !== 'undefined') {
    extend(Y)
}
