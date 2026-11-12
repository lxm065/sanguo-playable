'use strict';

/** 在开始构建前验证工程身份，阻止损坏或被简化的配置进入发布流程。 */
function validate(project, policy) {
 if (!policy?.appid || !policy.compileType || !Array.isArray(policy.babelIgnore) || !policy.babelIgnore.length) throw Error('缺少微信发布工程策略');
 if (project.appid !== policy.appid || project.compileType !== policy.compileType || !project.setting) throw Error('微信工程配置无效：请检查 AppID、compileType 和 setting');
}

/** 合并编译排除项，让已编译的运行库保留原始语义，业务代码仍正常增强编译。 */
function prepare(project, policy) {
 validate(project, policy);
 const babelSetting = project.setting.babelSetting || {};
 return {...project, setting: {...project.setting, babelSetting: {...babelSetting, ignore: [...new Set([...(babelSetting.ignore || []), ...policy.babelIgnore])]}}};
}

/** 核查最终发布配置，避免后续步骤意外丢失运行库编译隔离。 */
function verify(project, policy) {
 validate(project, policy);
 for (const pattern of policy.babelIgnore) if (!project.setting.babelSetting?.ignore?.includes(pattern)) throw Error('微信发布配置缺少 Babel 排除项：' + pattern);
}

module.exports = {prepare, verify};
