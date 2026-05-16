#import <React/RCTBridgeModule.h>

#include <arpa/inet.h>
#include <ifaddrs.h>
#include <net/if.h>

@interface TacimixNetworkInfo : NSObject <RCTBridgeModule>
@end

@implementation TacimixNetworkInfo

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_REMAP_METHOD(getBroadcastAddresses,
                 getBroadcastAddressesWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  [self getNetworkInterfacesWithResolver:^(NSArray *networkInterfaces) {
    NSMutableOrderedSet<NSString *> *addresses = [NSMutableOrderedSet orderedSet];

    for (NSDictionary *networkInterface in networkInterfaces) {
      NSString *broadcast = networkInterface[@"broadcast"];
      if (broadcast.length > 0) {
        [addresses addObject:broadcast];
      }
    }

    resolve(addresses.array);
  } rejecter:reject];
}

RCT_REMAP_METHOD(getNetworkInterfaces,
                 getNetworkInterfacesWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  struct ifaddrs *interfaces = NULL;
  if (getifaddrs(&interfaces) != 0) {
    reject(@"network_interfaces_error", @"Nao foi possivel ler interfaces de rede.", nil);
    return;
  }

  NSMutableArray<NSDictionary *> *networkInterfaces = [NSMutableArray array];

  for (struct ifaddrs *interface = interfaces; interface != NULL; interface = interface->ifa_next) {
    if (interface->ifa_addr == NULL ||
        interface->ifa_netmask == NULL ||
        interface->ifa_broadaddr == NULL) {
      continue;
    }

    if ((interface->ifa_flags & IFF_UP) == 0 ||
        (interface->ifa_flags & IFF_LOOPBACK) != 0 ||
        (interface->ifa_flags & IFF_BROADCAST) == 0) {
      continue;
    }

    if (interface->ifa_addr->sa_family != AF_INET) {
      continue;
    }

    char hostBuffer[INET_ADDRSTRLEN];
    char netmaskBuffer[INET_ADDRSTRLEN];
    char broadcastBuffer[INET_ADDRSTRLEN];
    struct sockaddr_in *hostAddress = (struct sockaddr_in *)interface->ifa_addr;
    struct sockaddr_in *netmaskAddress = (struct sockaddr_in *)interface->ifa_netmask;
    struct sockaddr_in *broadcastAddress = (struct sockaddr_in *)interface->ifa_broadaddr;
    const char *host = inet_ntop(
        AF_INET,
        &hostAddress->sin_addr,
        hostBuffer,
        sizeof(hostBuffer));
    const char *netmask = inet_ntop(
        AF_INET,
        &netmaskAddress->sin_addr,
        netmaskBuffer,
        sizeof(netmaskBuffer));
    const char *broadcast = inet_ntop(
        AF_INET,
        &broadcastAddress->sin_addr,
        broadcastBuffer,
        sizeof(broadcastBuffer));

    if (host == NULL || netmask == NULL || broadcast == NULL) {
      continue;
    }

    NSString *hostString = [NSString stringWithUTF8String:host];
    NSString *netmaskString = [NSString stringWithUTF8String:netmask];
    NSString *broadcastString = [NSString stringWithUTF8String:broadcast];
    if (hostString.length > 0 &&
        netmaskString.length > 0 &&
        broadcastString.length > 0 &&
        ![broadcastString isEqualToString:@"0.0.0.0"] &&
        ![broadcastString isEqualToString:@"255.255.255.255"]) {
      [networkInterfaces addObject:@{
        @"address": hostString,
        @"netmask": netmaskString,
        @"broadcast": broadcastString,
      }];
    }
  }

  freeifaddrs(interfaces);
  resolve(networkInterfaces);
}

@end
