/**
 * MBTI 题库
 * dim: 所属维度 EI / SN / TF / JP
 * pole: 该题"同意"时倾向的人格极(E/I/S/N/T/F/J/P)
 * 计分:非常同意 +2 / 同意 +1 / 不确定 0 / 不同意 -1 / 非常不同意 -2(计入 pole 方向)
 */
const QUESTIONS = [
  /* ===== E / I 能量来源 ===== */
  { text: "在聚会上,我可以毫不费力地主动和陌生人聊起来。", dim: "EI", pole: "E" },
  { text: "长时间社交之后,我需要独处一段时间来恢复精力。", dim: "EI", pole: "I" },
  { text: "成为一群人关注的焦点,会让我感到兴奋而不是压力。", dim: "EI", pole: "E" },
  { text: "在小组讨论中,我更常扮演倾听者而不是主动发言的角色。", dim: "EI", pole: "I" },
  { text: "周末我更愿意参加热闹的活动,而不是安静地待在家里。", dim: "EI", pole: "E" },
  { text: "遇到烦心事时,我更倾向于自己消化,而不是找人倾诉。", dim: "EI", pole: "I" },
  { text: "独处太久会让我感到无聊,我总想找人一起做点什么。", dim: "EI", pole: "E" },
  { text: "相比多人的热闹闲聊,我更喜欢一对一的深度交流。", dim: "EI", pole: "I" },
  { text: "用语音或电话沟通,对我来说比打字发消息更轻松。", dim: "EI", pole: "E" },
  { text: "认识新朋友虽然不错,但更多时候我觉得那挺消耗的。", dim: "EI", pole: "I" },

  /* ===== S / N 信息获取 ===== */
  { text: "我更关注眼前切实可行的做法,而不是遥远未来的可能性。", dim: "SN", pole: "S" },
  { text: "我经常不知不觉沉浸在自己的想象和白日梦里。", dim: "SN", pole: "N" },
  { text: "学习新事物时,我喜欢先掌握理论和整体框架,再深入细节。", dim: "SN", pole: "N" },
  { text: "我对具体的数字、日期、外观这类细节印象很深。", dim: "SN", pole: "S" },
  { text: "别人讲得太抽象时,我会希望对方举出具体的例子。", dim: "SN", pole: "S" },
  { text: "我喜欢琢磨「如果……会怎样」这类假设性的问题。", dim: "SN", pole: "N" },
  { text: "相比灵感和直觉,我更相信亲身经验和实践出来的结论。", dim: "SN", pole: "S" },
  { text: "我常常能注意到别人忽略的深层含义或事物之间的联系。", dim: "SN", pole: "N" },
  { text: "我偏好步骤明确、有清晰对错的任务,而不是开放式探索。", dim: "SN", pole: "S" },
  { text: "我对隐喻、象征和富有想象力的表达特别有感觉。", dim: "SN", pole: "N" },

  /* ===== T / F 决策方式 ===== */
  { text: "做决定时,我首先看逻辑上是否站得住脚,其次才是别人的感受。", dim: "TF", pole: "T" },
  { text: "看到别人难过时,我的第一反应是安慰,而不是分析对错。", dim: "TF", pole: "F" },
  { text: "我能直接指出别人方案里的漏洞,即使对方听了会不太舒服。", dim: "TF", pole: "T" },
  { text: "我认为维护好人际关系和把事情做成同样重要。", dim: "TF", pole: "F" },
  { text: "别人情绪化的时候我会不太自在,更希望就事论事。", dim: "TF", pole: "T" },
  { text: "哪怕不「划算」,我还是会听从内心的价值观做选择。", dim: "TF", pole: "F" },
  { text: "争论时我更在意把道理讲清楚,而不是气氛是否融洽。", dim: "TF", pole: "T" },
  { text: "说话前我会反复斟酌,担心自己的话伤害到别人。", dim: "TF", pole: "F" },
  { text: "帮别人改进时,我倾向于直说问题,哪怕对方听着扎心。", dim: "TF", pole: "T" },
  { text: "我很容易被电影、故事或别人的经历深深打动。", dim: "TF", pole: "F" },

  /* ===== J / P 生活态度 ===== */
  { text: "我喜欢提前把计划定好,然后按部就班地执行。", dim: "JP", pole: "J" },
  { text: "我常把事情拖到截止日期前,才火力全开地赶工。", dim: "JP", pole: "P" },
  { text: "东西用完我习惯立刻放回原处,让环境保持井井有条。", dim: "JP", pole: "J" },
  { text: "计划赶不上变化,随性一点、见招拆招更适合我。", dim: "JP", pole: "P" },
  { text: "待办清单上有事情没完成,我会一直惦记着、感到不安。", dim: "JP", pole: "J" },
  { text: "出发旅行前,我更想先玩了再说,而不是做详细攻略。", dim: "JP", pole: "P" },
  { text: "我常常同时开好几个「坑」,兴趣一来就切换方向。", dim: "JP", pole: "P" },
  { text: "事情悬而未决会让我难受,我喜欢尽快定下来、有结论。", dim: "JP", pole: "J" },
  { text: "拿到新设备,我喜欢先自己摸索着玩,而不是先看说明书。", dim: "JP", pole: "P" },
  { text: "提交任务时,我通常是提前完成,而不是卡着点交。", dim: "JP", pole: "J" },
];

/** Likert 选项:label 显示文字,val 计入 pole 的分值 */
const OPTIONS = [
  { label: "非常同意", val: 2 },
  { label: "同意", val: 1 },
  { label: "不确定", val: 0 },
  { label: "不同意", val: -1 },
  { label: "非常不同意", val: -2 },
];

/** 维度中文名,用于题目标签与结果页 */
const DIM_INFO = {
  EI: { name: "能量来源", left: "E", right: "I", leftName: "外向", rightName: "内向" },
  SN: { name: "信息获取", left: "S", right: "N", leftName: "实感", rightName: "直觉" },
  TF: { name: "决策方式", left: "T", right: "F", leftName: "思考", rightName: "情感" },
  JP: { name: "生活态度", left: "J", right: "P", leftName: "判断", rightName: "知觉" },
};
