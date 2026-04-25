---
title: "RAG 学习笔记：文本分块的四种武器，哪种最锋利？"
description: "深入学习 LangChain 中的四种文本分割器，通过实际运行对比和 LLM 分析，找出最适合你场景的分块策略。"
pubDate: 2026-04-25
tags: ["RAG", "LangChain", "文本分块", "Python", "AI"]
lang: "zh"
---

# RAG 学习笔记：文本分块的四种武器，哪种最锋利？

## 前言

在构建 RAG（检索增强生成）系统时，**文本分块（Chunking）** 是最基础也最关键的环节。分块质量直接影响检索效果和回答准确度。

今天通过实际运行代码，我深入学习了 LangChain 提供的四种文本分割方法，并调用 LLM 进行了专业对比分析。本文将完整记录学习过程、代码示例、运行结果和对比结论。

---

## 一、为什么需要分块？

### 三大核心原因

| 原因 | 说明 | 影响 |
|------|------|------|
| **嵌入模型限制** | 如 bge-small-zh 最多 512 token | 超出会被截断，丢失信息 |
| **LLM 上下文窗口有限** | 如 4096 token | 无法将整篇文档塞入 Prompt |
| **检索粒度要求** | 需要精准召回 | 避免"大海捞针"，提升准确率 |

### 直观理解

想象你要在一本 500 页的书里找答案。如果整本书作为一个搜索单元，效率极低。但如果按章节、段落拆分成小块，搜索就会精准得多。

**分块就是做这件事：把长文档拆成语义连贯的小片段。**

---

## 二、环境准备

### 技术栈

```
Python 3.12
├── LangChain (文本分割框架)
├── langchain-huggingface (嵌入模型)
├── langchain-openai (LLM 调用)
└── python-dotenv (环境变量管理)
```

### 关键依赖

```python
from langchain_text_splitters import CharacterTextSplitter, RecursiveCharacterTextSplitter
from langchain_experimental.text_splitter import SemanticChunker
from langchain_text_splitters import MarkdownHeaderTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
```

### 国内网络适配

```python
# HuggingFace 镜像设置，解决国内访问问题
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
```

---

## 三、四种分块方法详解

### 方法一：CharacterTextSplitter —— 简单粗暴的"一刀切"

**原理**：用固定的分隔符将文本拆成片段，按目标大小合并。

#### 参数配置

| 参数 | 值 | 说明 |
|------|-----|------|
| `chunk_size` | 200 | 每个块的目标字符数（软限制） |
| `chunk_overlap` | 10 | 相邻块重叠字符数，防止语义断裂 |
| `separator` | `"\n\n"` | 分隔符，默认为双换行（段落分隔） |

#### 代码示例

```python
text_splitter = CharacterTextSplitter(
    chunk_size=200,
    chunk_overlap=10,
    separator="\n\n"
)
chunks = text_splitter.split_documents(documents)
```

#### 运行结果

```
加载完成：1 个文档，2343 字符
Created a chunk of size 201, which is longer than the specified 200
CharacterTextSplitter: 切分为 14 个块
```

#### 示例输出

> **块 1** (长度：72)：
> "# 蜂医
> 
> 游戏《三角洲行动》中的支援型干员
> 
> 蜂医是2024年琳琅天上发行的《三角洲行动》中的支援型干员之一..."

> **块 2** (长度：201)：
> "蜂医在游戏中能够使用战术装备"激素枪"：远程治疗队友或自我治疗，还可以使用兵种道具"烟幕无人机"..."

#### 特点总结

```
优点：
- 实现简单，参数少
- 速度快，无额外计算成本

缺点：
- 不懂语义，可能在句子中间硬切
- 单个片段超长时会被截断
- 只有一种分隔符，不够灵活
```

---

### 方法二：RecursiveCharacterTextSplitter —— 递归切分的"瑞士军刀"

**原理**：按优先级递归尝试多种分隔符，优先在自然边界断开。

#### 切分策略

```
优先级从高到低：
1. "\n\n"  → 段落分隔
2. "\n"    → 句子分隔  
3. " "     → 单词/字符分隔
4. "." "," → 标点符号
5. ""      → 逐字符（最后手段）
```

#### 代码示例（含中文适配）

```python
recursive_splitter = RecursiveCharacterTextSplitter(
    chunk_size=200,
    chunk_overlap=20,
    separators=[
        "\n\n", "\n", " ",
        ".", ",", "\u200b",      # 零宽空格
        "\uff0c", "\u3001",      # 全角逗号
        "\uff0e", "\u3002",      # 全角句号
        ""
    ]
)
recursive_chunks = recursive_splitter.split_documents(documents)
```

#### 运行结果

```
RecursiveCharacterTextSplitter: 切分为 24 个块
```

#### 与 CharacterTextSplitter 的对比

| 维度 | CharacterTextSplitter | RecursiveCharacterTextSplitter |
|------|----------------------|-------------------------------|
| 切分块数 | 14 块 | 24 块 |
| 分隔符 | 单一 | 多种，递归尝试 |
| 语义连贯性 | 一般 | 较好 |
| 推荐程度 | ⭐⭐ | ⭐⭐⭐⭐ |

#### 特点总结

```
优点：
- 尽量在自然语义边界断开
- 支持自定义分隔符列表
- RAG 项目中最常用的分割器

缺点：
- 参数较多，需要调优
- 仍然不理解语义，只是"聪明地切"
```

---

### 方法三：SemanticChunker —— 语义分块的"智能大脑"

**原理**：先将文本拆为小句，计算向量相似度，在语义变化处断开。

#### 工作原理

```
流程：
1. 句子拆分 → 将文本拆成一个个小句
2. 向量化 → 用嵌入模型将每个小句转为向量
3. 相似度计算 → 计算相邻句子向量的余弦距离
4. 断点判断 → 在相似度突降处断开
5. 块合并 → 合并相邻句子为语义完整的块
```

#### 断点判断策略

| 策略 | 说明 | 参数含义 |
|------|------|---------|
| `percentile` | 按百分位判断 | 值越小，断点越少，块越大 |
| `standard_deviation` | 按标准差判断 | 值越大，断点越少 |
| `interquartile` | 按四分位距判断 | 统计稳健，适合长文本 |

#### 代码示例

```python
# 需要先初始化嵌入模型
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-zh-v1.5",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

semantic_splitter = SemanticChunker(
    embeddings,
    breakpoint_threshold_type="percentile",
    breakpoint_threshold_amount=65
)
semantic_chunks = semantic_splitter.split_documents(documents)
```

#### 运行结果

```
SemanticChunker: 切分为 3 个块
```

#### 示例输出

> **块 1** (长度：566)：包含角色介绍、属性、目录索引等完整信息
> 
> **块 2** (长度：14)：仅包含目录片段
> 
> **块 3** (长度：1761)：包含完整的技能说明、参考资料等

#### 特点总结

```
优点：
- 语义连贯性最好，不会"一句话切成两半"
- 自动适应文档的主题结构
- 适合问答系统和语义检索

缺点：
- 需要嵌入模型计算所有句子向量
- 速度较慢，成本较高
- 可能产生块大小不均匀
```

---

### 方法四：MarkdownHeaderTextSplitter —— 结构分块的"文档建筑师"

**原理**：按 Markdown 标题层级将文档分块，保持结构完整性。

#### 参数配置

| 参数 | 说明 |
|------|------|
| `headers_to_split_on` | 列表，每个元素为 `(markdown符号, 名称)` 元组 |

#### 代码示例

```python
markdown_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=[
        ("#", "Header-1"),
        ("##", "Header-2"),
        ("###", "Header-3"),
        ("####", "Header-4"),
    ]
)

chunks = markdown_splitter.split_text(documents[0].page_content)
```

#### 适用场景

```
最适合：
✅ 技术文档
✅ API 文档  
✅ 知识库
✅ 教程

不适合：
❌ 非结构化文本
❌ 无标题的纯文字
❌ 格式混乱的文档
```

#### Bug 修复记录

> **问题**：初始代码使用了错误的参数名和 API
> ```python
> # 错误写法
> markdown_splitter = MarkdownHeaderTextSplitter(
>     headers_to_split=["h1", "h2", "h3"],  # 参数名错误
>     chunk_overlap=20,                       # 无此参数
>     chunk_size=200                          # 无此参数
> )
> markdown_splitter.split_documents(docs)    # 方法名错误
> ```
> 
> **修复**：
> ```python
> # 正确写法
> markdown_splitter = MarkdownHeaderTextSplitter(
>     headers_to_split_on=[("#", "Header-1"), ...]  # 正确参数
> )
> markdown_splitter.split_text(docs[0].page_content)  # 正确方法
> ```

---

## 四、四种方法全景对比

### 数据对比

| 方法 | 切分块数 | 平均长度 | 智能程度 | 计算成本 | 推荐指数 |
|------|---------|---------|---------|---------|---------|
| CharacterTextSplitter | 14 | ~167 字符 | ⭐ | 低 | ⭐⭐ |
| RecursiveCharacterTextSplitter | 24 | ~97 字符 | ⭐⭐⭐ | 低 | ⭐⭐⭐⭐ |
| SemanticChunker | 3 | ~781 字符 | ⭐⭐⭐⭐⭐ | 高 | ⭐⭐⭐⭐ |
| MarkdownHeaderTextSplitter | 依文档结构 | 不均匀 | ⭐⭐⭐⭐ | 低 | ⭐⭐⭐⭐ |

### 适用场景矩阵

| 场景 | 推荐方法 | 原因 |
|------|---------|------|
| 快速原型 | RecursiveCharacterTextSplitter | 平衡速度和效果 |
| 高质量问答 | SemanticChunker | 语义最连贯 |
| 技术文档 | MarkdownHeaderTextSplitter | 保持结构完整 |
| 日志/代码 | CharacterTextSplitter | 规则明确，简单有效 |

---

## 五、LLM 专业分析

为了获得更专业的对比意见，我调用了 DeepSeek-V3.2 模型进行分析，以下是核心结论：

### 核心观点

> "从示例文档的表现来看，文档具有明显的结构特征。建议优先使用 **MarkdownHeaderTextSplitter**，它能最好地保持文档的逻辑结构，这对后续的信息检索和理解至关重要。"

### 最终推荐建议

#### 针对结构化文档（如有明显标题层级）

```
首选：MarkdownHeaderTextSplitter
备选：SemanticChunker + 后处理
```

#### 通用场景建议

| 优先级 | 场景 | 推荐方法 |
|--------|------|---------|
| 1 | 结构化文档处理 | MarkdownHeaderTextSplitter |
| 2 | 通用文本 / RAG 应用 | RecursiveCharacterTextSplitter |
| 3 | 语义搜索 / 问答 | SemanticChunker |
| 4 | 简单预处理 | CharacterTextSplitter |

### 优化建议

- **块大小**：RAG 应用建议 200-800 字符之间
- **混合策略**：先按标题分割，再对长段落进行语义或递归分割
- **重叠窗口**：添加 overlap 避免边界信息丢失
- **下游任务适配**：根据检索或生成需求调整分割粒度

---

## 六、踩坑记录

### 坑 1：HuggingFace 网络问题

**现象**：
```
[SSL: UNEXPECTED_EOF_WHILE_READING] EOF occurred in violation of protocol
```

**解决**：
```python
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"
```

### 坑 2：MarkdownHeaderTextSplitter API 错误

**现象**：
```
TypeError: unexpected keyword argument 'headers_to_split'
AttributeError: no attribute 'split_documents'
```

**解决**：
- `headers_to_split` → `headers_to_split_on`
- `split_documents()` → `split_text()`

### 坑 3：LLM API Key 配置

**需要**：
```bash
# 在 .env 文件中配置
SILICONFLOW_API_KEY=your_api_key_here
```

---

## 七、学习收获

### 核心认知

1. **没有银弹**：每种方法都有其适用场景，选择取决于文档类型和使用目的
2. **混合策略最优**：实际项目中往往需要组合多种方法
3. **分块质量决定 RAG 上限**：检索效果很大程度上取决于分块是否合理
4. **实验驱动**：最好的方式是实际运行、对比数据、观察效果

### 下一步计划

- [ ] 尝试 `MarkdownHeaderTextSplitter` 配合递归分割的混合策略
- [ ] 测试不同 `chunk_size` 对检索准确率的影响
- [ ] 探索基于文档结构的自适应分块策略
- [ ] 将分块效果应用到实际 RAG 项目中验证

---

## 结语

文本分块看似简单，实则是一门需要深入理解的技术。通过这次学习，我不仅掌握了四种分割器的原理和用法，还学会了如何用 LLM 进行专业对比分析。

**分块是 RAG 的基石，基石打得好，上层建筑才稳。**

如果你对 RAG 或 LangChain 感兴趣，建议亲手运行一下这些代码，感受不同方法的效果差异。实践出真知！
