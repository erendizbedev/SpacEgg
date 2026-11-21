package com.spacegg.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

/** Alarm kayitlari (SharedPreferences) ve AlarmManager islemleri. */
final class Store {
  static final int MAX = 20;
  private static final String PREF = "sg_alarms";
  private static final String KEY = "list";

  private Store() {}

  private static SharedPreferences sp(Context c) { return c.getSharedPreferences(PREF, Context.MODE_PRIVATE); }

  static synchronized JSONArray load(Context c) {
    try { return new JSONArray(sp(c).getString(KEY, "[]")); } catch (Exception e) { return new JSONArray(); }
  }

  private static void save(Context c, JSONArray a) { sp(c).edit().putString(KEY, a.toString()).apply(); }

  static PendingIntent pi(Context c, String id, String title, String text, String route) {
    Intent i = new Intent(c, AlarmReceiver.class);
    i.setAction("com.spacegg.app.ALARM." + id);
    i.putExtra("id", id); i.putExtra("title", title); i.putExtra("text", text); i.putExtra("route", route);
    int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
    return PendingIntent.getBroadcast(c, id.hashCode(), i, fl);
  }

  private static void arm(Context c, String id, long at, String title, String text, String route) {
    AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
    if (am == null) return;
    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi(c, id, title, text, route));
  }

  private static void disarm(Context c, String id) {
    AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
    if (am != null) am.cancel(pi(c, id, "", "", ""));
  }

  /** Kimlik basina tek alarm; ayni kimlik uzerine yazar. En cok MAX alarm. */
  static synchronized boolean schedule(Context c, String id, long at, String title, String text, String route) {
    if (id == null || id.length() == 0) return false;
    try {
      JSONArray old = load(c);
      JSONArray n = new JSONArray();
      long now = System.currentTimeMillis();
      for (int k = 0; k < old.length(); k++) {
        JSONObject o = old.getJSONObject(k);
        if (id.equals(o.getString("id"))) continue;
        if (o.getLong("at") <= now) continue; // gecmisleri ele
        n.put(o);
      }
      if (at <= now) { save(c, n); disarm(c, id); return false; }
      if (n.length() >= MAX) return false;
      JSONObject o = new JSONObject();
      o.put("id", id); o.put("at", at); o.put("title", title); o.put("text", text); o.put("route", route == null ? "" : route);
      n.put(o);
      save(c, n);
      arm(c, id, at, title, text, route == null ? "" : route);
      return true;
    } catch (Exception e) { return false; }
  }

  static synchronized void cancel(Context c, String id) {
    try {
      JSONArray old = load(c), n = new JSONArray();
      for (int k = 0; k < old.length(); k++) { JSONObject o = old.getJSONObject(k); if (!id.equals(o.getString("id"))) n.put(o); }
      save(c, n);
    } catch (Exception e) {}
    disarm(c, id);
  }

  static synchronized void cancelAll(Context c) {
    JSONArray old = load(c);
    for (int k = 0; k < old.length(); k++) { try { disarm(c, old.getJSONObject(k).getString("id")); } catch (Exception e) {} }
    save(c, new JSONArray());
  }

  static synchronized void remove(Context c, String id) {
    try {
      JSONArray old = load(c), n = new JSONArray();
      for (int k = 0; k < old.length(); k++) { JSONObject o = old.getJSONObject(k); if (!id.equals(o.getString("id"))) n.put(o); }
      save(c, n);
    } catch (Exception e) {}
  }

  /** Acilista veya boot sonrasi: kayitlari yeniden kur (gecmis olanlari ele). */
  static synchronized void rearm(Context c) {
    try {
      JSONArray old = load(c), n = new JSONArray();
      long now = System.currentTimeMillis();
      for (int k = 0; k < old.length(); k++) {
        JSONObject o = old.getJSONObject(k);
        if (o.getLong("at") <= now) continue;
        n.put(o);
        arm(c, o.getString("id"), o.getLong("at"), o.getString("title"), o.getString("text"), o.optString("route", ""));
      }
      save(c, n);
    } catch (Exception e) {}
  }
}
