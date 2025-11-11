package com.friendfinder.android.wifi

import android.content.Context
import android.net.wifi.p2p.WifiP2pConfig
import android.net.wifi.p2p.WifiP2pDeviceList
import android.net.wifi.p2p.WifiP2pInfo
import android.net.wifi.p2p.WifiP2pManager
import android.util.Log

/**
 * Wrapper class for WiFi P2P Manager
 * Simplifies WiFi Direct operations and provides callback interfaces
 */
class WiP2pManagerWrapper(private val context: Context) {
    
    companion object {
        private const val TAG = "WiP2pManagerWrapper"
    }

    private val manager: WifiP2pManager = context.getSystemService(Context.WIFI_P2P_SERVICE) as WifiP2pManager
    private val channel: WifiP2pManager.Channel = manager.initialize(context, context.mainLooper, null)

    var onPeersAvailable: ((WifiP2pDeviceList) -> Unit)? = null
    var onConnectionInfoAvailable: ((WifiP2pInfo) -> Unit)? = null

    private val peersListener = WifiP2pManager.PeerListListener { peerList ->
        onPeersAvailable?.invoke(peerList)
    }

    private val connectionInfoListener = WifiP2pManager.ConnectionInfoListener { info ->
        onConnectionInfoAvailable?.invoke(info)
    }

    /**
     * Start discovering peers
     */
    fun discoverPeers() {
        manager.discoverPeers(channel, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                Log.d(TAG, "Discovery started successfully")
            }

            override fun onFailure(reason: Int) {
                Log.w(TAG, "Discovery failed with reason: $reason")
            }
        })
    }

    /**
     * Stop peer discovery
     */
    fun stopDiscovery() {
        manager.stopPeerDiscovery(channel, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                Log.d(TAG, "Discovery stopped")
            }

            override fun onFailure(reason: Int) {
                Log.w(TAG, "Failed to stop discovery: $reason")
            }
        })
    }

    /**
     * Request current peer list
     */
    fun requestPeers() {
        manager.requestPeers(channel, peersListener)
    }

    /**
     * Request connection info
     */
    fun requestConnectionInfo() {
        manager.requestConnectionInfo(channel, connectionInfoListener)
    }

    /**
     * Connect to a specific device
     * @param deviceAddress MAC address of the target device
     * @param onSuccess Callback for successful connection
     * @param onFailure Callback for failed connection with reason code
     */
    fun connectToDevice(
        deviceAddress: String,
        onSuccess: () -> Unit = {},
        onFailure: (Int) -> Unit = {}
    ) {
        val config = WifiP2pConfig().apply {
            this.deviceAddress = deviceAddress
            wps.setup = WifiP2pConfig.WpsInfo.PBC
        }

        manager.connect(channel, config, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                Log.d(TAG, "Connection initiated successfully")
                onSuccess()
            }

            override fun onFailure(reason: Int) {
                Log.w(TAG, "Connection failed with reason: $reason")
                onFailure(reason)
            }
        })
    }

    /**
     * Disconnect from current group
     */
    fun disconnect() {
        manager.removeGroup(channel, object : WifiP2pManager.ActionListener {
            override fun onSuccess() {
                Log.d(TAG, "Disconnected from group")
            }

            override fun onFailure(reason: Int) {
                Log.w(TAG, "Failed to disconnect: $reason")
            }
        })
    }

    /**
     * Cleanup resources
     */
    fun cleanup() {
        stopDiscovery()
    }
}
