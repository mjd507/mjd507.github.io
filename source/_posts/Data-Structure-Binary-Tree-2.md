---
title: 通过前序遍历反向创建二叉树
categories: Data Structure
toc: false
comments: true
copyright: true
date: 2017-05-28 12:43:37
tags:
---

上一篇文章介绍了二叉树的一种创建方法，即一个一个创建节点，再建立它们之间的关系，当节点很多时，这样创建显得比较 low，那么当给定二叉树排列顺序的情况下，如何自动创建二叉树呢？

<!--more-->

假设这里给定一个二叉树的前序排序为：ABDC，思考是否能确定二叉树的结构。

我们可以看下面的图：

![一](/images/Structure/binary_tree_sample_1.png) ![二](/images/Structure/binary_tree_sample_2.png)

这两张图的先序排列顺序都是 ABDC，因为没法知道 D 是左孩子还是右孩子，故这里约定，当节点没有左孩子或右孩子的时候，用 # 表示。上图给定的排序分别应是：ABD#C 和 AB#DC。

好，有了约定，下面给定一个先序排序 ABD##E##C#F##，将二叉树创建出来。

我们先将二叉树画出来

![](/images/Structure/binary_tree_sample_3.png)

开始编码：

```java
    /**
     * 根据给定的先序排列创建二叉树
     * 先序排列数据：ABD##E##C#F##
     */
    public TreeNode<String> createBinaryTree(int size, @NonNull ArrayList<String> data) {
        //获取第一个元素
        String s = data.get(0);
        TreeNode<String> node;
        //计算出新的二叉树中，该元素存储的角标
        int index = size - data.size();
        //将该节点创建出来
        node = new TreeNode<>(index, s);
        //如果是 # ，表示没有孩子节点，将 # 移除，返回 null
        if (s.equals("#")) {
            data.remove(0);
            return null;
        }
        //将该元素移除
        data.remove(0);
        //让该节点的左右孩子分别再去重复此操作
        node.leftChild = createBinaryTree(size, data);
        node.rightChild = createBinaryTree(size, data);
        return node;
    }
```

这里也是通过递归来创建二叉树，可见递归在二叉树的创建和遍历中用的非常之多。

测试一下函数的正确性：

```java
    public static void main(String[] args) {
        BinaryTree binaryTree = new BinaryTree();
        String[] arr = {"A", "B", "D", "#", "#", "E", "#", "#", "C", "#", "F", "#", "#"};
        ArrayList<String> list = new ArrayList<>();
        for (String s : arr) {
            list.add(s);
        }
        BinaryTree.TreeNode<String> tree = binaryTree.createBinaryTree(list.size(), list);
        binaryTree.beforeOrder(tree);;
    }
```

这里，首先按给的先序排列创建了二叉树，然后用之前先序遍历二叉树的方法，将二叉树每个节点打印出来，看下打印结果：

```java
A B D E C F 
```

与给定的顺序一致，至此完成了按先序创建二叉树的方法。