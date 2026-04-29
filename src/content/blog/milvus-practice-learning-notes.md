---
title: "RAG 学习笔记：Milvus 多模态检索实战"
description: "从零开始掌握 Milvus 向量数据库的部署、核心组件和多模态检索实践，构建生产级向量检索系统"
pubDate: 2025-08-20
tags: ["RAG", "Milvus", "向量数据库", "多模态检索", "Docker"]
lang: "zh"
---

# RAG 学习笔记：Milvus 多模态检索实战

## 前言

Milvus 是一个开源的、专为大规模向量相似性搜索而设计的向量数据库，已成为 LF AI & Data 基金会的顶级项目。本文将从部署到实践，全面介绍 Milvus 的核心组件和多模态检索应用。

---

## 一、为什么选择 Milvus？

### 核心原因

| 原因 | 说明 | 影响 |
|------|------|------|
| **生产级设计** | 云原生架构，高可用、高性能 | 适合生产环境部署 |
| **大规模支持** | 处理十亿、百亿级向量数据 | 满足企业级需求 |
| **多模态能力** | 支持文本、图像等多模态检索 | 扩展应用场景 |
| **开源生态** | 活跃社区，丰富文档 | 降低学习成本 |

### Milvus vs 其他方案

| 特性 | Milvus | FAISS | ChromaDB |
|------|--------|-------|----------|
| **架构** | 分布式数据库 | 算法库 | 轻量级数据库 |
| **规模** | 十亿级+ | 百万级 | 百万级 |
| **部署** | Docker/K8s | 本地文件 | 本地文件 |
| **适用场景** | 生产环境 | 原型开发 | 小型应用 |

---

## 二、Milvus 部署安装

### 2.1 环境准备

**前置要求**：
- Docker 和 Docker Compose 已安装并运行
- 至少 4GB 可用内存
- 网络连接正常

### 2.2 部署步骤

**步骤 1：下载配置文件**

```bash
# macOS / Linux (使用 wget)
wget https://github.com/milvus-io/milvus/releases/download/v2.5.14/milvus-standalone-docker-compose.yml -O docker-compose.yml

# Windows (使用 PowerShell)
Invoke-WebRequest -Uri "https://github.com/milvus-io/milvus/releases/download/v2.5.14/milvus-standalone-docker-compose.yml" -OutFile "docker-compose.yml"
```

**步骤 2：启动 Milvus 服务**

```bash
docker compose up -d
```

**步骤 3：验证安装**

```bash
# 查看容器状态
docker ps

# 确认三个容器运行中：
# - milvus-standalone
# - milvus-minio
# - milvus-etcd
```

### 2.3 常用管理命令

| 命令 | 功能 | 说明 |
|------|------|------|
| `docker compose up -d` | 启动服务 | 后台运行 |
| `docker compose down` | 停止服务 | 保留数据卷 |
| `docker compose down -v` | 彻底清理 | 删除所有数据 |

---

## 三、Milvus 核心组件

### 3.1 Collection（集合）

**类比理解**：

```
Collection (集合) = 图书馆
    ↓
Partition (分区) = 不同区域（小说区、科技区）
    ↓
Schema (模式) = 图书卡片规则
    ↓
Entity (实体) = 一本具体的书
    ↓
Alias (别名) = 推荐书单
```

**Schema 设计示例**：

```python
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=768),
    FieldSchema(name="image_path", dtype=DataType.VARCHAR, max_length=512),
]
```

### 3.2 Partition（分区）

**核心价值**：
- ✅ 提升查询性能：只在特定分区内搜索
- ✅ 数据管理：批量操作特定分区数据
- ✅ 最多支持 1024 个分区

### 3.3 Alias（别名）

**核心应用**：安全地更新数据

```
步骤：
1. 创建新 Collection (collection_v2)
2. 导入、索引好所有新数据
3. 将别名切换到新 Collection
4. 应用层无感知，无缝升级
```

### 3.4 Index（索引）

**索引类型对比**：

| 索引类型 | 原理 | 优点 | 缺点 | 适用场景 |
|---------|------|------|------|---------|
| **FLAT** | 暴力搜索 | 100% 召回率 | 速度慢、内存大 | 小数据、高精度 |
| **IVF 系列** | 倒排文件索引 | 速度快、平衡好 | 召回率<100% | 通用大规模场景 |
| **HNSW** | 基于图的索引 | 极快、高召回率 | 内存占用大 | 实时推荐、在线搜索 |
| **DiskANN** | 基于磁盘的索引 | 支持海量数据 | 延迟稍高 | 数据超内存容量 |

**索引选择决策树**：

```
├─ 数据可完全载入内存？
│  ├─ 是 → 追求低延迟？
│  │  ├─ 是 → HNSW
│  │  └─ 否 → IVF_FLAT / IVF_SQ8
│  └─ 否 → DiskANN
└─ 追求 100% 准确率？
   └─ 是 → FLAT（数据量不大）
```

---

## 四、Milvus 检索功能

### 4.1 基础向量检索（ANN Search）

**核心参数**：

```python
search_results = milvus_client.search(
    collection_name="multimodal_demo",
    data=[query_vector],           # 查询向量
    output_fields=["image_path"],  # 返回字段
    limit=5,                       # Top-K
    search_params={                # 检索参数
        "metric_type": "COSINE",
        "params": {"ef": 128}
    }
)
```

### 4.2 增强检索功能

| 功能 | 说明 | 应用示例 |
|------|------|---------|
| **过滤检索** | 结合标量字段过滤 | "价格<500且有库存的商品" |
| **范围检索** | 返回相似度在阈值内的结果 | "相似度>0.9的人脸" |
| **多向量混合检索** | 同时检索多个向量字段 | 文本+图像混合检索 |
| **分组检索** | 确保结果多样性 | "来自不同作者的文章" |

---

## 五、多模态检索实战

### 5.1 初始化与工具定义

```python
import os
from tqdm import tqdm
from glob import glob
import torch
from visual_bge.visual_bge.modeling import Visualized_BGE
from pymilvus import MilvusClient, FieldSchema, CollectionSchema, DataType

# 初始化设置
MODEL_NAME = "BAAI/bge-base-en-v1.5"
MODEL_PATH = "../../models/bge/Visualized_base_en_v1.5.pth"
DATA_DIR = "../../data/C3"
COLLECTION_NAME = "multimodal_demo"
MILVUS_URI = "http://localhost:19530"

# 编码器类
class Encoder:
    def __init__(self, model_name: str, model_path: str):
        self.model = Visualized_BGE(
            model_name_bge=model_name, 
            model_weight=model_path
        )
        self.model.eval()

    def encode_query(self, image_path: str, text: str) -> list[float]:
        with torch.no_grad():
            query_emb = self.model.encode(image=image_path, text=text)
        return query_emb.tolist()[0]

    def encode_image(self, image_path: str) -> list[float]:
        with torch.no_grad():
            query_emb = self.model.encode(image=image_path)
        return query_emb.tolist()[0]
```

### 5.2 创建 Collection

```python
# 初始化客户端
encoder = Encoder(MODEL_NAME, MODEL_PATH)
milvus_client = MilvusClient(uri=MILVUS_URI)

# 创建 Collection
if milvus_client.has_collection(COLLECTION_NAME):
    milvus_client.drop_collection(COLLECTION_NAME)

# 定义 Schema
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=768),
    FieldSchema(name="image_path", dtype=DataType.VARCHAR, max_length=512),
]

schema = CollectionSchema(fields, description="多模态图文检索")
milvus_client.create_collection(collection_name=COLLECTION_NAME, schema=schema)
```

### 5.3 插入数据

```python
# 准备并插入数据
image_list = glob(os.path.join(DATA_DIR, "dragon", "*.png"))
data_to_insert = []

for image_path in tqdm(image_list, desc="生成图像嵌入"):
    vector = encoder.encode_image(image_path)
    data_to_insert.append({
        "vector": vector, 
        "image_path": image_path
    })

result = milvus_client.insert(
    collection_name=COLLECTION_NAME, 
    data=data_to_insert
)
print(f"成功插入 {result['insert_count']} 条数据。")
```

### 5.4 创建索引

```python
# 创建 HNSW 索引
index_params = milvus_client.prepare_index_params()
index_params.add_index(
    field_name="vector",
    index_type="HNSW",
    metric_type="COSINE",
    params={"M": 16, "efConstruction": 256}
)
milvus_client.create_index(
    collection_name=COLLECTION_NAME, 
    index_params=index_params
)

# 加载 Collection 到内存
milvus_client.load_collection(collection_name=COLLECTION_NAME)
```

### 5.5 执行检索

```python
# 执行多模态检索
query_image_path = os.path.join(DATA_DIR, "dragon", "query.png")
query_text = "一条龙"
query_vector = encoder.encode_query(
    image_path=query_image_path, 
    text=query_text
)

search_results = milvus_client.search(
    collection_name=COLLECTION_NAME,
    data=[query_vector],
    output_fields=["image_path"],
    limit=5,
    search_params={"metric_type": "COSINE", "params": {"ef": 128}}
)[0]

# 输出结果
for i, hit in enumerate(search_results):
    print(f"Top {i+1}: ID={hit['id']}, 距离={hit['distance']:.4f}, 路径='{hit['entity']['image_path']}'")
```

### 5.6 运行结果

```
检索结果:
  Top 1: ID=459243798403756667, 距离=0.9411, 路径='dragon01.png'
  Top 2: ID=459243798403756668, 距离=0.5818, 路径='dragon02.png'
  Top 3: ID=459243798403756671, 距离=0.5731, 路径='dragon05.png'
  Top 4: ID=459243798403756670, 距离=0.4894, 路径='dragon04.png'
  Top 5: ID=459243798403756669, 距离=0.4100, 路径='dragon03.png'
```

---

## 六、核心参数详解

### 6.1 HNSW 索引参数

| 参数 | 说明 | 推荐值 | 影响 |
|------|------|--------|------|
| **M** | 每个节点的最大连接数 | 16-64 | 越大召回率越高，内存越大 |
| **efConstruction** | 构建时的搜索范围 | 200-500 | 越大构建越慢，质量越好 |
| **ef** | 查询时的搜索范围 | 64-512 | 越大查询越慢，召回率越高 |

### 6.2 检索参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| **limit** | 返回结果数量 | 根据需求设置 |
| **metric_type** | 距离度量 | COSINE / L2 / IP |
| **ef** | HNSW 查询参数 | 128-256 |

---

## 七、实践要点

### 7.1 最佳实践

| 实践 | 说明 | 重要性 |
|------|------|--------|
| **合理设计 Schema** | 根据业务需求定义字段 | ⭐⭐⭐⭐⭐ |
| **选择合适索引** | 平衡性能、召回率、内存 | ⭐⭐⭐⭐⭐ |
| **批量插入数据** | 提升插入效率 | ⭐⭐⭐⭐ |
| **定期维护索引** | 优化索引性能 | ⭐⭐⭐ |

### 7.2 常见问题

❌ **问题 1**：容器启动失败
- 解决：检查端口占用和内存限制

❌ **问题 2**：检索速度慢
- 解决：优化索引参数或使用 GPU 加速

❌ **问题 3**：内存不足
- 解决：使用量化索引或增加内存

---

## 八、学习收获

### 核心认知

1. **Milvus 是生产级向量数据库**：云原生架构，支持十亿级向量
2. **核心组件清晰**：Collection、Partition、Index、Alias 各司其职
3. **索引选择关键**：在性能、召回率、内存之间权衡

### 下一步计划

- [ ] 实践分布式 Milvus 集群部署
- [ ] 探索混合检索（密集+稀疏向量）
- [ ] 学习 Milvus 性能调优
- [ ] 构建生产级多模态 RAG 应用

---

## 结语

Milvus 为构建大规模向量检索应用提供了坚实的基础设施。通过本文的实践，你已经掌握了从部署到多模态检索的完整流程。建议继续深入探索 Milvus 的高级功能，构建更强大的 RAG 应用。

> **关键要点**：Milvus 的核心是高效的向量索引和丰富的检索功能，合理设计 Schema 和选择索引是成功的关键。
