---
title: 关于应用中网络状态变化的一点思考
categories: Big-Back-End
toc: true
comments: true
date: 2017-01-19 13:54:49
tags:
---

本人所在的项目中，由于历史原因，存在大量可以优化的地方，本文就网络状态这块，给出自己的一点思考。如果有更好的方法，可以评论告诉我。另外，网络状态这块以已经集成到我的基础库 [CommonAndroid](https://github.com/mjd507/CommonAndroid) 中了，如果你对基础库的封装也有兴趣，也欢迎 star 或者 fork。

<!--more-->

## 项目现状
- 已经有了 NetworkUtils 网络相关的工具类，包含了判断网络是否可用，获取当前网络类型等方法。
- 每个网络请求的方法之前都会先调用 NetworkUtils.isConnected(Context) 来检查网络
- 有几个 Activity 会注册网络变化的广播，从未联网到联网时自动刷新

## 一点思考
- 每次请求都判断网络能否简化，毕竟用户使用是一个连贯的过程，在网络状态没有变化时没有必要重复检查
- 多个 Activity 都注册几乎重复的广播能否优化，毕竟是重复劳动。

## 初步措施
- 使用单例模式，维护一个 NetStateReceiver 的广播接受者
- 使用观察者模式，让 NetStateReceiver 提供注册观察者的方法
- 当网络状态改变时，通知所有注册的观察者

## 具体实现

- NetworkUtils 网络相关工具类
```java

    public enum NetworkType {
        NETWORK_WIFI,
        NETWORK_MOBILE,
        NETWORK_NONE
    }

    /**
     * 判断网络是否可用
     */
    public static boolean isConnected(Context context) {
        ConnectivityManager cm = (ConnectivityManager) context.getApplicationContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo info = cm.getActiveNetworkInfo();
        return info != null && info.isConnected();
    }
    /**
     * 获取当前网络类型
     */
    public static NetworkType getNetworkType(Context context) {
        NetworkType netType = NetworkType.NETWORK_NONE;
        ConnectivityManager cm = (ConnectivityManager) context.getApplicationContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo info = cm.getActiveNetworkInfo();
        if (info != null && info.isAvailable()) {
            if (info.getType() == ConnectivityManager.TYPE_WIFI) {
                netType = NetworkType.NETWORK_WIFI;
            } else if (info.getType() == ConnectivityManager.TYPE_MOBILE) {
                netType = NetworkType.NETWORK_MOBILE;
            }
        }
        return netType;
    }

```

- NetChangeObserver 网络状态变化的观察者
```java
public interface NetChangeObserver {

    void onConnect(NetworkType type);

    void onDisConnect();

}

```

- NetStateReceiver 网络状态变化的广播接受者
```java

    private ArrayList<NetChangeObserver> observers = new ArrayList<>();

    /**
     * 注册网络连接观察者,可以注册多个观察者
     */
    public void registerObserver(NetChangeObserver observer) {
        if (observers == null) {
            observers = new ArrayList<>();
        }
        observers.add(observer);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equalsIgnoreCase(ANDROID_NET_CHANGE_ACTION)) {
            notifyObserver(context);
        }
    }

    private void notifyObserver(Context context) {
        for (int i = 0; i < observers.size(); i++) {
            NetChangeObserver observer = observers.get(i);
            if (observer != null) {
                boolean isConnected = NetworkUtils.isConnected(context);
                NetworkType currentType = NetworkUtils.getNetworkType(context);
                if (isConnected) {
                    // 2/3/4G <--> WIFI 之间的网络切换, 也会进入此回调
                    observer.onConnect(currentType);
                } else {
                    observer.onDisConnect();
                }
            }
        }

    }

```

## 使用建议
建议 Application 启动时，获取网络类型，并注册该 NetStateReceiver，Application 退出时，销毁该 Receiver
```java

    /**
     * 应用全局的网络变化处理
     */
    private void initNetChangeReceiver() {

        //获取当前网络类型
        mNetType = NetworkUtils.getNetworkType(this);

        //定义网络状态的广播接受者
        netStateReceiver = NetStateReceiver.getReceiver();

        //给广播接受者注册一个观察者
        netStateReceiver.registerObserver(netChangeObserver);

        //注册网络变化广播
        NetworkUtils.registerNetStateReceiver(this, netStateReceiver);

    }

    private NetChangeObserver netChangeObserver = new NetChangeObserver() {

        @Override
        public void onConnect(NetworkUtils.NetworkType type) {
	        if (type == mNetType) return; //net not change
	        switch (type) {
	            case NETWORK_WIFI:
	                ToastUtils.showLong(this, "已切换到 WIFI 网络");
	                break;
	            case NETWORK_MOBILE:
	                ToastUtils.showLong(this, "已切换到 2G/3G/4G 网络");
	                break;
	        }
	        mNetType = type;
        }

        @Override
        public void onDisConnect() {
	        ToastUtils.showShort(this, "网络已断开,请检查网络设置");
        	mNetType = NetworkUtils.NetworkType.NETWORK_NONE;
        }
    };

```
------

至此，项目中就可以根据 Application 的 mNetType 字段来判断网络是否可用，如果 Activity 需要 监听网络状态，只需要 NetStateReceiver.getReceiver().registerObserver(netChangeObserver) 来处理网络连解或者断开的情况。是不是感觉一下子整洁了不少。
再次提醒如果在 Activity 注册了一个 netChangeObserver，要在 onDestroy 时 移除掉，退出 应用时，移除所有 netChangeObserver，并解注册掉该广播。切记切记，完整代码可以去我的 GitHub 上查看，希望对你有帮助。


