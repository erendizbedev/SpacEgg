package com.spacegg.app;

import android.app.Activity;
import android.graphics.Color;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
  private WebView web;
  private String pendingRoute = null;
  private final Handler hnd = new Handler();
  private final Runnable hide = new Runnable() { public void run() { immersive(); } };

  private void immersive() {
    getWindow().getDecorView().setSystemUiVisibility(
      View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
      | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
  }

  @Override protected void onCreate(Bundle b) {
    super.onCreate(b);
    requestWindowFeature(Window.FEATURE_NO_TITLE);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    web = new WebView(this);
    web.setBackgroundColor(Color.parseColor("#040815"));
    setContentView(web);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setAllowFileAccess(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setCacheMode(WebSettings.LOAD_DEFAULT);
    web.setWebChromeClient(new WebChromeClient());
    web.setWebViewClient(new WebViewClient() {
      @Override public void onPageFinished(WebView v, String u) { v.resumeTimers(); js("window.dispatchEvent(new Event('sg-resume'))"); fireRoute(); }
    });
    web.addJavascriptInterface(new Bridge(this), "SGNative");
    AlarmReceiver.ensureChannel(this);
    Store.rearm(this);
    takeRoute(getIntent());
    web.loadUrl("file:///android_asset/index.html");
    immersive();
    getWindow().getDecorView().setOnSystemUiVisibilityChangeListener(new View.OnSystemUiVisibilityChangeListener() {
      public void onSystemUiVisibilityChange(int f) { hnd.removeCallbacks(hide); hnd.postDelayed(hide, 3000); }
    });
  }

  private void takeRoute(Intent in) {
    if (in == null) return;
    String r = in.getStringExtra("route");
    in.removeExtra("route");
    if (r != null && r.length() > 0 && r.matches("[A-Za-z0-9_#/\\-]{1,40}")) pendingRoute = r;
  }

  private void fireRoute() {
    if (pendingRoute == null) return;
    String r = pendingRoute; pendingRoute = null;
    js("try{window.dispatchEvent(new CustomEvent('sg-route',{detail:'" + r + "'}));}catch(e){}");
  }

  @Override protected void onNewIntent(Intent in) {
    super.onNewIntent(in);
    setIntent(in);
    takeRoute(in);
    fireRoute();
  }

  private void js(String code) { if (web != null) web.evaluateJavascript(code, null); }

  @Override protected void onPause() {
    js("try{window.dispatchEvent(new Event('sg-pause'));if(window.SG&&SG.A&&SG.A.pauseAll)SG.A.pauseAll();}catch(e){}");
    hnd.postDelayed(new Runnable() { public void run() { if (web != null) { web.onPause(); web.pauseTimers(); } } }, 400);
    super.onPause();
  }

  @Override protected void onResume() {
    super.onResume();
    if (web != null) { web.onResume(); web.resumeTimers(); }
    js("try{window.dispatchEvent(new Event('sg-resume'));if(window.SG&&SG.A&&SG.A.resumeAll)SG.A.resumeAll();}catch(e){}");
    immersive();
  }

  @Override public void onWindowFocusChanged(boolean f) { super.onWindowFocusChanged(f); if (f) immersive(); }

  @Override public void onBackPressed() {
    final Activity me = this;
    web.evaluateJavascript(
      "(function(){try{if(SG.Drawer&&SG.Drawer.back&&SG.Drawer.back())return 'ok';var h=location.hash||'';if(/^#\\/(cosmos|login|intro|)$/.test(h))return 'exit';SG.go(SG.homeRoute?SG.homeRoute():'cosmos');return 'ok';}catch(e){return 'exit';}})()",
      new ValueCallback<String>() { public void onReceiveValue(String v) { if (v != null && v.contains("exit")) me.finish(); } });
  }

  @Override protected void onDestroy() { if (web != null) { web.destroy(); web = null; } super.onDestroy(); }
}
