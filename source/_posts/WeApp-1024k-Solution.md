---
title: 小程序渲染数据超过 1024k 的解决办法
categories: Web 前端
toc: false
comments: true
copyright: true
date: 2017-09-02 13:36:00
tags:
---

这次分享小程序开发过程中隐藏了很久的一个坑，相信很多开发者应该都做过列表的滚动加载，列表的数据放在一个数组对象中，加载完成之后通过 setData 来将数组数据渲染到页面上，加载下一页时，将下一页的数组数据拼接到原来的数组中，再次渲染一次，就有两页的数据了。大多数时候这样做看不出有什么问题。

<!--more-->

但是官方文档上还有这样一句话。

> **[单次设置的数据不能超过1024kB，请尽量避免一次设置过多的数据。](https://mp.weixin.qq.com/debug/wxadoc/dev/framework/app-service/page.html)**

这就意味着，如果做一个像新闻/论坛那样的感觉能无限向下滚动加载的列表，必然会在某一页使得数组的数据超过 1024k，事实上，我司做的小程序汽车问答项目，列表中每一个 item 的数据都很多，大概在 25 页的时候，就已经超过了 1024k，从而无法在渲染后面更多的数据了。

当发现这个问题得时候，回头看我司其它的小程序底层滚动加载的框架中，都还是采用数组拼接的方式，不禁生出一身冷汗，虽然大多数时候列表 item 没有那么多数据，用户也不是都会一直下拉到几十页，但确确实实这是一个要解决的问题。下面就给出一个解决办法。

**既然是分批加载的，那么就分批渲染。** 每个列表下来一般都是 10  条数据，那么我们每次就仅仅渲染这 10 条数据，数组还是原来的数组，但是这次不是统一渲染了，小程序是支持通过**改变数组角标**对应的值来**改变数据**的，那么我们需要定义一个全局变量 (originLen = 0) 来记录数组的长度，当加载一组数据下来时，就开始遍历，给数组的每个角标设置对应的 item  ( arr[originLen] = item)，然后塞到一个对象当中， 并且角标的值加上1，遍历完成时，再一次性渲染这个对象的 10 条数据。

改方法已经封装成一个组件，上传至我司公共私有仓库，一是确实很实用，二是可以减少页面的代码，只需关注业务逻辑就行。下面直接贴出该组件代码（其实代码量很少）。

```javascript
/**
 * @module SafeRenderUtil
 */

/**
 * 安全渲染的工具类
 * 解决的问题：分页加载时，数组拼接起来在渲染，当数据超过 1M 后，无法再加载
 * @example
 * import SafeRenderUtil from '@xxx/lib/safeRenderUtil';
 * // 初始化
 * this.SafeRenderUtil = new SafeRenderUtil({
 *   arrName: 'arrName',
 *   formatItem: (item) => {
 *     //裁剪每一项的图片...
 *     return item;
 *   },
 *   setData: this.setData.bind(this)
 * });
 * // 将数组传递进来进行渲染
 * this.SafeRenderUtil.addList(res.data.data);
 */
class SafeRenderUtil {
  /**
   * @param {String} opts.arrName 数组名称
   * @param {Function} opts.formatItem 处理数组的每一个 item ，并将该 item 返回
   * @param {Function} opts.setData 调用页面的渲染方法
   */
  constructor(opts) {
    this.arrName = opts.arrName;
    this.formatItem = opts.formatItem;
    this.setData = opts.setData;
    this.originLen = 0; //原始数组长度
  }
  /**
   * @param {Array} arr 需要渲染的数组
   */
  addList(arr) {
    if (arr && arr.length) {
      let newList = {};
      for (let i = 0; i < arr.length; i++) {
        let item = arr[i];
        if (typeof(this.formatItem) === 'function') {
          item = this.formatItem(item);
        }
        newList[`${this.arrName}[${this.originLen}]`] = item;
        this.originLen += 1;
      };
      this.setData(newList);
    }
  }
  /**
   * 清空数组数据
   */
  clearArr() {
    this.setData({
      [`${this.arrName}`]: []
    });
    this.originLen = 0;
  }
}
module.exports = SafeRenderUtil

```

前面写了那么多，自己也感觉描述的不太清楚，还是代码最简洁明了，希望对大家能有帮助。