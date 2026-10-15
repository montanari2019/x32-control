#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

#include <arpa/inet.h>
#include <ifaddrs.h>
#include <net/if.h>

static NSTimeInterval const TacimixLocalNetworkPromptTimeout = 8.0;

@interface TacimixNetworkInfo : NSObject <RCTBridgeModule, NSNetServiceBrowserDelegate>

@property (nonatomic, strong) NSNetServiceBrowser *localNetworkBrowser;
@property (nonatomic, strong) NSTimer *localNetworkTimer;
@property (nonatomic, copy) RCTPromiseResolveBlock localNetworkResolve;

@end

@implementation TacimixNetworkInfo

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_REMAP_METHOD(requestLocalNetworkAccess,
                 requestLocalNetworkAccessWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [self finishLocalNetworkRequestWithGranted:NO];

    self.localNetworkResolve = resolve;
    self.localNetworkBrowser = [NSNetServiceBrowser new];
    self.localNetworkBrowser.delegate = self;
    self.localNetworkTimer = [NSTimer scheduledTimerWithTimeInterval:TacimixLocalNetworkPromptTimeout
                                                              target:self
                                                            selector:@selector(localNetworkRequestTimedOut)
                                                            userInfo:nil
                                                             repeats:NO];

    [self.localNetworkBrowser searchForServicesOfType:@"_osc._udp." inDomain:@"local."];
  });
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

- (void)netServiceBrowserWillSearch:(__unused NSNetServiceBrowser *)browser
{
  [self finishLocalNetworkRequestWithGranted:YES];
}

- (void)netServiceBrowser:(__unused NSNetServiceBrowser *)browser
             didNotSearch:(__unused NSDictionary<NSString *, NSNumber *> *)errorDict
{
  [self finishLocalNetworkRequestWithGranted:NO];
}

- (void)netServiceBrowser:(__unused NSNetServiceBrowser *)browser
           didFindService:(__unused NSNetService *)service
               moreComing:(__unused BOOL)moreComing
{
  [self finishLocalNetworkRequestWithGranted:YES];
}

- (void)localNetworkRequestTimedOut
{
  [self finishLocalNetworkRequestWithGranted:NO];
}

- (void)finishLocalNetworkRequestWithGranted:(BOOL)granted
{
  if (self.localNetworkTimer) {
    [self.localNetworkTimer invalidate];
    self.localNetworkTimer = nil;
  }

  if (self.localNetworkBrowser) {
    self.localNetworkBrowser.delegate = nil;
    [self.localNetworkBrowser stop];
    self.localNetworkBrowser = nil;
  }

  RCTPromiseResolveBlock resolve = self.localNetworkResolve;
  self.localNetworkResolve = nil;

  if (resolve) {
    resolve(@(granted));
  }
}

@end
