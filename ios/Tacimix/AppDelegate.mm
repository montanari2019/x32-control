#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

@interface AppDelegate () <RCTBridgeDelegate>

@property (nonatomic, strong) RCTBridge *bridge;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#if DEBUG
  application.idleTimerDisabled = YES;
#endif

  self.bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];

  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:self.bridge
                                                   moduleName:@"Tacimix"
                                            initialProperties:nil];
  rootView.backgroundColor = [UIColor colorWithRed:0.01568627451
                                             green:0.0431372549
                                              blue:0.1019607843
                                             alpha:1.0];

  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  return YES;
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

@end
