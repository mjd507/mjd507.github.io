---
title: Kubernetes
categories: Devops
toc: true
comments: true
copyright: true
hidden: false
date: 2024-02-15 11:13:43
tags:
---

[Kubernetes Crash Course for Absolute Beginners [NEW]](https://www.youtube.com/watch?v=s_o8dwzRlu4)

[Kubenetes Overview](https://kubernetes.io/docs/concepts/overview/)

<!--more-->

## Introduction

> Open source container **orchestration** tool
>
> Helps manage containerized applications in different deployment environments


What problems does kubernetes slove ? 
- the need for container orchestration tool
    - trend from monolith to microservices
    - increased usage of containers
    - demand for a proper way of managing those hundreds of containers

What features do orchestration tools offer ?
- High Availability or no downtime
- Scalability or high performance
- Disaster recovery - backup and restore


## Architecture

![](https://kubernetes.io/images/docs/kubernetes-cluster-architecture.svg)

master-worker pattern. 

Node = virtual or physical machine

master node: control plane
- Api Server = Entrypoint to k8s cluster (via ui/api/kubectl)
- Controller Manager = keeps track of whats happening in the cluster
- Scheduler = Ensures pods placement
- etcd = kubernetes backing store (etcd holds the current status of any K8s component)

worker nodes: where your applications are running


## Main Components

Pod
- smallest unit in kubernetes
- abstraction over container
- usually 1 application per Pod
- Each Pod gets its own IP address
- New Ip address on re-creation

Service (communication, load balancer for pods)
- Permanent IP address
- Lifecycle of Pod and Service not connected
- You specify the type of Service on creation
- Internal Service is the default type

Ingress
- route traffic into cluster

ConfigMap
- External Configuration of all of your applications

Secret
- Used to store secret data

Volume
- Storage on local machine
- Or remote, outside of the K8s cluster

Deployment (for stateless apps, replicate pods)
- Blueprint for 'my-app' Pods
- You create Deployments
- Abstraction of Pods

StatefulSet
- for stateful apps


## Local k8s cluster Setup

Production Cluster Setup
- Multiple Master and Worker nodes
- Separate virtual or physical machines

Setup k8s cluster locally (docker or other VM is required)
- using minikube : Master and Worker processes run on One machine.
- For MacOS: `brew install minikube`  [minikube installation](https://minikube.sigs.k8s.io/docs/start/)
- `minikube start --driver docker`
- `minikube status`
- `kubectl get node`


## k8s Demo

deploy a mongo instance and a web app into our local k8s cluster.

both mongo and webapp are official images which can be searched from docker hub. 

project link: https://github.com/mjd507/k8s-demo

Mongo-ConfigMap.yaml: store mongo url

Mongo-Secrets.yaml: store mongo username and password

Mongo-Deployment.yaml: Deployment contains the template, the template is used for pod. 
Service contains the port(can be random) and targetPort(mongo port). usually make the port same as targetPort, to make things easy :)

Web-Deployment.yaml: the type of the Service in this file is NodePort, which can be visit from external broswer. and we should specify the nodePort.

Steps for deploying in local k8s
- `kubectl apply -f Mongo-ConfigMap.yaml`
- `kubectl apply -f Mongo-Secrets.yaml`  
- `kubectl apply -f Mongo-Deployment.yaml`
- `kubectl apply -f Web-Deployment.yaml`

all images are deployed into containers, and we can verify by below:

- `kubectl get configmap`
- `kubectl get secret`
- `kubectl get svc`
- `kubectl get pods`

verify in the broswer:
- `minikube service webapp-service`
