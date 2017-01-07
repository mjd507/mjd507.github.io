---
title: Android 内存泄漏 的解决方案
categories: Android
toc: true
comments: true
date: 2016-12-03 18:04:17
tags:
---

Android 内存泄漏是很有必要引起极大重视的一个话题，因为绝大部分的内存泄漏是可以避免的，如果开发者的目标只是开发出来，而不思考自己写得代码是否隐藏着风险，是否可以进一步优化，那么毫无疑问，永远无法成为高级工程师。其它的影响就不说了，下面我来梳理一下可能引起内存泄漏的代码以及相应的解决方案。

<!--more-->


**题外话**
先穿插一句，我所在的公司 途虎养车网 一直在与 阿里巴巴 合作进行车载系统的开发，我们的 途虎养车 需要集成到 搭载 阿里云系统（ YunOS）系统里面去，车载系统上对 app 的性能要求是极其的高。阿里那边的测试妹子也是相当厉害，对内存，CPU资源占用 这一块一直严控。我就结合着自己的项目的内存泄漏点来理一理。

## 注册的监听器
不要太惊讶，普通的 view.setOnClickListener(this) 并不会造成内存泄漏，因为 view 与 Activity 紧紧绑在一起，当 Activity 销毁的时候，这些 listener 会成为 garbage，垃圾回收器会随时回收它们。但是有一些 listener，比如 LocationManager，它是由系统进程持有。看下面一段代码。
```java
public class LeaksActivity extends AppCompatActivity implements LocationListener {

    private LocationManager locationManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_leaks);
        locationManager = (LocationManager) this.getSystemService(LOCATION_SERVICE);
        locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER,
                TimeUnit.MINUTES.toMillis(5), 100, LeaksActivity.this);
    }

    // Listener implementation omitted
}
```
上面用了 Android 系统的位置更新服务，让 Activity 实现了 LocationListener 接口，并重写了它的回调方法。这样系统持有的 LocationListener 就持有了 Activity 的引用。当 Activity 可以旋转 或者 频繁的进入关闭该 Activity 的时候，由于 LocationListener 持有 引用，所以 垃圾回收器并不会回收该 Activity，从而导致了 内存泄漏。重复操作，最终将内存溢出。解决的办法就是在 onDestroy() 方法里移除更新。
```java

    @Override
    protected void onDestroy() {
        locationManager.removeUpdates(this);
        super.onDestroy();
    }

```
另外 动态注册 Broadcastreceiver 与此同理，不要忘了 unregister 。

## 内部类
内部类用起来太方便了，代码可读性也好，但是使用的时候务必谨慎一下，之所以用起来舒服，是因为内部类隐式地持有了外部类的引用，因此可以访问外部类的成员和方法，但是当内部类是一个 Thread 或者 AnsynTask 的时候，由于 Thread 执行任务 结束的时间是不确定的，当任务没有执行完时，线程是不会被销毁的，因此 它隐式引用的 Activity 也不会销毁。如果是 AnsyncTask 的情况更加糟糕，它的内部 维护了一个 ThreadPoolExecutor，该类创建的线程 的 生命周期是不确定的，或者说是无法控制的，因此更加容易出现内存泄漏。看下面一段代码。
```java
public class AsyncActivity extends AppCompatActivity{

    private TextView textView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_async);
        textView = (TextView) findViewById(R.id.text_view);
        new BackgroundTask().execute();
    }

    private class BackgroundTask extends AsyncTask<Void,Void,String>{

        @Override
        protected String doInBackground(Void... voids) {
            return "some str";
        }

        @Override
        protected void onPostExecute(String s) {
            super.onPostExecute(s);
            textView.setText(s);
        }
    }

}

```
上面这段代码，如果是一个 HTTP 请求的话，假设网络不是很好（这个概率是很大的），由于 AsyncTask 又没有取消，哈哈，完蛋了！
如何解决呢？
1. 将内部类声明成静态 static 的，削除对外部类的引用。那如何获取 textView 呢？
2. 在静态内部类内部保存一个 Context 的引用。思考：是否有问题？static --> Context ?
3. 用 弱引用 的形式 保存 Context 的引用。
4. onDestroy() 时 取消 AsyncTask。 参见 [AsyncTask Document](http://developer.android.com/reference/android/os/AsyncTask.html)
修改后代码如下：
```java
public class AsyncActivity extends AppCompatActivity{

    private TextView textView;
    private AsyncTask<Void, Void, String> task;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_async);
        textView = (TextView) findViewById(R.id.text_view);
        task = new BackgroundTask(this).execute();
    }

    private static class BackgroundTask extends AsyncTask<Void,Void,String>{
        private WeakReference<Context> mContext;
        BackgroundTask(Context context){
            this.mContext = new WeakReference<>(context);
        }

        @Override
        protected String doInBackground(Void... voids) {
            return "some str";
        }

        @Override
        protected void onPostExecute(String s) {
            super.onPostExecute(s);
            AsyncActivity activity = (AsyncActivity) mContext.get();
            if(activity != null){
                activity.textView.setText(s);
            }
        }
    }

    @Override
    protected void onDestroy() {
        task.cancel(true);
        super.onDestroy();
    }
}

```
匿名类和内部类一样，同样持有外部类的引用，解决方法和上面相同。我们在 用 Handler 的时候，声明在内部时经常会看到编辑器会有警告 **“handler should be static, else it is prone to memory leaks. ”** 与上面同理。

## 资源未释放
代码里长期保持着资源的引用，比如 Context，IO 流，Cursor，Bitmap 等。资源得不到释放，从而导致泄漏。看下面 Android 官方文档的一段关于 context 的长期引用例子。
```java 
private static Drawable sBackground;

@Override
protected void onCreate(Bundle state) {
  super.onCreate(state);
  
  TextView label = new TextView(this);
  label.setText("Leaks are bad");
  
  if (sBackground == null) {
    sBackground = getDrawable(R.drawable.large_bitmap);
  }
  label.setBackgroundDrawable(sBackground);
  
  setContentView(label);
}
```
sBackground 与 TextView 关联起来了，而且 sBackground 是一个 静态 的成员变量，所以即使 activity 销毁，sBackground 仍然持有 TextView 的引用，TextView 是包含 Context 引用的，所以 最终 activity 并没有释放。
解决方案：
1. 尽量避免 static 关键字 引用资源消费过多的实例。
2. 尽量使用 ApplicationContext，它的生命周期长，不会出现泄漏的情况。

再举一个 Cursor 不关的例子。
我们的项目有一个单独地跑在后端的 service 进程，每 30s 去获取 阿里提供的天气数据，从而刷新洗车指数等。其中 读取天气指数 是通过读取阿里提供的本地数据库数据实现，所以用到了 Cursor，而且一直没关（不知道谁写的了，找出来绝对要面批），阿里测试反馈了这个bug，我跟进代码才揪出来，游标没关，丢人。

## 参考资料
[Android Performance Patterns](https://www.youtube.com/playlist?list=PLWz5rJ2EKKc9CBxr3BVjPTPoDPLdPIFCE) on YouTube
[Memory leaks in Android — identify, treat and avoid](https://medium.com/freenet-engineering/memory-leaks-in-android-identify-treat-and-avoid-d0b1233acc8#.nsm8z3164)
[Memory leakage in event listener](http://stackoverflow.com/questions/5002589/memory-leakage-in-event-listener)
[Android : References to a Context and memory leaks](http://stackoverflow.com/questions/3346080/android-references-to-a-context-and-memory-leaks)

## 补充
- 第三方库 检测内存泄漏
[LeakCanary](https://github.com/square/leakcanary) 内存泄漏检测的一个库

- 使用 工具 检测内存泄漏
[基于Android Studio的内存泄漏检测与解决全攻略](http://wetest.qq.com/lab/view/?id=99&from=ads_test2_qqtips&sessionUserType=BFT.PARAMS.192844.TASKID&ADUIN=836240219&ADSESSION=1466394985&ADTAG=CLIENT.QQ.5467_.0&ADPUBNO=26558)
[Android Activity泄漏问题解决方案](http://wetest.qq.com/lab/view/63.html?from=ads_test2_qqtips&sessionUserType=BFT.PARAMS.195040.TASKID&ADUIN=836240219&ADSESSION=1468559577&ADTAG=CLIENT.QQ.5449_.0&ADPUBNO=26525)
[Android性能优化之内存泄漏](http://johnnyshieh.github.io/android/2016/11/18/android-memory-leak/)
[内存分析工具 MAT 的使用](http://blog.csdn.net/aaa2832/article/details/19419679/)

<br /><br /><br />

<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/"><img alt="知识共享许可协议" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-nd/3.0/cn/88x31.png" /></a><br />本作品采用<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/">知识共享署名-非商业性使用-禁止演绎 3.0 中国大陆许可协议</a>进行许可。