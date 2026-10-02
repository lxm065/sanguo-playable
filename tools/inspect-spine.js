return sample.assets.skeleton().then(data=>{
  const runtime=data.getRuntimeData();
  return {valid:!!runtime,animations:runtime?.animations?.map(a=>({name:a.name,duration:a.duration})),textures:data.textureNames};
});
