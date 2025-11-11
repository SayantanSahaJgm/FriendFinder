package com.friendfinder.android.wifi

import android.net.wifi.p2p.WifiP2pDevice
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

/**
 * RecyclerView adapter for displaying WiFi P2P peers
 */
class WiFiPeerAdapter(
    private val onConnectClick: (WifiP2pDevice) -> Unit
) : RecyclerView.Adapter<WiFiPeerAdapter.PeerViewHolder>() {

    private var peers: List<WifiP2pDevice> = emptyList()

    fun submitList(newPeers: List<WifiP2pDevice>) {
        peers = newPeers
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PeerViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_wifi_peer, parent, false)
        return PeerViewHolder(view)
    }

    override fun onBindViewHolder(holder: PeerViewHolder, position: Int) {
        holder.bind(peers[position])
    }

    override fun getItemCount(): Int = peers.size

    inner class PeerViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvDeviceName: TextView = itemView.findViewById(R.id.tvDeviceName)
        private val tvDeviceAddress: TextView = itemView.findViewById(R.id.tvDeviceAddress)
        private val tvStatus: TextView = itemView.findViewById(R.id.tvStatus)
        private val btnConnect: Button = itemView.findViewById(R.id.btnConnect)

        fun bind(device: WifiP2pDevice) {
            tvDeviceName.text = device.deviceName
            tvDeviceAddress.text = device.deviceAddress
            tvStatus.text = getStatusText(device.status)

            btnConnect.isEnabled = device.status == WifiP2pDevice.AVAILABLE
            btnConnect.setOnClickListener {
                onConnectClick(device)
            }
        }

        private fun getStatusText(status: Int): String {
            return when (status) {
                WifiP2pDevice.AVAILABLE -> "Available"
                WifiP2pDevice.INVITED -> "Invited"
                WifiP2pDevice.CONNECTED -> "Connected"
                WifiP2pDevice.FAILED -> "Failed"
                WifiP2pDevice.UNAVAILABLE -> "Unavailable"
                else -> "Unknown"
            }
        }
    }
}
