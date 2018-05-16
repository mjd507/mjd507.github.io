---
title: 关于前端图片处理的一些分享
categories: Web 前端
toc: false
comments: true
copyright: true
date: 2017-09-10 00:29:28
tags:
---

不同于客户端，Web 前端的绝大部分图片资源都是直接从网络上加载，这就对网络的要求比较高，如果图片很大，而且页面图片很多的情况，比如活动页，就会出现显示很慢的状况，本文就分享对前端图片处理的一些方法。

<!--more-->

题外话，因为每一张图片都是一个网络请求，所以，如果要使页面加载速度提高的话，尽量减少不必要的网络请求，请求需要时间，创建请求同样也需要时间。



关于图片的动态裁剪，这里我司采用的是七牛的图片裁剪功能，看下例子。

```javascript
“https://img1.util.org/xxx.jpg@100w_100h_90q.webp”，
代表需要一张宽（w）100px、高（h）100px、相对质量（q）90% webp 格式的图片。

w、h、q三个参数都是可以选传的，比如只限宽，高度等比缩放，就只要传100w 不写 h 就好了。

转换后缀支持格式是: jpg， jpeg， webp， png， bmp 和 src（表示和文件原格式一致）
```

一些须知

- 尽量使用 99q 或者更小的 q 值，很多时候 99q 的文件尺寸是 100q 的80%以下，但是实际效果几乎一模一样。
- 在支持 webp 格式的环境中，尽量使用 webp 格式，会比 jpg 小 10% 以上。
- h，w，q参数都只支持整数，请勿使用小数。（如果是小数，则会被自动忽略， 不生效。）
- 如果有根据屏幕大小自动裁剪图片大小的需求，注意控制像素精度，因为w134和w135是两张不同的图片，会导致从浏览器到 CDN 全链路上都需要去访问一张新的图片，哪怕他们几乎一模一样。



上面都是根据七牛提供的功能以及文档总结出来的一些共识，接下来说说前端具体的裁剪方法。



获取图片链接上配置的宽高（如果有得话），这样如果指定了图片的宽度，就可以等比例缩放原始图片。

```javascript
//根据指定宽度，获取裁剪后的高度
getHeight(src, width) {
  let match = src.match(/(\d+)w_(\d+)h/);

  if (!match) {
    return 0;
  }

  return Math.ceil(width * (match[2] / match[1]) / 10) * 10;
}
```

由于七牛支持只有高度，图片的宽度也可以等比例缩放，那么我们其实已经实现了图片的裁剪，直接在原始链接后面加上「@xxxh.src」就好了。如果想体验更好一点，那么可以判断用户的手机密度以及网络状态。默认高度以 1.5 倍处理，如果手机密度大于 2，高度按 2 倍处理，如果不是 WiFi 或 4G ，高度按 1 倍处理，这样就完成图片裁剪后的链接地址，代码如下：

```javascript
getImgSrc(src, width) {
  const type = src.match(/\.([^.]+)$/)[1];

  let ratio = 1.5;
  if (wx.systemInfo.pixelRatio > 2) {
    ratio = 2;
  }

  if (['wifi', '4g'].indexOf(wx.util.getNetWork()) < 0) {
    ratio = 1;
  }

  const height = this.getHeight(src, width);

  if (height) {
    src = src.replace(/@.+/, '');

    if (type === 'gif') {
      src += `?@${(Math.ceil(height * ratio) / 10) * 10}h_99q.src`;
    } else {
      src += `@${(Math.ceil(height * ratio) / 10) * 10}h_99q.${type}`;
    }
  }
  
  return {
    src: height ? src.replace(/\.(?:webp|png)$/, '.jpg') : src,
    height
  };
}

```



这样，在项目里所有需要用到图片裁剪的地方，只需要调用上面的方法，就 ok 了。

