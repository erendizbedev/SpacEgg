package com.spacegg.app;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class AlarmReceiver extends BroadcastReceiver {
  static final String CHANNEL = "sg_events";

  // android.jar API 23 oldugu icin API 26+ siniflari yansima (reflection) ile cagrilir.
  static void ensureChannel(Context c) {
    if (Build.VERSION.SDK_INT < 26) return;
    try {
      NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
      if (nm == null) return;
      Class<?> cc = Class.forName("android.app.NotificationChannel");
      if (NotificationManager.class.getMethod("getNotificationChannel", String.class).invoke(nm, CHANNEL) != null) return;
      Object ch = cc.getConstructor(String.class, CharSequence.class, int.class).newInstance(CHANNEL, "Oyun olayları", 3); // IMPORTANCE_DEFAULT
      cc.getMethod("setDescription", String.class).invoke(ch, "Gemi dönüşü, saldırı uyarısı ve gezegen olayları");
      NotificationManager.class.getMethod("createNotificationChannel", cc).invoke(nm, ch);
    } catch (Throwable t) {}
  }

  @Override public void onReceive(Context c, Intent in) {
    String id = in.getStringExtra("id");
    String title = in.getStringExtra("title");
    String text = in.getStringExtra("text");
    String route = in.getStringExtra("route");
    if (id == null) return;
    Store.remove(c, id);
    if (Build.VERSION.SDK_INT >= 33 && c.checkSelfPermission("android.permission.POST_NOTIFICATIONS") != android.content.pm.PackageManager.PERMISSION_GRANTED) return;
    ensureChannel(c);
    Intent open = new Intent(c, MainActivity.class);
    open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
    open.putExtra("route", route == null ? "" : route);
    int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
    PendingIntent tap = PendingIntent.getActivity(c, id.hashCode(), open, fl);
    Notification.Builder b = new Notification.Builder(c);
    if (Build.VERSION.SDK_INT >= 26) { try { Notification.Builder.class.getMethod("setChannelId", String.class).invoke(b, CHANNEL); } catch (Throwable t) {} }
    b.setSmallIcon(R.drawable.icon)
     .setContentTitle(title == null || title.length() == 0 ? "SpacEgg" : title)
     .setContentText(text == null ? "" : text)
     .setStyle(new Notification.BigTextStyle().bigText(text == null ? "" : text))
     .setContentIntent(tap).setAutoCancel(true);
    NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
    if (nm != null) nm.notify(id.hashCode(), b.build());
  }
}
