/** 本地预览配置；关闭 enabled 后恢复原登录流程。 */
module.exports = {
  enabled: false,
  allowedPlatforms: ['devtools'],
  autoEnter: true,
  nickname: '本地预览',
  username: 'offline-preview',
  roleUin: 1,
  job: 1,
  chapter: { chapter: 1, section: 1, layer: 1 },
  previewChapter: 1,
  buttonText: '离线预览',
  unavailableText: '离线预览：此功能需要游戏服务器',
};
