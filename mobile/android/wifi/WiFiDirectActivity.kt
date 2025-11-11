package com.friendfinder.android.wifi

import android.Manifest
import android.content.*
import android.net.wifi.WifiManager
import android.net.wifi.p2p.WifiP2pDevice
import android.net.wifi.p2p.WifiP2pManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kotlinx.coroutines.*

/**
 * WiFi Direct Discovery Activity for FriendFinder
 * Implements peer-to-peer WiFi discovery and connection
 */
class WiFiDirectActivity : AppCompatActivity() {

    private lateinit var wrapper: WiP2pManagerWrapper
    private lateinit var receiver: WiFiDirectBroadcastReceiver
    private lateinit var intentFilter: IntentFilter

    // UI components
    private lateinit var rvPeers: RecyclerView
    private lateinit var btnDiscover: Button
    private lateinit var btnStop: Button
    private lateinit var adapter: WiFiPeerAdapter

    // Runtime permission launcher
    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permMap ->
            val ok = permMap.entries.all { it.value == true }
            if (!ok) {
                Toast.makeText(this, "Permissions needed for Wi-Fi discovery", Toast.LENGTH_LONG).show()
            } else {
                startDiscoveryIfPossible()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_wifi_direct)

        initializeViews()
        setupWiFiDirect()
        setupClickListeners()
        checkAndEnableWiFi()
    }

    private fun initializeViews() {
        rvPeers = findViewById(R.id.rvPeers)
        btnDiscover = findViewById(R.id.btnDiscover)
        btnStop = findViewById(R.id.btnStop)

        // Setup RecyclerView with adapter
        adapter = WiFiPeerAdapter { device ->
            connectToDevice(device)
        }
        rvPeers.layoutManager = LinearLayoutManager(this)
        rvPeers.adapter = adapter
    }

    private fun setupWiFiDirect() {
        wrapper = WiP2pManagerWrapper(this)
        receiver = WiFiDirectBroadcastReceiver(wrapper)
        intentFilter = IntentFilter().apply {
            addAction(WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION)
            addAction(WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION)
            addAction(WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION)
            addAction(WifiP2pManager.WIFI_P2P_THIS_DEVICE_CHANGED_ACTION)
        }

        // Setup peer list listener to update UI
        wrapper.onPeersAvailable = { peers ->
            runOnUiThread {
                adapter.submitList(peers.deviceList.toList())
                Toast.makeText(this, "Found ${peers.deviceList.size} peers", Toast.LENGTH_SHORT).show()
            }
        }

        wrapper.onConnectionInfoAvailable = { info ->
            Toast.makeText(this, "Connected. Group owner: ${info.isGroupOwner}", Toast.LENGTH_SHORT).show()

            if (info.groupFormed && info.isGroupOwner) {
                // Start server socket
                CoroutineScope(Dispatchers.IO).launch {
                    val server = SocketServer(8888)
                    server.start { message ->
                        runOnUiThread {
                            Toast.makeText(this@WiFiDirectActivity, "Received: $message", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            } else if (info.groupFormed) {
                // Act as client
                val host = info.groupOwnerAddress.hostAddress ?: return@onConnectionInfoAvailable
                CoroutineScope(Dispatchers.IO).launch {
                    val client = SocketClient(host, 8888)
                    client.sendMessage("Hello from ${android.os.Build.MODEL}")
                }
            }
        }
    }

    private fun setupClickListeners() {
        btnDiscover.setOnClickListener {
            requestPermissionsThenDiscover()
        }
        btnStop.setOnClickListener {
            wrapper.stopDiscovery()
            Toast.makeText(this, "Stopped discovery", Toast.LENGTH_SHORT).show()
        }
    }

    private fun checkAndEnableWiFi() {
        val wifiManager = applicationContext.getSystemService(WIFI_SERVICE) as WifiManager
        if (!wifiManager.isWifiEnabled) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Apps cannot enable Wi-Fi programmatically on Android 10+
                Toast.makeText(this, "Please enable Wi-Fi", Toast.LENGTH_LONG).show()
                startActivity(Intent(Settings.Panel.ACTION_WIFI))
            } else {
                @Suppress("DEPRECATION")
                wifiManager.isWifiEnabled = true
            }
        }
    }

    private fun requestPermissionsThenDiscover() {
        val perms = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            perms.add(Manifest.permission.NEARBY_WIFI_DEVICES)
        } else {
            perms.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }
        permissionLauncher.launch(perms.toTypedArray())
    }

    private fun startDiscoveryIfPossible() {
        wrapper.discoverPeers()
        Toast.makeText(this, "Discovery started", Toast.LENGTH_SHORT).show()
    }

    private fun connectToDevice(device: WifiP2pDevice) {
        wrapper.connectToDevice(
            device.deviceAddress,
            onSuccess = {
                runOnUiThread {
                    Toast.makeText(this, "Connecting to ${device.deviceName}", Toast.LENGTH_SHORT).show()
                }
            },
            onFailure = { reason ->
                runOnUiThread {
                    Toast.makeText(this, "Connection failed: $reason", Toast.LENGTH_SHORT).show()
                }
            }
        )
    }

    override fun onResume() {
        super.onResume()
        registerReceiver(receiver, intentFilter)
    }

    override fun onPause() {
        super.onPause()
        unregisterReceiver(receiver)
    }

    override fun onDestroy() {
        super.onDestroy()
        wrapper.cleanup()
    }
}
