INSERT INTO dialogue_intent (code, name, description, priority) VALUES
    ('greeting', '问候', '回应你好、嗨等问候', 100),
    ('identity', '自我介绍', '介绍 skynamecat', 90),
    ('projects', '作品与项目', '介绍可以查看的作品和项目', 80),
    ('pangbobo', '庞菠菠', '介绍网站数字宠物庞菠菠', 80),
    ('contact', '联系方式', '引导访客通过 GitHub 联系', 70),
    ('music', '音乐与兴趣', '回应音乐和日常兴趣', 60),
    ('site_mode', '网站模式', '解释极简模式与标准模式', 60),
    ('farewell', '告别', '礼貌告别', 50),
    ('fallback', '兜底', '没有匹配到规则时使用', -100);

INSERT INTO dialogue_trigger (intent_id, match_type, pattern, weight)
SELECT id, 'KEYWORD', '你好', 1.000 FROM dialogue_intent WHERE code = 'greeting'
UNION ALL SELECT id, 'KEYWORD', '嗨', 0.950 FROM dialogue_intent WHERE code = 'greeting'
UNION ALL SELECT id, 'REGEX', '^(hi|hello|hey)[!！。. ]*$', 0.900 FROM dialogue_intent WHERE code = 'greeting'
UNION ALL SELECT id, 'KEYWORD', '你是谁', 1.000 FROM dialogue_intent WHERE code = 'identity'
UNION ALL SELECT id, 'KEYWORD', '介绍一下', 0.900 FROM dialogue_intent WHERE code = 'identity'
UNION ALL SELECT id, 'KEYWORD', 'skynamecat', 0.850 FROM dialogue_intent WHERE code = 'identity'
UNION ALL SELECT id, 'KEYWORD', '作品', 1.000 FROM dialogue_intent WHERE code = 'projects'
UNION ALL SELECT id, 'KEYWORD', '项目', 0.900 FROM dialogue_intent WHERE code = 'projects'
UNION ALL SELECT id, 'KEYWORD', '庞菠菠', 1.000 FROM dialogue_intent WHERE code = 'pangbobo'
UNION ALL SELECT id, 'KEYWORD', '小人', 0.750 FROM dialogue_intent WHERE code = 'pangbobo'
UNION ALL SELECT id, 'KEYWORD', '联系', 1.000 FROM dialogue_intent WHERE code = 'contact'
UNION ALL SELECT id, 'KEYWORD', '邮箱', 0.900 FROM dialogue_intent WHERE code = 'contact'
UNION ALL SELECT id, 'KEYWORD', 'github', 0.800 FROM dialogue_intent WHERE code = 'contact'
UNION ALL SELECT id, 'KEYWORD', '音乐', 1.000 FROM dialogue_intent WHERE code = 'music'
UNION ALL SELECT id, 'KEYWORD', '听歌', 0.950 FROM dialogue_intent WHERE code = 'music'
UNION ALL SELECT id, 'KEYWORD', '极简模式', 1.000 FROM dialogue_intent WHERE code = 'site_mode'
UNION ALL SELECT id, 'KEYWORD', '标准模式', 1.000 FROM dialogue_intent WHERE code = 'site_mode'
UNION ALL SELECT id, 'KEYWORD', '再见', 1.000 FROM dialogue_intent WHERE code = 'farewell'
UNION ALL SELECT id, 'KEYWORD', '拜拜', 0.950 FROM dialogue_intent WHERE code = 'farewell';

INSERT INTO dialogue_reply (intent_id, content, weight)
SELECT id, '你好呀，我是 skynamecat 的预制小助手。想看看作品、认识庞菠菠，还是随便聊聊？', 2 FROM dialogue_intent WHERE code = 'greeting'
UNION ALL SELECT id, '嗨，欢迎来这里。你可以问我 skynamecat 最近在做什么。', 1 FROM dialogue_intent WHERE code = 'greeting'
UNION ALL SELECT id, '我是 skynamecat：喜欢写代码、整理知识，也会把偶尔冒出来的灵感做成小东西。', 1 FROM dialogue_intent WHERE code = 'identity'
UNION ALL SELECT id, '这里会收集 skynamecat 的实验、作品和持续打磨的小项目；具体内容会逐步补齐。', 1 FROM dialogue_intent WHERE code = 'projects'
UNION ALL SELECT id, '庞菠菠是住在网站里的 3D 小伙伴。她会散步、休息、玩手机，也能跟着音乐戴上耳机。', 1 FROM dialogue_intent WHERE code = 'pangbobo'
UNION ALL SELECT id, '可以通过页面上的 GitHub 找到 skynamecat；公开渠道更方便持续跟进。', 1 FROM dialogue_intent WHERE code = 'contact'
UNION ALL SELECT id, '听歌是庞菠菠的日常之一。播放音乐时，她会戴着耳机边走边听。', 1 FROM dialogue_intent WHERE code = 'music'
UNION ALL SELECT id, '极简模式专注于对话和内容；标准模式会展示更完整的页面与庞菠菠。', 1 FROM dialogue_intent WHERE code = 'site_mode'
UNION ALL SELECT id, '下次见。庞菠菠会继续在这里慢慢散步。', 1 FROM dialogue_intent WHERE code = 'farewell'
UNION ALL SELECT id, '这个问题我暂时还不会回答，不过已经记下来了。你也可以换个说法试试。', 2 FROM dialogue_intent WHERE code = 'fallback'
UNION ALL SELECT id, '我现在还是预制对话版，正在一点点学习网站里该知道的事情。', 1 FROM dialogue_intent WHERE code = 'fallback';
