const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

function initDatabase() {
  // Admin users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // AI Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      website TEXT DEFAULT '',
      description TEXT DEFAULT '',
      logo_url TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      rank INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Blog posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      status TEXT DEFAULT 'published',
      view_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Portfolio items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS portfolio_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      file_url TEXT NOT NULL,
      thumbnail_url TEXT DEFAULT '',
      media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video', 'other')),
      width INTEGER,
      height INTEGER,
      tags TEXT DEFAULT '[]',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Seed default admin user
  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('meet-ai');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('meet-ai', hash);
  }

  // Seed default AI projects
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM ai_projects').get();
  if (projectCount.count === 0) {
    const projects = [
      {
        name: 'Claude',
        website: 'https://claude.ai',
        description: 'Anthropic 出品的新一代对话式 AI 助手，以超强的文本理解、代码生成和深度推理能力著称，支持超长上下文处理，是目前最强的 AI 模型之一。',
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Claude_AI_logo.svg/512px-Claude_AI_logo.svg.png',
        tags: JSON.stringify(['对话AI', '代码生成', '长上下文', 'Anthropic']),
        rank: 1
      },
      {
        name: 'ChatGPT',
        website: 'https://chat.openai.com',
        description: 'OpenAI 推出的革命性对话 AI，以 GPT-4o 为核心驱动，支持文本、图像、语音多模态交互，拥有全球最大的 AI 用户群体，彻底改变了人机交互方式。',
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/512px-ChatGPT_logo.svg.png',
        tags: JSON.stringify(['对话AI', '多模态', 'GPT-4o', 'OpenAI']),
        rank: 2
      },
      {
        name: 'Midjourney',
        website: 'https://www.midjourney.com',
        description: '目前最强的 AI 图像生成工具，以无与伦比的艺术创作能力和极高的图像质量著称。支持通过自然语言描述生成高质量艺术作品，深受设计师和创意工作者青睐。',
        logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Midjourney_Emblem.png/512px-Midjourney_Emblem.png',
        tags: JSON.stringify(['图像生成', '艺术创作', 'AI绘画', '创意工具']),
        rank: 3
      },
      {
        name: 'Cursor',
        website: 'https://cursor.sh',
        description: '基于 Claude 和 GPT-4 的革命性 AI 代码编辑器，内置强大的代码补全、智能重构和对话式编程功能，让开发者效率提升 10 倍，成为程序员的首选 AI 开发工具。',
        logo_url: 'https://cursor.sh/apple-touch-icon.png',
        tags: JSON.stringify(['代码编辑器', 'AI编程', '开发工具', '效率工具']),
        rank: 4
      },
      {
        name: 'Sora',
        website: 'https://sora.com',
        description: 'OpenAI 发布的突破性 AI 视频生成模型，能够根据文字描述生成长达数分钟的高质量、物理真实的视频内容，标志着 AI 视频生成进入新时代。',
        logo_url: 'https://sora.com/favicon.ico',
        tags: JSON.stringify(['视频生成', 'AI创作', '多模态', 'OpenAI']),
        rank: 5
      }
    ];

    const insertProject = db.prepare(`
      INSERT INTO ai_projects (name, website, description, logo_url, tags, rank)
      VALUES (:name, :website, :description, :logo_url, :tags, :rank)
    `);

    for (const item of projects) {
      insertProject.run(item);
    }
  }

  // Seed sample blog posts
  const blogCount = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get();
  if (blogCount.count === 0) {
    const posts = [
      {
        title: '2025年最值得关注的10个AI项目',
        slug: 'top-10-ai-projects-2025',
        content: `# 2025年最值得关注的10个AI项目

## 引言

2025年，AI领域迎来了前所未有的爆发式发展。从大语言模型到多模态AI，从代码助手到视频生成，每一个方向都涌现出令人惊叹的突破。本文将深入介绍今年最值得关注的10个AI项目。

## 1. Claude 3.5 Sonnet

Anthropic的Claude系列在2025年持续进化，Claude 3.5 Sonnet在代码生成、数学推理和长文本理解方面达到了新高度。其超长上下文能力让处理大型代码库和长篇文档成为可能。

## 2. GPT-4o

OpenAI的多模态旗舰模型，支持实时语音对话，视觉理解能力大幅提升。无论是图像分析、代码调试还是创意写作，GPT-4o都展现出惊人的综合能力。

## 3. Midjourney V7

图像生成领域的王者，V7版本在光照、构图和细节表现上达到了摄影级别的质量，已经被广泛用于商业设计、艺术创作等领域。

## 4. Sora

OpenAI发布的视频生成模型，能够创作出连贯、物理真实的长视频。虽然目前还有一些局限，但它标志着AI视频生成进入了新时代。

## 5. Cursor

基于AI的代码编辑器，彻底改变了程序员的工作方式。内置的AI助手能够理解整个代码库的上下文，提供精准的补全建议。

## 总结

AI技术正在以惊人的速度改变我们的工作和生活方式。保持关注这些前沿项目，将帮助我们在AI时代保持竞争力。无论你是开发者、设计师还是普通用户，这些工具都值得深入探索。`,
        excerpt: '2025年AI领域迎来爆发式发展，本文深入介绍最值得关注的10个AI项目，涵盖大语言模型、图像生成、代码助手等多个方向。',
        tags: JSON.stringify(['AI', '技术趋势', '大模型']),
        status: 'published'
      },
      {
        title: '用AI辅助创作：我的Midjourney实践经验',
        slug: 'midjourney-practice-experience',
        content: `# 用AI辅助创作：我的Midjourney实践经验

## 初识Midjourney

第一次接触Midjourney是在2023年初，那时候它还只能通过Discord使用。当时用它生成的第一张图让我震惊——一只在霓虹灯下行走的赛博朋克风格机器猫，细节精美到令人窒息。

## 提示词的艺术

好的提示词是AI绘画的核心。以下是我总结的一些技巧：

### 1. 描述具体场景

不要只说"一只猫"，而要说：
> "一只橘色的波斯猫坐在木质窗台上，午后金色阳光斜射进来，背景是模糊的城市街道，bokeh效果，自然光，照片级写实"

### 2. 指定艺术风格

- \`oil painting\` - 油画风格
- \`watercolor\` - 水彩
- \`digital art\` - 数字艺术
- \`photorealistic\` - 照片级写实
- \`Studio Ghibli style\` - 宫崎骏风格

### 3. 控制构图

- \`wide shot\` - 广角
- \`close-up\` - 特写
- \`bird's eye view\` - 鸟瞰
- \`dutch angle\` - 斜角构图

## 我的创作心得

经过几个月的练习，我发现AI绘画最大的乐趣在于探索边界。当你精心设计一段提示词，然后看到AI生成出超出预期的作品时，那种惊喜感是难以言表的。

AI并不是要取代艺术家，而是成为一个强大的创作工具。它让那些有创意但缺乏绘画技能的人，也能将脑海中的图像变为现实。`,
        excerpt: '分享我使用Midjourney进行AI辅助创作的实践经验，包括提示词技巧、风格控制和创作心得。',
        tags: JSON.stringify(['Midjourney', 'AI创作', '图像生成', '实践经验']),
        status: 'published'
      },
      {
        title: 'Cursor：改变我编程方式的AI编辑器',
        slug: 'cursor-ai-editor-review',
        content: `# Cursor：改变我编程方式的AI编辑器

## 为什么选择Cursor？

在尝试过GitHub Copilot、Tabnine等众多AI编程工具后，Cursor给我带来了前所未有的体验。它不仅仅是一个代码补全工具，而是一个真正理解你代码上下文的AI伙伴。

## 核心功能解析

### Tab补全
Cursor的代码补全不仅仅是简单的自动完成，它能理解上下文，预测你接下来想写什么，有时候它的建议比你想到的更优雅。

### Cmd+K 内联编辑
选中代码，按下 \`Cmd+K\`，用自然语言描述你想要的修改。比如：
- "将这个函数改为异步版本"
- "添加错误处理"
- "优化这段查询的性能"

### Chat模式
可以直接和AI对话，询问代码问题，获取解释和建议。最强大的是，AI能看到你的整个项目上下文，给出针对性的建议。

### @ 引用
通过 \`@filename\` 可以直接引用文件，让AI了解更多上下文：
\`\`\`
@database.js 这里的查询逻辑有什么性能问题？
\`\`\`

## 效率提升实测

使用Cursor三个月后，我的主观感受：
- **重复性代码减少约70%** - 基础模板、CRUD操作等
- **调试时间减少约40%** - AI能快速定位问题
- **文档编写快了3倍** - AI能根据代码自动生成注释

## 总结

Cursor已经成为我日常开发的核心工具。它不是完美的，有时候会给出不准确的建议，但总体来说它让我的工作效率有了质的提升。如果你还没试过，强烈建议尝试一下。`,
        excerpt: '深度测评Cursor AI代码编辑器，分析其核心功能、使用技巧，以及对编程效率的实际提升效果。',
        tags: JSON.stringify(['Cursor', 'AI编程', '开发工具', '效率提升']),
        status: 'published'
      }
    ];

    const insertPost = db.prepare(`
      INSERT INTO blog_posts (title, slug, content, excerpt, tags, status)
      VALUES (:title, :slug, :content, :excerpt, :tags, :status)
    `);

    for (const item of posts) {
      insertPost.run(item);
    }
  }

  console.log('✅ Database initialized successfully');
}

module.exports = { db, initDatabase };
