---
title: View 的 事件分发体系 及 滑动冲突解决方案
categories: Android
toc: true
comments: true
date: 2016-12-20 15:20:18
tags:
---


Android 中 当遇到滑动冲突的问题，就会涉及到事件的分发与响应。事件分发，事件拦截，事件处理 是 理清各个 view 所要处理的事件的三个重要的方法。这里就结合源码分析一下 从点击 Activity 上的一个控件开始，到事件响应结束的 事件传递的整个流程。包括 Activity 对事件的处理，ViewGroup 对事件的处理，View 对事件的处理。

<!--more-->

**声明：本文参考自 《Android开发艺术探索》，非常赞的[一本书](https://www.amazon.cn/Android%E5%BC%80%E5%8F%91%E8%89%BA%E6%9C%AF%E6%8E%A2%E7%B4%A2-%E4%BB%BB%E7%8E%89%E5%88%9A/dp/B014HV1X3K/ref=sr_1_1?s=books&ie=UTF8&qid=1482818361&sr=1-1&keywords=android+%E5%BC%80%E5%8F%91%E8%89%BA%E6%9C%AF%E6%8E%A2%E7%B4%A2)，有兴趣可以去看一看。**

## View 的事件分发体系
先来看一张 事件分发 的流程图（搜刮自网络）
![Touch 事件传递流程图](/images/Touch-Event-Dispatch.png)

图里表现的非常清楚，当 view 产生一个 touch 事件后，如果 该 view 是一个 ViewGroup, 则去判断 ViewGroup 里面的 onInterceptTouchEvent() 方法，表示是否拦截事件，默认是返回 false，表示不拦截，让事件传递给 子view，子view 如果还是 ViewGroup，默认仍然继续向下传递，直到 子 view 不是 ViewGroup，则直接调用 子view 的 onTouchEvent() 方法，return true 表示消费了此事件，传递过程结束，false 则将事件向上(ViewGroup)传，都不处理的话，最终会传递到 Activity，此时，Activity 的 onTouchEvent() 将被调用。

如果我们中途重写了 ViewGroup 的 onInterceptTouchEvent() 方法，让其返回 true，则表示 我们这个 ViewGroup 拦截了这个事件，在 onTouchEvent() 方法中可以处理，不处理则与上面向上传递的流程一样。

当然，图中只是比较普遍的一种事件传递流程，实际上具体的细节与图还不尽相同，比如 ViewGroup 的 onInterceptTouchEvent() 方法并不是一定会执行的，具体的本篇文章会详细分析。

### Activity 对事件的分发
点击事件产生时，最先传递给当前的 Activity，由 Activity 的 dispatchTouchEvent() 来进行事件派发，来看代码：
```java
    public boolean dispatchTouchEvent(MotionEvent ev) {
        if (ev.getAction() == MotionEvent.ACTION_DOWN) {
            onUserInteraction();
        }
        if (getWindow().superDispatchTouchEvent(ev)) {
            return true;
        }
        return onTouchEvent(ev);
    }
```
onUserInteraction() 是 Activity 通过 Window 向 view **分发事件之前** 调用的方法，我们一般可以重写该方法来管理状态栏的通知。
重点在 getWindow().superDispatchTouchEvent(ev) 这个方法，这里就是开始调用 Window 的 事件分发的方法，(如果此方法消费了事件，那么 Activity 也就消费事件，不再传递，循环结束)，我们跟进去看一下：
```java
public abstract boolean superDispatchTouchEvent(MotionEvent event);
```
Window 类的 superDispatchTouchEvent 是一个抽象方法，在它源码的文档中，可以看到一段注释：
```java
/**
 * Abstract base class for a top-level window look and behavior policy.  An
 * instance of this class should be used as the top-level view added to the
 * window manager. It provides standard UI policies such as a background, title
 * area, default key processing, etc.
 *
 * <p>The only existing implementation of this abstract class is
 * android.policy.PhoneWindow, which you should instantiate when needing a
 * Window.  Eventually that class will be refactored and a factory method
 * added for creating Window instances without knowing about a particular
 * implementation.
 */

```
Window 类可以控制顶级 view 的外观和行为策略，它的唯一实现类是 android.policy.PhoneWindow. 这个类是在 FrameWork 层里面，具体路径为：
**frameworks/policies/base/phone/com/android/internal/policy/impl/PhoneWindow.java **，[在线查看](https://android.googlesource.com/platform/frameworks/policies/base/+/donut-release/phone/com/android/internal/policy/impl/PhoneWindow.java)
来看一下它是如何分发事件的：
```java
    @Override
    public boolean superDispatchTouchEvent(MotionEvent event) {
        return mDecor.superDispatchTouchEvent(event);
    }


    @Override
    public final View getDecorView() {
        if (mDecor == null) {
            installDecor();
        }
        return mDecor;
    }

    private void installDecor() {
        if (mDecor == null) {
            mDecor = generateDecor();
            mDecor.setIsRootNamespace(true);
        }
        if (mContentParent == null) {
            mContentParent = generateLayout(mDecor);
            mTitleView = (TextView)findViewById(com.android.internal.R.id.title);
            if (mTitleView != null) {
                if ((getLocalFeatures() & (1 << FEATURE_NO_TITLE)) != 0) {
                    View titleContainer = findViewById(com.android.internal.R.id.title_container);
                    if (titleContainer != null) {
                        titleContainer.setVisibility(View.GONE);
                    } else {
                        mTitleView.setVisibility(View.GONE);
                    }
                    if (mContentParent instanceof FrameLayout) {
                        ((FrameLayout)mContentParent).setForeground(null);
                    }
                } else {
                    mTitleView.setText(mTitle);
                }
            }
        }
    }
    
    protected DecorView generateDecor() {
        return new DecorView(getContext(), -1);
    }

    private final class DecorView extends FrameLayout {

        public boolean superDispatchTouchEvent(MotionEvent event) {
            return super.dispatchTouchEvent(event);
        }
    }

```
这里有一个 mDecor，它是一个 DecorView，是 PhoneWindow 的一个内部类，我们在 Activity 里面 使用 getWindow().getDecorView() 获取到的 view 就是这个 DecorView，可以看到，Window 在获取到这个 decorView 时，把 TitleView 单拎出来出来封装好了，我们使用的 setContentView(View v)，就是把自己的布局 塞到 这个 decorView 当中。
好，现在事件传递到了 DecorView 当中，DecorView 继承自 FrameLayout，事件 FrameLayout 继承自 ViewGroup，最终调用的是 ViewGroup 的事件分发的方法。下面就分析 ViewGroup 的事件分发方法。

### ViewGroup 对事件的分发

ViewGroup 的 onInterceptTouchEvent() 永远返回 false，意味着对事件永远不拦截，这也是很好理解的，不然 子view 就不会响应事件了 。
```java
    public boolean onInterceptTouchEvent(MotionEvent ev) {
        return false;
    }
```
ViewGroup 的 dispatchTouchEvent() 方法很长，我们一点一点分析。
```java
    if (actionMasked == MotionEvent.ACTION_DOWN) {
        // Throw away all previous state when starting a new touch gesture.
        // The framework may have dropped the up or cancel event for the previous gesture
        // due to an app switch, ANR, or some other state change.
        cancelAndClearTouchTargets(ev);
        resetTouchState();
    }

```
这里进行了初始化 down 事件，在 ACTION_DOWN 事件到来时，会清除以往的 Touch 状态，cancelAndClearTouchTargets() 方法里将 mFirstTouchTarget 设置为 null，resetTouchState() 方法里重置了 touch 状态标识。接着往下看。

```java
    // Check for interception.
    final boolean intercepted;
    if (actionMasked == MotionEvent.ACTION_DOWN
            || mFirstTouchTarget != null) {
        final boolean disallowIntercept = (mGroupFlags & FLAG_DISALLOW_INTERCEPT) != 0;
        if (!disallowIntercept) {
            intercepted = onInterceptTouchEvent(ev);
            ev.setAction(action); // restore action in case it was changed
        } else {
            intercepted = false;
        }
    } else {
        // There are no touch targets and this action is not an initial down
        // so this view group continues to intercept touches.
        intercepted = true;
    }
```

intercepted 这个变量判断是否拦截，当事件是 ACTION_DOWN 或者 mFirstTouchTarget != null 时，ViewGroup 正常情况下是不拦截的，（ mFirstTouchTarget != null 从后面的逻辑可以知道，它是表示 ViewGroup 没有拦截 Touch 事件并且 将事件交给了 子View 消费了 ）。 

但是这里有一个情况，就是 FLAG_DISALLOW_INTERCEPT 这个标记位，如果 ViewGroup 的子类 调用 getParent().requestDisallowInterceptTouchEvent(boolean disallowIntercept)， 那么就可以改变这个标记位的值，具体有两种情况：
如果参数 disallowIntercept 值为 true，表示禁止 ViewGroup 拦截，那么 intercepted = false; 
如果参数 disallowIntercept 值为 false，那么 intercepted = onInterceptTouchEvent(ev)，就可以根据 onInterceptTouchEvent() 的返回值来设置是否 禁止 ViewGroup 对事件的拦截，默认是 false，我们可以修改这个值来拦截事件。

有一点注意：getParent().requestDisallowInterceptTouchEvent() 方法不会影响 ViewGroup 对 ACTION_DOWN 事件的处理，只能拦截 ACTION_MOVE 和 ACTION_UP 事件，前面已经提过，ViewGroup 事件分发一开始就在 ACTION_DOWN 时重置了 Touch 状态标识，即 FLAG_DISALLOW_INTERCEPT。


如果事件不是 ACTION_DOWN 并且 mFirstTouchTarget == null，那么直接将 intercepted == true，表示 ViewGroup 拦截 Touch 事件，直白地说：如果 ACTION_DOWN 没有被 子View 消费， 那么当 ACTION_MOVE 和 ACTION_UP 到来时 ViewGroup 不再去调用 onInterceptTouchEvent() 判断是否需要拦截而是直接的将 intercepted == true 表示由其自身处理 Touch 事件。

这部分 FLAG_DISALLOW_INTERCEPT 这个标识位可以对一些 滑动冲突 的问题 提供了一个解决思路。

接着看 ViewGroup 不拦截事件的时候，分发事件给 子view 的过程。
```java
    final View[] children = mChildren;

    final boolean customOrder = isChildrenDrawingOrderEnabled();
    for (int i = childrenCount - 1; i >= 0; i--) {
        final int childIndex = customOrder ?
                getChildDrawingOrder(childrenCount, i) : i;
        final View child = children[childIndex];
        if (!canViewReceivePointerEvents(child)
                || !isTransformedTouchPointInView(x, y, child, null)) {
            continue;
        }

        newTouchTarget = getTouchTarget(child);
        if (newTouchTarget != null) {
            // Child is already receiving touch within its bounds.
            // Give it the new pointer in addition to the ones it is handling.
            newTouchTarget.pointerIdBits |= idBitsToAssign;
            break;
        }

        resetCancelNextUpFlag(child);
        if (dispatchTransformedTouchEvent(ev, false, child, idBitsToAssign)) {
            // Child wants to receive touch within its bounds.
            mLastTouchDownTime = ev.getDownTime();
            mLastTouchDownIndex = childIndex;
            mLastTouchDownX = ev.getX();
            mLastTouchDownY = ev.getY();
            newTouchTarget = addTouchTarget(child, idBitsToAssign);
            alreadyDispatchedToNewTouchTarget = true;
            break;
        }
    }

```
这里首先遍历 ViewGroup 的所有 子view，判断 子view 是否能够接受到点击事件（主要看两点：1. 子view 是否在播放动画 2.点击事件的坐标是否在 子view 的区域内），如果满足其中一个，那么事件就会传递给这个 子view 来处理，上面的 dispatchTransformedTouchEvent(ev, false, child, idBitsToAssign) 方法
实际上就是调用的 子view 的 dispatchTouchEvent() 方法，可以看下该方法内部的一段代码：
```java
    if (child == null) {
        handled = super.dispatchTouchEvent(event);
    } else {
        handled = child.dispatchTouchEvent(event);
    }
```
因为上面 child 传递的不是 null，所以会直接调用 子view 的 dispatchTouchEvent() 方法，这样事件就交给 子view 处理了，从而完成了一轮事件分发。

如果 子view 的 dispatchTouchEvent() 返回 false，ViewGroup 就会继续遍历，将事件发给下一个 子 view。
如果 子view 的 dispatchTouchEvent() 返回 true，这里就会跳出循环，终止遍历，跳出之前，还做了一些事情，来看一下：
```java
    newTouchTarget = addTouchTarget(child, idBitsToAssign);
    alreadyDispatchedToNewTouchTarget = true;

    private TouchTarget addTouchTarget(View child, int pointerIdBits) {
        TouchTarget target = TouchTarget.obtain(child, pointerIdBits);
        target.next = mFirstTouchTarget;
        mFirstTouchTarget = target;
        return target;
    }

```
这里，将 mFirstTouchTarget 进行了赋值，它是一种单链表结构，随后 alreadyDispatchedToNewTouchTarget 置为 true，表示已经将 Touch 事件分发到了 子View，并且 子View 消费掉了 Touch 事件，前面已经有分析，mFirstTouchTarget 是否为空，直接影响到 ViewGroup 对事件拦截的策略。

好，如果遍历所有的 子view 后 mFirstTouchTarget 仍然为 null，这里就包含两种情况：第一种 ViewGroup 没有 子View；第二种是 子View 虽然处理了点击事件，但是在 dispatchTouchEvent() 方法中 返回了 false (一般是因为 子View 在 onTouchEvent 里面返回来 false)。这两种情况，看 ViewGroup 是如何处理的：
```java
    // Dispatch to touch targets.
    if (mFirstTouchTarget == null) {
        // No touch targets so treat this as an ordinary view.
        handled = dispatchTransformedTouchEvent(ev, canceled, null,
                TouchTarget.ALL_POINTER_IDS);
    } 

```
这里 第三个参数 child 传的是 null，所以会调用 super.dispatchTouchEvent(event) 方法，这里就转到了 View 的 dispatchTouchEvent() 方法中去了，下面接着看 View 的事件传递过程。

### View 对 事件的处理过程
```java
    public boolean dispatchTouchEvent(MotionEvent event) {
        if (mInputEventConsistencyVerifier != null) {
            mInputEventConsistencyVerifier.onTouchEvent(event, 0);
        }

        if (onFilterTouchEventForSecurity(event)) {
            //noinspection SimplifiableIfStatement
            ListenerInfo li = mListenerInfo;
            if (li != null && li.mOnTouchListener != null && (mViewFlags & ENABLED_MASK) == ENABLED
                    && li.mOnTouchListener.onTouch(this, event)) {
                return true;
            }

            if (onTouchEvent(event)) {
                return true;
            }
        }

        if (mInputEventConsistencyVerifier != null) {
            mInputEventConsistencyVerifier.onUnhandledEvent(event, 0);
        }
        return false;
    }

```
View 的 dispatchTouchEvent() 方法比较简单，它不能 向下继续分发事件， 也没有拦截事件的方法，所以只能自己处理事件。这里 首先判断 有没有设置 mOnTouchListener，如果有，在判断 mOnTouchListener.onTouch() 方法有没有返回 true，如果我们在外面设置了 onTouch() 方法 返回了 true，那么 事件就此消费，不会再执行 onTouchEvent() 方法。如果没有，我们接着看 onTouchEvent() 方法。
```java
    if ((viewFlags & ENABLED_MASK) == DISABLED) {
        if (event.getAction() == MotionEvent.ACTION_UP && (mPrivateFlags & PFLAG_PRESSED) != 0) {
            setPressed(false);
        }
        // A disabled view that is clickable still consumes the touch
        // events, it just doesn't respond to them.
        return (((viewFlags & CLICKABLE) == CLICKABLE ||
                (viewFlags & LONG_CLICKABLE) == LONG_CLICKABLE));
    }

```
这里判断了 View 处于不可用状态下的处理过程，不可用状态下，仍然可以消耗点击事件，只要 View 是 clickable 或者 longClickable 的。
在看这一段代码：
```java
    if (((viewFlags & CLICKABLE) == CLICKABLE ||
                (viewFlags & LONG_CLICKABLE) == LONG_CLICKABLE)) {
            switch (event.getAction()) {
                case MotionEvent.ACTION_UP:
                    boolean prepressed = (mPrivateFlags & PFLAG_PREPRESSED) != 0;
                    if ((mPrivateFlags & PFLAG_PRESSED) != 0 || prepressed) {
                        //...
                        if (!mHasPerformedLongPress) {
                            // This is a tap, so remove the longpress check
                            removeLongPressCallback();

                            // Only perform take click actions if we were in the pressed state
                            if (!focusTaken) {
                                // Use a Runnable and post this rather than calling
                                // performClick directly. This lets other visual state
                                // of the view update before click actions start.
                                if (mPerformClick == null) {
                                    mPerformClick = new PerformClick();
                                }
                                if (!post(mPerformClick)) {
                                    performClick();
                                }
                            }
                        }
                        //...
                    }
                    break;
            }
            return true;
        }

        return false;
    }

```
View 是 clickable 或者 longClickable 的状态下，会触发 performClick() 方法，该方法如下：
```java
    public boolean performClick() {
        sendAccessibilityEvent(AccessibilityEvent.TYPE_VIEW_CLICKED);

        ListenerInfo li = mListenerInfo;
        if (li != null && li.mOnClickListener != null) {
            playSoundEffect(SoundEffectConstants.CLICK);
            li.mOnClickListener.onClick(this);
            return true;
        }

        return false;
    }
```
这里如果 mOnClickListener 不为 null，会调用它的 onClick 方法。View 的 LONG_CLICKABLE 属性默认为 false，CLICKABLE 属性和 View 有关，可点击的 View 比如 Button，其 CLICKABLE 属性为 true，不可点击的 View 比如 TextView，其属性为 false。通过 setOnClickListener 会自动将 View 的 CLICKABLE 设为 true，setOnLongClickListerner 会自动将 View 的 LONG_CLICKABLE 设为 true。
```java
    public void setOnClickListener(OnClickListener l) {
        if (!isClickable()) {
            setClickable(true);
        }
        getListenerInfo().mOnClickListener = l;
    }

    public void setOnLongClickListener(OnLongClickListener l) {
        if (!isLongClickable()) {
            setLongClickable(true);
        }
        getListenerInfo().mOnLongClickListener = l;
    }

```
到这里，事件分发的源码重要的部分都已经分析完了，下面在总结一些规律性的东西帮助记忆。

### 总结
- 一个点击事件产生后，它的传递过程如下： Activity -> Window -> View。顶级 View 接收到事件之后，就会按相应规则去分发事件。如果一个 View 的 onTouchEvent 方法返回 false，那么将会交给父容器的 onTouchEvent 方法进行处理，逐级往上，如果所有的 View 都不处理该事件，则交由 Activity 的 onTouchEvent 进行处理。
- ViewGroup 默认不拦截任何事件。
- 子View 可以通过调用 getParent().requestDisallowInterceptTouchEvent(true); 阻止 ViewGroup 对其 MOVE 或者 UP 事件进行拦截
- 如果某一个 View 开始处理事件，如果他不消耗 ACTION_DOWN 事件（也就是 onTouchEvent 返回 false），则同一事件序列比如接下来进行 ACTION_MOVE，ACTION_UP 都不会再交给该 View 处理，而是将事件交由它的父容器 onTouchEvent 方法 去处理。
- 如果某一个 View 开始处理事件，如果他不消耗 除 ACTION_DOWN 以外的事件，那么这个事件会消失，此时 父容器的 onTouchEvent 并不会调用，并且当前 view 可以持续收到后续的事件，最终这些消失的事件会传递给 Activity 处理。
- TextView、ImageView 这些不作为容器的 View，一旦接受到事件，就调用 onTouchEvent 方法，它们本身没有 onInterceptTouchEvent 方法。正常情况下，它们都会消耗事件（返回 true），除非它们是不可点击的（clickable 和 longClickable 都为 false）。　
- View 的 enable 属性不影响 onTouchEvent 的返回值。哪怕一个 view 是 disable 的，只要 clickable 和 longClickable 有一个为 true，onTouchEvent 就返回 true。
- 点击事件分发过程如下 dispatchTouchEvent —> OnTouchListener 的 onTouch 方法 —> onTouchEvent -> OnClickListener 的 onClick 方法。也就是说，我们平时调用的 setOnClickListener，优先级是最低的，所以，onTouchEvent 或 OnTouchListener 的 onTouch 方法如果返回 true，则不响应 onClick 方法。

## View 的滑动冲突
View 滑动冲突的解决有固定的套路，常见的冲突可以简单归为三种：1. 外部和内部滑动方向不一致 2. 外部和内部滑动方向一致 3. 前两种的嵌套。 基于对上面 View 的事件分发体系的理解， View 的滑动冲突就相对简单了。处理滑动冲突的思路主要有两种：外部拦截 和 内部拦截。

### 外部拦截
判断滑动的特征，如果水平滑动距离 > 竖直滑动距离，则为水平滑动，反之为竖直滑动。假设外部 View 可以水平滑动，内部 View 可以竖直滑动，那么在外部 View 的 onInterceptTouchEvent 方法判断，如果触摸事件为竖直滑动，则应该放行，也就是返回 false，然后交给内部 View 来处理，使内部 子View 就可以实现竖直滑动；如果触摸事件为水平滑动，外部 view 则应该拦截，交由自己处理。

外部拦截的伪代码：
```java
@Override  
public boolean onInterceptTouchEvent(MotionEvent event) { // 外部View拦截事件  
    boolean intercepted = false;  
    int x = (int) event.getX();  
    int y = (int) event.getY();  
  
    switch (event.getAction()) {  
    case MotionEvent.ACTION_DOWN: {  
        intercepted = false;  
        break;  
    }  
    case MotionEvent.ACTION_MOVE: {  
        int deltaX = x - mLastXIntercept;  
        int deltaY = y - mLastYIntercept;  
        if (Math.abs(deltaX) > Math.abs(deltaY)) {  
            intercepted = true;  
        } else {  
            intercepted = false;  
        }  
        break;  
    }  
    case MotionEvent.ACTION_UP: {  
        intercepted = false;  
        break;  
    }  
    default:  
        break;  
    }  
    mLastXIntercept = x; // 分别记录上次滑动坐标  
    mLastYIntercept = y;  
  
    return intercepted; // 看是否需要传递给内部View处理  
}
```

### 内部拦截
外部 View 不拦截，交给内部 View 处理，如果内部 View 有需要就自己消耗掉，否则交给上一层，这样违反了事件分发机制，所以需配合 requestDisallowInterceptTouchEvent 方法进行处理。

内部拦截的伪代码：
```java
@Override
    public boolean dispatchTouchEvent(MotionEvent event) {
        int x = (int) event.getX();
        int y = (int) event.getY();

        switch (event.getAction()) {
        case MotionEvent.ACTION_DOWN: {
            parent.requestDisallowInterceptTouchEvent(true);
            break;
        }
        case MotionEvent.ACTION_MOVE: {
            int deltaX = x - mLastX;
            int deltaY = y - mLastY;
            if (父容器需要此类点击事件) {
                parent.requestDisallowInterceptTouchEvent(false);
            }
            break;
        }
        case MotionEvent.ACTION_UP: {
            break;
        }
        default:
            break;
        }

        mLastX = x;
        mLastY = y;
        return super.dispatchTouchEvent(event);
    }
```


## 非常棒的文章
[Android事件分发机制完全解析，带你从源码的角度彻底理解(上)](http://blog.csdn.net/guolin_blog/article/details/9097463/)
[事件分发机制源码分析](https://github.com/HotBitmapGG/AndroidInterview/blob/master/android/Android%20View%E4%BA%8B%E4%BB%B6%E5%88%86%E5%8F%91%E6%9C%BA%E5%88%B6%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90.md)

[Android实践之ScrollView中滑动冲突处理](http://blog.csdn.net/xiaohanluo/article/details/52130923)
[android-----滑动冲突解决案例](http://lib.csdn.net/article/android/31319)
[滑动冲突解决-更合理的拦截](https://niorgai.github.io/2015/10/15/%E6%BB%91%E5%8A%A8%E5%86%B2%E7%AA%81%E8%A7%A3%E5%86%B3-%E6%9B%B4%E5%90%88%E7%90%86%E7%9A%84%E6%8B%A6%E6%88%AA/)


<br /><br /><br />

<center>
<a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/"><img alt="知识共享许可协议" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-nd/3.0/cn/88x31.png" /></a><br />
本作品采用 <a rel="license" href="http://creativecommons.org/licenses/by-nc-nd/3.0/cn/">知识共享署名-非商业性使用-禁止演绎 3.0 中国大陆许可协议</a> 进行许可。
</center>
