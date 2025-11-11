package com.friendfinder.android.wifi

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.NetworkInfo
import android.net.wifi.p2p.WifiP2pManager
import android.util.Log

/**
 * Broadcast receiver for WiFi P2P events
 * Handles state changes, peer discovery, and connection events
 */
class WiFiDirectBroadcastReceiver(private val wrapper: WiP2pManagerWrapper) : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "WiFiDirectReceiver"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        intent ?: return
        
        when (intent.action) {
            WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION -> {
                val state = intent.getIntExtra(WifiP2pManager.EXTRA_WIFI_STATE, -1)
                when (state) {
                    WifiP2pManager.WIFI_P2P_STATE_ENABLED -> {
                        Log.d(TAG, "WiFi P2P is enabled")
                    }
                    WifiP2pManager.WIFI_P2P_STATE_DISABLED -> {
                        Log.d(TAG, "WiFi P2P is disabled")
                    }
                }
            }
            
            WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION -> {
                Log.d(TAG, "Peers list changed")
                wrapper.requestPeers()
            }
            
            WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION -> {
                val networkInfo = intent.getParcelableExtra<NetworkInfo>(WifiP2pManager.EXTRA_NETWORK_INFO)
                if (networkInfo?.isConnected == true) {
                    Log.d(TAG, "Connected to peer")
                    wrapper.requestConnectionInfo()
                } else {
                    Log.d(TAG, "Disconnected from peer")
                }
            }
            
            WifiP2pManager.WIFI_P2P_THIS_DEVICE_CHANGED_ACTION -> {
                Log.d(TAG, "This device's info changed")
            }
        }
    }
}
