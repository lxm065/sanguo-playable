import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

/** 创建独立建模和动画工作室；游戏仅消费烘焙产物，不依赖 Three.js。 */
export async function createStudio() {
  const cfg = await (await fetch('/config')).json();
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera();
  const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, preserveDrawingBuffer:true});
  renderer.setPixelRatio(1); renderer.setClearColor(0,0); document.body.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffe9ce,0x4a5268,2));
  const light = new THREE.DirectionalLight(0xfff0d8,2.7); light.position.set(-3,6,5); scene.add(light);
  const rim = new THREE.DirectionalLight(0xb6d6ff,1.2); rim.position.set(3,3,-4); scene.add(rim);
  let rig, hero, nodes, materials, fittedSpan;
  /** 以命名关节构建刚体骨架，GLB 保存相同层级和独立动作轨道。 */
  function joint(parent,name,x,y,z) { const n=new THREE.Group(); n.name=name; n.position.set(x,y,z); parent.add(n); nodes[name]=n; return n; }
  /** 共享哑光材质以保留低多边形明暗，减少导出材质数量。 */
  function material(color) { return materials[color] ||= new THREE.MeshStandardMaterial({color,roughness:0.86,metalness:0.12,flatShading:true}); }
  /** 将基础几何附着到关节；位置和缩放直接保存在可编辑三维源文件中。 */
  function mesh(parent,geometry,color,p=[0,0,0],s=[1,1,1]) { const m=new THREE.Mesh(geometry,material(color));m.position.set(...p);m.scale.set(...s);parent.add(m);return m; }
  /** 制作有明确棱线的甲片、衣带和武器配件。 */
  function box(p,c,pos,scale) { return mesh(p,new THREE.BoxGeometry(1,1,1),c,pos,scale); }
  /** 圆台用于肌肉、护腕、靴子和分层盔甲。 */
  function cone(p,c,pos,top,bottom,height) { return mesh(p,new THREE.CylinderGeometry(top,bottom,height,cfg.mesh.radialSegments),c,pos); }
  /** 按路径生成有厚度的弓臂、弓弦和金属饰件。 */
  function tube(p,c,points,radius) { return mesh(p,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),20,radius,5,false),c); }
  /** 将二维刃形挤出为真正有厚度的三维刀刃。 */
  function blade(p,c,points,depth) {const s=new THREE.Shape();s.moveTo(...points[0]);for(const v of points.slice(1))s.lineTo(...v);s.closePath();return mesh(p,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false}),c,[0,0,-depth/2]);}
  /** 创建独立英雄：身份配色、头饰、身形和武器均由英雄配置决定。 */
  function build(id) {
    if(rig){rig.traverse(n=>n.geometry?.dispose());scene.remove(rig);Object.values(materials).forEach(m=>m.dispose());}
    hero=cfg.heroes[id]; if(!hero)throw Error('未知英雄 '+id); nodes={};materials={};
    rig=joint(scene,'root',0,0,0);rig.userData={heroId:id,name:hero.name,authorship:'原创程序化低多边形网格与关节动画'};
    const h=hero,w=h.width,body=joint(rig,'body',0,1.13,0);
    cone(body,h.armor,[0,.35,0],.36*w,.29*w,.65).scale.z=.64;
    cone(body,h.cloth,[0,-.18,0],.29*w,.4*w,.47).scale.z=.72;
    box(body,h.metal,[0,.08,0],[.64*w,.1,.44]);box(body,h.trim,[0,.08,.24],[.15,.14,.05]);
    if(h.weapon==='staff') {
      cone(body,h.armor,[0,-.46,0],.29,.42,1).scale.z=.78;
      for(const side of [-1,1])box(body,h.trim,[side*.16,-.35,.29],[.055,.86,.025]).rotation.z=side*.1;
      box(body,h.cloth,[0,.34,.245],[.1,.58,.025]);
    } else {
      for(let row=0;row<cfg.mesh.armorRows;row++)for(let col=0;col<cfg.mesh.armorColumns;col++) {
        const x=(col-(cfg.mesh.armorColumns-1)/2)*.115*w;
        box(body,row%2?h.metal:h.armor,[x,.23+row*.12,.22-Math.abs(x)*.12],[.108*w,.105,.05]);
        box(body,h.trim,[x,.27+row*.12,.25-Math.abs(x)*.12],[.022,.016,.012]);
      }
      for(const side of [-1,1]) { const skirt=box(body,h.metal,[side*.24,-.24,.17],[.22,.35,.08]);skirt.rotation.z=side*.18; }
    }
    for(const side of [-1,1]) {
      const leg=joint(body,side<0?'legL':'legR',side*.17*w,-.29,0);
      cone(leg,h.cloth,[0,-.23,0],.115,.09,.46);
      cone(leg,h.metal,[0,-.58,.015],.12,.1,.35);box(leg,h.hair,[0,-.77,.075],[.22,.15,.37]);
      box(leg,h.trim,[0,-.43,.11],[.15,.11,.055]);
      const arm=joint(body,side<0?'armL':'armR',side*.42*w,.55,0);
      cone(arm,h.weapon==='glaive'?h.metal:h.armor,[0,-.07,0],.2,.235,.24).scale.z=.82;
      cone(arm,h.weapon==='sabers'?h.skin:h.cloth,[0,-.27,0],.115,.09,.33);
      const fore=joint(arm,side<0?'foreL':'foreR',0,-.39,0);
      cone(fore,h.metal,[0,-.13,0],.11,.085,.25);cone(fore,h.trim,[0,-.24,0],.105,.105,.055);
      mesh(fore,new THREE.IcosahedronGeometry(.11,1),h.skin,[0,-.31,0],[.8,1,1]);
      if(h.weapon==='sabers')for(let j=0;j<3;j++) {
        mesh(arm,new THREE.SphereGeometry(.045,6,4),h.trim,[side*.12,-.08+j*.095,.14]);
      }
    }
    const head=joint(body,'head',0,.82,0);
    cone(head,h.skin,[0,-.05,0],.105,.12,.22);
    mesh(head,new THREE.SphereGeometry(1,cfg.mesh.headSegments,7),h.skin,[0,.15,.015],[.205,.255,.18]);
    mesh(head,new THREE.SphereGeometry(1,10,5,0,Math.PI*2,0,Math.PI*.56),h.weapon==='staff'||h.weapon==='sabers'?h.cloth:h.metal,[0,.24,0],[.235,.22,.205]);
    cone(head,h.weapon==='staff'?h.armor:h.trim,[0,.26,0],.237,.237,.065).scale.z=.9;
    for(const side of [-1,1]) {
      box(head,h.hair,[side*.09,.2,.174],[.095,.028,.035]).rotation.z=side*.13;
      box(head,'#eee2c7',[side*.088,.15,.182],[.071,.025,.015]);box(head,h.hair,[side*.085,.15,.195],[.026,.025,.01]);
      mesh(head,new THREE.IcosahedronGeometry(.055,0),h.skin,[side*.21,.09,0],[.65,1,.7]);
      if(h.weapon==='bow'||h.weapon==='glaive')box(head,h.metal,[side*.19,.025,0],[.055,.23,.17]);
    }
    mesh(head,new THREE.ConeGeometry(.048,.115,4),h.skin,[0,.075,.2]).rotation.x=Math.PI/2;
    box(head,h.hair,[0,-.003,.177],[.115,.025,.023]);
    const beard=cone(head,h.hair,[0,-.045-h.beard/2,.105],.13,.025,h.beard);beard.rotation.x=-.12;
    if(h.weapon==='staff') {cone(head,h.armor,[0,.46,0],.11,.19,.35);box(head,h.trim,[0,.4,.18],[.045,.21,.015]);}
    else if(h.weapon==='sabers') {for(const side of [-1,1])box(head,h.cloth,[side*.065,.12,-.21],[.09,.4,.04]).rotation.z=side*.22;}
    else {for(let i=0;i<4;i++){const plume=mesh(head,new THREE.SphereGeometry(1,6,4),h.plume,[0,.45+i*.055,-i*.045],[.055,.16,.065]);plume.rotation.x=-.3-i*.15;}}
    if(h.cape){const cape=joint(body,'cape',0,.61,-.19);const cloth=cone(cape,h.cloth,[0,-.55,-.06],.26*w,.4*w,1.1);cloth.scale.z=.13;cloth.rotation.x=.17;}
    const left=nodes.foreL,right=nodes.foreR;
    if(h.weapon==='bow') {
      const bow=joint(left,'weapon',0,-.3,.06);
      tube(bow,h.metal,[[0,-.57,0],[0,-.35,.21],[0,0,.27],[0,.35,.21],[0,.57,0]],.035);
      tube(bow,h.trim,[[0,-.57,0],[0,0,-.02],[0,.57,0]],.006);
      box(bow,h.trim,[0,0,.25],[.07,.2,.065]);
      cone(body,h.cloth,[.25,.22,-.3],.11,.09,.66).rotation.z=-.2;
      for(let i=0;i<4;i++){box(body,h.metal,[.17+i*.05,.62,-.31],[.018,.48,.018]);box(body,h.plume,[.17+i*.05,.83,-.31],[.055,.13,.012]);}
      const arrow=joint(right,'arrow',0,-.31,.14);box(arrow,h.metal,[0,0,.27],[.018,.018,.64]);
      mesh(arrow,new THREE.ConeGeometry(.04,.12,4),h.trim,[0,0,.62]).rotation.x=Math.PI/2;
    } else if(h.weapon==='sabers') {
      for(const [i,hand] of [left,right].entries()) {
        const sword=joint(hand,'saber'+i,0,-.3,0);sword.rotation.x=-Math.PI/2;
        box(sword,h.hair,[0,.06,0],[.07,.25,.07]);box(sword,h.trim,[0,.2,0],[.25,.06,.09]);
        blade(sword,'#bacbd0',[[-.055,.2],[.065,.2],[.14,.8],[.04,1.0],[-.04,.76]],.04);
      }
    } else if(h.weapon==='staff') {
      const staff=joint(right,'weapon',0,-.32,0);
      cone(staff,h.metal,[0,.3,0],.028,.04,2.2);
      mesh(staff,new THREE.TorusGeometry(.14,.025,5,10),h.trim,[0,1.48,0]);
      mesh(staff,new THREE.IcosahedronGeometry(.085,0),'#78c9c0',[0,1.48,0]);
      for(const side of [-1,1]){const flag=box(staff,h.armor,[side*.12,1.14,0],[.075,.4,.02]);flag.rotation.z=side*.15;}
    } else {
      const weapon=joint(right,'weapon',0,-.31,0);weapon.rotation.z=-.18;
      cone(weapon,h.hair,[0,.1,0],.037,.037,1.65);
      for(const y of [-.5,.6])cone(weapon,h.trim,[0,y,0],.055,.055,.13);
      blade(weapon,'#b4becb',[[-.04,.78],[.16,.84],[.32,1.15],[.23,1.43],[.07,1.22],[-.04,1.18]],.06);
      box(weapon,h.plume,[-.07,.72,0],[.12,.35,.06]);
    }
    rig.scale.x=w;fittedSpan=cfg.camera.span;pose('idle',0);return {id,meshes:countMeshes(),joints:Object.keys(nodes)};
  }
  /** 统计真实网格，记录建模产物而非将头像冒充模型。 */
  function countMeshes(){let count=0;rig.traverse(n=>{if(n.isMesh)count++;});return count;}
  /** 重置关节后按动作时间计算姿态，保证烘焙顺序不会污染动画。 */
  function pose(action,t) {
    for(const n of Object.values(nodes))if(!['weapon','saber0','saber1'].includes(n.name))n.rotation.set(0,0,0);
    rig.position.set(0,0,0);nodes.body.position.y=1.13;
    nodes.armL.rotation.z=-.13;nodes.armR.rotation.z=.13;
    const phase=t/cfg.motion[action],wave=Math.sin(phase*Math.PI*2),hit=Math.sin(Math.min(1,phase)*Math.PI);
    if(action==='idle'){nodes.body.position.y+=cfg.motion.breath*wave;nodes.head.rotation.y=wave*.06;}
    if(action==='run'){nodes.legL.rotation.x=wave*cfg.motion.stride;nodes.legR.rotation.x=-wave*cfg.motion.stride;nodes.armL.rotation.x=-wave*cfg.motion.armSwing;nodes.armR.rotation.x=wave*cfg.motion.armSwing;nodes.body.position.y+=Math.abs(wave)*.055;nodes.body.rotation.x=.1;}
    if(action==='skill1'||action==='skill2') {
      nodes.body.rotation.y=hit*(hero.weapon==='bow'?-.3:.5);nodes.body.rotation.x=hit*.08;
      if(hero.weapon==='bow'){nodes.armL.rotation.x=-1.35*hit;nodes.armL.rotation.z=-.25*hit;nodes.armR.rotation.x=-1.3*hit;nodes.foreR.rotation.y=-1.15*hit;nodes.foreR.rotation.x=-.6*hit;}
      if(hero.weapon==='sabers'){nodes.armR.rotation.x=-2.3*hit;nodes.armL.rotation.x=-(action==='skill2'?2.0:.5)*hit;nodes.armR.rotation.z=.8*hit;nodes.foreR.rotation.x=-.55*hit;}
      if(hero.weapon==='staff'){nodes.armR.rotation.x=-.45*hit;nodes.armL.rotation.x=-1.65*hit;nodes.foreL.rotation.x=-.3*hit;nodes.head.rotation.x=-.15*hit;}
      if(hero.weapon==='glaive'){nodes.armR.rotation.x=-1.8*hit;nodes.armR.rotation.z=-.45*hit;nodes.armL.rotation.x=-1.05*hit;nodes.foreL.rotation.z=-.8*hit;}
      if(action==='skill2'){nodes.body.rotation.y+=Math.sin(phase*2*Math.PI)*.35;nodes.legR.rotation.x=-.2*hit;}
    }
    if(action==='dead'){const fall=Math.min(1,phase*1.4);rig.rotation.x=-fall*Math.PI*.49;rig.position.y=.14*fall;nodes.armL.rotation.z=-fall*.65;nodes.armR.rotation.z=fall*.8;nodes.legL.rotation.x=.25*fall;}
    if(nodes.cape)nodes.cape.rotation.x=.08+wave*.08;
    rig.updateMatrixWorld(true);
  }
  /** 使用固定正交镜头渲染透明多方向帧，完整保留长武器与倒地姿态。 */
  function frame(action,t,degrees,size,portrait=false) {
    pose(action,t);const c=portrait?cfg.portrait:cfg.camera,span=portrait?c.span:fittedSpan;
    camera.left=-span/2;camera.right=span/2;camera.top=span/2;camera.bottom=-span/2;camera.near=.1;camera.far=50;
    const a=portrait?c.angle:degrees*Math.PI/180,e=portrait?.14:cfg.camera.elevation;
    camera.position.set(Math.sin(a)*cfg.camera.distance,c.targetY+cfg.camera.distance*e,Math.cos(a)*cfg.camera.distance);
    camera.lookAt(0,c.targetY,0);camera.updateProjectionMatrix();renderer.setSize(size,size);
    renderer.setClearColor(portrait?cfg.portrait.background:0,portrait?1:0);renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');
  }
  /** 导出包含五套关节关键帧的 GLB，便于后续在 Blender 等工具继续精修。 */
  async function exportGlb(fps) {
    const clips=[];
    for(const action of ['idle','run','skill1','skill2','dead']) {
      const duration=cfg.motion[action],count=Math.ceil(duration*fps),times=[],samples={};
      for(const name of Object.keys(nodes))samples[name]={position:[],quaternion:[]};
      for(let i=0;i<=count;i++){const t=i/count*duration;times.push(t);pose(action,t);for(const [name,n] of Object.entries(nodes)){samples[name].position.push(...n.position.toArray());samples[name].quaternion.push(...n.quaternion.toArray());}}
      const tracks=[];for(const [name,s] of Object.entries(samples)){tracks.push(new THREE.VectorKeyframeTrack(name+'.position',times,s.position),new THREE.QuaternionKeyframeTrack(name+'.quaternion',times,s.quaternion));}
      clips.push(new THREE.AnimationClip(action,duration,tracks));
    }
    pose('idle',0);const data=await new GLTFExporter().parseAsync(rig,{binary:true,animations:clips});
    return Array.from(new Uint8Array(data));
  }
  /** 遍历全部动画和朝向的三维包围盒，统一扩大镜头，避免长武器和倒地帧裁切。 */
  function fit(fps,degrees) {
    let extent=cfg.camera.span/2;const v=new THREE.Vector3();
    for(const angle of degrees)for(const action of ['idle','run','skill1','skill2','dead']) {
      const count=Math.ceil(cfg.motion[action]*fps);
      for(let i=0;i<=count;i++) {
        pose(action,i/count*cfg.motion[action]);const a=angle*Math.PI/180,c=cfg.camera;
        camera.position.set(Math.sin(a)*c.distance,c.targetY+c.distance*c.elevation,Math.cos(a)*c.distance);camera.lookAt(0,c.targetY,0);camera.updateMatrixWorld(true);
        rig.traverse(n=>{if(!n.isMesh)return;n.geometry.computeBoundingBox();const b=n.geometry.boundingBox;
          for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){v.set(x,y,z).applyMatrix4(n.matrixWorld).applyMatrix4(camera.matrixWorldInverse);extent=Math.max(extent,Math.abs(v.x),Math.abs(v.y));}
        });
      }
    }
    fittedSpan=extent*2*1.08;return fittedSpan;
  }
  return {build,frame,exportGlb,fit};
}
