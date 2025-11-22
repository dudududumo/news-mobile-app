const OpenAI = require('openai');

// 初始化客户端 (完美复刻你的 curl 配置)
const client = new OpenAI({
  apiKey: process.env.VOLC_API_KEY, // 读取 .env 里的 Key
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3', // 读取 .env 里的 Endpoint
});

class AIService {
  async generateTags(content) {
    // 1. 安全检查
    if (!content) return [];

    // 截取前 500 个字，避免 token 消耗过多
    const textToAnalyze = content.substring(0, 500);

    try {
      console.log(`正在调用模型: ${process.env.VOLC_MODEL_ID}, 内容: ${textToAnalyze.substring(0, 20)}...`);

      // 2. 发起请求 (对应 curl 的结构)
      const completion = await client.chat.completions.create({
        model: process.env.VOLC_MODEL_ID, // 使用 doubao-seed-1-6-251015
        messages: [
          {
            role: 'system',
            content: '你是一个标签提取器。请根据用户的文字内容，提取 3-5 个适合作为社交媒体 Hashtag 的中文标签。不要解释，不要标点，只返回纯 JSON 字符串数组，例如：["生活", "美食"]。'
          },
          {
            role: 'user',
            content: textToAnalyze
          }
        ],
        temperature: 0.3, // 稍微低一点，让结果更稳定
      });

      // 3. 解析结果
      const aiText = completion.choices[0]?.message?.content || '';
      console.log('AI 返回原始结果:', aiText);

      // 清洗可能存在的 markdown 符号 (```json ...)
      const cleanText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

      // 尝试解析 JSON
      try {
        const tags = JSON.parse(cleanText);
        return Array.isArray(tags) ? tags : [cleanText];
      } catch (jsonError) {
        // 如果 AI 没返回 JSON，而是直接返回了 "美食, 生活"，我们尝试逗号分割
        console.warn('JSON解析失败，尝试文本分割');
        return cleanText.split(/[,，\s]+/).filter(t => t.length > 0);
      }

    } catch (error) {
      console.error('AI 调用失败:', error.message);
      // 如果报错 404 或 model not found，说明这个 ID 可能不支持文本对话，或者 key 没权限
      // 启用本地兜底策略
      return this.localFallback(textToAnalyze);
    }
  }

  // 本地兜底 (当 AI 挂掉时使用)
  localFallback(text) {
    const tags = ['日常'];
    if (text.match(/吃|喝|味|餐/)) tags.push('美食');
    if (text.match(/玩|游|景|山/)) tags.push('旅行');
    if (text.match(/书|学|读/)) tags.push('学习');
    if (text.match(/工|班|会/)) tags.push('职场');
    return tags;
  }
}

module.exports = new AIService();
