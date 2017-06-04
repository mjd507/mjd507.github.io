---
title: 关于查找二叉树的创建
categories: Data Structure
toc: true
comments: true
copyright: true
date: 2017-06-03 14:40:29
tags:
---



<!--more-->



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

    public TreeNode root;

    public TreeNode put(int data) {
        TreeNode<Integer> node;
        TreeNode<Integer> parent = null;
        if (root == null) {
            root = new TreeNode<>(data);
            return root;
        }
        node = root;
        while (node != null) {
            parent = node;
            if (node.getData() > data) {
                node = node.leftChild;
            } else if (node.getData() < data) {
                node = node.rightChild;
            } else {
                return new TreeNode<>(data);
            }
        }
        node = new TreeNode<>(data);
        // find null data node, put target node here
        if (parent.getData() > data) { //put left
            parent.leftChild = node;
        } else {                    //put right
            parent.rightChild = node;
        }
        node.parent = parent;
        return node;

    }

    private class TreeNode<T> {

        private T data;
        private TreeNode<T> leftChild;
        private TreeNode<T> rightChild;
        private TreeNode<T> parent;

        TreeNode(T data) {

            this.data = data;
            this.parent = null;
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


}

```

