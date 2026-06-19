package com.tacimix.app.network

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.net.Inet4Address
import java.net.InterfaceAddress
import java.net.NetworkInterface
import java.util.Collections

private const val NETWORK_INFO_ERROR_CODE = "network_interfaces_error"
private const val NETWORK_INFO_ERROR_MESSAGE = "Nao foi possivel ler interfaces de rede."

private data class NetworkInterfaceInfo(
  val address: String,
  val netmask: String,
  val broadcast: String,
)

class TacimixNetworkInfoModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "TacimixNetworkInfo"

  @ReactMethod
  fun getBroadcastAddresses(promise: Promise) {
    try {
      val result = Arguments.createArray()
      readNetworkInterfaces()
          .map { it.broadcast }
          .distinct()
          .forEach(result::pushString)
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject(NETWORK_INFO_ERROR_CODE, NETWORK_INFO_ERROR_MESSAGE, error)
    }
  }

  @ReactMethod
  fun getNetworkInterfaces(promise: Promise) {
    try {
      val result = Arguments.createArray()
      readNetworkInterfaces().forEach { networkInterface ->
        val item = Arguments.createMap()
        item.putString("address", networkInterface.address)
        item.putString("netmask", networkInterface.netmask)
        item.putString("broadcast", networkInterface.broadcast)
        result.pushMap(item)
      }
      promise.resolve(result)
    } catch (error: Exception) {
      promise.reject(NETWORK_INFO_ERROR_CODE, NETWORK_INFO_ERROR_MESSAGE, error)
    }
  }

  private fun readNetworkInterfaces(): List<NetworkInterfaceInfo> {
    val interfaces = NetworkInterface.getNetworkInterfaces() ?: return emptyList()
    val results = mutableListOf<NetworkInterfaceInfo>()
    val seen = linkedSetOf<String>()

    for (networkInterface in Collections.list(interfaces)) {
      if (!networkInterface.isUp || networkInterface.isLoopback) {
        continue
      }

      for (interfaceAddress in networkInterface.interfaceAddresses) {
        val info = interfaceAddress.toNetworkInterfaceInfo() ?: continue
        val key = "${info.address}|${info.netmask}|${info.broadcast}"
        if (seen.add(key)) {
          results.add(info)
        }
      }
    }

    return results
  }

  private fun InterfaceAddress.toNetworkInterfaceInfo(): NetworkInterfaceInfo? {
    val hostAddress = address as? Inet4Address ?: return null
    val broadcastAddress = broadcast as? Inet4Address ?: return null

    if (hostAddress.isLoopbackAddress || hostAddress.isLinkLocalAddress) {
      return null
    }

    val addressString = hostAddress.hostAddress ?: return null
    val broadcastString = broadcastAddress.hostAddress ?: return null
    val netmaskString = prefixLengthToNetmask(networkPrefixLength.toInt()) ?: return null

    if (broadcastString == "0.0.0.0" || broadcastString == "255.255.255.255") {
      return null
    }

    return NetworkInterfaceInfo(
      address = addressString,
      netmask = netmaskString,
      broadcast = broadcastString,
    )
  }

  private fun prefixLengthToNetmask(prefixLength: Int): String? {
    if (prefixLength !in 0..32) {
      return null
    }

    if (prefixLength == 0) {
      return "0.0.0.0"
    }

    val mask = -1 shl (32 - prefixLength)
    return listOf(
        (mask ushr 24) and 0xff,
        (mask ushr 16) and 0xff,
        (mask ushr 8) and 0xff,
        mask and 0xff,
      )
      .joinToString(".")
  }
}
