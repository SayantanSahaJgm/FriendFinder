package com.friendfinder.android.wifi

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.ServerSocket
import java.net.Socket

/**
 * Simple TCP socket server for P2P communication
 * Runs on the group owner device
 */
class SocketServer(private val port: Int) {
    private var serverSocket: ServerSocket? = null
    private var running = true

    /**
     * Start the server and listen for incoming connections
     * @param onMessageReceived Callback when a message is received
     */
    suspend fun start(onMessageReceived: suspend (String) -> Unit) = withContext(Dispatchers.IO) {
        try {
            serverSocket = ServerSocket(port)
            while (running) {
                val client = serverSocket!!.accept()
                handleClient(client, onMessageReceived)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            serverSocket?.close()
        }
    }

    /**
     * Handle a connected client
     */
    private suspend fun handleClient(
        client: Socket,
        onMessageReceived: suspend (String) -> Unit
    ) = withContext(Dispatchers.IO) {
        try {
            val reader = BufferedReader(InputStreamReader(client.getInputStream()))
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                line?.let { onMessageReceived(it) }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            client.close()
        }
    }

    /**
     * Stop the server
     */
    fun stop() {
        running = false
        serverSocket?.close()
    }
}
