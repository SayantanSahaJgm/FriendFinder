package com.friendfinder.android.wifi

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedWriter
import java.io.OutputStreamWriter
import java.net.Socket

/**
 * Simple TCP socket client for P2P communication
 * Used by non-group-owner devices to send messages
 */
class SocketClient(private val host: String, private val port: Int) {

    /**
     * Send a message to the server
     * @param message The message to send
     */
    suspend fun sendMessage(message: String) = withContext(Dispatchers.IO) {
        try {
            val socket = Socket(host, port)
            val writer = BufferedWriter(OutputStreamWriter(socket.getOutputStream()))
            writer.write(message)
            writer.newLine()
            writer.flush()
            writer.close()
            socket.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
