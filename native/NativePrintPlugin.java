package id.toko.pos;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Cetak struk di Android: (1) kirim ESC/POS ke RawBT, (2) dialog cetak sistem Android. */
@CapacitorPlugin(name = "NativePrint")
public class NativePrintPlugin extends Plugin {

    private WebView holder; // simpan referensi agar tidak di-GC sebelum selesai dimuat

    /** Kirim data ESC/POS (base64) ke aplikasi RawBT. */
    @PluginMethod
    public void rawbt(PluginCall call) {
        String b64 = call.getString("data");
        if (b64 == null || b64.isEmpty()) { call.reject("data kosong"); return; }
        Context ctx = getContext();
        String[] pkgs = {"ru.a402d.rawbtprinter", null};
        for (String pkg : pkgs) {
            try {
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse("rawbt:base64," + b64));
                if (pkg != null) i.setPackage(pkg);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(i);
                call.resolve(new JSObject().put("ok", true));
                return;
            } catch (ActivityNotFoundException e) {
                /* coba tanpa paket */
            } catch (Exception e) {
                call.reject(String.valueOf(e.getMessage()));
                return;
            }
        }
        call.reject("NO_RAWBT: aplikasi RawBT belum terpasang");
    }

    /** Buka dialog cetak sistem Android untuk struk berbentuk HTML. */
    @PluginMethod
    public void printHtml(final PluginCall call) {
        final String html = call.getString("html");
        final String title = call.getString("title", "Struk");
        final int paper = call.getInt("paper", 80);
        if (html == null || html.isEmpty()) { call.reject("html kosong"); return; }
        final Activity act = getActivity();
        if (act == null) { call.reject("activity tidak tersedia"); return; }
        act.runOnUiThread(new Runnable() {
            @Override public void run() {
                try {
                    final WebView wv = new WebView(act);
                    holder = wv;
                    wv.setWebViewClient(new WebViewClient() {
                        @Override public void onPageFinished(WebView v, String url) {
                            try {
                                PrintManager pm = (PrintManager) act.getSystemService(Context.PRINT_SERVICE);
                                PrintDocumentAdapter ad = v.createPrintDocumentAdapter(title);
                                int w = paper == 58 ? 2283 : 3150; // mil (1/1000 inci)
                                PrintAttributes attrs = new PrintAttributes.Builder()
                                    .setMediaSize(new PrintAttributes.MediaSize("struk", "Struk", w, 11690))
                                    .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                                    .build();
                                pm.print(title, ad, attrs);
                                call.resolve();
                            } catch (Exception e) {
                                call.reject(String.valueOf(e.getMessage()));
                            }
                        }
                    });
                    wv.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
                } catch (Exception e) {
                    call.reject(String.valueOf(e.getMessage()));
                }
            }
        });
    }
}
