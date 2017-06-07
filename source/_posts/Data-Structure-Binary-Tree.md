---
title: 二叉树的创建以及它的遍历过程
categories: Data Structure
toc: true
comments: true
copyright: true
date: 2017-05-23 21:16:58
tags:
---

相比数组和链表，二叉树是一种比较独特的数据结构，对于二叉树的一些概念和规律的内容，这里就不多描述和证明了，本篇主要来看下二叉树的构造过程以及几种遍历过程。

<!--more-->

## 认识二叉树的遍历

对于二叉树的先序、中序、后序遍历，还记得各从哪个节点开始的吗，这里有一个简单得方法，二叉树是由根节点N，左孩子节点L，右孩子节点R组成，那么这三个节点一共有 6 种排序方式，而实际上只有 3 种，另外 3 种只是顺序倒过来而已。这三种排序方式是： NLR、LNR、LRN，分别对应 先根、中根、后根遍历，先根即 N 在最前，中跟即 N 在中间，后根即 N 在最后。来看一张图：

![二叉树的遍历顺序](/images/Structure/binary_tree.png)



## 创建二叉树

现在假设要将上图中二叉树创建出来，思考一下，该如何操作？

1. 定义树节点对象的属性和方法
2. 创建每个节点对象
3. 建立节点之间的关系

好，按照步骤来，首先二叉树的节点会有哪些属性呢？角标、数据、左孩子、右孩子，我们先将节点定义出来：

```java
public class TreeNode<T> {

    private int index;
    private T data;
    private TreeNode<T> leftChild;
    private TreeNode<T> rightChild;

    public TreeNode(int index, T data) {
        this.index = index;
        this.data = data;
        this.leftChild = null;
        this.rightChild = null;
    }

    //getter and setter
}
```

有了节点的定义，我们就可以将上图中的节点创建出来了：

```java
TreeNode<String> root = new TreeNode(1,"A");

TreeNode<String> nodeB = new TreeNode(1,"B");
TreeNode<String> nodeC = new TreeNode(2,"C");
TreeNode<String> nodeD = new TreeNode(3,"D");
TreeNode<String> nodeE = new TreeNode(4,"E");
TreeNode<String> nodeF = new TreeNode(5,"F");
TreeNode<String> nodeG = new TreeNode(6,"G");
```

再建立节点之间的关系，将二叉树创建出来：

```java
public class BinaryTree{
  //二叉树的构建首先需要跟节点，一般在构造方法里面创建
    public TreeNode<String> root = null;

    public BinaryTree() {
        root = new TreeNode<>(1, "A");
    }

    public void createBinaryTree() {
        TreeNode<String> nodeB = new TreeNode<>(1, "B");
        TreeNode<String> nodeC = new TreeNode<>(1, "C");
        TreeNode<String> nodeD = new TreeNode<>(1, "D");
        TreeNode<String> nodeE = new TreeNode<>(1, "E");
        TreeNode<String> nodeF = new TreeNode<>(1, "F");
        TreeNode<String> nodeG = new TreeNode<>(1, "G");
        root.leftChild = nodeB;
        root.rightChild = nodeC;
        nodeB.leftChild = nodeD;
        nodeB.rightChild = nodeE;
        nodeC.leftChild = nodeF;
        nodeC.rightChild = nodeG;
    }
}
```

## 获取二叉树的高度和大小

根据二叉树的特点，可以发现，一个节点有一个左孩子或者右孩子，高度就 + 1，所以二叉树的高度就是取左孩子与右孩子的最大值，然后加根节点的 1 。获取大小就是获取二叉树所有左孩子与右孩子的节点之和了，最后也要加根节点的 1。

```java
    public int getHeight() {
        return getHeight(root);
    }

    public int getHeight(TreeNode<String> node) {
        if (node == null) {
            return 0;
        }
        int leftHeight = getHeight(node.leftChild);
        int rightHeight = getHeight(node.rightChild);
        return leftHeight > rightHeight ? (leftHeight + 1) : (rightHeight + 1);
    }

```

```java
    public int getSize() {
        return getSize(root);
    }

    public int getSize(TreeNode<String> node) {
        if (node == null) {
            return 0;
        }
        int leftSize = getSize(node.leftChild);
        int rightSize = getSize(node.rightChild);
        return leftSize + rightSize + 1;
    }

```

可以写个测试看下结果对不对：

```java
	public static void main(String[] args){
		BinaryTree binaryTree = new BinaryTree();
		binaryTree.createBinaryTree();
		int height = binaryTree.getHeight();
		System.out.println("treeHeihgt: "+height);
		int size = binaryTree.getSize();
		System.out.println("treeSize: "+size);
	}
```

```java
treeHeihgt: 3
treeSize: 7
```

## 二叉树的遍历

本质上还是递归，只是跟的位置不同而已。

先序遍历上图二叉树，将数据打印：

```
    public void beforeOrder(TreeNode<String> node) {
        if (node == null) {
            return;
        }
        System.out.print(node.getData() + " ");
        beforeOrder(node.leftChild);
        beforeOrder(node.rightChild);
    }
```

中序遍历，将数据打印：

```java
    public void midOrder(TreeNode<String> node) {
        if (node == null) {
            return;
        }
        midOrder(node.leftChild);
        System.out.print(node.getData() + " ");
        midOrder(node.rightChild);
    }
```

后序遍历，将数据打印：

```java
    public void afterOrder(TreeNode<String> node) {
        if (node == null) {
            return;
        }
        afterOrder(node.leftChild);
        afterOrder(node.rightChild);
        System.out.print(node.getData() + " ");
    }
```

打印结果分别是：

```java
A B D E C F G 
D B E A F C G 
D E B F G C A 
```

与上图的结果一致。







