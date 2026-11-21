package com.spacegg.app;

import android.app.Activity;
import android.content.Context;
import android.os.Build;
import android.os.SystemClock;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;

/** JS koprusu: window.SGNative. Yalniz ilkel parametreler. */
public class Bridge {
  private final Activity act;
  private final Context ctx;
  Bridge(Activity a) { act = a; ctx = a.getApplicationContext(); }

  @JavascriptInterface public boolean schedule(String id, long atMs, String title, String text) {
    return Store.schedule(ctx, id, atMs, title, text, "");
  }
  @JavascriptInterface public boolean scheduleRoute(String id, long atMs, String title, String text, String route) {
    return Store.schedule(ctx, id, atMs, title, text, route);
  }
  @JavascriptInterface public void cancel(String id) { if (id != null) Store.cancel(ctx, id); }
  @JavascriptInterface public void cancelAll() { Store.cancelAll(ctx); }
  @JavascriptInterface public long elapsed() { return SystemClock.elapsedRealtime(); }

  @JavascriptInterface public boolean canNotify() {
    if (Build.VERSION.SDK_INT >= 33 && ctx.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) return false;
    android.app.NotificationManager nm = (android.app.NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm == null) return true;
    try { return ((Boolean) android.app.NotificationManager.class.getMethod("areNotificationsEnabled").invoke(nm)).booleanValue(); } catch (Throwable t) { return true; }
  }

  @JavascriptInterface public void requestPermission() {
    if (Build.VERSION.SDK_INT < 33) return;
    act.runOnUiThread(new Runnable() { public void run() {
      if (act.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED)
        act.requestPermissions(new String[] { "android.permission.POST_NOTIFICATIONS" }, 77);
    } });
  }

  @JavascriptInterface public void keepAwake(final boolean on) {
    act.runOnUiThread(new Runnable() { public void run() {
      if (on) act.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
      else act.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    } });
  }
}
