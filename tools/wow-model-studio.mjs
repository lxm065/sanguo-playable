import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';

/** 按源关键帧插值，四元数球面插值避免旋转线性插值导致蒙皮收缩。 */
export function sampleTrack(track,ms,fallback,quaternion=false){
  if(!track.times.length)return fallback;
  if(track.globalDuration)ms%=track.globalDuration;
  const times=track.times,values=track.values;
  if(ms<=times[0])return values[0];if(ms>=times.at(-1))return values.at(-1);
  let i=0;while(times[i+1]<ms)i++;
  const t=track.interpolation===0?0:(ms-times[i])/(times[i+1]-times[i]||1);
  if(quaternion)return new THREE.Quaternion(...values[i]).normalize().slerp(new THREE.Quaternion(...values[i+1]).normalize(),t).toArray();
  return values[i].map((v,k)=>v+(values[i+1][k]-v)*t);
}

/** 从已校验的本地导出数据创建蒙皮渲染工作室，无线上资源依赖。 */
export async function createStudio(){
  const cfg=await(await fetch('/config')).json(),scene=new THREE.Scene(),camera=new THREE.OrthographicCamera();
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(1);renderer.setClearColor(0,0);document.body.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xfff1de,0x626f83,cfg.lighting.ambient));
  const light=new THREE.DirectionalLight(0xffefdc,cfg.lighting.key);light.position.set(5,8,4);scene.add(light);
  const rim=new THREE.DirectionalLight(0xb7d5ff,cfg.lighting.rim);rim.position.set(-4,4,-5);scene.add(rim);
  let root,data,bones,skeleton,bodyMeshes,allMeshes,center,height,span;
  const textures=new Map();
  /** 加载由原始 BLP 无损转换的贴图，保持 M2 的 UV 朝向。 */
  async function texture(file){
    if(!textures.has(file)){const t=await new THREE.TextureLoader().loadAsync('/asset/'+file);t.flipY=false;t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;textures.set(file,t);}
    return textures.get(file);
  }
  /** 构造共享顶点、独立子网格材质，按配置只启用所选外观部件。 */
  async function meshes(source,parent,skin=false){
    const result=[];
    for(const [i,part] of source.meshes.entries()){
      if(!part.visible)continue;
      const g=source.geometries[part.geometry],geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(g.positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(g.normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(g.uv,2));geometry.setIndex(part.indices);
      if(skin){geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(source.boneIndices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(source.weights,4));}
      const material=new THREE.MeshStandardMaterial({map:await texture(part.textureFile),roughness:1,metalness:0,side:THREE.DoubleSide,alphaTest:part.blend===1?.5:0,transparent:part.blend>=2,depthWrite:part.blend<2});
      const mesh=skin?new THREE.SkinnedMesh(geometry,material):new THREE.Mesh(geometry,material);mesh.name=(skin?'body':'weapon')+'-'+i;mesh.frustumCulled=false;parent.add(mesh);if(skin)mesh.bind(skeleton);result.push(mesh);
    }
    return result;
  }
  /** 保持真实骨骼枢轴和父子关系，武器使用源附件点随手部动作移动。 */
  async function load(id){
    if(root){root.traverse(n=>{n.geometry?.dispose();n.material?.dispose();});scene.remove(root);skeleton?.dispose();}
    for(const t of textures.values())t.dispose();textures.clear();
    data=await(await fetch('/asset/'+id+'.json')).json();root=new THREE.Group();root.name=id;scene.add(root);
    bones=data.body.bones.map((b,i)=>{const n=new THREE.Bone();n.name='bone'+i;const p=b.parent<0?[0,0,0]:data.body.bones[b.parent].pivot;n.position.set(...b.pivot.map((v,k)=>v-p[k]));return n;});
    for(const [i,b] of data.body.bones.entries())(b.parent<0?root:bones[b.parent]).add(bones[i]);
    root.updateMatrixWorld(true);skeleton=new THREE.Skeleton(bones);skeleton.calculateInverses();
    bodyMeshes=await meshes(data.body,root,true);allMeshes=[...bodyMeshes];
    for(const weapon of data.weapons){
      const attachment=data.body.attachments.find(a=>a.id===weapon.config.attachment);if(!attachment)throw Error('缺少武器附件点');
      const holder=new THREE.Group(),pivot=data.body.bones[attachment.bone].pivot;holder.name='attachment'+weapon.config.attachment;
      holder.position.set(...attachment.position.map((v,k)=>v-pivot[k]));holder.rotation.set(...weapon.config.rotation.map(v=>v*Math.PI/180));holder.scale.setScalar(weapon.config.scale);bones[attachment.bone].add(holder);
      allMeshes.push(...await meshes(weapon.data,holder));
    }
    pose('idle',0);
    const box=bounds(bodyMeshes);center=box.getCenter(new THREE.Vector3());height=box.max.y-box.min.y;span=height*2;
    return {id,height,center:center.toArray(),bones:bones.length,meshes:allMeshes.length,actions:data.body.actions};
  }
  /** 计算蒙皮后有效顶点的包围盒，排除未启用的服装部件。 */
  function bounds(list){const box=new THREE.Box3(),v=new THREE.Vector3();for(const mesh of list)for(const i of new Set(mesh.geometry.index.array)){mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);box.expandByPoint(v);}return box;}
  /** 只使用 M2 内原生平移、旋转和缩放轨道，绝不以整体晃动代替骨骼动作。 */
  function pose(action,seconds){
    for(const [i,b] of data.body.bones.entries()){
      const track=b.tracks[action],p=b.parent<0?[0,0,0]:data.body.bones[b.parent].pivot;
      const translation=sampleTrack(track.translation,seconds*1000,[0,0,0]);
      bones[i].position.set(...b.pivot.map((v,k)=>v-p[k]+translation[k]));
      bones[i].quaternion.fromArray(sampleTrack(track.rotation,seconds*1000,[0,0,0,1],true)).normalize();
      bones[i].scale.fromArray(sampleTrack(track.scale,seconds*1000,[1,1,1]));
    }
    root.updateMatrixWorld(true);skeleton.update();
  }
  /** 统一镜头投影；角色源正面为 +X，东向帧从 +Z 观察。 */
  function cameraAt(degrees,portrait=false){
    const angle=degrees*Math.PI/180,target=center.clone();
    if(portrait)target.y+=height*.32;
    camera.position.copy(target).add(new THREE.Vector3(Math.cos(angle)*height*4,height*4*(portrait?cfg.camera.portraitElevation:cfg.camera.elevation),-Math.sin(angle)*height*4));camera.lookAt(target);camera.near=.01;camera.far=height*30;camera.updateMatrixWorld(true);
  }
  /** 逐帧扫描全部方向的实际蒙皮顶点，用统一比例保留完整攻击与倒地动作。 */
  function fit(directions){
    let extent=0;const v=new THREE.Vector3();
    for(const [action,entry] of Object.entries(data.body.actions)){
      const duration=Math.min(entry.duration,cfg.maxDuration[action]||Infinity),count=Math.ceil(duration*cfg.fps);
      for(let f=0;f<=count;f++){
        pose(action,f/count*duration);
        for(const degree of directions){cameraAt(degree);for(const mesh of allMeshes)for(const i of new Set(mesh.geometry.index.array)){mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld).applyMatrix4(camera.matrixWorldInverse);extent=Math.max(extent,Math.abs(v.x),Math.abs(v.y));}}
      }
    }
    span=extent*2*cfg.camera.margin;return {span,height,center:center.toArray()};
  }
  /** 输出透明模型帧或同模型肖像，使游戏头像与战场形象一致。 */
  function frame(action,time,direction,size,portrait=false){
    pose(action,time);cameraAt(direction,portrait);const s=portrait?height*cfg.camera.portraitSpanRatio:span;
    camera.left=-s/2;camera.right=s/2;camera.top=s/2;camera.bottom=-s/2;camera.updateProjectionMatrix();
    renderer.setSize(size,size);renderer.setClearColor(portrait?'#554b39':0,portrait?1:0);renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');
  }
  /** 记录动作造成的顶点实际形变，验证模型没有停留在基础姿态。 */
  function movement(action){pose(action,0);const before=[];const v=new THREE.Vector3();for(const m of bodyMeshes)for(const i of new Set(m.geometry.index.array)){m.getVertexPosition(i,v);before.push(v.clone());}pose(action,data.body.actions[action].duration*.5);let max=0,j=0;for(const m of bodyMeshes)for(const i of new Set(m.geometry.index.array)){m.getVertexPosition(i,v);max=Math.max(max,v.distanceTo(before[j++]));}return max;}
  /** 导出真实蒙皮与原始动作采样后的 GLB，作为可进一步精修的工程资产。 */
  async function exportGlb(){
    const clips=[];
    for(const [action,entry] of Object.entries(data.body.actions)){
      const count=Math.ceil(entry.duration*cfg.fps),times=[],values=bones.map(()=>({p:[],q:[],s:[]}));
      for(let i=0;i<=count;i++){const t=entry.duration*i/count;times.push(t);pose(action,t);bones.forEach((b,j)=>{values[j].p.push(...b.position.toArray());values[j].q.push(...b.quaternion.toArray());values[j].s.push(...b.scale.toArray());});}
      const tracks=[];values.forEach((v,i)=>tracks.push(new THREE.VectorKeyframeTrack('bone'+i+'.position',times,v.p),new THREE.QuaternionKeyframeTrack('bone'+i+'.quaternion',times,v.q),new THREE.VectorKeyframeTrack('bone'+i+'.scale',times,v.s)));clips.push(new THREE.AnimationClip(action,entry.duration,tracks));
    }
    pose('idle',0);return Array.from(new Uint8Array(await new GLTFExporter().parseAsync(root,{binary:true,animations:clips})));
  }
  return {load,frame,fit,movement,exportGlb};
}
