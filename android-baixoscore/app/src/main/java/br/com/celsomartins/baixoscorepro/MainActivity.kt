package br.com.celsomartins.baixoscorepro

import android.annotation.SuppressLint
import android.app.Activity
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.webkit.WebViewAssetLoader

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private var downloadId: Long = -1L
    private var pendingApkUri: Uri? = null
    private var receiverRegistered = false
    private var awaitingInstallPermission = false

    private val downloadReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L) != downloadId) return
            val manager = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
            pendingApkUri = manager.getUriForDownloadedFile(downloadId)
            if (pendingApkUri == null) {
                Toast.makeText(this@MainActivity, "Não foi possível baixar a atualização.", Toast.LENGTH_LONG).show()
                return
            }
            installDownloadedApkIfAllowed()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.javaScriptCanOpenWindowsAutomatically = false
            settings.setSupportMultipleWindows(false)
            settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
            addJavascriptInterface(AndroidUpdateBridge(), "BaixoScoreAndroid")
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: android.webkit.WebResourceRequest
                ): android.webkit.WebResourceResponse? {
                    return assetLoader.shouldInterceptRequest(request.url)
                }
            }
            webChromeClient = WebChromeClient()
            setBackgroundColor(android.graphics.Color.rgb(7, 5, 22))
        }

        setContentView(webView)
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(downloadReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(downloadReceiver, filter)
        }
        receiverRegistered = true
    }

    private inner class AndroidUpdateBridge {
        @JavascriptInterface
        fun openApkUpdate(url: String) {
            runOnUiThread {
                val validReleaseUrl = url.startsWith("https://github.com/celsomartins251/dicas-de-musica/releases/download/") ||
                    url.startsWith("https://github.com/celsomartins251/dicas-de-musica/releases/latest/download/")
                if (!validReleaseUrl || !url.endsWith("/BaixoScore-Pro.apk")) {
                    Toast.makeText(this@MainActivity, "Endereço de atualização inválido.", Toast.LENGTH_LONG).show()
                    return@runOnUiThread
                }
                try {
                    val request = DownloadManager.Request(Uri.parse(url))
                        .setTitle("Atualização do BaixoScore Pro")
                        .setDescription("Baixando o instalador da nova versão")
                        .setMimeType("application/vnd.android.package-archive")
                        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                        .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "BaixoScore-Pro-update.apk")
                    val manager = getSystemService(DOWNLOAD_SERVICE) as DownloadManager
                    downloadId = manager.enqueue(request)
                    Toast.makeText(this@MainActivity, "Download iniciado. Você receberá uma notificação ao terminar.", Toast.LENGTH_LONG).show()
                } catch (error: Exception) {
                    Toast.makeText(this@MainActivity, "Não foi possível iniciar o download.", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun installDownloadedApkIfAllowed() {
        val apkUri = pendingApkUri ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !packageManager.canRequestPackageInstalls()) {
            if (!awaitingInstallPermission) {
                awaitingInstallPermission = true
                Toast.makeText(this, "Autorize a instalação de apps desta fonte para concluir a atualização.", Toast.LENGTH_LONG).show()
                val settingsIntent = Intent(
                    Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:$packageName")
                )
                startActivity(settingsIntent)
            }
            return
        }
        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
            startActivity(installIntent)
            pendingApkUri = null
        } catch (error: Exception) {
            Toast.makeText(this, "Abra o APK baixado na pasta Downloads para instalar.", Toast.LENGTH_LONG).show()
        }
    }

    override fun onResume() {
        super.onResume()
        if (pendingApkUri != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && packageManager.canRequestPackageInstalls()) {
            awaitingInstallPermission = false
            installDownloadedApkIfAllowed()
        }
    }

    @Deprecated("Deprecated in Android API")
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        if (receiverRegistered) {
            try { unregisterReceiver(downloadReceiver) } catch (_: Exception) { }
            receiverRegistered = false
        }
        if (::webView.isInitialized) webView.destroy()
        super.onDestroy()
    }
}
