return {enabled:sample.config.enabled,hero:api.App.ConfigMgr.getHeroInfoById(sample.config.hero.heroId),
 chapter:api.App.ConfigMgr.getChapterInfoById(sample.config.sample.chapterId),
 models:api.App.ConfigMgr._cfgs.hero_model_cfg,skills:api.App.ConfigMgr._cfgs.skill_cfg,
 errors:sample.errors};
