package com.spacegg.app;

import android.app.Activity;
import android.graphics.Color;
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
    private final Handler handler = new Handler();
    private int seq = 0;
    private boolean inBg = false;
    private boolean nativePaused = false;

    private static final String JS_PAUSE =
        "(function(){try{if(window.SG&&SG.A&&SG.A.pauseAll)SG.A.pauseAll();}catch(e){}"
        + "try{var m=document.querySelectorAll('audio,video');for(var i=0;i<m.length;i++)m[i].pause();}catch(e){}"
        + "try{window.dispatchEvent(new Event('sg-pause'));}catch(e){}})();";
    private static final String JS_RESUME =
        "(function(){try{if(window.SG&&SG.A&&SG.A.resumeAll)SG.A.resumeAll();}catch(e){}"
        + "try{window.dispatchEvent(new Event('sg-resume'));}catch(e){}})();";

    private final Runnable hideRunnable = new Runnable() {
        @Override
        public void run() {
            hideBars();
        }
    };

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);

        web = new WebView(this);
        web.setBackgroundColor(Color.BLACK);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true);
        s.setBuiltInZoomControls(false);
        s.setSupportZoom(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView v, String url) {
                if (!inBg) v.evaluateJavascript(JS_RESUME, null);
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(web);

        // Tam ekran: gezinme tuslari kaydirinca gelir, birkac saniye sonra kendiliginden gizlenir.
        getWindow().getDecorView().setOnSystemUiVisibilityChangeListener(
            new View.OnSystemUiVisibilityChangeListener() {
                @Override
                public void onSystemUiVisibilityChange(int visibility) {
                    handler.removeCallbacks(hideRunnable);
                    if ((visibility & View.SYSTEM_UI_FLAG_HIDE_NAVIGATION) == 0) {
                        handler.postDelayed(hideRunnable, 3000);
                    }
                }
            });
        hideBars();

        if (b != null) {
            web.restoreState(b);
        } else {
            web.loadUrl("file:///android_asset/index.html");
        }
    }

    private void hideBars() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    public void onWindowFocusChanged(boolean f) {
        super.onWindowFocusChanged(f);
        if (f) hideBars();
    }

    // Ana ekrana donulunca: muzik durur, sayfa zamanlayicilari durur, arka planda calismaz.
    private void doPause(int my) {
        if (inBg && my == seq && !nativePaused) {
            web.onPause();
            web.pauseTimers();
            nativePaused = true;
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        inBg = true;
        handler.removeCallbacks(hideRunnable);
        final int my = ++seq;
        // Once sayfadaki sesi durdur, betik bitince (en gec 500 ms) zamanlayicilari durdur.
        web.evaluateJavascript(JS_PAUSE, new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String v) {
                doPause(my);
            }
        });
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                doPause(my);
            }
        }, 500);
    }

    // Uygulamaya tekrar girilince: kaldigi yerden devam eder.
    @Override
    protected void onResume() {
        super.onResume();
        inBg = false;
        seq++;
        if (nativePaused) {
            web.resumeTimers();
            web.onResume();
            nativePaused = false;
        }
        web.evaluateJavascript(JS_RESUME, null);
        hideBars();
    }

    @Override
    protected void onSaveInstanceState(Bundle o) {
        super.onSaveInstanceState(o);
        web.saveState(o);
    }

    // Geri tusu: alt sayfadaysa ana merkeze, merkezde veya giriste uygulamadan cikar.
    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(function(){return location.hash||''})()", new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String v) {
                String h = v == null ? "" : v.replace("\"", "");
                if (h.length() == 0 || h.equals("#/hub") || h.equals("#/login") || h.equals("#/")) {
                    finish();
                } else {
                    web.evaluateJavascript("location.hash='#/hub'", null);
                }
            }
        });
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(hideRunnable);
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
