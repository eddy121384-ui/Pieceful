(()=>{var $t={dt:.008333333333333333,thrust:4.2,brake:2.3,rotSpeed:3.3,rotResponse:18,tumbleDecay:1.35,fuelThrust:8.5,fuelBrake:4.5,radius:.62,crashSpeed:3.6,restitution:.38,friction:.22,latchSpeed:5.2,grabCooldown:.55},gn=(i,t,e)=>i<t?t:i>e?e:i;function Xn(i){let t=i>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function Hc(i,t,e,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r),h=i-n,f=t-s,u=l*h+c*f,d=-c*h+l*f,m=gn(u,-a,a),v=gn(d,-o,o),g,p,M;if(m===u&&v===d){let S=a-Math.abs(u),b=o-Math.abs(d);S<b?(g=u<0?-1:1,p=0,m=g*a,M=e+S):(g=0,p=d<0?-1:1,v=p*o,M=e+b)}else{let S=u-m,b=d-v,T=Math.hypot(S,b);if(T>=e)return null;g=S/T,p=b/T,M=e-T}return{nx:l*g-c*p,ny:c*g+l*p,pen:M,px:n+l*m-c*v,py:s+c*m+l*v}}function Vc(i,t,e,n,s,r){let a=i-n,o=t-s,l=Math.hypot(a,o);if(l>=e+r)return null;let c=l>1e-6?a/l:1,h=l>1e-6?o/l:0;return{nx:c,ny:h,pen:e+r-l,px:n+c*r,py:s+h*r}}var Af=0;function Rf(i){i.id=Af++,i.x=i.x||0,i.y=i.y||0,i.rot=i.rot||0,i.vx=0,i.vy=0,i.w=0,i.shapes=i.shapes||[];for(let t of i.shapes)t.lx=t.lx||0,t.ly=t.ly||0,t.lrot=t.lrot||0,t.body=i,t.wx=0,t.wy=0,t.wrot=0;return i}function zc(i){let t=Math.cos(i.rot),e=Math.sin(i.rot);for(let n of i.shapes)n.wx=i.x+t*n.lx-e*n.ly,n.wy=i.y+e*n.lx+t*n.ly,n.wrot=i.rot+n.lrot}function Wo(i,t,e,n){return i.type==="circle"?Vc(t,e,n,i.wx,i.wy,i.r):Hc(t,e,n,i.wx,i.wy,i.wrot,i.w/2,i.h/2)}function Cf(i,t){return i.motion?i.motion(t):i}var vr=class{constructor(t){this.def=t,this.reset()}reset(){let t=this.def.build();this.stage=t,this.t=0,this.playT=0,this.started=!1,this.rng=Xn(t.seed||7),this.events=[],this.bodies=t.bodies.map(Rf);for(let n of this.bodies)n.motion&&Object.assign(n,n.motion(0)),zc(n);if(this.wells=t.wells||[],this.vents=t.vents||[],this.fields=t.fields||[],this.arcs=t.arcs||[],this.pickups=(t.pickups||[]).map(n=>({...n,taken:!1})),this.goals=t.goals,this.goalIndex=0,this.bounds=t.bounds,this.tide=t.tide||null,this.sun=t.sun||null,this.sun){this.sun.casters=[];for(let r of this.bodies)for(let a of r.shapes)a.shade&&this.sun.casters.push(a);let n=[[t.bounds.x0,t.bounds.y0],[t.bounds.x1,t.bounds.y0],[t.bounds.x0,t.bounds.y1],[t.bounds.x1,t.bounds.y1]].map(([r,a])=>r*this.sun.dx+a*this.sun.dy),s=this.sun.flare?this.sun.flare.width:0;this.sun.u0=Math.min(...n)-s,this.sun.u1=Math.max(...n)+s,this.flareCycle=-1,this.flareState="idle"}let e=t.start;this.player={x:e.x,y:e.y,vx:e.vx||0,vy:e.vy||0,angle:e.angle??0,turnRate:0,tumble:0,fuel:t.fuel??100,mass:1,thrusting:!1,braking:!1,turning:0,latch:null,latchCooldown:new Map,ghost:null,grabCooldown:0,ax:0,ay:0,lastImpact:0,nearMiss:0},this.npc=t.npc?{...t.npc,vx:t.npc.vx||0,vy:t.npc.vy||0,spin:t.npc.spin||.3,angle:t.npc.angle||0,carried:!1,r:.6}:null,this.state="play",this.cause=null,this.endT=0,this.stats={fuelUsed:0,bumps:0,maxSpeed:0}}get goal(){return this.goals[this.goalIndex]}emit(t,e={}){this.events.push({type:t,t:this.t,...e})}fail(t,e={}){if(this.state!=="play")return;this.state="lost",this.cause={kind:t,...e},this.endT=this.t;let n=this.player;n.latch&&(n.latch=null),this.emit("fail",{cause:t,...e})}win(){this.state==="play"&&(this.state="won",this.endT=this.t,this.emit("win",{goal:this.goal.type}))}forceAt(t,e,n,s){let r=0,a=0;for(let o of this.wells){let l=o.x-t,c=o.y-e,h=l*l+c*c,f=o.range||20;if(h>f*f)continue;let u=Math.sqrt(h),d=o.soft||1.2,m=1-Zi(gn((u-f*.6)/(f*.4),0,1)),v=o.gm/(h+d*d)*m;r+=l/(u||1)*v,a+=c/(u||1)*v}for(let o of this.fields)if(t>=o.x0&&t<=o.x1&&e>=o.y0&&e<=o.y1){let l=Math.min(t-o.x0,o.x1-t,e-o.y0,o.y1-e),c=gn(l/3,0,1);r+=o.ax*c,a+=o.ay*c}for(let o of this.vents){if(!Xo(o,n))continue;let l=Math.cos(o.dir),c=Math.sin(o.dir),h=t-o.x,f=e-o.y,u=l*h+c*f,d=-c*h+l*f;if(u<0||u>o.len||Math.abs(d)>o.width/2)continue;let m=(1-u/o.len)*.75+.25;r+=l*o.force*m,a+=c*o.force*m}if(this.tide){let o=this.tide(t,e);r+=o.ax,a+=o.ay}if(this.sun){let o=Pi(this.sun,t,e,n);r+=this.sun.dx*this.sun.accel*o,a+=this.sun.dy*this.sun.accel*o}return s.ax=r,s.ay=a,s}exposure(t,e,n=this.t){return this.sun?Pi(this.sun,t,e,n):0}stepFlare(){let t=this.sun.flare,e=an(this.sun,this.t);e.cycle!==this.flareCycle&&e.state!=="idle"&&(this.flareCycle=e.cycle,this.flareState="idle"),e.state!==this.flareState&&(e.state==="warn"?this.emit("flareWarn",{lead:t.warn}):e.state==="sweep"&&this.emit("flare"),this.flareState=e.state)}step(t){let e=$t.dt;this.t+=e;let n=this.player,s=this.state==="play";s&&!this.started&&(t.thrust||t.brake||t.turn)&&(this.started=!0,this.emit("start")),this.started&&s&&(this.playT+=e);for(let d of this.bodies){if(!d.motion)continue;let m=d.motion(this.t),v=d.motion(this.t-e);d.x=m.x,d.y=m.y,d.rot=m.rot,d.vx=(m.x-v.x)/e,d.vy=(m.y-v.y)/e,d.w=$i(m.rot,v.rot)/e,zc(d)}if(this.stage.update&&this.stage.update(this,e),this.sun&&this.sun.flare&&this.stepFlare(),this.state==="won"){this.stepDocked(e),this.stepNpc(e);return}let r=s?t:{turn:0,thrust:!1,brake:!1},a=r.turn*$t.rotSpeed;n.turnRate+=(a-n.turnRate)*Math.min(1,$t.rotResponse*e),n.tumble*=Math.exp(-(s?$t.tumbleDecay:.15)*e),n.angle+=(n.turnRate+n.tumble)*e,n.turning=r.turn,n.grabCooldown=Math.max(0,n.grabCooldown-e),n.ghost&&(n.ghost.t-=e)<=0&&(n.ghost=null);for(let[d,m]of n.latchCooldown)m-e<=0?n.latchCooldown.delete(d):n.latchCooldown.set(d,m-e);if(n.latch){this.stepLatched(r,e),this.afterMove(e);return}let o=0,l=0,c=n.fuel>0;n.thrusting=!!(r.thrust&&c);let h=Math.hypot(n.vx,n.vy);n.braking=!!(r.brake&&c&&h>.02);let f=1/n.mass;if(n.thrusting&&(o+=Math.cos(n.angle)*$t.thrust*f,l+=Math.sin(n.angle)*$t.thrust*f,this.useFuel($t.fuelThrust*e)),n.braking){let d=Math.min($t.brake*f,h/e);o-=n.vx/h*d,l-=n.vy/h*d,this.useFuel($t.fuelBrake*e)}(r.thrust||r.brake)&&!c&&s&&!this._dryWarned&&(this._dryWarned=!0,this.emit("dry"));let u=this.forceAt(n.x,n.y,this.t,If);n.ax=o+u.ax,n.ay=l+u.ay,n.vx+=n.ax*e,n.vy+=n.ay*e,n.x+=n.vx*e,n.y+=n.vy*e,this.collidePlayer(e),this.afterMove(e)}useFuel(t){let e=this.player,n=Math.min(e.fuel,t);e.fuel-=n,this.stats.fuelUsed+=n}afterMove(t){let e=this.player,n=Math.hypot(e.vx,e.vy);if(n>this.stats.maxSpeed&&(this.stats.maxSpeed=n),this.stepNpc(t),this.state!=="play")return;for(let r of this.wells)if(Math.hypot(e.x-r.x,e.y-r.y)<r.core+$t.radius*.4){this.fail("well",{well:r});return}for(let r of this.arcs)if(Nf(r,this.t)&&Df(e.x,e.y,r.x0,r.y0,r.x1,r.y1)<$t.radius+.25){this.fail("arc"),e.tumble+=9;return}if(this.sun&&this.sun.flare&&Of(this.sun,e.x,e.y,this.t)){this.fail("flare"),e.tumble+=7;return}for(let r of this.pickups)!r.taken&&Math.hypot(e.x-r.x,e.y-r.y)<1.4&&(r.taken=!0,e.fuel=Math.min(100,e.fuel+r.fuel),this.emit("pickup",{x:r.x,y:r.y,fuel:r.fuel}));let s=this.bounds;if(e.x<s.x0||e.x>s.x1||e.y<s.y0||e.y>s.y1){this.fail("void");return}this.checkGoal(t)}collidePlayer(t){let e=this.player,n=$t.radius;for(let s=0;s<3;s++){let r=!1;for(let a of this.bodies)if(!(a.ghost||e.ghost&&e.ghost.body===a))for(let o of a.shapes){if(o.sensor)continue;let l=Wo(o,e.x,e.y,n);if(!l)continue;r=!0;let c=a.vx-a.w*(l.py-a.y),h=a.vy+a.w*(l.px-a.x),f=e.vx-c,u=e.vy-h,d=f*l.nx+u*l.ny;if(e.x+=l.nx*l.pen,e.y+=l.ny*l.pen,d>=0)continue;let m=Math.hypot(f,u);if(this.state==="play"&&o.rail&&m<$t.latchSpeed&&!e.latchCooldown.has(o)){this.latch(o,l,f,u);return}if(this.state==="play"&&-d>(o.soft?99:$t.crashSpeed)){this.fail("impact",{speed:-d,x:l.px,y:l.py,nx:l.nx,ny:l.ny,style:o.style}),this.bounce(l,f,u,d,c,h,.55,!0);return}this.bounce(l,f,u,d,c,h,o.soft?.7:$t.restitution,!1)}if(!r)break}}bounce(t,e,n,s,r,a,o,l){let c=this.player,h=-t.ny,f=t.nx,u=e*h+n*f,d=u*(1-$t.friction),m=-s*o;c.vx=r+t.nx*m+h*d,c.vy=a+t.ny*m+f*d;let v=(u*.9+(this.rng()-.5)*-s*2.2)*(l?3.2:1);c.tumble+=v;let g=-s;g>.35||l?(this.stats.bumps++,this.emit(l?"crash":"bump",{x:t.px,y:t.py,nx:t.nx,ny:t.ny,strength:g,slide:Math.abs(u)})):Math.abs(u)>1.2&&this.emit("scrape",{x:t.px,y:t.py,nx:t.nx,ny:t.ny,slide:Math.abs(u)}),c.lastImpact=this.t}latch(t,e,n,s){let r=this.player,a=Math.cos(t.wrot),o=Math.sin(t.wrot),l=r.x-t.wx,c=r.y-t.wy,h=l*a+c*o,f=-o*l+a*c>=0?1:-1;h=gn(h,-t.w/2+.4,t.w/2-.4),r.latch={sh:t,s:h,sdot:n*a+s*o,side:f},r.thrusting=!1,r.braking=!1,r.tumble*=.3,this.emit("latch",{x:e.px,y:e.py,rel:Math.hypot(n,s)})}stepLatched(t,e){let n=this.player,s=n.latch,r=s.sh,a=r.body;if(t.thrust&&n.fuel>0){let S=Math.cos(r.wrot),b=Math.sin(r.wrot);n.vx+=-b*s.side*1.2,n.vy+=S*s.side*1.2,n.latch=null,n.latchCooldown.set(r,1),n.ghost={body:a,t:.45},this.emit("release",{speed:Math.hypot(n.vx,n.vy)});return}n.thrusting=!1,n.braking=!!t.brake;let o=Math.cos(r.wrot),l=Math.sin(r.wrot),c=-l*s.side,h=o*s.side,f=r.h/2+$t.radius+.03,u=r.wx+o*s.s+c*f,d=r.wy+l*s.s+h*f,m=u-a.x,v=d-a.y;s.sdot+=a.w*a.w*(m*o+v*l)*e,t.brake&&(s.sdot*=Math.exp(-5*e)),s.s+=s.sdot*e;let g=r.w/2-.4;(s.s>g||s.s<-g)&&(Math.abs(s.sdot)>1.5&&this.emit("clunk",{x:u,y:d,strength:Math.abs(s.sdot)}),s.s=gn(s.s,-g,g),s.sdot=0),u=r.wx+o*s.s+c*f,d=r.wy+l*s.s+h*f;let p=a.vx-a.w*(d-a.y),M=a.vy+a.w*(u-a.x);n.vx=p+o*s.sdot,n.vy=M+l*s.sdot,n.x=u,n.y=d,n.ax=0,n.ay=0;for(let S of this.bodies)if(!(S===a||S.ghost))for(let b of S.shapes){if(b.sensor)continue;let T=Wo(b,n.x,n.y,$t.radius);if(!T)continue;let w=S.vx-S.w*(T.py-S.y),R=S.vy+S.w*(T.px-S.x),x=(n.vx-w)*T.nx+(n.vy-R)*T.ny;n.latch=null,n.latchCooldown.set(r,.8),-x>$t.crashSpeed?(this.fail("impact",{speed:-x,x:T.px,y:T.py,nx:T.nx,ny:T.ny,style:b.style}),this.bounce(T,n.vx-w,n.vy-R,x,w,R,.55,!0)):(this.emit("knocked"),this.bounce(T,n.vx-w,n.vy-R,Math.min(x,0),w,R,$t.restitution,!1));return}}stepDocked(t){let e=this.player,n=this.goal,s=je(this,n),r=1-Math.exp(-4*t);e.x+=(s.x-e.x)*r,e.y+=(s.y-e.y)*r,e.vx=s.vx,e.vy=s.vy;let a=n.dockAngle??Math.PI/2;e.angle+=$i(a,e.angle)*r,e.tumble*=.9,e.turnRate*=.9,e.thrusting=!1,e.braking=!1}stepNpc(t){let e=this.npc;if(!e)return;let n=this.player;if(e.carried){let a=e.x-n.x,o=e.y-n.y,l=Math.hypot(a,o)||1,c=1.5,h=n.x+a/l*c,f=n.y+o/l*c,u=1-Math.exp(-7*t);e.x+=(h-e.x)*u,e.y+=(f-e.y)*u,e.vx=n.vx,e.vy=n.vy,e.angle+=e.spin*t,e.spin*=Math.exp(-.6*t);return}e.anchor&&(e.vx=Math.cos(this.t*.5)*.25,e.vy=Math.sin(this.t*.37)*.2);let s=this.forceAt(e.x,e.y,this.t,Pf);e.vx+=s.ax*t,e.vy+=s.ay*t,e.x+=e.vx*t,e.y+=e.vy*t,e.angle+=e.spin*t;for(let a of this.bodies)for(let o of a.shapes){if(o.sensor)continue;let l=Wo(o,e.x,e.y,e.r);if(!l)continue;e.x+=l.nx*l.pen,e.y+=l.ny*l.pen;let c=(e.vx-a.vx)*l.nx+(e.vy-a.vy)*l.ny;c<0&&(e.vx-=1.4*c*l.nx,e.vy-=1.4*c*l.ny,e.anchor=!1,e.spin+=(this.rng()-.5)*4,-c>1&&this.emit("npcbump",{x:l.px,y:l.py,strength:-c}))}if(this.state!=="play")return;for(let a of this.wells)if(Math.hypot(e.x-a.x,e.y-a.y)<a.core+.3){this.fail("npcwell");return}let r=this.bounds;if(e.x<r.x0||e.x>r.x1||e.y<r.y0||e.y>r.y1){this.fail("npcvoid");return}}checkGoal(t){let e=this.player,n=this.goal;if(!n)return;if(n.type==="rescue"){let o=this.npc,l=e.x-o.x,c=e.y-o.y,h=Math.hypot(l,c);if(h<$t.radius+o.r+.25){let f=e.vx-o.vx,u=e.vy-o.vy,d=Math.hypot(f,u);if(d<=n.maxSpeed)o.carried=!0,o.anchor=!1,e.mass=n.mass||1.9,e.vx=(e.vx+o.vx)/2,e.vy=(e.vy+o.vy)/2,this.emit("rescue",{x:o.x,y:o.y,rel:d,limit:n.maxSpeed}),this.goalIndex++;else if(e.grabCooldown<=0){let m=l/(h||1),v=c/(h||1),g=f*m+u*v;if(g<0){let p=-g*.9;e.vx+=m*p,e.vy+=v*p,o.vx-=m*p,o.vy-=v*p,o.anchor=!1,o.spin+=(this.rng()-.5)*6,e.tumble+=(this.rng()-.5)*5,e.grabCooldown=$t.grabCooldown,this.emit("shove",{x:o.x,y:o.y,rel:d,limit:n.maxSpeed})}}}return}let s=je(this,n),r=Math.hypot(e.vx-s.vx,e.vy-s.vy),a;if(n.shape==="box"){let o=Math.cos(-s.rot),l=Math.sin(-s.rot),c=e.x-s.x,h=e.y-s.y,f=o*c-l*h,u=l*c+o*h;a=Math.abs(f)<n.w/2&&Math.abs(u)<n.h/2}else a=Math.hypot(e.x-s.x,e.y-s.y)<n.r;a&&(r<=n.maxSpeed?(this.emit("capture",{x:s.x,y:s.y,rel:r,limit:n.maxSpeed,goalType:n.type}),this.goalIndex<this.goals.length-1?this.goalIndex++:this.win()):e.grabCooldown<=0&&(e.grabCooldown=$t.grabCooldown,e.tumble+=(this.rng()<.5?-1:1)*(2+r*.6),e.vx=s.vx+(e.vx-s.vx)*.82,e.vy=s.vy+(e.vy-s.vy)*.82,this.emit("slip",{x:s.x,y:s.y,rel:r,limit:n.maxSpeed,goalType:n.type})))}predict(t,e,n){let s=this.player,r=s.x,a=s.y,o=s.vx,l=s.vy;if(s.latch){let m=s.latch.sh;o+=-Math.sin(m.wrot)*s.latch.side*1.2,l+=Math.cos(m.wrot)*s.latch.side*1.2}let c=Math.floor(t/e);n.length=0;let h=4,f=e/h,u=$t.radius,d=s.latch?s.latch.sh.body:null;for(let m=1;m<=c;m++){for(let p=0;p<h;p++){let M=this.forceAt(r,a,this.t+(m-1)*e+p*f,Lf);o+=M.ax*f,l+=M.ay*f,r+=o*f,a+=l*f}let v=this.t+m*e,g={x:r,y:a,hit:null,danger:!1};this.sun&&(g.lit=Pi(this.sun,r,a,v),this.sun.flare&&g.lit>.5&&Bf(this.sun,r,a,v-e,v)&&(g.hit="flare",g.danger=!0));for(let p of this.wells)Math.hypot(r-p.x,a-p.y)<p.core+.3&&(g.hit="well",g.danger=!0);if(!g.hit)for(let p of this.bodies){if(p===d&&m*e<1.5)continue;let M=Cf(p,v),S=Math.cos(M.rot),b=Math.sin(M.rot);for(let T of p.shapes){if(T.sensor)continue;let w=M.x+S*T.lx-b*T.ly,R=M.y+b*T.lx+S*T.ly,x=T.type==="circle"?Vc(r,a,u,w,R,T.r):Hc(r,a,u,w,R,M.rot+T.lrot,T.w/2,T.h/2);if(!x)continue;let y=0,A=0;if(p.motion){let P=p.motion(v-.02);y=(M.x-P.x)/.02,A=(M.y-P.y)/.02;let F=$i(M.rot,P.rot)/.02;y-=F*(x.py-M.y),A+=F*(x.px-M.x)}let I=(o-y)*x.nx+(l-A)*x.ny;g.hit=T.rail&&Math.hypot(o-y,l-A)<$t.latchSpeed?"rail":"wall",g.danger=g.hit==="wall"&&-I>$t.crashSpeed,g.speed=-I;break}if(g.hit)break}if(n.push(g),g.hit)break}return n}},If={ax:0,ay:0},Pf={ax:0,ay:0},Lf={ax:0,ay:0};function Zi(i){return i*i*(3-2*i)}function $i(i,t){let e=i-t;for(;e>Math.PI;)e-=Math.PI*2;for(;e<-Math.PI;)e+=Math.PI*2;return e}function Xo(i,t){return((t+(i.phase||0))%i.period+i.period)%i.period<i.on}function Gc(i,t){let e=((t+(i.phase||0))%i.period+i.period)%i.period;if(e<i.on)return 1;let n=i.period-e;return n<1.2?1-n/1.2:0}function Nf(i,t){return((t+(i.phase||0))%i.period+i.period)%i.period<i.on}function Df(i,t,e,n,s,r){let a=s-e,o=r-n,l=a*a+o*o||1,c=gn(((i-e)*a+(t-n)*o)/l,0,1);return Math.hypot(i-(e+a*c),t-(n+o*c))}function je(i,t){if(!t.body)return{x:t.x,y:t.y,rot:t.rot||0,vx:0,vy:0};let e=i.bodies.find(o=>o.tag===t.body),n=Math.cos(e.rot),s=Math.sin(e.rot),r=e.x+n*t.x-s*t.y,a=e.y+s*t.x+n*t.y;return{x:r,y:a,rot:e.rot+(t.rot||0),vx:e.vx-e.w*(a-e.y),vy:e.vy+e.w*(r-e.x)}}function Uf(i,t,e,n,s,r,a,o,l,c){let h=-t,f=i,u=l-n,d=c-s,m=u*i+d*t,v=u*h+d*f,g=Math.cos(r),p=Math.sin(r),M=g*h+p*f,S=-p*h+g*f,b=g*i+p*t,T=-p*i+g*t,w=Math.abs(M)*a+Math.abs(S)*o,R=Math.abs(v)-w;if(R>=e*.5)return 1;let x=gn(v,-w,w),y=-1/0;for(let A=0;A<2;A++){let I=x*(A?S:M),P=A?T:b,F=A?o:a;if(Math.abs(P)<1e-9)continue;let k=(-F-I)/P,L=(F-I)/P,z=k<L?k:L;z>y&&(y=z)}return m<y?1:gn(.5+R/e,0,1)}function Ff(i,t,e,n,s,r,a,o){let l=a-n,c=o-s,h=l*i+c*t,f=-l*t+c*i,u=Math.abs(f)-r;if(u>=e*.5)return 1;let d=gn(f,-r,r);return h<-Math.sqrt(r*r-d*d)?1:gn(.5+u/e,0,1)}function Pi(i,t,e,n){let s=1,{dx:r,dy:a,pen:o}=i;for(let l of i.casters){let c=l.wx,h=l.wy,f=l.wrot,u=l.body;if(u.motion){let m=u.motion(n),v=Math.cos(m.rot),g=Math.sin(m.rot);c=m.x+v*l.lx-g*l.ly,h=m.y+g*l.lx+v*l.ly,f=m.rot+l.lrot}let d=l.type==="circle"?Ff(r,a,o,c,h,l.r,t,e):Uf(r,a,o,c,h,f,l.w/2,l.h/2,t,e);if(d<s&&(s=d,s<=0))return 0}return s}function an(i,t){let e=i.flare,n=t+(e.phase||0),s=Math.floor(n/e.period),r=n-s*e.period;if(r<e.warn)return{state:"warn",cycle:s,lead:e.warn-r,u:null};let a=r-e.warn;return a*e.speed<i.u1-i.u0?{state:"sweep",cycle:s,lead:0,u:i.u0+a*e.speed}:{state:"idle",cycle:s,lead:e.period-r,u:null}}function Of(i,t,e,n){let s=an(i,n);return s.state!=="sweep"?!1:Math.abs(t*i.dx+e*i.dy-s.u)<i.flare.width/2&&Pi(i,t,e,n)>.5}function Bf(i,t,e,n,s){let r=t*i.dx+e*i.dy,a=i.flare.width/2,o=an(i,n),l=an(i,s);return o.state==="sweep"&&Math.abs(r-o.u)<a||l.state==="sweep"&&Math.abs(r-l.u)<a?!0:o.state==="sweep"&&l.state==="sweep"&&o.cycle===l.cycle?(r-o.u)*(r-l.u)<=0:o.state==="sweep"&&l.state!=="sweep"?r>=o.u:o.state!=="sweep"&&l.state==="sweep"?r<=l.u:!1}var _r=i=>i<0?0:i>1?1:i,qo={right:0,up:Math.PI/2,left:Math.PI,down:-Math.PI/2},Ts=i=>typeof i=="string"?qo[i]:i,Wc=["hull","truss","strut","crate","door","frame","rail","hub","blade","shuttle","debris","rock","shield"];function Me(i,t,e,n,s=[]){for(let[r,a]of Object.entries(t)){let o=a.endsWith("?"),l=o?a.slice(0,-1):a,c=i[r];if(c===void 0){o||n.push(`${e}.${r}: required (${l})`);continue}let h=kf(c,l);h&&n.push(`${e}.${r}: ${h}`)}for(let r of Object.keys(i))!(r in t)&&!s.includes(r)&&n.push(`${e}: unknown field "${r}"`)}var xn=i=>typeof i=="number"&&Number.isFinite(i);function kf(i,t){if(t.startsWith("enum:"))return t.slice(5).split("|").includes(i)?null:`must be one of ${t.slice(5)}`;switch(t){case"num":return xn(i)?null:"must be a finite number";case"pos":return xn(i)&&i>0?null:"must be > 0";case"nonneg":return xn(i)&&i>=0?null:"must be >= 0";case"vec2":return Array.isArray(i)&&i.length===2&&i.every(xn)?null:"must be [x, y]";case"rect":return Array.isArray(i)&&i.length===4&&i.every(xn)&&i[2]>i[0]&&i[3]>i[1]?null:"must be [x0, y0, x1, y1] with x1 > x0 and y1 > y0";case"str":return typeof i=="string"&&i.length?null:"must be a non-empty string";case"bool":return typeof i=="boolean"?null:"must be true/false";case"angle":return xn(i)||i in qo?null:`must be radians or one of ${Object.keys(qo).join("/")}`;case"style":return Wc.includes(i)?null:`unknown style "${i}" (known: ${Wc.join(", ")})`;case"timeRef":return xn(i)||i===null||i&&typeof i.mover=="string"&&xn(i.x)?null:"must be seconds, null, or { mover, x, offset? }";case"cond":return i&&typeof i=="object"?null:"must be a condition object";case"any":return null;default:return`unknown schema type ${t}`}}var ws={box:{schema:{box:"rect",style:"style?",rail:"bool?",soft:"bool?",shade:"bool?"},build:i=>({type:"box",lx:(i.box[0]+i.box[2])/2,ly:(i.box[1]+i.box[3])/2,w:Math.abs(i.box[2]-i.box[0]),h:Math.abs(i.box[3]-i.box[1]),style:i.style||"hull"})},rect:{schema:{rect:"any",rot:"num?",style:"style?",rail:"bool?",soft:"bool?",shade:"bool?"},build:i=>({type:"box",lx:i.rect[0],ly:i.rect[1],w:i.rect[2],h:i.rect[3],...i.rot?{lrot:i.rot}:{},style:i.style||"hull"})},beam:{schema:{beam:"any",thick:"pos",style:"style?",rail:"bool?",soft:"bool?",shade:"bool?"},build:i=>{let[t,e,n,s]=i.beam,r=n-t,a=s-e;return{type:"box",lx:(t+n)/2,ly:(e+s)/2,w:Math.hypot(r,a),h:i.thick,lrot:Math.atan2(a,r),style:i.style||"strut"}}},circle:{schema:{circle:"any",style:"style?",rail:"bool?",soft:"bool?",shade:"bool?"},build:i=>({type:"circle",lx:i.circle[0],ly:i.circle[1],r:i.circle[2],style:i.style||"rock"})}};function Xc(i){return Object.keys(ws).find(t=>t in i)}function Yo(i){let t=ws[Xc(i)].build(i);return i.rail&&(t.rail=!0),i.soft&&(t.soft=!0),i.shade&&(t.shade=!0),t}function $o(i,t,e){let n=Xc(i);if(!n){e.push(`${t}: shape needs one of ${Object.keys(ws).join("/")}`);return}Me(i,ws[n].schema,t,e);let s=i[n];n==="rect"&&!(Array.isArray(s)&&s.length===4&&s.every(xn)&&s[2]>0&&s[3]>0)&&e.push(`${t}.rect: must be [cx, cy, w>0, h>0]`),n==="circle"&&!(Array.isArray(s)&&s.length===3&&s.every(xn)&&s[2]>0)&&e.push(`${t}.circle: must be [cx, cy, r>0]`),n==="beam"&&!(Array.isArray(s)&&s.length===4&&s.every(xn)&&(s[0]!==s[2]||s[1]!==s[3]))&&e.push(`${t}.beam: must be two distinct points [x0, y0, x1, y1]`)}var As={rotor:{schema:{type:"str",at:"vec2",omega:"num",phase:"num?"},build:i=>{let[t,e]=i.at,n=i.omega,s=i.phase||0;return{x:t,y:e,motion:r=>({x:t,y:e,rot:s+n*r})}}},linear:{schema:{type:"str",from:"vec2",vel:"vec2",rot:"num?"},build:i=>{let[t,e]=i.from,[n,s]=i.vel,r=i.rot||0;return{x:t,y:e,motion:a=>({x:t+n*a,y:e+s*a,rot:r}),timeAtX:a=>(a-t)/n}}},sweep:{schema:{type:"str",at:"vec2",amp:"vec2",period:"pos",phase:"num?",rot:"num?"},build:i=>{let[t,e]=i.at,[n,s]=i.amp,r=Math.PI*2/i.period,a=i.phase||0,o=i.rot||0;return{x:t+n*Math.sin(a),y:e+s*Math.sin(a),motion:l=>{let c=Math.sin(r*l+a);return{x:t+n*c,y:e+s*c,rot:o}}}}},"linear-decelerate":{schema:{type:"str",from:"vec2",speed:"pos",decelAt:"num",decel:"pos"},build:i=>{let[t,e]=i.from,n=i.speed,s=i.decelAt,r=i.decel,a=(s-t)/n,o=l=>{if(l<a)return t+n*l;let c=Math.min(l-a,n/r);return s+n*c-.5*r*c*c};return{x:t,y:e,motion:l=>({x:o(l),y:e,rot:0}),timeAtX:l=>(l-t)/n}}},orbit:{schema:{type:"str",center:"vec2",radii:"vec2",period:"pos",phase:"num?",spin:"num?"},build:i=>{let[t,e]=i.center,[n,s]=i.radii,r=i.period,a=i.phase||0,o=i.spin||0;return{x:t,y:e,motion:l=>{let c=a+l/r*Math.PI*2;return{x:t+Math.cos(c)*n,y:e+Math.sin(c)*s,rot:o*l+a}}}}},"cycle-door":{schema:{type:"str",at:"vec2",slide:"vec2",period:"pos",phase:"num?",openAt:"num?",closeAt:"num?",ramp:"pos?",warn:"vec2?"},build:i=>{let[t,e]=i.at,[n,s]=i.slide,r=i.period,a=i.phase||0,o=i.openAt??.02,l=i.closeAt??.6,c=i.ramp??.14,[h,f]=i.warn||[.42,.75],u=d=>{let m=(d+a)%r/r;return Zi(_r((m-o)/c))*(1-Zi(_r((m-l)/c)))};return{x:t,y:e,motion:d=>{let m=u(d);return{x:t+n*m,y:e+s*m,rot:0}},status:d=>{let m=(d+a)%r/r;return m>h&&m<f?2:u(d)>.9?1:0}}}},"window-door":{schema:{type:"str",at:"vec2",slide:"vec2",open:"timeRef",close:"timeRef",rampOpen:"pos?",rampClose:"pos?",warnLead:"nonneg?",warnLag:"nonneg?",openDelay:"nonneg?"},build:(i,t)=>{let[e,n]=i.at,[s,r]=i.slide,a=i.open===null?-1/0:t(i.open),o=t(i.close),l=i.rampOpen??1.4,c=i.rampClose??1.6,h=i.warnLead??1.5,f=i.warnLag??1.6,u=i.openDelay??1.2;return{x:e,y:n,motion:d=>{let m=Zi(_r((d-a)/l))*(1-Zi(_r((d-o)/c)));return{x:e+s*m,y:n+r*m,rot:0}},status:d=>d>o-h&&d<o+f?2:d>a+u&&d<o?1:0}}}},Mr={grab:{schema:{type:"str",at:"vec2",r:"pos",maxSpeed:"pos",face:"angle?",label:"str?",on:"str?"},label:"HANDHOLD"},"mag-plate":{schema:{type:"str",at:"vec2",r:"pos",maxSpeed:"pos",face:"angle?",label:"str?",on:"str?"},label:"MAG PLATE"},airlock:{schema:{type:"str",at:"vec2",dir:"enum:left|up",length:"pos?",height:"pos?",depth:"pos?",half:"pos?",maxSpeed:"pos?",label:"str?"},label:"AIRLOCK"},rescue:{schema:{type:"str",npc:"any",maxSpeed:"pos",mass:"pos?",label:"str?"},label:"RESCUE"}};function qc(i){if(i.type==="grab"||i.type==="mag-plate"){let t={type:"grab",shape:"circle",label:i.label||Mr[i.type].label,x:i.at[0],y:i.at[1],r:i.r,maxSpeed:i.maxSpeed,dockAngle:Ts(i.face??0)};return i.on&&(t.body=i.on),{goal:t}}if(i.type==="airlock"){let[t,e]=i.at,n=i.dir,s=i.depth??3.6,r=i.half??1.9,a=i.length??14,o=i.height??18,l=(f,u,d,m)=>ws.box.build({box:[f,u,d,m]}),c,h;return n==="left"?(c=[l(t,e+r,t+a,e+o/2),l(t,e-o/2,t+a,e-r),l(t+s,e-r,t+a,e+r)],h={x:t+s/2+.25,y:e,w:s-.5,h:r*2-.6,dockAngle:0}):(c=[l(t-o/2,e-a,t-r,e),l(t+r,e-a,t+o/2,e),l(t-r,e-a,t+r,e-s)],h={x:t,y:e-s/2-.25,w:r*2-.6,h:s-.5,dockAngle:-Math.PI/2}),{body:{shapes:c},goal:{type:"dock",shape:"box",label:i.label||"AIRLOCK",maxSpeed:i.maxSpeed??1.5,mouth:{x:t,y:e,dir:n},...h}}}if(i.type==="rescue"){let t=i.npc,e={type:"rescue",label:i.label||"RESCUE",maxSpeed:i.maxSpeed};return i.mass!==void 0&&(e.mass=i.mass),{goal:e,npc:{x:t.at[0],y:t.at[1],...t.anchor!==void 0?{anchor:t.anchor}:{},...t.spin!==void 0?{spin:t.spin}:{},...t.vel?{vx:t.vel[0],vy:t.vel[1]}:{}}}}throw new Error(`unknown goal type ${i.type}`)}var qe={well:{schema:{at:"vec2",gm:"pos",core:"pos",soft:"pos?",range:"pos?"},build:i=>({x:i.at[0],y:i.at[1],gm:i.gm,core:i.core,...i.soft!==void 0?{soft:i.soft}:{},...i.range!==void 0?{range:i.range}:{}})},field:{schema:{type:"enum:shear|constant",rect:"rect",accel:"vec2"},build:i=>({x0:i.rect[0],x1:i.rect[2],y0:i.rect[1],y1:i.rect[3],ax:i.accel[0],ay:i.accel[1],kind:i.type})},vent:{schema:{at:"vec2",dir:"angle",len:"pos",width:"pos",force:"pos",period:"pos",on:"pos",phase:"num?"},build:i=>({x:i.at[0],y:i.at[1],dir:Ts(i.dir),len:i.len,width:i.width,force:i.force,period:i.period,on:i.on,phase:i.phase||0})},tide:{schema:{base:"num",from:"num",gradient:"num"},build:i=>{let t=i.base,e=i.from,n=i.gradient;return s=>({ax:t+Math.max(0,s-e)*n,ay:0})}},pickup:{schema:{at:"vec2",fuel:"pos"},build:i=>({x:i.at[0],y:i.at[1],fuel:i.fuel})},sun:{schema:{dir:"angle",accel:"pos",penumbra:"pos?",flare:"any?"},flare:{period:"pos",warn:"pos",speed:"pos",width:"pos?",phase:"num?"},build:i=>{let t=Ts(i.dir),e={dir:t,dx:Math.cos(t),dy:Math.sin(t),accel:i.accel,pen:i.penumbra??.8};return i.flare&&(e.flare={period:i.flare.period,warn:i.flare.warn,speed:i.flare.speed,width:i.flare.width??2.4,phase:i.flare.phase||0}),e}}},Yc={deadline:{schema:{type:"str",at:"timeRef",grace:"nonneg?",failIf:"cond",cause:"str"}}};var br={started:i=>t=>t.started===i,speedAbove:i=>t=>Math.hypot(t.player.vx,t.player.vy)>i,slowerThan:i=>t=>Math.hypot(t.player.vx,t.player.vy)<i,xAbove:i=>t=>t.player.x>i,xBelow:i=>t=>t.player.x<i,yAbove:i=>t=>t.player.y>i,yBelow:i=>t=>t.player.y<i,vxAbove:i=>t=>t.player.vx>i,near:([i,t,e])=>n=>Math.hypot(n.player.x-i,n.player.y-t)<e,latched:i=>t=>!!t.player.latch===i,goalIndex:i=>t=>t.goalIndex===i,timeAbove:i=>t=>t.t>i,nearVent:({dx:i,yAbove:t})=>e=>e.vents.some(n=>Math.abs(e.player.x-n.x)<i&&e.player.y>t),phase:({period:i,from:t,to:e})=>n=>{let s=n.t%i;return s>t&&s<e},rotorAngle:({mover:i,mod:t,from:e,to:n})=>s=>{let a=(s.bodies.find(o=>o.tag===i).rot%t+t)%t;return a>e&&a<n},moverStatus:({mover:i,is:t})=>e=>e.bodies.find(n=>n.tag===i).status(e.t)===t,exposed:i=>t=>t.exposure(t.player.x,t.player.y)>.5===i,flare:i=>t=>!!(t.sun&&t.sun.flare)&&an(t.sun,t.t).state===i,moverX:({mover:i,above:t=-1/0,below:e=1/0})=>n=>{let s=n.bodies.find(r=>r.tag===i);return s.x>t&&s.x<e},any:i=>{let t=i.map(In);return e=>t.some(n=>n(e))},not:i=>{let t=In(i);return e=>!t(e)}},zf=Object.keys(br);function In(i){let e=Object.keys(i).map(n=>{if(!br[n])throw new Error(`unknown condition "${n}"`);return br[n](i[n])});return e.length===1?e[0]:n=>{for(let s of e)if(!s(n))return!1;return!0}}function Pn(i,t,e){if(!i||typeof i!="object"||Array.isArray(i)){e.push(`${t}: condition must be an object`);return}for(let n of Object.keys(i))br[n]?n==="any"?(Array.isArray(i.any)?i.any:[]).forEach((s,r)=>Pn(s,`${t}.any[${r}]`,e)):n==="not"&&Pn(i.not,`${t}.not`,e):e.push(`${t}: unknown condition "${n}" (known: ${zf.join(", ")})`)}var Rs={turn:0,thrust:!1,brake:!1};function Hf(i,t,e){let n=i.player,s=t-n.vx,r=e-n.vy,a=Math.hypot(s,r),o=Math.hypot(n.vx,n.vy),l={turn:0,thrust:!1,brake:!1};if(a<.25)return l;o>.3&&(s*n.vx+r*n.vy)/(a*o)<-.85&&(l.brake=!0);let c=$i(Math.atan2(r,s),n.angle);return l.turn=Math.max(-1,Math.min(1,c*3-n.turnRate*.12)),!l.brake&&Math.abs(c)<.3&&(l.thrust=!0),l}function Ln(i,t,e,n=0,s=0,r=5,a=1){let o=i.player,l=t-o.x,c=e-o.y,h=Math.hypot(l,c),f=Math.min(r,Math.sqrt(2*$t.brake/o.mass*Math.max(0,h-.5))*.7+a*Math.min(1,h/3));return Hf(i,n+l/(h||1)*f,s+c/(h||1)*f)}function Vf(i,t=.6,e=4){let n=i.goal,s=je(i,n);if(n.mouth){let r=n.mouth,a=i.player,o=r.dir==="left"?-4:0,l=r.dir==="up"?4:0;if(!(r.dir==="left"?Math.abs(a.y-r.y)<.8||a.x>r.x-.5:Math.abs(a.x-r.x)<.8||a.y<r.y+.5))return Ln(i,r.x+o,r.y+l,0,0,e,.3)}return Ln(i,s.x,s.y,s.vx,s.vy,e,t)}var Zo=(i,[t,e,n,s])=>Ln(i,t,e,0,0,n,s),$c=i=>Math.max(-1,Math.min(1,i)),Ko={waypoints(i,t,e){let n=i.waypoints;if(t.i=t.i||0,t.i>=n.length)return{next:!0};let[s,r,a=5,o=2.5,l]=n[t.i];if(l&&(t.waits=t.waits||[],t.waits[t.i]||(t.waits[t.i]=In(l))),l&&!t.waits[t.i](e))return{input:Ln(e,e.player.x,e.player.y,0,0,1,0)};Math.hypot(e.player.x-s,e.player.y-r)<o&&t.i++;let c=Ln(e,s,r,0,0,a,a*(i.arriveK??.75));return t.i>=n.length?{input:c,next:!0}:{input:c}},aim(i,t,e){let n=e.player,s=$i(i.aim,n.angle);if(!t.burning)return Math.abs(s)<.03&&(t.burning=!0),{input:{turn:$c(s*4),thrust:!1,brake:!1}};let r={turn:$c(s*4),thrust:!0,brake:!1};return Math.hypot(n.vx,n.vy)>=i.burnTo?{input:r,next:!0}:{input:r}},hold(i,t,e){return t.until=t.until||In(i.until),t.until(e)?{next:!0}:{input:Zo(e,i.hold)}},ride(i,t,e){let n=e.player;if(!n.latch)return{input:Rs};let s=i.ride,r=e.predict(s.horizon??7,s.step??.08,[]),a=je(e,e.goal),o=1e9;for(let l of r)o=Math.min(o,Math.hypot(l.x-a.x,l.y-a.y));return o<s.releaseWithin&&n.vx>(s.minVx??-1/0)?{input:{turn:0,thrust:!0,brake:!1},next:!0}:{input:Rs}},rescue(i,t,e){if(!e.goal||e.goal.type!=="rescue")return{next:!0};let n=e.npc;return{input:Ln(e,n.x,n.y,n.vx,n.vy,i.rescue.vmax,i.rescue.arrive)}},chase(i,t,e){let n=i.chase,s=je(e,e.goal),r=e.player;if(s.x<r.x-n.waitBehind)return{input:Ln(e,r.x,n.holdY,0,0,2,.2)};let a=Math.abs(s.x-r.x)<n.settleDx?s.y:s.y+n.hover;return{input:Ln(e,s.x,a,s.vx,s.vy,n.vmax,n.arrive)}},gate(i,t,e){let n=i.gate;if(!(e.player.x<n.whileXBelow))return{next:!0};let s=e.bodies.find(r=>r.tag===n.mover);return{input:Zo(e,s.status(e.t)===1?n.go:n.hold)}},goal(i,t,e){return{input:Vf(e,i.goal.arrive,i.goal.vmax)}},goTo(i,t,e){let n=i.goTo;if(Array.isArray(n))return{input:Zo(e,n)};let s=je(e,e.goal),[r,a]=n.offset||[0,0];return{input:Ln(e,s.x+r,s.y+a,0,0,n.vmax,n.arrive)}},follow(i,t,e){if(t.until=t.until||(i.until?In(i.until):()=>!1),t.until(e))return{next:!0};let n=i.follow,s=e.bodies.find(o=>o.tag===n.mover),[r,a]=n.offset||[0,0];return{input:Ln(e,s.x+r,s.y+a,s.vx,s.vy,n.vmax??4,n.arrive??.5)}},branch(i,t,e){let n=i.branch;t.cond=t.cond||In(n.if);let s=t.cond(e)?n.then:n.else;return{input:Ko[Sr(s)](s,{},e).input||Rs}},idle(){return{input:Rs}}},Zc=Object.keys(Ko),Sr=i=>Zc.find(t=>t in i);function Kc(i){let t=i.map(()=>({})),e=0;return n=>{for(;e<i.length;){let s=Ko[Sr(i[e])](i[e],t[e],n);if(s.next&&e++,s.input)return s.input}return Rs}}function Jc(i,t,e){if(!Array.isArray(i)||!i.length){e.push(`${t}: plan must be a non-empty array of steps`);return}i.forEach((n,s)=>{let r=`${t}[${s}]`,a=n&&Sr(n);if(!a){e.push(`${r}: unknown plan step (known: ${Zc.join(", ")})`);return}if(a==="waypoints"&&(!Array.isArray(n.waypoints)||!n.waypoints.length?e.push(`${r}.waypoints: needs at least one [x, y, vmax?, r?]`):n.waypoints.forEach((o,l)=>{!Array.isArray(o)||o.length<2||!o.slice(0,4).every(c=>typeof c=="number"&&Number.isFinite(c))?e.push(`${r}.waypoints[${l}]: must be [x, y, vmax?, r?, waitCond?]`):o[4]&&Pn(o[4],`${r}.waypoints[${l}][4]`,e)})),a==="hold"&&Pn(n.until,`${r}.until`,e),a==="follow"&&((!n.follow||typeof n.follow.mover!="string")&&e.push(`${r}.follow.mover: required (mover id)`),n.until&&Pn(n.until,`${r}.until`,e)),a==="branch"){Pn(n.branch.if,`${r}.branch.if`,e);for(let o of["then","else"]){let l=n.branch[o],c=l&&Sr(l);["idle","goal","goTo"].includes(c)||e.push(`${r}.branch.${o}: must be an idle, goal or goTo step`)}}})}var Gf={id:"str",num:"num?",name:"str",chapter:"str?",brief:"str?",par:"any?",look:"any?",start:"any",fuel:"pos?",bounds:"rect",seed:"num?",solids:"any?",movers:"any?",goals:"any",wells:"any?",fields:"any?",vents:"any?",tide:"any?",pickups:"any?",sun:"any?",theme:"enum:station|helios?",rules:"any?",hints:"any?",routes:"any?",notes:"str?",experimental:"bool?",teaches:"any?"},Wf={hole:"pos?",holeX:"num?",holeY:"num?",warm:"num?",final:"bool?",landmark:"enum:none|ring?",ringX:"num?",spineY:"num?",fgDensity:"pos?",debris:"nonneg?",star:"any?",lead:"vec2?",camH:"pos?"};function Xf(i){let t=[];if(!i||typeof i!="object")return["spec: must be an object"];let e=i.id||"spec";Me(i,Gf,e,t),i.start&&Me(i.start,{at:"vec2",angle:"angle?",vel:"vec2?"},`${e}.start`,t);let n=l=>i[l]===void 0?[]:Array.isArray(i[l])?i[l]:(t.push(`${e}.${l}: must be an array`),[]);n("solids").forEach((l,c)=>$o(l,`${e}.solids[${c}]`,t));let s=new Set;n("movers").forEach((l,c)=>{let h=`${e}.movers[${c}]`;Me(l,{id:"str",motion:"any",shapes:"any"},h,t),l.id&&s.has(l.id)&&t.push(`${h}.id: duplicate mover id "${l.id}"`),l.id&&s.add(l.id),!Array.isArray(l.shapes)||!l.shapes.length?t.push(`${h}.shapes: needs at least one shape`):l.shapes.forEach((u,d)=>$o(u,`${h}.shapes[${d}]`,t));let f=l.motion&&As[l.motion.type];f?Me(l.motion,f.schema,`${h}.motion`,t):t.push(`${h}.motion.type: unknown motion "${l.motion&&l.motion.type}" (known: ${Object.keys(As).join(", ")})`)});let r=[];n("movers").forEach((l,c)=>{for(let h of["open","close"])l.motion&&l.motion[h]&&typeof l.motion[h]=="object"&&r.push([`${e}.movers[${c}].motion.${h}`,l.motion[h]])});let a=n("goals");a.length||t.push(`${e}.goals: at least one goal is required`),a.forEach((l,c)=>{let h=`${e}.goals[${c}]`,f=Mr[l.type];if(!f){t.push(`${h}.type: unknown goal "${l.type}" (known: ${Object.keys(Mr).join(", ")})`);return}Me(l,f.schema,h,t),l.on&&!s.has(l.on)&&t.push(`${h}.on: no mover with id "${l.on}"`),l.type==="rescue"&&Me(l.npc||{},{at:"vec2",anchor:"bool?",spin:"num?",vel:"vec2?"},`${h}.npc`,t)}),a.filter(l=>l.type==="rescue").length>1&&t.push(`${e}.goals: only one rescue goal per stage`),n("wells").forEach((l,c)=>Me(l,qe.well.schema,`${e}.wells[${c}]`,t)),n("fields").forEach((l,c)=>Me(l,qe.field.schema,`${e}.fields[${c}]`,t)),n("vents").forEach((l,c)=>Me(l,qe.vent.schema,`${e}.vents[${c}]`,t)),n("pickups").forEach((l,c)=>Me(l,qe.pickup.schema,`${e}.pickups[${c}]`,t)),i.tide!==void 0&&Me(i.tide,qe.tide.schema,`${e}.tide`,t),i.sun!==void 0&&(Me(i.sun,qe.sun.schema,`${e}.sun`,t),i.sun.flare&&Me(i.sun.flare,qe.sun.flare,`${e}.sun.flare`,t),i.sun.flare&&i.sun.flare.warn>=i.sun.flare.period&&t.push(`${e}.sun.flare.warn: telegraph must be shorter than the period`)),n("rules").forEach((l,c)=>{let h=Yc[l.type];if(!h){t.push(`${e}.rules[${c}].type: unknown rule "${l.type}"`);return}Me(l,h.schema,`${e}.rules[${c}]`,t),l.failIf&&Pn(l.failIf,`${e}.rules[${c}].failIf`,t),l.at&&typeof l.at=="object"&&r.push([`${e}.rules[${c}].at`,l.at])});for(let[l,c]of r){let h=n("movers").find(f=>f.id===c.mover);h?["linear","linear-decelerate"].includes(h.motion.type)||t.push(`${l}: mover "${c.mover}" has no position schedule (needs linear motion)`):t.push(`${l}: no mover with id "${c.mover}"`)}n("hints").forEach((l,c)=>{let h=`${e}.hints[${c}]`;Me(l,{text:"str",at:"enum:start?",when:"cond?",dur:"pos?"},h,t),!l.at&&!l.when&&t.push(`${h}: needs at: "start" or a when condition`),l.when&&Pn(l.when,`${h}.when`,t)});let o=new Set;return n("routes").forEach((l,c)=>{let h=`${e}.routes[${c}]`;Me(l,{id:"str",label:"str?",risk:"enum:safe|medium|risky?",plan:"any",notes:"str?"},h,t),o.has(l.id)&&t.push(`${h}.id: duplicate route id "${l.id}"`),o.add(l.id),Jc(l.plan,`${h}.plan`,t)}),i.par&&Me(i.par,{time:"pos",fuel:"pos"},`${e}.par`,t),i.look&&Me(i.look,Wf,`${e}.look`,t),t}var Jo=class extends Error{constructor(t,e){super(`stage "${t}" has ${e.length} spec error(s):
  ${e.join(`
  `)}`),this.errors=e}};function jo(i){let t=Xf(i);if(t.length)throw new Jo(i&&i.id,t);let e=(i.hints||[]).map(s=>s.at?{at:s.at,text:s.text}:{when:In(s.when),text:s.text,...s.dur!==void 0?{dur:s.dur}:{}}),n=()=>{let s=(i.movers||[]).map(f=>({m:f,mo:null})),r=f=>{let u=i.movers.find(d=>d.id===f);return As[u.motion.type].build(u.motion,()=>0).timeAtX},a=f=>typeof f=="number"?f:r(f.mover)(f.x)+(f.offset||0);for(let f of s)f.mo=As[f.m.motion.type].build(f.m.motion,a);let o=[];i.solids&&i.solids.length&&o.push({shapes:i.solids.map(Yo)});for(let{m:f,mo:u}of s){let d={tag:f.id,x:u.x,y:u.y,shapes:f.shapes.map(Yo),motion:u.motion};u.status&&(d.status=u.status),o.push(d)}let l=[],c=null;for(let f of i.goals){let u=qc(f);u.body&&o.push(u.body),u.npc&&(c=u.npc),l.push(u.goal)}let h={start:{x:i.start.at[0],y:i.start.at[1],angle:Ts(i.start.angle??0),...i.start.vel?{vx:i.start.vel[0],vy:i.start.vel[1]}:{}},fuel:i.fuel??100,bounds:{x0:i.bounds[0],x1:i.bounds[2],y0:i.bounds[1],y1:i.bounds[3]},bodies:o,goals:l};if(i.seed!==void 0&&(h.seed=i.seed),i.wells&&(h.wells=i.wells.map(qe.well.build)),i.fields&&(h.fields=i.fields.map(qe.field.build)),i.vents&&(h.vents=i.vents.map(qe.vent.build)),i.pickups&&(h.pickups=i.pickups.map(qe.pickup.build)),i.tide&&(h.tide=qe.tide.build(i.tide)),i.sun&&(h.sun=qe.sun.build(i.sun)),c&&(h.npc=c),i.rules&&i.rules.length){let f=i.rules.map(u=>({at:a(u.at)+(u.grace||0),failIf:In(u.failIf),cause:u.cause}));h.update=u=>{for(let d of f)u.state==="play"&&u.t>d.at&&d.failIf(u)&&u.fail(d.cause)}}return h};return{id:i.id,num:i.num??0,name:i.name,chapter:i.chapter||"",brief:i.brief||"",par:i.par||{time:60,fuel:60},theme:i.theme||"station",look:i.look||{},hints:e,routes:(i.routes||[]).map(s=>({id:s.id,label:s.label||s.id,risk:s.risk||"medium",plan:s.plan})),experimental:!!i.experimental,spec:i,build:n}}var jc={id:"first-drift",num:1,name:"FIRST DRIFT",chapter:"OUTER TRUSS",brief:"Reach the airlock. Arrive under 1.5 m/s.",teaches:["thrust","brake"],par:{time:22,fuel:30},look:{hole:.55,holeX:.78,holeY:.7,warm:.6},start:{at:[0,0],angle:"right"},fuel:100,bounds:[-16,-24,125,24],solids:[{box:[-16,-7,-5,7]},{box:[-5,7,92,8.6],style:"truss"},{box:[-5,-8.6,92,-7],style:"truss"},{box:[26,-7,30.5,-2.6],style:"crate"},{box:[48.5,2.4,51.5,7],style:"strut"},{box:[66,-7,70,-1.4]},{box:[71.5,2.8,74,7],style:"strut"}],goals:[{type:"airlock",at:[92,0],dir:"left",length:22,height:22}],hints:[{at:"start",text:"HOLD  W / \u25B2  TO THRUST"},{when:{started:!0,speedAbove:2.2},text:"LET GO.  DRIFT IS FREE.",dur:2.2},{when:{xAbove:52},text:"S / \u25BC  BRAKES AGAINST YOUR MOTION",dur:3.2},{when:{xAbove:78,speedAbove:1.5},text:"TOO HOT \u2014 BRAKE BRAKE BRAKE",dur:1.8}],routes:[{id:"main",risk:"safe",plan:[{waypoints:[[20,0,6],[60,-.5,6],[70,.7,4,2]]},{goal:{arrive:.6,vmax:5}}]}]};var Qc={id:"dogleg",num:2,name:"DOGLEG",chapter:"OUTER TRUSS",brief:"Grab the handhold. Under 2.0 m/s. Plan your stops early.",teaches:["turning-stops"],par:{time:28,fuel:45},look:{hole:.6,holeX:.25,holeY:.72,warm:.4},start:{at:[0,0],angle:"right"},fuel:85,bounds:[-14,-16,72,50],solids:[{box:[-14,-8,62,-4],style:"truss"},{box:[-14,4,42,28]},{box:[56,-8,66,44]},{box:[-14,36,66,42]},{box:[-14,28,-3,36]},{box:[46.5,15,50,18.5],style:"crate"},{box:[22,28,25,31.2],style:"strut"},{box:[5,33.6,7,36],style:"strut"}],goals:[{type:"grab",at:[6,32.1],r:1.45,maxSpeed:2,face:"left"}],hints:[{at:"start",text:"THE CORRIDOR TURNS.  YOUR MOMENTUM WON'T."},{when:{xAbove:30,yBelow:4,vxAbove:3.4},text:"WALL AHEAD.  STOP BEFORE THE SHAFT.",dur:2},{when:{yAbove:26},text:"TURN, BURN, AND START BRAKING EARLY",dur:2.6}],routes:[{id:"main",risk:"safe",plan:[{waypoints:[[44,0,6,3],[53,8,4,3],[53,24,5,3],[49,32,4,2.5],[30,32.5,6,3]]},{goal:{arrive:.8,vmax:5}}]}]};var th={id:"lantern",num:3,name:"LANTERN",chapter:"MAINTENANCE BELT",brief:"Reach the mag plate behind the bulkhead. Under 2.5 m/s.",teaches:["gravity-well"],par:{time:22,fuel:18},look:{hole:.7,holeX:.7,holeY:.66,warm:.7},start:{at:[0,-4],angle:.25},fuel:45,bounds:[-14,-28,94,34],solids:[{box:[-14,-12,22,-9],style:"truss"},{box:[-14,-9,-6,4]},{box:[35,-28,42.5,5]},{box:[-14,25,94,29],style:"truss"},{box:[86,-28,94,25]},{box:[42.5,-28,86,-23],style:"truss"},{circle:[60,9,1.6]},{circle:[66,-12,2.2]},{circle:[74,4,1.1]}],wells:[{at:[38.8,14.5],gm:58,core:1.3,soft:1.3,range:17}],pickups:[{at:[38.8,20.3],fuel:25}],goals:[{type:"mag-plate",at:[84.4,-8],r:1.6,maxSpeed:2.5,face:"right"}],hints:[{at:"start",text:"THE LIGHT ABOVE THE WALL IS A GRAVITY WELL"},{when:{near:[38.8,14.5,11]},text:"FAST PASS = BEND.  SLOW PASS = SPAGHETTI.",dur:2.6},{when:{xAbove:46},text:"IT PULLS YOU BACK ON THE WAY OUT.  FREE BRAKES.",dur:2.6}],routes:[{id:"well-bend",risk:"medium",plan:[{aim:.6,burnTo:4},{branch:{if:{xBelow:55},then:{idle:!0},else:{goal:{arrive:.8,vmax:4}}}}]}]};var Cs={id:"carousel",num:4,name:"CAROUSEL",chapter:"MAINTENANCE BELT",brief:"Ride the arm across the shear. Mag plate under 2.5 m/s.",teaches:["rail-sling","shear"],par:{time:28,fuel:26},look:{hole:.75,holeX:.6,holeY:.7,warm:.5},start:{at:[0,0],angle:"right"},fuel:44,bounds:[-16,-42,116,34],solids:[{box:[-16,-9,-6,9]},{box:[97,-16,114,2.6]},{box:[97,5.4,114,22]},{box:[101,2.6,114,5.4]},{box:[-6,26,30,29],style:"truss"}],movers:[{id:"arm",motion:{type:"rotor",at:[34,0],omega:.3,phase:Math.PI/2},shapes:[{circle:[0,0,2.6],style:"hub"},{rect:[0,0,50,1],style:"rail",rail:!0}]}],fields:[{type:"shear",rect:[60,-42,95,34],accel:[0,-1.2]}],goals:[{type:"mag-plate",at:[99.2,4],r:1.7,maxSpeed:2.5,face:"right"}],hints:[{at:"start",text:"TOUCH THE RAIL GENTLY TO LATCH ON"},{when:{latched:!0},text:"YOU SLIDE OUTWARD.  S CLAMPS.  W LETS GO.",dur:3.4},{when:{xAbove:60,latched:!1},text:"SHEAR ZONE \u2014 IT PULLS YOU DOWN",dur:2.2}],routes:[{id:"sling",risk:"risky",plan:[{hold:[6,0,2,.1],until:{any:[{rotorAngle:{mover:"arm",mod:Math.PI,from:.25,to:.6}},{latched:!0}]}},{hold:[22,-1,3.5,.2],until:{latched:!0}},{ride:{releaseWithin:4,minVx:4,horizon:7,step:.08}},{branch:{if:{xBelow:78},then:{idle:!0},else:{goal:{arrive:.8,vmax:6}}}}]}]};var eh={id:"last-shuttle",num:5,name:"LAST SHUTTLE",chapter:"CARGO SPINE",brief:"Clamp onto the shuttle before the hangar seals. Match speed: under 1.6 m/s.",teaches:["rendezvous","vent","timed-door"],par:{time:18,fuel:22},look:{hole:.8,holeX:.82,holeY:.68,warm:.45},start:{at:[0,6],angle:"right"},fuel:60,bounds:[-40,-24,172,30],solids:[{box:[-40,-8,172,-5],style:"truss"},{box:[-40,12,150,15],style:"truss"},{box:[44.2,12,45.8,30],style:"frame"},{box:[94.2,12,95.8,30],style:"frame"},{box:[150,4,172,30]},{box:[168,-5,172,4]}],movers:[{id:"shuttle",motion:{type:"linear-decelerate",from:[-62,-3],speed:4.6,decelAt:150,decel:1.4},shapes:[{rect:[0,0,9,2.4],style:"shuttle"},{circle:[4.6,-.1,1.15],style:"shuttle"}]},{id:"door1",motion:{type:"window-door",at:[45,3.5],slide:[0,-20],open:{mover:"shuttle",x:24.5},close:{mover:"shuttle",x:51.5}},shapes:[{rect:[0,0,1.6,17],style:"door"}]},{id:"door2",motion:{type:"window-door",at:[95,3.5],slide:[0,-20],open:{mover:"shuttle",x:74.5},close:{mover:"shuttle",x:101.5}},shapes:[{rect:[0,0,1.6,17],style:"door"}]},{id:"hangardoor",motion:{type:"window-door",at:[150,-.5],slide:[0,-9],open:null,close:{mover:"shuttle",x:156.5,offset:1.2},rampClose:1.5,warnLead:2,warnLag:1.5},shapes:[{rect:[0,0,1.6,9],style:"door"}]}],vents:[{at:[22,12],dir:"down",len:16,width:5,force:7.5,period:4.2,on:1.3,phase:.6},{at:[70,12],dir:"down",len:16,width:5,force:7.5,period:4.2,on:1.3,phase:2.4},{at:[120,12],dir:"down",len:16,width:5,force:7.5,period:3.6,on:1.3,phase:1}],goals:[{type:"grab",label:"CARGO CLAMP",on:"shuttle",at:[-1.2,1.9],r:1.35,maxSpeed:1.6,face:"up"}],rules:[{type:"deadline",at:{mover:"shuttle",x:156.5,offset:1.2},grace:1.5,failIf:{xBelow:150},cause:"missed"}],hints:[{at:"start",text:"YOUR RIDE IS COMING UP BEHIND YOU"},{when:{timeAbove:7.5},text:"MATCH ITS SPEED.  BRAKE STOPS YOU \u2014 NOT RELATIVE TO IT.",dur:3},{when:{nearVent:{dx:6,yAbove:-2}},text:"VENT WARNING LIGHTS = DOWNBLAST",dur:2}],routes:[{id:"rendezvous",risk:"medium",plan:[{chase:{waitBehind:8,holdY:5,settleDx:1.5,hover:2.2,vmax:6,arrive:.4}}]}]};var nh={id:"three-ways",num:6,name:"THREE WAYS",chapter:"DAMAGED SECTOR",brief:"Reach Ren gently (under 2.0 m/s), then bring her to the lifeboat.",teaches:["route-choice","rescue","rotor-hazard"],par:{time:48,fuel:60},look:{hole:.9,holeX:.55,holeY:.72,warm:.6},start:{at:[0,0],angle:"right"},fuel:80,bounds:[-16,-36,154,36],solids:[{box:[-16,26,154,30],style:"truss"},{box:[-16,-30,154,-26],style:"truss"},{box:[-16,-8,-6,8]},{box:[24,6,100,8]},{box:[24,-8,100,-6]},{box:[42,13.5,44,26],style:"strut"},{box:[60,8,62,20.5],style:"strut"},{box:[78,13.5,80,26],style:"strut"},{circle:[36,-21,1.6]},{circle:[82,-12,1.2]},{circle:[88,-21,1.8]},{box:[112,14,118,20],style:"crate"},{box:[104,-24,110,-18],style:"crate"}],movers:[{id:"turbine",motion:{type:"rotor",at:[62,0],omega:.42,phase:0},shapes:[{rect:[0,0,11.2,.8],style:"blade"},{circle:[0,0,1.2],style:"hub"}]}],wells:[{at:[58,-17],gm:42,core:1.1,soft:1.2,range:13}],pickups:[{at:[70,17],fuel:22},{at:[58,-12.2],fuel:30}],goals:[{type:"rescue",label:"REN",maxSpeed:2,mass:1.9,npc:{at:[121,4],anchor:!0,spin:.25}},{type:"airlock",label:"LIFEBOAT",at:[136,-12],dir:"left",length:16,height:14}],hints:[{at:"start",text:"UPPER: SAFE & SLOW  \xB7  MIDDLE: TURBINE  \xB7  LOWER: WELL"},{when:{goalIndex:1},text:"REN IS CLIPPED ON.  YOU ARE TWICE AS HEAVY NOW.",dur:3.2}],routes:[{id:"upper",label:"Upper gantry",risk:"safe",notes:"long baffle weave, fuel cell on the way",plan:[{waypoints:[[20,12,4,3],[36,10.6,4,2.5],[46,10.6,4,2.5],[53,23,4,2.5],[62,23.5,4,2],[70,17,3,1.2],[70,10.6,3,2.5],[84,10.6,4,2.5],[104,12,4,3]]},{rescue:{vmax:3,arrive:.15}},{goal:{arrive:.6,vmax:3}}]},{id:"middle",label:"Turbine",risk:"risky",notes:"timed run past a rotating blade",plan:[{waypoints:[[20,0,4,2.5],[49,4.5,3,1.2],[50,4.5,.5,1,{phase:{period:Math.PI/.42,from:4.9,to:5.6},slowerThan:.5}],[76,4.5,7,2.5],[100,2,4,3]]},{rescue:{vmax:3,arrive:.15}},{goal:{arrive:.6,vmax:3}}]},{id:"lower",label:"Well",risk:"medium",notes:"skim the well, grab the fuel cell beside its core",plan:[{waypoints:[[18,-10,4,2.5],[30,-12,4,2.5],[44,-12,5,2.5],[58,-11.6,4,1.4],[70,-14,5,3],[96,-14,4,3],[110,0,4,3]]},{rescue:{vmax:3,arrive:.15}},{goal:{arrive:.6,vmax:3}}]}]};var Er=(i,t,e,n,s,r,a)=>({id:i,motion:{type:"orbit",center:t,radii:e,period:n,phase:s,spin:a},shapes:[{rect:[0,0,...r],style:"debris"}]}),ih=(i,t,e)=>({id:i,motion:{type:"cycle-door",at:[t,0],slide:[0,-14.5],period:6.4,phase:e,openAt:.02,closeAt:.6,ramp:.14,warn:[.42,.75]},shapes:[{rect:[0,0,1.8,14],style:"door"}]}),sh={id:"event-horizon",num:7,name:"EVENT HORIZON",chapter:"SINGULARITY APPROACH",brief:"Land in the topside airlock while the anomaly pulls you right. Under 1.5 m/s.",teaches:["tide","cycle-door","hover-landing"],par:{time:40,fuel:60},look:{hole:1.25,holeX:.86,holeY:.6,warm:.8,final:!0},start:{at:[0,0],angle:"right"},fuel:90,bounds:[-16,-32,158,32],solids:[{box:[-16,-9,-6,9]},{box:[-6,18,86,21],style:"truss"},{box:[-6,-21,86,-18],style:"truss"},{box:[86,7,112,30]},{box:[86,-30,112,-7]},{box:[97.6,-7,100.4,-6],style:"frame"},{box:[97.6,6,100.4,7],style:"frame"}],movers:[Er("d1",[16,5],[2,6],9,0,[3.4,2.2],.4),Er("d2",[24,-6],[3,5],11,2,[2.6,2.6],-.5),Er("d3",[32,7],[2.5,6.5],8,4,[4.2,1.4],.3),Er("d4",[40,-4],[2,7],10,1,[2.2,3.2],.6),ih("lockA",92,0),ih("lockB",106,3.2)],wells:[{at:[63,10.5],gm:34,core:1,soft:1.2,range:11},{at:[63,-10.5],gm:34,core:1,soft:1.2,range:11}],tide:{base:.08,from:40,gradient:.0145},pickups:[{at:[99,0],fuel:20}],goals:[{type:"airlock",label:"HORIZON LOCK",at:[130,-8],dir:"up",length:18,height:22}],hints:[{at:"start",text:"THE ANOMALY IS PULLING.  IT ONLY GETS STRONGER."},{when:{xAbove:84,xBelow:90},text:"THE LOCK CYCLES.  WAIT INSIDE IF YOU MUST.",dur:2.6},{when:{xAbove:112},text:"HOVER: FACE LEFT AND FEATHER THRUST",dur:3}],routes:[{id:"main",risk:"risky",plan:[{waypoints:[[46,0,4,3],[80,0,4,3]],arriveK:.6},{gate:{mover:"lockA",whileXBelow:91,go:[99,0,5,.5],hold:[87,0,2,.1]}},{gate:{mover:"lockB",whileXBelow:104,go:[118,0,5,1],hold:[99,0,3,.1]}},{branch:{if:{yAbove:-3},then:{goTo:{goal:!0,offset:[0,5],vmax:3,arrive:.4}},else:{goTo:{goal:!0,vmax:1.2,arrive:.5}}}}]}]};var rh=[jc,Qc,th,Cs,eh,nh,sh];var ah={id:"lab-sling-basics",name:"SLING SCHOOL",chapter:"LAB \xB7 A",experimental:!0,num:101,brief:"Latch onto the arm, slide out, let go toward the plate. The net forgives.",teaches:["rail-sling"],par:{time:30,fuel:25},look:{hole:.6,holeX:.3,holeY:.72,warm:.4,fgDensity:.6},start:{at:[0,0],angle:"right"},fuel:60,bounds:[-14,-32,92,32],solids:[{box:[-14,-6,-6,6]},{box:[-6,24,82,27],style:"truss"},{box:[-6,-27,82,-24],style:"truss"},{box:[80,-24,88,24],style:"truss",soft:!0}],movers:[{id:"arm",motion:{type:"rotor",at:[28,0],omega:.22,phase:Math.PI/2},shapes:[{circle:[0,0,2.2],style:"hub"},{rect:[0,0,40,1],style:"rail",rail:!0}]}],goals:[{type:"mag-plate",at:[77.6,0],r:3,maxSpeed:3,face:"right"}],hints:[{at:"start",text:"DRIFT INTO THE ARM'S PATH.  A GENTLE TOUCH LATCHES."},{when:{latched:!0},text:"SLIDE OUT.  W LETS GO WHEN THE DOTS REACH THE PLATE.",dur:3.6},{when:{xAbove:50,latched:!1},text:"BRAKE BEFORE THE NET",dur:2}],routes:[{id:"sling",risk:"safe",plan:[{hold:[17,-1,3,.2],until:{latched:!0}},{ride:{releaseWithin:2.5,minVx:2,horizon:12,step:.1}},{branch:{if:{xBelow:55},then:{idle:!0},else:{goal:{arrive:.8,vmax:5}}}}]}]};var oh={...(({num:i,...t})=>t)(Cs),id:"lab-sling-shear",name:"SOFT SHEAR",chapter:"LAB \xB7 B",experimental:!0,num:102,brief:"Carousel with a gentler pull. Mag plate under 2.5 m/s.",teaches:["shear"],par:{time:30,fuel:26},fuel:50,fields:[{type:"shear",rect:[60,-42,95,34],accel:[0,-.6]}],goals:[{type:"mag-plate",at:[99.2,4],r:2,maxSpeed:2.5,face:"right"}],routes:Cs.routes.map(i=>({...i,id:"sling",risk:"medium"}))};var lh={id:"lab-rendezvous",name:"SLOW BOAT",chapter:"LAB \xB7 C",experimental:!0,num:103,brief:"Land on the drifting work platform. It moves \u2014 match it. Under 2.2 m/s relative.",teaches:["moving-goal"],par:{time:25,fuel:25},look:{hole:.65,holeX:.75,holeY:.72,warm:.5,fgDensity:.7},start:{at:[0,8],angle:"right"},fuel:70,bounds:[-50,-26,150,30],solids:[{box:[-50,-14,150,-11],style:"truss"},{box:[-50,22,150,25],style:"truss"}],movers:[{id:"platform",motion:{type:"linear",from:[-36,-4],vel:[1.8,0]},shapes:[{rect:[0,0,14,1.6],style:"shuttle"},{rect:[-6,1.4,1,1.2],style:"strut"},{rect:[6,1.4,1,1.2],style:"strut"}]}],goals:[{type:"grab",label:"LANDING CLAMP",on:"platform",at:[0,1.6],r:2,maxSpeed:2.2,face:"up"}],rules:[{type:"deadline",at:75,grace:0,failIf:{xBelow:1e3},cause:"missed"}],hints:[{at:"start",text:"THE PLATFORM IS COMING.  MATCH ITS SPEED, THEN SETTLE ON."},{when:{timeAbove:9},text:"BRAKE STOPS YOU DEAD \u2014 NOT RELATIVE TO IT",dur:3}],routes:[{id:"rendezvous",risk:"safe",plan:[{chase:{waitBehind:8,holdY:8,settleDx:1.5,hover:2.4,vmax:4,arrive:.4}}]}]};var ch={id:"lab-threadline",name:"THREADLINE",chapter:"LAB \xB7 D",experimental:!0,num:104,brief:"Through the lock, onto the arm, past the well, onto the plate. Under 2.0 m/s.",teaches:[],par:{time:40,fuel:40},look:{hole:1.05,holeX:.8,holeY:.62,warm:.75,fgDensity:1.2,debris:1.5,landmark:"ring",ringX:60},start:{at:[0,0],angle:"right"},fuel:70,bounds:[-14,-34,118,34],solids:[{box:[-14,-8,-6,8]},{box:[-6,8,22,26]},{box:[-6,-26,22,-8]},{box:[22,22,106,25],style:"truss"},{box:[22,-25,106,-22],style:"truss"},{box:[106,-25,118,25]}],movers:[{id:"lock",motion:{type:"cycle-door",at:[20,0],slide:[0,-16.5],period:6,phase:0,openAt:.02,closeAt:.64,ramp:.12,warn:[.5,.78]},shapes:[{rect:[0,0,1.8,16],style:"door"}]},{id:"arm",motion:{type:"rotor",at:[46,0],omega:.34,phase:Math.PI/2},shapes:[{circle:[0,0,2.2],style:"hub"},{rect:[0,0,38,1],style:"rail",rail:!0}]}],wells:[{at:[72,-9],gm:36,core:1,soft:1.2,range:13}],tide:{base:0,from:84,gradient:.035},goals:[{type:"mag-plate",at:[104.3,-6],r:1.6,maxSpeed:2,face:"right"}],hints:[{at:"start",text:"LOCK \xB7 ARM \xB7 WELL \xB7 PULL.  YOU KNOW ALL OF THESE."},{when:{latched:!0},text:"THE WELL WILL BEND YOUR LINE.  TRUST THE DOTS.",dur:3},{when:{xAbove:88,latched:!1},text:"THE PULL IS ON.  BRAKE HARD.",dur:2.2}],routes:[{id:"thread",risk:"risky",plan:[{waypoints:[[15,0,3,2]]},{gate:{mover:"lock",whileXBelow:23,go:[25,0,5,1],hold:[16,0,2,.1]}},{hold:[25,0,2,.1],until:{any:[{rotorAngle:{mover:"arm",mod:Math.PI,from:.3,to:.7}},{latched:!0}]}},{hold:[36,-1,3,.2],until:{latched:!0}},{ride:{releaseWithin:3,minVx:3,horizon:9,step:.08}},{branch:{if:{xBelow:86},then:{idle:!0},else:{goal:{arrive:.6,vmax:4}}}}]}]};var hh=[ah,oh,lh,ch];var uh=(i,t,e,n=1.2)=>({box:[i,e,t,e+n],style:"shield",shade:!0}),fh={id:"lab-umbra",name:"UMBRA",chapter:"HELIOS FOUNDRY",experimental:!0,num:201,theme:"helios",brief:"Climb to the receiver socket. Sunlight pushes. Shade doesn\u2019t. Under 2.0 m/s.",teaches:["solar-pressure","shade","moving-shade","flare"],par:{time:36,fuel:60},look:{lead:[0,4.5],camH:10.5},start:{at:[0,-4.5],angle:"up"},fuel:100,bounds:[-32,-12,20,64],sun:{dir:"down",accel:1.2,penumbra:.8,flare:{period:20,warn:2.6,speed:32,width:2.4,phase:5.6}},solids:[{box:[-32,-12,20,-8]},uh(-5,5,1),uh(-11,3,14),{box:[-20.6,44.6,-19.4,64],style:"strut"}],movers:[{id:"parasol",motion:{type:"sweep",at:[-12,34],amp:[8,0],period:20,phase:4.869},shapes:[{rect:[0,0,12,1.2],style:"shield",shade:!0}]}],pickups:[{at:[-6,9],fuel:30}],goals:[{type:"mag-plate",label:"RECEIVER SOCKET",at:[-20,43],r:1.6,maxSpeed:2,face:"down"}],hints:[{at:"start",text:"SUNLIGHT PUSHES.  SHADE DOESN\u2019T."},{when:{started:!0,exposed:!0,yBelow:4},text:"IN THE LIGHT, THE STAR PUSHES YOU DOWN",dur:2.6},{when:{exposed:!0,yAbove:18,yBelow:34},text:"SHADOW: DEPARTED",dur:1.6}],routes:[{id:"ride",risk:"medium",plan:[{waypoints:[[7,-4,4,1.5],[7,4,4,1.5],[-4,9,4,2]]},{hold:[-9.5,11,3,.2],until:{moverX:{mover:"parasol",below:-7}}},{waypoints:[[-13,13,3.5,1.5]]},{follow:{mover:"parasol",offset:[0,-6],vmax:5,arrive:.8},until:{flare:"idle",moverX:{below:-19.6,mover:"parasol"}}},{hold:[-20,29,2,.1],until:{exposed:!0,moverX:{mover:"parasol",above:-14}}},{goTo:{goal:!0,offset:[0,-1],vmax:5,arrive:.8}}]},{id:"sunrise",risk:"risky",plan:[{waypoints:[[7,-4,4,1.5],[7,4,4,1.5],[-4,9,4,2]]},{waypoints:[[-14,12,3,1.5]]},{hold:[-14,12,3,.2],until:{phase:{period:20,from:7,to:9}}},{goTo:{goal:!0,offset:[0,-1],vmax:7,arrive:.8}}]}]};var dh=[fh];var Qe=rh.map(jo),Tr=[...hh,...dh].map(jo),Qo=[...Qe,...Tr];var Bh=0,Ul=1,kh=2;var er=1,zh=2,ys=3,jn=0,Ge=1,fn=2,zn=0,Bi=1,Hn=2,Fl=3,Ol=4,Hh=5;var fi=100,Vh=101,Gh=102,Wh=103,Xh=104,qh=200,Yh=201,$h=202,Zh=203,Kr=204,Jr=205,Kh=206,Jh=207,jh=208,Qh=209,tu=210,eu=211,nu=212,iu=213,su=214,jr=0,Qr=1,ta=2,ki=3,ea=4,na=5,ia=6,sa=7,Bl=0,ru=1,au=2,Sn=0,kl=1,zl=2,Hl=3,nr=4,Vl=5,Gl=6,Wl=7;var Xl=300,_i=301,Gi=302,Pa=303,La=304,ir=306,hs=1e3,Un=1001,ra=1002,Pe=1003,ou=1004;var sr=1005;var Ue=1006,Na=1007;var Mi=1008;var Ze=1009,ql=1010,Yl=1011,vs=1012,Da=1013,En=1014,dn=1015,Vn=1016,Ua=1017,Fa=1018,_s=1020,$l=35902,Zl=35899,Kl=1021,Jl=1022,pn=1023,Fn=1026,bi=1027,Oa=1028,Ba=1029,Si=1030,ka=1031;var za=1033,rr=33776,ar=33777,or=33778,lr=33779,Ha=35840,Va=35841,Ga=35842,Wa=35843,Xa=36196,qa=37492,Ya=37496,$a=37488,Za=37489,cr=37490,Ka=37491,Ja=37808,ja=37809,Qa=37810,to=37811,eo=37812,no=37813,io=37814,so=37815,ro=37816,ao=37817,oo=37818,lo=37819,co=37820,ho=37821,uo=36492,fo=36494,po=36495,mo=36283,go=36284,hr=36285,xo=36286;var Os=2300,aa=2301,Zr=2302,El=2303,Tl=2400,wl=2401,Al=2402;var lu=3200;var yo=0,cu=1,Tn="",Ne="srgb",Bs="srgb-linear",ks="linear",Jt="srgb";var Fi=7680;var Rl=519,hu=512,uu=513,fu=514,vo=515,du=516,pu=517,_o=518,mu=519,Cl=35044,Ei=35048;var jl="300 es",Mn=2e3,us=2001;function qf(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Yf(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function zs(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function gu(){let i=zs("canvas");return i.style.display="block",i}var ph={},fs=null;function Ql(...i){let t="THREE."+i.shift();fs?fs("log",t,...i):console.log(t,...i)}function xu(i){let t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ct(...i){i=xu(i);let t="THREE."+i.shift();if(fs)fs("warn",t,...i);else{let e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function Pt(...i){i=xu(i);let t="THREE."+i.shift();if(fs)fs("error",t,...i);else{let e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function Oi(...i){let t=i.join(" ");t in ph||(ph[t]=!0,Ct(...i))}function yu(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var vu={[jr]:Qr,[ta]:ia,[ea]:sa,[ki]:na,[Qr]:jr,[ia]:ta,[sa]:ea,[na]:ki},On=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let s=n[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},Be=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var tl=Math.PI/180,oa=180/Math.PI;function ur(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Be[i&255]+Be[i>>8&255]+Be[i>>16&255]+Be[i>>24&255]+"-"+Be[t&255]+Be[t>>8&255]+"-"+Be[t>>16&15|64]+Be[t>>24&255]+"-"+Be[e&63|128]+Be[e>>8&255]+"-"+Be[e>>16&255]+Be[e>>24&255]+Be[n&255]+Be[n>>8&255]+Be[n>>16&255]+Be[n>>24&255]).toLowerCase()}function Xt(i,t,e){return Math.max(t,Math.min(e,i))}function $f(i,t){return(i%t+t)%t}function el(i,t,e){return(1-e)*i+e*t}function Is(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Ye(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var sc=class sc{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Xt(this.x,t.x,e.x),this.y=Xt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Xt(this.x,t,e),this.y=Xt(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Xt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Xt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};sc.prototype.isVector2=!0;var It=sc,ln=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],f=n[s+3],u=r[a+0],d=r[a+1],m=r[a+2],v=r[a+3];if(f!==v||l!==u||c!==d||h!==m){let g=l*u+c*d+h*m+f*v;g<0&&(u=-u,d=-d,m=-m,v=-v,g=-g);let p=1-o;if(g<.9995){let M=Math.acos(g),S=Math.sin(M);p=Math.sin(p*M)/S,o=Math.sin(o*M)/S,l=l*p+u*o,c=c*p+d*o,h=h*p+m*o,f=f*p+v*o}else{l=l*p+u*o,c=c*p+d*o,h=h*p+m*o,f=f*p+v*o;let M=1/Math.sqrt(l*l+c*c+h*h+f*f);l*=M,c*=M,h*=M,f*=M}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=f}static multiplyQuaternionsFlat(t,e,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],f=r[a],u=r[a+1],d=r[a+2],m=r[a+3];return t[e]=o*m+h*f+l*d-c*u,t[e+1]=l*m+h*u+c*f-o*d,t[e+2]=c*m+h*d+o*u-l*f,t[e+3]=h*m-o*f-l*u-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),f=o(r/2),u=l(n/2),d=l(s/2),m=l(r/2);switch(a){case"XYZ":this._x=u*h*f+c*d*m,this._y=c*d*f-u*h*m,this._z=c*h*m+u*d*f,this._w=c*h*f-u*d*m;break;case"YXZ":this._x=u*h*f+c*d*m,this._y=c*d*f-u*h*m,this._z=c*h*m-u*d*f,this._w=c*h*f+u*d*m;break;case"ZXY":this._x=u*h*f-c*d*m,this._y=c*d*f+u*h*m,this._z=c*h*m+u*d*f,this._w=c*h*f-u*d*m;break;case"ZYX":this._x=u*h*f-c*d*m,this._y=c*d*f+u*h*m,this._z=c*h*m-u*d*f,this._w=c*h*f+u*d*m;break;case"YZX":this._x=u*h*f+c*d*m,this._y=c*d*f+u*h*m,this._z=c*h*m-u*d*f,this._w=c*h*f-u*d*m;break;case"XZY":this._x=u*h*f-c*d*m,this._y=c*d*f-u*h*m,this._z=c*h*m+u*d*f,this._w=c*h*f+u*d*m;break;default:Ct("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],f=e[10],u=n+o+f;if(u>0){let d=.5/Math.sqrt(u+1);this._w=.25/d,this._x=(h-l)*d,this._y=(r-c)*d,this._z=(a-s)*d}else if(n>o&&n>f){let d=2*Math.sqrt(1+n-o-f);this._w=(h-l)/d,this._x=.25*d,this._y=(s+a)/d,this._z=(r+c)/d}else if(o>f){let d=2*Math.sqrt(1+o-n-f);this._w=(r-c)/d,this._x=(s+a)/d,this._y=.25*d,this._z=(l+h)/d}else{let d=2*Math.sqrt(1+f-n-o);this._w=(a-s)/d,this._x=(r+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Xt(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-e;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,e=Math.sin(e*c)/h,this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},rc=class rc{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(mh.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(mh.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),h=2*(o*e-r*s),f=2*(r*n-a*e);return this.x=e+l*c+a*f-o*h,this.y=n+l*h+o*c-r*f,this.z=s+l*f+r*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Xt(this.x,t.x,e.x),this.y=Xt(this.y,t.y,e.y),this.z=Xt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Xt(this.x,t,e),this.y=Xt(this.y,t,e),this.z=Xt(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Xt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return nl.copy(this).projectOnVector(t),this.sub(nl)}reflect(t){return this.sub(nl.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Xt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};rc.prototype.isVector3=!0;var U=rc,nl=new U,mh=new ln,ac=class ac{constructor(t,e,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],f=n[7],u=n[2],d=n[5],m=n[8],v=s[0],g=s[3],p=s[6],M=s[1],S=s[4],b=s[7],T=s[2],w=s[5],R=s[8];return r[0]=a*v+o*M+l*T,r[3]=a*g+o*S+l*w,r[6]=a*p+o*b+l*R,r[1]=c*v+h*M+f*T,r[4]=c*g+h*S+f*w,r[7]=c*p+h*b+f*R,r[2]=u*v+d*M+m*T,r[5]=u*g+d*S+m*w,r[8]=u*p+d*b+m*R,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],f=h*a-o*c,u=o*l-h*r,d=c*r-a*l,m=e*f+n*u+s*d;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/m;return t[0]=f*v,t[1]=(s*c-h*n)*v,t[2]=(o*n-s*a)*v,t[3]=u*v,t[4]=(h*e-s*l)*v,t[5]=(s*r-o*e)*v,t[6]=d*v,t[7]=(n*l-c*e)*v,t[8]=(a*e-n*r)*v,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return Oi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(il.makeScale(t,e)),this}rotate(t){return Oi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(il.makeRotation(-t)),this}translate(t,e){return Oi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(il.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};ac.prototype.isMatrix3=!0;var Nt=ac,il=new Nt,gh=new Nt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),xh=new Nt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Zf(){let i={enabled:!0,workingColorSpace:Bs,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===Jt&&(s.r=Jn(s.r),s.g=Jn(s.g),s.b=Jn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Jt&&(s.r=cs(s.r),s.g=cs(s.g),s.b=cs(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Tn?ks:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Oi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Oi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Bs]:{primaries:t,whitePoint:n,transfer:ks,toXYZ:gh,fromXYZ:xh,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Ne},outputColorSpaceConfig:{drawingBufferColorSpace:Ne}},[Ne]:{primaries:t,whitePoint:n,transfer:Jt,toXYZ:gh,fromXYZ:xh,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Ne}}}),i}var Gt=Zf();function Jn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function cs(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Ki,la=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{Ki===void 0&&(Ki=zs("canvas")),Ki.width=t.width,Ki.height=t.height;let s=Ki.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=Ki}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=zs("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Jn(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Jn(e[n]/255)*255):e[n]=Jn(e[n]);return{data:e,width:t.width,height:t.height}}else return Ct("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Kf=0,ds=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Kf++}),this.uuid=ur(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(sl(s[a].image)):r.push(sl(s[a]))}else r=sl(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function sl(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?la.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ct("Texture: Unable to serialize Texture."),{})}var Jf=0,rl=new U,He=class i extends On{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=Un,s=Un,r=Ue,a=Mi,o=pn,l=Ze,c=i.DEFAULT_ANISOTROPY,h=Tn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Jf++}),this.uuid=ur(),this.name="",this.source=new ds(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new It(0,0),this.repeat=new It(1,1),this.center=new It(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Nt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(rl).x}get height(){return this.source.getSize(rl).y}get depth(){return this.source.getSize(rl).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Ct(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Ct(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Xl)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case hs:t.x=t.x-Math.floor(t.x);break;case Un:t.x=t.x<0?0:1;break;case ra:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case hs:t.y=t.y-Math.floor(t.y);break;case Un:t.y=t.y<0?0:1;break;case ra:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};He.DEFAULT_IMAGE=null;He.DEFAULT_MAPPING=Xl;He.DEFAULT_ANISOTROPY=1;var oc=class oc{constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],h=l[4],f=l[8],u=l[1],d=l[5],m=l[9],v=l[2],g=l[6],p=l[10];if(Math.abs(h-u)<.01&&Math.abs(f-v)<.01&&Math.abs(m-g)<.01){if(Math.abs(h+u)<.1&&Math.abs(f+v)<.1&&Math.abs(m+g)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let S=(c+1)/2,b=(d+1)/2,T=(p+1)/2,w=(h+u)/4,R=(f+v)/4,x=(m+g)/4;return S>b&&S>T?S<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(S),s=w/n,r=R/n):b>T?b<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(b),n=w/s,r=x/s):T<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(T),n=R/r,s=x/r),this.set(n,s,r,e),this}let M=Math.sqrt((g-m)*(g-m)+(f-v)*(f-v)+(u-h)*(u-h));return Math.abs(M)<.001&&(M=1),this.x=(g-m)/M,this.y=(f-v)/M,this.z=(u-h)/M,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Xt(this.x,t.x,e.x),this.y=Xt(this.y,t.y,e.y),this.z=Xt(this.z,t.z,e.z),this.w=Xt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Xt(this.x,t,e),this.y=Xt(this.y,t,e),this.z=Xt(this.z,t,e),this.w=Xt(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Xt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};oc.prototype.isVector4=!0;var le=oc,ca=class extends On{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ue,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new le(0,0,t,e),this.scissorTest=!1,this.viewport=new le(0,0,t,e),this.textures=[];let s={width:t,height:e,depth:n.depth},r=new He(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:Ue,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new ds(s)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ve=class extends ca{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},Hs=class extends He{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Pe,this.minFilter=Pe,this.wrapR=Un,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var ha=class extends He{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Pe,this.minFilter=Pe,this.wrapR=Un,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Ia=class Ia{constructor(t,e,n,s,r,a,o,l,c,h,f,u,d,m,v,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,h,f,u,d,m,v,g)}set(t,e,n,s,r,a,o,l,c,h,f,u,d,m,v,g){let p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=f,p[14]=u,p[3]=d,p[7]=m,p[11]=v,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ia().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,s=1/Ji.setFromMatrixColumn(t,0).length(),r=1/Ji.setFromMatrixColumn(t,1).length(),a=1/Ji.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),f=Math.sin(r);if(t.order==="XYZ"){let u=a*h,d=a*f,m=o*h,v=o*f;e[0]=l*h,e[4]=-l*f,e[8]=c,e[1]=d+m*c,e[5]=u-v*c,e[9]=-o*l,e[2]=v-u*c,e[6]=m+d*c,e[10]=a*l}else if(t.order==="YXZ"){let u=l*h,d=l*f,m=c*h,v=c*f;e[0]=u+v*o,e[4]=m*o-d,e[8]=a*c,e[1]=a*f,e[5]=a*h,e[9]=-o,e[2]=d*o-m,e[6]=v+u*o,e[10]=a*l}else if(t.order==="ZXY"){let u=l*h,d=l*f,m=c*h,v=c*f;e[0]=u-v*o,e[4]=-a*f,e[8]=m+d*o,e[1]=d+m*o,e[5]=a*h,e[9]=v-u*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let u=a*h,d=a*f,m=o*h,v=o*f;e[0]=l*h,e[4]=m*c-d,e[8]=u*c+v,e[1]=l*f,e[5]=v*c+u,e[9]=d*c-m,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let u=a*l,d=a*c,m=o*l,v=o*c;e[0]=l*h,e[4]=v-u*f,e[8]=m*f+d,e[1]=f,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=d*f+m,e[10]=u-v*f}else if(t.order==="XZY"){let u=a*l,d=a*c,m=o*l,v=o*c;e[0]=l*h,e[4]=-f,e[8]=c*h,e[1]=u*f+v,e[5]=a*h,e[9]=d*f-m,e[2]=m*f-d,e[6]=o*h,e[10]=v*f+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(jf,t,Qf)}lookAt(t,e,n){let s=this.elements;return tn.subVectors(t,e),tn.lengthSq()===0&&(tn.z=1),tn.normalize(),ri.crossVectors(n,tn),ri.lengthSq()===0&&(Math.abs(n.z)===1?tn.x+=1e-4:tn.z+=1e-4,tn.normalize(),ri.crossVectors(n,tn)),ri.normalize(),wr.crossVectors(tn,ri),s[0]=ri.x,s[4]=wr.x,s[8]=tn.x,s[1]=ri.y,s[5]=wr.y,s[9]=tn.y,s[2]=ri.z,s[6]=wr.z,s[10]=tn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],f=n[5],u=n[9],d=n[13],m=n[2],v=n[6],g=n[10],p=n[14],M=n[3],S=n[7],b=n[11],T=n[15],w=s[0],R=s[4],x=s[8],y=s[12],A=s[1],I=s[5],P=s[9],F=s[13],k=s[2],L=s[6],z=s[10],H=s[14],$=s[3],Q=s[7],nt=s[11],st=s[15];return r[0]=a*w+o*A+l*k+c*$,r[4]=a*R+o*I+l*L+c*Q,r[8]=a*x+o*P+l*z+c*nt,r[12]=a*y+o*F+l*H+c*st,r[1]=h*w+f*A+u*k+d*$,r[5]=h*R+f*I+u*L+d*Q,r[9]=h*x+f*P+u*z+d*nt,r[13]=h*y+f*F+u*H+d*st,r[2]=m*w+v*A+g*k+p*$,r[6]=m*R+v*I+g*L+p*Q,r[10]=m*x+v*P+g*z+p*nt,r[14]=m*y+v*F+g*H+p*st,r[3]=M*w+S*A+b*k+T*$,r[7]=M*R+S*I+b*L+T*Q,r[11]=M*x+S*P+b*z+T*nt,r[15]=M*y+S*F+b*H+T*st,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],f=t[6],u=t[10],d=t[14],m=t[3],v=t[7],g=t[11],p=t[15],M=l*d-c*u,S=o*d-c*f,b=o*u-l*f,T=a*d-c*h,w=a*u-l*h,R=a*f-o*h;return e*(v*M-g*S+p*b)-n*(m*M-g*T+p*w)+s*(m*S-v*T+p*R)-r*(m*b-v*w+g*R)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[1],a=t[5],o=t[9],l=t[2],c=t[6],h=t[10];return e*(a*h-o*c)-n*(r*h-o*l)+s*(r*c-a*l)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],f=t[9],u=t[10],d=t[11],m=t[12],v=t[13],g=t[14],p=t[15],M=e*o-n*a,S=e*l-s*a,b=e*c-r*a,T=n*l-s*o,w=n*c-r*o,R=s*c-r*l,x=h*v-f*m,y=h*g-u*m,A=h*p-d*m,I=f*g-u*v,P=f*p-d*v,F=u*p-d*g,k=M*F-S*P+b*I+T*A-w*y+R*x;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let L=1/k;return t[0]=(o*F-l*P+c*I)*L,t[1]=(s*P-n*F-r*I)*L,t[2]=(v*R-g*w+p*T)*L,t[3]=(u*w-f*R-d*T)*L,t[4]=(l*A-a*F-c*y)*L,t[5]=(e*F-s*A+r*y)*L,t[6]=(g*b-m*R-p*S)*L,t[7]=(h*R-u*b+d*S)*L,t[8]=(a*P-o*A+c*x)*L,t[9]=(n*A-e*P-r*x)*L,t[10]=(m*w-v*b+p*M)*L,t[11]=(f*b-h*w-d*M)*L,t[12]=(o*y-a*I-l*x)*L,t[13]=(e*I-n*y+s*x)*L,t[14]=(v*S-m*T-g*M)*L,t[15]=(h*T-f*S+u*M)*L,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,h=a+a,f=o+o,u=r*c,d=r*h,m=r*f,v=a*h,g=a*f,p=o*f,M=l*c,S=l*h,b=l*f,T=n.x,w=n.y,R=n.z;return s[0]=(1-(v+p))*T,s[1]=(d+b)*T,s[2]=(m-S)*T,s[3]=0,s[4]=(d-b)*w,s[5]=(1-(u+p))*w,s[6]=(g+M)*w,s[7]=0,s[8]=(m+S)*R,s[9]=(g-M)*R,s[10]=(1-(u+v))*R,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let a=Ji.set(s[0],s[1],s[2]).length(),o=Ji.set(s[4],s[5],s[6]).length(),l=Ji.set(s[8],s[9],s[10]).length();r<0&&(a=-a),yn.copy(this);let c=1/a,h=1/o,f=1/l;return yn.elements[0]*=c,yn.elements[1]*=c,yn.elements[2]*=c,yn.elements[4]*=h,yn.elements[5]*=h,yn.elements[6]*=h,yn.elements[8]*=f,yn.elements[9]*=f,yn.elements[10]*=f,e.setFromRotationMatrix(yn),n.x=a,n.y=o,n.z=l,this}makePerspective(t,e,n,s,r,a,o=Mn,l=!1){let c=this.elements,h=2*r/(e-t),f=2*r/(n-s),u=(e+t)/(e-t),d=(n+s)/(n-s),m,v;if(l)m=r/(a-r),v=a*r/(a-r);else if(o===Mn)m=-(a+r)/(a-r),v=-2*a*r/(a-r);else if(o===us)m=-a/(a-r),v=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=f,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=m,c[14]=v,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=Mn,l=!1){let c=this.elements,h=2/(e-t),f=2/(n-s),u=-(e+t)/(e-t),d=-(n+s)/(n-s),m,v;if(l)m=1/(a-r),v=a/(a-r);else if(o===Mn)m=-2/(a-r),v=-(a+r)/(a-r);else if(o===us)m=-1/(a-r),v=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=f,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=m,c[14]=v,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};Ia.prototype.isMatrix4=!0;var Qt=Ia,Ji=new U,yn=new Qt,jf=new U(0,0,0),Qf=new U(1,1,1),ri=new U,wr=new U,tn=new U,yh=new Qt,vh=new ln,bn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],f=s[2],u=s[6],d=s[10];switch(e){case"XYZ":this._y=Math.asin(Xt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Xt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(Xt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Xt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Xt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-Xt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:Ct("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return yh.makeRotationFromQuaternion(t),this.setFromRotationMatrix(yh,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return vh.setFromEuler(this),this.setFromQuaternion(vh,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};bn.DEFAULT_ORDER="XYZ";var Vs=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},td=0,_h=new U,ji=new ln,qn=new Qt,Ar=new U,Ps=new U,ed=new U,nd=new ln,Mh=new U(1,0,0),bh=new U(0,1,0),Sh=new U(0,0,1),Eh={type:"added"},id={type:"removed"},Qi={type:"childadded",child:null},al={type:"childremoved",child:null},Fe=class i extends On{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:td++}),this.uuid=ur(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new U,e=new bn,n=new ln,s=new U(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Qt},normalMatrix:{value:new Nt}}),this.matrix=new Qt,this.matrixWorld=new Qt,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Vs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ji.setFromAxisAngle(t,e),this.quaternion.multiply(ji),this}rotateOnWorldAxis(t,e){return ji.setFromAxisAngle(t,e),this.quaternion.premultiply(ji),this}rotateX(t){return this.rotateOnAxis(Mh,t)}rotateY(t){return this.rotateOnAxis(bh,t)}rotateZ(t){return this.rotateOnAxis(Sh,t)}translateOnAxis(t,e){return _h.copy(t).applyQuaternion(this.quaternion),this.position.add(_h.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Mh,t)}translateY(t){return this.translateOnAxis(bh,t)}translateZ(t){return this.translateOnAxis(Sh,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(qn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Ar.copy(t):Ar.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Ps.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?qn.lookAt(Ps,Ar,this.up):qn.lookAt(Ar,Ps,this.up),this.quaternion.setFromRotationMatrix(qn),s&&(qn.extractRotation(s.matrixWorld),ji.setFromRotationMatrix(qn),this.quaternion.premultiply(ji.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Pt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Eh),Qi.child=t,this.dispatchEvent(Qi),Qi.child=null):Pt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(id),al.child=t,this.dispatchEvent(al),al.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),qn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),qn.multiply(t.parent.matrixWorld)),t.applyMatrix4(qn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Eh),Qi.child=t,this.dispatchEvent(Qi),Qi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ps,t,ed),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ps,nd,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),this.static!==!1&&(s.static=this.static),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let f=l[c];r(t.shapes,f)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),f=a(t.shapes),u=a(t.skeletons),d=a(t.animations),m=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),f.length>0&&(n.shapes=f),u.length>0&&(n.skeletons=u),d.length>0&&(n.animations=d),m.length>0&&(n.nodes=m)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};Fe.DEFAULT_UP=new U(0,1,0);Fe.DEFAULT_MATRIX_AUTO_UPDATE=!0;Fe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ye=class extends Fe{constructor(){super(),this.isGroup=!0,this.type="Group"}},sd={type:"move"},ps=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ye,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ye,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ye,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(let v of t.hand.values()){let g=e.getJointPose(v,n),p=this._getHandJoint(c,v);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=g.radius),p.visible=g!==null}let h=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],u=h.position.distanceTo(f.position),d=.02,m=.005;c.inputState.pinching&&u>d+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=d-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(sd)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new ye;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},_u={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ai={h:0,s:0,l:0},Rr={h:0,s:0,l:0};function ol(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var mt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ne){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Gt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=Gt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Gt.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=Gt.workingColorSpace){if(t=$f(t,1),e=Xt(e,0,1),n=Xt(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=ol(a,r,t+1/3),this.g=ol(a,r,t),this.b=ol(a,r,t-1/3)}return Gt.colorSpaceToWorking(this,s),this}setStyle(t,e=Ne){function n(r){r!==void 0&&parseFloat(r)<1&&Ct("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Ct("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);Ct("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ne){let n=_u[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Ct("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Jn(t.r),this.g=Jn(t.g),this.b=Jn(t.b),this}copyLinearToSRGB(t){return this.r=cs(t.r),this.g=cs(t.g),this.b=cs(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ne){return Gt.workingToColorSpace(ke.copy(this),t),Math.round(Xt(ke.r*255,0,255))*65536+Math.round(Xt(ke.g*255,0,255))*256+Math.round(Xt(ke.b*255,0,255))}getHexString(t=Ne){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Gt.workingColorSpace){Gt.workingToColorSpace(ke.copy(this),e);let n=ke.r,s=ke.g,r=ke.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let f=a-o;switch(c=h<=.5?f/(a+o):f/(2-a-o),a){case n:l=(s-r)/f+(s<r?6:0);break;case s:l=(r-n)/f+2;break;case r:l=(n-s)/f+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Gt.workingColorSpace){return Gt.workingToColorSpace(ke.copy(this),e),t.r=ke.r,t.g=ke.g,t.b=ke.b,t}getStyle(t=Ne){Gt.workingToColorSpace(ke.copy(this),t);let e=ke.r,n=ke.g,s=ke.b;return t!==Ne?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(ai),this.setHSL(ai.h+t,ai.s+e,ai.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(ai),t.getHSL(Rr);let n=el(ai.h,Rr.h,e),s=el(ai.s,Rr.s,e),r=el(ai.l,Rr.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},ke=new mt;mt.NAMES=_u;var zi=class extends Fe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new bn,this.environmentIntensity=1,this.environmentRotation=new bn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}},vn=new U,Yn=new U,ll=new U,$n=new U,ts=new U,es=new U,Th=new U,cl=new U,hl=new U,ul=new U,fl=new le,dl=new le,pl=new le,ui=class i{constructor(t=new U,e=new U,n=new U){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),vn.subVectors(t,e),s.cross(vn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){vn.subVectors(s,e),Yn.subVectors(n,e),ll.subVectors(t,e);let a=vn.dot(vn),o=vn.dot(Yn),l=vn.dot(ll),c=Yn.dot(Yn),h=Yn.dot(ll),f=a*c-o*o;if(f===0)return r.set(0,0,0),null;let u=1/f,d=(c*l-o*h)*u,m=(a*h-o*l)*u;return r.set(1-d-m,m,d)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,$n)===null?!1:$n.x>=0&&$n.y>=0&&$n.x+$n.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,$n)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,$n.x),l.addScaledVector(a,$n.y),l.addScaledVector(o,$n.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return fl.setScalar(0),dl.setScalar(0),pl.setScalar(0),fl.fromBufferAttribute(t,e),dl.fromBufferAttribute(t,n),pl.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(fl,r.x),a.addScaledVector(dl,r.y),a.addScaledVector(pl,r.z),a}static isFrontFacing(t,e,n,s){return vn.subVectors(n,e),Yn.subVectors(t,e),vn.cross(Yn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return vn.subVectors(this.c,this.b),Yn.subVectors(this.a,this.b),vn.cross(Yn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,a,o;ts.subVectors(s,n),es.subVectors(r,n),cl.subVectors(t,n);let l=ts.dot(cl),c=es.dot(cl);if(l<=0&&c<=0)return e.copy(n);hl.subVectors(t,s);let h=ts.dot(hl),f=es.dot(hl);if(h>=0&&f<=h)return e.copy(s);let u=l*f-h*c;if(u<=0&&l>=0&&h<=0)return a=l/(l-h),e.copy(n).addScaledVector(ts,a);ul.subVectors(t,r);let d=ts.dot(ul),m=es.dot(ul);if(m>=0&&d<=m)return e.copy(r);let v=d*c-l*m;if(v<=0&&c>=0&&m<=0)return o=c/(c-m),e.copy(n).addScaledVector(es,o);let g=h*m-d*f;if(g<=0&&f-h>=0&&d-m>=0)return Th.subVectors(r,s),o=(f-h)/(f-h+(d-m)),e.copy(s).addScaledVector(Th,o);let p=1/(g+v+u);return a=v*p,o=u*p,e.copy(n).addScaledVector(ts,a).addScaledVector(es,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Bn=class{constructor(t=new U(1/0,1/0,1/0),e=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(_n.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(_n.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=_n.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,_n):_n.fromBufferAttribute(r,a),_n.applyMatrix4(t.matrixWorld),this.expandByPoint(_n);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Cr.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Cr.copy(n.boundingBox)),Cr.applyMatrix4(t.matrixWorld),this.union(Cr)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,_n),_n.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Ls),Ir.subVectors(this.max,Ls),ns.subVectors(t.a,Ls),is.subVectors(t.b,Ls),ss.subVectors(t.c,Ls),oi.subVectors(is,ns),li.subVectors(ss,is),Li.subVectors(ns,ss);let e=[0,-oi.z,oi.y,0,-li.z,li.y,0,-Li.z,Li.y,oi.z,0,-oi.x,li.z,0,-li.x,Li.z,0,-Li.x,-oi.y,oi.x,0,-li.y,li.x,0,-Li.y,Li.x,0];return!ml(e,ns,is,ss,Ir)||(e=[1,0,0,0,1,0,0,0,1],!ml(e,ns,is,ss,Ir))?!1:(Pr.crossVectors(oi,li),e=[Pr.x,Pr.y,Pr.z],ml(e,ns,is,ss,Ir))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,_n).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(_n).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Zn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Zn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Zn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Zn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Zn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Zn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Zn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Zn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Zn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},Zn=[new U,new U,new U,new U,new U,new U,new U,new U],_n=new U,Cr=new Bn,ns=new U,is=new U,ss=new U,oi=new U,li=new U,Li=new U,Ls=new U,Ir=new U,Pr=new U,Ni=new U;function ml(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Ni.fromArray(i,r);let o=s.x*Math.abs(Ni.x)+s.y*Math.abs(Ni.y)+s.z*Math.abs(Ni.z),l=t.dot(Ni),c=e.dot(Ni),h=n.dot(Ni);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var be=new U,Lr=new It,rd=0,zt=class extends On{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:rd++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Cl,this.updateRanges=[],this.gpuType=dn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Lr.fromBufferAttribute(this,e),Lr.applyMatrix3(t),this.setXY(e,Lr.x,Lr.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)be.fromBufferAttribute(this,e),be.applyMatrix3(t),this.setXYZ(e,be.x,be.y,be.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)be.fromBufferAttribute(this,e),be.applyMatrix4(t),this.setXYZ(e,be.x,be.y,be.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)be.fromBufferAttribute(this,e),be.applyNormalMatrix(t),this.setXYZ(e,be.x,be.y,be.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)be.fromBufferAttribute(this,e),be.transformDirection(t),this.setXYZ(e,be.x,be.y,be.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Is(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Ye(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Is(e,this.array)),e}setX(t,e){return this.normalized&&(e=Ye(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Is(e,this.array)),e}setY(t,e){return this.normalized&&(e=Ye(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Is(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Ye(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Is(e,this.array)),e}setW(t,e){return this.normalized&&(e=Ye(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Ye(e,this.array),n=Ye(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Ye(e,this.array),n=Ye(n,this.array),s=Ye(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Ye(e,this.array),n=Ye(n,this.array),s=Ye(s,this.array),r=Ye(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Cl&&(t.usage=this.usage),t}dispose(){this.dispatchEvent({type:"dispose"})}};var Gs=class extends zt{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var Ws=class extends zt{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var ee=class extends zt{constructor(t,e,n){super(new Float32Array(t),e,n)}},ad=new Bn,Ns=new U,gl=new U,Qn=class{constructor(t=new U,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):ad.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ns.subVectors(t,this.center);let e=Ns.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Ns,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(gl.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ns.copy(t.center).add(gl)),this.expandByPoint(Ns.copy(t.center).sub(gl))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},od=0,on=new Qt,xl=new Fe,rs=new U,en=new Bn,Ds=new Bn,Ie=new U,he=class i extends On{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:od++}),this.uuid=ur(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(qf(t)?Ws:Gs)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Nt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return on.makeRotationFromQuaternion(t),this.applyMatrix4(on),this}rotateX(t){return on.makeRotationX(t),this.applyMatrix4(on),this}rotateY(t){return on.makeRotationY(t),this.applyMatrix4(on),this}rotateZ(t){return on.makeRotationZ(t),this.applyMatrix4(on),this}translate(t,e,n){return on.makeTranslation(t,e,n),this.applyMatrix4(on),this}scale(t,e,n){return on.makeScale(t,e,n),this.applyMatrix4(on),this}lookAt(t){return xl.lookAt(t),xl.updateMatrix(),this.applyMatrix4(xl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(rs).negate(),this.translate(rs.x,rs.y,rs.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new ee(n,3))}else{let n=Math.min(t.length,e.count);for(let s=0;s<n;s++){let r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Ct("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Bn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Pt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];en.setFromBufferAttribute(r),this.morphTargetsRelative?(Ie.addVectors(this.boundingBox.min,en.min),this.boundingBox.expandByPoint(Ie),Ie.addVectors(this.boundingBox.max,en.max),this.boundingBox.expandByPoint(Ie)):(this.boundingBox.expandByPoint(en.min),this.boundingBox.expandByPoint(en.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Pt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Qn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Pt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new U,1/0);return}if(t){let n=this.boundingSphere.center;if(en.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];Ds.setFromBufferAttribute(o),this.morphTargetsRelative?(Ie.addVectors(en.min,Ds.min),en.expandByPoint(Ie),Ie.addVectors(en.max,Ds.max),en.expandByPoint(Ie)):(en.expandByPoint(Ds.min),en.expandByPoint(Ds.max))}en.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)Ie.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Ie));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Ie.fromBufferAttribute(o,c),l&&(rs.fromBufferAttribute(t,c),Ie.add(rs)),s=Math.max(s,n.distanceToSquared(Ie))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Pt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Pt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new zt(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[];for(let x=0;x<n.count;x++)o[x]=new U,l[x]=new U;let c=new U,h=new U,f=new U,u=new It,d=new It,m=new It,v=new U,g=new U;function p(x,y,A){c.fromBufferAttribute(n,x),h.fromBufferAttribute(n,y),f.fromBufferAttribute(n,A),u.fromBufferAttribute(r,x),d.fromBufferAttribute(r,y),m.fromBufferAttribute(r,A),h.sub(c),f.sub(c),d.sub(u),m.sub(u);let I=1/(d.x*m.y-m.x*d.y);isFinite(I)&&(v.copy(h).multiplyScalar(m.y).addScaledVector(f,-d.y).multiplyScalar(I),g.copy(f).multiplyScalar(d.x).addScaledVector(h,-m.x).multiplyScalar(I),o[x].add(v),o[y].add(v),o[A].add(v),l[x].add(g),l[y].add(g),l[A].add(g))}let M=this.groups;M.length===0&&(M=[{start:0,count:t.count}]);for(let x=0,y=M.length;x<y;++x){let A=M[x],I=A.start,P=A.count;for(let F=I,k=I+P;F<k;F+=3)p(t.getX(F+0),t.getX(F+1),t.getX(F+2))}let S=new U,b=new U,T=new U,w=new U;function R(x){T.fromBufferAttribute(s,x),w.copy(T);let y=o[x];S.copy(y),S.sub(T.multiplyScalar(T.dot(y))).normalize(),b.crossVectors(w,y);let I=b.dot(l[x])<0?-1:1;a.setXYZW(x,S.x,S.y,S.z,I)}for(let x=0,y=M.length;x<y;++x){let A=M[x],I=A.start,P=A.count;for(let F=I,k=I+P;F<k;F+=3)R(t.getX(F+0)),R(t.getX(F+1)),R(t.getX(F+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new zt(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,d=n.count;u<d;u++)n.setXYZ(u,0,0,0);let s=new U,r=new U,a=new U,o=new U,l=new U,c=new U,h=new U,f=new U;if(t)for(let u=0,d=t.count;u<d;u+=3){let m=t.getX(u+0),v=t.getX(u+1),g=t.getX(u+2);s.fromBufferAttribute(e,m),r.fromBufferAttribute(e,v),a.fromBufferAttribute(e,g),h.subVectors(a,r),f.subVectors(s,r),h.cross(f),o.fromBufferAttribute(n,m),l.fromBufferAttribute(n,v),c.fromBufferAttribute(n,g),o.add(h),l.add(h),c.add(h),n.setXYZ(m,o.x,o.y,o.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(g,c.x,c.y,c.z)}else for(let u=0,d=e.count;u<d;u+=3)s.fromBufferAttribute(e,u+0),r.fromBufferAttribute(e,u+1),a.fromBufferAttribute(e,u+2),h.subVectors(a,r),f.subVectors(s,r),h.cross(f),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ie.fromBufferAttribute(t,e),Ie.normalize(),t.setXYZ(e,Ie.x,Ie.y,Ie.z)}toNonIndexed(){function t(o,l){let c=o.array,h=o.itemSize,f=o.normalized,u=new c.constructor(l.length*h),d=0,m=0;for(let v=0,g=l.length;v<g;v++){o.isInterleavedBufferAttribute?d=l[v]*o.data.stride+o.offset:d=l[v]*h;for(let p=0;p<h;p++)u[m++]=c[d++]}return new zt(u,h,f)}if(this.index===null)return Ct("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,n);e.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,f=c.length;h<f;h++){let u=c[h],d=t(u,n);l.push(d)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let f=0,u=c.length;f<u;f++){let d=c[f];h.push(d.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],f=r[c];for(let u=0,d=f.length;u<d;u++)h.push(f[u].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let c=0,h=a.length;c<h;c++){let f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var ld=0,ti=class extends On{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:ld++}),this.uuid=ur(),this.name="",this.type="Material",this.blending=Bi,this.side=jn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Kr,this.blendDst=Jr,this.blendEquation=fi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new mt(0,0,0),this.blendAlpha=0,this.depthFunc=ki,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Rl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Fi,this.stencilZFail=Fi,this.stencilZPass=Fi,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Ct(`Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Ct(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Bi&&(n.blending=this.blending),this.side!==jn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Kr&&(n.blendSrc=this.blendSrc),this.blendDst!==Jr&&(n.blendDst=this.blendDst),this.blendEquation!==fi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ki&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Rl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Fi&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Fi&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Fi&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new mt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new It().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new It().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var Kn=new U,yl=new U,Nr=new U,ci=new U,vl=new U,Dr=new U,_l=new U,Xs=class{constructor(t=new U,e=new U(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Kn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=Kn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Kn.copy(this.origin).addScaledVector(this.direction,e),Kn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){yl.copy(t).add(e).multiplyScalar(.5),Nr.copy(e).sub(t).normalize(),ci.copy(this.origin).sub(yl);let r=t.distanceTo(e)*.5,a=-this.direction.dot(Nr),o=ci.dot(this.direction),l=-ci.dot(Nr),c=ci.lengthSq(),h=Math.abs(1-a*a),f,u,d,m;if(h>0)if(f=a*l-o,u=a*o-l,m=r*h,f>=0)if(u>=-m)if(u<=m){let v=1/h;f*=v,u*=v,d=f*(f+a*u+2*o)+u*(a*f+u+2*l)+c}else u=r,f=Math.max(0,-(a*u+o)),d=-f*f+u*(u+2*l)+c;else u=-r,f=Math.max(0,-(a*u+o)),d=-f*f+u*(u+2*l)+c;else u<=-m?(f=Math.max(0,-(-a*r+o)),u=f>0?-r:Math.min(Math.max(-r,-l),r),d=-f*f+u*(u+2*l)+c):u<=m?(f=0,u=Math.min(Math.max(-r,-l),r),d=u*(u+2*l)+c):(f=Math.max(0,-(a*r+o)),u=f>0?r:Math.min(Math.max(-r,-l),r),d=-f*f+u*(u+2*l)+c);else u=a>0?-r:r,f=Math.max(0,-(a*u+o)),d=-f*f+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(yl).addScaledVector(Nr,u),d}intersectSphere(t,e){Kn.subVectors(t.center,this.origin);let n=Kn.dot(this.direction),s=Kn.dot(Kn)-n*n,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,f=1/this.direction.z,u=this.origin;return c>=0?(n=(t.min.x-u.x)*c,s=(t.max.x-u.x)*c):(n=(t.max.x-u.x)*c,s=(t.min.x-u.x)*c),h>=0?(r=(t.min.y-u.y)*h,a=(t.max.y-u.y)*h):(r=(t.max.y-u.y)*h,a=(t.min.y-u.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),f>=0?(o=(t.min.z-u.z)*f,l=(t.max.z-u.z)*f):(o=(t.max.z-u.z)*f,l=(t.min.z-u.z)*f),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Kn)!==null}intersectTriangle(t,e,n,s,r){vl.subVectors(e,t),Dr.subVectors(n,t),_l.crossVectors(vl,Dr);let a=this.direction.dot(_l),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;ci.subVectors(this.origin,t);let l=o*this.direction.dot(Dr.crossVectors(ci,Dr));if(l<0)return null;let c=o*this.direction.dot(vl.cross(ci));if(c<0||l+c>a)return null;let h=-o*ci.dot(_l);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},cn=class extends ti{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new mt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.combine=Bl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},wh=new Qt,Di=new Xs,Ur=new Qn,Ah=new U,Fr=new U,Or=new U,Br=new U,Ml=new U,kr=new U,Rh=new U,zr=new U,Ht=class extends Fe{constructor(t=new he,e=new cn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){kr.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],f=r[l];h!==0&&(Ml.fromBufferAttribute(f,t),a?kr.addScaledVector(Ml,h):kr.addScaledVector(Ml.sub(e),h))}e.add(kr)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ur.copy(n.boundingSphere),Ur.applyMatrix4(r),Di.copy(t.ray).recast(t.near),!(Ur.containsPoint(Di.origin)===!1&&(Di.intersectSphere(Ur,Ah)===null||Di.origin.distanceToSquared(Ah)>(t.far-t.near)**2))&&(wh.copy(r).invert(),Di.copy(t.ray).applyMatrix4(wh),!(n.boundingBox!==null&&Di.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Di)))}_computeIntersections(t,e,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,f=r.attributes.normal,u=r.groups,d=r.drawRange;if(o!==null)if(Array.isArray(a))for(let m=0,v=u.length;m<v;m++){let g=u[m],p=a[g.materialIndex],M=Math.max(g.start,d.start),S=Math.min(o.count,Math.min(g.start+g.count,d.start+d.count));for(let b=M,T=S;b<T;b+=3){let w=o.getX(b),R=o.getX(b+1),x=o.getX(b+2);s=Hr(this,p,t,n,c,h,f,w,R,x),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{let m=Math.max(0,d.start),v=Math.min(o.count,d.start+d.count);for(let g=m,p=v;g<p;g+=3){let M=o.getX(g),S=o.getX(g+1),b=o.getX(g+2);s=Hr(this,a,t,n,c,h,f,M,S,b),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let m=0,v=u.length;m<v;m++){let g=u[m],p=a[g.materialIndex],M=Math.max(g.start,d.start),S=Math.min(l.count,Math.min(g.start+g.count,d.start+d.count));for(let b=M,T=S;b<T;b+=3){let w=b,R=b+1,x=b+2;s=Hr(this,p,t,n,c,h,f,w,R,x),s&&(s.faceIndex=Math.floor(b/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{let m=Math.max(0,d.start),v=Math.min(l.count,d.start+d.count);for(let g=m,p=v;g<p;g+=3){let M=g,S=g+1,b=g+2;s=Hr(this,a,t,n,c,h,f,M,S,b),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}}};function cd(i,t,e,n,s,r,a,o){let l;if(t.side===Ge?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===jn,o),l===null)return null;zr.copy(o),zr.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(zr);return c<e.near||c>e.far?null:{distance:c,point:zr.clone(),object:i}}function Hr(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,Fr),i.getVertexPosition(l,Or),i.getVertexPosition(c,Br);let h=cd(i,t,e,n,Fr,Or,Br,Rh);if(h){let f=new U;ui.getBarycoord(Rh,Fr,Or,Br,f),s&&(h.uv=ui.getInterpolatedAttribute(s,o,l,c,f,new It)),r&&(h.uv1=ui.getInterpolatedAttribute(r,o,l,c,f,new It)),a&&(h.normal=ui.getInterpolatedAttribute(a,o,l,c,f,new U),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new U,materialIndex:0};ui.getNormal(Fr,Or,Br,u.normal),h.face=u,h.barycoord=f}return h}var qs=class extends He{constructor(t=null,e=1,n=1,s,r,a,o,l,c=Pe,h=Pe,f,u){super(null,a,o,l,c,h,s,r,f,u),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var di=class extends zt{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},as=new Qt,Ch=new Qt,Vr=[],Ih=new Bn,hd=new Qt,Us=new Ht,Fs=new Qn,Ys=class extends Ht{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new di(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,hd)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Bn),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,as),Ih.copy(t.boundingBox).applyMatrix4(as),this.boundingBox.union(Ih)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Qn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,as),Fs.copy(t.boundingSphere).applyMatrix4(as),this.boundingSphere.union(Fs)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(t,e){let n=this.matrixWorld,s=this.count;if(Us.geometry=this.geometry,Us.material=this.material,Us.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Fs.copy(this.boundingSphere),Fs.applyMatrix4(n),t.ray.intersectsSphere(Fs)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,as),Ch.multiplyMatrices(n,as),Us.matrixWorld=Ch,Us.raycast(t,Vr);for(let a=0,o=Vr.length;a<o;a++){let l=Vr[a];l.instanceId=r,l.object=this,e.push(l)}Vr.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new di(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){let n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new qs(new Float32Array(s*this.count),s,this.count,Oa,dn));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<n.length;c++)a+=n[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*t;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},bl=new U,ud=new U,fd=new Nt,Dn=class{constructor(t=new U(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=bl.subVectors(n,e).cross(ud.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let s=t.delta(bl),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(s,a)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||fd.getNormalMatrix(t),s=this.coplanarPoint(bl).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ui=new Qn,dd=new It(.5,.5),Gr=new U,ms=class{constructor(t=new Dn,e=new Dn,n=new Dn,s=new Dn,r=new Dn,a=new Dn){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Mn,n=!1){let s=this.planes,r=t.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],f=r[5],u=r[6],d=r[7],m=r[8],v=r[9],g=r[10],p=r[11],M=r[12],S=r[13],b=r[14],T=r[15];if(s[0].setComponents(c-a,d-h,p-m,T-M).normalize(),s[1].setComponents(c+a,d+h,p+m,T+M).normalize(),s[2].setComponents(c+o,d+f,p+v,T+S).normalize(),s[3].setComponents(c-o,d-f,p-v,T-S).normalize(),n)s[4].setComponents(l,u,g,b).normalize(),s[5].setComponents(c-l,d-u,p-g,T-b).normalize();else if(s[4].setComponents(c-l,d-u,p-g,T-b).normalize(),e===Mn)s[5].setComponents(c+l,d+u,p+g,T+b).normalize();else if(e===us)s[5].setComponents(l,u,g,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Ui.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Ui.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Ui)}intersectsSprite(t){Ui.center.set(0,0,0);let e=dd.distanceTo(t.center);return Ui.radius=.7071067811865476+e,Ui.applyMatrix4(t.matrixWorld),this.intersectsSphere(Ui)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(Gr.x=s.normal.x>0?t.max.x:t.min.x,Gr.y=s.normal.y>0?t.max.y:t.min.y,Gr.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Gr)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ua=class extends ti{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new mt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},Ph=new Qt,Il=new Xs,Wr=new Qn,Xr=new U,pi=class extends Fe{constructor(t=new he,e=new ua){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Wr.copy(n.boundingSphere),Wr.applyMatrix4(s),Wr.radius+=r,t.ray.intersectsSphere(Wr)===!1)return;Ph.copy(s).invert(),Il.copy(t.ray).applyMatrix4(Ph);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,f=n.attributes.position;if(c!==null){let u=Math.max(0,a.start),d=Math.min(c.count,a.start+a.count);for(let m=u,v=d;m<v;m++){let g=c.getX(m);Xr.fromBufferAttribute(f,g),Lh(Xr,g,l,s,t,e,this)}}else{let u=Math.max(0,a.start),d=Math.min(f.count,a.start+a.count);for(let m=u,v=d;m<v;m++)Xr.fromBufferAttribute(f,m),Lh(Xr,m,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function Lh(i,t,e,n,s,r,a){let o=Il.distanceSqToPoint(i);if(o<e){let l=new U;Il.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}var $s=class extends He{constructor(t=[],e=_i,n,s,r,a,o,l,c,h){super(t,e,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Zs=class extends He{constructor(t,e,n,s,r,a,o,l,c){super(t,e,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var ei=class extends He{constructor(t,e,n=En,s,r,a,o=Pe,l=Pe,c,h=Fn,f=1){if(h!==Fn&&h!==bi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:t,height:e,depth:f};super(u,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new ds(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},fa=class extends ei{constructor(t,e=En,n=_i,s,r,a=Pe,o=Pe,l,c=Fn){let h={width:t,height:t,depth:1},f=[h,h,h,h,h,h];super(t,t,e,n,s,r,a,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},Ks=class extends He{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},Ee=class i extends he{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],f=[],u=0,d=0;m("z","y","x",-1,-1,n,e,t,a,r,0),m("z","y","x",1,-1,n,e,-t,a,r,1),m("x","z","y",1,1,t,n,e,s,a,2),m("x","z","y",1,-1,t,n,-e,s,a,3),m("x","y","z",1,-1,t,e,n,s,r,4),m("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new ee(c,3)),this.setAttribute("normal",new ee(h,3)),this.setAttribute("uv",new ee(f,2));function m(v,g,p,M,S,b,T,w,R,x,y){let A=b/R,I=T/x,P=b/2,F=T/2,k=w/2,L=R+1,z=x+1,H=0,$=0,Q=new U;for(let nt=0;nt<z;nt++){let st=nt*I-F;for(let xt=0;xt<L;xt++){let Wt=xt*A-P;Q[v]=Wt*M,Q[g]=st*S,Q[p]=k,c.push(Q.x,Q.y,Q.z),Q[v]=0,Q[g]=0,Q[p]=w>0?1:-1,h.push(Q.x,Q.y,Q.z),f.push(xt/R),f.push(1-nt/x),H+=1}}for(let nt=0;nt<x;nt++)for(let st=0;st<R;st++){let xt=u+st+L*nt,Wt=u+st+L*(nt+1),ue=u+(st+1)+L*(nt+1),Zt=u+(st+1)+L*nt;l.push(xt,Wt,Zt),l.push(Wt,ue,Zt),$+=6}o.addGroup(d,$,y),d+=$,u+=H}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},gs=class i extends he{constructor(t=1,e=1,n=4,s=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:t,height:e,capSegments:n,radialSegments:s,heightSegments:r},e=Math.max(0,e),n=Math.max(1,Math.floor(n)),s=Math.max(3,Math.floor(s)),r=Math.max(1,Math.floor(r));let a=[],o=[],l=[],c=[],h=e/2,f=Math.PI/2*t,u=e,d=2*f+u,m=n*2+r,v=s+1,g=new U,p=new U;for(let M=0;M<=m;M++){let S=0,b=0,T=0,w=0;if(M<=n){let y=M/n,A=y*Math.PI/2;b=-h-t*Math.cos(A),T=t*Math.sin(A),w=-t*Math.cos(A),S=y*f}else if(M<=n+r){let y=(M-n)/r;b=-h+y*e,T=t,w=0,S=f+y*u}else{let y=(M-n-r)/n,A=y*Math.PI/2;b=h+t*Math.sin(A),T=t*Math.cos(A),w=t*Math.sin(A),S=f+u+y*f}let R=Math.max(0,Math.min(1,S/d)),x=0;M===0?x=.5/s:M===m&&(x=-.5/s);for(let y=0;y<=s;y++){let A=y/s,I=A*Math.PI*2,P=Math.sin(I),F=Math.cos(I);p.x=-T*F,p.y=b,p.z=T*P,o.push(p.x,p.y,p.z),g.set(-T*F,w,T*P),g.normalize(),l.push(g.x,g.y,g.z),c.push(A+x,R)}if(M>0){let y=(M-1)*v;for(let A=0;A<s;A++){let I=y+A,P=y+A+1,F=M*v+A,k=M*v+A+1;a.push(I,P,F),a.push(P,k,F)}}}this.setIndex(a),this.setAttribute("position",new ee(o,3)),this.setAttribute("normal",new ee(l,3)),this.setAttribute("uv",new ee(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.height,t.capSegments,t.radialSegments,t.heightSegments)}};var Te=class i extends he{constructor(t=1,e=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],f=[],u=[],d=[],m=0,v=[],g=n/2,p=0;M(),a===!1&&(t>0&&S(!0),e>0&&S(!1)),this.setIndex(h),this.setAttribute("position",new ee(f,3)),this.setAttribute("normal",new ee(u,3)),this.setAttribute("uv",new ee(d,2));function M(){let b=new U,T=new U,w=0,R=(e-t)/n;for(let x=0;x<=r;x++){let y=[],A=x/r,I=A*(e-t)+t;for(let P=0;P<=s;P++){let F=P/s,k=F*l+o,L=Math.sin(k),z=Math.cos(k);T.x=I*L,T.y=-A*n+g,T.z=I*z,f.push(T.x,T.y,T.z),b.set(L,R,z).normalize(),u.push(b.x,b.y,b.z),d.push(F,1-A),y.push(m++)}v.push(y)}for(let x=0;x<s;x++)for(let y=0;y<r;y++){let A=v[y][x],I=v[y+1][x],P=v[y+1][x+1],F=v[y][x+1];(t>0||y!==0)&&(h.push(A,I,F),w+=3),(e>0||y!==r-1)&&(h.push(I,P,F),w+=3)}c.addGroup(p,w,0),p+=w}function S(b){let T=m,w=new It,R=new U,x=0,y=b===!0?t:e,A=b===!0?1:-1;for(let P=1;P<=s;P++)f.push(0,g*A,0),u.push(0,A,0),d.push(.5,.5),m++;let I=m;for(let P=0;P<=s;P++){let k=P/s*l+o,L=Math.cos(k),z=Math.sin(k);R.x=y*z,R.y=g*A,R.z=y*L,f.push(R.x,R.y,R.z),u.push(0,A,0),w.x=L*.5+.5,w.y=z*.5*A+.5,d.push(w.x,w.y),m++}for(let P=0;P<s;P++){let F=T+P,k=I+P;b===!0?h.push(k,k+1,F):h.push(k+1,k,F),x+=3}c.addGroup(p,x,b===!0?1:2),p+=x}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Hi=class i extends Te{constructor(t=1,e=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new i(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},da=class i extends he{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};let r=[],a=[];o(s),c(n),h(),this.setAttribute("position",new ee(r,3)),this.setAttribute("normal",new ee(r.slice(),3)),this.setAttribute("uv",new ee(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(M){let S=new U,b=new U,T=new U;for(let w=0;w<e.length;w+=3)d(e[w+0],S),d(e[w+1],b),d(e[w+2],T),l(S,b,T,M)}function l(M,S,b,T){let w=T+1,R=[];for(let x=0;x<=w;x++){R[x]=[];let y=M.clone().lerp(b,x/w),A=S.clone().lerp(b,x/w),I=w-x;for(let P=0;P<=I;P++)P===0&&x===w?R[x][P]=y:R[x][P]=y.clone().lerp(A,P/I)}for(let x=0;x<w;x++)for(let y=0;y<2*(w-x)-1;y++){let A=Math.floor(y/2);y%2===0?(u(R[x][A+1]),u(R[x+1][A]),u(R[x][A])):(u(R[x][A+1]),u(R[x+1][A+1]),u(R[x+1][A]))}}function c(M){let S=new U;for(let b=0;b<r.length;b+=3)S.x=r[b+0],S.y=r[b+1],S.z=r[b+2],S.normalize().multiplyScalar(M),r[b+0]=S.x,r[b+1]=S.y,r[b+2]=S.z}function h(){let M=new U;for(let S=0;S<r.length;S+=3){M.x=r[S+0],M.y=r[S+1],M.z=r[S+2];let b=g(M)/2/Math.PI+.5,T=p(M)/Math.PI+.5;a.push(b,1-T)}m(),f()}function f(){for(let M=0;M<a.length;M+=6){let S=a[M+0],b=a[M+2],T=a[M+4],w=Math.max(S,b,T),R=Math.min(S,b,T);w>.9&&R<.1&&(S<.2&&(a[M+0]+=1),b<.2&&(a[M+2]+=1),T<.2&&(a[M+4]+=1))}}function u(M){r.push(M.x,M.y,M.z)}function d(M,S){let b=M*3;S.x=t[b+0],S.y=t[b+1],S.z=t[b+2]}function m(){let M=new U,S=new U,b=new U,T=new U,w=new It,R=new It,x=new It;for(let y=0,A=0;y<r.length;y+=9,A+=6){M.set(r[y+0],r[y+1],r[y+2]),S.set(r[y+3],r[y+4],r[y+5]),b.set(r[y+6],r[y+7],r[y+8]),w.set(a[A+0],a[A+1]),R.set(a[A+2],a[A+3]),x.set(a[A+4],a[A+5]),T.copy(M).add(S).add(b).divideScalar(3);let I=g(T);v(w,A+0,M,I),v(R,A+2,S,I),v(x,A+4,b,I)}}function v(M,S,b,T){T<0&&M.x===1&&(a[S]=M.x-1),b.x===0&&b.z===0&&(a[S]=T/2/Math.PI+.5)}function g(M){return Math.atan2(M.z,-M.x)}function p(M){return Math.atan2(-M.y,Math.sqrt(M.x*M.x+M.z*M.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.vertices,t.indices,t.radius,t.detail)}};var Vi=class i extends da{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new i(t.radius,t.detail)}};var hn=class i extends he{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,f=t/o,u=e/l,d=[],m=[],v=[],g=[];for(let p=0;p<h;p++){let M=p*u-a;for(let S=0;S<c;S++){let b=S*f-r;m.push(b,-M,0),v.push(0,0,1),g.push(S/o),g.push(1-p/l)}}for(let p=0;p<l;p++)for(let M=0;M<o;M++){let S=M+c*p,b=M+c*(p+1),T=M+1+c*(p+1),w=M+1+c*p;d.push(S,b,w),d.push(b,T,w)}this.setIndex(d),this.setAttribute("position",new ee(m,3)),this.setAttribute("normal",new ee(v,3)),this.setAttribute("uv",new ee(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}};var $e=class i extends he{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),c=0,h=[],f=new U,u=new U,d=[],m=[],v=[],g=[];for(let p=0;p<=n;p++){let M=[],S=p/n,b=a+S*o,T=t*Math.cos(b),w=Math.sqrt(t*t-T*T),R=0;p===0&&a===0?R=.5/e:p===n&&l===Math.PI&&(R=-.5/e);for(let x=0;x<=e;x++){let y=x/e,A=s+y*r;f.x=-w*Math.cos(A),f.y=T,f.z=w*Math.sin(A),m.push(f.x,f.y,f.z),u.copy(f).normalize(),v.push(u.x,u.y,u.z),g.push(y+R,1-S),M.push(c++)}h.push(M)}for(let p=0;p<n;p++)for(let M=0;M<e;M++){let S=h[p][M+1],b=h[p][M],T=h[p+1][M],w=h[p+1][M+1];(p!==0||a>0)&&d.push(S,b,w),(p!==n-1||l<Math.PI)&&d.push(b,T,w)}this.setIndex(d),this.setAttribute("position",new ee(m,3)),this.setAttribute("normal",new ee(v,3)),this.setAttribute("uv",new ee(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var un=class i extends he{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),s=Math.floor(s);let l=[],c=[],h=[],f=[],u=new U,d=new U,m=new U;for(let v=0;v<=n;v++){let g=a+v/n*o;for(let p=0;p<=s;p++){let M=p/s*r;d.x=(t+e*Math.cos(g))*Math.cos(M),d.y=(t+e*Math.cos(g))*Math.sin(M),d.z=e*Math.sin(g),c.push(d.x,d.y,d.z),u.x=t*Math.cos(M),u.y=t*Math.sin(M),m.subVectors(d,u).normalize(),h.push(m.x,m.y,m.z),f.push(p/s),f.push(v/n)}}for(let v=1;v<=n;v++)for(let g=1;g<=s;g++){let p=(s+1)*v+g-1,M=(s+1)*(v-1)+g-1,S=(s+1)*(v-1)+g,b=(s+1)*v+g;l.push(p,M,b),l.push(M,S,b)}this.setIndex(l),this.setAttribute("position",new ee(c,3)),this.setAttribute("normal",new ee(h,3)),this.setAttribute("uv",new ee(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}};function Wi(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];if(Nh(s))s.isRenderTargetTexture?(Ct("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(Nh(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function ze(i){let t={};for(let e=0;e<i.length;e++){let n=Wi(i[e]);for(let s in n)t[s]=n[s]}return t}function Nh(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function pd(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function tc(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Gt.workingColorSpace}var Mu={clone:Wi,merge:ze},md=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,gd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,re=class extends ti{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=md,this.fragmentShader=gd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Wi(t.uniforms),this.uniformsGroups=pd(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let n in t.uniforms){let s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=e[s.value]||null;break;case"c":this.uniforms[n].value=new mt().setHex(s.value);break;case"v2":this.uniforms[n].value=new It().fromArray(s.value);break;case"v3":this.uniforms[n].value=new U().fromArray(s.value);break;case"v4":this.uniforms[n].value=new le().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Nt().fromArray(s.value);break;case"m4":this.uniforms[n].value=new Qt().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},pa=class extends re{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},kn=class extends ti{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new mt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new mt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=yo,this.normalScale=new It(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new bn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};var ma=class extends ti{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=lu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},ga=class extends ti{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function qr(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}var mi=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=e[++n],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},xa=class extends mi{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Tl,endingEnd:Tl}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case wl:r=t,o=2*e-n;break;case Al:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case wl:a=t,l=2*n-e;break;case Al:a=1,l=n+s[1]-s[0];break;default:a=t-1,l=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this._offsetPrev,f=this._offsetNext,u=this._weightPrev,d=this._weightNext,m=(n-e)/(s-e),v=m*m,g=v*m,p=-u*g+2*u*v-u*m,M=(1+u)*g+(-1.5-2*u)*v+(-.5+u)*m+1,S=(-1-d)*g+(1.5+d)*v+.5*m,b=d*g-d*v;for(let T=0;T!==o;++T)r[T]=p*a[h+T]+M*a[c+T]+S*a[l+T]+b*a[f+T];return r}},ya=class extends mi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=(n-e)/(s-e),f=1-h;for(let u=0;u!==o;++u)r[u]=a[c+u]*f+a[l+u]*h;return r}},va=class extends mi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},_a=class extends mi{interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this.inTangents,f=this.outTangents;if(!h||!f){let m=(n-e)/(s-e),v=1-m;for(let g=0;g!==o;++g)r[g]=a[c+g]*v+a[l+g]*m;return r}let u=o*2,d=t-1;for(let m=0;m!==o;++m){let v=a[c+m],g=a[l+m],p=d*u+m*2,M=f[p],S=f[p+1],b=t*u+m*2,T=h[b],w=h[b+1],R=(n-e)/(s-e),x,y,A,I,P;for(let F=0;F<8;F++){x=R*R,y=x*R,A=1-R,I=A*A,P=I*A;let L=P*e+3*I*R*M+3*A*x*T+y*s-n;if(Math.abs(L)<1e-10)break;let z=3*I*(M-e)+6*A*R*(T-M)+3*x*(s-T);if(Math.abs(z)<1e-10)break;R=R-L/z,R=Math.max(0,Math.min(1,R))}r[m]=P*v+3*I*R*S+3*A*x*w+y*g}return r}},nn=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=qr(e,this.TimeBufferType),this.values=qr(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:qr(t.times,Array),values:qr(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new va(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new ya(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new xa(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new _a(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Os:e=this.InterpolantFactoryMethodDiscrete;break;case aa:e=this.InterpolantFactoryMethodLinear;break;case Zr:e=this.InterpolantFactoryMethodSmooth;break;case El:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Ct("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Os;case this.InterpolantFactoryMethodLinear:return aa;case this.InterpolantFactoryMethodSmooth:return Zr;case this.InterpolantFactoryMethodBezier:return El}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(Pt("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(Pt("KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){Pt("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){Pt("KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(s!==void 0&&Yf(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Pt("KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Zr,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=t[o],h=t[o+1];if(c!==h&&(o!==1||c!==t[0]))if(s)l=!0;else{let f=o*n,u=f-n,d=f+n;for(let m=0;m!==n;++m){let v=e[f+m];if(v!==e[u+m]||v!==e[d+m]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let f=o*n,u=a*n;for(let d=0;d!==n;++d)e[u+d]=e[f+d]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)e[l+c]=e[o+c];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};nn.prototype.ValueTypeName="";nn.prototype.TimeBufferType=Float32Array;nn.prototype.ValueBufferType=Float32Array;nn.prototype.DefaultInterpolation=aa;var gi=class extends nn{constructor(t,e,n){super(t,e,n)}};gi.prototype.ValueTypeName="bool";gi.prototype.ValueBufferType=Array;gi.prototype.DefaultInterpolation=Os;gi.prototype.InterpolantFactoryMethodLinear=void 0;gi.prototype.InterpolantFactoryMethodSmooth=void 0;var Ma=class extends nn{constructor(t,e,n,s){super(t,e,n,s)}};Ma.prototype.ValueTypeName="color";var ba=class extends nn{constructor(t,e,n,s){super(t,e,n,s)}};ba.prototype.ValueTypeName="number";var Sa=class extends mi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(s-e),c=t*o;for(let h=c+o;c!==h;c+=4)ln.slerpFlat(r,0,a,c-o,a,c,l);return r}},Js=class extends nn{constructor(t,e,n,s){super(t,e,n,s)}InterpolantFactoryMethodLinear(t){return new Sa(this.times,this.values,this.getValueSize(),t)}};Js.prototype.ValueTypeName="quaternion";Js.prototype.InterpolantFactoryMethodSmooth=void 0;var xi=class extends nn{constructor(t,e,n){super(t,e,n)}};xi.prototype.ValueTypeName="string";xi.prototype.ValueBufferType=Array;xi.prototype.DefaultInterpolation=Os;xi.prototype.InterpolantFactoryMethodLinear=void 0;xi.prototype.InterpolantFactoryMethodSmooth=void 0;var Ea=class extends nn{constructor(t,e,n,s){super(t,e,n,s)}};Ea.prototype.ValueTypeName="vector";var Ta=class{constructor(t,e,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,f){return c.push(h,f),this},this.removeHandler=function(h){let f=c.indexOf(h);return f!==-1&&c.splice(f,2),this},this.getHandler=function(h){for(let f=0,u=c.length;f<u;f+=2){let d=c[f],m=c[f+1];if(d.global&&(d.lastIndex=0),d.test(h))return m}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},bu=new Ta,wa=class{constructor(t){this.manager=t!==void 0?t:bu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};wa.DEFAULT_MATERIAL_NAME="__DEFAULT";var xs=class extends Fe{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new mt(t),this.intensity=e}dispose(){this.dispatchEvent({type:"dispose"})}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}},js=class extends xs{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Fe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new mt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){let e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}},Sl=new Qt,Dh=new U,Uh=new U,Aa=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new It(512,512),this.mapType=Ze,this.map=null,this.mapPass=null,this.matrix=new Qt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ms,this._frameExtents=new It(1,1),this._viewportCount=1,this._viewports=[new le(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,n=this.matrix;Dh.setFromMatrixPosition(t.matrixWorld),e.position.copy(Dh),Uh.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Uh),e.updateMatrixWorld(),Sl.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Sl,e.coordinateSystem,e.reversedDepth),e.coordinateSystem===us||e.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Sl)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}},Yr=new U,$r=new ln,Nn=new U,Qs=class extends Fe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Qt,this.projectionMatrix=new Qt,this.projectionMatrixInverse=new Qt,this.coordinateSystem=Mn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Yr,$r,Nn),Nn.x===1&&Nn.y===1&&Nn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Yr,$r,Nn.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Yr,$r,Nn),Nn.x===1&&Nn.y===1&&Nn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Yr,$r,Nn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},hi=new U,Fh=new It,Oh=new It,De=class extends Qs{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=oa*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(tl*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return oa*2*Math.atan(Math.tan(tl*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){hi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(hi.x,hi.y).multiplyScalar(-t/hi.z),hi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(hi.x,hi.y).multiplyScalar(-t/hi.z)}getViewSize(t,e){return this.getViewBounds(t,Fh,Oh),e.subVectors(Oh,Fh)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(tl*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};var Pl=class extends Aa{constructor(){super(new De(90,1,.5,500)),this.isPointLightShadow=!0}},tr=class extends xs{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Pl}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}},yi=class extends Qs{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Ll=class extends Aa{constructor(){super(new yi(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},vi=class extends xs{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Fe.DEFAULT_UP),this.updateMatrix(),this.target=new Fe,this.shadow=new Ll}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}};var os=-90,ls=1,Ra=class extends Fe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new De(os,ls,t,e);s.layers=this.layers,this.add(s);let r=new De(os,ls,t,e);r.layers=this.layers,this.add(r);let a=new De(os,ls,t,e);a.layers=this.layers,this.add(a);let o=new De(os,ls,t,e);o.layers=this.layers,this.add(o);let l=new De(os,ls,t,e);l.layers=this.layers,this.add(l);let c=new De(os,ls,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(let c of e)this.remove(c);if(t===Mn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===us)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,f=t.getRenderTarget(),u=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;let v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let g=!1;t.isWebGLRenderer===!0?g=t.state.buffers.depth.getReversed():g=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(f,u,d),t.xr.enabled=m,n.texture.needsPMREMUpdate=!0}},Ca=class extends De{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}};var ec="\\[\\]\\.:\\/",xd=new RegExp("["+ec+"]","g"),nc="[^"+ec+"]",yd="[^"+ec.replace("\\.","")+"]",vd=/((?:WC+[\/:])*)/.source.replace("WC",nc),_d=/(WCOD+)?/.source.replace("WCOD",yd),Md=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",nc),bd=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",nc),Sd=new RegExp("^"+vd+_d+Md+bd+"$"),Ed=["material","materials","bones","map"],Nl=class{constructor(t,e,n){let s=n||ce.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},ce=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(xd,"")}static parseTrackName(t){let e=Sd.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);Ed.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=n(o.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Ct("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){Pt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Pt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Pt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Pt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Pt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){Pt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){Pt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let a=t[s];if(a===void 0){let c=e.nodeName;Pt("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Pt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Pt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ce.Composite=Nl;ce.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ce.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ce.prototype.GetterByBindingType=[ce.prototype._getValue_direct,ce.prototype._getValue_array,ce.prototype._getValue_arrayElement,ce.prototype._getValue_toArray];ce.prototype.SetterByBindingTypeAndVersioning=[[ce.prototype._setValue_direct,ce.prototype._setValue_direct_setNeedsUpdate,ce.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ce.prototype._setValue_array,ce.prototype._setValue_array_setNeedsUpdate,ce.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ce.prototype._setValue_arrayElement,ce.prototype._setValue_arrayElement_setNeedsUpdate,ce.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ce.prototype._setValue_fromArray,ce.prototype._setValue_fromArray_setNeedsUpdate,ce.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Py=new Float32Array(1);var lc=class lc{constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){let r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=s,this}};lc.prototype.isMatrix2=!0;var Dl=lc;function ic(i,t,e,n){let s=Td(n);switch(e){case Kl:return i*t;case Oa:return i*t/s.components*s.byteLength;case Ba:return i*t/s.components*s.byteLength;case Si:return i*t*2/s.components*s.byteLength;case ka:return i*t*2/s.components*s.byteLength;case Jl:return i*t*3/s.components*s.byteLength;case pn:return i*t*4/s.components*s.byteLength;case za:return i*t*4/s.components*s.byteLength;case rr:case ar:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case or:case lr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Va:case Wa:return Math.max(i,16)*Math.max(t,8)/4;case Ha:case Ga:return Math.max(i,8)*Math.max(t,8)/2;case Xa:case qa:case $a:case Za:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Ya:case cr:case Ka:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ja:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ja:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Qa:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case to:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case eo:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case no:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case io:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case so:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case ro:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case ao:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case oo:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case lo:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case co:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case ho:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case uo:case fo:case po:return Math.ceil(i/4)*Math.ceil(t/4)*16;case mo:case go:return Math.ceil(i/4)*Math.ceil(t/4)*8;case hr:case xo:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Td(i){switch(i){case Ze:case ql:return{byteLength:1,components:1};case vs:case Yl:case Vn:return{byteLength:2,components:1};case Ua:case Fa:return{byteLength:2,components:4};case En:case Da:case dn:return{byteLength:4,components:1};case $l:case Zl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}}));typeof window<"u"&&(window.__THREE__?Ct("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="185");function Xu(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function Ld(i){let t=new WeakMap;function e(o,l){let c=o.array,h=o.usage,f=c.byteLength,u=i.createBuffer();i.bindBuffer(l,u),i.bufferData(l,c,h),o.onUploadCallback();let d;if(c instanceof Float32Array)d=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=i.SHORT;else if(c instanceof Uint32Array)d=i.UNSIGNED_INT;else if(c instanceof Int32Array)d=i.INT;else if(c instanceof Int8Array)d=i.BYTE;else if(c instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,c){let h=l.array,f=l.updateRanges;if(i.bindBuffer(c,o),f.length===0)i.bufferSubData(c,0,h);else{f.sort((d,m)=>d.start-m.start);let u=0;for(let d=1;d<f.length;d++){let m=f[u],v=f[d];v.start<=m.start+m.count+1?m.count=Math.max(m.count,v.start+v.count-m.start):(++u,f[u]=v)}f.length=u+1;for(let d=0,m=f.length;d<m;d++){let v=f[d];i.bufferSubData(c,v.start*h.BYTES_PER_ELEMENT,h,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var Nd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Dd=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Ud=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Fd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Od=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Bd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,kd=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,zd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Hd=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Vd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Gd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Wd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Xd=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,qd=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Yd=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,$d=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Zd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Kd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Jd=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,jd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Qd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,tp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,ep=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,np=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,ip=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,sp=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,rp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,ap=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,op=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,lp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,cp="gl_FragColor = linearToOutputTexel( gl_FragColor );",hp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,up=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,fp=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,dp=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,pp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,mp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,gp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,xp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,yp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,vp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,_p=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Mp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,bp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Sp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Ep=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Tp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,wp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ap=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Rp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Cp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ip=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Pp=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Lp=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Np=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Dp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Up=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Fp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Op=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Bp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,kp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,zp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Hp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Vp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Gp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Wp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Xp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,qp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Yp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,$p=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Zp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Kp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Jp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,jp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Qp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,tm=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,em=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,nm=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,im=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,sm=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,rm=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,am=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,om=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,lm=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,cm=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,hm=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,um=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,fm=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,dm=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,pm=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,mm=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,gm=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,xm=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,ym=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,vm=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,_m=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Mm=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,bm=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Sm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Em=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Tm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,wm=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Am=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Rm=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Cm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Im=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Pm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Lm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Nm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Dm=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Um=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Fm=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Om=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Bm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,km=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,zm=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Hm=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Vm=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Gm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Wm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Xm=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,qm=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ym=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,$m=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zm=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Km=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Jm=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,jm=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Qm=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,t0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,e0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,n0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,i0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,s0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,r0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,a0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,o0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,l0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,c0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,h0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,u0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,f0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Bt={alphahash_fragment:Nd,alphahash_pars_fragment:Dd,alphamap_fragment:Ud,alphamap_pars_fragment:Fd,alphatest_fragment:Od,alphatest_pars_fragment:Bd,aomap_fragment:kd,aomap_pars_fragment:zd,batching_pars_vertex:Hd,batching_vertex:Vd,begin_vertex:Gd,beginnormal_vertex:Wd,bsdfs:Xd,iridescence_fragment:qd,bumpmap_pars_fragment:Yd,clipping_planes_fragment:$d,clipping_planes_pars_fragment:Zd,clipping_planes_pars_vertex:Kd,clipping_planes_vertex:Jd,color_fragment:jd,color_pars_fragment:Qd,color_pars_vertex:tp,color_vertex:ep,common:np,cube_uv_reflection_fragment:ip,defaultnormal_vertex:sp,displacementmap_pars_vertex:rp,displacementmap_vertex:ap,emissivemap_fragment:op,emissivemap_pars_fragment:lp,colorspace_fragment:cp,colorspace_pars_fragment:hp,envmap_fragment:up,envmap_common_pars_fragment:fp,envmap_pars_fragment:dp,envmap_pars_vertex:pp,envmap_physical_pars_fragment:Tp,envmap_vertex:mp,fog_vertex:gp,fog_pars_vertex:xp,fog_fragment:yp,fog_pars_fragment:vp,gradientmap_pars_fragment:_p,lightmap_pars_fragment:Mp,lights_lambert_fragment:bp,lights_lambert_pars_fragment:Sp,lights_pars_begin:Ep,lights_toon_fragment:wp,lights_toon_pars_fragment:Ap,lights_phong_fragment:Rp,lights_phong_pars_fragment:Cp,lights_physical_fragment:Ip,lights_physical_pars_fragment:Pp,lights_fragment_begin:Lp,lights_fragment_maps:Np,lights_fragment_end:Dp,lightprobes_pars_fragment:Up,logdepthbuf_fragment:Fp,logdepthbuf_pars_fragment:Op,logdepthbuf_pars_vertex:Bp,logdepthbuf_vertex:kp,map_fragment:zp,map_pars_fragment:Hp,map_particle_fragment:Vp,map_particle_pars_fragment:Gp,metalnessmap_fragment:Wp,metalnessmap_pars_fragment:Xp,morphinstance_vertex:qp,morphcolor_vertex:Yp,morphnormal_vertex:$p,morphtarget_pars_vertex:Zp,morphtarget_vertex:Kp,normal_fragment_begin:Jp,normal_fragment_maps:jp,normal_pars_fragment:Qp,normal_pars_vertex:tm,normal_vertex:em,normalmap_pars_fragment:nm,clearcoat_normal_fragment_begin:im,clearcoat_normal_fragment_maps:sm,clearcoat_pars_fragment:rm,iridescence_pars_fragment:am,opaque_fragment:om,packing:lm,premultiplied_alpha_fragment:cm,project_vertex:hm,dithering_fragment:um,dithering_pars_fragment:fm,roughnessmap_fragment:dm,roughnessmap_pars_fragment:pm,shadowmap_pars_fragment:mm,shadowmap_pars_vertex:gm,shadowmap_vertex:xm,shadowmask_pars_fragment:ym,skinbase_vertex:vm,skinning_pars_vertex:_m,skinning_vertex:Mm,skinnormal_vertex:bm,specularmap_fragment:Sm,specularmap_pars_fragment:Em,tonemapping_fragment:Tm,tonemapping_pars_fragment:wm,transmission_fragment:Am,transmission_pars_fragment:Rm,uv_pars_fragment:Cm,uv_pars_vertex:Im,uv_vertex:Pm,worldpos_vertex:Lm,background_vert:Nm,background_frag:Dm,backgroundCube_vert:Um,backgroundCube_frag:Fm,cube_vert:Om,cube_frag:Bm,depth_vert:km,depth_frag:zm,distance_vert:Hm,distance_frag:Vm,equirect_vert:Gm,equirect_frag:Wm,linedashed_vert:Xm,linedashed_frag:qm,meshbasic_vert:Ym,meshbasic_frag:$m,meshlambert_vert:Zm,meshlambert_frag:Km,meshmatcap_vert:Jm,meshmatcap_frag:jm,meshnormal_vert:Qm,meshnormal_frag:t0,meshphong_vert:e0,meshphong_frag:n0,meshphysical_vert:i0,meshphysical_frag:s0,meshtoon_vert:r0,meshtoon_frag:a0,points_vert:o0,points_frag:l0,shadow_vert:c0,shadow_frag:h0,sprite_vert:u0,sprite_frag:f0},ut={common:{diffuse:{value:new mt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Nt},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Nt}},envmap:{envMap:{value:null},envMapRotation:{value:new Nt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Nt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Nt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Nt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Nt},normalScale:{value:new It(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Nt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Nt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Nt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Nt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new mt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new U},probesMax:{value:new U},probesResolution:{value:new U}},points:{diffuse:{value:new mt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0},uvTransform:{value:new Nt}},sprite:{diffuse:{value:new mt(16777215)},opacity:{value:1},center:{value:new It(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Nt},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0}}},Wn={basic:{uniforms:ze([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.fog]),vertexShader:Bt.meshbasic_vert,fragmentShader:Bt.meshbasic_frag},lambert:{uniforms:ze([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new mt(0)},envMapIntensity:{value:1}}]),vertexShader:Bt.meshlambert_vert,fragmentShader:Bt.meshlambert_frag},phong:{uniforms:ze([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new mt(0)},specular:{value:new mt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Bt.meshphong_vert,fragmentShader:Bt.meshphong_frag},standard:{uniforms:ze([ut.common,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.roughnessmap,ut.metalnessmap,ut.fog,ut.lights,{emissive:{value:new mt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Bt.meshphysical_vert,fragmentShader:Bt.meshphysical_frag},toon:{uniforms:ze([ut.common,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.gradientmap,ut.fog,ut.lights,{emissive:{value:new mt(0)}}]),vertexShader:Bt.meshtoon_vert,fragmentShader:Bt.meshtoon_frag},matcap:{uniforms:ze([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,{matcap:{value:null}}]),vertexShader:Bt.meshmatcap_vert,fragmentShader:Bt.meshmatcap_frag},points:{uniforms:ze([ut.points,ut.fog]),vertexShader:Bt.points_vert,fragmentShader:Bt.points_frag},dashed:{uniforms:ze([ut.common,ut.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Bt.linedashed_vert,fragmentShader:Bt.linedashed_frag},depth:{uniforms:ze([ut.common,ut.displacementmap]),vertexShader:Bt.depth_vert,fragmentShader:Bt.depth_frag},normal:{uniforms:ze([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,{opacity:{value:1}}]),vertexShader:Bt.meshnormal_vert,fragmentShader:Bt.meshnormal_frag},sprite:{uniforms:ze([ut.sprite,ut.fog]),vertexShader:Bt.sprite_vert,fragmentShader:Bt.sprite_frag},background:{uniforms:{uvTransform:{value:new Nt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Bt.background_vert,fragmentShader:Bt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Nt}},vertexShader:Bt.backgroundCube_vert,fragmentShader:Bt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Bt.cube_vert,fragmentShader:Bt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Bt.equirect_vert,fragmentShader:Bt.equirect_frag},distance:{uniforms:ze([ut.common,ut.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Bt.distance_vert,fragmentShader:Bt.distance_frag},shadow:{uniforms:ze([ut.lights,ut.fog,{color:{value:new mt(0)},opacity:{value:1}}]),vertexShader:Bt.shadow_vert,fragmentShader:Bt.shadow_frag}};Wn.physical={uniforms:ze([Wn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Nt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Nt},clearcoatNormalScale:{value:new It(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Nt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Nt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Nt},sheen:{value:0},sheenColor:{value:new mt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Nt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Nt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Nt},transmissionSamplerSize:{value:new It},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Nt},attenuationDistance:{value:0},attenuationColor:{value:new mt(0)},specularColor:{value:new mt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Nt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Nt},anisotropyVector:{value:new It},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Nt}}]),vertexShader:Bt.meshphysical_vert,fragmentShader:Bt.meshphysical_frag};var Mo={r:0,b:0,g:0},d0=new Qt,qu=new Nt;qu.set(-1,0,0,0,1,0,0,0,1);function p0(i,t,e,n,s,r){let a=new mt(0),o=s===!0?0:1,l,c,h=null,f=0,u=null;function d(M){let S=M.isScene===!0?M.background:null;if(S&&S.isTexture){let b=M.backgroundBlurriness>0;S=t.get(S,b)}return S}function m(M){let S=!1,b=d(M);b===null?g(a,o):b&&b.isColor&&(g(b,1),S=!0);let T=i.xr.getEnvironmentBlendMode();T==="additive"?e.buffers.color.setClear(0,0,0,1,r):T==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||S)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function v(M,S){let b=d(S);b&&(b.isCubeTexture||b.mapping===ir)?(c===void 0&&(c=new Ht(new Ee(1,1,1),new re({name:"BackgroundCubeMaterial",uniforms:Wi(Wn.backgroundCube.uniforms),vertexShader:Wn.backgroundCube.vertexShader,fragmentShader:Wn.backgroundCube.fragmentShader,side:Ge,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(T,w,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=b,c.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(d0.makeRotationFromEuler(S.backgroundRotation)).transpose(),b.isCubeTexture&&b.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(qu),c.material.toneMapped=Gt.getTransfer(b.colorSpace)!==Jt,(h!==b||f!==b.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,h=b,f=b.version,u=i.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null)):b&&b.isTexture&&(l===void 0&&(l=new Ht(new hn(2,2),new re({name:"BackgroundMaterial",uniforms:Wi(Wn.background.uniforms),vertexShader:Wn.background.vertexShader,fragmentShader:Wn.background.fragmentShader,side:jn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=b,l.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,l.material.toneMapped=Gt.getTransfer(b.colorSpace)!==Jt,b.matrixAutoUpdate===!0&&b.updateMatrix(),l.material.uniforms.uvTransform.value.copy(b.matrix),(h!==b||f!==b.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,h=b,f=b.version,u=i.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null))}function g(M,S){M.getRGB(Mo,tc(i)),e.buffers.color.setClear(Mo.r,Mo.g,Mo.b,S,r)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(M,S=1){a.set(M),o=S,g(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(M){o=M,g(a,o)},render:m,addToRenderList:v,dispose:p}}function m0(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null),r=s,a=!1;function o(I,P,F,k,L){let z=!1,H=f(I,k,F,P);r!==H&&(r=H,c(r.object)),z=d(I,k,F,L),z&&m(I,k,F,L),L!==null&&t.update(L,i.ELEMENT_ARRAY_BUFFER),(z||a)&&(a=!1,b(I,P,F,k),L!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(L).buffer))}function l(){return i.createVertexArray()}function c(I){return i.bindVertexArray(I)}function h(I){return i.deleteVertexArray(I)}function f(I,P,F,k){let L=k.wireframe===!0,z=n[P.id];z===void 0&&(z={},n[P.id]=z);let H=I.isInstancedMesh===!0?I.id:0,$=z[H];$===void 0&&($={},z[H]=$);let Q=$[F.id];Q===void 0&&(Q={},$[F.id]=Q);let nt=Q[L];return nt===void 0&&(nt=u(l()),Q[L]=nt),nt}function u(I){let P=[],F=[],k=[];for(let L=0;L<e;L++)P[L]=0,F[L]=0,k[L]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:F,attributeDivisors:k,object:I,attributes:{},index:null}}function d(I,P,F,k){let L=r.attributes,z=P.attributes,H=0,$=F.getAttributes();for(let Q in $)if($[Q].location>=0){let st=L[Q],xt=z[Q];if(xt===void 0&&(Q==="instanceMatrix"&&I.instanceMatrix&&(xt=I.instanceMatrix),Q==="instanceColor"&&I.instanceColor&&(xt=I.instanceColor)),st===void 0||st.attribute!==xt||xt&&st.data!==xt.data)return!0;H++}return r.attributesNum!==H||r.index!==k}function m(I,P,F,k){let L={},z=P.attributes,H=0,$=F.getAttributes();for(let Q in $)if($[Q].location>=0){let st=z[Q];st===void 0&&(Q==="instanceMatrix"&&I.instanceMatrix&&(st=I.instanceMatrix),Q==="instanceColor"&&I.instanceColor&&(st=I.instanceColor));let xt={};xt.attribute=st,st&&st.data&&(xt.data=st.data),L[Q]=xt,H++}r.attributes=L,r.attributesNum=H,r.index=k}function v(){let I=r.newAttributes;for(let P=0,F=I.length;P<F;P++)I[P]=0}function g(I){p(I,0)}function p(I,P){let F=r.newAttributes,k=r.enabledAttributes,L=r.attributeDivisors;F[I]=1,k[I]===0&&(i.enableVertexAttribArray(I),k[I]=1),L[I]!==P&&(i.vertexAttribDivisor(I,P),L[I]=P)}function M(){let I=r.newAttributes,P=r.enabledAttributes;for(let F=0,k=P.length;F<k;F++)P[F]!==I[F]&&(i.disableVertexAttribArray(F),P[F]=0)}function S(I,P,F,k,L,z,H){H===!0?i.vertexAttribIPointer(I,P,F,L,z):i.vertexAttribPointer(I,P,F,k,L,z)}function b(I,P,F,k){v();let L=k.attributes,z=F.getAttributes(),H=P.defaultAttributeValues;for(let $ in z){let Q=z[$];if(Q.location>=0){let nt=L[$];if(nt===void 0&&($==="instanceMatrix"&&I.instanceMatrix&&(nt=I.instanceMatrix),$==="instanceColor"&&I.instanceColor&&(nt=I.instanceColor)),nt!==void 0){let st=nt.normalized,xt=nt.itemSize,Wt=t.get(nt);if(Wt===void 0)continue;let ue=Wt.buffer,Zt=Wt.type,J=Wt.bytesPerElement,rt=Zt===i.INT||Zt===i.UNSIGNED_INT||nt.gpuType===Da;if(nt.isInterleavedBufferAttribute){let tt=nt.data,Lt=tt.stride,Ut=nt.offset;if(tt.isInstancedInterleavedBuffer){for(let At=0;At<Q.locationSize;At++)p(Q.location+At,tt.meshPerAttribute);I.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=tt.meshPerAttribute*tt.count)}else for(let At=0;At<Q.locationSize;At++)g(Q.location+At);i.bindBuffer(i.ARRAY_BUFFER,ue);for(let At=0;At<Q.locationSize;At++)S(Q.location+At,xt/Q.locationSize,Zt,st,Lt*J,(Ut+xt/Q.locationSize*At)*J,rt)}else{if(nt.isInstancedBufferAttribute){for(let tt=0;tt<Q.locationSize;tt++)p(Q.location+tt,nt.meshPerAttribute);I.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=nt.meshPerAttribute*nt.count)}else for(let tt=0;tt<Q.locationSize;tt++)g(Q.location+tt);i.bindBuffer(i.ARRAY_BUFFER,ue);for(let tt=0;tt<Q.locationSize;tt++)S(Q.location+tt,xt/Q.locationSize,Zt,st,xt*J,xt/Q.locationSize*tt*J,rt)}}else if(H!==void 0){let st=H[$];if(st!==void 0)switch(st.length){case 2:i.vertexAttrib2fv(Q.location,st);break;case 3:i.vertexAttrib3fv(Q.location,st);break;case 4:i.vertexAttrib4fv(Q.location,st);break;default:i.vertexAttrib1fv(Q.location,st)}}}}M()}function T(){y();for(let I in n){let P=n[I];for(let F in P){let k=P[F];for(let L in k){let z=k[L];for(let H in z)h(z[H].object),delete z[H];delete k[L]}}delete n[I]}}function w(I){if(n[I.id]===void 0)return;let P=n[I.id];for(let F in P){let k=P[F];for(let L in k){let z=k[L];for(let H in z)h(z[H].object),delete z[H];delete k[L]}}delete n[I.id]}function R(I){for(let P in n){let F=n[P];for(let k in F){let L=F[k];if(L[I.id]===void 0)continue;let z=L[I.id];for(let H in z)h(z[H].object),delete z[H];delete L[I.id]}}}function x(I){for(let P in n){let F=n[P],k=I.isInstancedMesh===!0?I.id:0,L=F[k];if(L!==void 0){for(let z in L){let H=L[z];for(let $ in H)h(H[$].object),delete H[$];delete L[z]}delete F[k],Object.keys(F).length===0&&delete n[P]}}}function y(){A(),a=!0,r!==s&&(r=s,c(r.object))}function A(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:y,resetDefaultState:A,dispose:T,releaseStatesOfGeometry:w,releaseStatesOfObject:x,releaseStatesOfProgram:R,initAttributes:v,enableAttribute:g,disableUnusedAttributes:M}}function g0(i,t,e){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),e.update(c,n,1)}function a(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),e.update(c,n,h))}function o(l,c,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let u=0;for(let d=0;d<h;d++)u+=c[d];e.update(u,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function x0(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let R=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(R){return!(R!==pn&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){let x=R===Vn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(R!==Ze&&n.convert(R)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&R!==dn&&!x)}function l(R){if(R==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(Ct("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let f=e.logarithmicDepthBuffer===!0,u=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&u===!1&&Ct("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),M=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),S=i.getParameter(i.MAX_VARYING_VECTORS),b=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),T=i.getParameter(i.MAX_SAMPLES),w=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:d,maxVertexTextures:m,maxTextureSize:v,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:M,maxVaryings:S,maxFragmentUniforms:b,maxSamples:T,samples:w}}function y0(i){let t=this,e=null,n=0,s=!1,r=!1,a=new Dn,o=new Nt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){let d=f.length!==0||u||n!==0||s;return s=u,n=f.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,u){e=h(f,u,0)},this.setState=function(f,u,d){let m=f.clippingPlanes,v=f.clipIntersection,g=f.clipShadows,p=i.get(f);if(!s||m===null||m.length===0||r&&!g)r?h(null):c();else{let M=r?0:n,S=M*4,b=p.clippingState||null;l.value=b,b=h(m,u,S,d);for(let T=0;T!==S;++T)b[T]=e[T];p.clippingState=b,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(f,u,d,m){let v=f!==null?f.length:0,g=null;if(v!==0){if(g=l.value,m!==!0||g===null){let p=d+v*4,M=u.matrixWorldInverse;o.getNormalMatrix(M),(g===null||g.length<p)&&(g=new Float32Array(p));for(let S=0,b=d;S!==v;++S,b+=4)a.copy(f[S]).applyMatrix4(M,o),a.normal.toArray(g,b),g[b+3]=a.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,g}}var Ti=4,Su=[.125,.215,.35,.446,.526,.582],Xi=20,v0=256,fr=new yi,Eu=new mt,cc=null,hc=0,uc=0,fc=!1,_0=new U,So=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){let{size:a=256,position:o=_0}=r;cc=this._renderer.getRenderTarget(),hc=this._renderer.getActiveCubeFace(),uc=this._renderer.getActiveMipmapLevel(),fc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,n,s,l,o),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Au(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=wu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(cc,hc,uc),this._renderer.xr.enabled=fc,t.scissorTest=!1,Ms(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===_i||t.mapping===Gi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),cc=this._renderer.getRenderTarget(),hc=this._renderer.getActiveCubeFace(),uc=this._renderer.getActiveMipmapLevel(),fc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Ue,minFilter:Ue,generateMipmaps:!1,type:Vn,format:pn,colorSpace:Bs,depthBuffer:!1},s=Tu(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Tu(t,e,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=M0(r)),this._blurMaterial=S0(r,t,e),this._ggxMaterial=b0(r,t,e)}return s}_compileMaterial(t){let e=new Ht(new he,t);this._renderer.compile(e,fr)}_sceneToCubeUV(t,e,n,s,r){let l=new De(90,1,e,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],f=this._renderer,u=f.autoClear,d=f.toneMapping;f.getClearColor(Eu),f.toneMapping=Sn,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Ht(new Ee,new cn({name:"PMREM.Background",side:Ge,depthWrite:!1,depthTest:!1})));let v=this._backgroundBox,g=v.material,p=!1,M=t.background;M?M.isColor&&(g.color.copy(M),t.background=null,p=!0):(g.color.copy(Eu),p=!0);for(let S=0;S<6;S++){let b=S%3;b===0?(l.up.set(0,c[S],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[S],r.y,r.z)):b===1?(l.up.set(0,0,c[S]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[S],r.z)):(l.up.set(0,c[S],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[S]));let T=this._cubeSize;Ms(s,b*T,S>2?T:0,T,T),f.setRenderTarget(s),p&&f.render(v,l),f.render(t,l)}f.toneMapping=d,f.autoClear=u,t.background=M}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===_i||t.mapping===Gi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Au()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=wu());let r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=t;let l=this._cubeSize;Ms(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,fr)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(t,r-1,r);e.autoClear=n}_applyGGXFilter(t,e,n){let s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let l=a.uniforms,c=n/(this._lodMeshes.length-1),h=e/(this._lodMeshes.length-1),f=Math.sqrt(c*c-h*h),u=0+c*1.25,d=f*u,{_lodMax:m}=this,v=this._sizeLods[n],g=3*v*(n>m-Ti?n-m+Ti:0),p=4*(this._cubeSize-v);l.envMap.value=t.texture,l.roughness.value=d,l.mipInt.value=m-e,Ms(r,g,p,3*v,2*v),s.setRenderTarget(r),s.render(o,fr),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=m-n,Ms(t,g,p,3*v,2*v),s.setRenderTarget(t),s.render(o,fr)}_blur(t,e,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&Pt("blur direction must be either latitudinal or longitudinal!");let h=3,f=this._lodMeshes[s];f.material=c;let u=c.uniforms,d=this._sizeLods[n]-1,m=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*Xi-1),v=r/m,g=isFinite(r)?1+Math.floor(h*v):Xi;g>Xi&&Ct(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${Xi}`);let p=[],M=0;for(let R=0;R<Xi;++R){let x=R/v,y=Math.exp(-x*x/2);p.push(y),R===0?M+=y:R<g&&(M+=2*y)}for(let R=0;R<p.length;R++)p[R]=p[R]/M;u.envMap.value=t.texture,u.samples.value=g,u.weights.value=p,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);let{_lodMax:S}=this;u.dTheta.value=m,u.mipInt.value=S-n;let b=this._sizeLods[s],T=3*b*(s>S-Ti?s-S+Ti:0),w=4*(this._cubeSize-b);Ms(e,T,w,3*b,2*b),l.setRenderTarget(e),l.render(f,fr)}};function M0(i){let t=[],e=[],n=[],s=i,r=i-Ti+1+Su.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);t.push(o);let l=1/o;a>i-Ti?l=Su[a-i+Ti-1]:a===0&&(l=0),e.push(l);let c=1/(o-2),h=-c,f=1+c,u=[h,h,f,h,f,f,h,h,f,f,h,f],d=6,m=6,v=3,g=2,p=1,M=new Float32Array(v*m*d),S=new Float32Array(g*m*d),b=new Float32Array(p*m*d);for(let w=0;w<d;w++){let R=w%3*2/3-1,x=w>2?0:-1,y=[R,x,0,R+2/3,x,0,R+2/3,x+1,0,R,x,0,R+2/3,x+1,0,R,x+1,0];M.set(y,v*m*w),S.set(u,g*m*w);let A=[w,w,w,w,w,w];b.set(A,p*m*w)}let T=new he;T.setAttribute("position",new zt(M,v)),T.setAttribute("uv",new zt(S,g)),T.setAttribute("faceIndex",new zt(b,p)),n.push(new Ht(T,null)),s>Ti&&s--}return{lodMeshes:n,sizeLods:t,sigmas:e}}function Tu(i,t,e){let n=new Ve(i,t,e);return n.texture.mapping=ir,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ms(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function b0(i,t,e){return new re({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:v0,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:wo(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:zn,depthTest:!1,depthWrite:!1})}function S0(i,t,e){let n=new Float32Array(Xi),s=new U(0,1,0);return new re({name:"SphericalGaussianBlur",defines:{n:Xi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:wo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:zn,depthTest:!1,depthWrite:!1})}function wu(){return new re({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:wo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:zn,depthTest:!1,depthWrite:!1})}function Au(){return new re({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:wo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:zn,depthTest:!1,depthWrite:!1})}function wo(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}var Eo=class extends Ve{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new $s(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Ee(5,5,5),r=new re({name:"CubemapFromEquirect",uniforms:Wi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ge,blending:zn});r.uniforms.tEquirect.value=e;let a=new Ht(s,r),o=e.minFilter;return e.minFilter===Mi&&(e.minFilter=Ue),new Ra(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}};function E0(i){let t=new WeakMap,e=new WeakMap,n=null;function s(u,d=!1){return u==null?null:d?a(u):r(u)}function r(u){if(u&&u.isTexture){let d=u.mapping;if(d===Pa||d===La)if(t.has(u)){let m=t.get(u).texture;return o(m,u.mapping)}else{let m=u.image;if(m&&m.height>0){let v=new Eo(m.height);return v.fromEquirectangularTexture(i,u),t.set(u,v),u.addEventListener("dispose",c),o(v.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){let d=u.mapping,m=d===Pa||d===La,v=d===_i||d===Gi;if(m||v){let g=e.get(u),p=g!==void 0?g.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return n===null&&(n=new So(i)),g=m?n.fromEquirectangular(u,g):n.fromCubemap(u,g),g.texture.pmremVersion=u.pmremVersion,e.set(u,g),g.texture;if(g!==void 0)return g.texture;{let M=u.image;return m&&M&&M.height>0||v&&M&&l(M)?(n===null&&(n=new So(i)),g=m?n.fromEquirectangular(u):n.fromCubemap(u),g.texture.pmremVersion=u.pmremVersion,e.set(u,g),u.addEventListener("dispose",h),g.texture):null}}}return u}function o(u,d){return d===Pa?u.mapping=_i:d===La&&(u.mapping=Gi),u}function l(u){let d=0,m=6;for(let v=0;v<m;v++)u[v]!==void 0&&d++;return d===m}function c(u){let d=u.target;d.removeEventListener("dispose",c);let m=t.get(d);m!==void 0&&(t.delete(d),m.dispose())}function h(u){let d=u.target;d.removeEventListener("dispose",h);let m=e.get(d);m!==void 0&&(e.delete(d),m.dispose())}function f(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:f}}function T0(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&Oi("WebGLRenderer: "+n+" extension not supported."),s}}}function w0(i,t,e,n){let s={},r=new WeakMap;function a(f){let u=f.target;u.index!==null&&t.remove(u.index);for(let m in u.attributes)t.remove(u.attributes[m]);u.removeEventListener("dispose",a),delete s[u.id];let d=r.get(u);d&&(t.remove(d),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function o(f,u){return s[u.id]===!0||(u.addEventListener("dispose",a),s[u.id]=!0,e.memory.geometries++),u}function l(f){let u=f.attributes;for(let d in u)t.update(u[d],i.ARRAY_BUFFER)}function c(f){let u=[],d=f.index,m=f.attributes.position,v=0;if(m===void 0)return;if(d!==null){let M=d.array;v=d.version;for(let S=0,b=M.length;S<b;S+=3){let T=M[S+0],w=M[S+1],R=M[S+2];u.push(T,w,w,R,R,T)}}else{let M=m.array;v=m.version;for(let S=0,b=M.length/3-1;S<b;S+=3){let T=S+0,w=S+1,R=S+2;u.push(T,w,w,R,R,T)}}let g=new(m.count>=65535?Ws:Gs)(u,1);g.version=v;let p=r.get(f);p&&t.remove(p),r.set(f,g)}function h(f){let u=r.get(f);if(u){let d=f.index;d!==null&&u.version<d.version&&c(f)}else c(f);return r.get(f)}return{get:o,update:l,getWireframeAttribute:h}}function A0(i,t,e){let n;function s(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function l(f,u){i.drawElements(n,u,r,f*a),e.update(u,n,1)}function c(f,u,d){d!==0&&(i.drawElementsInstanced(n,u,r,f*a,d),e.update(u,n,d))}function h(f,u,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,r,f,0,d);let v=0;for(let g=0;g<d;g++)v+=u[g];e.update(v,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function R0(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:Pt("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function C0(i,t,e){let n=new WeakMap,s=new le;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=h!==void 0?h.length:0,u=n.get(o);if(u===void 0||u.count!==f){let y=function(){R.dispose(),n.delete(o),o.removeEventListener("dispose",y)};u!==void 0&&u.texture.dispose();let d=o.morphAttributes.position!==void 0,m=o.morphAttributes.normal!==void 0,v=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],M=o.morphAttributes.color||[],S=0;d===!0&&(S=1),m===!0&&(S=2),v===!0&&(S=3);let b=o.attributes.position.count*S,T=1;b>t.maxTextureSize&&(T=Math.ceil(b/t.maxTextureSize),b=t.maxTextureSize);let w=new Float32Array(b*T*4*f),R=new Hs(w,b,T,f);R.type=dn,R.needsUpdate=!0;let x=S*4;for(let A=0;A<f;A++){let I=g[A],P=p[A],F=M[A],k=b*T*4*A;for(let L=0;L<I.count;L++){let z=L*x;d===!0&&(s.fromBufferAttribute(I,L),w[k+z+0]=s.x,w[k+z+1]=s.y,w[k+z+2]=s.z,w[k+z+3]=0),m===!0&&(s.fromBufferAttribute(P,L),w[k+z+4]=s.x,w[k+z+5]=s.y,w[k+z+6]=s.z,w[k+z+7]=0),v===!0&&(s.fromBufferAttribute(F,L),w[k+z+8]=s.x,w[k+z+9]=s.y,w[k+z+10]=s.z,w[k+z+11]=F.itemSize===4?s.w:1)}}u={count:f,texture:R,size:new It(b,T)},n.set(o,u),o.addEventListener("dispose",y)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let d=0;for(let v=0;v<c.length;v++)d+=c[v];let m=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(i,"morphTargetBaseInfluence",m),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",u.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function I0(i,t,e,n,s){let r=new WeakMap;function a(c){let h=s.render.frame,f=c.geometry,u=t.get(c,f);if(r.get(u)!==h&&(t.update(u),r.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let d=c.skeleton;r.get(d)!==h&&(d.update(),r.set(d,h))}return u}function o(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:a,dispose:o}}var P0={[kl]:"LINEAR_TONE_MAPPING",[zl]:"REINHARD_TONE_MAPPING",[Hl]:"CINEON_TONE_MAPPING",[nr]:"ACES_FILMIC_TONE_MAPPING",[Gl]:"AGX_TONE_MAPPING",[Wl]:"NEUTRAL_TONE_MAPPING",[Vl]:"CUSTOM_TONE_MAPPING"};function L0(i,t,e,n,s,r){let a=new Ve(t,e,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,depthTexture:s?new ei(t,e):void 0}),o=new Ve(t,e,{type:Vn,depthBuffer:!1,stencilBuffer:!1}),l=new he;l.setAttribute("position",new ee([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new ee([0,2,0,0,2,0],2));let c=new pa({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),h=new Ht(l,c),f=new yi(-1,1,1,-1,0,1),u=null,d=null,m=!1,v,g=null,p=[],M=!1;this.setSize=function(S,b){a.setSize(S,b),o.setSize(S,b);for(let T=0;T<p.length;T++){let w=p[T];w.setSize&&w.setSize(S,b)}},this.setEffects=function(S){p=S,M=p.length>0&&p[0].isRenderPass===!0;let b=a.width,T=a.height;for(let w=0;w<p.length;w++){let R=p[w];R.setSize&&R.setSize(b,T)}},this.begin=function(S,b){if(m||S.toneMapping===Sn&&p.length===0)return!1;if(g=b,b!==null){let T=b.width,w=b.height;(a.width!==T||a.height!==w)&&this.setSize(T,w)}return M===!1&&S.setRenderTarget(a),v=S.toneMapping,S.toneMapping=Sn,!0},this.hasRenderPass=function(){return M},this.end=function(S,b){S.toneMapping=v,m=!0;let T=a,w=o;for(let R=0;R<p.length;R++){let x=p[R];if(x.enabled!==!1&&(x.render(S,w,T,b),x.needsSwap!==!1)){let y=T;T=w,w=y}}if(u!==S.outputColorSpace||d!==S.toneMapping){u=S.outputColorSpace,d=S.toneMapping,c.defines={},Gt.getTransfer(u)===Jt&&(c.defines.SRGB_TRANSFER="");let R=P0[d];R&&(c.defines[R]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=T.texture,S.setRenderTarget(g),S.render(h,f),g=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){a.depthTexture&&a.depthTexture.dispose(),a.dispose(),o.dispose(),l.dispose(),c.dispose()}}var Yu=new He,mc=new ei(1,1),$u=new Hs,Zu=new ha,Ku=new $s,Ru=[],Cu=[],Iu=new Float32Array(16),Pu=new Float32Array(9),Lu=new Float32Array(4);function Ss(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=Ru[s];if(r===void 0&&(r=new Float32Array(s),Ru[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function we(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Ae(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Ao(i,t){let e=Cu[t];e===void 0&&(e=new Int32Array(t),Cu[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function N0(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function D0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(we(e,t))return;i.uniform2fv(this.addr,t),Ae(e,t)}}function U0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(we(e,t))return;i.uniform3fv(this.addr,t),Ae(e,t)}}function F0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(we(e,t))return;i.uniform4fv(this.addr,t),Ae(e,t)}}function O0(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(we(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Ae(e,t)}else{if(we(e,n))return;Lu.set(n),i.uniformMatrix2fv(this.addr,!1,Lu),Ae(e,n)}}function B0(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(we(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Ae(e,t)}else{if(we(e,n))return;Pu.set(n),i.uniformMatrix3fv(this.addr,!1,Pu),Ae(e,n)}}function k0(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(we(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Ae(e,t)}else{if(we(e,n))return;Iu.set(n),i.uniformMatrix4fv(this.addr,!1,Iu),Ae(e,n)}}function z0(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function H0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(we(e,t))return;i.uniform2iv(this.addr,t),Ae(e,t)}}function V0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(we(e,t))return;i.uniform3iv(this.addr,t),Ae(e,t)}}function G0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(we(e,t))return;i.uniform4iv(this.addr,t),Ae(e,t)}}function W0(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function X0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(we(e,t))return;i.uniform2uiv(this.addr,t),Ae(e,t)}}function q0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(we(e,t))return;i.uniform3uiv(this.addr,t),Ae(e,t)}}function Y0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(we(e,t))return;i.uniform4uiv(this.addr,t),Ae(e,t)}}function $0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(mc.compareFunction=e.isReversedDepthBuffer()?_o:vo,r=mc):r=Yu,e.setTexture2D(t||r,s)}function Z0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Zu,s)}function K0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Ku,s)}function J0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||$u,s)}function j0(i){switch(i){case 5126:return N0;case 35664:return D0;case 35665:return U0;case 35666:return F0;case 35674:return O0;case 35675:return B0;case 35676:return k0;case 5124:case 35670:return z0;case 35667:case 35671:return H0;case 35668:case 35672:return V0;case 35669:case 35673:return G0;case 5125:return W0;case 36294:return X0;case 36295:return q0;case 36296:return Y0;case 35678:case 36198:case 36298:case 36306:case 35682:return $0;case 35679:case 36299:case 36307:return Z0;case 35680:case 36300:case 36308:case 36293:return K0;case 36289:case 36303:case 36311:case 36292:return J0}}function Q0(i,t){i.uniform1fv(this.addr,t)}function tg(i,t){let e=Ss(t,this.size,2);i.uniform2fv(this.addr,e)}function eg(i,t){let e=Ss(t,this.size,3);i.uniform3fv(this.addr,e)}function ng(i,t){let e=Ss(t,this.size,4);i.uniform4fv(this.addr,e)}function ig(i,t){let e=Ss(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function sg(i,t){let e=Ss(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function rg(i,t){let e=Ss(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function ag(i,t){i.uniform1iv(this.addr,t)}function og(i,t){i.uniform2iv(this.addr,t)}function lg(i,t){i.uniform3iv(this.addr,t)}function cg(i,t){i.uniform4iv(this.addr,t)}function hg(i,t){i.uniform1uiv(this.addr,t)}function ug(i,t){i.uniform2uiv(this.addr,t)}function fg(i,t){i.uniform3uiv(this.addr,t)}function dg(i,t){i.uniform4uiv(this.addr,t)}function pg(i,t,e){let n=this.cache,s=t.length,r=Ao(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=mc:a=Yu;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function mg(i,t,e){let n=this.cache,s=t.length,r=Ao(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||Zu,r[a])}function gg(i,t,e){let n=this.cache,s=t.length,r=Ao(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||Ku,r[a])}function xg(i,t,e){let n=this.cache,s=t.length,r=Ao(e,s);we(n,r)||(i.uniform1iv(this.addr,r),Ae(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||$u,r[a])}function yg(i){switch(i){case 5126:return Q0;case 35664:return tg;case 35665:return eg;case 35666:return ng;case 35674:return ig;case 35675:return sg;case 35676:return rg;case 5124:case 35670:return ag;case 35667:case 35671:return og;case 35668:case 35672:return lg;case 35669:case 35673:return cg;case 5125:return hg;case 36294:return ug;case 36295:return fg;case 36296:return dg;case 35678:case 36198:case 36298:case 36306:case 35682:return pg;case 35679:case 36299:case 36307:return mg;case 35680:case 36300:case 36308:case 36293:return gg;case 36289:case 36303:case 36311:case 36292:return xg}}var gc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=j0(e.type)}},xc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=yg(e.type)}},yc=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],n)}}},dc=/(\w+)(\])?(\[|\.)?/g;function Nu(i,t){i.seq.push(t),i.map[t.id]=t}function vg(i,t,e){let n=i.name,s=n.length;for(dc.lastIndex=0;;){let r=dc.exec(n),a=dc.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){Nu(e,c===void 0?new gc(o,i,t):new xc(o,i,t));break}else{let f=e.map[o];f===void 0&&(f=new yc(o),Nu(e,f)),e=f}}}var bs=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);vg(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&n.push(a)}return n}};function Du(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var _g=37297,Mg=0;function bg(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}var Uu=new Nt;function Sg(i){Gt._getMatrix(Uu,Gt.workingColorSpace,i);let t=`mat3( ${Uu.elements.map(e=>e.toFixed(4))} )`;switch(Gt.getTransfer(i)){case ks:return[t,"LinearTransferOETF"];case Jt:return[t,"sRGBTransferOETF"];default:return Ct("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Fu(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+bg(i.getShaderSource(t),o)}else return r}function Eg(i,t){let e=Sg(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}var Tg={[kl]:"Linear",[zl]:"Reinhard",[Hl]:"Cineon",[nr]:"ACESFilmic",[Gl]:"AgX",[Wl]:"Neutral",[Vl]:"Custom"};function wg(i,t){let e=Tg[t];return e===void 0?(Ct("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var bo=new U;function Ag(){Gt.getLuminanceCoefficients(bo);let i=bo.x.toFixed(4),t=bo.y.toFixed(4),e=bo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Rg(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(pr).join(`
`)}function Cg(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Ig(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function pr(i){return i!==""}function Ou(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Bu(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var Pg=/^[ \t]*#include +<([\w\d./]+)>/gm;function vc(i){return i.replace(Pg,Ng)}var Lg=new Map;function Ng(i,t){let e=Bt[t];if(e===void 0){let n=Lg.get(t);if(n!==void 0)e=Bt[n],Ct('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return vc(e)}var Dg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ku(i){return i.replace(Dg,Ug)}function Ug(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function zu(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var Fg={[er]:"SHADOWMAP_TYPE_PCF",[ys]:"SHADOWMAP_TYPE_VSM"};function Og(i){return Fg[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Bg={[_i]:"ENVMAP_TYPE_CUBE",[Gi]:"ENVMAP_TYPE_CUBE",[ir]:"ENVMAP_TYPE_CUBE_UV"};function kg(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":Bg[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var zg={[Gi]:"ENVMAP_MODE_REFRACTION"};function Hg(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":zg[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Vg={[Bl]:"ENVMAP_BLENDING_MULTIPLY",[ru]:"ENVMAP_BLENDING_MIX",[au]:"ENVMAP_BLENDING_ADD"};function Gg(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Vg[i.combine]||"ENVMAP_BLENDING_NONE"}function Wg(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Xg(i,t,e,n){let s=i.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=Og(e),c=kg(e),h=Hg(e),f=Gg(e),u=Wg(e),d=Rg(e),m=Cg(r),v=s.createProgram(),g,p,M=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(pr).join(`
`),g.length>0&&(g+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(pr).join(`
`),p.length>0&&(p+=`
`)):(g=[zu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(pr).join(`
`),p=[zu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Sn?"#define TONE_MAPPING":"",e.toneMapping!==Sn?Bt.tonemapping_pars_fragment:"",e.toneMapping!==Sn?wg("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Bt.colorspace_pars_fragment,Eg("linearToOutputTexel",e.outputColorSpace),Ag(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(pr).join(`
`)),a=vc(a),a=Ou(a,e),a=Bu(a,e),o=vc(o),o=Ou(o,e),o=Bu(o,e),a=ku(a),o=ku(o),e.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,g=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,p=["#define varying in",e.glslVersion===jl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===jl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let S=M+g+a,b=M+p+o,T=Du(s,s.VERTEX_SHADER,S),w=Du(s,s.FRAGMENT_SHADER,b);s.attachShader(v,T),s.attachShader(v,w),e.index0AttributeName!==void 0?s.bindAttribLocation(v,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function R(I){if(i.debug.checkShaderErrors){let P=s.getProgramInfoLog(v)||"",F=s.getShaderInfoLog(T)||"",k=s.getShaderInfoLog(w)||"",L=P.trim(),z=F.trim(),H=k.trim(),$=!0,Q=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if($=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,v,T,w);else{let nt=Fu(s,T,"vertex"),st=Fu(s,w,"fragment");Pt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+L+`
`+nt+`
`+st)}else L!==""?Ct("WebGLProgram: Program Info Log:",L):(z===""||H==="")&&(Q=!1);Q&&(I.diagnostics={runnable:$,programLog:L,vertexShader:{log:z,prefix:g},fragmentShader:{log:H,prefix:p}})}s.deleteShader(T),s.deleteShader(w),x=new bs(s,v),y=Ig(s,v)}let x;this.getUniforms=function(){return x===void 0&&R(this),x};let y;this.getAttributes=function(){return y===void 0&&R(this),y};let A=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return A===!1&&(A=s.getProgramParameter(v,_g)),A},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Mg++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=T,this.fragmentShader=w,this}var qg=0,_c=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){let s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new Mc(t),e.set(t,n)),n}},Mc=class{constructor(t){this.id=qg++,this.code=t,this.usedTimes=0}};function Yg(i){return i===Si||i===cr||i===hr}function $g(i,t,e,n,s,r){let a=new Vs,o=new _c,l=new Set,c=[],h=new Map,f=n.logarithmicDepthBuffer,u=n.precision,d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(x){return l.add(x),x===0?"uv":`uv${x}`}function v(x,y,A,I,P,F){let k=I.fog,L=P.geometry,z=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?I.environment:null,H=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,$=t.get(x.envMap||z,H),Q=$&&$.mapping===ir?$.image.height:null,nt=d[x.type];x.precision!==null&&(u=n.getMaxPrecision(x.precision),u!==x.precision&&Ct("WebGLProgram.getParameters:",x.precision,"not supported, using",u,"instead."));let st=L.morphAttributes.position||L.morphAttributes.normal||L.morphAttributes.color,xt=st!==void 0?st.length:0,Wt=0;L.morphAttributes.position!==void 0&&(Wt=1),L.morphAttributes.normal!==void 0&&(Wt=2),L.morphAttributes.color!==void 0&&(Wt=3);let ue,Zt,J,rt;if(nt){let vt=Wn[nt];ue=vt.vertexShader,Zt=vt.fragmentShader}else{ue=x.vertexShader,Zt=x.fragmentShader;let vt=o.getVertexShaderStage(x),de=o.getFragmentShaderStage(x);o.update(x,vt,de),J=vt.id,rt=de.id}let tt=i.getRenderTarget(),Lt=i.state.buffers.depth.getReversed(),Ut=P.isInstancedMesh===!0,At=P.isBatchedMesh===!0,me=!!x.map,Vt=!!x.matcap,ne=!!$,Kt=!!x.aoMap,qt=!!x.lightMap,ve=!!x.bumpMap&&x.wireframe===!1,Se=!!x.normalMap,Ce=!!x.displacementMap,Le=!!x.emissiveMap,fe=!!x.metalnessMap,_e=!!x.roughnessMap,D=x.anisotropy>0,Xe=x.clearcoat>0,jt=x.dispersion>0,C=x.iridescence>0,_=x.sheen>0,B=x.transmission>0,W=D&&!!x.anisotropyMap,q=Xe&&!!x.clearcoatMap,et=Xe&&!!x.clearcoatNormalMap,at=Xe&&!!x.clearcoatRoughnessMap,Y=C&&!!x.iridescenceMap,K=C&&!!x.iridescenceThicknessMap,ot=_&&!!x.sheenColorMap,St=_&&!!x.sheenRoughnessMap,ht=!!x.specularMap,lt=!!x.specularColorMap,wt=!!x.specularIntensityMap,Rt=B&&!!x.transmissionMap,Ft=B&&!!x.thicknessMap,N=!!x.gradientMap,it=!!x.alphaMap,Z=x.alphaTest>0,ct=!!x.alphaHash,pt=!!x.extensions,j=Sn;x.toneMapped&&(tt===null||tt.isXRRenderTarget===!0)&&(j=i.toneMapping);let bt={shaderID:nt,shaderType:x.type,shaderName:x.name,vertexShader:ue,fragmentShader:Zt,defines:x.defines,customVertexShaderID:J,customFragmentShaderID:rt,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:u,batching:At,batchingColor:At&&P._colorsTexture!==null,instancing:Ut,instancingColor:Ut&&P.instanceColor!==null,instancingMorph:Ut&&P.morphTexture!==null,outputColorSpace:tt===null?i.outputColorSpace:tt.isXRRenderTarget===!0?tt.texture.colorSpace:Gt.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:me,matcap:Vt,envMap:ne,envMapMode:ne&&$.mapping,envMapCubeUVHeight:Q,aoMap:Kt,lightMap:qt,bumpMap:ve,normalMap:Se,displacementMap:Ce,emissiveMap:Le,normalMapObjectSpace:Se&&x.normalMapType===cu,normalMapTangentSpace:Se&&x.normalMapType===yo,packedNormalMap:Se&&x.normalMapType===yo&&Yg(x.normalMap.format),metalnessMap:fe,roughnessMap:_e,anisotropy:D,anisotropyMap:W,clearcoat:Xe,clearcoatMap:q,clearcoatNormalMap:et,clearcoatRoughnessMap:at,dispersion:jt,iridescence:C,iridescenceMap:Y,iridescenceThicknessMap:K,sheen:_,sheenColorMap:ot,sheenRoughnessMap:St,specularMap:ht,specularColorMap:lt,specularIntensityMap:wt,transmission:B,transmissionMap:Rt,thicknessMap:Ft,gradientMap:N,opaque:x.transparent===!1&&x.blending===Bi&&x.alphaToCoverage===!1,alphaMap:it,alphaTest:Z,alphaHash:ct,combine:x.combine,mapUv:me&&m(x.map.channel),aoMapUv:Kt&&m(x.aoMap.channel),lightMapUv:qt&&m(x.lightMap.channel),bumpMapUv:ve&&m(x.bumpMap.channel),normalMapUv:Se&&m(x.normalMap.channel),displacementMapUv:Ce&&m(x.displacementMap.channel),emissiveMapUv:Le&&m(x.emissiveMap.channel),metalnessMapUv:fe&&m(x.metalnessMap.channel),roughnessMapUv:_e&&m(x.roughnessMap.channel),anisotropyMapUv:W&&m(x.anisotropyMap.channel),clearcoatMapUv:q&&m(x.clearcoatMap.channel),clearcoatNormalMapUv:et&&m(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:at&&m(x.clearcoatRoughnessMap.channel),iridescenceMapUv:Y&&m(x.iridescenceMap.channel),iridescenceThicknessMapUv:K&&m(x.iridescenceThicknessMap.channel),sheenColorMapUv:ot&&m(x.sheenColorMap.channel),sheenRoughnessMapUv:St&&m(x.sheenRoughnessMap.channel),specularMapUv:ht&&m(x.specularMap.channel),specularColorMapUv:lt&&m(x.specularColorMap.channel),specularIntensityMapUv:wt&&m(x.specularIntensityMap.channel),transmissionMapUv:Rt&&m(x.transmissionMap.channel),thicknessMapUv:Ft&&m(x.thicknessMap.channel),alphaMapUv:it&&m(x.alphaMap.channel),vertexTangents:!!L.attributes.tangent&&(Se||D),vertexNormals:!!L.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!L.attributes.color&&L.attributes.color.itemSize===4,pointsUvs:P.isPoints===!0&&!!L.attributes.uv&&(me||it),fog:!!k,useFog:x.fog===!0,fogExp2:!!k&&k.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||L.attributes.normal===void 0&&Se===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:Lt,skinning:P.isSkinnedMesh===!0,hasPositionAttribute:L.attributes.position!==void 0,morphTargets:L.morphAttributes.position!==void 0,morphNormals:L.morphAttributes.normal!==void 0,morphColors:L.morphAttributes.color!==void 0,morphTargetsCount:xt,morphTextureStride:Wt,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numLightProbeGrids:F.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:x.dithering,shadowMapEnabled:i.shadowMap.enabled&&A.length>0,shadowMapType:i.shadowMap.type,toneMapping:j,decodeVideoTexture:me&&x.map.isVideoTexture===!0&&Gt.getTransfer(x.map.colorSpace)===Jt,decodeVideoTextureEmissive:Le&&x.emissiveMap.isVideoTexture===!0&&Gt.getTransfer(x.emissiveMap.colorSpace)===Jt,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===fn,flipSided:x.side===Ge,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:pt&&x.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(pt&&x.extensions.multiDraw===!0||At)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return bt.vertexUv1s=l.has(1),bt.vertexUv2s=l.has(2),bt.vertexUv3s=l.has(3),l.clear(),bt}function g(x){let y=[];if(x.shaderID?y.push(x.shaderID):(y.push(x.customVertexShaderID),y.push(x.customFragmentShaderID)),x.defines!==void 0)for(let A in x.defines)y.push(A),y.push(x.defines[A]);return x.isRawShaderMaterial===!1&&(p(y,x),M(y,x),y.push(i.outputColorSpace)),y.push(x.customProgramCacheKey),y.join()}function p(x,y){x.push(y.precision),x.push(y.outputColorSpace),x.push(y.envMapMode),x.push(y.envMapCubeUVHeight),x.push(y.mapUv),x.push(y.alphaMapUv),x.push(y.lightMapUv),x.push(y.aoMapUv),x.push(y.bumpMapUv),x.push(y.normalMapUv),x.push(y.displacementMapUv),x.push(y.emissiveMapUv),x.push(y.metalnessMapUv),x.push(y.roughnessMapUv),x.push(y.anisotropyMapUv),x.push(y.clearcoatMapUv),x.push(y.clearcoatNormalMapUv),x.push(y.clearcoatRoughnessMapUv),x.push(y.iridescenceMapUv),x.push(y.iridescenceThicknessMapUv),x.push(y.sheenColorMapUv),x.push(y.sheenRoughnessMapUv),x.push(y.specularMapUv),x.push(y.specularColorMapUv),x.push(y.specularIntensityMapUv),x.push(y.transmissionMapUv),x.push(y.thicknessMapUv),x.push(y.combine),x.push(y.fogExp2),x.push(y.sizeAttenuation),x.push(y.morphTargetsCount),x.push(y.morphAttributeCount),x.push(y.numDirLights),x.push(y.numPointLights),x.push(y.numSpotLights),x.push(y.numSpotLightMaps),x.push(y.numHemiLights),x.push(y.numRectAreaLights),x.push(y.numDirLightShadows),x.push(y.numPointLightShadows),x.push(y.numSpotLightShadows),x.push(y.numSpotLightShadowsWithMaps),x.push(y.numLightProbes),x.push(y.shadowMapType),x.push(y.toneMapping),x.push(y.numClippingPlanes),x.push(y.numClipIntersection),x.push(y.depthPacking)}function M(x,y){a.disableAll(),y.instancing&&a.enable(0),y.instancingColor&&a.enable(1),y.instancingMorph&&a.enable(2),y.matcap&&a.enable(3),y.envMap&&a.enable(4),y.normalMapObjectSpace&&a.enable(5),y.normalMapTangentSpace&&a.enable(6),y.clearcoat&&a.enable(7),y.iridescence&&a.enable(8),y.alphaTest&&a.enable(9),y.vertexColors&&a.enable(10),y.vertexAlphas&&a.enable(11),y.vertexUv1s&&a.enable(12),y.vertexUv2s&&a.enable(13),y.vertexUv3s&&a.enable(14),y.vertexTangents&&a.enable(15),y.anisotropy&&a.enable(16),y.alphaHash&&a.enable(17),y.batching&&a.enable(18),y.dispersion&&a.enable(19),y.batchingColor&&a.enable(20),y.gradientMap&&a.enable(21),y.packedNormalMap&&a.enable(22),y.vertexNormals&&a.enable(23),x.push(a.mask),a.disableAll(),y.fog&&a.enable(0),y.useFog&&a.enable(1),y.flatShading&&a.enable(2),y.logarithmicDepthBuffer&&a.enable(3),y.reversedDepthBuffer&&a.enable(4),y.skinning&&a.enable(5),y.morphTargets&&a.enable(6),y.morphNormals&&a.enable(7),y.morphColors&&a.enable(8),y.premultipliedAlpha&&a.enable(9),y.shadowMapEnabled&&a.enable(10),y.doubleSided&&a.enable(11),y.flipSided&&a.enable(12),y.useDepthPacking&&a.enable(13),y.dithering&&a.enable(14),y.transmission&&a.enable(15),y.sheen&&a.enable(16),y.opaque&&a.enable(17),y.pointsUvs&&a.enable(18),y.decodeVideoTexture&&a.enable(19),y.decodeVideoTextureEmissive&&a.enable(20),y.alphaToCoverage&&a.enable(21),y.numLightProbeGrids>0&&a.enable(22),y.hasPositionAttribute&&a.enable(23),x.push(a.mask)}function S(x){let y=d[x.type],A;if(y){let I=Wn[y];A=Mu.clone(I.uniforms)}else A=x.uniforms;return A}function b(x,y){let A=h.get(y);return A!==void 0?++A.usedTimes:(A=new Xg(i,y,x,s),c.push(A),h.set(y,A)),A}function T(x){if(--x.usedTimes===0){let y=c.indexOf(x);c[y]=c[c.length-1],c.pop(),h.delete(x.cacheKey),x.destroy()}}function w(x){o.remove(x)}function R(){o.dispose()}return{getParameters:v,getProgramCacheKey:g,getUniforms:S,acquireProgram:b,releaseProgram:T,releaseShaderCache:w,programs:c,dispose:R}}function Zg(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function Kg(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function Hu(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Vu(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(u){let d=0;return u.isInstancedMesh&&(d+=2),u.isSkinnedMesh&&(d+=1),d}function o(u,d,m,v,g,p){let M=i[t];return M===void 0?(M={id:u.id,object:u,geometry:d,material:m,materialVariant:a(u),groupOrder:v,renderOrder:u.renderOrder,z:g,group:p},i[t]=M):(M.id=u.id,M.object=u,M.geometry=d,M.material=m,M.materialVariant=a(u),M.groupOrder=v,M.renderOrder=u.renderOrder,M.z=g,M.group=p),t++,M}function l(u,d,m,v,g,p){let M=o(u,d,m,v,g,p);m.transmission>0?n.push(M):m.transparent===!0?s.push(M):e.push(M)}function c(u,d,m,v,g,p){let M=o(u,d,m,v,g,p);m.transmission>0?n.unshift(M):m.transparent===!0?s.unshift(M):e.unshift(M)}function h(u,d,m){e.length>1&&e.sort(u||Kg),n.length>1&&n.sort(d||Hu),s.length>1&&s.sort(d||Hu),m&&(e.reverse(),n.reverse(),s.reverse())}function f(){for(let u=t,d=i.length;u<d;u++){let m=i[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:f,sort:h}}function Jg(){let i=new WeakMap;function t(n,s){let r=i.get(n),a;return r===void 0?(a=new Vu,i.set(n,[a])):s>=r.length?(a=new Vu,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function jg(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new U,color:new mt};break;case"SpotLight":e={position:new U,direction:new U,color:new mt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new U,color:new mt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new U,skyColor:new mt,groundColor:new mt};break;case"RectAreaLight":e={color:new mt,position:new U,halfWidth:new U,halfHeight:new U};break}return i[t.id]=e,e}}}function Qg(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new It};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new It};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new It,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var tx=0;function ex(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function nx(i){let t=new jg,e=Qg(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new U);let s=new U,r=new Qt,a=new Qt;function o(c){let h=0,f=0,u=0;for(let y=0;y<9;y++)n.probe[y].set(0,0,0);let d=0,m=0,v=0,g=0,p=0,M=0,S=0,b=0,T=0,w=0,R=0;c.sort(ex);for(let y=0,A=c.length;y<A;y++){let I=c[y],P=I.color,F=I.intensity,k=I.distance,L=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===Si?L=I.shadow.map.texture:L=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)h+=P.r*F,f+=P.g*F,u+=P.b*F;else if(I.isLightProbe){for(let z=0;z<9;z++)n.probe[z].addScaledVector(I.sh.coefficients[z],F);R++}else if(I.isDirectionalLight){let z=t.get(I);if(z.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let H=I.shadow,$=e.get(I);$.shadowIntensity=H.intensity,$.shadowBias=H.bias,$.shadowNormalBias=H.normalBias,$.shadowRadius=H.radius,$.shadowMapSize=H.mapSize,n.directionalShadow[d]=$,n.directionalShadowMap[d]=L,n.directionalShadowMatrix[d]=I.shadow.matrix,M++}n.directional[d]=z,d++}else if(I.isSpotLight){let z=t.get(I);z.position.setFromMatrixPosition(I.matrixWorld),z.color.copy(P).multiplyScalar(F),z.distance=k,z.coneCos=Math.cos(I.angle),z.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),z.decay=I.decay,n.spot[v]=z;let H=I.shadow;if(I.map&&(n.spotLightMap[T]=I.map,T++,H.updateMatrices(I),I.castShadow&&w++),n.spotLightMatrix[v]=H.matrix,I.castShadow){let $=e.get(I);$.shadowIntensity=H.intensity,$.shadowBias=H.bias,$.shadowNormalBias=H.normalBias,$.shadowRadius=H.radius,$.shadowMapSize=H.mapSize,n.spotShadow[v]=$,n.spotShadowMap[v]=L,b++}v++}else if(I.isRectAreaLight){let z=t.get(I);z.color.copy(P).multiplyScalar(F),z.halfWidth.set(I.width*.5,0,0),z.halfHeight.set(0,I.height*.5,0),n.rectArea[g]=z,g++}else if(I.isPointLight){let z=t.get(I);if(z.color.copy(I.color).multiplyScalar(I.intensity),z.distance=I.distance,z.decay=I.decay,I.castShadow){let H=I.shadow,$=e.get(I);$.shadowIntensity=H.intensity,$.shadowBias=H.bias,$.shadowNormalBias=H.normalBias,$.shadowRadius=H.radius,$.shadowMapSize=H.mapSize,$.shadowCameraNear=H.camera.near,$.shadowCameraFar=H.camera.far,n.pointShadow[m]=$,n.pointShadowMap[m]=L,n.pointShadowMatrix[m]=I.shadow.matrix,S++}n.point[m]=z,m++}else if(I.isHemisphereLight){let z=t.get(I);z.skyColor.copy(I.color).multiplyScalar(F),z.groundColor.copy(I.groundColor).multiplyScalar(F),n.hemi[p]=z,p++}}g>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ut.LTC_FLOAT_1,n.rectAreaLTC2=ut.LTC_FLOAT_2):(n.rectAreaLTC1=ut.LTC_HALF_1,n.rectAreaLTC2=ut.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=f,n.ambient[2]=u;let x=n.hash;(x.directionalLength!==d||x.pointLength!==m||x.spotLength!==v||x.rectAreaLength!==g||x.hemiLength!==p||x.numDirectionalShadows!==M||x.numPointShadows!==S||x.numSpotShadows!==b||x.numSpotMaps!==T||x.numLightProbes!==R)&&(n.directional.length=d,n.spot.length=v,n.rectArea.length=g,n.point.length=m,n.hemi.length=p,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.pointShadow.length=S,n.pointShadowMap.length=S,n.spotShadow.length=b,n.spotShadowMap.length=b,n.directionalShadowMatrix.length=M,n.pointShadowMatrix.length=S,n.spotLightMatrix.length=b+T-w,n.spotLightMap.length=T,n.numSpotLightShadowsWithMaps=w,n.numLightProbes=R,x.directionalLength=d,x.pointLength=m,x.spotLength=v,x.rectAreaLength=g,x.hemiLength=p,x.numDirectionalShadows=M,x.numPointShadows=S,x.numSpotShadows=b,x.numSpotMaps=T,x.numLightProbes=R,n.version=tx++)}function l(c,h){let f=0,u=0,d=0,m=0,v=0,g=h.matrixWorldInverse;for(let p=0,M=c.length;p<M;p++){let S=c[p];if(S.isDirectionalLight){let b=n.directional[f];b.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(g),f++}else if(S.isSpotLight){let b=n.spot[d];b.position.setFromMatrixPosition(S.matrixWorld),b.position.applyMatrix4(g),b.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(g),d++}else if(S.isRectAreaLight){let b=n.rectArea[m];b.position.setFromMatrixPosition(S.matrixWorld),b.position.applyMatrix4(g),a.identity(),r.copy(S.matrixWorld),r.premultiply(g),a.extractRotation(r),b.halfWidth.set(S.width*.5,0,0),b.halfHeight.set(0,S.height*.5,0),b.halfWidth.applyMatrix4(a),b.halfHeight.applyMatrix4(a),m++}else if(S.isPointLight){let b=n.point[u];b.position.setFromMatrixPosition(S.matrixWorld),b.position.applyMatrix4(g),u++}else if(S.isHemisphereLight){let b=n.hemi[v];b.direction.setFromMatrixPosition(S.matrixWorld),b.direction.transformDirection(g),v++}}}return{setup:o,setupView:l,state:n}}function Gu(i){let t=new nx(i),e=[],n=[],s=[];function r(u){f.camera=u,e.length=0,n.length=0,s.length=0}function a(u){e.push(u)}function o(u){n.push(u)}function l(u){s.push(u)}function c(){t.setup(e)}function h(u){t.setupView(e,u)}let f={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:f,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function ix(i){let t=new WeakMap;function e(s,r=0){let a=t.get(s),o;return a===void 0?(o=new Gu(i),t.set(s,[o])):r>=a.length?(o=new Gu(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var sx=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,rx=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,ax=[new U(1,0,0),new U(-1,0,0),new U(0,1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1)],ox=[new U(0,-1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1),new U(0,-1,0),new U(0,-1,0)],Wu=new Qt,dr=new U,pc=new U;function lx(i,t,e){let n=new ms,s=new It,r=new It,a=new le,o=new ma,l=new ga,c={},h=e.maxTextureSize,f={[jn]:Ge,[Ge]:jn,[fn]:fn},u=new re({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new It},radius:{value:4}},vertexShader:sx,fragmentShader:rx}),d=u.clone();d.defines.HORIZONTAL_PASS=1;let m=new he;m.setAttribute("position",new zt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new Ht(m,u),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=er;let p=this.type;this.render=function(w,R,x){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||w.length===0)return;this.type===zh&&(Ct("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=er);let y=i.getRenderTarget(),A=i.getActiveCubeFace(),I=i.getActiveMipmapLevel(),P=i.state;P.setBlending(zn),P.buffers.depth.getReversed()===!0?P.buffers.color.setClear(0,0,0,0):P.buffers.color.setClear(1,1,1,1),P.buffers.depth.setTest(!0),P.setScissorTest(!1);let F=p!==this.type;F&&R.traverse(function(k){k.material&&(Array.isArray(k.material)?k.material.forEach(L=>L.needsUpdate=!0):k.material.needsUpdate=!0)});for(let k=0,L=w.length;k<L;k++){let z=w[k],H=z.shadow;if(H===void 0){Ct("WebGLShadowMap:",z,"has no shadow.");continue}if(H.autoUpdate===!1&&H.needsUpdate===!1)continue;s.copy(H.mapSize);let $=H.getFrameExtents();s.multiply($),r.copy(H.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/$.x),s.x=r.x*$.x,H.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/$.y),s.y=r.y*$.y,H.mapSize.y=r.y));let Q=i.state.buffers.depth.getReversed();if(H.camera._reversedDepth=Q,H.map===null||F===!0){if(H.map!==null&&(H.map.depthTexture!==null&&(H.map.depthTexture.dispose(),H.map.depthTexture=null),H.map.dispose()),this.type===ys){if(z.isPointLight){Ct("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}H.map=new Ve(s.x,s.y,{format:Si,type:Vn,minFilter:Ue,magFilter:Ue,generateMipmaps:!1}),H.map.texture.name=z.name+".shadowMap",H.map.depthTexture=new ei(s.x,s.y,dn),H.map.depthTexture.name=z.name+".shadowMapDepth",H.map.depthTexture.format=Fn,H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=Pe,H.map.depthTexture.magFilter=Pe}else z.isPointLight?(H.map=new Eo(s.x),H.map.depthTexture=new fa(s.x,En)):(H.map=new Ve(s.x,s.y),H.map.depthTexture=new ei(s.x,s.y,En)),H.map.depthTexture.name=z.name+".shadowMap",H.map.depthTexture.format=Fn,this.type===er?(H.map.depthTexture.compareFunction=Q?_o:vo,H.map.depthTexture.minFilter=Ue,H.map.depthTexture.magFilter=Ue):(H.map.depthTexture.compareFunction=null,H.map.depthTexture.minFilter=Pe,H.map.depthTexture.magFilter=Pe);H.camera.updateProjectionMatrix()}let nt=H.map.isWebGLCubeRenderTarget?6:1;for(let st=0;st<nt;st++){if(H.map.isWebGLCubeRenderTarget)i.setRenderTarget(H.map,st),i.clear();else{st===0&&(i.setRenderTarget(H.map),i.clear());let xt=H.getViewport(st);a.set(r.x*xt.x,r.y*xt.y,r.x*xt.z,r.y*xt.w),P.viewport(a)}if(z.isPointLight){let xt=H.camera,Wt=H.matrix,ue=z.distance||xt.far;ue!==xt.far&&(xt.far=ue,xt.updateProjectionMatrix()),dr.setFromMatrixPosition(z.matrixWorld),xt.position.copy(dr),pc.copy(xt.position),pc.add(ax[st]),xt.up.copy(ox[st]),xt.lookAt(pc),xt.updateMatrixWorld(),Wt.makeTranslation(-dr.x,-dr.y,-dr.z),Wu.multiplyMatrices(xt.projectionMatrix,xt.matrixWorldInverse),H._frustum.setFromProjectionMatrix(Wu,xt.coordinateSystem,xt.reversedDepth)}else H.updateMatrices(z);n=H.getFrustum(),b(R,x,H.camera,z,this.type)}H.isPointLightShadow!==!0&&this.type===ys&&M(H,x),H.needsUpdate=!1}p=this.type,g.needsUpdate=!1,i.setRenderTarget(y,A,I)};function M(w,R){let x=t.update(v);u.defines.VSM_SAMPLES!==w.blurSamples&&(u.defines.VSM_SAMPLES=w.blurSamples,d.defines.VSM_SAMPLES=w.blurSamples,u.needsUpdate=!0,d.needsUpdate=!0),w.mapPass===null&&(w.mapPass=new Ve(s.x,s.y,{format:Si,type:Vn})),u.uniforms.shadow_pass.value=w.map.depthTexture,u.uniforms.resolution.value=w.mapSize,u.uniforms.radius.value=w.radius,i.setRenderTarget(w.mapPass),i.clear(),i.renderBufferDirect(R,null,x,u,v,null),d.uniforms.shadow_pass.value=w.mapPass.texture,d.uniforms.resolution.value=w.mapSize,d.uniforms.radius.value=w.radius,i.setRenderTarget(w.map),i.clear(),i.renderBufferDirect(R,null,x,d,v,null)}function S(w,R,x,y){let A=null,I=x.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(I!==void 0)A=I;else if(A=x.isPointLight===!0?l:o,i.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){let P=A.uuid,F=R.uuid,k=c[P];k===void 0&&(k={},c[P]=k);let L=k[F];L===void 0&&(L=A.clone(),k[F]=L,R.addEventListener("dispose",T)),A=L}if(A.visible=R.visible,A.wireframe=R.wireframe,y===ys?A.side=R.shadowSide!==null?R.shadowSide:R.side:A.side=R.shadowSide!==null?R.shadowSide:f[R.side],A.alphaMap=R.alphaMap,A.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,A.map=R.map,A.clipShadows=R.clipShadows,A.clippingPlanes=R.clippingPlanes,A.clipIntersection=R.clipIntersection,A.displacementMap=R.displacementMap,A.displacementScale=R.displacementScale,A.displacementBias=R.displacementBias,A.wireframeLinewidth=R.wireframeLinewidth,A.linewidth=R.linewidth,x.isPointLight===!0&&A.isMeshDistanceMaterial===!0){let P=i.properties.get(A);P.light=x}return A}function b(w,R,x,y,A){if(w.visible===!1)return;if(w.layers.test(R.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&A===ys)&&(!w.frustumCulled||n.intersectsObject(w))){w.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,w.matrixWorld);let F=t.update(w),k=w.material;if(Array.isArray(k)){let L=F.groups;for(let z=0,H=L.length;z<H;z++){let $=L[z],Q=k[$.materialIndex];if(Q&&Q.visible){let nt=S(w,Q,y,A);w.onBeforeShadow(i,w,R,x,F,nt,$),i.renderBufferDirect(x,null,F,nt,w,$),w.onAfterShadow(i,w,R,x,F,nt,$)}}}else if(k.visible){let L=S(w,k,y,A);w.onBeforeShadow(i,w,R,x,F,L,null),i.renderBufferDirect(x,null,F,L,w,null),w.onAfterShadow(i,w,R,x,F,L,null)}}let P=w.children;for(let F=0,k=P.length;F<k;F++)b(P[F],R,x,y,A)}function T(w){w.target.removeEventListener("dispose",T);for(let x in c){let y=c[x],A=w.target.uuid;A in y&&(y[A].dispose(),delete y[A])}}}function cx(i,t){function e(){let N=!1,it=new le,Z=null,ct=new le(0,0,0,0);return{setMask:function(pt){Z!==pt&&!N&&(i.colorMask(pt,pt,pt,pt),Z=pt)},setLocked:function(pt){N=pt},setClear:function(pt,j,bt,vt,de){de===!0&&(pt*=vt,j*=vt,bt*=vt),it.set(pt,j,bt,vt),ct.equals(it)===!1&&(i.clearColor(pt,j,bt,vt),ct.copy(it))},reset:function(){N=!1,Z=null,ct.set(-1,0,0,0)}}}function n(){let N=!1,it=!1,Z=null,ct=null,pt=null;return{setReversed:function(j){if(it!==j){let bt=t.get("EXT_clip_control");j?bt.clipControlEXT(bt.LOWER_LEFT_EXT,bt.ZERO_TO_ONE_EXT):bt.clipControlEXT(bt.LOWER_LEFT_EXT,bt.NEGATIVE_ONE_TO_ONE_EXT),it=j;let vt=pt;pt=null,this.setClear(vt)}},getReversed:function(){return it},setTest:function(j){j?tt(i.DEPTH_TEST):Lt(i.DEPTH_TEST)},setMask:function(j){Z!==j&&!N&&(i.depthMask(j),Z=j)},setFunc:function(j){if(it&&(j=vu[j]),ct!==j){switch(j){case jr:i.depthFunc(i.NEVER);break;case Qr:i.depthFunc(i.ALWAYS);break;case ta:i.depthFunc(i.LESS);break;case ki:i.depthFunc(i.LEQUAL);break;case ea:i.depthFunc(i.EQUAL);break;case na:i.depthFunc(i.GEQUAL);break;case ia:i.depthFunc(i.GREATER);break;case sa:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}ct=j}},setLocked:function(j){N=j},setClear:function(j){pt!==j&&(pt=j,it&&(j=1-j),i.clearDepth(j))},reset:function(){N=!1,Z=null,ct=null,pt=null,it=!1}}}function s(){let N=!1,it=null,Z=null,ct=null,pt=null,j=null,bt=null,vt=null,de=null;return{setTest:function(ae){N||(ae?tt(i.STENCIL_TEST):Lt(i.STENCIL_TEST))},setMask:function(ae){it!==ae&&!N&&(i.stencilMask(ae),it=ae)},setFunc:function(ae,An,Rn){(Z!==ae||ct!==An||pt!==Rn)&&(i.stencilFunc(ae,An,Rn),Z=ae,ct=An,pt=Rn)},setOp:function(ae,An,Rn){(j!==ae||bt!==An||vt!==Rn)&&(i.stencilOp(ae,An,Rn),j=ae,bt=An,vt=Rn)},setLocked:function(ae){N=ae},setClear:function(ae){de!==ae&&(i.clearStencil(ae),de=ae)},reset:function(){N=!1,it=null,Z=null,ct=null,pt=null,j=null,bt=null,vt=null,de=null}}}let r=new e,a=new n,o=new s,l=new WeakMap,c=new WeakMap,h={},f={},u={},d=new WeakMap,m=[],v=null,g=!1,p=null,M=null,S=null,b=null,T=null,w=null,R=null,x=new mt(0,0,0),y=0,A=!1,I=null,P=null,F=null,k=null,L=null,z=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),H=!1,$=0,Q=i.getParameter(i.VERSION);Q.indexOf("WebGL")!==-1?($=parseFloat(/^WebGL (\d)/.exec(Q)[1]),H=$>=1):Q.indexOf("OpenGL ES")!==-1&&($=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),H=$>=2);let nt=null,st={},xt=i.getParameter(i.SCISSOR_BOX),Wt=i.getParameter(i.VIEWPORT),ue=new le().fromArray(xt),Zt=new le().fromArray(Wt);function J(N,it,Z,ct){let pt=new Uint8Array(4),j=i.createTexture();i.bindTexture(N,j),i.texParameteri(N,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(N,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let bt=0;bt<Z;bt++)N===i.TEXTURE_3D||N===i.TEXTURE_2D_ARRAY?i.texImage3D(it,0,i.RGBA,1,1,ct,0,i.RGBA,i.UNSIGNED_BYTE,pt):i.texImage2D(it+bt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,pt);return j}let rt={};rt[i.TEXTURE_2D]=J(i.TEXTURE_2D,i.TEXTURE_2D,1),rt[i.TEXTURE_CUBE_MAP]=J(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),rt[i.TEXTURE_2D_ARRAY]=J(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),rt[i.TEXTURE_3D]=J(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),tt(i.DEPTH_TEST),a.setFunc(ki),ve(!1),Se(Ul),tt(i.CULL_FACE),Kt(zn);function tt(N){h[N]!==!0&&(i.enable(N),h[N]=!0)}function Lt(N){h[N]!==!1&&(i.disable(N),h[N]=!1)}function Ut(N,it){return u[N]!==it?(i.bindFramebuffer(N,it),u[N]=it,N===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=it),N===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=it),!0):!1}function At(N,it){let Z=m,ct=!1;if(N){Z=d.get(it),Z===void 0&&(Z=[],d.set(it,Z));let pt=N.textures;if(Z.length!==pt.length||Z[0]!==i.COLOR_ATTACHMENT0){for(let j=0,bt=pt.length;j<bt;j++)Z[j]=i.COLOR_ATTACHMENT0+j;Z.length=pt.length,ct=!0}}else Z[0]!==i.BACK&&(Z[0]=i.BACK,ct=!0);ct&&i.drawBuffers(Z)}function me(N){return v!==N?(i.useProgram(N),v=N,!0):!1}let Vt={[fi]:i.FUNC_ADD,[Vh]:i.FUNC_SUBTRACT,[Gh]:i.FUNC_REVERSE_SUBTRACT};Vt[Wh]=i.MIN,Vt[Xh]=i.MAX;let ne={[qh]:i.ZERO,[Yh]:i.ONE,[$h]:i.SRC_COLOR,[Kr]:i.SRC_ALPHA,[tu]:i.SRC_ALPHA_SATURATE,[jh]:i.DST_COLOR,[Kh]:i.DST_ALPHA,[Zh]:i.ONE_MINUS_SRC_COLOR,[Jr]:i.ONE_MINUS_SRC_ALPHA,[Qh]:i.ONE_MINUS_DST_COLOR,[Jh]:i.ONE_MINUS_DST_ALPHA,[eu]:i.CONSTANT_COLOR,[nu]:i.ONE_MINUS_CONSTANT_COLOR,[iu]:i.CONSTANT_ALPHA,[su]:i.ONE_MINUS_CONSTANT_ALPHA};function Kt(N,it,Z,ct,pt,j,bt,vt,de,ae){if(N===zn){g===!0&&(Lt(i.BLEND),g=!1);return}if(g===!1&&(tt(i.BLEND),g=!0),N!==Hh){if(N!==p||ae!==A){if((M!==fi||T!==fi)&&(i.blendEquation(i.FUNC_ADD),M=fi,T=fi),ae)switch(N){case Bi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Hn:i.blendFunc(i.ONE,i.ONE);break;case Fl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Ol:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:Pt("WebGLState: Invalid blending: ",N);break}else switch(N){case Bi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Hn:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Fl:Pt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Ol:Pt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Pt("WebGLState: Invalid blending: ",N);break}S=null,b=null,w=null,R=null,x.set(0,0,0),y=0,p=N,A=ae}return}pt=pt||it,j=j||Z,bt=bt||ct,(it!==M||pt!==T)&&(i.blendEquationSeparate(Vt[it],Vt[pt]),M=it,T=pt),(Z!==S||ct!==b||j!==w||bt!==R)&&(i.blendFuncSeparate(ne[Z],ne[ct],ne[j],ne[bt]),S=Z,b=ct,w=j,R=bt),(vt.equals(x)===!1||de!==y)&&(i.blendColor(vt.r,vt.g,vt.b,de),x.copy(vt),y=de),p=N,A=!1}function qt(N,it){N.side===fn?Lt(i.CULL_FACE):tt(i.CULL_FACE);let Z=N.side===Ge;it&&(Z=!Z),ve(Z),N.blending===Bi&&N.transparent===!1?Kt(zn):Kt(N.blending,N.blendEquation,N.blendSrc,N.blendDst,N.blendEquationAlpha,N.blendSrcAlpha,N.blendDstAlpha,N.blendColor,N.blendAlpha,N.premultipliedAlpha),a.setFunc(N.depthFunc),a.setTest(N.depthTest),a.setMask(N.depthWrite),r.setMask(N.colorWrite);let ct=N.stencilWrite;o.setTest(ct),ct&&(o.setMask(N.stencilWriteMask),o.setFunc(N.stencilFunc,N.stencilRef,N.stencilFuncMask),o.setOp(N.stencilFail,N.stencilZFail,N.stencilZPass)),Le(N.polygonOffset,N.polygonOffsetFactor,N.polygonOffsetUnits),N.alphaToCoverage===!0?tt(i.SAMPLE_ALPHA_TO_COVERAGE):Lt(i.SAMPLE_ALPHA_TO_COVERAGE)}function ve(N){I!==N&&(N?i.frontFace(i.CW):i.frontFace(i.CCW),I=N)}function Se(N){N!==Bh?(tt(i.CULL_FACE),N!==P&&(N===Ul?i.cullFace(i.BACK):N===kh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Lt(i.CULL_FACE),P=N}function Ce(N){N!==F&&(H&&i.lineWidth(N),F=N)}function Le(N,it,Z){N?(tt(i.POLYGON_OFFSET_FILL),(k!==it||L!==Z)&&(k=it,L=Z,a.getReversed()&&(it=-it),i.polygonOffset(it,Z))):Lt(i.POLYGON_OFFSET_FILL)}function fe(N){N?tt(i.SCISSOR_TEST):Lt(i.SCISSOR_TEST)}function _e(N){N===void 0&&(N=i.TEXTURE0+z-1),nt!==N&&(i.activeTexture(N),nt=N)}function D(N,it,Z){Z===void 0&&(nt===null?Z=i.TEXTURE0+z-1:Z=nt);let ct=st[Z];ct===void 0&&(ct={type:void 0,texture:void 0},st[Z]=ct),(ct.type!==N||ct.texture!==it)&&(nt!==Z&&(i.activeTexture(Z),nt=Z),i.bindTexture(N,it||rt[N]),ct.type=N,ct.texture=it)}function Xe(){let N=st[nt];N!==void 0&&N.type!==void 0&&(i.bindTexture(N.type,null),N.type=void 0,N.texture=void 0)}function jt(){try{i.compressedTexImage2D(...arguments)}catch(N){Pt("WebGLState:",N)}}function C(){try{i.compressedTexImage3D(...arguments)}catch(N){Pt("WebGLState:",N)}}function _(){try{i.texSubImage2D(...arguments)}catch(N){Pt("WebGLState:",N)}}function B(){try{i.texSubImage3D(...arguments)}catch(N){Pt("WebGLState:",N)}}function W(){try{i.compressedTexSubImage2D(...arguments)}catch(N){Pt("WebGLState:",N)}}function q(){try{i.compressedTexSubImage3D(...arguments)}catch(N){Pt("WebGLState:",N)}}function et(){try{i.texStorage2D(...arguments)}catch(N){Pt("WebGLState:",N)}}function at(){try{i.texStorage3D(...arguments)}catch(N){Pt("WebGLState:",N)}}function Y(){try{i.texImage2D(...arguments)}catch(N){Pt("WebGLState:",N)}}function K(){try{i.texImage3D(...arguments)}catch(N){Pt("WebGLState:",N)}}function ot(N){return f[N]!==void 0?f[N]:i.getParameter(N)}function St(N,it){f[N]!==it&&(i.pixelStorei(N,it),f[N]=it)}function ht(N){ue.equals(N)===!1&&(i.scissor(N.x,N.y,N.z,N.w),ue.copy(N))}function lt(N){Zt.equals(N)===!1&&(i.viewport(N.x,N.y,N.z,N.w),Zt.copy(N))}function wt(N,it){let Z=c.get(it);Z===void 0&&(Z=new WeakMap,c.set(it,Z));let ct=Z.get(N);ct===void 0&&(ct=i.getUniformBlockIndex(it,N.name),Z.set(N,ct))}function Rt(N,it){let ct=c.get(it).get(N);l.get(it)!==ct&&(i.uniformBlockBinding(it,ct,N.__bindingPointIndex),l.set(it,ct))}function Ft(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},f={},nt=null,st={},u={},d=new WeakMap,m=[],v=null,g=!1,p=null,M=null,S=null,b=null,T=null,w=null,R=null,x=new mt(0,0,0),y=0,A=!1,I=null,P=null,F=null,k=null,L=null,ue.set(0,0,i.canvas.width,i.canvas.height),Zt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:tt,disable:Lt,bindFramebuffer:Ut,drawBuffers:At,useProgram:me,setBlending:Kt,setMaterial:qt,setFlipSided:ve,setCullFace:Se,setLineWidth:Ce,setPolygonOffset:Le,setScissorTest:fe,activeTexture:_e,bindTexture:D,unbindTexture:Xe,compressedTexImage2D:jt,compressedTexImage3D:C,texImage2D:Y,texImage3D:K,pixelStorei:St,getParameter:ot,updateUBOMapping:wt,uniformBlockBinding:Rt,texStorage2D:et,texStorage3D:at,texSubImage2D:_,texSubImage3D:B,compressedTexSubImage2D:W,compressedTexSubImage3D:q,scissor:ht,viewport:lt,reset:Ft}}function hx(i,t,e,n,s,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new It,h=new WeakMap,f=new Set,u,d=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(C,_){return m?new OffscreenCanvas(C,_):zs("canvas")}function g(C,_,B){let W=1,q=jt(C);if((q.width>B||q.height>B)&&(W=B/Math.max(q.width,q.height)),W<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let et=Math.floor(W*q.width),at=Math.floor(W*q.height);u===void 0&&(u=v(et,at));let Y=_?v(et,at):u;return Y.width=et,Y.height=at,Y.getContext("2d").drawImage(C,0,0,et,at),Ct("WebGLRenderer: Texture has been resized from ("+q.width+"x"+q.height+") to ("+et+"x"+at+")."),Y}else return"data"in C&&Ct("WebGLRenderer: Image in DataTexture is too big ("+q.width+"x"+q.height+")."),C;return C}function p(C){return C.generateMipmaps}function M(C){i.generateMipmap(C)}function S(C){return C.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?i.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function b(C,_,B,W,q,et=!1){if(C!==null){if(i[C]!==void 0)return i[C];Ct("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let at;W&&(at=t.get("EXT_texture_norm16"),at||Ct("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let Y=_;if(_===i.RED&&(B===i.FLOAT&&(Y=i.R32F),B===i.HALF_FLOAT&&(Y=i.R16F),B===i.UNSIGNED_BYTE&&(Y=i.R8),B===i.UNSIGNED_SHORT&&at&&(Y=at.R16_EXT),B===i.SHORT&&at&&(Y=at.R16_SNORM_EXT)),_===i.RED_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.R8UI),B===i.UNSIGNED_SHORT&&(Y=i.R16UI),B===i.UNSIGNED_INT&&(Y=i.R32UI),B===i.BYTE&&(Y=i.R8I),B===i.SHORT&&(Y=i.R16I),B===i.INT&&(Y=i.R32I)),_===i.RG&&(B===i.FLOAT&&(Y=i.RG32F),B===i.HALF_FLOAT&&(Y=i.RG16F),B===i.UNSIGNED_BYTE&&(Y=i.RG8),B===i.UNSIGNED_SHORT&&at&&(Y=at.RG16_EXT),B===i.SHORT&&at&&(Y=at.RG16_SNORM_EXT)),_===i.RG_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RG8UI),B===i.UNSIGNED_SHORT&&(Y=i.RG16UI),B===i.UNSIGNED_INT&&(Y=i.RG32UI),B===i.BYTE&&(Y=i.RG8I),B===i.SHORT&&(Y=i.RG16I),B===i.INT&&(Y=i.RG32I)),_===i.RGB_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),B===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),B===i.UNSIGNED_INT&&(Y=i.RGB32UI),B===i.BYTE&&(Y=i.RGB8I),B===i.SHORT&&(Y=i.RGB16I),B===i.INT&&(Y=i.RGB32I)),_===i.RGBA_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),B===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),B===i.UNSIGNED_INT&&(Y=i.RGBA32UI),B===i.BYTE&&(Y=i.RGBA8I),B===i.SHORT&&(Y=i.RGBA16I),B===i.INT&&(Y=i.RGBA32I)),_===i.RGB&&(B===i.UNSIGNED_SHORT&&at&&(Y=at.RGB16_EXT),B===i.SHORT&&at&&(Y=at.RGB16_SNORM_EXT),B===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),B===i.UNSIGNED_INT_10F_11F_11F_REV&&(Y=i.R11F_G11F_B10F)),_===i.RGBA){let K=et?ks:Gt.getTransfer(q);B===i.FLOAT&&(Y=i.RGBA32F),B===i.HALF_FLOAT&&(Y=i.RGBA16F),B===i.UNSIGNED_BYTE&&(Y=K===Jt?i.SRGB8_ALPHA8:i.RGBA8),B===i.UNSIGNED_SHORT&&at&&(Y=at.RGBA16_EXT),B===i.SHORT&&at&&(Y=at.RGBA16_SNORM_EXT),B===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),B===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1)}return(Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&t.get("EXT_color_buffer_float"),Y}function T(C,_){let B;return C?_===null||_===En||_===_s?B=i.DEPTH24_STENCIL8:_===dn?B=i.DEPTH32F_STENCIL8:_===vs&&(B=i.DEPTH24_STENCIL8,Ct("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===En||_===_s?B=i.DEPTH_COMPONENT24:_===dn?B=i.DEPTH_COMPONENT32F:_===vs&&(B=i.DEPTH_COMPONENT16),B}function w(C,_){return p(C)===!0||C.isFramebufferTexture&&C.minFilter!==Pe&&C.minFilter!==Ue?Math.log2(Math.max(_.width,_.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?_.mipmaps.length:1}function R(C){let _=C.target;_.removeEventListener("dispose",R),y(_),_.isVideoTexture&&h.delete(_),_.isHTMLTexture&&f.delete(_)}function x(C){let _=C.target;_.removeEventListener("dispose",x),I(_)}function y(C){let _=n.get(C);if(_.__webglInit===void 0)return;let B=C.source,W=d.get(B);if(W){let q=W[_.__cacheKey];q.usedTimes--,q.usedTimes===0&&A(C),Object.keys(W).length===0&&d.delete(B)}n.remove(C)}function A(C){let _=n.get(C);i.deleteTexture(_.__webglTexture);let B=C.source,W=d.get(B);delete W[_.__cacheKey],a.memory.textures--}function I(C){let _=n.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),n.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let W=0;W<6;W++){if(Array.isArray(_.__webglFramebuffer[W]))for(let q=0;q<_.__webglFramebuffer[W].length;q++)i.deleteFramebuffer(_.__webglFramebuffer[W][q]);else i.deleteFramebuffer(_.__webglFramebuffer[W]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[W])}else{if(Array.isArray(_.__webglFramebuffer))for(let W=0;W<_.__webglFramebuffer.length;W++)i.deleteFramebuffer(_.__webglFramebuffer[W]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let W=0;W<_.__webglColorRenderbuffer.length;W++)_.__webglColorRenderbuffer[W]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[W]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let B=C.textures;for(let W=0,q=B.length;W<q;W++){let et=n.get(B[W]);et.__webglTexture&&(i.deleteTexture(et.__webglTexture),a.memory.textures--),n.remove(B[W])}n.remove(C)}let P=0;function F(){P=0}function k(){return P}function L(C){P=C}function z(){let C=P;return C>=s.maxTextures&&Ct("WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+s.maxTextures),P+=1,C}function H(C){let _=[];return _.push(C.wrapS),_.push(C.wrapT),_.push(C.wrapR||0),_.push(C.magFilter),_.push(C.minFilter),_.push(C.anisotropy),_.push(C.internalFormat),_.push(C.format),_.push(C.type),_.push(C.generateMipmaps),_.push(C.premultiplyAlpha),_.push(C.flipY),_.push(C.unpackAlignment),_.push(C.colorSpace),_.join()}function $(C,_){let B=n.get(C);if(C.isVideoTexture&&D(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&B.__version!==C.version){let W=C.image;if(W===null)Ct("WebGLRenderer: Texture marked for update but no image data found.");else if(W.complete===!1)Ct("WebGLRenderer: Texture marked for update but image is incomplete");else{Lt(B,C,_);return}}else C.isExternalTexture&&(B.__webglTexture=C.sourceTexture?C.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,B.__webglTexture,i.TEXTURE0+_)}function Q(C,_){let B=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){Lt(B,C,_);return}else C.isExternalTexture&&(B.__webglTexture=C.sourceTexture?C.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,B.__webglTexture,i.TEXTURE0+_)}function nt(C,_){let B=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){Lt(B,C,_);return}e.bindTexture(i.TEXTURE_3D,B.__webglTexture,i.TEXTURE0+_)}function st(C,_){let B=n.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&B.__version!==C.version){Ut(B,C,_);return}e.bindTexture(i.TEXTURE_CUBE_MAP,B.__webglTexture,i.TEXTURE0+_)}let xt={[hs]:i.REPEAT,[Un]:i.CLAMP_TO_EDGE,[ra]:i.MIRRORED_REPEAT},Wt={[Pe]:i.NEAREST,[ou]:i.NEAREST_MIPMAP_NEAREST,[sr]:i.NEAREST_MIPMAP_LINEAR,[Ue]:i.LINEAR,[Na]:i.LINEAR_MIPMAP_NEAREST,[Mi]:i.LINEAR_MIPMAP_LINEAR},ue={[hu]:i.NEVER,[mu]:i.ALWAYS,[uu]:i.LESS,[vo]:i.LEQUAL,[fu]:i.EQUAL,[_o]:i.GEQUAL,[du]:i.GREATER,[pu]:i.NOTEQUAL};function Zt(C,_){if(_.type===dn&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===Ue||_.magFilter===Na||_.magFilter===sr||_.magFilter===Mi||_.minFilter===Ue||_.minFilter===Na||_.minFilter===sr||_.minFilter===Mi)&&Ct("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(C,i.TEXTURE_WRAP_S,xt[_.wrapS]),i.texParameteri(C,i.TEXTURE_WRAP_T,xt[_.wrapT]),(C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY)&&i.texParameteri(C,i.TEXTURE_WRAP_R,xt[_.wrapR]),i.texParameteri(C,i.TEXTURE_MAG_FILTER,Wt[_.magFilter]),i.texParameteri(C,i.TEXTURE_MIN_FILTER,Wt[_.minFilter]),_.compareFunction&&(i.texParameteri(C,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(C,i.TEXTURE_COMPARE_FUNC,ue[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Pe||_.minFilter!==sr&&_.minFilter!==Mi||_.type===dn&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){let B=t.get("EXT_texture_filter_anisotropic");i.texParameterf(C,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function J(C,_){let B=!1;C.__webglInit===void 0&&(C.__webglInit=!0,_.addEventListener("dispose",R));let W=_.source,q=d.get(W);q===void 0&&(q={},d.set(W,q));let et=H(_);if(et!==C.__cacheKey){q[et]===void 0&&(q[et]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,B=!0),q[et].usedTimes++;let at=q[C.__cacheKey];at!==void 0&&(q[C.__cacheKey].usedTimes--,at.usedTimes===0&&A(_)),C.__cacheKey=et,C.__webglTexture=q[et].texture}return B}function rt(C,_,B){return Math.floor(Math.floor(C/B)/_)}function tt(C,_,B,W){let et=C.updateRanges;if(et.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,_.width,_.height,B,W,_.data);else{et.sort((St,ht)=>St.start-ht.start);let at=0;for(let St=1;St<et.length;St++){let ht=et[at],lt=et[St],wt=ht.start+ht.count,Rt=rt(lt.start,_.width,4),Ft=rt(ht.start,_.width,4);lt.start<=wt+1&&Rt===Ft&&rt(lt.start+lt.count-1,_.width,4)===Rt?ht.count=Math.max(ht.count,lt.start+lt.count-ht.start):(++at,et[at]=lt)}et.length=at+1;let Y=e.getParameter(i.UNPACK_ROW_LENGTH),K=e.getParameter(i.UNPACK_SKIP_PIXELS),ot=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,_.width);for(let St=0,ht=et.length;St<ht;St++){let lt=et[St],wt=Math.floor(lt.start/4),Rt=Math.ceil(lt.count/4),Ft=wt%_.width,N=Math.floor(wt/_.width),it=Rt,Z=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,Ft),e.pixelStorei(i.UNPACK_SKIP_ROWS,N),e.texSubImage2D(i.TEXTURE_2D,0,Ft,N,it,Z,B,W,_.data)}C.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,Y),e.pixelStorei(i.UNPACK_SKIP_PIXELS,K),e.pixelStorei(i.UNPACK_SKIP_ROWS,ot)}}function Lt(C,_,B){let W=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(W=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(W=i.TEXTURE_3D);let q=J(C,_),et=_.source;e.bindTexture(W,C.__webglTexture,i.TEXTURE0+B);let at=n.get(et);if(et.version!==at.__version||q===!0){if(e.activeTexture(i.TEXTURE0+B),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){let Z=Gt.getPrimaries(Gt.workingColorSpace),ct=_.colorSpace===Tn?null:Gt.getPrimaries(_.colorSpace),pt=_.colorSpace===Tn||Z===ct?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,pt)}e.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment);let K=g(_.image,!1,s.maxTextureSize);K=Xe(_,K);let ot=r.convert(_.format,_.colorSpace),St=r.convert(_.type),ht=b(_.internalFormat,ot,St,_.normalized,_.colorSpace,_.isVideoTexture);Zt(W,_);let lt,wt=_.mipmaps,Rt=_.isVideoTexture!==!0,Ft=at.__version===void 0||q===!0,N=et.dataReady,it=w(_,K);if(_.isDepthTexture)ht=T(_.format===bi,_.type),Ft&&(Rt?e.texStorage2D(i.TEXTURE_2D,1,ht,K.width,K.height):e.texImage2D(i.TEXTURE_2D,0,ht,K.width,K.height,0,ot,St,null));else if(_.isDataTexture)if(wt.length>0){Rt&&Ft&&e.texStorage2D(i.TEXTURE_2D,it,ht,wt[0].width,wt[0].height);for(let Z=0,ct=wt.length;Z<ct;Z++)lt=wt[Z],Rt?N&&e.texSubImage2D(i.TEXTURE_2D,Z,0,0,lt.width,lt.height,ot,St,lt.data):e.texImage2D(i.TEXTURE_2D,Z,ht,lt.width,lt.height,0,ot,St,lt.data);_.generateMipmaps=!1}else Rt?(Ft&&e.texStorage2D(i.TEXTURE_2D,it,ht,K.width,K.height),N&&tt(_,K,ot,St)):e.texImage2D(i.TEXTURE_2D,0,ht,K.width,K.height,0,ot,St,K.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Rt&&Ft&&e.texStorage3D(i.TEXTURE_2D_ARRAY,it,ht,wt[0].width,wt[0].height,K.depth);for(let Z=0,ct=wt.length;Z<ct;Z++)if(lt=wt[Z],_.format!==pn)if(ot!==null)if(Rt){if(N)if(_.layerUpdates.size>0){let pt=ic(lt.width,lt.height,_.format,_.type);for(let j of _.layerUpdates){let bt=lt.data.subarray(j*pt/lt.data.BYTES_PER_ELEMENT,(j+1)*pt/lt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Z,0,0,j,lt.width,lt.height,1,ot,bt)}_.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Z,0,0,0,lt.width,lt.height,K.depth,ot,lt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,Z,ht,lt.width,lt.height,K.depth,0,lt.data,0,0);else Ct("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Rt?N&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,Z,0,0,0,lt.width,lt.height,K.depth,ot,St,lt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,Z,ht,lt.width,lt.height,K.depth,0,ot,St,lt.data)}else{Rt&&Ft&&e.texStorage2D(i.TEXTURE_2D,it,ht,wt[0].width,wt[0].height);for(let Z=0,ct=wt.length;Z<ct;Z++)lt=wt[Z],_.format!==pn?ot!==null?Rt?N&&e.compressedTexSubImage2D(i.TEXTURE_2D,Z,0,0,lt.width,lt.height,ot,lt.data):e.compressedTexImage2D(i.TEXTURE_2D,Z,ht,lt.width,lt.height,0,lt.data):Ct("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Rt?N&&e.texSubImage2D(i.TEXTURE_2D,Z,0,0,lt.width,lt.height,ot,St,lt.data):e.texImage2D(i.TEXTURE_2D,Z,ht,lt.width,lt.height,0,ot,St,lt.data)}else if(_.isDataArrayTexture)if(Rt){if(Ft&&e.texStorage3D(i.TEXTURE_2D_ARRAY,it,ht,K.width,K.height,K.depth),N)if(_.layerUpdates.size>0){let Z=ic(K.width,K.height,_.format,_.type);for(let ct of _.layerUpdates){let pt=K.data.subarray(ct*Z/K.data.BYTES_PER_ELEMENT,(ct+1)*Z/K.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,ct,K.width,K.height,1,ot,St,pt)}_.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,K.width,K.height,K.depth,ot,St,K.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,ht,K.width,K.height,K.depth,0,ot,St,K.data);else if(_.isData3DTexture)Rt?(Ft&&e.texStorage3D(i.TEXTURE_3D,it,ht,K.width,K.height,K.depth),N&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,K.width,K.height,K.depth,ot,St,K.data)):e.texImage3D(i.TEXTURE_3D,0,ht,K.width,K.height,K.depth,0,ot,St,K.data);else if(_.isFramebufferTexture){if(Ft)if(Rt)e.texStorage2D(i.TEXTURE_2D,it,ht,K.width,K.height);else{let Z=K.width,ct=K.height;for(let pt=0;pt<it;pt++)e.texImage2D(i.TEXTURE_2D,pt,ht,Z,ct,0,ot,St,null),Z>>=1,ct>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in i){let Z=i.canvas;if(Z.hasAttribute("layoutsubtree")||Z.setAttribute("layoutsubtree","true"),K.parentNode!==Z){Z.appendChild(K),f.add(_),Z.onpaint=ct=>{let pt=ct.changedElements;for(let j of f)pt.includes(j.image)&&(j.needsUpdate=!0)},Z.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,K);else{let pt=i.RGBA,j=i.RGBA,bt=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,pt,j,bt,K)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(wt.length>0){if(Rt&&Ft){let Z=jt(wt[0]);e.texStorage2D(i.TEXTURE_2D,it,ht,Z.width,Z.height)}for(let Z=0,ct=wt.length;Z<ct;Z++)lt=wt[Z],Rt?N&&e.texSubImage2D(i.TEXTURE_2D,Z,0,0,ot,St,lt):e.texImage2D(i.TEXTURE_2D,Z,ht,ot,St,lt);_.generateMipmaps=!1}else if(Rt){if(Ft){let Z=jt(K);e.texStorage2D(i.TEXTURE_2D,it,ht,Z.width,Z.height)}N&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ot,St,K)}else e.texImage2D(i.TEXTURE_2D,0,ht,ot,St,K);p(_)&&M(W),at.__version=et.version,_.onUpdate&&_.onUpdate(_)}C.__version=_.version}function Ut(C,_,B){if(_.image.length!==6)return;let W=J(C,_),q=_.source;e.bindTexture(i.TEXTURE_CUBE_MAP,C.__webglTexture,i.TEXTURE0+B);let et=n.get(q);if(q.version!==et.__version||W===!0){e.activeTexture(i.TEXTURE0+B);let at=Gt.getPrimaries(Gt.workingColorSpace),Y=_.colorSpace===Tn?null:Gt.getPrimaries(_.colorSpace),K=_.colorSpace===Tn||at===Y?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,K);let ot=_.isCompressedTexture||_.image[0].isCompressedTexture,St=_.image[0]&&_.image[0].isDataTexture,ht=[];for(let j=0;j<6;j++)!ot&&!St?ht[j]=g(_.image[j],!0,s.maxCubemapSize):ht[j]=St?_.image[j].image:_.image[j],ht[j]=Xe(_,ht[j]);let lt=ht[0],wt=r.convert(_.format,_.colorSpace),Rt=r.convert(_.type),Ft=b(_.internalFormat,wt,Rt,_.normalized,_.colorSpace),N=_.isVideoTexture!==!0,it=et.__version===void 0||W===!0,Z=q.dataReady,ct=w(_,lt);Zt(i.TEXTURE_CUBE_MAP,_);let pt;if(ot){N&&it&&e.texStorage2D(i.TEXTURE_CUBE_MAP,ct,Ft,lt.width,lt.height);for(let j=0;j<6;j++){pt=ht[j].mipmaps;for(let bt=0;bt<pt.length;bt++){let vt=pt[bt];_.format!==pn?wt!==null?N?Z&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,bt,0,0,vt.width,vt.height,wt,vt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,bt,Ft,vt.width,vt.height,0,vt.data):Ct("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):N?Z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,bt,0,0,vt.width,vt.height,wt,Rt,vt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,bt,Ft,vt.width,vt.height,0,wt,Rt,vt.data)}}}else{if(pt=_.mipmaps,N&&it){pt.length>0&&ct++;let j=jt(ht[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,ct,Ft,j.width,j.height)}for(let j=0;j<6;j++)if(St){N?Z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,ht[j].width,ht[j].height,wt,Rt,ht[j].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Ft,ht[j].width,ht[j].height,0,wt,Rt,ht[j].data);for(let bt=0;bt<pt.length;bt++){let de=pt[bt].image[j].image;N?Z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,bt+1,0,0,de.width,de.height,wt,Rt,de.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,bt+1,Ft,de.width,de.height,0,wt,Rt,de.data)}}else{N?Z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,wt,Rt,ht[j]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Ft,wt,Rt,ht[j]);for(let bt=0;bt<pt.length;bt++){let vt=pt[bt];N?Z&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,bt+1,0,0,wt,Rt,vt.image[j]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,bt+1,Ft,wt,Rt,vt.image[j])}}}p(_)&&M(i.TEXTURE_CUBE_MAP),et.__version=q.version,_.onUpdate&&_.onUpdate(_)}C.__version=_.version}function At(C,_,B,W,q,et){let at=r.convert(B.format,B.colorSpace),Y=r.convert(B.type),K=b(B.internalFormat,at,Y,B.normalized,B.colorSpace),ot=n.get(_),St=n.get(B);if(St.__renderTarget=_,!ot.__hasExternalTextures){let ht=Math.max(1,_.width>>et),lt=Math.max(1,_.height>>et);q===i.TEXTURE_3D||q===i.TEXTURE_2D_ARRAY?e.texImage3D(q,et,K,ht,lt,_.depth,0,at,Y,null):e.texImage2D(q,et,K,ht,lt,0,at,Y,null)}e.bindFramebuffer(i.FRAMEBUFFER,C),_e(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,W,q,St.__webglTexture,0,fe(_)):(q===i.TEXTURE_2D||q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,W,q,St.__webglTexture,et),e.bindFramebuffer(i.FRAMEBUFFER,null)}function me(C,_,B){if(i.bindRenderbuffer(i.RENDERBUFFER,C),_.depthBuffer){let W=_.depthTexture,q=W&&W.isDepthTexture?W.type:null,et=T(_.stencilBuffer,q),at=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;_e(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,fe(_),et,_.width,_.height):B?i.renderbufferStorageMultisample(i.RENDERBUFFER,fe(_),et,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,et,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,at,i.RENDERBUFFER,C)}else{let W=_.textures;for(let q=0;q<W.length;q++){let et=W[q],at=r.convert(et.format,et.colorSpace),Y=r.convert(et.type),K=b(et.internalFormat,at,Y,et.normalized,et.colorSpace);_e(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,fe(_),K,_.width,_.height):B?i.renderbufferStorageMultisample(i.RENDERBUFFER,fe(_),K,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,K,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Vt(C,_,B){let W=_.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,C),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let q=n.get(_.depthTexture);if(q.__renderTarget=_,(!q.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),W){if(q.__webglInit===void 0&&(q.__webglInit=!0,_.depthTexture.addEventListener("dispose",R)),q.__webglTexture===void 0){q.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,q.__webglTexture),Zt(i.TEXTURE_CUBE_MAP,_.depthTexture);let ot=r.convert(_.depthTexture.format),St=r.convert(_.depthTexture.type),ht;_.depthTexture.format===Fn?ht=i.DEPTH_COMPONENT24:_.depthTexture.format===bi&&(ht=i.DEPTH24_STENCIL8);for(let lt=0;lt<6;lt++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,ht,_.width,_.height,0,ot,St,null)}}else $(_.depthTexture,0);let et=q.__webglTexture,at=fe(_),Y=W?i.TEXTURE_CUBE_MAP_POSITIVE_X+B:i.TEXTURE_2D,K=_.depthTexture.format===bi?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(_.depthTexture.format===Fn)_e(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,K,Y,et,0,at):i.framebufferTexture2D(i.FRAMEBUFFER,K,Y,et,0);else if(_.depthTexture.format===bi)_e(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,K,Y,et,0,at):i.framebufferTexture2D(i.FRAMEBUFFER,K,Y,et,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ne(C){let _=n.get(C),B=C.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==C.depthTexture){let W=C.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),W){let q=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,W.removeEventListener("dispose",q)};W.addEventListener("dispose",q),_.__depthDisposeCallback=q}_.__boundDepthTexture=W}if(C.depthTexture&&!_.__autoAllocateDepthBuffer)if(B)for(let W=0;W<6;W++)Vt(_.__webglFramebuffer[W],C,W);else{let W=C.texture.mipmaps;W&&W.length>0?Vt(_.__webglFramebuffer[0],C,0):Vt(_.__webglFramebuffer,C,0)}else if(B){_.__webglDepthbuffer=[];for(let W=0;W<6;W++)if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[W]),_.__webglDepthbuffer[W]===void 0)_.__webglDepthbuffer[W]=i.createRenderbuffer(),me(_.__webglDepthbuffer[W],C,!1);else{let q=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,et=_.__webglDepthbuffer[W];i.bindRenderbuffer(i.RENDERBUFFER,et),i.framebufferRenderbuffer(i.FRAMEBUFFER,q,i.RENDERBUFFER,et)}}else{let W=C.texture.mipmaps;if(W&&W.length>0?e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),me(_.__webglDepthbuffer,C,!1);else{let q=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,et=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,et),i.framebufferRenderbuffer(i.FRAMEBUFFER,q,i.RENDERBUFFER,et)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Kt(C,_,B){let W=n.get(C);_!==void 0&&At(W.__webglFramebuffer,C,C.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),B!==void 0&&ne(C)}function qt(C){let _=C.texture,B=n.get(C),W=n.get(_);C.addEventListener("dispose",x);let q=C.textures,et=C.isWebGLCubeRenderTarget===!0,at=q.length>1;if(at||(W.__webglTexture===void 0&&(W.__webglTexture=i.createTexture()),W.__version=_.version,a.memory.textures++),et){B.__webglFramebuffer=[];for(let Y=0;Y<6;Y++)if(_.mipmaps&&_.mipmaps.length>0){B.__webglFramebuffer[Y]=[];for(let K=0;K<_.mipmaps.length;K++)B.__webglFramebuffer[Y][K]=i.createFramebuffer()}else B.__webglFramebuffer[Y]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){B.__webglFramebuffer=[];for(let Y=0;Y<_.mipmaps.length;Y++)B.__webglFramebuffer[Y]=i.createFramebuffer()}else B.__webglFramebuffer=i.createFramebuffer();if(at)for(let Y=0,K=q.length;Y<K;Y++){let ot=n.get(q[Y]);ot.__webglTexture===void 0&&(ot.__webglTexture=i.createTexture(),a.memory.textures++)}if(C.samples>0&&_e(C)===!1){B.__webglMultisampledFramebuffer=i.createFramebuffer(),B.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let Y=0;Y<q.length;Y++){let K=q[Y];B.__webglColorRenderbuffer[Y]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,B.__webglColorRenderbuffer[Y]);let ot=r.convert(K.format,K.colorSpace),St=r.convert(K.type),ht=b(K.internalFormat,ot,St,K.normalized,K.colorSpace,C.isXRRenderTarget===!0),lt=fe(C);i.renderbufferStorageMultisample(i.RENDERBUFFER,lt,ht,C.width,C.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Y,i.RENDERBUFFER,B.__webglColorRenderbuffer[Y])}i.bindRenderbuffer(i.RENDERBUFFER,null),C.depthBuffer&&(B.__webglDepthRenderbuffer=i.createRenderbuffer(),me(B.__webglDepthRenderbuffer,C,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(et){e.bindTexture(i.TEXTURE_CUBE_MAP,W.__webglTexture),Zt(i.TEXTURE_CUBE_MAP,_);for(let Y=0;Y<6;Y++)if(_.mipmaps&&_.mipmaps.length>0)for(let K=0;K<_.mipmaps.length;K++)At(B.__webglFramebuffer[Y][K],C,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,K);else At(B.__webglFramebuffer[Y],C,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0);p(_)&&M(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(at){for(let Y=0,K=q.length;Y<K;Y++){let ot=q[Y],St=n.get(ot),ht=i.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(ht=C.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ht,St.__webglTexture),Zt(ht,ot),At(B.__webglFramebuffer,C,ot,i.COLOR_ATTACHMENT0+Y,ht,0),p(ot)&&M(ht)}e.unbindTexture()}else{let Y=i.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(Y=C.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(Y,W.__webglTexture),Zt(Y,_),_.mipmaps&&_.mipmaps.length>0)for(let K=0;K<_.mipmaps.length;K++)At(B.__webglFramebuffer[K],C,_,i.COLOR_ATTACHMENT0,Y,K);else At(B.__webglFramebuffer,C,_,i.COLOR_ATTACHMENT0,Y,0);p(_)&&M(Y),e.unbindTexture()}C.depthBuffer&&ne(C)}function ve(C){let _=C.textures;for(let B=0,W=_.length;B<W;B++){let q=_[B];if(p(q)){let et=S(C),at=n.get(q).__webglTexture;e.bindTexture(et,at),M(et),e.unbindTexture()}}}let Se=[],Ce=[];function Le(C){if(C.samples>0){if(_e(C)===!1){let _=C.textures,B=C.width,W=C.height,q=i.COLOR_BUFFER_BIT,et=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,at=n.get(C),Y=_.length>1;if(Y)for(let ot=0;ot<_.length;ot++)e.bindFramebuffer(i.FRAMEBUFFER,at.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,at.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,at.__webglMultisampledFramebuffer);let K=C.texture.mipmaps;K&&K.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,at.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,at.__webglFramebuffer);for(let ot=0;ot<_.length;ot++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(q|=i.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(q|=i.STENCIL_BUFFER_BIT)),Y){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,at.__webglColorRenderbuffer[ot]);let St=n.get(_[ot]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,St,0)}i.blitFramebuffer(0,0,B,W,0,0,B,W,q,i.NEAREST),l===!0&&(Se.length=0,Ce.length=0,Se.push(i.COLOR_ATTACHMENT0+ot),C.depthBuffer&&C.resolveDepthBuffer===!1&&(Se.push(et),Ce.push(et),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Ce)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Se))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),Y)for(let ot=0;ot<_.length;ot++){e.bindFramebuffer(i.FRAMEBUFFER,at.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.RENDERBUFFER,at.__webglColorRenderbuffer[ot]);let St=n.get(_[ot]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,at.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.TEXTURE_2D,St,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,at.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&l){let _=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function fe(C){return Math.min(s.maxSamples,C.samples)}function _e(C){let _=n.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function D(C){let _=a.render.frame;h.get(C)!==_&&(h.set(C,_),C.update())}function Xe(C,_){let B=C.colorSpace,W=C.format,q=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||B!==Bs&&B!==Tn&&(Gt.getTransfer(B)===Jt?(W!==pn||q!==Ze)&&Ct("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Pt("WebGLTextures: Unsupported texture color space:",B)),_}function jt(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=z,this.resetTextureUnits=F,this.getTextureUnits=k,this.setTextureUnits=L,this.setTexture2D=$,this.setTexture2DArray=Q,this.setTexture3D=nt,this.setTextureCube=st,this.rebindTextures=Kt,this.setupRenderTarget=qt,this.updateRenderTargetMipmap=ve,this.updateMultisampleRenderTarget=Le,this.setupDepthRenderbuffer=ne,this.setupFrameBufferTexture=At,this.useMultisampledRTT=_e,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function ux(i,t){function e(n,s=Tn){let r,a=Gt.getTransfer(s);if(n===Ze)return i.UNSIGNED_BYTE;if(n===Ua)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Fa)return i.UNSIGNED_SHORT_5_5_5_1;if(n===$l)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Zl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===ql)return i.BYTE;if(n===Yl)return i.SHORT;if(n===vs)return i.UNSIGNED_SHORT;if(n===Da)return i.INT;if(n===En)return i.UNSIGNED_INT;if(n===dn)return i.FLOAT;if(n===Vn)return i.HALF_FLOAT;if(n===Kl)return i.ALPHA;if(n===Jl)return i.RGB;if(n===pn)return i.RGBA;if(n===Fn)return i.DEPTH_COMPONENT;if(n===bi)return i.DEPTH_STENCIL;if(n===Oa)return i.RED;if(n===Ba)return i.RED_INTEGER;if(n===Si)return i.RG;if(n===ka)return i.RG_INTEGER;if(n===za)return i.RGBA_INTEGER;if(n===rr||n===ar||n===or||n===lr)if(a===Jt)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===rr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===ar)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===or)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===lr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===rr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===ar)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===or)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===lr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Ha||n===Va||n===Ga||n===Wa)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Ha)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Va)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ga)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Wa)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Xa||n===qa||n===Ya||n===$a||n===Za||n===cr||n===Ka)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Xa||n===qa)return a===Jt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ya)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===$a)return r.COMPRESSED_R11_EAC;if(n===Za)return r.COMPRESSED_SIGNED_R11_EAC;if(n===cr)return r.COMPRESSED_RG11_EAC;if(n===Ka)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Ja||n===ja||n===Qa||n===to||n===eo||n===no||n===io||n===so||n===ro||n===ao||n===oo||n===lo||n===co||n===ho)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Ja)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ja)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Qa)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===to)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===eo)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===no)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===io)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===so)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ro)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===ao)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===oo)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===lo)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===co)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ho)return a===Jt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===uo||n===fo||n===po)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===uo)return a===Jt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===fo)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===po)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===mo||n===go||n===hr||n===xo)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===mo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===go)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===hr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===xo)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===_s?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var fx=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,dx=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,bc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new Ks(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new re({vertexShader:fx,fragmentShader:dx,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Ht(new hn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Sc=class extends On{constructor(t,e){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,f=null,u=null,d=null,m=null,v=typeof XRWebGLBinding<"u",g=new bc,p={},M=e.getContextAttributes(),S=null,b=null,T=[],w=[],R=new It,x=null,y=new De;y.viewport=new le;let A=new De;A.viewport=new le;let I=[y,A],P=new Ca,F=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(J){let rt=T[J];return rt===void 0&&(rt=new ps,T[J]=rt),rt.getTargetRaySpace()},this.getControllerGrip=function(J){let rt=T[J];return rt===void 0&&(rt=new ps,T[J]=rt),rt.getGripSpace()},this.getHand=function(J){let rt=T[J];return rt===void 0&&(rt=new ps,T[J]=rt),rt.getHandSpace()};function L(J){let rt=w.indexOf(J.inputSource);if(rt===-1)return;let tt=T[rt];tt!==void 0&&(tt.update(J.inputSource,J.frame,c||a),tt.dispatchEvent({type:J.type,data:J.inputSource}))}function z(){s.removeEventListener("select",L),s.removeEventListener("selectstart",L),s.removeEventListener("selectend",L),s.removeEventListener("squeeze",L),s.removeEventListener("squeezestart",L),s.removeEventListener("squeezeend",L),s.removeEventListener("end",z),s.removeEventListener("inputsourceschange",H);for(let J=0;J<T.length;J++){let rt=w[J];rt!==null&&(w[J]=null,T[J].disconnect(rt))}F=null,k=null,g.reset();for(let J in p)delete p[J];t.setRenderTarget(S),d=null,u=null,f=null,s=null,b=null,Zt.stop(),n.isPresenting=!1,t.setPixelRatio(x),t.setSize(R.width,R.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(J){r=J,n.isPresenting===!0&&Ct("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(J){o=J,n.isPresenting===!0&&Ct("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(J){c=J},this.getBaseLayer=function(){return u!==null?u:d},this.getBinding=function(){return f===null&&v&&(f=new XRWebGLBinding(s,e)),f},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(J){if(s=J,s!==null){if(S=t.getRenderTarget(),s.addEventListener("select",L),s.addEventListener("selectstart",L),s.addEventListener("selectend",L),s.addEventListener("squeeze",L),s.addEventListener("squeezestart",L),s.addEventListener("squeezeend",L),s.addEventListener("end",z),s.addEventListener("inputsourceschange",H),M.xrCompatible!==!0&&await e.makeXRCompatible(),x=t.getPixelRatio(),t.getSize(R),v&&"createProjectionLayer"in XRWebGLBinding.prototype){let tt=null,Lt=null,Ut=null;M.depth&&(Ut=M.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,tt=M.stencil?bi:Fn,Lt=M.stencil?_s:En);let At={colorFormat:e.RGBA8,depthFormat:Ut,scaleFactor:r};f=this.getBinding(),u=f.createProjectionLayer(At),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),b=new Ve(u.textureWidth,u.textureHeight,{format:pn,type:Ze,depthTexture:new ei(u.textureWidth,u.textureHeight,Lt,void 0,void 0,void 0,void 0,void 0,void 0,tt),stencilBuffer:M.stencil,colorSpace:t.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{let tt={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,e,tt),s.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),b=new Ve(d.framebufferWidth,d.framebufferHeight,{format:pn,type:Ze,colorSpace:t.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Zt.setContext(s),Zt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function H(J){for(let rt=0;rt<J.removed.length;rt++){let tt=J.removed[rt],Lt=w.indexOf(tt);Lt>=0&&(w[Lt]=null,T[Lt].disconnect(tt))}for(let rt=0;rt<J.added.length;rt++){let tt=J.added[rt],Lt=w.indexOf(tt);if(Lt===-1){for(let At=0;At<T.length;At++)if(At>=w.length){w.push(tt),Lt=At;break}else if(w[At]===null){w[At]=tt,Lt=At;break}if(Lt===-1)break}let Ut=T[Lt];Ut&&Ut.connect(tt)}}let $=new U,Q=new U;function nt(J,rt,tt){$.setFromMatrixPosition(rt.matrixWorld),Q.setFromMatrixPosition(tt.matrixWorld);let Lt=$.distanceTo(Q),Ut=rt.projectionMatrix.elements,At=tt.projectionMatrix.elements,me=Ut[14]/(Ut[10]-1),Vt=Ut[14]/(Ut[10]+1),ne=(Ut[9]+1)/Ut[5],Kt=(Ut[9]-1)/Ut[5],qt=(Ut[8]-1)/Ut[0],ve=(At[8]+1)/At[0],Se=me*qt,Ce=me*ve,Le=Lt/(-qt+ve),fe=Le*-qt;if(rt.matrixWorld.decompose(J.position,J.quaternion,J.scale),J.translateX(fe),J.translateZ(Le),J.matrixWorld.compose(J.position,J.quaternion,J.scale),J.matrixWorldInverse.copy(J.matrixWorld).invert(),Ut[10]===-1)J.projectionMatrix.copy(rt.projectionMatrix),J.projectionMatrixInverse.copy(rt.projectionMatrixInverse);else{let _e=me+Le,D=Vt+Le,Xe=Se-fe,jt=Ce+(Lt-fe),C=ne*Vt/D*_e,_=Kt*Vt/D*_e;J.projectionMatrix.makePerspective(Xe,jt,C,_,_e,D),J.projectionMatrixInverse.copy(J.projectionMatrix).invert()}}function st(J,rt){rt===null?J.matrixWorld.copy(J.matrix):J.matrixWorld.multiplyMatrices(rt.matrixWorld,J.matrix),J.matrixWorldInverse.copy(J.matrixWorld).invert()}this.updateCamera=function(J){if(s===null)return;let rt=J.near,tt=J.far;g.texture!==null&&(g.depthNear>0&&(rt=g.depthNear),g.depthFar>0&&(tt=g.depthFar)),P.near=A.near=y.near=rt,P.far=A.far=y.far=tt,(F!==P.near||k!==P.far)&&(s.updateRenderState({depthNear:P.near,depthFar:P.far}),F=P.near,k=P.far),P.layers.mask=J.layers.mask|6,y.layers.mask=P.layers.mask&-5,A.layers.mask=P.layers.mask&-3;let Lt=J.parent,Ut=P.cameras;st(P,Lt);for(let At=0;At<Ut.length;At++)st(Ut[At],Lt);Ut.length===2?nt(P,y,A):P.projectionMatrix.copy(y.projectionMatrix),xt(J,P,Lt)};function xt(J,rt,tt){tt===null?J.matrix.copy(rt.matrixWorld):(J.matrix.copy(tt.matrixWorld),J.matrix.invert(),J.matrix.multiply(rt.matrixWorld)),J.matrix.decompose(J.position,J.quaternion,J.scale),J.updateMatrixWorld(!0),J.projectionMatrix.copy(rt.projectionMatrix),J.projectionMatrixInverse.copy(rt.projectionMatrixInverse),J.isPerspectiveCamera&&(J.fov=oa*2*Math.atan(1/J.projectionMatrix.elements[5]),J.zoom=1)}this.getCamera=function(){return P},this.getFoveation=function(){if(!(u===null&&d===null))return l},this.setFoveation=function(J){l=J,u!==null&&(u.fixedFoveation=J),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=J)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(P)},this.getCameraTexture=function(J){return p[J]};let Wt=null;function ue(J,rt){if(h=rt.getViewerPose(c||a),m=rt,h!==null){let tt=h.views;d!==null&&(t.setRenderTargetFramebuffer(b,d.framebuffer),t.setRenderTarget(b));let Lt=!1;tt.length!==P.cameras.length&&(P.cameras.length=0,Lt=!0);for(let Vt=0;Vt<tt.length;Vt++){let ne=tt[Vt],Kt=null;if(d!==null)Kt=d.getViewport(ne);else{let ve=f.getViewSubImage(u,ne);Kt=ve.viewport,Vt===0&&(t.setRenderTargetTextures(b,ve.colorTexture,ve.depthStencilTexture),t.setRenderTarget(b))}let qt=I[Vt];qt===void 0&&(qt=new De,qt.layers.enable(Vt),qt.viewport=new le,I[Vt]=qt),qt.matrix.fromArray(ne.transform.matrix),qt.matrix.decompose(qt.position,qt.quaternion,qt.scale),qt.projectionMatrix.fromArray(ne.projectionMatrix),qt.projectionMatrixInverse.copy(qt.projectionMatrix).invert(),qt.viewport.set(Kt.x,Kt.y,Kt.width,Kt.height),Vt===0&&(P.matrix.copy(qt.matrix),P.matrix.decompose(P.position,P.quaternion,P.scale)),Lt===!0&&P.cameras.push(qt)}let Ut=s.enabledFeatures;if(Ut&&Ut.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&v){f=n.getBinding();let Vt=f.getDepthInformation(tt[0]);Vt&&Vt.isValid&&Vt.texture&&g.init(Vt,s.renderState)}if(Ut&&Ut.includes("camera-access")&&v){t.state.unbindTexture(),f=n.getBinding();for(let Vt=0;Vt<tt.length;Vt++){let ne=tt[Vt].camera;if(ne){let Kt=p[ne];Kt||(Kt=new Ks,p[ne]=Kt);let qt=f.getCameraImage(ne);Kt.sourceTexture=qt}}}}for(let tt=0;tt<T.length;tt++){let Lt=w[tt],Ut=T[tt];Lt!==null&&Ut!==void 0&&Ut.update(Lt,rt,c||a)}Wt&&Wt(J,rt),rt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:rt}),m=null}let Zt=new Xu;Zt.setAnimationLoop(ue),this.setAnimationLoop=function(J){Wt=J},this.dispose=function(){}}},px=new Qt,Ju=new Nt;Ju.set(-1,0,0,0,1,0,0,0,1);function mx(i,t){function e(g,p){g.matrixAutoUpdate===!0&&g.updateMatrix(),p.value.copy(g.matrix)}function n(g,p){p.color.getRGB(g.fogColor.value,tc(i)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}function s(g,p,M,S,b){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(g,p):p.isMeshLambertMaterial?(r(g,p),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(g,p),f(g,p)):p.isMeshPhongMaterial?(r(g,p),h(g,p),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(g,p),u(g,p),p.isMeshPhysicalMaterial&&d(g,p,b)):p.isMeshMatcapMaterial?(r(g,p),m(g,p)):p.isMeshDepthMaterial?r(g,p):p.isMeshDistanceMaterial?(r(g,p),v(g,p)):p.isMeshNormalMaterial?r(g,p):p.isLineBasicMaterial?(a(g,p),p.isLineDashedMaterial&&o(g,p)):p.isPointsMaterial?l(g,p,M,S):p.isSpriteMaterial?c(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,e(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===Ge&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,e(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===Ge&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,e(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,e(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);let M=t.get(p),S=M.envMap,b=M.envMapRotation;S&&(g.envMap.value=S,g.envMapRotation.value.setFromMatrix4(px.makeRotationFromEuler(b)).transpose(),S.isCubeTexture&&S.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(Ju),g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,g.aoMapTransform))}function a(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform))}function o(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}function l(g,p,M,S){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*M,g.scale.value=S*.5,p.map&&(g.map.value=p.map,e(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function c(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function h(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}function f(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}function u(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}function d(g,p,M){g.ior.value=p.ior,p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ge&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=M.texture,g.transmissionSamplerSize.value.set(M.width,M.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,p){p.matcap&&(g.matcap.value=p.matcap)}function v(g,p){let M=t.get(p).light;g.referencePosition.value.setFromMatrixPosition(M.matrixWorld),g.nearDistance.value=M.shadow.camera.near,g.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function gx(i,t,e,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(b,T){let w=T.program;n.uniformBlockBinding(b,w)}function c(b,T){let w=s[b.id];w===void 0&&(g(b),w=h(b),s[b.id]=w,b.addEventListener("dispose",M));let R=T.program;n.updateUBOMapping(b,R);let x=t.render.frame;r[b.id]!==x&&(u(b),r[b.id]=x)}function h(b){let T=f();b.__bindingPointIndex=T;let w=i.createBuffer(),R=b.__size,x=b.usage;return i.bindBuffer(i.UNIFORM_BUFFER,w),i.bufferData(i.UNIFORM_BUFFER,R,x),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,T,w),w}function f(){for(let b=0;b<o;b++)if(a.indexOf(b)===-1)return a.push(b),b;return Pt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(b){let T=s[b.id],w=b.uniforms,R=b.__cache;i.bindBuffer(i.UNIFORM_BUFFER,T);for(let x=0,y=w.length;x<y;x++){let A=w[x];if(Array.isArray(A))for(let I=0,P=A.length;I<P;I++)d(A[I],x,I,R);else d(A,x,0,R)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(b,T,w,R){if(v(b,T,w,R)===!0){let x=b.__offset,y=b.value;if(Array.isArray(y)){let A=0;for(let I=0;I<y.length;I++){let P=y[I],F=p(P);m(P,b.__data,A),typeof P!="number"&&typeof P!="boolean"&&!P.isMatrix3&&!ArrayBuffer.isView(P)&&(A+=F.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(y,b.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,x,b.__data)}}function m(b,T,w){typeof b=="number"||typeof b=="boolean"?T[0]=b:b.isMatrix3?(T[0]=b.elements[0],T[1]=b.elements[1],T[2]=b.elements[2],T[3]=0,T[4]=b.elements[3],T[5]=b.elements[4],T[6]=b.elements[5],T[7]=0,T[8]=b.elements[6],T[9]=b.elements[7],T[10]=b.elements[8],T[11]=0):ArrayBuffer.isView(b)?T.set(new b.constructor(b.buffer,b.byteOffset,T.length)):b.toArray(T,w)}function v(b,T,w,R){let x=b.value,y=T+"_"+w;if(R[y]===void 0)return typeof x=="number"||typeof x=="boolean"?R[y]=x:ArrayBuffer.isView(x)?R[y]=x.slice():R[y]=x.clone(),!0;{let A=R[y];if(typeof x=="number"||typeof x=="boolean"){if(A!==x)return R[y]=x,!0}else{if(ArrayBuffer.isView(x))return!0;if(A.equals(x)===!1)return A.copy(x),!0}}return!1}function g(b){let T=b.uniforms,w=0,R=16;for(let y=0,A=T.length;y<A;y++){let I=Array.isArray(T[y])?T[y]:[T[y]];for(let P=0,F=I.length;P<F;P++){let k=I[P],L=Array.isArray(k.value)?k.value:[k.value];for(let z=0,H=L.length;z<H;z++){let $=L[z],Q=p($),nt=w%R,st=nt%Q.boundary,xt=nt+st;w+=st,xt!==0&&R-xt<Q.storage&&(w+=R-xt),k.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),k.__offset=w,w+=Q.storage}}}let x=w%R;return x>0&&(w+=R-x),b.__size=w,b.__cache={},this}function p(b){let T={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(T.boundary=4,T.storage=4):b.isVector2?(T.boundary=8,T.storage=8):b.isVector3||b.isColor?(T.boundary=16,T.storage=12):b.isVector4?(T.boundary=16,T.storage=16):b.isMatrix3?(T.boundary=48,T.storage=48):b.isMatrix4?(T.boundary=64,T.storage=64):b.isTexture?Ct("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(b)?(T.boundary=16,T.storage=b.byteLength):Ct("WebGLRenderer: Unsupported uniform value type.",b),T}function M(b){let T=b.target;T.removeEventListener("dispose",M);let w=a.indexOf(T.__bindingPointIndex);a.splice(w,1),i.deleteBuffer(s[T.id]),delete s[T.id],delete r[T.id]}function S(){for(let b in s)i.deleteBuffer(s[b]);a=[],s={},r={}}return{bind:l,update:c,dispose:S}}var xx=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Gn=null;function yx(){return Gn===null&&(Gn=new qs(xx,16,16,Si,Vn),Gn.name="DFG_LUT",Gn.minFilter=Ue,Gn.magFilter=Ue,Gn.wrapS=Un,Gn.wrapT=Un,Gn.generateMipmaps=!1,Gn.needsUpdate=!0),Gn}var To=class{constructor(t={}){let{canvas:e=gu(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:u=!1,outputBufferType:d=Ze}=t;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=a;let v=d,g=new Set([za,ka,Ba]),p=new Set([Ze,En,vs,_s,Ua,Fa]),M=new Uint32Array(4),S=new Int32Array(4),b=new U,T=null,w=null,R=[],x=[],y=null;this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Sn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let A=this,I=!1,P=null,F=null,k=null,L=null;this._outputColorSpace=Ne;let z=0,H=0,$=null,Q=-1,nt=null,st=new le,xt=new le,Wt=null,ue=new mt(0),Zt=0,J=e.width,rt=e.height,tt=1,Lt=null,Ut=null,At=new le(0,0,J,rt),me=new le(0,0,J,rt),Vt=!1,ne=new ms,Kt=!1,qt=!1,ve=new Qt,Se=new U,Ce=new le,Le={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},fe=!1;function _e(){return $===null?tt:1}let D=n;function Xe(E,O){return e.getContext(E,O)}try{let E={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"185"}`),e.addEventListener("webglcontextlost",de,!1),e.addEventListener("webglcontextrestored",ae,!1),e.addEventListener("webglcontextcreationerror",An,!1),D===null){let O="webgl2";if(D=Xe(O,E),D===null)throw Xe(O)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(E){throw Pt("WebGLRenderer: "+E.message),E}let jt,C,_,B,W,q,et,at,Y,K,ot,St,ht,lt,wt,Rt,Ft,N,it,Z,ct,pt,j;function bt(){jt=new T0(D),jt.init(),ct=new ux(D,jt),C=new x0(D,jt,t,ct),_=new cx(D,jt),C.reversedDepthBuffer&&u&&_.buffers.depth.setReversed(!0),F=D.createFramebuffer(),k=D.createFramebuffer(),L=D.createFramebuffer(),B=new R0(D),W=new Zg,q=new hx(D,jt,_,W,C,ct,B),et=new E0(A),at=new Ld(D),pt=new m0(D,at),Y=new w0(D,at,B,pt),K=new I0(D,Y,at,pt,B),N=new C0(D,C,q),wt=new y0(W),ot=new $g(A,et,jt,C,pt,wt),St=new mx(A,W),ht=new Jg,lt=new ix(jt),Ft=new p0(A,et,_,K,m,l),Rt=new lx(A,K,C),j=new gx(D,B,C,_),it=new g0(D,jt,B),Z=new A0(D,jt,B),B.programs=ot.programs,A.capabilities=C,A.extensions=jt,A.properties=W,A.renderLists=ht,A.shadowMap=Rt,A.state=_,A.info=B}bt(),v!==Ze&&(y=new L0(v,e.width,e.height,o,s,r));let vt=new Sc(A,D);this.xr=vt,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){let E=jt.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){let E=jt.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return tt},this.setPixelRatio=function(E){E!==void 0&&(tt=E,this.setSize(J,rt,!1))},this.getSize=function(E){return E.set(J,rt)},this.setSize=function(E,O,X=!0){if(vt.isPresenting){Ct("WebGLRenderer: Can't change size while VR device is presenting.");return}J=E,rt=O,e.width=Math.floor(E*tt),e.height=Math.floor(O*tt),X===!0&&(e.style.width=E+"px",e.style.height=O+"px"),y!==null&&y.setSize(e.width,e.height),this.setViewport(0,0,E,O)},this.getDrawingBufferSize=function(E){return E.set(J*tt,rt*tt).floor()},this.setDrawingBufferSize=function(E,O,X){J=E,rt=O,tt=X,e.width=Math.floor(E*X),e.height=Math.floor(O*X),this.setViewport(0,0,E,O)},this.setEffects=function(E){if(v===Ze){Pt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(E){for(let O=0;O<E.length;O++)if(E[O].isOutputPass===!0){Ct("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}y.setEffects(E||[])},this.getCurrentViewport=function(E){return E.copy(st)},this.getViewport=function(E){return E.copy(At)},this.setViewport=function(E,O,X,V){E.isVector4?At.set(E.x,E.y,E.z,E.w):At.set(E,O,X,V),_.viewport(st.copy(At).multiplyScalar(tt).round())},this.getScissor=function(E){return E.copy(me)},this.setScissor=function(E,O,X,V){E.isVector4?me.set(E.x,E.y,E.z,E.w):me.set(E,O,X,V),_.scissor(xt.copy(me).multiplyScalar(tt).round())},this.getScissorTest=function(){return Vt},this.setScissorTest=function(E){_.setScissorTest(Vt=E)},this.setOpaqueSort=function(E){Lt=E},this.setTransparentSort=function(E){Ut=E},this.getClearColor=function(E){return E.copy(Ft.getClearColor())},this.setClearColor=function(){Ft.setClearColor(...arguments)},this.getClearAlpha=function(){return Ft.getClearAlpha()},this.setClearAlpha=function(){Ft.setClearAlpha(...arguments)},this.clear=function(E=!0,O=!0,X=!0){let V=0;if(E){let G=!1;if($!==null){let dt=$.texture.format;G=g.has(dt)}if(G){let dt=$.texture.type,yt=p.has(dt),ft=Ft.getClearColor(),Mt=Ft.getClearAlpha(),Et=ft.r,Ot=ft.g,kt=ft.b;yt?(M[0]=Et,M[1]=Ot,M[2]=kt,M[3]=Mt,D.clearBufferuiv(D.COLOR,0,M)):(S[0]=Et,S[1]=Ot,S[2]=kt,S[3]=Mt,D.clearBufferiv(D.COLOR,0,S))}else V|=D.COLOR_BUFFER_BIT}O&&(V|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),X&&(V|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),V!==0&&D.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(E){E.setRenderer(this),P=E},this.dispose=function(){e.removeEventListener("webglcontextlost",de,!1),e.removeEventListener("webglcontextrestored",ae,!1),e.removeEventListener("webglcontextcreationerror",An,!1),Ft.dispose(),ht.dispose(),lt.dispose(),W.dispose(),et.dispose(),K.dispose(),pt.dispose(),j.dispose(),ot.dispose(),vt.dispose(),vt.removeEventListener("sessionstart",Lc),vt.removeEventListener("sessionend",Nc),Ii.stop()};function de(E){E.preventDefault(),Ql("WebGLRenderer: Context Lost."),I=!0}function ae(){Ql("WebGLRenderer: Context Restored."),I=!1;let E=B.autoReset,O=Rt.enabled,X=Rt.autoUpdate,V=Rt.needsUpdate,G=Rt.type;bt(),B.autoReset=E,Rt.enabled=O,Rt.autoUpdate=X,Rt.needsUpdate=V,Rt.type=G}function An(E){Pt("WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function Rn(E){let O=E.target;O.removeEventListener("dispose",Rn),_f(O)}function _f(E){Mf(E),W.remove(E)}function Mf(E){let O=W.get(E).programs;O!==void 0&&(O.forEach(function(X){ot.releaseProgram(X)}),E.isShaderMaterial&&ot.releaseShaderCache(E))}this.renderBufferDirect=function(E,O,X,V,G,dt){O===null&&(O=Le);let yt=G.isMesh&&G.matrixWorld.determinantAffine()<0,ft=Ef(E,O,X,V,G);_.setMaterial(V,yt);let Mt=X.index,Et=1;if(V.wireframe===!0){if(Mt=Y.getWireframeAttribute(X),Mt===void 0)return;Et=2}let Ot=X.drawRange,kt=X.attributes.position,Tt=Ot.start*Et,te=(Ot.start+Ot.count)*Et;dt!==null&&(Tt=Math.max(Tt,dt.start*Et),te=Math.min(te,(dt.start+dt.count)*Et)),Mt!==null?(Tt=Math.max(Tt,0),te=Math.min(te,Mt.count)):kt!=null&&(Tt=Math.max(Tt,0),te=Math.min(te,kt.count));let ge=te-Tt;if(ge<0||ge===1/0)return;pt.setup(G,V,ft,X,Mt);let pe,ie=it;if(Mt!==null&&(pe=at.get(Mt),ie=Z,ie.setIndex(pe)),G.isMesh)V.wireframe===!0?(_.setLineWidth(V.wireframeLinewidth*_e()),ie.setMode(D.LINES)):ie.setMode(D.TRIANGLES);else if(G.isLine){let Oe=V.linewidth;Oe===void 0&&(Oe=1),_.setLineWidth(Oe*_e()),G.isLineSegments?ie.setMode(D.LINES):G.isLineLoop?ie.setMode(D.LINE_LOOP):ie.setMode(D.LINE_STRIP)}else G.isPoints?ie.setMode(D.POINTS):G.isSprite&&ie.setMode(D.TRIANGLES);if(G.isBatchedMesh)if(jt.get("WEBGL_multi_draw"))ie.renderMultiDraw(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount);else{let Oe=G._multiDrawStarts,gt=G._multiDrawCounts,Je=G._multiDrawCount,Yt=Mt?at.get(Mt).bytesPerElement:1,rn=W.get(V).currentProgram.getUniforms();for(let Cn=0;Cn<Je;Cn++)rn.setValue(D,"_gl_DrawID",Cn),ie.render(Oe[Cn]/Yt,gt[Cn])}else if(G.isInstancedMesh)ie.renderInstances(Tt,ge,G.count);else if(X.isInstancedBufferGeometry){let Oe=X._maxInstanceCount!==void 0?X._maxInstanceCount:1/0,gt=Math.min(X.instanceCount,Oe);ie.renderInstances(Tt,ge,gt)}else ie.render(Tt,ge)};function Pc(E,O,X){E.transparent===!0&&E.side===fn&&E.forceSinglePass===!1?(E.side=Ge,E.needsUpdate=!0,yr(E,O,X),E.side=jn,E.needsUpdate=!0,yr(E,O,X),E.side=fn):yr(E,O,X)}this.compile=function(E,O,X=null){X===null&&(X=E),w=lt.get(X),w.init(O),x.push(w),X.traverseVisible(function(G){G.isLight&&G.layers.test(O.layers)&&(w.pushLight(G),G.castShadow&&w.pushShadow(G))}),E!==X&&E.traverseVisible(function(G){G.isLight&&G.layers.test(O.layers)&&(w.pushLight(G),G.castShadow&&w.pushShadow(G))}),w.setupLights();let V=new Set;return E.traverse(function(G){if(!(G.isMesh||G.isPoints||G.isLine||G.isSprite))return;let dt=G.material;if(dt)if(Array.isArray(dt))for(let yt=0;yt<dt.length;yt++){let ft=dt[yt];Pc(ft,X,G),V.add(ft)}else Pc(dt,X,G),V.add(dt)}),w=x.pop(),V},this.compileAsync=function(E,O,X=null){let V=this.compile(E,O,X);return new Promise(G=>{function dt(){if(V.forEach(function(yt){W.get(yt).currentProgram.isReady()&&V.delete(yt)}),V.size===0){G(E);return}setTimeout(dt,10)}jt.get("KHR_parallel_shader_compile")!==null?dt():setTimeout(dt,10)})};let Vo=null;function bf(E){Vo&&Vo(E)}function Lc(){Ii.stop()}function Nc(){Ii.start()}let Ii=new Xu;Ii.setAnimationLoop(bf),typeof self<"u"&&Ii.setContext(self),this.setAnimationLoop=function(E){Vo=E,vt.setAnimationLoop(E),E===null?Ii.stop():Ii.start()},vt.addEventListener("sessionstart",Lc),vt.addEventListener("sessionend",Nc),this.render=function(E,O){if(O!==void 0&&O.isCamera!==!0){Pt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;P!==null&&P.renderStart(E,O);let X=vt.enabled===!0&&vt.isPresenting===!0,V=y!==null&&($===null||X)&&y.begin(A,$);if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),vt.enabled===!0&&vt.isPresenting===!0&&(y===null||y.isCompositing()===!1)&&(vt.cameraAutoUpdate===!0&&vt.updateCamera(O),O=vt.getCamera()),E.isScene===!0&&E.onBeforeRender(A,E,O,$),w=lt.get(E,x.length),w.init(O),w.state.textureUnits=q.getTextureUnits(),x.push(w),ve.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),ne.setFromProjectionMatrix(ve,Mn,O.reversedDepth),qt=this.localClippingEnabled,Kt=wt.init(this.clippingPlanes,qt),T=ht.get(E,R.length),T.init(),R.push(T),vt.enabled===!0&&vt.isPresenting===!0){let yt=A.xr.getDepthSensingMesh();yt!==null&&Go(yt,O,-1/0,A.sortObjects)}Go(E,O,0,A.sortObjects),T.finish(),A.sortObjects===!0&&T.sort(Lt,Ut,O.reversedDepth),fe=vt.enabled===!1||vt.isPresenting===!1||vt.hasDepthSensing()===!1,fe&&Ft.addToRenderList(T,E),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Kt===!0&&wt.beginShadows();let G=w.state.shadowsArray;if(Rt.render(G,E,O),Kt===!0&&wt.endShadows(),(V&&y.hasRenderPass())===!1){let yt=T.opaque,ft=T.transmissive;if(w.setupLights(),O.isArrayCamera){let Mt=O.cameras;if(ft.length>0)for(let Et=0,Ot=Mt.length;Et<Ot;Et++){let kt=Mt[Et];Uc(yt,ft,E,kt)}fe&&Ft.render(E);for(let Et=0,Ot=Mt.length;Et<Ot;Et++){let kt=Mt[Et];Dc(T,E,kt,kt.viewport)}}else ft.length>0&&Uc(yt,ft,E,O),fe&&Ft.render(E),Dc(T,E,O)}$!==null&&H===0&&(q.updateMultisampleRenderTarget($),q.updateRenderTargetMipmap($)),V&&y.end(A),E.isScene===!0&&E.onAfterRender(A,E,O),pt.resetDefaultState(),Q=-1,nt=null,x.pop(),x.length>0?(w=x[x.length-1],q.setTextureUnits(w.state.textureUnits),Kt===!0&&wt.setGlobalState(A.clippingPlanes,w.state.camera)):w=null,R.pop(),R.length>0?T=R[R.length-1]:T=null,P!==null&&P.renderEnd()};function Go(E,O,X,V){if(E.visible===!1)return;if(E.layers.test(O.layers)){if(E.isGroup)X=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(O);else if(E.isLightProbeGrid)w.pushLightProbeGrid(E);else if(E.isLight)w.pushLight(E),E.castShadow&&w.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||ne.intersectsSprite(E)){V&&Ce.setFromMatrixPosition(E.matrixWorld).applyMatrix4(ve);let yt=K.update(E),ft=E.material;ft.visible&&T.push(E,yt,ft,X,Ce.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||ne.intersectsObject(E))){let yt=K.update(E),ft=E.material;if(V&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),Ce.copy(E.boundingSphere.center)):(yt.boundingSphere===null&&yt.computeBoundingSphere(),Ce.copy(yt.boundingSphere.center)),Ce.applyMatrix4(E.matrixWorld).applyMatrix4(ve)),Array.isArray(ft)){let Mt=yt.groups;for(let Et=0,Ot=Mt.length;Et<Ot;Et++){let kt=Mt[Et],Tt=ft[kt.materialIndex];Tt&&Tt.visible&&T.push(E,yt,Tt,X,Ce.z,kt)}}else ft.visible&&T.push(E,yt,ft,X,Ce.z,null)}}let dt=E.children;for(let yt=0,ft=dt.length;yt<ft;yt++)Go(dt[yt],O,X,V)}function Dc(E,O,X,V){let{opaque:G,transmissive:dt,transparent:yt}=E;w.setupLightsView(X),Kt===!0&&wt.setGlobalState(A.clippingPlanes,X),V&&_.viewport(st.copy(V)),G.length>0&&xr(G,O,X),dt.length>0&&xr(dt,O,X),yt.length>0&&xr(yt,O,X),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function Uc(E,O,X,V){if((X.isScene===!0?X.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[V.id]===void 0){let Tt=jt.has("EXT_color_buffer_half_float")||jt.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[V.id]=new Ve(1,1,{generateMipmaps:!0,type:Tt?Vn:Ze,minFilter:Mi,samples:Math.max(4,C.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Gt.workingColorSpace})}let dt=w.state.transmissionRenderTarget[V.id],yt=V.viewport||st;dt.setSize(yt.z*A.transmissionResolutionScale,yt.w*A.transmissionResolutionScale);let ft=A.getRenderTarget(),Mt=A.getActiveCubeFace(),Et=A.getActiveMipmapLevel();A.setRenderTarget(dt),A.getClearColor(ue),Zt=A.getClearAlpha(),Zt<1&&A.setClearColor(16777215,.5),A.clear(),fe&&Ft.render(X);let Ot=A.toneMapping;A.toneMapping=Sn;let kt=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),w.setupLightsView(V),Kt===!0&&wt.setGlobalState(A.clippingPlanes,V),xr(E,X,V),q.updateMultisampleRenderTarget(dt),q.updateRenderTargetMipmap(dt),jt.has("WEBGL_multisampled_render_to_texture")===!1){let Tt=!1;for(let te=0,ge=O.length;te<ge;te++){let pe=O[te],{object:ie,geometry:Oe,material:gt,group:Je}=pe;if(gt.side===fn&&ie.layers.test(V.layers)){let Yt=gt.side;gt.side=Ge,gt.needsUpdate=!0,Fc(ie,X,V,Oe,gt,Je),gt.side=Yt,gt.needsUpdate=!0,Tt=!0}}Tt===!0&&(q.updateMultisampleRenderTarget(dt),q.updateRenderTargetMipmap(dt))}A.setRenderTarget(ft,Mt,Et),A.setClearColor(ue,Zt),kt!==void 0&&(V.viewport=kt),A.toneMapping=Ot}function xr(E,O,X){let V=O.isScene===!0?O.overrideMaterial:null;for(let G=0,dt=E.length;G<dt;G++){let yt=E[G],{object:ft,geometry:Mt,group:Et}=yt,Ot=yt.material;Ot.allowOverride===!0&&V!==null&&(Ot=V),ft.layers.test(X.layers)&&Fc(ft,O,X,Mt,Ot,Et)}}function Fc(E,O,X,V,G,dt){E.onBeforeRender(A,O,X,V,G,dt),E.modelViewMatrix.multiplyMatrices(X.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),G.onBeforeRender(A,O,X,V,E,dt),G.transparent===!0&&G.side===fn&&G.forceSinglePass===!1?(G.side=Ge,G.needsUpdate=!0,A.renderBufferDirect(X,O,V,G,E,dt),G.side=jn,G.needsUpdate=!0,A.renderBufferDirect(X,O,V,G,E,dt),G.side=fn):A.renderBufferDirect(X,O,V,G,E,dt),E.onAfterRender(A,O,X,V,G,dt)}function yr(E,O,X){O.isScene!==!0&&(O=Le);let V=W.get(E),G=w.state.lights,dt=w.state.shadowsArray,yt=G.state.version,ft=ot.getParameters(E,G.state,dt,O,X,w.state.lightProbeGridArray),Mt=ot.getProgramCacheKey(ft),Et=V.programs;V.environment=E.isMeshStandardMaterial||E.isMeshLambertMaterial||E.isMeshPhongMaterial?O.environment:null,V.fog=O.fog;let Ot=E.isMeshStandardMaterial||E.isMeshLambertMaterial&&!E.envMap||E.isMeshPhongMaterial&&!E.envMap;V.envMap=et.get(E.envMap||V.environment,Ot),V.envMapRotation=V.environment!==null&&E.envMap===null?O.environmentRotation:E.envMapRotation,Et===void 0&&(E.addEventListener("dispose",Rn),Et=new Map,V.programs=Et);let kt=Et.get(Mt);if(kt!==void 0){if(V.currentProgram===kt&&V.lightsStateVersion===yt)return Bc(E,ft),kt}else ft.uniforms=ot.getUniforms(E),P!==null&&E.isNodeMaterial&&P.build(E,X,ft),E.onBeforeCompile(ft,A),kt=ot.acquireProgram(ft,Mt),Et.set(Mt,kt),V.uniforms=ft.uniforms;let Tt=V.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Tt.clippingPlanes=wt.uniform),Bc(E,ft),V.needsLights=wf(E),V.lightsStateVersion=yt,V.needsLights&&(Tt.ambientLightColor.value=G.state.ambient,Tt.lightProbe.value=G.state.probe,Tt.directionalLights.value=G.state.directional,Tt.directionalLightShadows.value=G.state.directionalShadow,Tt.spotLights.value=G.state.spot,Tt.spotLightShadows.value=G.state.spotShadow,Tt.rectAreaLights.value=G.state.rectArea,Tt.ltc_1.value=G.state.rectAreaLTC1,Tt.ltc_2.value=G.state.rectAreaLTC2,Tt.pointLights.value=G.state.point,Tt.pointLightShadows.value=G.state.pointShadow,Tt.hemisphereLights.value=G.state.hemi,Tt.directionalShadowMatrix.value=G.state.directionalShadowMatrix,Tt.spotLightMatrix.value=G.state.spotLightMatrix,Tt.spotLightMap.value=G.state.spotLightMap,Tt.pointShadowMatrix.value=G.state.pointShadowMatrix),V.lightProbeGrid=w.state.lightProbeGridArray.length>0,V.currentProgram=kt,V.uniformsList=null,kt}function Oc(E){if(E.uniformsList===null){let O=E.currentProgram.getUniforms();E.uniformsList=bs.seqWithValue(O.seq,E.uniforms)}return E.uniformsList}function Bc(E,O){let X=W.get(E);X.outputColorSpace=O.outputColorSpace,X.batching=O.batching,X.batchingColor=O.batchingColor,X.instancing=O.instancing,X.instancingColor=O.instancingColor,X.instancingMorph=O.instancingMorph,X.skinning=O.skinning,X.morphTargets=O.morphTargets,X.morphNormals=O.morphNormals,X.morphColors=O.morphColors,X.morphTargetsCount=O.morphTargetsCount,X.numClippingPlanes=O.numClippingPlanes,X.numIntersection=O.numClipIntersection,X.vertexAlphas=O.vertexAlphas,X.vertexTangents=O.vertexTangents,X.toneMapping=O.toneMapping}function Sf(E,O){if(E.length===0)return null;if(E.length===1)return E[0].texture!==null?E[0]:null;b.setFromMatrixPosition(O.matrixWorld);for(let X=0,V=E.length;X<V;X++){let G=E[X];if(G.texture!==null&&G.boundingBox.containsPoint(b))return G}return null}function Ef(E,O,X,V,G){O.isScene!==!0&&(O=Le),q.resetTextureUnits();let dt=O.fog,yt=V.isMeshStandardMaterial||V.isMeshLambertMaterial||V.isMeshPhongMaterial?O.environment:null,ft=$===null?A.outputColorSpace:$.isXRRenderTarget===!0?$.texture.colorSpace:Gt.workingColorSpace,Mt=V.isMeshStandardMaterial||V.isMeshLambertMaterial&&!V.envMap||V.isMeshPhongMaterial&&!V.envMap,Et=et.get(V.envMap||yt,Mt),Ot=V.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,kt=!!X.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Tt=!!X.morphAttributes.position,te=!!X.morphAttributes.normal,ge=!!X.morphAttributes.color,pe=Sn;V.toneMapped&&($===null||$.isXRRenderTarget===!0)&&(pe=A.toneMapping);let ie=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,Oe=ie!==void 0?ie.length:0,gt=W.get(V),Je=w.state.lights;if(Kt===!0&&(qt===!0||E!==nt)){let oe=E===nt&&V.id===Q;wt.setState(V,E,oe)}let Yt=!1;V.version===gt.__version?(gt.needsLights&&gt.lightsStateVersion!==Je.state.version||gt.outputColorSpace!==ft||G.isBatchedMesh&&gt.batching===!1||!G.isBatchedMesh&&gt.batching===!0||G.isBatchedMesh&&gt.batchingColor===!0&&G.colorTexture===null||G.isBatchedMesh&&gt.batchingColor===!1&&G.colorTexture!==null||G.isInstancedMesh&&gt.instancing===!1||!G.isInstancedMesh&&gt.instancing===!0||G.isSkinnedMesh&&gt.skinning===!1||!G.isSkinnedMesh&&gt.skinning===!0||G.isInstancedMesh&&gt.instancingColor===!0&&G.instanceColor===null||G.isInstancedMesh&&gt.instancingColor===!1&&G.instanceColor!==null||G.isInstancedMesh&&gt.instancingMorph===!0&&G.morphTexture===null||G.isInstancedMesh&&gt.instancingMorph===!1&&G.morphTexture!==null||gt.envMap!==Et||V.fog===!0&&gt.fog!==dt||gt.numClippingPlanes!==void 0&&(gt.numClippingPlanes!==wt.numPlanes||gt.numIntersection!==wt.numIntersection)||gt.vertexAlphas!==Ot||gt.vertexTangents!==kt||gt.morphTargets!==Tt||gt.morphNormals!==te||gt.morphColors!==ge||gt.toneMapping!==pe||gt.morphTargetsCount!==Oe||!!gt.lightProbeGrid!=w.state.lightProbeGridArray.length>0)&&(Yt=!0):(Yt=!0,gt.__version=V.version);let rn=gt.currentProgram;Yt===!0&&(rn=yr(V,O,G),P&&V.isNodeMaterial&&P.onUpdateProgram(V,rn,gt));let Cn=!1,ni=!1,qi=!1,se=rn.getUniforms(),xe=gt.uniforms;if(_.useProgram(rn.program)&&(Cn=!0,ni=!0,qi=!0),V.id!==Q&&(Q=V.id,ni=!0),gt.needsLights){let oe=Sf(w.state.lightProbeGridArray,G);gt.lightProbeGrid!==oe&&(gt.lightProbeGrid=oe,ni=!0)}if(Cn||nt!==E){_.buffers.depth.getReversed()&&E.reversedDepth!==!0&&(E._reversedDepth=!0,E.updateProjectionMatrix()),se.setValue(D,"projectionMatrix",E.projectionMatrix),se.setValue(D,"viewMatrix",E.matrixWorldInverse);let si=se.map.cameraPosition;si!==void 0&&si.setValue(D,Se.setFromMatrixPosition(E.matrixWorld)),C.logarithmicDepthBuffer&&se.setValue(D,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&se.setValue(D,"isOrthographic",E.isOrthographicCamera===!0),nt!==E&&(nt=E,ni=!0,qi=!0)}if(gt.needsLights&&(Je.state.directionalShadowMap.length>0&&se.setValue(D,"directionalShadowMap",Je.state.directionalShadowMap,q),Je.state.spotShadowMap.length>0&&se.setValue(D,"spotShadowMap",Je.state.spotShadowMap,q),Je.state.pointShadowMap.length>0&&se.setValue(D,"pointShadowMap",Je.state.pointShadowMap,q)),G.isSkinnedMesh){se.setOptional(D,G,"bindMatrix"),se.setOptional(D,G,"bindMatrixInverse");let oe=G.skeleton;oe&&(oe.boneTexture===null&&oe.computeBoneTexture(),se.setValue(D,"boneTexture",oe.boneTexture,q))}G.isBatchedMesh&&(se.setOptional(D,G,"batchingTexture"),se.setValue(D,"batchingTexture",G._matricesTexture,q),se.setOptional(D,G,"batchingIdTexture"),se.setValue(D,"batchingIdTexture",G._indirectTexture,q),se.setOptional(D,G,"batchingColorTexture"),G._colorsTexture!==null&&se.setValue(D,"batchingColorTexture",G._colorsTexture,q));let ii=X.morphAttributes;if((ii.position!==void 0||ii.normal!==void 0||ii.color!==void 0)&&N.update(G,X,rn),(ni||gt.receiveShadow!==G.receiveShadow)&&(gt.receiveShadow=G.receiveShadow,se.setValue(D,"receiveShadow",G.receiveShadow)),(V.isMeshStandardMaterial||V.isMeshLambertMaterial||V.isMeshPhongMaterial)&&V.envMap===null&&O.environment!==null&&(xe.envMapIntensity.value=O.environmentIntensity),xe.dfgLUT!==void 0&&(xe.dfgLUT.value=yx()),ni){if(se.setValue(D,"toneMappingExposure",A.toneMappingExposure),gt.needsLights&&Tf(xe,qi),dt&&V.fog===!0&&St.refreshFogUniforms(xe,dt),St.refreshMaterialUniforms(xe,V,tt,rt,w.state.transmissionRenderTarget[E.id]),gt.needsLights&&gt.lightProbeGrid){let oe=gt.lightProbeGrid;xe.probesSH.value=oe.texture,xe.probesMin.value.copy(oe.boundingBox.min),xe.probesMax.value.copy(oe.boundingBox.max),xe.probesResolution.value.copy(oe.resolution)}bs.upload(D,Oc(gt),xe,q)}if(V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(bs.upload(D,Oc(gt),xe,q),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&se.setValue(D,"center",G.center),se.setValue(D,"modelViewMatrix",G.modelViewMatrix),se.setValue(D,"normalMatrix",G.normalMatrix),se.setValue(D,"modelMatrix",G.matrixWorld),V.uniformsGroups!==void 0){let oe=V.uniformsGroups;for(let si=0,Yi=oe.length;si<Yi;si++){let kc=oe[si];j.update(kc,rn),j.bind(kc,rn)}}return rn}function Tf(E,O){E.ambientLightColor.needsUpdate=O,E.lightProbe.needsUpdate=O,E.directionalLights.needsUpdate=O,E.directionalLightShadows.needsUpdate=O,E.pointLights.needsUpdate=O,E.pointLightShadows.needsUpdate=O,E.spotLights.needsUpdate=O,E.spotLightShadows.needsUpdate=O,E.rectAreaLights.needsUpdate=O,E.hemisphereLights.needsUpdate=O}function wf(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return z},this.getActiveMipmapLevel=function(){return H},this.getRenderTarget=function(){return $},this.setRenderTargetTextures=function(E,O,X){let V=W.get(E);V.__autoAllocateDepthBuffer=E.resolveDepthBuffer===!1,V.__autoAllocateDepthBuffer===!1&&(V.__useRenderToTexture=!1),W.get(E.texture).__webglTexture=O,W.get(E.depthTexture).__webglTexture=V.__autoAllocateDepthBuffer?void 0:X,V.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(E,O){let X=W.get(E);X.__webglFramebuffer=O,X.__useDefaultFramebuffer=O===void 0},this.setRenderTarget=function(E,O=0,X=0){$=E,z=O,H=X;let V=null,G=!1,dt=!1;if(E){let ft=W.get(E);if(ft.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(D.FRAMEBUFFER,ft.__webglFramebuffer),st.copy(E.viewport),xt.copy(E.scissor),Wt=E.scissorTest,_.viewport(st),_.scissor(xt),_.setScissorTest(Wt),Q=-1;return}else if(ft.__webglFramebuffer===void 0)q.setupRenderTarget(E);else if(ft.__hasExternalTextures)q.rebindTextures(E,W.get(E.texture).__webglTexture,W.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){let Ot=E.depthTexture;if(ft.__boundDepthTexture!==Ot){if(Ot!==null&&W.has(Ot)&&(E.width!==Ot.image.width||E.height!==Ot.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");q.setupDepthRenderbuffer(E)}}let Mt=E.texture;(Mt.isData3DTexture||Mt.isDataArrayTexture||Mt.isCompressedArrayTexture)&&(dt=!0);let Et=W.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Et[O])?V=Et[O][X]:V=Et[O],G=!0):E.samples>0&&q.useMultisampledRTT(E)===!1?V=W.get(E).__webglMultisampledFramebuffer:Array.isArray(Et)?V=Et[X]:V=Et,st.copy(E.viewport),xt.copy(E.scissor),Wt=E.scissorTest}else st.copy(At).multiplyScalar(tt).floor(),xt.copy(me).multiplyScalar(tt).floor(),Wt=Vt;if(X!==0&&(V=F),_.bindFramebuffer(D.FRAMEBUFFER,V)&&_.drawBuffers(E,V),_.viewport(st),_.scissor(xt),_.setScissorTest(Wt),G){let ft=W.get(E.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+O,ft.__webglTexture,X)}else if(dt){let ft=O;for(let Mt=0;Mt<E.textures.length;Mt++){let Et=W.get(E.textures[Mt]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+Mt,Et.__webglTexture,X,ft)}}else if(E!==null&&X!==0){let ft=W.get(E.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,ft.__webglTexture,X)}Q=-1},this.readRenderTargetPixels=function(E,O,X,V,G,dt,yt,ft=0){if(!(E&&E.isWebGLRenderTarget)){Pt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Mt=W.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&yt!==void 0&&(Mt=Mt[yt]),Mt){_.bindFramebuffer(D.FRAMEBUFFER,Mt);try{let Et=E.textures[ft],Ot=Et.format,kt=Et.type;if(E.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+ft),!C.textureFormatReadable(Ot)){Pt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!C.textureTypeReadable(kt)){Pt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=E.width-V&&X>=0&&X<=E.height-G&&D.readPixels(O,X,V,G,ct.convert(Ot),ct.convert(kt),dt)}finally{let Et=$!==null?W.get($).__webglFramebuffer:null;_.bindFramebuffer(D.FRAMEBUFFER,Et)}}},this.readRenderTargetPixelsAsync=async function(E,O,X,V,G,dt,yt,ft=0){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Mt=W.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&yt!==void 0&&(Mt=Mt[yt]),Mt)if(O>=0&&O<=E.width-V&&X>=0&&X<=E.height-G){_.bindFramebuffer(D.FRAMEBUFFER,Mt);let Et=E.textures[ft],Ot=Et.format,kt=Et.type;if(E.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+ft),!C.textureFormatReadable(Ot))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!C.textureTypeReadable(kt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Tt=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Tt),D.bufferData(D.PIXEL_PACK_BUFFER,dt.byteLength,D.STREAM_READ),D.readPixels(O,X,V,G,ct.convert(Ot),ct.convert(kt),0);let te=$!==null?W.get($).__webglFramebuffer:null;_.bindFramebuffer(D.FRAMEBUFFER,te);let ge=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await yu(D,ge,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Tt),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,dt),D.deleteBuffer(Tt),D.deleteSync(ge),dt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(E,O=null,X=0){let V=Math.pow(2,-X),G=Math.floor(E.image.width*V),dt=Math.floor(E.image.height*V),yt=O!==null?O.x:0,ft=O!==null?O.y:0;q.setTexture2D(E,0),D.copyTexSubImage2D(D.TEXTURE_2D,X,0,0,yt,ft,G,dt),_.unbindTexture()},this.copyTextureToTexture=function(E,O,X=null,V=null,G=0,dt=0){let yt,ft,Mt,Et,Ot,kt,Tt,te,ge,pe=E.isCompressedTexture?E.mipmaps[dt]:E.image;if(X!==null)yt=X.max.x-X.min.x,ft=X.max.y-X.min.y,Mt=X.isBox3?X.max.z-X.min.z:1,Et=X.min.x,Ot=X.min.y,kt=X.isBox3?X.min.z:0;else{let xe=Math.pow(2,-G);yt=Math.floor(pe.width*xe),ft=Math.floor(pe.height*xe),E.isDataArrayTexture?Mt=pe.depth:E.isData3DTexture?Mt=Math.floor(pe.depth*xe):Mt=1,Et=0,Ot=0,kt=0}V!==null?(Tt=V.x,te=V.y,ge=V.z):(Tt=0,te=0,ge=0);let ie=ct.convert(O.format),Oe=ct.convert(O.type),gt;O.isData3DTexture?(q.setTexture3D(O,0),gt=D.TEXTURE_3D):O.isDataArrayTexture||O.isCompressedArrayTexture?(q.setTexture2DArray(O,0),gt=D.TEXTURE_2D_ARRAY):(q.setTexture2D(O,0),gt=D.TEXTURE_2D),_.activeTexture(D.TEXTURE0),_.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,O.flipY),_.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,O.premultiplyAlpha),_.pixelStorei(D.UNPACK_ALIGNMENT,O.unpackAlignment);let Je=_.getParameter(D.UNPACK_ROW_LENGTH),Yt=_.getParameter(D.UNPACK_IMAGE_HEIGHT),rn=_.getParameter(D.UNPACK_SKIP_PIXELS),Cn=_.getParameter(D.UNPACK_SKIP_ROWS),ni=_.getParameter(D.UNPACK_SKIP_IMAGES);_.pixelStorei(D.UNPACK_ROW_LENGTH,pe.width),_.pixelStorei(D.UNPACK_IMAGE_HEIGHT,pe.height),_.pixelStorei(D.UNPACK_SKIP_PIXELS,Et),_.pixelStorei(D.UNPACK_SKIP_ROWS,Ot),_.pixelStorei(D.UNPACK_SKIP_IMAGES,kt);let qi=E.isDataArrayTexture||E.isData3DTexture,se=O.isDataArrayTexture||O.isData3DTexture;if(E.isDepthTexture){let xe=W.get(E),ii=W.get(O),oe=W.get(xe.__renderTarget),si=W.get(ii.__renderTarget);_.bindFramebuffer(D.READ_FRAMEBUFFER,oe.__webglFramebuffer),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,si.__webglFramebuffer);for(let Yi=0;Yi<Mt;Yi++)qi&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,W.get(E).__webglTexture,G,kt+Yi),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,W.get(O).__webglTexture,dt,ge+Yi)),D.blitFramebuffer(Et,Ot,yt,ft,Tt,te,yt,ft,D.DEPTH_BUFFER_BIT,D.NEAREST);_.bindFramebuffer(D.READ_FRAMEBUFFER,null),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(G!==0||E.isRenderTargetTexture||W.has(E)){let xe=W.get(E),ii=W.get(O);_.bindFramebuffer(D.READ_FRAMEBUFFER,k),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,L);for(let oe=0;oe<Mt;oe++)qi?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,xe.__webglTexture,G,kt+oe):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,xe.__webglTexture,G),se?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,ii.__webglTexture,dt,ge+oe):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,ii.__webglTexture,dt),G!==0?D.blitFramebuffer(Et,Ot,yt,ft,Tt,te,yt,ft,D.COLOR_BUFFER_BIT,D.NEAREST):se?D.copyTexSubImage3D(gt,dt,Tt,te,ge+oe,Et,Ot,yt,ft):D.copyTexSubImage2D(gt,dt,Tt,te,Et,Ot,yt,ft);_.bindFramebuffer(D.READ_FRAMEBUFFER,null),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else se?E.isDataTexture||E.isData3DTexture?D.texSubImage3D(gt,dt,Tt,te,ge,yt,ft,Mt,ie,Oe,pe.data):O.isCompressedArrayTexture?D.compressedTexSubImage3D(gt,dt,Tt,te,ge,yt,ft,Mt,ie,pe.data):D.texSubImage3D(gt,dt,Tt,te,ge,yt,ft,Mt,ie,Oe,pe):E.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,dt,Tt,te,yt,ft,ie,Oe,pe.data):E.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,dt,Tt,te,pe.width,pe.height,ie,pe.data):D.texSubImage2D(D.TEXTURE_2D,dt,Tt,te,yt,ft,ie,Oe,pe);_.pixelStorei(D.UNPACK_ROW_LENGTH,Je),_.pixelStorei(D.UNPACK_IMAGE_HEIGHT,Yt),_.pixelStorei(D.UNPACK_SKIP_PIXELS,rn),_.pixelStorei(D.UNPACK_SKIP_ROWS,Cn),_.pixelStorei(D.UNPACK_SKIP_IMAGES,ni),dt===0&&O.generateMipmaps&&D.generateMipmap(gt),_.unbindTexture()},this.initRenderTarget=function(E){W.get(E).__webglFramebuffer===void 0&&q.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?q.setTextureCube(E,0):E.isData3DTexture?q.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?q.setTexture2DArray(E,0):q.setTexture2D(E,0),_.unbindTexture()},this.resetState=function(){z=0,H=0,$=null,_.reset(),pt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Mn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=Gt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Gt._getUnpackColorSpace()}};var Ro=12,Ec=`
  #define MAX_CASTERS ${Ro}
  uniform vec4 uCast[MAX_CASTERS];      // centre x, y, half-width (or radius), half-height (< 0: circle)
  uniform float uCastRot[MAX_CASTERS];
  uniform int uCastN;
  uniform vec2 uSunD;                   // direction the light travels
  uniform float uPen;
  float shadeOne(vec4 c, float rot, vec2 p) {
    vec2 d = uSunD, n = vec2(-d.y, d.x);
    vec2 r = p - c.xy;
    float u = dot(r, d), v = dot(r, n);
    if (c.w < 0.0) {
      float dvc = abs(v) - c.z;
      if (dvc >= uPen * 0.5) return 1.0;
      float vq = clamp(v, -c.z, c.z);
      if (u < -sqrt(c.z * c.z - vq * vq)) return 1.0;
      return clamp(0.5 + dvc / uPen, 0.0, 1.0);
    }
    float cs = cos(rot), sn = sin(rot);
    float a1v = cs * n.x + sn * n.y, a2v = -sn * n.x + cs * n.y;
    float a1u = cs * d.x + sn * d.y, a2u = -sn * d.x + cs * d.y;
    float ev = abs(a1v) * c.z + abs(a2v) * c.w;
    float dv = abs(v) - ev;
    if (dv >= uPen * 0.5) return 1.0;
    float vq = clamp(v, -ev, ev);
    float ua = -1e9;
    if (abs(a1u) > 1e-6) { float t1 = (-c.z - vq * a1v) / a1u, t2 = (c.z - vq * a1v) / a1u; ua = max(ua, min(t1, t2)); }
    if (abs(a2u) > 1e-6) { float t1 = (-c.w - vq * a2v) / a2u, t2 = (c.w - vq * a2v) / a2u; ua = max(ua, min(t1, t2)); }
    if (u < ua) return 1.0;
    return clamp(0.5 + dv / uPen, 0.0, 1.0);
  }
  // skip = 1-based index of a caster to ignore (a surface never shades itself); 0 = none
  float sunExposure(vec2 p, float skip) {
    float e = 1.0;
    for (int i = 0; i < MAX_CASTERS; i++) {
      if (i >= uCastN) break;
      if (abs(float(i + 1) - skip) < 0.5) continue;
      e = min(e, shadeOne(uCast[i], uCastRot[i], p));
    }
    return e;
  }
`;function ju(){return{uCast:{value:Array.from({length:Ro},()=>new le)},uCastRot:{value:new Array(Ro).fill(0)},uCastN:{value:0},uSunD:{value:new It(0,-1)},uPen:{value:.8},uFlareU:{value:0},uFlareOn:{value:0},uFlareW:{value:2.4},uFlareWarn:{value:0}}}function Qu(i,t){let e=t.sun;if(!e){i.uCastN.value=0,i.uFlareOn.value=0,i.uFlareWarn.value=0;return}i.uSunD.value.set(e.dx,e.dy),i.uPen.value=e.pen;let n=Math.min(Ro,e.casters.length);for(let s=0;s<n;s++){let r=e.casters[s],a=r.body,o=Math.cos(a.rot),l=Math.sin(a.rot),c=a.motion?a.x+o*r.lx-l*r.ly:r.wx,h=a.motion?a.y+l*r.lx+o*r.ly:r.wy,f=a.motion?a.rot+r.lrot:r.wrot;r.type==="circle"?i.uCast.value[s].set(c,h,r.r,-1):i.uCast.value[s].set(c,h,r.w/2,r.h/2),i.uCastRot.value[s]=f}if(i.uCastN.value=n,e.flare){let s=an(e,t.t);i.uFlareOn.value=s.state==="sweep"?1:0,i.uFlareU.value=s.u??0,i.uFlareW.value=e.flare.width,i.uFlareWarn.value=s.state==="warn"?1-s.lead/e.flare.warn:0}else i.uFlareOn.value=0,i.uFlareWarn.value=0}var vx=`
  ${Ec}
  uniform float uTime, uFlareU, uFlareOn, uFlareW, uFlareWarn;
  uniform vec3 uLit, uShade, uFront;
  varying vec2 vXY;
  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y); }
  void main() {
    float e = sunExposure(vXY, 0.0);
    vec2 d = uSunD, n = vec2(-d.y, d.x);
    float u = dot(vXY, d), v = dot(vXY, n);
    // streaks: long along the light, thin across it, flowing downstream \u2014 the push made visible
    float s1 = noise(vec2(v * 1.7, u * 0.07 - uTime * 0.9));
    float s2 = noise(vec2(v * 4.3 + 7.0, u * 0.16 - uTime * 2.1));
    float streak = smoothstep(0.55, 1.0, s1) * 0.7 + smoothstep(0.7, 1.0, s2) * 0.5;
    float edge = 1.0 - abs(e - 0.5) * 2.0;                 // the penumbra band
    float warn = uFlareWarn * (0.6 + 0.4 * sin(uTime * 18.0));
    vec3 lit = uLit * (1.0 + streak * 0.9 + warn * 0.8);
    vec3 col = mix(uShade, lit, e) + uLit * pow(edge, 3.0) * 0.8;
    float a = mix(0.66, 0.2 + streak * 0.16 + warn * 0.12, e) + pow(edge, 3.0) * 0.18;
    // flare front: a white-hot sheet, stopped dead by shade, with a short scorched wake behind it
    if (uFlareOn > 0.5) {
      float du = u - uFlareU;
      float sheet = exp(-du * du / (uFlareW * uFlareW * 0.18));
      float wake = du < 0.0 ? exp(du / 7.0) * 0.45 : 0.0;
      float f = (sheet + wake) * step(0.5, e);
      col = mix(col, uFront, clamp(f, 0.0, 1.0));
      a = max(a, f * 0.85);
    }
    gl_FragColor = vec4(col, a);
  }`,Co=class{constructor(t){this.mat=new re({vertexShader:"varying vec2 vXY; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vXY = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }",fragmentShader:vx,uniforms:{...t,uTime:{value:0},uLit:{value:new mt(1,.66,.3)},uShade:{value:new mt(0,.02,.07)},uFront:{value:new mt(1,.96,.85)}},transparent:!0,depthWrite:!1}),this.mesh=new Ht(new hn(1,1),this.mat),this.mesh.frustumCulled=!1,this.mesh.renderOrder=1}fit(t,e){this.mesh.scale.set(t.x1-t.x0+120,t.y1-t.y0+120,1),this.mesh.position.set((t.x0+t.x1)/2,(t.y0+t.y1)/2,-1.2),e&&(this.mat.uniforms.uLit.value.setRGB(...e.haze),this.mat.uniforms.uShade.value.setRGB(...e.shade))}};function tf(){let t=document.createElement("canvas");t.width=t.height=512;let e=t.getContext("2d"),n=Xn(1234);e.fillStyle="rgb(150,0,0)",e.fillRect(0,0,512,512);let s=[],r=(c,h,f,u,d)=>{if(d>4||f<40&&u<40||d>1&&n()<.22){s.push([c,h,f,u]);return}if(f>u?n()<.8:n()<.2){let m=Math.round(f*(.3+n()*.4)/8)*8;r(c,h,m,u,d+1),r(c+m,h,f-m,u,d+1)}else{let m=Math.round(u*(.3+n()*.4)/8)*8;r(c,h,f,m,d+1),r(c,h+m,f,u-m,d+1)}};r(0,0,512,512,0);for(let[c,h,f,u]of s){let d=105+Math.floor(n()*90);e.fillStyle=`rgb(${d},0,0)`,e.fillRect(c+1,h+1,f-2,u-2);let m=Math.floor(n()*4);for(let v=0;v<m;v++){let g=4+n()*f*.4,p=3+n()*u*.3,M=c+3+n()*Math.max(1,f-g-6),S=h+3+n()*Math.max(1,u-p-6),b=d+(n()<.5?-40:30);e.fillStyle=`rgb(${Math.max(30,Math.min(255,b))},0,0)`,e.fillRect(M,S,g,p)}if(e.fillStyle="rgb(35,0,0)",e.fillRect(c,h,f,1),e.fillRect(c,h,1,u),n()<.18&&f>24&&u>12){let v=Math.floor(u/14),g=3+Math.floor(n()*3);for(let p=0;p<v;p++)if(!(n()<.35))for(let M=c+5;M<c+f-6;M+=g+3)n()<.25||(e.fillStyle=`rgb(20,${150+Math.floor(n()*105)},0)`,e.fillRect(M,h+5+p*14,g,4))}}let a=e.getImageData(0,0,512,512),o=a.data;for(let c=0;c<512;c++)for(let h=0;h<512;h++){let f=(c*512+h)*4;o[f+2]=(h+c)%64<32?255:0}e.putImageData(a,0,0);let l=new Zs(t);return l.wrapS=l.wrapT=hs,l.anisotropy=4,l.colorSpace=Tn,l}var mn={key:new U(-.45,.65,.62).normalize(),keyColor:new mt(.62,.72,.9),warm:new U(.7,.45,-.55).normalize(),warmColor:new mt(1,.42,.16),cool:new U(-.8,.1,-.6).normalize(),coolColor:new mt(.25,.55,1),ambient:new mt(.05,.065,.1),fog:new mt(.02,.035,.07)},_x=`
  attribute vec3 color;
  attribute float aKind;
  attribute float aCaster;
  varying float vCaster;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vColor;
  varying float vKind;
  varying float vDepth;
  void main() {
    mat4 m = modelMatrix;
    #ifdef USE_INSTANCING
      m = modelMatrix * instanceMatrix;
    #endif
    vec4 wp = m * vec4(position, 1.0);
    vWorld = wp.xyz;
    vNormal = normalize(mat3(m) * normal);
    #ifdef USE_INSTANCING_COLOR
      vColor = instanceColor;
    #else
      vColor = color;
    #endif
    vKind = aKind;
    vCaster = aCaster;
    vec4 mv = viewMatrix * wp;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,Mx=`
  uniform sampler2D uTex;
  uniform vec3 uKey, uKeyC, uWarm, uWarmC, uCool, uCoolC, uAmb, uFog;
  uniform float uFogDensity, uTexScale, uWindow, uTime, uRim, uBright;
  uniform vec3 uWinColA, uWinColB, uCellC;
  // direct sunlight (Helios): off unless the stage has a sun; shade comes from the gameplay casters
  uniform float uSunOn, uCastUse;
  uniform vec3 uSun3, uSunC;
  ${Ec}
  varying float vCaster;
  varying vec3 vWorld;
  varying vec3 vNormal;
  varying vec3 vColor;
  varying float vKind;
  varying float vDepth;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  void main() {
    vec3 n = normalize(vNormal);
    vec3 an = abs(n);
    vec2 uv;
    if (an.z > an.x && an.z > an.y) uv = vWorld.xy;
    else if (an.x > an.y) uv = vWorld.zy;
    else uv = vWorld.xz;
    uv *= uTexScale;
    vec4 tx = texture2D(uTex, uv);
    float alb = tx.r;
    vec3 base = vColor * (0.55 + alb * 0.9);
    if (vKind > 2.5) {
      // solar cells: deep blue grid with a cold glint
      vec2 g = fract(uv * 9.0);
      float line = step(0.92, max(g.x, g.y));
      base = mix(uCellC * (0.8 + alb * 0.4), vec3(0.3, 0.35, 0.4), line);
    }
    if (vKind > 0.5 && vKind < 1.5) {
      // hazard stripes
      vec3 stripe = mix(vec3(0.05), vec3(0.85, 0.6, 0.12), tx.b);
      base = mix(base, stripe, 0.85);
    }
    vec3 V = normalize(cameraPosition - vWorld);
    float lk = max(dot(n, uKey), 0.0);
    float lw = max(dot(n, uWarm), 0.0);
    float lc = max(dot(n, uCool), 0.0);
    float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
    // front faces carry the key; side faces stay dark with a thin coloured rim
    float side = 1.0 - an.z;
    vec3 col = base * (uAmb + uKeyC * lk + (uWarmC * lw * 0.22 + uCoolC * lc * 0.3) * (1.0 - side * 0.5)) * uBright;
    col *= 1.0 - side * 0.45;
    col += (uWarmC * max(n.x, 0.0) * 0.18 + uCoolC * max(-n.x, 0.0) * 0.25 + vec3(0.35, 0.42, 0.55) * max(n.y, 0.0)) * fres * uRim;
    if (uSunOn > 0.5) {
      float ls = max(dot(n, -uSun3), 0.0);
      float e = uCastUse > 0.5 ? sunExposure(vWorld.xy - uSunD * 0.05, vCaster) : 1.0;
      col += base * uSunC * ls * e * uBright + uSunC * pow(ls, 6.0) * fres * e * 0.25;
    }
    // windows: lit cells blink very slowly
    float win = tx.g;
    if (win > 0.05 && an.z > 0.5) {
      vec2 cell = floor(uv * 128.0);
      float h = hash(cell + floor(vWorld.z));
      float on = step(0.35, h) * (0.75 + 0.25 * sin(uTime * (0.2 + h) + h * 30.0));
      col += mix(uWinColA, uWinColB, step(0.72, h)) * win * on * uWindow;
    }
    if (vKind > 1.5 && vKind < 2.5) col = vColor * 1.25; // pure emissive trim
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
    col = mix(col, uFog, clamp(fog, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
  }
`;function mr(i,t={}){return new re({vertexShader:_x,fragmentShader:Mx,uniforms:{uTex:{value:i},uKey:{value:mn.key},uKeyC:{value:mn.keyColor},uWarm:{value:mn.warm},uWarmC:{value:mn.warmColor},uCool:{value:mn.cool},uCoolC:{value:mn.coolColor},uAmb:{value:mn.ambient},uFog:{value:mn.fog.clone()},uFogDensity:{value:t.fog??.006},uTexScale:{value:t.texScale??.11},uWindow:{value:t.window??1.6},uTime:{value:0},uRim:{value:t.rim??.9},uBright:{value:t.bright??1},uWinColA:{value:new mt(1,.62,.22)},uWinColB:{value:new mt(.55,.85,1)},uCellC:{value:new mt(.05,.1,.24)},uSunOn:{value:0},uCastUse:{value:t.casters?1:0},uSun3:{value:new U(0,-1,-.5).normalize()},uSunC:{value:new mt(0,0,0)},...t.sun||{}}})}var bx=`
  attribute vec3 color;
  attribute float aSize;
  attribute float aPhase;
  attribute float aBlink;
  uniform float uTime, uScale;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float b = aBlink > 0.0 ? (0.25 + 0.75 * step(0.5, fract(uTime * aBlink + aPhase))) : 1.0;
    float tw = aBlink < 0.0 ? (0.7 + 0.3 * sin(uTime * -aBlink + aPhase * 6.283)) : 1.0;
    vAlpha = b * tw;
    vColor = color;
    gl_PointSize = aSize * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,Sx=`
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d) * 2.0;
    float core = exp(-r * r * 9.0);
    float halo = exp(-r * r * 2.2) * 0.35;
    float a = (core + halo) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * a, a);
  }
`,Ex=`
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.7, r) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * a, a);
  }
`;function Ai(i=!1){return new re({vertexShader:bx,fragmentShader:i?Ex:Sx,uniforms:{uTime:{value:0},uScale:{value:400}},transparent:!0,depthWrite:!1,blending:Hn})}function wn(i,t){let e=i.length,n=new Float32Array(e*3),s=new Float32Array(e*3),r=new Float32Array(e),a=new Float32Array(e),o=new Float32Array(e);i.forEach((h,f)=>{n[f*3]=h.x,n[f*3+1]=h.y,n[f*3+2]=h.z,s[f*3]=h.c[0],s[f*3+1]=h.c[1],s[f*3+2]=h.c[2],r[f]=h.s,a[f]=h.phase||0,o[f]=h.blink||0});let l=new he;l.setAttribute("position",new zt(n,3)),l.setAttribute("color",new zt(s,3)),l.setAttribute("aSize",new zt(r,1)),l.setAttribute("aPhase",new zt(a,1)),l.setAttribute("aBlink",new zt(o,1));let c=new pi(l,t);return c.frustumCulled=!1,c}var Tx=`
  precision highp float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec2 uCenter;     // screen-space 0..1
  uniform float uRadius;    // in screen heights
  uniform vec2 uPar;        // camera parallax offset
  uniform float uWarm;
  uniform float uIntensity;
  varying vec2 vUv;

  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return v;
  }
  vec3 stars(vec2 uv, float scale, float thresh){
    vec2 g = uv * scale;
    vec2 id = floor(g), f = fract(g) - 0.5;
    float h = hash(id);
    if (h < thresh) return vec3(0.0);
    vec2 o = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
    float d = length(f - o * 0.7);
    float b = smoothstep(0.08, 0.0, d) * (h - thresh) / (1.0 - thresh);
    vec3 tint = mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.85, 0.7), hash(id + 1.3));
    return tint * b * 1.6;
  }
  mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 uv = vUv;
    vec2 sp = vec2(uv.x * aspect, uv.y);
    vec2 c = vec2(uCenter.x * aspect, uCenter.y) - uPar * 0.6;
    vec2 p = (sp - c) / uRadius;
    float r = length(p);

    // gravitational lensing of the background
    vec2 lensed = sp + uPar + normalize(p + 1e-5) * (-0.22 * uRadius / max(r, 0.6)) * smoothstep(9.0, 0.8, r);

    // deep space base
    vec3 col = mix(vec3(0.006, 0.01, 0.03), vec3(0.02, 0.035, 0.08), uv.y);

    // nebula: swirled toward the hole, warm on one flank, cold on the other
    float swirl = 2.4 / (r + 0.6);
    vec2 q = rot(swirl + uTime * 0.01) * p;
    float n1 = fbm(q * 0.9 + vec2(uTime * 0.008, 0.0));
    float n2 = fbm(q * 2.1 - vec2(0.0, uTime * 0.012) + n1 * 1.6);
    float side = smoothstep(-0.9, 0.9, q.x + (n1 - 0.5) * 1.4);
    vec3 warm = mix(vec3(0.75, 0.12, 0.04), vec3(1.0, 0.5, 0.18), n2);
    vec3 cold = mix(vec3(0.05, 0.22, 0.75), vec3(0.35, 0.8, 1.0), n2);
    vec3 neb = mix(warm * uWarm, cold, side);
    // streams: spiral arms in log-polar space
    float ang = atan(p.y, p.x);
    float arm = sin(ang * 2.0 + log(r + 0.2) * 4.5 - uTime * 0.05 + n1 * 3.0);
    float streams = smoothstep(0.1, 1.0, arm) * smoothstep(12.0, 1.4, r);
    float neb_mask = pow(n2, 2.2) * (0.35 + 2.0 * streams) * smoothstep(9.0, 1.2, r);
    col += neb * neb_mask * 0.85 * uIntensity;
    // faint far nebula across the whole sky
    col += mix(vec3(0.03, 0.045, 0.12), vec3(0.08, 0.03, 0.05), fbm(sp * 1.3 + 4.0)) * fbm(sp * 2.7) * 0.3;

    // stars (lensed)
    col += stars(lensed, 140.0, 0.93) + stars(lensed + 3.7, 60.0, 0.965) * 1.3;

    // accretion disk: tilted, flattened ring around the core
    vec2 dq = rot(-0.38) * p;
    vec2 dd = vec2(dq.x, dq.y * 3.6);
    float dr = length(dd);
    float da = atan(dd.y, dd.x);
    float ring = smoothstep(1.15, 1.45, dr) * smoothstep(3.6, 1.7, dr);
    float flow = fbm(vec2(da * 3.0 - uTime * 0.25 / dr, dr * 3.0));
    float flank = smoothstep(-0.6, 0.6, dq.x);
    vec3 diskCol = mix(vec3(1.0, 0.45, 0.12) * uWarm + vec3(0.2, 0.02, 0.0), vec3(0.35, 0.75, 1.0), flank);
    // the far half of the disk passes behind the hole
    float behind = step(0.0, dq.y);
    float occl = mix(1.0, smoothstep(0.98, 1.06, r), behind);
    col += diskCol * ring * (0.35 + flow * 1.3) * 1.25 * occl * uIntensity;

    // lensed image of the far disk wrapping over the top of the hole
    float halo = smoothstep(1.0, 1.08, r) * smoothstep(1.85, 1.15, r);
    float haloFlow = fbm(vec2(ang * 4.0 + uTime * 0.2, r * 6.0));
    col += mix(vec3(1.0, 0.55, 0.25) * uWarm, vec3(0.5, 0.85, 1.0), smoothstep(-0.3, 0.3, p.x)) * halo * (0.25 + haloFlow) * 0.9 * uIntensity;

    // photon ring
    float pr = exp(-pow((r - 1.04) * 22.0, 2.0));
    col += vec3(1.0, 0.92, 0.85) * pr * 1.4 * uIntensity;

    // event horizon
    col *= smoothstep(0.96, 1.02, r);

    // vignette
    vec2 vv = uv - 0.5;
    col *= 1.0 - dot(vv, vv) * 0.9;
    gl_FragColor = vec4(col, 1.0);
  }
`,wx=`
  precision highp float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec2 uCenter;     // screen-space 0..1 (usually off the top of the frame)
  uniform float uRadius;    // in screen heights
  uniform vec2 uPar;
  uniform float uFlare;     // 0 \u2192 1 over a flare telegraph
  uniform float uFlash;     // 1 while a front sweeps
  varying vec2 vUv;
  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; } return v; }
  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 sp = vec2(vUv.x * aspect, vUv.y);
    vec2 c = vec2(uCenter.x * aspect, uCenter.y) - uPar * 0.25;
    vec2 p = (sp - c) / uRadius;
    float r = length(p);
    float ang = atan(p.y, p.x);
    float fl = uFlare * (0.75 + 0.25 * sin(uTime * 16.0)) + uFlash;

    // sky: cold navy far from the star, scorched amber toward it
    float near = exp(-(r - 1.0) * 1.8);
    vec3 col = mix(vec3(0.004, 0.008, 0.025), vec3(0.025, 0.03, 0.06), vUv.y);
    col += vec3(0.5, 0.2, 0.05) * near * 0.38;
    // sparse stars where the glare allows
    vec2 g = sp * 150.0; vec2 id = floor(g);
    float h = hash(id);
    col += vec3(0.8, 0.85, 1.0) * step(0.985, h) * smoothstep(0.1, 0.0, length(fract(g) - 0.5)) * (1.0 - smoothstep(0.0, 0.5, near));

    // light shafts falling away from the star
    float rays = fbm(vec2(ang * 38.0, r * 0.6 - uTime * 0.25)) * fbm(vec2(ang * 11.0 + 3.0, uTime * 0.05));
    col += vec3(1.0, 0.62, 0.25) * pow(rays, 2.0) * 1.1 * exp(-(r - 1.0) * 2.2) * step(1.0, r) * (1.0 + fl);

    // corona and prominences hugging the limb
    float cor = exp(-(r - 1.0) * 9.0) * step(1.0, r);
    float prom = fbm(vec2(ang * 22.0, uTime * 0.12)) * fbm(vec2(ang * 7.0 - uTime * 0.04, r * 4.0));
    float promMask = smoothstep(0.35, 0.8, prom) * exp(-(r - 1.0) * 26.0) * step(1.0, r);
    col += vec3(1.0, 0.55, 0.2) * cor * (0.9 + fl * 1.2) + vec3(1.0, 0.35, 0.12) * promMask * (1.6 + fl * 2.0);

    // the disc: granulation, limb darkening from white-gold core to deep orange edge
    if (r < 1.0) {
      float mu = sqrt(1.0 - r * r);
      vec2 q = p * 14.0 + vec2(uTime * 0.03, 0.0);
      float gran = noise(q) * 0.6 + noise(q * 2.3 + 5.0) * 0.4;
      float cells = smoothstep(0.2, 0.75, gran);
      vec3 core = vec3(1.0, 0.97, 0.88), mid = vec3(1.0, 0.78, 0.4), edge = vec3(0.95, 0.38, 0.08);
      vec3 disc = mix(edge, mix(mid, core, smoothstep(0.35, 0.95, mu)), smoothstep(0.0, 0.5, mu));
      disc *= 0.82 + cells * 0.28;
      disc += vec3(1.0, 0.9, 0.7) * fl * 0.35;
      float aa = smoothstep(1.0, 0.996, r);
      col = mix(col, disc, aa);
    }
    // flare sweep: the whole sky blooms for a moment
    col += vec3(1.0, 0.85, 0.6) * uFlash * 0.25 * near;
    vec2 vv = vUv - 0.5;
    col *= 1.0 - dot(vv, vv) * 0.7;
    gl_FragColor = vec4(col, 1.0);
  }
`,Io=class{constructor(t){this.renderer=t,this.scene=new zi,this.cam=new yi(0,1,1,0,-1,1),this.mat=new re({vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy * 2.0 - 1.0, 0.0, 1.0); }",fragmentShader:Tx,uniforms:{uRes:{value:new It(1,1)},uTime:{value:0},uCenter:{value:new It(.78,.7)},uRadius:{value:.12},uPar:{value:new It},uWarm:{value:1},uIntensity:{value:1}},depthTest:!1,depthWrite:!1}),this.anomalyMat=this.mat,this.starMat=null;let e=new hn(1,1);e.translate(.5,.5,0),this.mesh=new Ht(e,this.mat),this.scene.add(this.mesh),this.rt=new Ve(4,4,{depthBuffer:!1}),this.rt.texture.colorSpace=Ne,this.scale=.5,this.frame=0}setTheme(t,e,n){if(t.background==="star"){this.starMat||(this.starMat=new re({vertexShader:this.anomalyMat.vertexShader,fragmentShader:wx,uniforms:{uRes:this.anomalyMat.uniforms.uRes,uTime:{value:0},uCenter:{value:new It(.5,1.6)},uRadius:{value:1},uPar:{value:new It},uFlare:{value:0},uFlash:{value:0}},depthTest:!1,depthWrite:!1})),this.mat=this.starMat;let s=e.star||{},r=n?n.dx:0,a=n?n.dy:-1,o=s.r??1.25;this.mat.uniforms.uCenter.value.set(s.x??.5-r*(.5+o*.78),s.y??.5-a*(.5+o*.78)),this.mat.uniforms.uRadius.value=o}else this.mat=this.anomalyMat,this.setLook(e);this.mesh.material=this.mat}setFlare(t,e){this.mat===this.starMat&&(this.mat.uniforms.uFlare.value=t,this.mat.uniforms.uFlash.value=e)}setLook(t){let e=this.mat.uniforms;e.uCenter.value.set(t.holeX??.78,t.holeY??.7),e.uRadius.value=.15*(t.hole??1),e.uWarm.value=.75+(t.warm??.5)*.5}resize(t,e,n){let s=Math.max(64,Math.floor(t*n*this.scale)),r=Math.max(36,Math.floor(e*n*this.scale));this.rt.setSize(s,r),this.mat.uniforms.uRes.value.set(s,r)}render(t,e,n){let s=this.mat.uniforms;s.uTime.value=t,s.uPar.value.set(e,n);let r=this.renderer.getRenderTarget();this.renderer.setRenderTarget(this.rt),this.renderer.render(this.scene,this.cam),this.renderer.setRenderTarget(r)}};var ef=Math.PI*2;function sn(i=60,t=9){return{a:0,v:0,target:0,k:i,d:t}}var Ax="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",Rx=`
  uniform vec3 uColor; uniform float uPower; uniform float uTime; varying vec2 vUv;
  void main(){
    float y = 1.0 - vUv.y;         // 1 at nozzle, 0 at tip
    float flick = 0.85 + 0.15 * sin(uTime * 70.0 + y * 20.0);
    float core = pow(y, 1.6) * flick;
    float a = core * uPower;
    vec3 c = mix(uColor, vec3(1.0), pow(y, 4.0) * 0.8);
    gl_FragColor = vec4(c * a, a);
  }`;function Tc(i){return new re({vertexShader:Ax,fragmentShader:Rx,uniforms:{uColor:{value:new mt(i)},uPower:{value:0},uTime:{value:0}},transparent:!0,depthWrite:!1,blending:Hn,side:fn})}var gr=class{constructor(t={}){let e=new kn({color:t.suit??14673388,roughness:.5,metalness:.05}),n=new kn({color:2304047,roughness:.7,metalness:.2}),s=new kn({color:t.accent??16742943,roughness:.45,emissive:new mt(t.accent??16742943).multiplyScalar(.25)}),r=new kn({color:726052,roughness:.12,metalness:.9,emissive:new mt(t.visorGlow??865616)}),a=new cn({color:t.light??6285055});this.mats={suit:e,dark:n,accent:s,visor:r,glow:a};let o=new ye;this.root=o;let l=new ye;o.add(l),this.body=l;let c=(M,S,b,T=0,w=0,R=0)=>{let x=new Ht(S,b);return x.position.set(T,w,R),M.add(x),x},h=new ye;l.add(h),this.torso=h,c(h,new gs(.19,.36,4,12),e,0,.06,0),c(h,new Ee(.1,.26,.3),e,.13,.16,0),c(h,new Ee(.04,.05,.12),s,.19,.2,.05),c(h,new Te(.2,.2,.08,14),n,0,-.17,0),c(h,new un(.15,.03,6,16),n,0,.4,0).rotation.x=Math.PI/2;let f=new ye;f.position.set(0,.56,0),h.add(f),this.head=f,c(f,new $e(.175,18,14),e);let u=c(f,new $e(.165,18,12,-Math.PI*.42,Math.PI*.84,Math.PI*.22,Math.PI*.5),r,.03,0,0);u.rotation.y=Math.PI/2;let d=c(f,new Te(.008,.012,.32,5),n,-.07,.15,.13);d.rotation.z=.55,this.antTip=c(f,new $e(.022,6,5),new cn({color:t.beacon??16726830}),-.155,.285,.13),c(f,new Ee(.08,.06,.05),n,-.02,.05,.17),c(f,new Ee(.02,.03,.04),a,.025,.05,.19);let m=new ye;m.position.set(-.27,.12,0),h.add(m),this.pack=m,c(m,new Ee(.17,.5,.38),e),c(m,new Ee(.03,.4,.06),a,-.09,.02,.12),c(m,new Ee(.13,.08,.42),n,0,.21,0);let v=new Te(.03,.045,.08,8);c(m,v,n,-.02,-.29,.11),c(m,v,n,-.02,-.29,-.11),c(m,new Ee(.05,.05,.05),n,0,.27,.19),c(m,new Ee(.05,.05,.05),n,0,.27,-.19),this.flameMat=Tc(5818623);let g=new Hi(.06,.9,10,1,!0);g.rotateX(Math.PI),g.translate(0,-.45,0),this.flames=[];for(let M of[.11,-.11]){let S=new Ht(g,this.flameMat);S.position.set(-.02,-.33,M),m.add(S),this.flames.push(S)}let p=(M,S,b,T,w,R,x)=>{let y=new ye;y.position.set(S,b,T),M.add(y);let A=new Ht(new gs(R,w,3,8),x);return A.position.y=-w/2-R*.5,y.add(A),y};this.armN=p(h,.02,.33,.25,.24,.07,e),this.foreN=p(this.armN,0,-.34,0,.22,.062,s),c(this.foreN,new $e(.07,8,6),n,0,-.36,0),this.armF=p(h,.02,.33,-.25,.24,.07,e),this.foreF=p(this.armF,0,-.34,0,.22,.062,e),c(this.foreF,new $e(.07,8,6),n,0,-.36,0),this.legN=p(h,0,-.2,.11,.36,.09,e),this.shinN=p(this.legN,0,-.5,0,.34,.08,e),this.legF=p(h,0,-.2,-.11,.36,.09,e),this.shinF=p(this.legF,0,-.5,0,.34,.08,e);for(let M of[this.shinN,this.shinF])c(M,new Ee(.17,.14,.13),n,.03,-.5,0),c(M,new Te(.083,.083,.05,10),n,0,-.08,0);c(h,new un(.07,.022,5,12),s,-.05,-.12,.2).rotation.y=Math.PI/2,this.root.scale.setScalar(t.scale??1.3),this.j={armN:sn(40,7),armF:sn(40,7),foreN:sn(50,7),foreF:sn(50,7),armNx:sn(40,7),armFx:sn(40,7),legN:sn(45,8),legF:sn(45,8),shinN:sn(55,8),shinF:sn(55,8),spine:sn(35,7),headP:sn(50,8),pack:sn(80,6)},this.visAngle=0,this.visVel=0,this.roll=.55,this.rollVel=0,this.t=Math.random()*10,this.power=0,this.flail=0,this.stretch=0,this.root.traverse(M=>{M.frustumCulled=!1})}kick(t){for(let e of Object.keys(this.j))this.j[e].v+=(Math.random()-.5)*t*14;this.rollVel+=(Math.random()-.5)*t*3,this.flail=Math.min(1.5,this.flail+t*.25)}update(t,e){this.t+=t;let n=this.t,s=e.angle-this.visAngle;for(;s>Math.PI;)s-=ef;for(;s<-Math.PI;)s+=ef;let r=e.dead?400:260;this.visVel+=(s*r-this.visVel*30)*t,this.visAngle+=this.visVel*t,this.root.position.set(e.x,e.y,0),this.root.rotation.z=this.visAngle-Math.PI/2,this.power+=((e.thrusting?1:0)-this.power)*Math.min(1,t*18),this.flail*=Math.exp(-t*(e.dead?.2:1.2));let a=this.flail+(e.dead?.8:0)+Math.min(1,Math.abs(e.tumble)*.18),o=.55+Math.sin(n*.37)*.22+e.turning*.35;this.rollVel+=((o-this.roll)*6-this.rollVel*3)*t+e.tumble*t*.4,this.roll+=this.rollVel*t,this.body.rotation.y=this.roll,this.body.rotation.x=Math.sin(n*.29)*.08;let l=this.j,c=e.docked?1:0,h=.35,f=-.35,u=.15,d=-.35,m=0,v=.15;e.thrusting&&(h=-.15,f=-.15,u=-.05,d=-.05,m=-.06,v=.08),e.braking&&(h=1.1,f=-.6,u=.75,d=-1.1,m=.18,v=.35),e.latched&&(h=2.6,f=-.2,u=.4,d=-.6),c&&(h=.2,f=-.4,u=.05,d=-.15,m=0);let g=Math.sin(n*.8);l.armN.target=h+g*.1+Math.sin(n*13)*a*.9,l.armF.target=h*.8-g*.08+Math.sin(n*11+1)*a*.9+(e.latched?-2:0),l.foreN.target=f+Math.sin(n*15)*a*.6,l.foreF.target=f+Math.sin(n*12+2)*a*.6,l.armNx.target=v+Math.sin(n*9)*a*.5,l.armFx.target=-v-Math.sin(n*10)*a*.5,l.legN.target=u+Math.sin(n*.7)*.08+Math.sin(n*12)*a*.7,l.legF.target=u*.7-Math.sin(n*.7+1)*.1+Math.sin(n*10+3)*a*.7,l.shinN.target=d+Math.sin(n*14)*a*.4,l.shinF.target=d*1.2+Math.sin(n*13+1)*a*.4,l.spine.target=m,l.headP.target=(e.braking?.25:0)+Math.sin(n*.5)*.05,l.pack.target=0,e.thrusting&&(l.legN.v-=t*6,l.legF.v-=t*6,l.pack.v+=t*4);for(let M in l){let S=l[M];S.v+=((S.target-S.a)*S.k-S.v*S.d)*t,S.a+=S.v*t}this.armN.rotation.set(l.armNx.a,0,l.armN.a),this.armF.rotation.set(l.armFx.a,0,l.armF.a),this.foreN.rotation.z=Math.min(0,l.foreN.a),this.foreF.rotation.z=Math.min(0,l.foreF.a),this.legN.rotation.z=l.legN.a,this.legF.rotation.z=l.legF.a,this.shinN.rotation.z=Math.min(.05,l.shinN.a),this.shinF.rotation.z=Math.min(.05,l.shinF.a),this.torso.rotation.z=l.spine.a,this.head.rotation.z=l.headP.a,this.pack.rotation.z=l.pack.a*.3;let p=.8+Math.random()*.4;for(let M of this.flames)M.scale.set(1,this.power*p+.001,1);if(this.flameMat.uniforms.uPower.value=this.power,this.flameMat.uniforms.uTime.value=n,this.antTip.visible=n%1.4<.18||!!e.beaconSolid,e.stretch>0){let M=e.stretch;this.root.scale.set(1.3*(1-M*.7),1.3*(1+M*3),1.3*(1-M*.7))}}};var Po=class{constructor(t=1400){this.max=t,this.n=0;let e=new he;this.pos=new Float32Array(t*3),this.col=new Float32Array(t*3),this.size=new Float32Array(t),e.setAttribute("position",new zt(this.pos,3).setUsage(Ei)),e.setAttribute("color",new zt(this.col,3).setUsage(Ei)),e.setAttribute("aSize",new zt(this.size,1).setUsage(Ei)),e.setAttribute("aPhase",new zt(new Float32Array(t),1)),e.setAttribute("aBlink",new zt(new Float32Array(t),1)),this.geo=e,this.mat=Ai(),this.points=new pi(e,this.mat),this.points.frustumCulled=!1,this.points.renderOrder=5,this.p=[];for(let n=0;n<t;n++)this.p.push({x:0,y:0,z:0,vx:0,vy:0,vz:0,life:0,max:1,s0:1,s1:1,r:1,g:1,b:1,drag:0})}spawn(t,e,n,s,r,a,o,l,c,h,f,u,d=0){if(this.n>=this.max)return;let m=this.p[this.n++];m.x=t,m.y=e,m.z=n,m.vx=s,m.vy=r,m.vz=a,m.life=o,m.max=o,m.s0=l,m.s1=c,m.r=h,m.g=f,m.b=u,m.drag=d}clear(){this.n=0}update(t,e){let n=0;for(;n<this.n;){let r=this.p[n];if(r.life-=t,r.life<=0){let o=this.p[this.n-1];this.p[this.n-1]=r,this.p[n]=o,this.n--;continue}let a=Math.exp(-r.drag*t);r.vx*=a,r.vy*=a,r.vz*=a,r.x+=r.vx*t,r.y+=r.vy*t,r.z+=r.vz*t,n++}for(let r=0;r<this.n;r++){let a=this.p[r],o=a.life/a.max,l=o<.3?o/.3:1;this.pos[r*3]=a.x,this.pos[r*3+1]=a.y,this.pos[r*3+2]=a.z,this.col[r*3]=a.r*l,this.col[r*3+1]=a.g*l,this.col[r*3+2]=a.b*l,this.size[r]=a.s1+(a.s0-a.s1)*o}this.geo.setDrawRange(0,this.n);let s=this.geo.attributes;s.position.needsUpdate=!0,s.color.needsUpdate=!0,s.aSize.needsUpdate=!0,this.mat.uniforms.uScale.value=e}},Lo=class{constructor(t=64){this.max=t;let e=new he;this.pos=new Float32Array(t*3),this.col=new Float32Array(t*3),this.size=new Float32Array(t),e.setAttribute("position",new zt(this.pos,3).setUsage(Ei)),e.setAttribute("color",new zt(this.col,3).setUsage(Ei)),e.setAttribute("aSize",new zt(this.size,1).setUsage(Ei)),e.setAttribute("aPhase",new zt(new Float32Array(t),1)),e.setAttribute("aBlink",new zt(new Float32Array(t),1)),this.geo=e,this.mat=Ai(!0),this.points=new pi(e,this.mat),this.points.frustumCulled=!1,this.points.renderOrder=6,this.buf=[]}set(t,e,n,s,r){let a=Math.min(t.length,this.max-1),o=0,l=t[t.length-1],c=l&&l.hit,h=l&&l.danger;for(let u=0;u<a;u++){let d=t[u],m=1-u/Math.max(1,a);this.pos[o*3]=d.x,this.pos[o*3+1]=d.y,this.pos[o*3+2]=.2;let v=.45,g=.85,p=1;s.latched&&(v=.4,g=1,p=.75),h&&u>a*.4?(v=1,g=.25,p=.2):c==="wall"&&u>a*.6&&(v=1,g=.7,p=.25);let M=(.25+m*.75)*s.alpha;this.col[o*3]=v*M,this.col[o*3+1]=g*M,this.col[o*3+2]=p*M,this.size[o]=s.latched?.2+m*.12:.13+m*.08,o++}if(c&&l){this.pos[o*3]=l.x,this.pos[o*3+1]=l.y,this.pos[o*3+2]=.2;let u=h?[1,.2,.15]:c==="rail"?[.3,1,.7]:[1,.7,.25],d=s.alpha*(h?.7+.3*Math.sin(s.t*18):.8);this.col[o*3]=u[0]*d,this.col[o*3+1]=u[1]*d,this.col[o*3+2]=u[2]*d,this.size[o]=h?.75:.5,o++}this.geo.setDrawRange(0,o);let f=this.geo.attributes;f.position.needsUpdate=!0,f.color.needsUpdate=!0,f.aSize.needsUpdate=!0,this.mat.uniforms.uScale.value=r}};function sf(i,t=!1){let e=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},a={},o=i[0].morphTargetsRelative,l=new he,c=0;for(let h=0;h<i.length;++h){let f=i[h],u=0;if(e!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let d in f.attributes){if(!n.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+d+'" attribute exists among all geometries, or in none of them.'),null;r[d]===void 0&&(r[d]=[]),r[d].push(f.attributes[d]),u++}if(u!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let d in f.morphAttributes){if(!s.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;a[d]===void 0&&(a[d]=[]),a[d].push(f.morphAttributes[d])}if(t){let d;if(e)d=f.index.count;else if(f.attributes.position!==void 0)d=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,d,h),c+=d}}if(e){let h=0,f=[];for(let u=0;u<i.length;++u){let d=i[u].index;for(let m=0;m<d.count;++m)f.push(d.getX(m)+h);h+=i[u].attributes.position.count}l.setIndex(f)}for(let h in r){let f=nf(r[h]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,f)}for(let h in a){let f=a[h][0].length;if(f!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let u=0;u<f;++u){let d=[];for(let v=0;v<a[h].length;++v)d.push(a[h][v][u]);let m=nf(d);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(m)}}}return l}function nf(i){let t,e,n,s=-1,r=0;for(let c=0;c<i.length;++c){let h=i[c];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=h.gpuType),s!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*e}let a=new t(r),o=new zt(a,e,n),l=0;for(let c=0;c<i.length;++c){let h=i[c];if(h.isInterleavedBufferAttribute){let f=l/e;for(let u=0,d=h.count;u<d;u++)for(let m=0;m<e;m++){let v=h.getComponent(u,m);o.setComponent(u+f,m,v)}}else a.set(h.array,l);l+=h.count*e}return s!==void 0&&(o.gpuType=s),o}var rf={hull:{color:[.4,.43,.48],z0:-5,z1:.8},truss:{color:[.36,.38,.42],z0:-2.2,z1:.8},strut:{color:[.47,.47,.49],z0:-1.8,z1:.8},crate:{color:[.55,.45,.32],z0:-1.6,z1:.8},door:{color:[.5,.5,.5],z0:-1.4,z1:.8,kind:1},frame:{color:[.25,.27,.3],z0:-2,z1:.8},rail:{color:[.33,.36,.4],z0:-.8,z1:.8},hub:{color:[.3,.32,.36],z0:-2.5,z1:1},blade:{color:[.55,.55,.55],z0:-.4,z1:.4,kind:1},shuttle:{color:[.78,.8,.83],z0:-1.4,z1:1.2},debris:{color:[.33,.31,.3],z0:-1.2,z1:1},rock:{color:[.3,.27,.25],z0:-1,z1:1},shield:{color:[.34,.31,.29],z0:-1.6,z1:.9}};function Ke(i,t,e=0){i.index&&(i=i.toNonIndexed());let n=i.attributes.position.count,s=new Float32Array(n*3),r=new Float32Array(n);for(let a=0;a<n;a++)s[a*3]=t[0],s[a*3+1]=t[1],s[a*3+2]=t[2],r[a]=e;return i.setAttribute("color",new zt(s,3)),i.setAttribute("aKind",new zt(r,1)),i.attributes.uv||i.setAttribute("uv",new zt(new Float32Array(n*2),2)),i}function Dt(i,t,e,n,s,r,a,o,l=0){let c=new Ee(i,t,n-e);return c.translate(0,0,(e+n)/2),c.rotateZ(a),c.translate(s,r,0),Ke(c,o,l)}var No=[1,.62,.2],Do=[.35,.9,1],Es=[1,.18,.12],Cx=[.9,.95,1];function af(i,t){let e=rf[i.style]||rf.hull,n=[],s=[],r=e.color.map(m=>m*(.9+t()*.18));if(i.type==="circle"){if(i.style==="shuttle"){let m=new $e(i.r,16,12);m.scale(1.25,1,1.2),m.translate(i.lx,i.ly,-.1),n.push(Ke(m,r));let v=new $e(i.r*.75,12,8,0,Math.PI,0,Math.PI/2);return v.rotateX(-Math.PI/2+.6),v.translate(i.lx+.2,i.ly+.35,.5),n.push(Ke(v,[.05,.08,.12])),s.push({x:i.lx+1.3,y:i.ly,z:.4,c:Cx,s:1.6}),{geos:n,lights:s}}if(i.style==="rock"){let m=new Vi(i.r*1.05,1),v=m.attributes.position;for(let g=0;g<v.count;g++){let p=.85+t()*.3;v.setXYZ(g,v.getX(g)*p,v.getY(g)*p,v.getZ(g)*p)}m.computeVertexNormals(),m.translate(i.lx,i.ly,-.2),n.push(Ke(m,r))}else{let m=new Te(i.r,i.r,e.z1-e.z0,24);m.rotateX(Math.PI/2),m.translate(i.lx,i.ly,(e.z0+e.z1)/2),n.push(Ke(m,r));let v=new Te(i.r*.55,i.r*.65,.6,16);v.rotateX(Math.PI/2),v.translate(i.lx,i.ly,e.z1+.3),n.push(Ke(v,[.22,.24,.27]));for(let g=0;g<6;g++){let p=g/6*Math.PI*2;s.push({x:i.lx+Math.cos(p)*i.r*.82,y:i.ly+Math.sin(p)*i.r*.82,z:e.z1+.15,c:g%3?No:Es,s:.45,blink:g%3?0:.8,phase:g/6})}}return{geos:n,lights:s}}let{lx:a,ly:o,w:l,h:c}=i,h=i.lrot||0,f=Math.cos(h),u=Math.sin(h),d=(m,v)=>[a+f*m-u*v,o+u*m+f*v];if(i.style==="truss"&&l>c){let m=Math.min(.55,c*.25);n.push(Dt(l,c*.92,e.z0,-.6,a,o,h,r.map(S=>S*.55)));for(let S of[-1,1]){let[b,T]=d(0,S*(c/2-m/2));n.push(Dt(l,m,-.6,e.z1,b,T,h,r))}let v=Math.max(1.6,c*1.1),g=Math.max(1,Math.floor(l/v)),p=c-m*2,M=Math.hypot(v,p);for(let S=0;S<g;S++){let b=-l/2+(S+.5)*(l/g),[T,w]=d(b,0),R=h+(S%2?1:-1)*Math.atan2(p,l/g);n.push(Dt(Math.min(M,Math.hypot(l/g,p)),m*.45,-.5,e.z1-.15,T,w,R,r.map(x=>x*.9)))}for(let S=-l/2+2;S<l/2-1;S+=6+t()*3)for(let b of[-1,1]){let[T,w]=d(S,b*(c/2-m/2));t()<.55&&s.push({x:T,y:w,z:e.z1+.15,c:No,s:.42,blink:t()<.1?.6:0,phase:t()})}return{geos:n,lights:s}}if(i.style==="blade"){n.push(Dt(l,c,e.z0,e.z1,a,o,h,r,1));let[m,v]=d(0,0);n.push(Dt(l*.96,.08,e.z1,e.z1+.04,m,v,h,[.4,.55,.8],2));let[g,p]=d(l/2-.2,0);return s.push({x:g,y:p,z:e.z1+.2,c:Es,s:.8,blink:1.2}),{geos:n,lights:s}}if(n.push(Dt(l,c,e.z0,e.z1,a,o,h,r,e.kind||0)),i.style==="shield"){let m=l>=c,v=m?l:c,g=m?c:l;for(let p of[-1,1]){let[M,S]=m?d(0,p*(g/2-.09)):d(p*(g/2-.09),0);n.push(Dt(m?v:.18,m?.18:v,e.z0-.1,e.z1+.06,M,S,h,[.92,.84,.66]))}for(let p=-v/2+.9;p<v/2-.5;p+=1.5){let[M,S]=m?d(p,0):d(0,p);n.push(Dt(m?.22:g*.8,m?g*.8:.22,e.z1,e.z1+.12,M,S,h,r.map(b=>b*.7)))}for(let p of[-1,1]){let[M,S]=m?d(p*(v/2-.3),0):d(0,p*(v/2-.3));s.push({x:M,y:S,z:e.z1+.2,c:Es,s:.7,blink:.8,phase:p>0?.5:0})}return{geos:n,lights:s}}if(i.style==="rail"){for(let M of[-1,1]){let[S,b]=d(0,M*(c/2+.02));n.push(Dt(l-1,.1,-.3,e.z1+.05,S,b,h,Do,2))}for(let M=-l/2+1;M<=l/2-1;M+=2.4){let[S,b]=d(M,0);s.push({x:S,y:b,z:e.z1+.15,c:Do,s:.35})}let[m,v]=d(l/2-.3,0),[g,p]=d(-l/2+.3,0);return s.push({x:m,y:v,z:e.z1+.3,c:Es,s:1,blink:1}),s.push({x:g,y:p,z:e.z1+.3,c:Es,s:1,blink:1,phase:.5}),{geos:n,lights:s}}if(i.style==="hull"||i.style==="crate"||i.style==="strut"||i.style==="frame"){let m=l>=c,v=m?l:c;if(v>3){for(let p of[-1,1]){let M=(m?c:l)/2-.12,[S,b]=m?d(0,p*M):d(p*M,0),T=m?v-.3:.07,w=m?.07:v-.3;n.push(Dt(T,w,e.z1,e.z1+.03,S,b,h,i.style==="hull"?[.6,.66,.75]:[.5,.5,.5],2))}let g=i.style==="hull"?5+t()*3:3.5;for(let p=-v/2+1.2;p<v/2-.8;p+=g){let M=t()<.5?-1:1,S=(m?c:l)/2-.3,[b,T]=m?d(p,M*S):d(M*S,p);t()<.5&&s.push({x:b,y:T,z:e.z1+.12,c:t()<.82?No:Do,s:.38,blink:t()<.08?.7:0,phase:t()})}}if(i.style!=="hull"&&v<12){let[g,p]=d(l/2-.25,c/2-.25);s.push({x:g,y:p,z:e.z1+.15,c:Es,s:.6,blink:.9,phase:t()})}if(i.style==="hull"&&l>6&&c>6)for(let g=0;g<Math.min(6,l*c/40);g++){let p=(t()-.5)*(l-2),M=(t()-.5)*(c-2),[S,b]=d(p,M);n.push(Dt(1+t()*3,.6+t()*1.6,e.z1,e.z1+.18,S,b,h,r.map(T=>T*.8)))}}if(i.style==="shuttle"){let[m,v]=d(0,.25);n.push(Dt(l*.92,.16,e.z1,e.z1+.04,m,v,h,[1,.55,.15],2));let[g,p]=d(-l/2+.9,c/2+.5);n.push(Dt(1.2,1,-.15,.15,g,p,h-.35,[.7,.72,.75]));for(let M of[-.55,.55]){let S=new Te(.42,.62,1.1,12,1,!0);S.rotateZ(Math.PI/2);let[b,T]=d(-l/2-.45,-.1);S.translate(b,T,M),n.push(Ke(S,[.25,.26,.28])),s.push({x:b-.5,y:T,z:M,c:Do,s:2.2})}for(let M=-l/2+.8;M<l/2;M+=1.6){let[S,b]=d(M,-c/2+.25);s.push({x:S,y:b,z:e.z1+.05,c:No,s:.35,blink:1.6,phase:M*.1})}}return{geos:n,lights:s}}function We(i){return i.length?sf(i,!1):null}var Ri=[1,.62,.2],Ix=[.4,.85,1],Ci=[1,.2,.12],Px=[.85,.9,1];function Uo(i,t,e,n,s,r,a,o=20,l=0){let c=new Te(i,i,t,o,1,!1);return r==="x"&&c.rotateZ(Math.PI/2),r==="z"&&c.rotateX(Math.PI/2),c.translate(e,n,s),Ke(c,a,l)}function of(i,t,e,n,s,r,a,o,l={}){let c=[.42,.45,.5],h=[.22,.24,.28];for(let f=n;f<s;f+=24){i.push(Uo(o,24,f+12,r,a,"x",c)),i.push(Uo(o*1.12,1.4,f,r,a,"x",h));for(let u=2;u<22;u+=1.6)e()<.45&&t.push({x:f+u,y:r+o*.35,z:a+o*.94,c:e()<.85?Ri:Ix,s:.5,blink:-.5,phase:e()})}i.push(Dt(s-n,.8,a-.4,a+.4,(n+s)/2,r+o+2.2,0,h));for(let f=n;f<s;f+=5)i.push(Dt(.35,2.6,a-.2,a+.2,f,r+o+1.1,.5,h));for(let f=n+e()*30;f<s;f+=(l.spacing||46)+e()*30){let u=e();if(u<.4){let d=16+e()*22,m=e()<.7?1:-1;i.push(Dt(1.6,d,a-.8,a+.8,f,r+m*(o+d/2),0,h));let v=7+e()*6,g=3.5+e()*2;for(let p of[-1,1])for(let M=0;M<3;M++)i.push(Dt(v,g,a-.08,a+.08,f+p*(1.5+v/2),r+m*(o+d*(.35+M*.22)),0,[.08,.14,.3],3));t.push({x:f,y:r+m*(o+d+.6),z:a,c:Ci,s:1.1,blink:.45,phase:e()})}else if(u<.7){let d=o*(.5+e()*.3),m=10+e()*10,v=e()<.5?1:-1;i.push(Dt(1.2,4,a-.6,a+.6,f,r+v*(o+2),0,h)),i.push(Uo(d,m,f,r+v*(o+4+d),a,"x",c));for(let g=-m/2+1;g<m/2;g+=1.4)e()<.5&&t.push({x:f+g,y:r+v*(o+4+d),z:a+d+.1,c:Ri,s:.45})}else{let d=24+e()*30;i.push(Dt(.9,d,a-.45,a+.45,f,r+o+d/2,0,h)),i.push(Dt(.25,9,a-.12,a+.12,f+1.2,r+o+d-2,0,h)),t.push({x:f,y:r+o+d+.3,z:a,c:Ci,s:1.2,blink:.6,phase:e()}),t.push({x:f+1.2,y:r+o+d+2.6,z:a,c:Px,s:.7,blink:.3,phase:e()})}}}function lf(i,t,e){let n=Xn(e),s=t.bounds,r=[],a=[],o=[],l=[],c=[],h=s.x0-120,f=s.x1+160,u=(s.y0+s.y1)/2;for(let m of t.bodies)if(!m.motion)for(let v of m.shapes)v.type!=="box"||v.w*v.h<30||v.style!=="hull"||Math.min(v.w,v.h)<5||(o.push(Dt(v.w+1.5,v.h+1.5,-18,-5,v.lx,v.ly,0,[.17,.19,.23])),v.w>8&&o.push(Uo(Math.min(v.h,8)*.35,v.w*.8,v.lx,v.ly,-21,"x",[.2,.22,.26])));let d=i.look;of(r,l,n,h,f,u+(d.spineY??13),-62,4.2),of(a,c,n,h*1.5,f*1.5,u-30,-125,7,{spacing:70});for(let m=h*2;m<f*2;m+=30+n()*40){let v=20+n()*70;a.push(Dt(6+n()*10,v,-235,-225,m,u-50+v/2,0,[.3,.33,.4])),n()<.5&&c.push({x:m,y:u-50+v+1,z:-224,c:Ci,s:2.4,blink:.4,phase:n()})}if((d.landmark??(d.final?"ring":"none"))==="ring"){let m=d.ringX??s.x1-20,v=new un(46,3.4,10,72);v.translate(m,u+2,-95),r.push(Ke(v,[.45,.48,.55]));for(let g=0;g<60;g++){let p=g/60*Math.PI*2;l.push({x:m+Math.cos(p)*46,y:u+2+Math.sin(p)*46,z:-91.5,c:g%5===0?Ci:Ri,s:1.4,blink:g%5===0?.5:0,phase:g/9})}}return{back:We(o),mid:We(r),far:We(a),lights:l,farLights:c}}function cf(i,t,e=1){let n=Xn(t+99),s=i.bounds,r={geos:[],lights:[]},a={geos:[],lights:[]},o=[.035,.045,.06];for(let l=s.x0-30;e>0&&l<s.x1+40;l+=(18+n()*26)/e){let c=9+n()*3,h=n();if(h<.5){let f=6+n()*12,u=3+n()*3,d=-5.4-n()*.8;a.geos.push(Dt(f,u,c-1,c+1,l,d-u/2,0,o)),a.geos.push(Dt(f*.9,.18,c-.3,c+.3,l,d+.7,0,o));for(let m=-f/2;m<f/2;m+=1.6)a.geos.push(Dt(.12,.7,c-.1,c+.1,l+m,d+.35,0,o));for(let m=0;m<2;m++)a.lights.push({x:l+(n()-.5)*f,y:d-.3,z:c+1.05,c:Ri,s:.4,phase:n()})}else if(h<.78){let f=10+n()*16;r.geos.push(Dt(f,1.4+n(),c-1,c+1,l,6.3+n()*.8,(n()-.5)*.2,o)),n()<.6&&r.lights.push({x:l,y:5.6,z:c+1.05,c:Ci,s:.45,blink:.6,phase:n()})}else{let f=1.4+n()*2;a.geos.push(Dt(f,40,c-1,c+1,l,6,(n()-.5)*.25,o)),a.lights.push({x:l+f/2+.05,y:(n()-.5)*6,z:c+1.05,c:Ri,s:.4})}}return{top:{geo:We(r.geos),lights:r.lights},bot:{geo:We(a.geos),lights:a.lights}}}function hf(){return new re({transparent:!0,uniforms:{uPlayer:{value:new It(.5,.5)},uGoal:{value:new It(-9,-9)},uAspect:{value:1.77}},vertexShader:`
      attribute vec3 color; varying vec3 vN; varying vec4 vClip; varying vec3 vColor;
      void main(){ vN = normalize(mat3(modelMatrix) * normal); vColor = color;
        vec4 c = projectionMatrix * modelViewMatrix * vec4(position,1.0); vClip = c; gl_Position = c; }`,fragmentShader:`
      uniform vec2 uPlayer; uniform vec2 uGoal; uniform float uAspect; varying vec3 vN; varying vec4 vClip; varying vec3 vColor;
      void main(){
        vec2 s = vClip.xy / vClip.w * 0.5 + 0.5;
        vec2 d = (s - uPlayer) * vec2(uAspect, 1.0);
        vec2 dg = (s - uGoal) * vec2(uAspect, 1.0);
        float fade = smoothstep(0.07, 0.2, length(d)) * smoothstep(0.06, 0.16, length(dg));
        vec3 col = vColor + vec3(0.9, 0.4, 0.15) * max(vN.x, 0.0) * 0.06 + vec3(0.2, 0.4, 0.8) * max(vN.y, 0.0) * 0.08;
        gl_FragColor = vec4(col, 0.15 + 0.85 * fade);
      }`})}function uf(i,t,e){let n=Xn(e),s=t.bounds,r=[],a=[],o=[],l=[],c=[],h=(s.x0+s.x1)/2,f=s.y1-s.y0,u=[.24,.23,.23],d=[.13,.13,.15];for(let p of t.bodies)if(!p.motion)for(let M of p.shapes)M.type!=="box"||M.w*M.h<30||M.style!=="hull"||Math.min(M.w,M.h)<3||o.push(Dt(M.w+1.5,M.h+1.5,-14,-5,M.lx,M.ly,0,[.15,.15,.17]));let m=(p,M,S)=>{let b=s.y0-60,T=s.y1+80;for(let w of[-1,1])r.push(Dt(.7,T-b,M-.35,M+.35,p+w*S/2,(b+T)/2,0,u));for(let w=b;w<T;w+=S*1.2)r.push(Dt(S,.45,M-.25,M+.25,p,w,0,d)),r.push(Dt(Math.hypot(S,S*1.2),.25,M-.15,M+.15,p,w+S*.6,Math.atan2(S*1.2,S)*(n()<.5?1:-1),d));for(let w=s.y0+n()*14;w<s.y1+40;w+=16+n()*18){let R=8+n()*10,x=n()<.5?-1:1;for(let y=0;y<3;y++)r.push(Dt(R/3-.3,3.2,M-.06,M+.06,p+x*(S/2+.4+(y+.5)*R/3),w,0,[.2,.15,.08],3));r.push(Dt(R+.6,.3,M-.2,M+.2,p+x*(S/2+R/2),w+1.8,0,d)),l.push({x:p+x*(S/2+R),y:w,z:M+1.3,c:Ci,s:1,blink:.5,phase:n()})}for(let w=s.y0;w<s.y1+40;w+=9)n()<.5&&l.push({x:p+(n()<.5?-S/2:S/2),y:w,z:M+.5,c:Ri,s:.5,phase:n()})},v=s.x1-s.x0;m(s.x0-14,-70,5),m(s.x1+18,-80,5.5);for(let p=0;p<5;p++){let M=h+(n()-.5)*v*9,S=s.y0+n()*(f+120),b=-330-n()*80,T=18+n()*26,w=new Te(T,T,2.2,28,1,!1);w.translate(M,S,b),a.push(Ke(w,[.33,.3,.28])),c.push({x:M+T,y:S,z:b+2,c:Ci,s:2.6,blink:.35,phase:n()}),c.push({x:M-T,y:S,z:b+2,c:Ri,s:2,phase:n()})}let g=new un(150,3.4,8,90,Math.PI*.9);g.rotateZ(Math.PI*.05),g.translate(h,s.y1+25,-210),a.push(Ke(g,[.4,.36,.32]));for(let p=0;p<40;p++){let M=Math.PI*.05+p/40*Math.PI*.9;c.push({x:h+Math.cos(M)*150,y:s.y1+25+Math.sin(M)*150,z:-206,c:p%4===0?Ci:Ri,s:2.2,blink:p%4===0?.5:0,phase:p/7})}return{back:We(o),mid:We(r),far:We(a),lights:l,farLights:c}}var ff={station:{id:"station",background:"anomaly",decor:"spine"},helios:{id:"helios",background:"star",decor:"foundry",exposure:1.05,lights:{key:[.16,.24,.42],warm:[0,0,0],cool:[.12,.3,.75],ambient:[.025,.04,.08]},sun:[2.2,1.45,.82],cells:[.32,.2,.05],fog:{back:[.05,.06,.1],mid:[.22,.16,.14],far:[.36,.24,.17]},haze:[1,.56,.22],shade:[0,.025,.08],motes:[[.75,.5,.25],[.25,.35,.6]],hero:{sun:16767392,fill:3829247},fgDensity:0,debris:0,fail:{flare:["THERMAL LIMIT EXCEEDED",["Sunscreen: insufficient.","The shade was right there. It was moving, but it was there.","Suit rated to 1,400 K. The flare was not.","Exposure logged. Briefly."]],void:["BLOWN DOWNSUN",["Photons have no mass. They won anyway.","Solar pressure: 1. You: 0.","You were pushed. Gently. For a long time."]],impact:["SUIT BREACH",["The sun pushed. The deck pushed back.","Shadow: departed. Floor: arrived.","Momentum, now with sunlight."]]}}},Fo=i=>ff[i&&i.theme||"station"]||ff.station;var mf=38,Oo=Math.tan(mf/2*Math.PI/180),Lx=`
  uniform vec3 uColor; uniform float uTime; uniform float uAlpha; varying vec2 vUv;
  void main(){
    vec2 p = vUv - 0.5; float r = length(p) * 2.0;
    float ring = smoothstep(0.78, 0.86, r) * smoothstep(1.0, 0.9, r);
    float ang = atan(p.y, p.x);
    float dash = step(0.35, fract(ang * 3.0 / 3.14159 + uTime * 0.25));
    float inner = smoothstep(0.62, 0.66, r) * smoothstep(0.7, 0.66, r) * 0.5;
    float a = (ring * (0.5 + 0.5 * dash) + inner) * uAlpha;
    gl_FragColor = vec4(uColor * a, a);
  }`,Nx=`
  uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
  void main(){
    vec2 p = (vUv - 0.5) * 2.0; float r = length(p);
    float ang = atan(p.y, p.x);
    float spiral = sin(ang * 3.0 + 6.0 / (r + 0.15) - uTime * 2.0) * 0.5 + 0.5;
    float a = pow(spiral, 3.0) * smoothstep(1.0, 0.25, r) * 0.55 + exp(-r * r * 30.0) * 1.5 + exp(-r * r * 6.0) * 0.4;
    a *= smoothstep(1.0, 0.85, r);
    gl_FragColor = vec4(uColor * a, a);
  }`,Dx="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }";function df(i,t){return new re({vertexShader:Dx,fragmentShader:i,uniforms:t,transparent:!0,depthWrite:!1,blending:Hn})}var Bo=class{constructor(t){let e=matchMedia("(pointer: coarse)").matches;this.renderer=new To({canvas:t,antialias:!e,powerPreference:"high-performance"}),this.renderer.outputColorSpace=Ne,this.renderer.toneMapping=nr,this.renderer.toneMappingExposure=1.15,this.maxDpr=e?1.5:2,this.dpr=Math.min(window.devicePixelRatio||1,this.maxDpr),this.scene=new zi,this.camera=new De(mf,16/9,.5,900),this.bg=new Io(this.renderer),this.scene.background=this.bg.rt.texture,this.tex=tf(),this.sunU=ju(),Object.assign(this.sunU,{uSunOn:{value:0},uSun3:{value:new U(0,-1,-.5).normalize()},uSunC:{value:new mt(0,0,0)},uCellC:{value:new mt(.05,.1,.24)}});let n=this.sunU;this.matPlay=mr(this.tex,{fog:.004,rim:1.2,bright:1.15,window:1.3,sun:n,casters:!0}),this.matBack=mr(this.tex,{fog:.02,rim:.4,bright:.45,window:.9,texScale:.07,sun:n,casters:!0}),this.matMid=mr(this.tex,{fog:.0105,rim:.8,bright:.75,window:1.6,texScale:.06,sun:n}),this.matFar=mr(this.tex,{fog:.0062,rim:.6,bright:.55,window:2,texScale:.03,sun:n}),this.matBack.uniforms.uFog.value=new mt(.05,.07,.12),this.matMid.uniforms.uFog.value=new mt(.13,.16,.25),this.matFar.uniforms.uFog.value=new mt(.15,.18,.29),this.sunLayer=new Co(n),this.sunLayer.mesh.visible=!1,this.scene.add(this.sunLayer.mesh),this.matFg=hf(),this.lightMat=Ai(),this.farLightMat=Ai();let s=new vi(12571903,2.2);s.position.copy(mn.key).multiplyScalar(10);let r=new vi(16742970,2.4);r.position.copy(mn.warm).multiplyScalar(10);let a=new vi(4886783,1.4);a.position.copy(mn.cool).multiplyScalar(10);let o=new js(1845828,526348,1.2);this.scene.add(s,r,a,o),this.sunLight=new vi(16767392,0),this.scene.add(this.sunLight),this.heroLights={key:s,warm:r,cool:a,hemi:o,defaults:[s,r,a,o].map(c=>[c.color.clone(),c.intensity])},this.matDefaults=[this.matPlay,this.matBack,this.matMid,this.matFar].map(c=>({m:c,key:c.uniforms.uKeyC.value,warm:c.uniforms.uWarmC.value,cool:c.uniforms.uCoolC.value,amb:c.uniforms.uAmb.value,fog:c.uniforms.uFog.value})),this.thrustLight=new tr(6737151,0,9,1.6),this.scene.add(this.thrustLight),this.particles=new Po(1600),this.scene.add(this.particles.points),this.drift=new Lo(70),this.scene.add(this.drift.points),this.hero=new gr,this.scene.add(this.hero.root),this.brakeMat=Tc(11462911);let l=new Hi(.07,.7,8,1,!0);l.rotateX(Math.PI),l.translate(0,-.35,0),this.brakeFlames=[new Ht(l,this.brakeMat),new Ht(l,this.brakeMat)];for(let c of this.brakeFlames)c.frustumCulled=!1,this.scene.add(c);this.stageGroup=null,this.cam={x:0,y:0,vx:0,vy:0,h:10,hv:0},this.shake=0,this.time=0,this.resize()}resize(){let t=window.innerWidth,e=window.innerHeight;this.renderer.setPixelRatio(this.dpr),this.renderer.setSize(t,e,!1),this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.bg.resize(t,e,this.dpr),this.pxScale=e*this.dpr/(2*Oo),this.matFg.uniforms.uAspect.value=t/e}setQuality(t){this.dpr=Math.min(window.devicePixelRatio||1,[1,1.25,this.maxDpr][t]),this.bg.scale=[.35,.45,.5][t],this.resize()}clearStage(){this.stageGroup&&(this.scene.remove(this.stageGroup),this.stageGroup.traverse(t=>{t.geometry&&!t.userData.shared&&t.geometry.dispose()}),this.stageGroup=null,this.ren&&(this.scene.remove(this.ren.root),this.ren.root.traverse(t=>{t.geometry&&t.geometry.dispose()}),this.ren=null))}loadStage(t,e){this.clearStage();let n=new ye;this.stageGroup=n,this.scene.add(n),this.def=t;let s=Fo(t);this.theme=s,this.bg.setTheme(s,t.look,e.sun),this.applyTheme(s,e);let r=Xn(t.num*977),a=e.stage,o=y=>e.sun&&y.shade?e.sun.casters.indexOf(y)+1:0,l=[],c=[];this.movers=[];for(let y of e.bodies){let A=[];for(let I of y.shapes){let P=af(I,r);if(e.sun)for(let F of P.geos)Rc(F,o(I));A.push(...P.geos),y.motion?c.push(...P.lights.map(F=>({...F,body:y}))):c.push(...P.lights)}if(y.motion){let I=new ye,P=new Ht(We(A),this.matPlay);P.frustumCulled=!1,I.add(P);let F=c.filter(L=>L.body===y);F.length&&I.add(wn(F,this.lightMat)),n.add(I);let k={body:y,group:I};if(y.status){let L=y.shapes[0];k.status=wn([{x:0,y:L.h/2-.6,z:1.2,c:[1,0,0],s:1.4},{x:0,y:-L.h/2+.6,z:1.2,c:[1,0,0],s:1.4},{x:0,y:0,z:1.2,c:[1,0,0],s:1.1}],Ai()),I.add(k.status)}this.movers.push(k)}else l.push(...A)}let h=c.filter(y=>!y.body);this.goalVis=[];for(let y of e.goals){if(y.type==="rescue"){this.goalVis.push(null);continue}let A={goal:y,group:new ye},I=df(Lx,{uColor:{value:new mt(.4,.95,1)},uTime:{value:0},uAlpha:{value:1}}),P=y.shape==="box"?Math.max(y.w,y.h)*.9+1.2:y.r*2+.6,F=new Ht(new hn(P,P),I);F.position.z=.5,A.ring=F,A.ringMat=I,A.group.add(F);let k=[];if(y.type==="dock"){let L=y.mouth,z=[];if(L.dir==="left"){for(let H of[-1,1])z.push(Dt(.5,.5,-1,1,L.x+.25,L.y+H*2.05,0,[.6,.6,.6],1));z.push(Dt(.2,3.4,-6,0,L.x+3.5,L.y,0,[.25,.85,.55],2));for(let H=0;H<4;H++)for(let $ of[-1,1])k.push({x:L.x+.5+H*.9,y:L.y+$*1.75,z:.9,c:[.3,1,.55],s:.45,blink:1.2,phase:H*.15})}else{for(let H of[-1,1])z.push(Dt(.5,.5,-1,1,L.x+H*2.05,L.y-.25,0,[.6,.6,.6],1));z.push(Dt(3.4,.2,-6,0,L.x,L.y-3.5,0,[.25,.85,.55],2));for(let H=0;H<4;H++)for(let $ of[-1,1])k.push({x:L.x+$*1.75,y:L.y-.5-H*.9,z:.9,c:[.3,1,.55],s:.45,blink:1.2,phase:H*.15})}l.push(...z)}else{let L=[],z=y.dockAngle??0,H=Math.cos(z),$=Math.sin(z),Q=y.x+H*(y.r*.95),nt=y.y+$*(y.r*.95);if(y.label==="HANDHOLD"){L.push(Dt(.25,1.6,-.6,.6,Q,nt,z,[.7,.7,.7],1));let st=new un(.45,.07,6,16,Math.PI);st.rotateZ(z+Math.PI/2),st.translate(Q-H*.15,nt-$*.15,.2),L.push(Ke(st,[1,.6,.2],2))}else L.push(Dt(.3,2.2,-.6,.7,Q,nt,z,[.3,.32,.36])),L.push(Dt(.08,1.8,.7,.75,Q-H*.16,nt-$*.16,z,[.4,.95,1],2));if(y.body){let st=this.movers.find(Wt=>Wt.body.tag===y.body);if(e.sun)for(let Wt of L)Rc(Wt,0);let xt=new Ht(We(L),this.matPlay);xt.frustumCulled=!1,st.group.add(xt),A.onBody=st}else l.push(...L);k.push({x:Q,y:nt,z:.9,c:[1,.65,.2],s:.7,blink:1})}k.length&&n.add(wn(k,this.lightMat)),n.add(A.group),this.goalVis.push(A)}if(e.sun)for(let y of l)y.attributes.aCaster||Rc(y,0);let f=new Ht(We(l),this.matPlay);f.frustumCulled=!1,n.add(f),h.length&&n.add(wn(h,this.lightMat)),this.wellVis=(e.wells||[]).map(y=>{let A=df(Nx,{uTime:{value:0},uColor:{value:new mt(.75,.55,1)}}),I=y.range*1.3,P=new Ht(new hn(I,I),A);P.position.set(y.x,y.y,-.5),n.add(P);let F=new Ht(new $e(y.core*.8,20,14),new cn({color:327688}));F.position.set(y.x,y.y,0),n.add(F);let k=new un(y.core*1.15,.07,8,48),L=new Ht(k,new cn({color:15255807,transparent:!0,blending:Hn}));L.position.set(y.x,y.y,.1),n.add(L);let z=[];for(let $=0;$<4;$++){let Q=$*Math.PI/2+Math.PI/4;z.push(Dt(.6,.6,-4,-2.5,y.x+Math.cos(Q)*y.core*2.6,y.y+Math.sin(Q)*y.core*2.6,Q,[.3,.3,.35]))}let H=new Ht(We(z),this.matPlay);return n.add(H),{w:y,mat:A,ring:L}}),this.ventVis=(e.vents||[]).map(y=>{let A=[Dt(y.width+1,1.2,-2,.9,y.x+Math.cos(y.dir)*.6,y.y+Math.sin(y.dir)*.6,y.dir+Math.PI/2,[.35,.36,.38],1)],I=new Ht(We(A),this.matPlay);n.add(I);let P=-Math.sin(y.dir),F=Math.cos(y.dir),k=wn([{x:y.x+P*(y.width/2+.6)+Math.cos(y.dir)*1.3,y:y.y+F*(y.width/2+.6)+Math.sin(y.dir)*1.3,z:1,c:[1,.15,.1],s:1.2},{x:y.x-P*(y.width/2+.6)+Math.cos(y.dir)*1.3,y:y.y-F*(y.width/2+.6)+Math.sin(y.dir)*1.3,z:1,c:[1,.15,.1],s:1.2}],Ai());return n.add(k),{v:y,lp:k}}),this.pickVis=e.pickups.map(y=>{let A=new ye,I=new Ht(new Te(.28,.28,.8,12),new kn({color:14212580,roughness:.4})),P=new Ht(new Te(.3,.3,.22,12),new cn({color:5628159}));return A.add(I,P),A.add(wn([{x:0,y:0,z:.3,c:[.3,.85,1],s:2.4,blink:-3}],this.lightMat)),A.position.set(y.x,y.y,0),n.add(A),{p:y,g:A}}),e.npc&&(this.ren=new gr({accent:3134648,light:16728128,beacon:16722474,suit:13620958,visorGlow:4198416}),this.scene.add(this.ren.root));let u=s.decor==="foundry"?uf(t,a,t.num*131):lf(t,a,t.num*131),d=(y,A)=>{if(!y)return;let I=new Ht(y,A);I.frustumCulled=!1,n.add(I)};d(u.back,this.matBack),d(u.mid,this.matMid),d(u.far,this.matFar),n.add(wn(u.lights,this.lightMat)),n.add(wn(u.farLights,this.farLightMat));let m=cf(a,t.num*17,t.look.fgDensity??s.fgDensity??1);this.fgTop=new ye,this.fgBot=new ye;for(let[y,A]of[[this.fgTop,m.top],[this.fgBot,m.bot]]){if(!A.geo)continue;let I=new Ht(A.geo,this.matFg);if(I.frustumCulled=!1,I.renderOrder=10,y.add(I),A.lights.length){let P=wn(A.lights,this.lightMat);P.renderOrder=11,y.add(P)}n.add(y)}let v=[],g=a.bounds,p=Math.min(900,Math.floor((g.x1-g.x0)*(g.y1-g.y0)*.06));for(let y=0;y<p;y++){let A=r()<.25;v.push({x:g.x0+r()*(g.x1-g.x0),y:g.y0+r()*(g.y1-g.y0),z:-2.5+r()*5,c:s.motes?s.motes[A?0:1]:A?[.5,.35,.25]:[.3,.38,.5],s:.05+r()*.07,blink:-(.5+r()),phase:r()})}n.add(wn(v,this.lightMat));let M=new Vi(1,0),S=Math.round(70*(t.look.debris??s.debris??1)),b=new Ys(M,this.matFar,S),T=new Qt,w=new ln,R=new bn;this.rocks=[];for(let y=0;y<S;y++){let A={x:a.bounds.x0+r()*(a.bounds.x1-a.bounds.x0+300)-80,y:(r()-.3)*160,z:-160-r()*160,s:.8+r()*3,rx:r()*6,ry:r()*6,w:(r()-.5)*.3};this.rocks.push(A)}b.instanceColor=new di(new Float32Array(S*3).fill(.32),3),this.rockInst=b,b.frustumCulled=!1,n.add(b),this._m4=T,this._q=w,this._e=R,this.sunLayer.mesh.visible=!!e.sun,e.sun&&this.sunLayer.fit(a.bounds,s.haze?{haze:s.haze,shade:s.shade}:null);let x=e.player;this.cam.x=x.x+4,this.cam.y=x.y,this.cam.vx=this.cam.vy=0,this.cam.h=10,this.hero.visAngle=x.angle,this.hero.flail=0,this.particles.clear(),this.shake=0,this.ventEmit=0,this.streak=0}applyTheme(t,e){let n=this.sunU,s=t.lights;for(let o of this.matDefaults){let l=o.m.uniforms;l.uKeyC.value=s?new mt(...s.key):o.key,l.uWarmC.value=s?new mt(...s.warm):o.warm,l.uCoolC.value=s?new mt(...s.cool):o.cool,l.uAmb.value=s?new mt(...s.ambient):o.amb,l.uFog.value=o.fog}t.fog&&(this.matBack.uniforms.uFog.value=new mt(...t.fog.back),this.matMid.uniforms.uFog.value=new mt(...t.fog.mid),this.matFar.uniforms.uFog.value=new mt(...t.fog.far));let r=e.sun;n.uSunOn.value=r&&t.sun?1:0,r&&n.uSun3.value.set(r.dx,r.dy,-.55).normalize(),n.uSunC.value.setRGB(...t.sun||[0,0,0]),n.uCellC.value.setRGB(...t.cells||[.05,.1,.24]),this.renderer.toneMappingExposure=t.exposure??1.15;let a=this.heroLights;[a.key,a.warm,a.cool,a.hemi].forEach((o,l)=>{o.color.copy(a.defaults[l][0]),o.intensity=a.defaults[l][1]}),this.sunLight.intensity=0,t.hero&&(a.key.intensity=.5,a.warm.intensity=0,a.cool.color.setHex(t.hero.fill),a.cool.intensity=1.6,a.hemi.intensity=.5,this.sunLight.color.setHex(t.hero.sun),r&&this.sunLight.position.set(-r.dx*10,-r.dy*10,5.5))}snapCamera(t,e){for(let n=0;n<240;n++)this.updateCamera(t,1/60,e||{showDrift:!0});this.cam.vx=this.cam.vy=0,this.shake=0}rebind(t){let e=t.bodies.filter(s=>s.motion);this.movers.forEach((s,r)=>{s.body=e[r]}),this.goalVis.forEach((s,r)=>{s&&(s.goal=t.goals[r])}),this.wellVis.forEach((s,r)=>{s.w=t.wells[r]}),this.ventVis.forEach((s,r)=>{s.v=t.vents[r]}),this.pickVis.forEach((s,r)=>{s.p=t.pickups[r]});let n=t.player;this.cam.x=n.x+4,this.cam.y=n.y,this.cam.vx=this.cam.vy=0,this.cam.h=10,this.hero.visAngle=n.angle,this.hero.visVel=0,this.hero.flail=0;for(let s in this.hero.j)this.hero.j[s].v=0;this.particles.clear(),this.shake=0}addShake(t){this.shake=Math.min(1.2,this.shake+t)}onEvent(t,e){let n=this.particles,s=e.player;if(t.type==="crash"||t.type==="bump"||t.type==="scrape"){let r=t.type==="crash"?1:t.type==="bump"?Math.min(1,t.strength/3):.25,a=Math.floor(6+r*40);for(let o=0;o<a;o++){let l=Math.atan2(t.ny,t.nx)+(Math.random()-.5)*2.6,c=2+Math.random()*(4+r*10);n.spawn(t.x,t.y,.3,Math.cos(l)*c,Math.sin(l)*c,(Math.random()-.5)*3,.25+Math.random()*.5,.22,.04,1,.65+Math.random()*.3,.3,2.5)}if(t.type==="crash"){for(let o=0;o<26;o++){let l=Math.random()*Math.PI*2,c=Math.random()*3;n.spawn(s.x,s.y,.2,Math.cos(l)*c,Math.sin(l)*c,0,1.2+Math.random(),.15,.9,.85,.92,1,1.2)}this.addShake(.9),this.hero.kick(3)}else t.type==="bump"&&(this.addShake(Math.min(.45,t.strength*.12)),this.hero.kick(t.strength*.8))}else if(t.type==="latch"||t.type==="clunk"){for(let r=0;r<18;r++){let a=Math.random()*Math.PI*2,o=1+Math.random()*3;n.spawn(s.x,s.y,.3,Math.cos(a)*o,Math.sin(a)*o,0,.35,.3,.05,.4,1,.8,3)}this.addShake(t.type==="clunk"?.25:.15),this.hero.kick(1)}else if(t.type==="release")this.addShake(.12);else if(t.type==="slip"||t.type==="shove"){for(let r=0;r<14;r++){let a=Math.random()*Math.PI*2,o=1+Math.random()*2;n.spawn(t.x,t.y,.4,Math.cos(a)*o,Math.sin(a)*o,0,.4,.3,.05,1,.5,.2,2)}this.hero.kick(1.6),this.addShake(.2)}else if(t.type==="capture"||t.type==="rescue"){for(let r=0;r<40;r++){let a=Math.random()*Math.PI*2,o=2+Math.random()*4;n.spawn(t.x,t.y,.4,Math.cos(a)*o,Math.sin(a)*o,0,.6+Math.random()*.4,.3,.05,.35,1,.6,2.2)}this.addShake(.12)}else if(t.type==="pickup")for(let r=0;r<30;r++){let a=Math.random()*Math.PI*2,o=1+Math.random()*4;n.spawn(t.x,t.y,.3,Math.cos(a)*o,Math.sin(a)*o,0,.6,.35,.05,.35,.9,1,2)}else if(t.type==="fail"&&t.cause==="arc")this.addShake(.6),this.hero.kick(4);else if(t.type==="fail"&&t.cause==="well")this.addShake(.5);else if(t.type==="fail"&&t.cause==="flare"){for(let r=0;r<60;r++){let a=Math.random()*Math.PI*2,o=1+Math.random()*6;n.spawn(s.x,s.y,.3,Math.cos(a)*o+(e.sun?e.sun.dx*6:0),Math.sin(a)*o+(e.sun?e.sun.dy*6:0),0,.6+Math.random()*.8,.35,.05,1,.75,.35,1.5)}this.addShake(.7),this.hero.kick(4)}else t.type==="flare"&&this.addShake(.35)}frame(t,e,n){this.time+=e;let s=this.time,r=t.player,a=this.particles,o=Math.hypot(r.vx,r.vy),l=t.state==="lost",c=t.state==="won";for(let x of this.movers)if(x.group.position.set(x.body.x,x.body.y,0),x.group.rotation.z=x.body.rot,x.status){let y=x.body.status(t.t),A=Math.sin(s*22)>0?1:.1,I=y===1?[.2,1,.45]:y===2?[1*A,.55*A,.05]:[1,.12,.08],P=x.status.geometry.attributes.color;for(let F=0;F<3;F++)P.setXYZ(F,I[0],I[1],I[2]);P.needsUpdate=!0,x.status.material.uniforms.uScale.value=this.pxScale}let h=0;if(l&&t.cause.kind==="well"){let x=t.cause.well;h=Math.min(1,(t.t-t.endT)*.8),r.x+=(x.x-r.x)*Math.min(1,e*1.6),r.y+=(x.y-r.y)*Math.min(1,e*1.6),r.angle=Math.atan2(x.y-r.y,x.x-r.x)}this.hero.update(e,{x:r.x,y:r.y,angle:r.angle,thrusting:r.thrusting,braking:r.braking,turning:r.turning,tumble:r.tumble,latched:!!r.latch,dead:l,docked:c,stretch:h}),h>0?this.hero.root.scale.multiplyScalar(Math.max(.02,1-Math.max(0,h-.5)*1.9)):this.hero.root.scale.setScalar(1.3);let f=r.angle,u=-Math.cos(f),d=-Math.sin(f);if(r.thrusting){this.thrustLight.intensity=5;for(let x=0;x<3;x++){let y=6+Math.random()*4,A=(Math.random()-.5)*.35,I=u*Math.cos(A)-d*Math.sin(A),P=u*Math.sin(A)+d*Math.cos(A);a.spawn(r.x+u*.9,r.y+d*.9,(Math.random()-.5)*.3,r.vx+I*y,r.vy+P*y,0,.25+Math.random()*.15,.32,.9,.3,.7,1,2)}}else this.thrustLight.intensity*=.8;this.thrustLight.position.set(r.x+u*1.2,r.y+d*1.2,1.5);let m=r.braking&&o>.05;if(this.brakeMat.uniforms.uPower.value+=((m?1:0)-this.brakeMat.uniforms.uPower.value)*Math.min(1,e*20),this.brakeMat.uniforms.uTime.value=s,o>.05){let x=r.vx/o,y=r.vy/o,A=Math.cos(f),I=Math.sin(f),P=-I,F=A;if([-1,1].forEach((k,L)=>{let z=this.brakeFlames[L];z.position.set(r.x+A*.45+P*k*.28,r.y+I*.45+F*k*.28,.25*k),z.rotation.set(0,0,Math.atan2(y,x)+Math.PI/2),z.scale.set(1,.4+Math.random()*.25,1)}),m&&Math.random()<.8){let k=Math.random()<.5?-1:1;a.spawn(r.x+A*.45+P*k*.28,r.y+I*.45+F*k*.28,0,r.vx+x*5,r.vy+y*5,0,.2,.18,.5,.6,.85,1,3)}}l&&t.cause.kind==="impact"&&Math.random()<.5&&a.spawn(r.x,r.y,.2,r.vx+(Math.random()-.5)*2,r.vy+(Math.random()-.5)*2,0,1,.12,.5,.6,.65,.7,.8);for(let x of this.wellVis)if(x.mat.uniforms.uTime.value=s,x.ring.rotation.z=s,Math.random()<.6){let y=Math.random()*Math.PI*2,A=x.w.range*(.5+Math.random()*.4),I=x.w.x+Math.cos(y)*A,P=x.w.y+Math.sin(y)*A,F=Math.sqrt(x.w.gm/A)*.9;a.spawn(I,P,-.2,-Math.sin(y)*F-Math.cos(y)*1.2,Math.cos(y)*F-Math.sin(y)*1.2,0,2.5,.15,.05,.7,.5,1,0)}for(let x of this.ventVis){let y=x.v,A=Gc(y,t.t),I=Xo(y,t.t),P=I?1:A>0?Math.sin(s*30)>0?1:.15:.12;x.lp.material.uniforms.uTime.value=s,x.lp.material.uniforms.uScale.value=this.pxScale;let F=x.lp.geometry.attributes.color;for(let k=0;k<2;k++)F.setXYZ(k,P,P*.15,P*.1);if(F.needsUpdate=!0,I){let k=Math.cos(y.dir),L=Math.sin(y.dir);for(let z=0;z<7;z++){let H=(Math.random()-.5)*y.width,$=14+Math.random()*8;a.spawn(y.x-L*H+k*1,y.y+k*H+L*1,(Math.random()-.5)*2,k*$+(Math.random()-.5)*2,L*$,0,.6+Math.random()*.3,.6,2.2,.55,.62,.7,1.4)}}}for(let x of t.fields)if(Math.random()<.9)for(let y=0;y<2;y++){let A=x.x0+Math.random()*(x.x1-x.x0),I=Math.min(x.y1,this.cam.y+16)-Math.random()*30;a.spawn(A,I,-1-Math.random()*3,x.ax*8,x.ay*8,0,1.6,.12,.12,.65,.4,1,0)}if(t.tide){let y=t.tide(this.cam.x,0).ax;for(let A=0;A<3;A++){if(Math.random()>.3+y*.4)continue;let I=this.cam.x-22+Math.random()*40,P=this.cam.y+(Math.random()-.5)*26,F=Math.random()<.5;a.spawn(I,P,-2-Math.random()*6,6+y*10,0,0,1.2,.1,.14,F?1:.4,F?.45:.75,F?.2:1,0)}}if(t.sun){let x=t.sun;Qu(this.sunU,t),this.sunLayer.mat.uniforms.uTime.value=s;let y=Pi(x,r.x,r.y,t.t);this.sunExp=(this.sunExp??y)+(y-(this.sunExp??y))*Math.min(1,e*14),this.sunLight.intensity=(this.theme.hero?4.2:0)*this.sunExp;for(let A=0;A<6;A++){let I=this.cam.x+(Math.random()-.5)*this.cam.h*4,P=this.cam.y+(Math.random()-.5)*this.cam.h*2.4;if(Pi(x,I,P,t.t)<.5)continue;let F=9+Math.random()*9;a.spawn(I,P,-.6-Math.random()*1.5,x.dx*F,x.dy*F,0,.7+Math.random()*.5,.11,.05,1,.62,.25,0)}if(this.sunExp>.5&&t.state==="play"&&Math.random()<.6&&a.spawn(r.x+(Math.random()-.5)*1.6,r.y+(Math.random()-.5)*1.6,.3,x.dx*5+r.vx,x.dy*5+r.vy,0,.35,.1,.02,1,.75,.4,0),x.flare){let A=an(x,t.t);this.bg.setFlare(A.state==="warn"?1-A.lead/x.flare.warn:0,A.state==="sweep"?1:0)}}for(let x of this.pickVis)x.g.visible=!x.p.taken,x.g.rotation.set(s*.7,0,s*1.1);if(this.ren&&t.npc){let x=t.npc;if(this.ren.update(e,{x:x.x,y:x.y,angle:x.angle,thrusting:!1,braking:!1,turning:0,tumble:x.spin,latched:!1,dead:!1,docked:!1,beaconSolid:!1}),x.carried&&Math.random()<.3){let y=Math.random();a.spawn(r.x+(x.x-r.x)*y,r.y+(x.y-r.y)*y,.2,0,0,0,.15,.12,.05,1,.6,.2,0)}}let v=t.goalIndex;for(let x=0;x<this.goalVis.length;x++){let y=this.goalVis[x];if(!y)continue;y.group.visible=x===v||c;let A=je(t,y.goal);y.ring.position.x=A.x,y.ring.position.y=A.y,y.ring.rotation.z=A.rot,y.ringMat.uniforms.uTime.value=s;let I=Math.hypot(r.vx-A.vx,r.vy-A.vy),P=Math.hypot(r.x-A.x,r.y-A.y)<14,F=y.ringMat.uniforms.uColor.value;c?F.setRGB(.3,1,.5):P&&I>y.goal.maxSpeed?F.setRGB(1,.35+.2*Math.sin(s*20),.2):P?F.setRGB(.3,1,.55):F.setRGB(.4,.9,1),y.ringMat.uniforms.uAlpha.value=.7+.3*Math.sin(s*4)}if(t.state==="play"&&n.showDrift){let x=r.latch?7:2.6,y=t.predict(x,r.latch?.11:.065,this._pred||(this._pred=[])),A=r.latch?1:Math.min(1,.25+o*.4);this.drift.set(y,r.x,r.y,{alpha:A,latched:!!r.latch,t:s},this.pxScale),this.drift.points.visible=!0,this.lastPrediction=y}else this.drift.points.visible=!1,this.lastPrediction=null;let g=this.rocks,p=this._m4,M=this._q,S=this._e;for(let x=0;x<g.length;x++){let y=g[x];S.set(y.rx+s*y.w,y.ry+s*y.w*.7,0),M.setFromEuler(S),wc.set(y.x+s*.3,y.y,y.z),Ac.set(y.s,y.s*.8,y.s),p.compose(wc,M,Ac),this.rockInst.setMatrixAt(x,p)}this.rockInst.instanceMatrix.needsUpdate=!0,this.updateCamera(t,e,n);for(let x of[this.matPlay,this.matBack,this.matMid,this.matFar])x.uniforms.uTime.value=s;this.lightMat.uniforms.uTime.value=s,this.lightMat.uniforms.uScale.value=this.pxScale,this.farLightMat.uniforms.uTime.value=s,this.farLightMat.uniforms.uScale.value=this.pxScale;for(let x of this.stageGroup.children)x.isPoints&&x.material!==this.lightMat&&x.material!==this.farLightMat&&x.material.uniforms&&(x.material.uniforms.uTime.value=s,x.material.uniforms.uScale.value=this.pxScale);a.update(e,this.pxScale);let T=(this.cam.h/Oo-10.5)*Oo-6.2;this.fgTop.position.y=this.cam.y*.92+T,this.fgBot.position.y=this.cam.y*.92-T;let w=wc.set(r.x,r.y,0).project(this.camera);this.matFg.uniforms.uPlayer.value.set(w.x*.5+.5,w.y*.5+.5);let R=t.goal?t.goal.type==="rescue"?t.npc:je(t,t.goal):null;if(R){let x=Ac.set(R.x,R.y,0).project(this.camera);this.matFg.uniforms.uGoal.value.set(x.x*.5+.5,x.y*.5+.5)}this.bg.render(s,this.cam.x*9e-4,this.cam.y*.0012),this.renderer.render(this.scene,this.camera)}updateCamera(t,e,n){let s=t.player,r=this.cam,a=Math.hypot(s.vx,s.vy),o=s.x+pf(s.vx*.7,7)+2.5*Math.cos(s.angle)*.4,l=s.y+pf(s.vy*.5,4.5),c=this.def?this.def.look:{};c.lead&&(o+=c.lead[0],l+=c.lead[1]);let h=(c.camH??9.4)+Math.min(5,Math.max(0,a-2.5)*.6);s.latch&&(h=14);let f=t.goal;if(f&&f.type!=="rescue"){let S=je(t,f),b=Math.hypot(S.x-s.x,S.y-s.y),T=Math.max(0,Math.min(1,(22-b)/14));o+=((s.x+S.x)/2-o)*T*.6,l+=((s.y+S.y)/2-l)*T*.6,h=h*(1-T*.25)+Math.max(8.5,b*.45)*T*.25}h*=n.zoom||1,n.cinematic&&(o=n.cinematic.x,l=n.cinematic.y,h=n.cinematic.h),t.state==="won"&&(h=8);let u=n.cinematic?2:5,d=(o-r.x)*u*u-r.vx*2*u,m=(l-r.y)*u*u-r.vy*2*u;r.vx+=d*e,r.vy+=m*e,r.x+=r.vx*e,r.y+=r.vy*e,r.h+=(h-r.h)*Math.min(1,e*1.6),this.shake*=Math.exp(-e*4.5);let v=this.shake*this.shake*.9,g=(Math.random()-.5)*v,p=(Math.random()-.5)*v,M=r.h/Oo;this.camera.position.set(r.x+g,r.y-1.5+p,M),this.camera.lookAt(r.x+g*.5,r.y+p*.5,0),this.camera.rotation.z+=g*.01}toScreen(t,e,n=0){let s=new U(t,e,n).project(this.camera);return{x:(s.x*.5+.5)*window.innerWidth,y:(-s.y*.5+.5)*window.innerHeight,behind:s.z>1}}},wc=new U,Ac=new U;function Rc(i,t){let e=i.attributes.position.count;i.setAttribute("aCaster",new zt(new Float32Array(e).fill(t),1))}function pf(i,t){return i>t?t:i<-t?-t:i}var ko=class{constructor(t){this.keys=new Set,this.touch={left:!1,right:!1,thrust:!1,brake:!1},this.onAction=null,this.any=!1,addEventListener("keydown",o=>{if(o.repeat){gf(o.code)&&o.preventDefault();return}this.keys.add(o.code),this.any=!0,gf(o.code)&&o.preventDefault();let l={KeyR:"retry",Escape:"pause",KeyP:"pause",Enter:"confirm",Space:"space",KeyM:"mute",KeyN:"next"};l[o.code]&&this.onAction&&this.onAction(l[o.code],o)}),addEventListener("keyup",o=>this.keys.delete(o.code)),addEventListener("blur",()=>{this.keys.clear();for(let o in this.touch)this.touch[o]=!1}),this.pads=[...t.querySelectorAll("[data-pad]")];let e=new Map,n=(o,l)=>{for(let c of this.pads){let h=c.getBoundingClientRect(),f=10;if(o>=h.left-f&&o<=h.right+f&&l>=h.top-f&&l<=h.bottom+f)return c.dataset.pad}return null},s=()=>{for(let o in this.touch)this.touch[o]=!1;for(let o of e.values())o&&(this.touch[o]=!0);for(let o of this.pads)o.classList.toggle("on",this.touch[o.dataset.pad])},r=t.querySelector("#touch");r.addEventListener("pointerdown",o=>{let l=n(o.clientX,o.clientY);l&&(o.preventDefault(),this.any=!0,r.setPointerCapture(o.pointerId),e.set(o.pointerId,l),s())}),r.addEventListener("pointermove",o=>{e.has(o.pointerId)&&(e.set(o.pointerId,n(o.clientX,o.clientY)),s())});let a=o=>{e.delete(o.pointerId),s()};r.addEventListener("pointerup",a),r.addEventListener("pointercancel",a)}read(){let t=this.keys,e=t.has("ArrowLeft")||t.has("KeyA")||this.touch.left,n=t.has("ArrowRight")||t.has("KeyD")||this.touch.right;return{turn:(e?1:0)-(n?1:0),thrust:t.has("ArrowUp")||t.has("KeyW")||t.has("Space")||this.touch.thrust,brake:t.has("ArrowDown")||t.has("KeyS")||t.has("ShiftLeft")||t.has("ShiftRight")||this.touch.brake}}};function gf(i){return["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(i)}var zo=class{constructor(){this.ctx=null,this.muted=!1,this.breathT=0,this.warnT=0}init(){if(this.ctx){this.ctx.state==="suspended"&&this.ctx.resume();return}let t=window.AudioContext||window.webkitAudioContext;if(!t)return;let e=new t;this.ctx=e;let n=e.createDynamicsCompressor();n.threshold.value=-16,n.ratio.value=4,this.master=e.createGain(),this.master.gain.value=this.muted?0:.8,this.master.connect(n).connect(e.destination);let s=e.sampleRate*2,r=e.createBuffer(1,s,e.sampleRate),a=r.getChannelData(0);for(let c=0;c<s;c++)a[c]=Math.random()*2-1;this.noise=r,this.thr=this.loopNoise(420,"lowpass",.9),this.thrHi=this.loopNoise(2400,"bandpass",.6),this.thrRumble=this.osc("sine",52),this.brk=this.loopNoise(2600,"bandpass",2.5);let o=e.createOscillator();o.type="square",o.frequency.value=16;let l=e.createGain();l.gain.value=.5,o.connect(l).connect(this.brk.g.gain),o.start(),this.brkLfo=l,this.amb=this.osc("sawtooth",41,140),this.amb2=this.osc("sawtooth",41.7,140),this.amb.g.gain.value=.02,this.amb2.g.gain.value=.02,this.wellHum=this.osc("sine",38),this.wellHum2=this.osc("triangle",57)}loopNoise(t,e,n){let s=this.ctx,r=s.createBufferSource();r.buffer=this.noise,r.loop=!0;let a=s.createBiquadFilter();a.type=e,a.frequency.value=t,a.Q.value=n;let o=s.createGain();return o.gain.value=0,r.connect(a).connect(o).connect(this.master),r.start(),{src:r,f:a,g:o}}osc(t,e,n){let s=this.ctx,r=s.createOscillator();r.type=t,r.frequency.value=e;let a=s.createGain();if(a.gain.value=0,n){let o=s.createBiquadFilter();o.type="lowpass",o.frequency.value=n,r.connect(o).connect(a)}else r.connect(a);return a.connect(this.master),r.start(),{o:r,g:a}}setMuted(t){this.muted=t,this.master&&this.master.gain.setTargetAtTime(t?0:.8,this.ctx.currentTime,.05)}update(t,e){if(!this.ctx)return;let n=this.ctx.currentTime,s=(a,o,l=.04)=>a.setTargetAtTime(o,n,l);s(this.thr.g.gain,e.thrusting?.5:0,e.thrusting?.02:.06),s(this.thrHi.g.gain,e.thrusting?.07:0),s(this.thrRumble.g.gain,e.thrusting?.25:0),s(this.thr.f.frequency,380+e.speed*18),s(this.brk.g.gain,e.braking?.09:0,.02),s(this.brkLfo.gain,e.braking?.09:0,.02);let r=e.anomaly||0;if(s(this.amb.g.gain,.02+r*.03,.5),s(this.amb2.g.gain,.02+r*.03,.5),s(this.amb.o.frequency,41-r*8,1),s(this.wellHum.g.gain,e.well*.22,.1),s(this.wellHum2.g.gain,e.well*.06,.1),s(this.wellHum.o.frequency,34+e.well*22,.1),e.alive&&(this.breathT-=t,this.breathT<=0)){let a=Math.min(1,e.stress),o=3.6-a*2;this.breathT=o,this.breath(o*.42,.018+a*.02,!0),setTimeout(()=>this.breath(o*.5,.014+a*.018,!1),o*450)}e.danger?(this.warnT-=t,this.warnT<=0&&(this.beep(1046,.07,.05),this.warnT=.22)):this.warnT=0}breath(t,e,n){if(!this.ctx||this.muted)return;let s=this.ctx,r=s.currentTime,a=s.createBufferSource();a.buffer=this.noise;let o=s.createBiquadFilter();o.type="bandpass",o.Q.value=.9,o.frequency.setValueAtTime(n?700:1100,r),o.frequency.linearRampToValueAtTime(n?1200:600,r+t);let l=s.createGain();l.gain.setValueAtTime(0,r),l.gain.linearRampToValueAtTime(e,r+t*.35),l.gain.linearRampToValueAtTime(0,r+t),a.connect(o).connect(l).connect(this.master),a.start(r,Math.random()),a.stop(r+t+.05)}beep(t,e,n,s="sine",r=0){if(!this.ctx)return;let a=this.ctx,o=a.currentTime+r,l=a.createOscillator();l.type=s,l.frequency.value=t;let c=a.createGain();c.gain.setValueAtTime(0,o),c.gain.linearRampToValueAtTime(n,o+.008),c.gain.exponentialRampToValueAtTime(1e-4,o+e),l.connect(c).connect(this.master),l.start(o),l.stop(o+e+.02)}thump(t,e,n,s){if(!this.ctx)return;let r=this.ctx,a=r.currentTime,o=r.createOscillator();o.type="sine",o.frequency.setValueAtTime(t,a),o.frequency.exponentialRampToValueAtTime(e,a+n);let l=r.createGain();l.gain.setValueAtTime(s,a),l.gain.exponentialRampToValueAtTime(1e-4,a+n),o.connect(l).connect(this.master),o.start(a),o.stop(a+n+.02)}burst(t,e,n,s,r=1,a){if(!this.ctx)return;let o=this.ctx,l=o.currentTime,c=o.createBufferSource();c.buffer=this.noise;let h=o.createBiquadFilter();h.type=e,h.frequency.setValueAtTime(t,l),h.Q.value=r,a&&h.frequency.exponentialRampToValueAtTime(a,l+n);let f=o.createGain();f.gain.setValueAtTime(s,l),f.gain.exponentialRampToValueAtTime(1e-4,l+n),c.connect(h).connect(f).connect(this.master),c.start(l,Math.random()),c.stop(l+n+.02)}event(t){if(this.ctx)switch(t.type){case"bump":{let e=Math.min(1,t.strength/3.5);this.thump(110,40,.25,.25+e*.5),this.burst(500,"lowpass",.18,.15+e*.3);break}case"scrape":this.burst(1800,"bandpass",.12,.06,3,900);break;case"crash":this.thump(90,28,.6,1),this.burst(320,"lowpass",.5,.8),this.burst(4200,"bandpass",.35,.25,2,2e3),this.burst(2500,"highpass",1.6,.12,.5),[0,.3,.6].forEach(e=>{this.beep(740,.18,.08,"square",.35+e),this.beep(554,.18,.08,"square",.5+e)});break;case"latch":this.thump(160,55,.22,.6),this.beep(2400,.03,.08,"square");break;case"clunk":this.thump(120,45,.2,.5);break;case"release":this.burst(1200,"bandpass",.15,.1,1.5,3e3),this.beep(880,.06,.04);break;case"capture":this.thump(140,60,.3,.6),this.beep(2600,.04,.08,"square"),this.beep(660,.5,.08,"sine",.1),this.beep(990,.7,.07,"sine",.22),this.beep(1320,.9,.05,"sine",.34);break;case"rescue":this.thump(130,60,.25,.5),this.beep(523,.25,.06,"sine",.05),this.beep(784,.4,.06,"sine",.18);break;case"win":this.burst(3e3,"lowpass",1.4,.2,.7,300);break;case"slip":this.burst(2200,"bandpass",.22,.12,4,700),this.beep(330,.15,.05,"triangle");break;case"shove":this.thump(100,45,.25,.5),this.beep(300,.2,.05,"triangle");break;case"pickup":this.beep(880,.08,.06),this.beep(1320,.12,.06,"sine",.07),this.beep(1760,.2,.05,"sine",.14);break;case"dry":this.beep(220,.25,.08,"square"),this.beep(180,.3,.08,"square",.28);break;case"knocked":this.thump(90,40,.3,.5);break;case"vent":this.burst(600,"lowpass",1.2,.25*(t.vol||1),.8,200);break;case"fail":t.cause==="well"&&(this.thump(200,20,1.5,.6),this.burst(800,"bandpass",1.4,.3,1,60)),t.cause==="arc"&&(this.burst(5e3,"highpass",.5,.4),this.beep(60,.5,.3,"sawtooth")),(t.cause==="void"||t.cause==="missed"||t.cause==="npcvoid")&&this.beep(392,.6,.06,"triangle"),t.cause==="flare"&&(this.burst(6e3,"highpass",.8,.35),this.beep(1480,.4,.07,"sawtooth"));break;case"flareWarn":[0,.5,1,1.5,2].forEach((e,n)=>this.beep(880+n*110,.12,.06,"square",e));break;case"flare":this.burst(900,"lowpass",2.2,.5,.6,120),this.burst(3200,"bandpass",1.2,.15,1.2,400);break;case"ui":this.beep(1200,.04,.04);break}}};function xf(i,t=0){let e=typeof t=="number"?i.routes[t]:i.routes.find(n=>n.id===t);if(!e)throw new Error(`stage ${i.id} has no route ${t}`);return Kc(e.plan)}var _t=i=>document.getElementById(i),Ho=i=>{let t=Math.floor(i/60),e=i-t*60;return`${String(t).padStart(2,"0")}:${e.toFixed(1).padStart(4,"0")}`},yf=(i,t)=>i[Math.abs(Math.floor(t))%i.length],vf={impact:["SUIT BREACH",["The truss won.","Space is mostly empty. You found the part that isn\u2019t.","Momentum: still undefeated.","That\u2019s one way to stop.","The station is fine. Thanks for asking.","You arrived. All at once."]],well:["SPAGHETTIFIED",["The well said hi.","You are now forty metres tall and two centimetres wide.","Gravity assist: declined.","Too slow, too close. Very, very long now."]],void:["LOST TO THE DARK",["Rescue ETA: four years.","Your beacon will ping forever. Very faithfully.","Bold heading. Wrong universe.","Nothing out there to bounce off. That was the problem."]],horizon:["PAST THE HORIZON",["The anomaly keeps what it takes.","From outside, you\u2019ll be falling forever. Neat.","The pull won the argument."]],missed:["MISSED YOUR RIDE",["The hangar sealed. The shuttle didn\u2019t wait.","Next shuttle: Thursday. Probably.","You and the shuttle were never really on the same page."]],arc:["FRIED",["Live conduit. You found it."]],npcvoid:["REN DRIFTED AWAY",["You bowled Ren into deep space. She saw it coming.","She\u2019ll write. Eventually."]],npcwell:["REN SPAGHETTIFIED",["Ren was very tall for a moment.","That one\u2019s going in the incident report."]],flare:["THERMAL LIMIT EXCEEDED",["Sunscreen: insufficient."]]},Ux={AIRLOCK:"DOCKED",HANDHOLD:"HOLDING ON","MAG PLATE":"MAG-LOCKED","CARGO CLAMP":"CLAMPED ON",LIFEBOAT:"BOTH OF YOU HOME","HORIZON LOCK":"MADE IT"},Cc=class{constructor(){this.key="space-drift-zero/v1",this.data={};try{this.data=JSON.parse(localStorage.getItem(this.key)||"{}")||{}}catch{this.data={}}}get(t){return this.data[t]||null}put(t,e){let n=this.data[t]||{};this.data[t]={best:n.best?Math.min(n.best,e.time):e.time,stars:Math.max(n.stars||0,e.stars),fuel:n.fuel!=null?Math.min(n.fuel,e.fuel):e.fuel};try{localStorage.setItem(this.key,JSON.stringify(this.data))}catch{}}pref(t,e){if(e===void 0)return this.data["_"+t];this.data["_"+t]=e;try{localStorage.setItem(this.key,JSON.stringify(this.data))}catch{}}},Ic=class{constructor(){this.r=new Bo(_t("gl")),this.input=new ko(document.body),this.audio=new zo,this.save=new Cc,this.audio.muted=!!this.save.pref("muted"),this.mode="title",this.stageIndex=0,this.attempts=0,this.slow=1,this.hitstop=0,this.acc=0,this.forced=null,this.view={showDrift:!0,cinematic:null,zoom:1},this.hintQ=[],this.retryLog=[],this.isTouch=matchMedia("(pointer: coarse)").matches||"ontouchstart"in window,document.body.classList.toggle("touch",this.isTouch),this.isTouch&&Math.min(innerWidth,innerHeight)<500&&(this.view.zoom=.88),this.input.onAction=(t,e)=>this.action(t,e),document.addEventListener("click",t=>{let e=t.target.closest("[data-act]");e&&(this.audio.init(),this.audio.event({type:"ui"}),this.action(e.dataset.act))}),_t("btnRetry").addEventListener("click",()=>this.retry()),_t("btnPause").addEventListener("click",()=>this.togglePause()),_t("result").addEventListener("pointerdown",t=>{t.target.closest("button")||this.world&&this.world.state==="lost"&&this.resultShown&&this.retry()}),addEventListener("pointerdown",()=>this.audio.init(),{once:!1}),addEventListener("keydown",()=>this.audio.init()),addEventListener("resize",()=>this.r.resize()),document.addEventListener("visibilitychange",()=>{document.hidden&&this.mode==="play"&&this.world.state==="play"&&this.pause(!0)}),this.buildSelect(),this.loadTitleScene(),this.mode="title",this.updateMuteLabel(),this.last=performance.now(),this.fpsT=0,this.fpsN=0,this.quality=2,requestAnimationFrame(t=>this.loop(t))}action(t,e){if(t==="mute"){this.audio.setMuted(!this.audio.muted),this.save.pref("muted",this.audio.muted),this.updateMuteLabel();return}if(this.mode==="title"){t==="play"||t==="confirm"?this.startPlay(this.firstUnfinished()):t==="stages"&&this.showSelect();return}if(this.mode==="select"){(t==="back"||t==="pause")&&this.showTitle();return}if(this.mode==="paused"){t==="resume"||t==="pause"?this.pause(!1):t==="retry"?(this.pause(!1),this.retry()):t==="stages"&&(this.pause(!1),this.showSelect());return}this.mode==="play"&&(t==="retry"?this.retry():t==="pause"?this.togglePause():t==="next"||t==="confirm"?this.world.state==="won"&&this.resultShown?this.next():this.world.state==="lost"&&this.resultShown&&this.retry():t==="space"&&this.world.state==="lost"&&this.resultShown?this.retry():t==="stages"&&this.showSelect())}firstUnfinished(){for(let t=0;t<Qe.length;t++)if(!this.save.get(Qe[t].id))return t;return 0}showTitle(){this.mode="title",_t("title").classList.remove("hide"),_t("select").classList.add("hide"),_t("result").classList.add("hide"),_t("hud").classList.remove("on"),_t("playBtn").firstChild.textContent=this.firstUnfinished()>0?"CONTINUE":"BEGIN EVA",this.loadTitleScene()}loadTitleScene(){if(this.titleLoaded&&this.def===Qe[Qe.length-1]&&this.preview)return;this.loadStage(Qe.length-1,!0),this.titleLoaded=!0;let t=this.world.player;t.x=119,t.y=5,t.vx=t.vy=0,t.angle=.35,this.r.snapCamera(this.world,{cinematic:{x:t.x-5.5,y:t.y+.6,h:7.2}})}showSelect(){this.mode="select",this.buildSelect(),_t("title").classList.add("hide"),_t("result").classList.add("hide"),_t("select").classList.remove("hide"),_t("hud").classList.remove("on")}buildSelect(){let t=(e,n,s)=>{e.innerHTML="",n.forEach((r,a)=>{let o=this.save.get(r.id),l=document.createElement("button");l.className="stage-card"+(r.experimental?" lab":"");let c=o?"\u2605".repeat(o.stars)+`<i>${"\u2605".repeat(3-o.stars)}</i>`:"<i>\u2605\u2605\u2605</i>";l.innerHTML=`<span class="n">${r.experimental?"LAB":String(r.num).padStart(2,"0")}</span><span class="st">${c}</span><span class="nm">${r.name}</span><span class="ch">${r.chapter}</span><span class="bt">${o?"BEST "+Ho(o.best):"\u2014"}</span>`,l.addEventListener("click",()=>{this.audio.init(),this.startPlay(s+a)}),e.appendChild(l)})};t(_t("grid"),Qe,0),t(_t("labGrid"),Tr,Qe.length)}startPlay(t){_t("title").classList.add("hide"),_t("select").classList.add("hide"),this.mode="play",this.attempts=0,this.view.cinematic=null,this.loadStage(t,!1)}loadStage(t,e){this.stageIndex=t;let n=Qo[t];this.def=n,this.world=new vr(n),this.r.loadStage(n,this.world),this.preview=e,this.resetAttemptState(),e||this.beginAttempt(!0)}resetAttemptState(){this.resultShown=!1,this.endTimer=0,this.slow=1,this.hitstop=0,this.acc=0,this.closeCall=0,this.hintsShown=new Set,this.hintUntil=0,_t("result").classList.add("hide"),_t("crack").style.transition="none",_t("crack").style.opacity=0,_t("vignette").style.opacity=0,_t("hint").classList.remove("on")}beginAttempt(t){this.attempts++,_t("hud").classList.add("on"),_t("stNum").textContent=this.def.experimental?"LAB":String(this.def.num).padStart(2,"0"),_t("stName").textContent=this.def.name,_t("brNum").textContent=this.def.experimental?`EXPERIMENT \xB7 ${this.def.chapter}`:`STAGE ${String(this.def.num).padStart(2,"0")} \xB7 ${this.def.chapter}`,_t("brName").textContent=this.def.name,_t("brText").textContent=this.def.brief;let e=_t("brief");e.classList.remove("out"),this.briefFading=!1,clearTimeout(this.briefTO),this.briefTO=setTimeout(()=>e.classList.add("out"),t?3200:1400);let n=this.def.hints.find(s=>s.at==="start");n&&this.attempts<=3&&this.showHint(n.text,4,!1,t?2.4:.6)}retry(){this.retryReadyAt&&(this.retryLog.push({stage:this.def.id,attempt:this.attempts,cause:this.world.cause&&this.world.cause.kind,ms:Math.round(performance.now()-this.retryReadyAt)}),this.retryReadyAt=0),this.mode==="paused"&&this.pause(!1),this.autoplan=null,this.mode==="play"&&(this.world.reset(),this.r.rebind(this.world),this.resetAttemptState(),this.beginAttempt(!1))}next(){this.def.experimental?this.showSelect():this.stageIndex+1<Qe.length?(this.attempts=0,this.loadStage(this.stageIndex+1,!1)):this.showFinale()}showFinale(){this.mode="select",this.showSelect(),_t("select").querySelector("h2").textContent="ALL STAGES CLEARED \u2014 CHASE THE STARS"}togglePause(){this.pause(this.mode!=="paused")}pause(t){t&&this.mode==="play"?(this.mode="paused",_t("pause").classList.remove("hide")):!t&&this.mode==="paused"&&(this.mode="play",_t("pause").classList.add("hide"),this.last=performance.now())}updateMuteLabel(){_t("muteBtn").textContent=`SOUND: ${this.audio.muted?"OFF":"ON"}`}showHint(t,e,n,s=0){clearTimeout(this.hintTO),this.isTouch&&(t=t.replace("S CLAMPS.  W LETS GO.","BRAKE CLAMPS.  THRUST LETS GO.").replace("W / \u25B2","THRUST").replace("S / \u25BC","BRAKE").replace("SPACE / R","TAP"));let r=()=>{let a=_t("hint");a.textContent=t,a.classList.toggle("warn",!!n),a.classList.add("on"),clearTimeout(this.hintTO2),this.hintTO2=setTimeout(()=>a.classList.remove("on"),e*1e3)};s?this.hintTO=setTimeout(r,s*1e3):r()}loop(t){requestAnimationFrame(d=>this.loop(d));let e=Math.min(.05,(t-this.last)/1e3);if(this.last=t,this.mode==="paused"){this.r.frame(this.world,0,this.view);return}this.adaptQuality(e);let n=this.world,s=this.mode==="play",r=s?this.input.read():{turn:0,thrust:!1,brake:!1};this.forced&&(r=this.forced),this.autoplan&&s&&(r=this.autoplan(n)),s&&n.state==="play"&&(r.thrust||r.brake||r.turn||n.started)&&!_t("brief").classList.contains("out")&&!this.briefFading&&(this.briefFading=!0,clearTimeout(this.briefTO),this.briefTO=setTimeout(()=>_t("brief").classList.add("out"),500)),this.hitstop>0&&(this.hitstop-=e,e*=.05);let a=e*this.slow;this.slow+=(1-this.slow)*Math.min(1,e*1.5);let o=this.mode==="title"||this.mode==="select";if(!this.manualStep){this.acc+=a;let d=0;for(;this.acc>=$t.dt&&d<12;)n.step(r),this.acc-=$t.dt,d++}if(o){let d=n.player,m=t*.001;d.x=119+Math.sin(m*.13)*1.2,d.y=5+Math.sin(m*.19)*.8,d.vx=Math.cos(m*.13)*.16,d.vy=Math.cos(m*.19)*.15,d.angle=.35+Math.sin(m*.21)*.25,d.tumble=0,d.turnRate=0,d.thrusting=Math.sin(m*.9)>.985,d.braking=!1,n.state="play",n.events.length=0}this.drainEvents(),this.view.cinematic=o?{x:n.player.x-5.5+Math.sin(t*7e-5)*1.5,y:n.player.y+.6+Math.sin(t*11e-5)*.6,h:7.2}:null,this.view.showDrift=s,document.body.classList.toggle("playing",this.mode==="play"||this.mode==="paused"),this.r.frame(n,e,this.view),s&&this.updateHud(e);let l=n.player,c=this.r.lastPrediction,h=!!(c&&c.length&&c[c.length-1].danger)&&n.state==="play"&&s;h&&c.length*.065<.7&&(this.closeCall=n.t);let f=0;for(let d of n.wells)f=Math.max(f,1-Math.min(1,Math.hypot(l.x-d.x,l.y-d.y)/d.range));let u=n.tide?Math.min(1,n.tide(l.x,l.y).ax/1.5):Math.min(1,(this.def.num||5)/10);this.audio.update(e,{thrusting:s&&l.thrusting,braking:s&&l.braking,speed:Math.hypot(l.vx,l.vy),well:s?f:0,anomaly:u,alive:s&&n.state!=="lost",stress:Math.hypot(l.vx,l.vy)/8+(h?.6:0)+(l.fuel<15?.3:0),danger:h})}adaptQuality(t){if(this.fpsT+=t,this.fpsN++,this.fpsT>2.5){let e=this.fpsN/this.fpsT;this.fpsT=0,this.fpsN=0,e<42&&this.quality>0?(this.quality--,this.r.setQuality(this.quality)):e>58&&this.quality<2&&this.lowSince&&performance.now()-this.lowSince>2e4&&(this.quality++,this.r.setQuality(this.quality)),e<42&&(this.lowSince=performance.now())}}drainEvents(){let t=this.world;for(let e of t.events)if(this.r.onEvent(e,t),this.mode==="play"&&this.audio.event(e),this.mode==="play")switch(e.type){case"crash":this.hitstop=.11,Fx(),Ox(.35);break;case"bump":e.strength>2&&(_t("vignette").style.opacity=.7,setTimeout(()=>_t("vignette").style.opacity=0,160),this.closeCall=t.t);break;case"slip":this.showHint(`TOO FAST \u2014 ${e.rel.toFixed(1)} m/s  (MAX ${e.limit})`,1.6,!0),this.closeCall=t.t;break;case"shove":this.showHint(`EASY! ${e.rel.toFixed(1)} m/s \u2014 REN NEEDS UNDER ${e.limit}`,2,!0);break;case"capture":this.slow=.3;break;case"rescue":this.slow=.4;break;case"dry":this.showHint("PROPELLANT DRY",2,!0);break;case"latch":this.attempts<=2&&this.showHint("LATCHED \u2014 RIDE IT OUT",1.6);break;case"win":this.endTimer=1.2;break;case"flare":t.state==="play"&&t.exposure(t.player.x,t.player.y)<=.5&&(this.closeCall=t.t);break;case"fail":this.endTimer=e.cause==="impact"?1:e.cause==="void"||e.cause==="missed"?1.4:1.2;break}t.events.length=0}updateHud(t){let e=this.world,n=e.player,s=Math.hypot(n.vx,n.vy);_t("time").textContent=Ho(e.playT);let r=e.goal,a=null,o=s,l=null;r&&(r.type==="rescue"?a={x:e.npc.x,y:e.npc.y,vx:e.npc.vx,vy:e.npc.vy}:a=je(e,r),o=Math.hypot(n.vx-a.vx,n.vy-a.vy),l=r.maxSpeed);let c=a?Math.hypot(a.x-n.x,a.y-n.y):0,h=c<18,f=h?o:s;_t("spdVal").textContent=`${f.toFixed(1)} m/s`;let u=10;_t("spdFill").style.width=`${Math.min(100,f/u*100)}%`;let d=_t("spdBar");d.classList.toggle("over",h&&o>l),d.classList.toggle("under",h&&o<=l),_t("spdVal").className="val "+(h?o>l?"over":"under":"");let m=_t("spdLimit");if(m.style.display=h?"block":"none",l&&(m.style.left=`${l/u*100}%`),_t("fuelVal").textContent=`${Math.ceil(n.fuel)}%`,_t("fuelFill").style.width=`${n.fuel}%`,_t("fuelBar").classList.toggle("low",n.fuel<20),this.updateSun(e),a&&e.state==="play"){let v=this.r.toScreen(a.x,a.y+(r.type==="rescue"?1.5:r.shape==="box"?r.h/2+1.6:r.r+.8),.5),g=innerWidth,p=innerHeight,M=40,S=v.x>M&&v.x<g-M&&v.y>M&&v.y<p-M&&!v.behind,b=_t("goalTag");b.style.display=S?"block":"none",S&&(b.style.left=`${v.x}px`,b.style.top=`${v.y}px`,b.firstChild.textContent=r.label,b.lastChild.textContent=h?`${o.toFixed(1)} / ${l} m/s`:`\u2264 ${l} m/s`,b.className=h?o>l?"over":"under":"");let T=_t("edge");if(T.style.display=S?"none":"block",!S){let w=g/2,R=p/2,x=Math.atan2(v.y-R,v.x-w);v.behind&&(x+=Math.PI);let y=Math.min((g/2-30)/Math.abs(Math.cos(x)||1e-6),(p/2-30)/Math.abs(Math.sin(x)||1e-6));T.style.left=`${w+Math.cos(x)*y-7}px`,T.style.top=`${R+Math.sin(x)*y-8}px`,T.style.transform=`rotate(${x}rad)`}_t("cmpArrow").style.transform=`rotate(${-Math.atan2(a.y-n.y,a.x-n.x)}rad)`,_t("cmpDist").textContent=`${c.toFixed(0)} M`}else _t("goalTag").style.display="none",_t("edge").style.display="none";if(e.state==="play"&&this.attempts<=3)for(let v of this.def.hints)v.at||this.hintsShown.has(v)||v.when(e)&&(this.hintsShown.add(v),this.showHint(v.text,v.dur||2.2,/TOO|WALL|WARN/.test(v.text)));e.state!=="play"&&!this.resultShown&&(this.endTimer-=t,this.endTimer<=0&&this.showResult())}updateSun(t){let e=_t("sunChip"),n=_t("flare");if(_t("sunRow").classList.toggle("on",!!t.sun),!t.sun){e.classList.remove("on"),n.classList.remove("on");return}let s=t.exposure(t.player.x,t.player.y)>.5;e.className=`sun-chip on ${s?"lit":"dark"}`,e.textContent=s?"SUN \xB7 PUSHED":"SHADE \xB7 FREE";let r=t.sun.flare&&t.state==="play"?an(t.sun,t.t):null;r&&r.state!=="idle"?(n.className=`on ${s?"bad":"safe"}`,n.firstChild.textContent=r.state==="warn"?`FLARE  ${r.lead.toFixed(1)}`:"FLARE",n.lastChild.textContent=s?"EXPOSED \u2014 GET INTO SHADE":"SHELTERED"):n.classList.remove("on")}showResult(){this.resultShown=!0;let t=this.world,e=_t("card");if(_t("hint").classList.remove("on"),t.state==="lost"){let n=t.cause.kind;n==="void"&&this.def.look.final&&t.player.x>t.bounds.x1-1&&(n="horizon");let s=Fo(this.def).fail,[r,a]=s&&s[n]||vf[n]||vf.impact,o="";n==="impact"?o=`impact ${t.cause.speed.toFixed(1)} m/s \xB7 suit rated to ${$t.crashSpeed}`:n==="void"?o=`last seen at ${Math.hypot(t.player.vx,t.player.vy).toFixed(1)} m/s`:n==="flare"&&(o="caught in sunlight by a flare front \xB7 shade blocks it"),e.className="card fail",e.innerHTML=`<h1>${r}</h1><p class="sub">${yf(a,this.attempts*7+t.t*3)}</p>${o?`<p class="detail">${o}</p>`:""}
        <div class="row"><button class="btn primary" data-act="retry">RETRY<kbd>R</kbd></button><button class="btn" data-act="stages">STAGES</button></div>
        <div class="attempt">ATTEMPT ${this.attempts} \xB7 ${this.isTouch?"TAP":"SPACE / R"} TO GO AGAIN</div>`,this.retryReadyAt=performance.now()}else{let n=this.world.goals[this.world.goals.length-1].label,s=t.playT,r=t.stats.fuelUsed,a=this.def.par,o=s<=a.time,l=r<=a.fuel,c=1+(o?1:0)+(l?1:0),h=this.save.get(this.def.id);this.save.put(this.def.id,{time:s,stars:c,fuel:r});let f=!h||s<h.best,u=this._lastCapture||0,d;this.closeCall>0&&t.t-this.closeCall<3?d=yf(["Holy\u2014 you actually made it.","That should not have worked. It worked.","Saved it. Barely. Beautifully."],this.attempts):t.player.fuel<4?d="Running on fumes. Counts the same.":u<.45?d=`Feather-soft. ${u.toFixed(2)} m/s.`:u>.8*this.lastLimit?d=`${u.toFixed(1)} m/s \u2014 that was hot.`:d=`Contact at ${u.toFixed(1)} m/s.`;let m=this.def.experimental?"STAGES":this.stageIndex+1<Qe.length?"NEXT":"FINISH";e.className="card win",e.innerHTML=`<h1>${Ux[n]||"SECURED"}</h1><p class="sub">${d}</p>
        <p class="detail">${Ho(s)}${f?" \xB7 BEST":""} \xB7 ${Math.round(r)}% propellant \xB7 ${this.attempts} ${this.attempts===1?"attempt":"attempts"}</p>
        <div class="stars"><span class="got"><em>\u2605</em>ARRIVED</span><span class="${o?"got":""}"><em>\u2605</em>\u2264 ${Ho(a.time).slice(1)}</span><span class="${l?"got":""}"><em>\u2605</em>\u2264 ${a.fuel}% FUEL</span></div>
        <div class="row"><button class="btn primary" data-act="next">${m}<kbd>\u23CE</kbd></button><button class="btn" data-act="retry">RETRY<kbd>R</kbd></button></div>`}_t("result").classList.remove("hide")}};function Fx(){let i=_t("crack");i.style.transition="none",i.style.opacity=.75,requestAnimationFrame(()=>{i.style.transition="opacity 2.5s ease-in",i.style.opacity=.3})}function Ox(i){let t=_t("flash");t.style.transition="none",t.style.opacity=i,requestAnimationFrame(()=>{t.style.transition="opacity .45s",t.style.opacity=0})}var Re=new Ic,Bx=Re.drainEvents.bind(Re);Re.drainEvents=function(){for(let i of this.world.events)i.type==="capture"&&(this._lastCapture=i.rel,this.lastLimit=this.world.goal?this.world.goal.maxSpeed:1.5);Bx()};window.__sd={game:Re,STAGES:Qe,EXPERIMENTS:Tr,get world(){return Re.world},get retryLog(){return Re.retryLog},force(i){Re.forced=i},autopilot(i,t=0){Re.startPlay(i),Re.autoplan=xf(Qo[i],t)},stopAuto(){Re.autoplan=null},start(i){Re.startPlay(i)},stepSim(i,t){for(let e=0;e<i;e++)Re.world.step(t||{turn:0,thrust:!1,brake:!1})},pauseSim(i){Re.manualStep=i},result(){Re.resultShown||Re.showResult()},snap(){Re.view.cinematic=null,Re.r.snapCamera(Re.world,Re.view),document.getElementById("brief").classList.add("out")}};})();
