---
title: 二叉查找树节添加删除节点的细节
categories: Big-Back-End
toc: true
comments: true
copyright: true
date: 2017-06-03 14:40:29
tags:
---

二叉查找树，也叫二叉搜索树，优势就在于查找，跟二分查找一样，时间复杂度为 O(logn)，如何做到的呢？就在于构造二叉树的时候，有这样一个规定，即左边的节点必须小于根节点，右边的节点必须大于跟节点，下面就来实现将任意无序的节点构造成一个二叉查找树的过程。

<!--more-->

## 定义节点

在二叉树系列的第一篇文章里，其实已经定义了二叉树的节点，包括节点数据，左孩子，右孩子，但是在这里打算多添加一个父节点，让父子节点之间双向引用，使查找更灵活。

```java
    public class TreeNode<T> {

        private T data;
        private TreeNode<T> leftChild;
        private TreeNode<T> rightChild;
        private TreeNode<T> parent;

        TreeNode(T data) {
            this.data = data;
            this.parent = null;//默认节点没有父亲
            this.leftChild = null;
            this.rightChild = null;
        }

        public T getData() {
            return data;
        }

        public void setData(T data) {
            this.data = data;
        }

    }


```



## 添加节点

添加节点的过程，就是构造查找二叉树的过程，本质上，就是定义一个 put 方法，在方法里面，实现元素的摆放位置。

先整理一下步骤：

1. 创建跟节点
2. 从根节点开始遍历
   - 如果根节点为空，跳出，执行步骤 3
   - 令 P = N 记录跟节点，如果插入的节点 A < 根节点 N，令 N = N.leftChild，重复步骤 2
   - 令 P = N 记录跟节点，如果插入的节点 A > 根节点 N，令 N = N.rightChild，重复步骤 2
   - 如果插入的值 A = 根节点的值 N，return 该节点
3. 判断 P 节点的值与插入的节点 A 的值的大小
   - 如果 P  >  A，则 P.leftChild = A;
   - 如果 P  <  A，则 P.rightChild = A;

```java
    public TreeNode root;

    public TreeNode put(int data) {
        TreeNode<Integer> node;
        TreeNode<Integer> parent = null;
      	//步骤一 创建根节点
        if (root == null) {
            root = new TreeNode<>(data);
            return root;
        }
      	//步骤二 从根节点开始遍历
        node = root;
        while (node != null) {
            parent = node; //记录当前根节点
            if (node.getData() > data) {
                node = node.leftChild;
            } else if (node.getData() < data) {
                node = node.rightChild;
            } else {
                return new TreeNode<>(data);
            }
        }
        node = new TreeNode<>(data);
        //步骤三 判断插入节点的值与它父亲节点的大小
        if (parent.getData() > data) { 
            parent.leftChild = node;
        } else {                   
            parent.rightChild = node;
        }
        node.parent = parent;
        return node;

    }


```

## 测试添加方法

因为二叉查找树的特性就是 左孩子 < 根节点 < 右孩子，这与二叉树的中序排序一模一样，所以这里就将无序的值，构造成二叉查找树，然后中序遍历该二叉查找树的值，看是否从小到大排列。

```java

public class SearchBinaryTree {
    public static void main(String[] args) {
        SearchBinaryTree searchBinaryTree = new SearchBinaryTree();
        int[] arr = {43, 15, 30, 45, 50, 65};
        for (int a : arr) {
            searchBinaryTree.put(a);
        }
        searchBinaryTree.midOrder(searchBinaryTree.root);
    }

    public void midOrder(TreeNode node) {
        if (node == null) {
            return;
        }
        midOrder(node.leftChild);
        System.out.print(node.getData() + " ");
        midOrder(node.rightChild);
    }

}
```

看下打印结果：

```java
15 30 43 45 50 65
```

现在，二叉查找树添加元素的的过程就算完成了。



## 删除节点

1. 查找到要删除的节点 node
2. 取出 node 的父节点与左右孩子节点 (可能没有)
3. 根据要删除节点所处的位置不同情况，重新定义节点间的引用

```java
    /**
     * 查找元素所在的节点
     */
    public TreeNode<Integer> searchNode(int data) {
        if (root == null) return null;
        TreeNode<Integer> node = root;
        while (node != null) {
            if (node.getData() > data) {
                node = node.leftChild;
            } else if (node.getData() < data) {
                node = node.rightChild;
            } else {
                return node;
            }
        }
        return null;
    }

```

```java

    /**
     * 删除节点(根据元素值)
     */
    public void remove(int data) {
        TreeNode<Integer> node = searchNode(data);
        if (node == null) {
            throw new RuntimeException("the data is not the in the binaryTree,remove failed");
        }
        TreeNode<Integer> leftNode = node.leftChild;
        TreeNode<Integer> rightNode = node.rightChild;
        TreeNode<Integer> parentNode = node.parent;
        if (parentNode != null) {
            removeUnRootNode(node, leftNode, rightNode, parentNode);
        } else { //没有父亲
            removeRootNode(node, leftNode, rightNode);
        }
    }

```

```java
    /**
     * 删除根节点
     * @param node 根节点
     * @param leftNode 左孩子
     * @param rightNode 右孩子
     */
    private void removeRootNode(TreeNode<Integer> node, TreeNode<Integer> leftNode, TreeNode<Integer> rightNode) {
        if (leftNode == null && rightNode == null) {
            root = null;
        } else if (leftNode == null && rightNode != null) {
            rightNode.parent = null;
            root = rightNode;
        } else if (leftNode != null && rightNode == null) {
            leftNode.parent = null;
            root = leftNode;
        } else if (leftNode != null && rightNode != null) {
            TreeNode<Integer> bottomNode = rightNode;
            while (bottomNode.leftChild != null) {
                bottomNode = bottomNode.leftChild;
            }
            leftNode.parent = bottomNode;
            bottomNode.leftChild = leftNode;
            root = bottomNode;
        }
        node.leftChild = null;
        node.rightChild = null;
        node = null;
    }

```

```java
    /**
     * 删除非根节点
     * @param node 非根节点
     * @param leftNode 左孩子
     * @param rightNode 右孩子
     */
    private void removeUnRootNode(TreeNode<Integer> node, TreeNode<Integer> leftNode, TreeNode<Integer> rightNode, TreeNode<Integer> parentNode) {
        if (leftNode == null && rightNode == null) { //只有父亲
            node.parent = null;
            if (parentNode.leftChild == node) {
                parentNode.leftChild = null;
            } else {
                parentNode.rightChild = null;
            }
        } else if (leftNode != null && rightNode == null) { //有父亲 和 左孩子
            leftNode.parent = parentNode;
            if (parentNode.leftChild == node) {
                parentNode.leftChild = leftNode;
            } else {
                parentNode.rightChild = leftNode;
            }
        } else if (leftNode == null && rightNode != null) { //有父亲 和 右孩子
            rightNode.parent = parentNode;
            if (parentNode.leftChild == node) {
                parentNode.leftChild = rightNode;
            } else {
                parentNode.rightChild = rightNode;
            }
        } else if (leftNode != null && rightNode != null) { //有父亲 和 左右孩子
            TreeNode<Integer> bottomNode = rightNode;
            while (bottomNode.leftChild != null) {
                bottomNode = bottomNode.leftChild;
            }
            leftNode.parent = bottomNode;
            bottomNode.leftChild = leftNode;
            rightNode.parent = parentNode;
        }
        node.leftChild = null;
        node.rightChild = null;
        node.parent = null;
        node = null;
    }

```

删除元素的代码情况比较多，感觉这里还有优化的空间。

## 测试删除

```java
    public static void main(String[] args) {
        SearchBinaryTree searchBinaryTree = new SearchBinaryTree();
        int[] arr = {43, 15, 30, 45, 50, 65};
        for (int a : arr) {
            searchBinaryTree.put(a);
        }
        searchBinaryTree.midOrder(searchBinaryTree.root);

        searchBinaryTree.remove(50);
        System.out.println();
        searchBinaryTree.midOrder(searchBinaryTree.root);
    }
```

看下打印结果：

```java
15 30 43 45 50 65 
15 30 43 45 65 
```

如果移除根节点 43，打印结果：

```java
15 30 43 45 50 65 
15 30 45 50 65 
```

二叉查找树的删除操作就算完成了。