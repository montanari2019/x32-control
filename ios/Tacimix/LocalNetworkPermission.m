#import <React/RCTBridgeModule.h>

#import <Network/Network.h>
#import <dns_sd.h>
#import <errno.h>

static NSString *const LocalNetworkPermissionServiceType = @"_preflight_check._tcp";
static NSTimeInterval const LocalNetworkPermissionTimeoutSeconds = 5.0;
static NSString *const LocalNetworkPermissionLogPrefix = @"TACIMIX_NET LocalNetworkPermission";

@interface LocalNetworkPermission : NSObject <RCTBridgeModule>
@end

@implementation LocalNetworkPermission

RCT_EXPORT_MODULE(LocalNetworkPermission);

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

static NSString *LocalNetworkPermissionErrorMessage(nw_error_t error)
{
  if (error == nil) {
    return nil;
  }

  nw_error_domain_t domain = nw_error_get_error_domain(error);
  int code = nw_error_get_error_code(error);
  return [NSString stringWithFormat:@"Network.framework domain=%d code=%d", domain, code];
}

static BOOL LocalNetworkPermissionIsDenied(nw_error_t error)
{
  if (error == nil) {
    return NO;
  }

  nw_error_domain_t domain = nw_error_get_error_domain(error);
  int code = nw_error_get_error_code(error);

  return (domain == nw_error_domain_dns && code == kDNSServiceErr_PolicyDenied) ||
         (domain == nw_error_domain_posix && code == EPERM);
}

- (NSDictionary *)resultWithStatus:(NSString *)status
                            granted:(BOOL)granted
                            message:(NSString *)message
{
  NSMutableDictionary *result = [@{
    @"status": status,
    @"granted": @(granted),
  } mutableCopy];

  if (message.length > 0) {
    result[@"message"] = message;
  }

  return result;
}

RCT_REMAP_METHOD(requestPermission,
                 requestPermissionWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSLog(@"%@ requestPermission called", LocalNetworkPermissionLogPrefix);

  if (@available(iOS 14.0, *)) {
    [self runPreflightWithResolver:resolve];
    return;
  }

  NSLog(@"%@ iOS < 14, resolving granted", LocalNetworkPermissionLogPrefix);
  resolve([self resultWithStatus:@"granted"
                          granted:YES
                          message:@"iOS anterior ao Local Network Privacy."]);
}

- (void)runPreflightWithResolver:(RCTPromiseResolveBlock)resolve API_AVAILABLE(ios(14.0))
{
  NSLog(@"%@ preflight start service=%@ timeout=%.1fs",
        LocalNetworkPermissionLogPrefix,
        LocalNetworkPermissionServiceType,
        LocalNetworkPermissionTimeoutSeconds);

  dispatch_queue_t queue = dispatch_queue_create("com.tacimix.local-network-permission",
                                                 DISPATCH_QUEUE_SERIAL);
  nw_parameters_t parameters = nw_parameters_create();
  nw_browse_descriptor_t descriptor = nw_browse_descriptor_create_bonjour_service(
      [LocalNetworkPermissionServiceType UTF8String],
      NULL);
  __block nw_browser_t browser = nw_browser_create(descriptor, parameters);
  __block BOOL settled = NO;

  void (^finish)(NSString *, BOOL, NSString *) = ^(NSString *status, BOOL granted, NSString *message) {
    if (settled) {
      NSLog(@"%@ finish ignored status=%@ granted=%@ message=%@",
            LocalNetworkPermissionLogPrefix,
            status,
            granted ? @"YES" : @"NO",
            message);
      return;
    }

    settled = YES;
    if (browser != nil) {
      nw_browser_cancel(browser);
      browser = nil;
    }

    NSLog(@"%@ finish status=%@ granted=%@ message=%@",
          LocalNetworkPermissionLogPrefix,
          status,
          granted ? @"YES" : @"NO",
          message);
    resolve([self resultWithStatus:status granted:granted message:message]);
  };

  nw_browser_set_queue(browser, queue);
  nw_browser_set_state_changed_handler(browser, ^(nw_browser_state_t state, nw_error_t error) {
    NSLog(@"%@ browser state=%ld error=%@",
          LocalNetworkPermissionLogPrefix,
          (long)state,
          LocalNetworkPermissionErrorMessage(error));

    if (settled) {
      return;
    }

    if (state == nw_browser_state_ready) {
      finish(@"granted", YES, @"Permissao de rede local disponivel.");
      return;
    }

    if (LocalNetworkPermissionIsDenied(error)) {
      finish(@"denied", NO, LocalNetworkPermissionErrorMessage(error));
      return;
    }

    if (state == nw_browser_state_failed) {
      finish(@"unknown", NO, LocalNetworkPermissionErrorMessage(error));
    }
  });

  dispatch_after(dispatch_time(DISPATCH_TIME_NOW,
                               (int64_t)(LocalNetworkPermissionTimeoutSeconds * NSEC_PER_SEC)),
                 queue,
                 ^{
                   finish(@"waiting",
                          NO,
                          @"Tempo esgotado aguardando resposta da permissao de rede local.");
                 });

  nw_browser_start(browser);
}

@end
