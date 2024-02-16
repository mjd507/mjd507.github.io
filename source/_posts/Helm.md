---
title: Helm
categories: Devops
toc: true
comments: true
copyright: true
hidden: false
date: 2024-02-16 10:15:23
tags:
---

[Helm](https://helm.sh/)

[Complete Helm Chart Tutorial: From Beginner to Expert Guide](https://www.youtube.com/watch?v=DQk8HOVlumI&t=629s)

<!--more-->

## Introduction

> Helm is the best way to find, share, and use software built for Kubernetes.

How to install helm ?
- for MasOS: `brew install helm`

How Helm Chart help us to manage k8s?
- from
    ```yaml
    kubectl apply -f deployment.yaml
    kubectl apply -f service.yaml
    kubectl apply -f ingress.yaml

    kubectl delete -f deployment.yaml
    kubectl delete -f service.yaml
    kubectl delete -f ingress.yaml
    ```
- to
    ```yaml
    helm install my-app ./my-chart

    helm uninstall my-app
    ```


## Architecture

[high-level architecture](https://helm.sh/docs/topics/architecture/)

![](https://ctf-cci-com.imgix.net/1RfBA2XEK7nNjMmp3q2WFp/d1cd9dd07432694dd975f7e531609685/2023-03-16-image1.png?ixlib=rb-3.2.1&auto=format&fit=max&q=60&ch=DPR%2CWidth%2CViewport-Width%2CSave-Data&w=1500)
![](https://ctf-cci-com.imgix.net/4mpa9wPxoZ8GeAFCpoaryl/9b70f6c2bcd6a93f4692ed3806c4e30e/2023-03-16-image2.png?ixlib=rb-3.2.1&auto=format&fit=max&q=60&ch=DPR%2CWidth%2CViewport-Width%2CSave-Data&w=1500)


## Helm Demo

demo code link: https://github.com/mjd507/helm-demo

1. Create a helm chart.
    ```shell
    helm create helm-demo
    ```
2. check the directorys
    ```shell
    ➜  cd helm-demo
    ➜  tree
    .
    ├── Chart.yaml
    ├── charts
    ├── templates
    │   ├── NOTES.txt
    │   ├── _helpers.tpl
    │   ├── deployment.yaml
    │   ├── hpa.yaml
    │   ├── ingress.yaml
    │   ├── service.yaml
    │   ├── serviceaccount.yaml
    │   └── tests
    │       └── test-connection.yaml
    └── values.yaml
    ```
    change the service type to NodePort in value.yaml
3. install chart to k8s
    ```shell
    cd ..
    helm install my-helm-demo helm-demo
    ```
4. verify helm install command
    ```shell
    helm list -a

    output:
    NAME            NAMESPACE       REVISION        UPDATED                                 STATUS   CHART            APP VERSION
    my-helm-demo    default         1               2024-02-16 14:46:06.11394 +0800 CST     deployed helm-demo-0.1.0  1.16.0     
    ```
5. check the service/pod in k8s
    ```shell
    kubectl get service
    output:
    NAME             TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
    ...
    my-helm-demo     NodePort    10.101.215.130   <none>        80:31348/TCP     2m28s

    kubectl get pods
    output:
    NAME                                 READY   STATUS    RESTARTS        AGE
    ...
    my-helm-demo-5b77995cb9-q4cz9        1/1     Running   0               2m39s
    ```
6. check within the broswer
    since I use minikube to build a local k8s cluster, I can use minikube commands to verify the pod/service. it will open the page with my default broswer.
    ```shell
    minikube service my-helm-demo
    ```

7. remove from k8s
    ```shell
    helm uninstall my-helm-demo
    ```

