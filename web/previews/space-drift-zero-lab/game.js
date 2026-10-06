(()=>{var Yt={dt:.008333333333333333,thrust:4.2,brake:2.3,rotSpeed:3.3,rotResponse:18,tumbleDecay:1.35,fuelThrust:8.5,fuelBrake:4.5,radius:.62,crashSpeed:3.6,restitution:.38,friction:.22,latchSpeed:5.2,grabCooldown:.55},Ti=(i,t,e)=>i<t?t:i>e?e:i;function ni(i){let t=i>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function Dc(i,t,e,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r),h=i-n,d=t-s,u=l*h+c*d,f=-c*h+l*d,p=Ti(u,-a,a),y=Ti(f,-o,o),x,m,b;if(p===u&&y===f){let T=a-Math.abs(u),v=o-Math.abs(f);T<v?(x=u<0?-1:1,m=0,p=x*a,b=e+T):(x=0,m=f<0?-1:1,y=m*o,b=e+v)}else{let T=u-p,v=f-y,w=Math.hypot(T,v);if(w>=e)return null;x=T/w,m=v/w,b=e-w}return{nx:l*x-c*m,ny:c*x+l*m,pen:b,px:n+l*p-c*y,py:s+c*p+l*y}}function Uc(i,t,e,n,s,r){let a=i-n,o=t-s,l=Math.hypot(a,o);if(l>=e+r)return null;let c=l>1e-6?a/l:1,h=l>1e-6?o/l:0;return{nx:c,ny:h,pen:e+r-l,px:n+c*r,py:s+h*r}}var dd=0;function fd(i){i.id=dd++,i.x=i.x||0,i.y=i.y||0,i.rot=i.rot||0,i.vx=0,i.vy=0,i.w=0,i.shapes=i.shapes||[];for(let t of i.shapes)t.lx=t.lx||0,t.ly=t.ly||0,t.lrot=t.lrot||0,t.body=i,t.wx=0,t.wy=0,t.wrot=0;return i}function Nc(i){let t=Math.cos(i.rot),e=Math.sin(i.rot);for(let n of i.shapes)n.wx=i.x+t*n.lx-e*n.ly,n.wy=i.y+e*n.lx+t*n.ly,n.wrot=i.rot+n.lrot}function ko(i,t,e,n){return i.type==="circle"?Uc(t,e,n,i.wx,i.wy,i.r):Dc(t,e,n,i.wx,i.wy,i.wrot,i.w/2,i.h/2)}function pd(i,t){return i.motion?i.motion(t):i}var gr=class{constructor(t){this.def=t,this.reset()}reset(){let t=this.def.build();this.stage=t,this.t=0,this.playT=0,this.started=!1,this.rng=ni(t.seed||7),this.events=[],this.bodies=t.bodies.map(fd);for(let n of this.bodies)n.motion&&Object.assign(n,n.motion(0)),Nc(n);this.wells=t.wells||[],this.vents=t.vents||[],this.fields=t.fields||[],this.arcs=t.arcs||[],this.pickups=(t.pickups||[]).map(n=>({...n,taken:!1})),this.goals=t.goals,this.goalIndex=0,this.bounds=t.bounds,this.tide=t.tide||null;let e=t.start;this.player={x:e.x,y:e.y,vx:e.vx||0,vy:e.vy||0,angle:e.angle??0,turnRate:0,tumble:0,fuel:t.fuel??100,mass:1,thrusting:!1,braking:!1,turning:0,latch:null,latchCooldown:new Map,ghost:null,grabCooldown:0,ax:0,ay:0,lastImpact:0,nearMiss:0},this.npc=t.npc?{...t.npc,vx:t.npc.vx||0,vy:t.npc.vy||0,spin:t.npc.spin||.3,angle:t.npc.angle||0,carried:!1,r:.6}:null,this.state="play",this.cause=null,this.endT=0,this.stats={fuelUsed:0,bumps:0,maxSpeed:0}}get goal(){return this.goals[this.goalIndex]}emit(t,e={}){this.events.push({type:t,t:this.t,...e})}fail(t,e={}){if(this.state!=="play")return;this.state="lost",this.cause={kind:t,...e},this.endT=this.t;let n=this.player;n.latch&&(n.latch=null),this.emit("fail",{cause:t,...e})}win(){this.state==="play"&&(this.state="won",this.endT=this.t,this.emit("win",{goal:this.goal.type}))}forceAt(t,e,n,s){let r=0,a=0;for(let o of this.wells){let l=o.x-t,c=o.y-e,h=l*l+c*c,d=o.range||20;if(h>d*d)continue;let u=Math.sqrt(h),f=o.soft||1.2,p=1-Xi(Ti((u-d*.6)/(d*.4),0,1)),y=o.gm/(h+f*f)*p;r+=l/(u||1)*y,a+=c/(u||1)*y}for(let o of this.fields)if(t>=o.x0&&t<=o.x1&&e>=o.y0&&e<=o.y1){let l=Math.min(t-o.x0,o.x1-t,e-o.y0,o.y1-e),c=Ti(l/3,0,1);r+=o.ax*c,a+=o.ay*c}for(let o of this.vents){if(!zo(o,n))continue;let l=Math.cos(o.dir),c=Math.sin(o.dir),h=t-o.x,d=e-o.y,u=l*h+c*d,f=-c*h+l*d;if(u<0||u>o.len||Math.abs(f)>o.width/2)continue;let p=(1-u/o.len)*.75+.25;r+=l*o.force*p,a+=c*o.force*p}if(this.tide){let o=this.tide(t,e);r+=o.ax,a+=o.ay}return s.ax=r,s.ay=a,s}step(t){let e=Yt.dt;this.t+=e;let n=this.player,s=this.state==="play";s&&!this.started&&(t.thrust||t.brake||t.turn)&&(this.started=!0,this.emit("start")),this.started&&s&&(this.playT+=e);for(let f of this.bodies){if(!f.motion)continue;let p=f.motion(this.t),y=f.motion(this.t-e);f.x=p.x,f.y=p.y,f.rot=p.rot,f.vx=(p.x-y.x)/e,f.vy=(p.y-y.y)/e,f.w=Wi(p.rot,y.rot)/e,Nc(f)}if(this.stage.update&&this.stage.update(this,e),this.state==="won"){this.stepDocked(e),this.stepNpc(e);return}let r=s?t:{turn:0,thrust:!1,brake:!1},a=r.turn*Yt.rotSpeed;n.turnRate+=(a-n.turnRate)*Math.min(1,Yt.rotResponse*e),n.tumble*=Math.exp(-(s?Yt.tumbleDecay:.15)*e),n.angle+=(n.turnRate+n.tumble)*e,n.turning=r.turn,n.grabCooldown=Math.max(0,n.grabCooldown-e),n.ghost&&(n.ghost.t-=e)<=0&&(n.ghost=null);for(let[f,p]of n.latchCooldown)p-e<=0?n.latchCooldown.delete(f):n.latchCooldown.set(f,p-e);if(n.latch){this.stepLatched(r,e),this.afterMove(e);return}let o=0,l=0,c=n.fuel>0;n.thrusting=!!(r.thrust&&c);let h=Math.hypot(n.vx,n.vy);n.braking=!!(r.brake&&c&&h>.02);let d=1/n.mass;if(n.thrusting&&(o+=Math.cos(n.angle)*Yt.thrust*d,l+=Math.sin(n.angle)*Yt.thrust*d,this.useFuel(Yt.fuelThrust*e)),n.braking){let f=Math.min(Yt.brake*d,h/e);o-=n.vx/h*f,l-=n.vy/h*f,this.useFuel(Yt.fuelBrake*e)}(r.thrust||r.brake)&&!c&&s&&!this._dryWarned&&(this._dryWarned=!0,this.emit("dry"));let u=this.forceAt(n.x,n.y,this.t,md);n.ax=o+u.ax,n.ay=l+u.ay,n.vx+=n.ax*e,n.vy+=n.ay*e,n.x+=n.vx*e,n.y+=n.vy*e,this.collidePlayer(e),this.afterMove(e)}useFuel(t){let e=this.player,n=Math.min(e.fuel,t);e.fuel-=n,this.stats.fuelUsed+=n}afterMove(t){let e=this.player,n=Math.hypot(e.vx,e.vy);if(n>this.stats.maxSpeed&&(this.stats.maxSpeed=n),this.stepNpc(t),this.state!=="play")return;for(let r of this.wells)if(Math.hypot(e.x-r.x,e.y-r.y)<r.core+Yt.radius*.4){this.fail("well",{well:r});return}for(let r of this.arcs)if(yd(r,this.t)&&_d(e.x,e.y,r.x0,r.y0,r.x1,r.y1)<Yt.radius+.25){this.fail("arc"),e.tumble+=9;return}for(let r of this.pickups)!r.taken&&Math.hypot(e.x-r.x,e.y-r.y)<1.4&&(r.taken=!0,e.fuel=Math.min(100,e.fuel+r.fuel),this.emit("pickup",{x:r.x,y:r.y,fuel:r.fuel}));let s=this.bounds;if(e.x<s.x0||e.x>s.x1||e.y<s.y0||e.y>s.y1){this.fail("void");return}this.checkGoal(t)}collidePlayer(t){let e=this.player,n=Yt.radius;for(let s=0;s<3;s++){let r=!1;for(let a of this.bodies)if(!(a.ghost||e.ghost&&e.ghost.body===a))for(let o of a.shapes){if(o.sensor)continue;let l=ko(o,e.x,e.y,n);if(!l)continue;r=!0;let c=a.vx-a.w*(l.py-a.y),h=a.vy+a.w*(l.px-a.x),d=e.vx-c,u=e.vy-h,f=d*l.nx+u*l.ny;if(e.x+=l.nx*l.pen,e.y+=l.ny*l.pen,f>=0)continue;let p=Math.hypot(d,u);if(this.state==="play"&&o.rail&&p<Yt.latchSpeed&&!e.latchCooldown.has(o)){this.latch(o,l,d,u);return}if(this.state==="play"&&-f>(o.soft?99:Yt.crashSpeed)){this.fail("impact",{speed:-f,x:l.px,y:l.py,nx:l.nx,ny:l.ny,style:o.style}),this.bounce(l,d,u,f,c,h,.55,!0);return}this.bounce(l,d,u,f,c,h,o.soft?.7:Yt.restitution,!1)}if(!r)break}}bounce(t,e,n,s,r,a,o,l){let c=this.player,h=-t.ny,d=t.nx,u=e*h+n*d,f=u*(1-Yt.friction),p=-s*o;c.vx=r+t.nx*p+h*f,c.vy=a+t.ny*p+d*f;let y=(u*.9+(this.rng()-.5)*-s*2.2)*(l?3.2:1);c.tumble+=y;let x=-s;x>.35||l?(this.stats.bumps++,this.emit(l?"crash":"bump",{x:t.px,y:t.py,nx:t.nx,ny:t.ny,strength:x,slide:Math.abs(u)})):Math.abs(u)>1.2&&this.emit("scrape",{x:t.px,y:t.py,nx:t.nx,ny:t.ny,slide:Math.abs(u)}),c.lastImpact=this.t}latch(t,e,n,s){let r=this.player,a=Math.cos(t.wrot),o=Math.sin(t.wrot),l=r.x-t.wx,c=r.y-t.wy,h=l*a+c*o,d=-o*l+a*c>=0?1:-1;h=Ti(h,-t.w/2+.4,t.w/2-.4),r.latch={sh:t,s:h,sdot:n*a+s*o,side:d},r.thrusting=!1,r.braking=!1,r.tumble*=.3,this.emit("latch",{x:e.px,y:e.py,rel:Math.hypot(n,s)})}stepLatched(t,e){let n=this.player,s=n.latch,r=s.sh,a=r.body;if(t.thrust&&n.fuel>0){let T=Math.cos(r.wrot),v=Math.sin(r.wrot);n.vx+=-v*s.side*1.2,n.vy+=T*s.side*1.2,n.latch=null,n.latchCooldown.set(r,1),n.ghost={body:a,t:.45},this.emit("release",{speed:Math.hypot(n.vx,n.vy)});return}n.thrusting=!1,n.braking=!!t.brake;let o=Math.cos(r.wrot),l=Math.sin(r.wrot),c=-l*s.side,h=o*s.side,d=r.h/2+Yt.radius+.03,u=r.wx+o*s.s+c*d,f=r.wy+l*s.s+h*d,p=u-a.x,y=f-a.y;s.sdot+=a.w*a.w*(p*o+y*l)*e,t.brake&&(s.sdot*=Math.exp(-5*e)),s.s+=s.sdot*e;let x=r.w/2-.4;(s.s>x||s.s<-x)&&(Math.abs(s.sdot)>1.5&&this.emit("clunk",{x:u,y:f,strength:Math.abs(s.sdot)}),s.s=Ti(s.s,-x,x),s.sdot=0),u=r.wx+o*s.s+c*d,f=r.wy+l*s.s+h*d;let m=a.vx-a.w*(f-a.y),b=a.vy+a.w*(u-a.x);n.vx=m+o*s.sdot,n.vy=b+l*s.sdot,n.x=u,n.y=f,n.ax=0,n.ay=0;for(let T of this.bodies)if(!(T===a||T.ghost))for(let v of T.shapes){if(v.sensor)continue;let w=ko(v,n.x,n.y,Yt.radius);if(!w)continue;let A=T.vx-T.w*(w.py-T.y),E=T.vy+T.w*(w.px-T.x),g=(n.vx-A)*w.nx+(n.vy-E)*w.ny;n.latch=null,n.latchCooldown.set(r,.8),-g>Yt.crashSpeed?(this.fail("impact",{speed:-g,x:w.px,y:w.py,nx:w.nx,ny:w.ny,style:v.style}),this.bounce(w,n.vx-A,n.vy-E,g,A,E,.55,!0)):(this.emit("knocked"),this.bounce(w,n.vx-A,n.vy-E,Math.min(g,0),A,E,Yt.restitution,!1));return}}stepDocked(t){let e=this.player,n=this.goal,s=Ze(this,n),r=1-Math.exp(-4*t);e.x+=(s.x-e.x)*r,e.y+=(s.y-e.y)*r,e.vx=s.vx,e.vy=s.vy;let a=n.dockAngle??Math.PI/2;e.angle+=Wi(a,e.angle)*r,e.tumble*=.9,e.turnRate*=.9,e.thrusting=!1,e.braking=!1}stepNpc(t){let e=this.npc;if(!e)return;let n=this.player;if(e.carried){let a=e.x-n.x,o=e.y-n.y,l=Math.hypot(a,o)||1,c=1.5,h=n.x+a/l*c,d=n.y+o/l*c,u=1-Math.exp(-7*t);e.x+=(h-e.x)*u,e.y+=(d-e.y)*u,e.vx=n.vx,e.vy=n.vy,e.angle+=e.spin*t,e.spin*=Math.exp(-.6*t);return}e.anchor&&(e.vx=Math.cos(this.t*.5)*.25,e.vy=Math.sin(this.t*.37)*.2);let s=this.forceAt(e.x,e.y,this.t,gd);e.vx+=s.ax*t,e.vy+=s.ay*t,e.x+=e.vx*t,e.y+=e.vy*t,e.angle+=e.spin*t;for(let a of this.bodies)for(let o of a.shapes){if(o.sensor)continue;let l=ko(o,e.x,e.y,e.r);if(!l)continue;e.x+=l.nx*l.pen,e.y+=l.ny*l.pen;let c=(e.vx-a.vx)*l.nx+(e.vy-a.vy)*l.ny;c<0&&(e.vx-=1.4*c*l.nx,e.vy-=1.4*c*l.ny,e.anchor=!1,e.spin+=(this.rng()-.5)*4,-c>1&&this.emit("npcbump",{x:l.px,y:l.py,strength:-c}))}if(this.state!=="play")return;for(let a of this.wells)if(Math.hypot(e.x-a.x,e.y-a.y)<a.core+.3){this.fail("npcwell");return}let r=this.bounds;if(e.x<r.x0||e.x>r.x1||e.y<r.y0||e.y>r.y1){this.fail("npcvoid");return}}checkGoal(t){let e=this.player,n=this.goal;if(!n)return;if(n.type==="rescue"){let o=this.npc,l=e.x-o.x,c=e.y-o.y,h=Math.hypot(l,c);if(h<Yt.radius+o.r+.25){let d=e.vx-o.vx,u=e.vy-o.vy,f=Math.hypot(d,u);if(f<=n.maxSpeed)o.carried=!0,o.anchor=!1,e.mass=n.mass||1.9,e.vx=(e.vx+o.vx)/2,e.vy=(e.vy+o.vy)/2,this.emit("rescue",{x:o.x,y:o.y,rel:f,limit:n.maxSpeed}),this.goalIndex++;else if(e.grabCooldown<=0){let p=l/(h||1),y=c/(h||1),x=d*p+u*y;if(x<0){let m=-x*.9;e.vx+=p*m,e.vy+=y*m,o.vx-=p*m,o.vy-=y*m,o.anchor=!1,o.spin+=(this.rng()-.5)*6,e.tumble+=(this.rng()-.5)*5,e.grabCooldown=Yt.grabCooldown,this.emit("shove",{x:o.x,y:o.y,rel:f,limit:n.maxSpeed})}}}return}let s=Ze(this,n),r=Math.hypot(e.vx-s.vx,e.vy-s.vy),a;if(n.shape==="box"){let o=Math.cos(-s.rot),l=Math.sin(-s.rot),c=e.x-s.x,h=e.y-s.y,d=o*c-l*h,u=l*c+o*h;a=Math.abs(d)<n.w/2&&Math.abs(u)<n.h/2}else a=Math.hypot(e.x-s.x,e.y-s.y)<n.r;a&&(r<=n.maxSpeed?(this.emit("capture",{x:s.x,y:s.y,rel:r,limit:n.maxSpeed,goalType:n.type}),this.goalIndex<this.goals.length-1?this.goalIndex++:this.win()):e.grabCooldown<=0&&(e.grabCooldown=Yt.grabCooldown,e.tumble+=(this.rng()<.5?-1:1)*(2+r*.6),e.vx=s.vx+(e.vx-s.vx)*.82,e.vy=s.vy+(e.vy-s.vy)*.82,this.emit("slip",{x:s.x,y:s.y,rel:r,limit:n.maxSpeed,goalType:n.type})))}predict(t,e,n){let s=this.player,r=s.x,a=s.y,o=s.vx,l=s.vy;if(s.latch){let p=s.latch.sh;o+=-Math.sin(p.wrot)*s.latch.side*1.2,l+=Math.cos(p.wrot)*s.latch.side*1.2}let c=Math.floor(t/e);n.length=0;let h=4,d=e/h,u=Yt.radius,f=s.latch?s.latch.sh.body:null;for(let p=1;p<=c;p++){for(let m=0;m<h;m++){let b=this.forceAt(r,a,this.t+(p-1)*e+m*d,xd);o+=b.ax*d,l+=b.ay*d,r+=o*d,a+=l*d}let y=this.t+p*e,x={x:r,y:a,hit:null,danger:!1};for(let m of this.wells)Math.hypot(r-m.x,a-m.y)<m.core+.3&&(x.hit="well",x.danger=!0);if(!x.hit)for(let m of this.bodies){if(m===f&&p*e<1.5)continue;let b=pd(m,y),T=Math.cos(b.rot),v=Math.sin(b.rot);for(let w of m.shapes){if(w.sensor)continue;let A=b.x+T*w.lx-v*w.ly,E=b.y+v*w.lx+T*w.ly,g=w.type==="circle"?Uc(r,a,u,A,E,w.r):Dc(r,a,u,A,E,b.rot+w.lrot,w.w/2,w.h/2);if(!g)continue;let M=0,R=0;if(m.motion){let P=m.motion(y-.02);M=(b.x-P.x)/.02,R=(b.y-P.y)/.02;let N=Wi(b.rot,P.rot)/.02;M-=N*(g.py-b.y),R+=N*(g.px-b.x)}let I=(o-M)*g.nx+(l-R)*g.ny;x.hit=w.rail&&Math.hypot(o-M,l-R)<Yt.latchSpeed?"rail":"wall",x.danger=x.hit==="wall"&&-I>Yt.crashSpeed,x.speed=-I;break}if(x.hit)break}if(n.push(x),x.hit)break}return n}},md={ax:0,ay:0},gd={ax:0,ay:0},xd={ax:0,ay:0};function Xi(i){return i*i*(3-2*i)}function Wi(i,t){let e=i-t;for(;e>Math.PI;)e-=Math.PI*2;for(;e<-Math.PI;)e+=Math.PI*2;return e}function zo(i,t){return((t+(i.phase||0))%i.period+i.period)%i.period<i.on}function Fc(i,t){let e=((t+(i.phase||0))%i.period+i.period)%i.period;if(e<i.on)return 1;let n=i.period-e;return n<1.2?1-n/1.2:0}function yd(i,t){return((t+(i.phase||0))%i.period+i.period)%i.period<i.on}function _d(i,t,e,n,s,r){let a=s-e,o=r-n,l=a*a+o*o||1,c=Ti(((i-e)*a+(t-n)*o)/l,0,1);return Math.hypot(i-(e+a*c),t-(n+o*c))}function Ze(i,t){if(!t.body)return{x:t.x,y:t.y,rot:t.rot||0,vx:0,vy:0};let e=i.bodies.find(o=>o.tag===t.body),n=Math.cos(e.rot),s=Math.sin(e.rot),r=e.x+n*t.x-s*t.y,a=e.y+s*t.x+n*t.y;return{x:r,y:a,rot:e.rot+(t.rot||0),vx:e.vx-e.w*(a-e.y),vy:e.vy+e.w*(r-e.x)}}var xr=i=>i<0?0:i>1?1:i,Vo={right:0,up:Math.PI/2,left:Math.PI,down:-Math.PI/2},yr=i=>typeof i=="string"?Vo[i]:i,Oc=["hull","truss","strut","crate","door","frame","rail","hub","blade","shuttle","debris","rock"];function Ae(i,t,e,n,s=[]){for(let[r,a]of Object.entries(t)){let o=a.endsWith("?"),l=o?a.slice(0,-1):a,c=i[r];if(c===void 0){o||n.push(`${e}.${r}: required (${l})`);continue}let h=vd(c,l);h&&n.push(`${e}.${r}: ${h}`)}for(let r of Object.keys(i))!(r in t)&&!s.includes(r)&&n.push(`${e}: unknown field "${r}"`)}var dn=i=>typeof i=="number"&&Number.isFinite(i);function vd(i,t){if(t.startsWith("enum:"))return t.slice(5).split("|").includes(i)?null:`must be one of ${t.slice(5)}`;switch(t){case"num":return dn(i)?null:"must be a finite number";case"pos":return dn(i)&&i>0?null:"must be > 0";case"nonneg":return dn(i)&&i>=0?null:"must be >= 0";case"vec2":return Array.isArray(i)&&i.length===2&&i.every(dn)?null:"must be [x, y]";case"rect":return Array.isArray(i)&&i.length===4&&i.every(dn)&&i[2]>i[0]&&i[3]>i[1]?null:"must be [x0, y0, x1, y1] with x1 > x0 and y1 > y0";case"str":return typeof i=="string"&&i.length?null:"must be a non-empty string";case"bool":return typeof i=="boolean"?null:"must be true/false";case"angle":return dn(i)||i in Vo?null:`must be radians or one of ${Object.keys(Vo).join("/")}`;case"style":return Oc.includes(i)?null:`unknown style "${i}" (known: ${Oc.join(", ")})`;case"timeRef":return dn(i)||i===null||i&&typeof i.mover=="string"&&dn(i.x)?null:"must be seconds, null, or { mover, x, offset? }";case"cond":return i&&typeof i=="object"?null:"must be a condition object";case"any":return null;default:return`unknown schema type ${t}`}}var vs={box:{schema:{box:"rect",style:"style?",rail:"bool?",soft:"bool?"},build:i=>({type:"box",lx:(i.box[0]+i.box[2])/2,ly:(i.box[1]+i.box[3])/2,w:Math.abs(i.box[2]-i.box[0]),h:Math.abs(i.box[3]-i.box[1]),style:i.style||"hull"})},rect:{schema:{rect:"any",rot:"num?",style:"style?",rail:"bool?",soft:"bool?"},build:i=>({type:"box",lx:i.rect[0],ly:i.rect[1],w:i.rect[2],h:i.rect[3],...i.rot?{lrot:i.rot}:{},style:i.style||"hull"})},beam:{schema:{beam:"any",thick:"pos",style:"style?",rail:"bool?",soft:"bool?"},build:i=>{let[t,e,n,s]=i.beam,r=n-t,a=s-e;return{type:"box",lx:(t+n)/2,ly:(e+s)/2,w:Math.hypot(r,a),h:i.thick,lrot:Math.atan2(a,r),style:i.style||"strut"}}},circle:{schema:{circle:"any",style:"style?",rail:"bool?",soft:"bool?"},build:i=>({type:"circle",lx:i.circle[0],ly:i.circle[1],r:i.circle[2],style:i.style||"rock"})}};function Bc(i){return Object.keys(vs).find(t=>t in i)}function Ho(i){let t=vs[Bc(i)].build(i);return i.rail&&(t.rail=!0),i.soft&&(t.soft=!0),t}function Go(i,t,e){let n=Bc(i);if(!n){e.push(`${t}: shape needs one of ${Object.keys(vs).join("/")}`);return}Ae(i,vs[n].schema,t,e);let s=i[n];n==="rect"&&!(Array.isArray(s)&&s.length===4&&s.every(dn)&&s[2]>0&&s[3]>0)&&e.push(`${t}.rect: must be [cx, cy, w>0, h>0]`),n==="circle"&&!(Array.isArray(s)&&s.length===3&&s.every(dn)&&s[2]>0)&&e.push(`${t}.circle: must be [cx, cy, r>0]`),n==="beam"&&!(Array.isArray(s)&&s.length===4&&s.every(dn)&&(s[0]!==s[2]||s[1]!==s[3]))&&e.push(`${t}.beam: must be two distinct points [x0, y0, x1, y1]`)}var Ms={rotor:{schema:{type:"str",at:"vec2",omega:"num",phase:"num?"},build:i=>{let[t,e]=i.at,n=i.omega,s=i.phase||0;return{x:t,y:e,motion:r=>({x:t,y:e,rot:s+n*r})}}},linear:{schema:{type:"str",from:"vec2",vel:"vec2",rot:"num?"},build:i=>{let[t,e]=i.from,[n,s]=i.vel,r=i.rot||0;return{x:t,y:e,motion:a=>({x:t+n*a,y:e+s*a,rot:r}),timeAtX:a=>(a-t)/n}}},"linear-decelerate":{schema:{type:"str",from:"vec2",speed:"pos",decelAt:"num",decel:"pos"},build:i=>{let[t,e]=i.from,n=i.speed,s=i.decelAt,r=i.decel,a=(s-t)/n,o=l=>{if(l<a)return t+n*l;let c=Math.min(l-a,n/r);return s+n*c-.5*r*c*c};return{x:t,y:e,motion:l=>({x:o(l),y:e,rot:0}),timeAtX:l=>(l-t)/n}}},orbit:{schema:{type:"str",center:"vec2",radii:"vec2",period:"pos",phase:"num?",spin:"num?"},build:i=>{let[t,e]=i.center,[n,s]=i.radii,r=i.period,a=i.phase||0,o=i.spin||0;return{x:t,y:e,motion:l=>{let c=a+l/r*Math.PI*2;return{x:t+Math.cos(c)*n,y:e+Math.sin(c)*s,rot:o*l+a}}}}},"cycle-door":{schema:{type:"str",at:"vec2",slide:"vec2",period:"pos",phase:"num?",openAt:"num?",closeAt:"num?",ramp:"pos?",warn:"vec2?"},build:i=>{let[t,e]=i.at,[n,s]=i.slide,r=i.period,a=i.phase||0,o=i.openAt??.02,l=i.closeAt??.6,c=i.ramp??.14,[h,d]=i.warn||[.42,.75],u=f=>{let p=(f+a)%r/r;return Xi(xr((p-o)/c))*(1-Xi(xr((p-l)/c)))};return{x:t,y:e,motion:f=>{let p=u(f);return{x:t+n*p,y:e+s*p,rot:0}},status:f=>{let p=(f+a)%r/r;return p>h&&p<d?2:u(f)>.9?1:0}}}},"window-door":{schema:{type:"str",at:"vec2",slide:"vec2",open:"timeRef",close:"timeRef",rampOpen:"pos?",rampClose:"pos?",warnLead:"nonneg?",warnLag:"nonneg?",openDelay:"nonneg?"},build:(i,t)=>{let[e,n]=i.at,[s,r]=i.slide,a=i.open===null?-1/0:t(i.open),o=t(i.close),l=i.rampOpen??1.4,c=i.rampClose??1.6,h=i.warnLead??1.5,d=i.warnLag??1.6,u=i.openDelay??1.2;return{x:e,y:n,motion:f=>{let p=Xi(xr((f-a)/l))*(1-Xi(xr((f-o)/c)));return{x:e+s*p,y:n+r*p,rot:0}},status:f=>f>o-h&&f<o+d?2:f>a+u&&f<o?1:0}}}},_r={grab:{schema:{type:"str",at:"vec2",r:"pos",maxSpeed:"pos",face:"angle?",label:"str?",on:"str?"},label:"HANDHOLD"},"mag-plate":{schema:{type:"str",at:"vec2",r:"pos",maxSpeed:"pos",face:"angle?",label:"str?",on:"str?"},label:"MAG PLATE"},airlock:{schema:{type:"str",at:"vec2",dir:"enum:left|up",length:"pos?",height:"pos?",depth:"pos?",half:"pos?",maxSpeed:"pos?",label:"str?"},label:"AIRLOCK"},rescue:{schema:{type:"str",npc:"any",maxSpeed:"pos",mass:"pos?",label:"str?"},label:"RESCUE"}};function kc(i){if(i.type==="grab"||i.type==="mag-plate"){let t={type:"grab",shape:"circle",label:i.label||_r[i.type].label,x:i.at[0],y:i.at[1],r:i.r,maxSpeed:i.maxSpeed,dockAngle:yr(i.face??0)};return i.on&&(t.body=i.on),{goal:t}}if(i.type==="airlock"){let[t,e]=i.at,n=i.dir,s=i.depth??3.6,r=i.half??1.9,a=i.length??14,o=i.height??18,l=(d,u,f,p)=>vs.box.build({box:[d,u,f,p]}),c,h;return n==="left"?(c=[l(t,e+r,t+a,e+o/2),l(t,e-o/2,t+a,e-r),l(t+s,e-r,t+a,e+r)],h={x:t+s/2+.25,y:e,w:s-.5,h:r*2-.6,dockAngle:0}):(c=[l(t-o/2,e-a,t-r,e),l(t+r,e-a,t+o/2,e),l(t-r,e-a,t+r,e-s)],h={x:t,y:e-s/2-.25,w:r*2-.6,h:s-.5,dockAngle:-Math.PI/2}),{body:{shapes:c},goal:{type:"dock",shape:"box",label:i.label||"AIRLOCK",maxSpeed:i.maxSpeed??1.5,mouth:{x:t,y:e,dir:n},...h}}}if(i.type==="rescue"){let t=i.npc,e={type:"rescue",label:i.label||"RESCUE",maxSpeed:i.maxSpeed};return i.mass!==void 0&&(e.mass=i.mass),{goal:e,npc:{x:t.at[0],y:t.at[1],...t.anchor!==void 0?{anchor:t.anchor}:{},...t.spin!==void 0?{spin:t.spin}:{},...t.vel?{vx:t.vel[0],vy:t.vel[1]}:{}}}}throw new Error(`unknown goal type ${i.type}`)}var fn={well:{schema:{at:"vec2",gm:"pos",core:"pos",soft:"pos?",range:"pos?"},build:i=>({x:i.at[0],y:i.at[1],gm:i.gm,core:i.core,...i.soft!==void 0?{soft:i.soft}:{},...i.range!==void 0?{range:i.range}:{}})},field:{schema:{type:"enum:shear|constant",rect:"rect",accel:"vec2"},build:i=>({x0:i.rect[0],x1:i.rect[2],y0:i.rect[1],y1:i.rect[3],ax:i.accel[0],ay:i.accel[1],kind:i.type})},vent:{schema:{at:"vec2",dir:"angle",len:"pos",width:"pos",force:"pos",period:"pos",on:"pos",phase:"num?"},build:i=>({x:i.at[0],y:i.at[1],dir:yr(i.dir),len:i.len,width:i.width,force:i.force,period:i.period,on:i.on,phase:i.phase||0})},tide:{schema:{base:"num",from:"num",gradient:"num"},build:i=>{let t=i.base,e=i.from,n=i.gradient;return s=>({ax:t+Math.max(0,s-e)*n,ay:0})}},pickup:{schema:{at:"vec2",fuel:"pos"},build:i=>({x:i.at[0],y:i.at[1],fuel:i.fuel})}},zc={deadline:{schema:{type:"str",at:"timeRef",grace:"nonneg?",failIf:"cond",cause:"str"}}};var vr={started:i=>t=>t.started===i,speedAbove:i=>t=>Math.hypot(t.player.vx,t.player.vy)>i,slowerThan:i=>t=>Math.hypot(t.player.vx,t.player.vy)<i,xAbove:i=>t=>t.player.x>i,xBelow:i=>t=>t.player.x<i,yAbove:i=>t=>t.player.y>i,yBelow:i=>t=>t.player.y<i,vxAbove:i=>t=>t.player.vx>i,near:([i,t,e])=>n=>Math.hypot(n.player.x-i,n.player.y-t)<e,latched:i=>t=>!!t.player.latch===i,goalIndex:i=>t=>t.goalIndex===i,timeAbove:i=>t=>t.t>i,nearVent:({dx:i,yAbove:t})=>e=>e.vents.some(n=>Math.abs(e.player.x-n.x)<i&&e.player.y>t),phase:({period:i,from:t,to:e})=>n=>{let s=n.t%i;return s>t&&s<e},rotorAngle:({mover:i,mod:t,from:e,to:n})=>s=>{let a=(s.bodies.find(o=>o.tag===i).rot%t+t)%t;return a>e&&a<n},moverStatus:({mover:i,is:t})=>e=>e.bodies.find(n=>n.tag===i).status(e.t)===t,any:i=>{let t=i.map(zn);return e=>t.some(n=>n(e))},not:i=>{let t=zn(i);return e=>!t(e)}},Md=Object.keys(vr);function zn(i){let e=Object.keys(i).map(n=>{if(!vr[n])throw new Error(`unknown condition "${n}"`);return vr[n](i[n])});return e.length===1?e[0]:n=>{for(let s of e)if(!s(n))return!1;return!0}}function Vn(i,t,e){if(!i||typeof i!="object"||Array.isArray(i)){e.push(`${t}: condition must be an object`);return}for(let n of Object.keys(i))vr[n]?n==="any"?(Array.isArray(i.any)?i.any:[]).forEach((s,r)=>Vn(s,`${t}.any[${r}]`,e)):n==="not"&&Vn(i.not,`${t}.not`,e):e.push(`${t}: unknown condition "${n}" (known: ${Md.join(", ")})`)}var bs={turn:0,thrust:!1,brake:!1};function bd(i,t,e){let n=i.player,s=t-n.vx,r=e-n.vy,a=Math.hypot(s,r),o=Math.hypot(n.vx,n.vy),l={turn:0,thrust:!1,brake:!1};if(a<.25)return l;o>.3&&(s*n.vx+r*n.vy)/(a*o)<-.85&&(l.brake=!0);let c=Wi(Math.atan2(r,s),n.angle);return l.turn=Math.max(-1,Math.min(1,c*3-n.turnRate*.12)),!l.brake&&Math.abs(c)<.3&&(l.thrust=!0),l}function Hn(i,t,e,n=0,s=0,r=5,a=1){let o=i.player,l=t-o.x,c=e-o.y,h=Math.hypot(l,c),d=Math.min(r,Math.sqrt(2*Yt.brake/o.mass*Math.max(0,h-.5))*.7+a*Math.min(1,h/3));return bd(i,n+l/(h||1)*d,s+c/(h||1)*d)}function Sd(i,t=.6,e=4){let n=i.goal,s=Ze(i,n);if(n.mouth){let r=n.mouth,a=i.player,o=r.dir==="left"?-4:0,l=r.dir==="up"?4:0;if(!(r.dir==="left"?Math.abs(a.y-r.y)<.8||a.x>r.x-.5:Math.abs(a.x-r.x)<.8||a.y<r.y+.5))return Hn(i,r.x+o,r.y+l,0,0,e,.3)}return Hn(i,s.x,s.y,s.vx,s.vy,e,t)}var Wo=(i,[t,e,n,s])=>Hn(i,t,e,0,0,n,s),Vc=i=>Math.max(-1,Math.min(1,i)),Xo={waypoints(i,t,e){let n=i.waypoints;if(t.i=t.i||0,t.i>=n.length)return{next:!0};let[s,r,a=5,o=2.5,l]=n[t.i];if(l&&(t.waits=t.waits||[],t.waits[t.i]||(t.waits[t.i]=zn(l))),l&&!t.waits[t.i](e))return{input:Hn(e,e.player.x,e.player.y,0,0,1,0)};Math.hypot(e.player.x-s,e.player.y-r)<o&&t.i++;let c=Hn(e,s,r,0,0,a,a*(i.arriveK??.75));return t.i>=n.length?{input:c,next:!0}:{input:c}},aim(i,t,e){let n=e.player,s=Wi(i.aim,n.angle);if(!t.burning)return Math.abs(s)<.03&&(t.burning=!0),{input:{turn:Vc(s*4),thrust:!1,brake:!1}};let r={turn:Vc(s*4),thrust:!0,brake:!1};return Math.hypot(n.vx,n.vy)>=i.burnTo?{input:r,next:!0}:{input:r}},hold(i,t,e){return t.until=t.until||zn(i.until),t.until(e)?{next:!0}:{input:Wo(e,i.hold)}},ride(i,t,e){let n=e.player;if(!n.latch)return{input:bs};let s=i.ride,r=e.predict(s.horizon??7,s.step??.08,[]),a=Ze(e,e.goal),o=1e9;for(let l of r)o=Math.min(o,Math.hypot(l.x-a.x,l.y-a.y));return o<s.releaseWithin&&n.vx>(s.minVx??-1/0)?{input:{turn:0,thrust:!0,brake:!1},next:!0}:{input:bs}},rescue(i,t,e){if(!e.goal||e.goal.type!=="rescue")return{next:!0};let n=e.npc;return{input:Hn(e,n.x,n.y,n.vx,n.vy,i.rescue.vmax,i.rescue.arrive)}},chase(i,t,e){let n=i.chase,s=Ze(e,e.goal),r=e.player;if(s.x<r.x-n.waitBehind)return{input:Hn(e,r.x,n.holdY,0,0,2,.2)};let a=Math.abs(s.x-r.x)<n.settleDx?s.y:s.y+n.hover;return{input:Hn(e,s.x,a,s.vx,s.vy,n.vmax,n.arrive)}},gate(i,t,e){let n=i.gate;if(!(e.player.x<n.whileXBelow))return{next:!0};let s=e.bodies.find(r=>r.tag===n.mover);return{input:Wo(e,s.status(e.t)===1?n.go:n.hold)}},goal(i,t,e){return{input:Sd(e,i.goal.arrive,i.goal.vmax)}},goTo(i,t,e){let n=i.goTo;if(Array.isArray(n))return{input:Wo(e,n)};let s=Ze(e,e.goal),[r,a]=n.offset||[0,0];return{input:Hn(e,s.x+r,s.y+a,0,0,n.vmax,n.arrive)}},branch(i,t,e){let n=i.branch;t.cond=t.cond||zn(n.if);let s=t.cond(e)?n.then:n.else;return{input:Xo[Mr(s)](s,{},e).input||bs}},idle(){return{input:bs}}},Hc=Object.keys(Xo),Mr=i=>Hc.find(t=>t in i);function Gc(i){let t=i.map(()=>({})),e=0;return n=>{for(;e<i.length;){let s=Xo[Mr(i[e])](i[e],t[e],n);if(s.next&&e++,s.input)return s.input}return bs}}function Wc(i,t,e){if(!Array.isArray(i)||!i.length){e.push(`${t}: plan must be a non-empty array of steps`);return}i.forEach((n,s)=>{let r=`${t}[${s}]`,a=n&&Mr(n);if(!a){e.push(`${r}: unknown plan step (known: ${Hc.join(", ")})`);return}if(a==="waypoints"&&(!Array.isArray(n.waypoints)||!n.waypoints.length?e.push(`${r}.waypoints: needs at least one [x, y, vmax?, r?]`):n.waypoints.forEach((o,l)=>{!Array.isArray(o)||o.length<2||!o.slice(0,4).every(c=>typeof c=="number"&&Number.isFinite(c))?e.push(`${r}.waypoints[${l}]: must be [x, y, vmax?, r?, waitCond?]`):o[4]&&Vn(o[4],`${r}.waypoints[${l}][4]`,e)})),a==="hold"&&Vn(n.until,`${r}.until`,e),a==="branch"){Vn(n.branch.if,`${r}.branch.if`,e);for(let o of["then","else"]){let l=n.branch[o],c=l&&Mr(l);["idle","goal","goTo"].includes(c)||e.push(`${r}.branch.${o}: must be an idle, goal or goTo step`)}}})}var Ed={id:"str",num:"num?",name:"str",chapter:"str?",brief:"str?",par:"any?",look:"any?",start:"any",fuel:"pos?",bounds:"rect",seed:"num?",solids:"any?",movers:"any?",goals:"any",wells:"any?",fields:"any?",vents:"any?",tide:"any?",pickups:"any?",rules:"any?",hints:"any?",routes:"any?",notes:"str?",experimental:"bool?",teaches:"any?"},Td={hole:"pos?",holeX:"num?",holeY:"num?",warm:"num?",final:"bool?",landmark:"enum:none|ring?",ringX:"num?",spineY:"num?",fgDensity:"pos?",debris:"nonneg?"};function wd(i){let t=[];if(!i||typeof i!="object")return["spec: must be an object"];let e=i.id||"spec";Ae(i,Ed,e,t),i.start&&Ae(i.start,{at:"vec2",angle:"angle?",vel:"vec2?"},`${e}.start`,t);let n=l=>i[l]===void 0?[]:Array.isArray(i[l])?i[l]:(t.push(`${e}.${l}: must be an array`),[]);n("solids").forEach((l,c)=>Go(l,`${e}.solids[${c}]`,t));let s=new Set;n("movers").forEach((l,c)=>{let h=`${e}.movers[${c}]`;Ae(l,{id:"str",motion:"any",shapes:"any"},h,t),l.id&&s.has(l.id)&&t.push(`${h}.id: duplicate mover id "${l.id}"`),l.id&&s.add(l.id),!Array.isArray(l.shapes)||!l.shapes.length?t.push(`${h}.shapes: needs at least one shape`):l.shapes.forEach((u,f)=>Go(u,`${h}.shapes[${f}]`,t));let d=l.motion&&Ms[l.motion.type];d?Ae(l.motion,d.schema,`${h}.motion`,t):t.push(`${h}.motion.type: unknown motion "${l.motion&&l.motion.type}" (known: ${Object.keys(Ms).join(", ")})`)});let r=[];n("movers").forEach((l,c)=>{for(let h of["open","close"])l.motion&&l.motion[h]&&typeof l.motion[h]=="object"&&r.push([`${e}.movers[${c}].motion.${h}`,l.motion[h]])});let a=n("goals");a.length||t.push(`${e}.goals: at least one goal is required`),a.forEach((l,c)=>{let h=`${e}.goals[${c}]`,d=_r[l.type];if(!d){t.push(`${h}.type: unknown goal "${l.type}" (known: ${Object.keys(_r).join(", ")})`);return}Ae(l,d.schema,h,t),l.on&&!s.has(l.on)&&t.push(`${h}.on: no mover with id "${l.on}"`),l.type==="rescue"&&Ae(l.npc||{},{at:"vec2",anchor:"bool?",spin:"num?",vel:"vec2?"},`${h}.npc`,t)}),a.filter(l=>l.type==="rescue").length>1&&t.push(`${e}.goals: only one rescue goal per stage`),n("wells").forEach((l,c)=>Ae(l,fn.well.schema,`${e}.wells[${c}]`,t)),n("fields").forEach((l,c)=>Ae(l,fn.field.schema,`${e}.fields[${c}]`,t)),n("vents").forEach((l,c)=>Ae(l,fn.vent.schema,`${e}.vents[${c}]`,t)),n("pickups").forEach((l,c)=>Ae(l,fn.pickup.schema,`${e}.pickups[${c}]`,t)),i.tide!==void 0&&Ae(i.tide,fn.tide.schema,`${e}.tide`,t),n("rules").forEach((l,c)=>{let h=zc[l.type];if(!h){t.push(`${e}.rules[${c}].type: unknown rule "${l.type}"`);return}Ae(l,h.schema,`${e}.rules[${c}]`,t),l.failIf&&Vn(l.failIf,`${e}.rules[${c}].failIf`,t),l.at&&typeof l.at=="object"&&r.push([`${e}.rules[${c}].at`,l.at])});for(let[l,c]of r){let h=n("movers").find(d=>d.id===c.mover);h?["linear","linear-decelerate"].includes(h.motion.type)||t.push(`${l}: mover "${c.mover}" has no position schedule (needs linear motion)`):t.push(`${l}: no mover with id "${c.mover}"`)}n("hints").forEach((l,c)=>{let h=`${e}.hints[${c}]`;Ae(l,{text:"str",at:"enum:start?",when:"cond?",dur:"pos?"},h,t),!l.at&&!l.when&&t.push(`${h}: needs at: "start" or a when condition`),l.when&&Vn(l.when,`${h}.when`,t)});let o=new Set;return n("routes").forEach((l,c)=>{let h=`${e}.routes[${c}]`;Ae(l,{id:"str",label:"str?",risk:"enum:safe|medium|risky?",plan:"any",notes:"str?"},h,t),o.has(l.id)&&t.push(`${h}.id: duplicate route id "${l.id}"`),o.add(l.id),Wc(l.plan,`${h}.plan`,t)}),i.par&&Ae(i.par,{time:"pos",fuel:"pos"},`${e}.par`,t),i.look&&Ae(i.look,Td,`${e}.look`,t),t}var qo=class extends Error{constructor(t,e){super(`stage "${t}" has ${e.length} spec error(s):
  ${e.join(`
  `)}`),this.errors=e}};function Yo(i){let t=wd(i);if(t.length)throw new qo(i&&i.id,t);let e=(i.hints||[]).map(s=>s.at?{at:s.at,text:s.text}:{when:zn(s.when),text:s.text,...s.dur!==void 0?{dur:s.dur}:{}}),n=()=>{let s=(i.movers||[]).map(d=>({m:d,mo:null})),r=d=>{let u=i.movers.find(f=>f.id===d);return Ms[u.motion.type].build(u.motion,()=>0).timeAtX},a=d=>typeof d=="number"?d:r(d.mover)(d.x)+(d.offset||0);for(let d of s)d.mo=Ms[d.m.motion.type].build(d.m.motion,a);let o=[];i.solids&&i.solids.length&&o.push({shapes:i.solids.map(Ho)});for(let{m:d,mo:u}of s){let f={tag:d.id,x:u.x,y:u.y,shapes:d.shapes.map(Ho),motion:u.motion};u.status&&(f.status=u.status),o.push(f)}let l=[],c=null;for(let d of i.goals){let u=kc(d);u.body&&o.push(u.body),u.npc&&(c=u.npc),l.push(u.goal)}let h={start:{x:i.start.at[0],y:i.start.at[1],angle:yr(i.start.angle??0),...i.start.vel?{vx:i.start.vel[0],vy:i.start.vel[1]}:{}},fuel:i.fuel??100,bounds:{x0:i.bounds[0],x1:i.bounds[2],y0:i.bounds[1],y1:i.bounds[3]},bodies:o,goals:l};if(i.seed!==void 0&&(h.seed=i.seed),i.wells&&(h.wells=i.wells.map(fn.well.build)),i.fields&&(h.fields=i.fields.map(fn.field.build)),i.vents&&(h.vents=i.vents.map(fn.vent.build)),i.pickups&&(h.pickups=i.pickups.map(fn.pickup.build)),i.tide&&(h.tide=fn.tide.build(i.tide)),c&&(h.npc=c),i.rules&&i.rules.length){let d=i.rules.map(u=>({at:a(u.at)+(u.grace||0),failIf:zn(u.failIf),cause:u.cause}));h.update=u=>{for(let f of d)u.state==="play"&&u.t>f.at&&f.failIf(u)&&u.fail(f.cause)}}return h};return{id:i.id,num:i.num??0,name:i.name,chapter:i.chapter||"",brief:i.brief||"",par:i.par||{time:60,fuel:60},look:i.look||{},hints:e,routes:(i.routes||[]).map(s=>({id:s.id,label:s.label||s.id,risk:s.risk||"medium",plan:s.plan})),experimental:!!i.experimental,spec:i,build:n}}var Xc={id:"first-drift",num:1,name:"FIRST DRIFT",chapter:"OUTER TRUSS",brief:"Reach the airlock. Arrive under 1.5 m/s.",teaches:["thrust","brake"],par:{time:22,fuel:30},look:{hole:.55,holeX:.78,holeY:.7,warm:.6},start:{at:[0,0],angle:"right"},fuel:100,bounds:[-16,-24,125,24],solids:[{box:[-16,-7,-5,7]},{box:[-5,7,92,8.6],style:"truss"},{box:[-5,-8.6,92,-7],style:"truss"},{box:[26,-7,30.5,-2.6],style:"crate"},{box:[48.5,2.4,51.5,7],style:"strut"},{box:[66,-7,70,-1.4]},{box:[71.5,2.8,74,7],style:"strut"}],goals:[{type:"airlock",at:[92,0],dir:"left",length:22,height:22}],hints:[{at:"start",text:"HOLD  W / \u25B2  TO THRUST"},{when:{started:!0,speedAbove:2.2},text:"LET GO.  DRIFT IS FREE.",dur:2.2},{when:{xAbove:52},text:"S / \u25BC  BRAKES AGAINST YOUR MOTION",dur:3.2},{when:{xAbove:78,speedAbove:1.5},text:"TOO HOT \u2014 BRAKE BRAKE BRAKE",dur:1.8}],routes:[{id:"main",risk:"safe",plan:[{waypoints:[[20,0,6],[60,-.5,6],[70,.7,4,2]]},{goal:{arrive:.6,vmax:5}}]}]};var qc={id:"dogleg",num:2,name:"DOGLEG",chapter:"OUTER TRUSS",brief:"Grab the handhold. Under 2.0 m/s. Plan your stops early.",teaches:["turning-stops"],par:{time:28,fuel:45},look:{hole:.6,holeX:.25,holeY:.72,warm:.4},start:{at:[0,0],angle:"right"},fuel:85,bounds:[-14,-16,72,50],solids:[{box:[-14,-8,62,-4],style:"truss"},{box:[-14,4,42,28]},{box:[56,-8,66,44]},{box:[-14,36,66,42]},{box:[-14,28,-3,36]},{box:[46.5,15,50,18.5],style:"crate"},{box:[22,28,25,31.2],style:"strut"},{box:[5,33.6,7,36],style:"strut"}],goals:[{type:"grab",at:[6,32.1],r:1.45,maxSpeed:2,face:"left"}],hints:[{at:"start",text:"THE CORRIDOR TURNS.  YOUR MOMENTUM WON'T."},{when:{xAbove:30,yBelow:4,vxAbove:3.4},text:"WALL AHEAD.  STOP BEFORE THE SHAFT.",dur:2},{when:{yAbove:26},text:"TURN, BURN, AND START BRAKING EARLY",dur:2.6}],routes:[{id:"main",risk:"safe",plan:[{waypoints:[[44,0,6,3],[53,8,4,3],[53,24,5,3],[49,32,4,2.5],[30,32.5,6,3]]},{goal:{arrive:.8,vmax:5}}]}]};var Yc={id:"lantern",num:3,name:"LANTERN",chapter:"MAINTENANCE BELT",brief:"Reach the mag plate behind the bulkhead. Under 2.5 m/s.",teaches:["gravity-well"],par:{time:22,fuel:18},look:{hole:.7,holeX:.7,holeY:.66,warm:.7},start:{at:[0,-4],angle:.25},fuel:45,bounds:[-14,-28,94,34],solids:[{box:[-14,-12,22,-9],style:"truss"},{box:[-14,-9,-6,4]},{box:[35,-28,42.5,5]},{box:[-14,25,94,29],style:"truss"},{box:[86,-28,94,25]},{box:[42.5,-28,86,-23],style:"truss"},{circle:[60,9,1.6]},{circle:[66,-12,2.2]},{circle:[74,4,1.1]}],wells:[{at:[38.8,14.5],gm:58,core:1.3,soft:1.3,range:17}],pickups:[{at:[38.8,20.3],fuel:25}],goals:[{type:"mag-plate",at:[84.4,-8],r:1.6,maxSpeed:2.5,face:"right"}],hints:[{at:"start",text:"THE LIGHT ABOVE THE WALL IS A GRAVITY WELL"},{when:{near:[38.8,14.5,11]},text:"FAST PASS = BEND.  SLOW PASS = SPAGHETTI.",dur:2.6},{when:{xAbove:46},text:"IT PULLS YOU BACK ON THE WAY OUT.  FREE BRAKES.",dur:2.6}],routes:[{id:"well-bend",risk:"medium",plan:[{aim:.6,burnTo:4},{branch:{if:{xBelow:55},then:{idle:!0},else:{goal:{arrive:.8,vmax:4}}}}]}]};var Ss={id:"carousel",num:4,name:"CAROUSEL",chapter:"MAINTENANCE BELT",brief:"Ride the arm across the shear. Mag plate under 2.5 m/s.",teaches:["rail-sling","shear"],par:{time:28,fuel:26},look:{hole:.75,holeX:.6,holeY:.7,warm:.5},start:{at:[0,0],angle:"right"},fuel:44,bounds:[-16,-42,116,34],solids:[{box:[-16,-9,-6,9]},{box:[97,-16,114,2.6]},{box:[97,5.4,114,22]},{box:[101,2.6,114,5.4]},{box:[-6,26,30,29],style:"truss"}],movers:[{id:"arm",motion:{type:"rotor",at:[34,0],omega:.3,phase:Math.PI/2},shapes:[{circle:[0,0,2.6],style:"hub"},{rect:[0,0,50,1],style:"rail",rail:!0}]}],fields:[{type:"shear",rect:[60,-42,95,34],accel:[0,-1.2]}],goals:[{type:"mag-plate",at:[99.2,4],r:1.7,maxSpeed:2.5,face:"right"}],hints:[{at:"start",text:"TOUCH THE RAIL GENTLY TO LATCH ON"},{when:{latched:!0},text:"YOU SLIDE OUTWARD.  S CLAMPS.  W LETS GO.",dur:3.4},{when:{xAbove:60,latched:!1},text:"SHEAR ZONE \u2014 IT PULLS YOU DOWN",dur:2.2}],routes:[{id:"sling",risk:"risky",plan:[{hold:[6,0,2,.1],until:{any:[{rotorAngle:{mover:"arm",mod:Math.PI,from:.25,to:.6}},{latched:!0}]}},{hold:[22,-1,3.5,.2],until:{latched:!0}},{ride:{releaseWithin:4,minVx:4,horizon:7,step:.08}},{branch:{if:{xBelow:78},then:{idle:!0},else:{goal:{arrive:.8,vmax:6}}}}]}]};var $c={id:"last-shuttle",num:5,name:"LAST SHUTTLE",chapter:"CARGO SPINE",brief:"Clamp onto the shuttle before the hangar seals. Match speed: under 1.6 m/s.",teaches:["rendezvous","vent","timed-door"],par:{time:18,fuel:22},look:{hole:.8,holeX:.82,holeY:.68,warm:.45},start:{at:[0,6],angle:"right"},fuel:60,bounds:[-40,-24,172,30],solids:[{box:[-40,-8,172,-5],style:"truss"},{box:[-40,12,150,15],style:"truss"},{box:[44.2,12,45.8,30],style:"frame"},{box:[94.2,12,95.8,30],style:"frame"},{box:[150,4,172,30]},{box:[168,-5,172,4]}],movers:[{id:"shuttle",motion:{type:"linear-decelerate",from:[-62,-3],speed:4.6,decelAt:150,decel:1.4},shapes:[{rect:[0,0,9,2.4],style:"shuttle"},{circle:[4.6,-.1,1.15],style:"shuttle"}]},{id:"door1",motion:{type:"window-door",at:[45,3.5],slide:[0,-20],open:{mover:"shuttle",x:24.5},close:{mover:"shuttle",x:51.5}},shapes:[{rect:[0,0,1.6,17],style:"door"}]},{id:"door2",motion:{type:"window-door",at:[95,3.5],slide:[0,-20],open:{mover:"shuttle",x:74.5},close:{mover:"shuttle",x:101.5}},shapes:[{rect:[0,0,1.6,17],style:"door"}]},{id:"hangardoor",motion:{type:"window-door",at:[150,-.5],slide:[0,-9],open:null,close:{mover:"shuttle",x:156.5,offset:1.2},rampClose:1.5,warnLead:2,warnLag:1.5},shapes:[{rect:[0,0,1.6,9],style:"door"}]}],vents:[{at:[22,12],dir:"down",len:16,width:5,force:7.5,period:4.2,on:1.3,phase:.6},{at:[70,12],dir:"down",len:16,width:5,force:7.5,period:4.2,on:1.3,phase:2.4},{at:[120,12],dir:"down",len:16,width:5,force:7.5,period:3.6,on:1.3,phase:1}],goals:[{type:"grab",label:"CARGO CLAMP",on:"shuttle",at:[-1.2,1.9],r:1.35,maxSpeed:1.6,face:"up"}],rules:[{type:"deadline",at:{mover:"shuttle",x:156.5,offset:1.2},grace:1.5,failIf:{xBelow:150},cause:"missed"}],hints:[{at:"start",text:"YOUR RIDE IS COMING UP BEHIND YOU"},{when:{timeAbove:7.5},text:"MATCH ITS SPEED.  BRAKE STOPS YOU \u2014 NOT RELATIVE TO IT.",dur:3},{when:{nearVent:{dx:6,yAbove:-2}},text:"VENT WARNING LIGHTS = DOWNBLAST",dur:2}],routes:[{id:"rendezvous",risk:"medium",plan:[{chase:{waitBehind:8,holdY:5,settleDx:1.5,hover:2.2,vmax:6,arrive:.4}}]}]};var Zc={id:"three-ways",num:6,name:"THREE WAYS",chapter:"DAMAGED SECTOR",brief:"Reach Ren gently (under 2.0 m/s), then bring her to the lifeboat.",teaches:["route-choice","rescue","rotor-hazard"],par:{time:48,fuel:60},look:{hole:.9,holeX:.55,holeY:.72,warm:.6},start:{at:[0,0],angle:"right"},fuel:80,bounds:[-16,-36,154,36],solids:[{box:[-16,26,154,30],style:"truss"},{box:[-16,-30,154,-26],style:"truss"},{box:[-16,-8,-6,8]},{box:[24,6,100,8]},{box:[24,-8,100,-6]},{box:[42,13.5,44,26],style:"strut"},{box:[60,8,62,20.5],style:"strut"},{box:[78,13.5,80,26],style:"strut"},{circle:[36,-21,1.6]},{circle:[82,-12,1.2]},{circle:[88,-21,1.8]},{box:[112,14,118,20],style:"crate"},{box:[104,-24,110,-18],style:"crate"}],movers:[{id:"turbine",motion:{type:"rotor",at:[62,0],omega:.42,phase:0},shapes:[{rect:[0,0,11.2,.8],style:"blade"},{circle:[0,0,1.2],style:"hub"}]}],wells:[{at:[58,-17],gm:42,core:1.1,soft:1.2,range:13}],pickups:[{at:[70,17],fuel:22},{at:[58,-12.2],fuel:30}],goals:[{type:"rescue",label:"REN",maxSpeed:2,mass:1.9,npc:{at:[121,4],anchor:!0,spin:.25}},{type:"airlock",label:"LIFEBOAT",at:[136,-12],dir:"left",length:16,height:14}],hints:[{at:"start",text:"UPPER: SAFE & SLOW  \xB7  MIDDLE: TURBINE  \xB7  LOWER: WELL"},{when:{goalIndex:1},text:"REN IS CLIPPED ON.  YOU ARE TWICE AS HEAVY NOW.",dur:3.2}],routes:[{id:"upper",label:"Upper gantry",risk:"safe",notes:"long baffle weave, fuel cell on the way",plan:[{waypoints:[[20,12,4,3],[36,10.6,4,2.5],[46,10.6,4,2.5],[53,23,4,2.5],[62,23.5,4,2],[70,17,3,1.2],[70,10.6,3,2.5],[84,10.6,4,2.5],[104,12,4,3]]},{rescue:{vmax:3,arrive:.15}},{goal:{arrive:.6,vmax:3}}]},{id:"middle",label:"Turbine",risk:"risky",notes:"timed run past a rotating blade",plan:[{waypoints:[[20,0,4,2.5],[49,4.5,3,1.2],[50,4.5,.5,1,{phase:{period:Math.PI/.42,from:4.9,to:5.6},slowerThan:.5}],[76,4.5,7,2.5],[100,2,4,3]]},{rescue:{vmax:3,arrive:.15}},{goal:{arrive:.6,vmax:3}}]},{id:"lower",label:"Well",risk:"medium",notes:"skim the well, grab the fuel cell beside its core",plan:[{waypoints:[[18,-10,4,2.5],[30,-12,4,2.5],[44,-12,5,2.5],[58,-11.6,4,1.4],[70,-14,5,3],[96,-14,4,3],[110,0,4,3]]},{rescue:{vmax:3,arrive:.15}},{goal:{arrive:.6,vmax:3}}]}]};var br=(i,t,e,n,s,r,a)=>({id:i,motion:{type:"orbit",center:t,radii:e,period:n,phase:s,spin:a},shapes:[{rect:[0,0,...r],style:"debris"}]}),Jc=(i,t,e)=>({id:i,motion:{type:"cycle-door",at:[t,0],slide:[0,-14.5],period:6.4,phase:e,openAt:.02,closeAt:.6,ramp:.14,warn:[.42,.75]},shapes:[{rect:[0,0,1.8,14],style:"door"}]}),Kc={id:"event-horizon",num:7,name:"EVENT HORIZON",chapter:"SINGULARITY APPROACH",brief:"Land in the topside airlock while the anomaly pulls you right. Under 1.5 m/s.",teaches:["tide","cycle-door","hover-landing"],par:{time:40,fuel:60},look:{hole:1.25,holeX:.86,holeY:.6,warm:.8,final:!0},start:{at:[0,0],angle:"right"},fuel:90,bounds:[-16,-32,158,32],solids:[{box:[-16,-9,-6,9]},{box:[-6,18,86,21],style:"truss"},{box:[-6,-21,86,-18],style:"truss"},{box:[86,7,112,30]},{box:[86,-30,112,-7]},{box:[97.6,-7,100.4,-6],style:"frame"},{box:[97.6,6,100.4,7],style:"frame"}],movers:[br("d1",[16,5],[2,6],9,0,[3.4,2.2],.4),br("d2",[24,-6],[3,5],11,2,[2.6,2.6],-.5),br("d3",[32,7],[2.5,6.5],8,4,[4.2,1.4],.3),br("d4",[40,-4],[2,7],10,1,[2.2,3.2],.6),Jc("lockA",92,0),Jc("lockB",106,3.2)],wells:[{at:[63,10.5],gm:34,core:1,soft:1.2,range:11},{at:[63,-10.5],gm:34,core:1,soft:1.2,range:11}],tide:{base:.08,from:40,gradient:.0145},pickups:[{at:[99,0],fuel:20}],goals:[{type:"airlock",label:"HORIZON LOCK",at:[130,-8],dir:"up",length:18,height:22}],hints:[{at:"start",text:"THE ANOMALY IS PULLING.  IT ONLY GETS STRONGER."},{when:{xAbove:84,xBelow:90},text:"THE LOCK CYCLES.  WAIT INSIDE IF YOU MUST.",dur:2.6},{when:{xAbove:112},text:"HOVER: FACE LEFT AND FEATHER THRUST",dur:3}],routes:[{id:"main",risk:"risky",plan:[{waypoints:[[46,0,4,3],[80,0,4,3]],arriveK:.6},{gate:{mover:"lockA",whileXBelow:91,go:[99,0,5,.5],hold:[87,0,2,.1]}},{gate:{mover:"lockB",whileXBelow:104,go:[118,0,5,1],hold:[99,0,3,.1]}},{branch:{if:{yAbove:-3},then:{goTo:{goal:!0,offset:[0,5],vmax:3,arrive:.4}},else:{goTo:{goal:!0,vmax:1.2,arrive:.5}}}}]}]};var jc=[Xc,qc,Yc,Ss,$c,Zc,Kc];var Qc={id:"lab-sling-basics",name:"SLING SCHOOL",chapter:"LAB \xB7 A",experimental:!0,num:101,brief:"Latch onto the arm, slide out, let go toward the plate. The net forgives.",teaches:["rail-sling"],par:{time:30,fuel:25},look:{hole:.6,holeX:.3,holeY:.72,warm:.4,fgDensity:.6},start:{at:[0,0],angle:"right"},fuel:60,bounds:[-14,-32,92,32],solids:[{box:[-14,-6,-6,6]},{box:[-6,24,82,27],style:"truss"},{box:[-6,-27,82,-24],style:"truss"},{box:[80,-24,88,24],style:"truss",soft:!0}],movers:[{id:"arm",motion:{type:"rotor",at:[28,0],omega:.22,phase:Math.PI/2},shapes:[{circle:[0,0,2.2],style:"hub"},{rect:[0,0,40,1],style:"rail",rail:!0}]}],goals:[{type:"mag-plate",at:[77.6,0],r:3,maxSpeed:3,face:"right"}],hints:[{at:"start",text:"DRIFT INTO THE ARM'S PATH.  A GENTLE TOUCH LATCHES."},{when:{latched:!0},text:"SLIDE OUT.  W LETS GO WHEN THE DOTS REACH THE PLATE.",dur:3.6},{when:{xAbove:50,latched:!1},text:"BRAKE BEFORE THE NET",dur:2}],routes:[{id:"sling",risk:"safe",plan:[{hold:[17,-1,3,.2],until:{latched:!0}},{ride:{releaseWithin:2.5,minVx:2,horizon:12,step:.1}},{branch:{if:{xBelow:55},then:{idle:!0},else:{goal:{arrive:.8,vmax:5}}}}]}]};var th={...(({num:i,...t})=>t)(Ss),id:"lab-sling-shear",name:"SOFT SHEAR",chapter:"LAB \xB7 B",experimental:!0,num:102,brief:"Carousel with a gentler pull. Mag plate under 2.5 m/s.",teaches:["shear"],par:{time:30,fuel:26},fuel:50,fields:[{type:"shear",rect:[60,-42,95,34],accel:[0,-.6]}],goals:[{type:"mag-plate",at:[99.2,4],r:2,maxSpeed:2.5,face:"right"}],routes:Ss.routes.map(i=>({...i,id:"sling",risk:"medium"}))};var eh={id:"lab-rendezvous",name:"SLOW BOAT",chapter:"LAB \xB7 C",experimental:!0,num:103,brief:"Land on the drifting work platform. It moves \u2014 match it. Under 2.2 m/s relative.",teaches:["moving-goal"],par:{time:25,fuel:25},look:{hole:.65,holeX:.75,holeY:.72,warm:.5,fgDensity:.7},start:{at:[0,8],angle:"right"},fuel:70,bounds:[-50,-26,150,30],solids:[{box:[-50,-14,150,-11],style:"truss"},{box:[-50,22,150,25],style:"truss"}],movers:[{id:"platform",motion:{type:"linear",from:[-36,-4],vel:[1.8,0]},shapes:[{rect:[0,0,14,1.6],style:"shuttle"},{rect:[-6,1.4,1,1.2],style:"strut"},{rect:[6,1.4,1,1.2],style:"strut"}]}],goals:[{type:"grab",label:"LANDING CLAMP",on:"platform",at:[0,1.6],r:2,maxSpeed:2.2,face:"up"}],rules:[{type:"deadline",at:75,grace:0,failIf:{xBelow:1e3},cause:"missed"}],hints:[{at:"start",text:"THE PLATFORM IS COMING.  MATCH ITS SPEED, THEN SETTLE ON."},{when:{timeAbove:9},text:"BRAKE STOPS YOU DEAD \u2014 NOT RELATIVE TO IT",dur:3}],routes:[{id:"rendezvous",risk:"safe",plan:[{chase:{waitBehind:8,holdY:8,settleDx:1.5,hover:2.4,vmax:4,arrive:.4}}]}]};var nh={id:"lab-threadline",name:"THREADLINE",chapter:"LAB \xB7 D",experimental:!0,num:104,brief:"Through the lock, onto the arm, past the well, onto the plate. Under 2.0 m/s.",teaches:[],par:{time:40,fuel:40},look:{hole:1.05,holeX:.8,holeY:.62,warm:.75,fgDensity:1.2,debris:1.5,landmark:"ring",ringX:60},start:{at:[0,0],angle:"right"},fuel:70,bounds:[-14,-34,118,34],solids:[{box:[-14,-8,-6,8]},{box:[-6,8,22,26]},{box:[-6,-26,22,-8]},{box:[22,22,106,25],style:"truss"},{box:[22,-25,106,-22],style:"truss"},{box:[106,-25,118,25]}],movers:[{id:"lock",motion:{type:"cycle-door",at:[20,0],slide:[0,-16.5],period:6,phase:0,openAt:.02,closeAt:.64,ramp:.12,warn:[.5,.78]},shapes:[{rect:[0,0,1.8,16],style:"door"}]},{id:"arm",motion:{type:"rotor",at:[46,0],omega:.34,phase:Math.PI/2},shapes:[{circle:[0,0,2.2],style:"hub"},{rect:[0,0,38,1],style:"rail",rail:!0}]}],wells:[{at:[72,-9],gm:36,core:1,soft:1.2,range:13}],tide:{base:0,from:84,gradient:.035},goals:[{type:"mag-plate",at:[104.3,-6],r:1.6,maxSpeed:2,face:"right"}],hints:[{at:"start",text:"LOCK \xB7 ARM \xB7 WELL \xB7 PULL.  YOU KNOW ALL OF THESE."},{when:{latched:!0},text:"THE WELL WILL BEND YOUR LINE.  TRUST THE DOTS.",dur:3},{when:{xAbove:88,latched:!1},text:"THE PULL IS ON.  BRAKE HARD.",dur:2.2}],routes:[{id:"thread",risk:"risky",plan:[{waypoints:[[15,0,3,2]]},{gate:{mover:"lock",whileXBelow:23,go:[25,0,5,1],hold:[16,0,2,.1]}},{hold:[25,0,2,.1],until:{any:[{rotorAngle:{mover:"arm",mod:Math.PI,from:.3,to:.7}},{latched:!0}]}},{hold:[36,-1,3,.2],until:{latched:!0}},{ride:{releaseWithin:3,minVx:3,horizon:9,step:.08}},{branch:{if:{xBelow:86},then:{idle:!0},else:{goal:{arrive:.6,vmax:4}}}}]}]};var ih=[Qc,th,eh,nh];var Je=jc.map(Yo),Sr=ih.map(Yo),$o=[...Je,...Sr];var Rh=0,Il=1,Ch=2;var Zs=1,Ih=2,ps=3,Zn=0,Ge=1,an=2,Un=0,Li=1,Fn=2,Pl=3,Ll=4,Ph=5;var hi=100,Lh=101,Nh=102,Dh=103,Uh=104,Fh=200,Oh=201,Bh=202,kh=203,$r=204,Zr=205,zh=206,Vh=207,Hh=208,Gh=209,Wh=210,Xh=211,qh=212,Yh=213,$h=214,Jr=0,Kr=1,jr=2,Ni=3,Qr=4,ta=5,ea=6,na=7,Nl=0,Zh=1,Jh=2,vn=0,Dl=1,Ul=2,Fl=3,Js=4,Ol=5,Bl=6,kl=7;var zl=300,xi=301,Bi=302,Ca=303,Ia=304,Ks=306,as=1e3,Cn=1001,ia=1002,Ce=1003,Kh=1004;var js=1005;var Ue=1006,Pa=1007;var yi=1008;var Ye=1009,Vl=1010,Hl=1011,ms=1012,La=1013,Mn=1014,on=1015,On=1016,Na=1017,Da=1018,gs=1020,Gl=35902,Wl=35899,Xl=1021,ql=1022,ln=1023,In=1026,_i=1027,Ua=1028,Fa=1029,vi=1030,Oa=1031;var Ba=1033,Qs=33776,tr=33777,er=33778,nr=33779,ka=35840,za=35841,Va=35842,Ha=35843,Ga=36196,Wa=37492,Xa=37496,qa=37488,Ya=37489,ir=37490,$a=37491,Za=37808,Ja=37809,Ka=37810,ja=37811,Qa=37812,to=37813,eo=37814,no=37815,io=37816,so=37817,ro=37818,ao=37819,oo=37820,lo=37821,co=36492,ho=36494,uo=36495,fo=36283,po=36284,sr=36285,mo=36286;var Ps=2300,sa=2301,Yr=2302,_l=2303,vl=2400,Ml=2401,bl=2402;var jh=3200;var go=0,Qh=1,bn="",Ne="srgb",Ls="srgb-linear",Ns="linear",Kt="srgb";var Ii=7680;var Sl=519,tu=512,eu=513,nu=514,xo=515,iu=516,su=517,yo=518,ru=519,El=35044,Mi=35048;var Yl="300 es",xn=2e3,os=2001;function Ad(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Rd(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function Ds(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function au(){let i=Ds("canvas");return i.style.display="block",i}var sh={},ls=null;function $l(...i){let t="THREE."+i.shift();ls?ls("log",t,...i):console.log(t,...i)}function ou(i){let t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ct(...i){i=ou(i);let t="THREE."+i.shift();if(ls)ls("warn",t,...i);else{let e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function It(...i){i=ou(i);let t="THREE."+i.shift();if(ls)ls("error",t,...i);else{let e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function Pi(...i){let t=i.join(" ");t in sh||(sh[t]=!0,Ct(...i))}function lu(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var cu={[Jr]:Kr,[jr]:ea,[Qr]:na,[Ni]:ta,[Kr]:Jr,[ea]:jr,[na]:Qr,[ta]:Ni},Pn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let s=n[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},Be=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var Zo=Math.PI/180,ra=180/Math.PI;function rr(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Be[i&255]+Be[i>>8&255]+Be[i>>16&255]+Be[i>>24&255]+"-"+Be[t&255]+Be[t>>8&255]+"-"+Be[t>>16&15|64]+Be[t>>24&255]+"-"+Be[e&63|128]+Be[e>>8&255]+"-"+Be[e>>16&255]+Be[e>>24&255]+Be[n&255]+Be[n>>8&255]+Be[n>>16&255]+Be[n>>24&255]).toLowerCase()}function Wt(i,t,e){return Math.max(t,Math.min(e,i))}function Cd(i,t){return(i%t+t)%t}function Jo(i,t,e){return(1-e)*i+e*t}function Es(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Xe(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Ql=class Ql{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Wt(this.x,t.x,e.x),this.y=Wt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Wt(this.x,t,e),this.y=Wt(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Wt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Wt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Ql.prototype.isVector2=!0;var Lt=Ql,sn=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],d=n[s+3],u=r[a+0],f=r[a+1],p=r[a+2],y=r[a+3];if(d!==y||l!==u||c!==f||h!==p){let x=l*u+c*f+h*p+d*y;x<0&&(u=-u,f=-f,p=-p,y=-y,x=-x);let m=1-o;if(x<.9995){let b=Math.acos(x),T=Math.sin(b);m=Math.sin(m*b)/T,o=Math.sin(o*b)/T,l=l*m+u*o,c=c*m+f*o,h=h*m+p*o,d=d*m+y*o}else{l=l*m+u*o,c=c*m+f*o,h=h*m+p*o,d=d*m+y*o;let b=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=b,c*=b,h*=b,d*=b}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],d=r[a],u=r[a+1],f=r[a+2],p=r[a+3];return t[e]=o*p+h*d+l*f-c*u,t[e+1]=l*p+h*u+c*d-o*f,t[e+2]=c*p+h*f+o*u-l*d,t[e+3]=h*p-o*d-l*u-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),d=o(r/2),u=l(n/2),f=l(s/2),p=l(r/2);switch(a){case"XYZ":this._x=u*h*d+c*f*p,this._y=c*f*d-u*h*p,this._z=c*h*p+u*f*d,this._w=c*h*d-u*f*p;break;case"YXZ":this._x=u*h*d+c*f*p,this._y=c*f*d-u*h*p,this._z=c*h*p-u*f*d,this._w=c*h*d+u*f*p;break;case"ZXY":this._x=u*h*d-c*f*p,this._y=c*f*d+u*h*p,this._z=c*h*p+u*f*d,this._w=c*h*d-u*f*p;break;case"ZYX":this._x=u*h*d-c*f*p,this._y=c*f*d+u*h*p,this._z=c*h*p-u*f*d,this._w=c*h*d+u*f*p;break;case"YZX":this._x=u*h*d+c*f*p,this._y=c*f*d+u*h*p,this._z=c*h*p-u*f*d,this._w=c*h*d-u*f*p;break;case"XZY":this._x=u*h*d-c*f*p,this._y=c*f*d-u*h*p,this._z=c*h*p+u*f*d,this._w=c*h*d+u*f*p;break;default:Ct("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],d=e[10],u=n+o+d;if(u>0){let f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(a-s)*f}else if(n>o&&n>d){let f=2*Math.sqrt(1+n-o-d);this._w=(h-l)/f,this._x=.25*f,this._y=(s+a)/f,this._z=(r+c)/f}else if(o>d){let f=2*Math.sqrt(1+o-n-d);this._w=(r-c)/f,this._x=(s+a)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+d-n-o);this._w=(a-s)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Wt(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-e;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,e=Math.sin(e*c)/h,this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},tc=class tc{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(rh.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(rh.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),h=2*(o*e-r*s),d=2*(r*n-a*e);return this.x=e+l*c+a*d-o*h,this.y=n+l*h+o*c-r*d,this.z=s+l*d+r*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Wt(this.x,t.x,e.x),this.y=Wt(this.y,t.y,e.y),this.z=Wt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Wt(this.x,t,e),this.y=Wt(this.y,t,e),this.z=Wt(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Wt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Ko.copy(this).projectOnVector(t),this.sub(Ko)}reflect(t){return this.sub(Ko.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(Wt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};tc.prototype.isVector3=!0;var U=tc,Ko=new U,rh=new sn,ec=class ec{constructor(t,e,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],d=n[7],u=n[2],f=n[5],p=n[8],y=s[0],x=s[3],m=s[6],b=s[1],T=s[4],v=s[7],w=s[2],A=s[5],E=s[8];return r[0]=a*y+o*b+l*w,r[3]=a*x+o*T+l*A,r[6]=a*m+o*v+l*E,r[1]=c*y+h*b+d*w,r[4]=c*x+h*T+d*A,r[7]=c*m+h*v+d*E,r[2]=u*y+f*b+p*w,r[5]=u*x+f*T+p*A,r[8]=u*m+f*v+p*E,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=h*a-o*c,u=o*l-h*r,f=c*r-a*l,p=e*d+n*u+s*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/p;return t[0]=d*y,t[1]=(s*c-h*n)*y,t[2]=(o*n-s*a)*y,t[3]=u*y,t[4]=(h*e-s*l)*y,t[5]=(s*r-o*e)*y,t[6]=f*y,t[7]=(n*l-c*e)*y,t[8]=(a*e-n*r)*y,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return Pi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(jo.makeScale(t,e)),this}rotate(t){return Pi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(jo.makeRotation(-t)),this}translate(t,e){return Pi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(jo.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};ec.prototype.isMatrix3=!0;var Nt=ec,jo=new Nt,ah=new Nt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),oh=new Nt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Id(){let i={enabled:!0,workingColorSpace:Ls,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===Kt&&(s.r=$n(s.r),s.g=$n(s.g),s.b=$n(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===Kt&&(s.r=rs(s.r),s.g=rs(s.g),s.b=rs(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===bn?Ns:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Pi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Pi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Ls]:{primaries:t,whitePoint:n,transfer:Ns,toXYZ:ah,fromXYZ:oh,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Ne},outputColorSpaceConfig:{drawingBufferColorSpace:Ne}},[Ne]:{primaries:t,whitePoint:n,transfer:Kt,toXYZ:ah,fromXYZ:oh,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Ne}}}),i}var Vt=Id();function $n(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function rs(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var qi,aa=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{qi===void 0&&(qi=Ds("canvas")),qi.width=t.width,qi.height=t.height;let s=qi.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=qi}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=Ds("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=$n(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor($n(e[n]/255)*255):e[n]=$n(e[n]);return{data:e,width:t.width,height:t.height}}else return Ct("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Pd=0,cs=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Pd++}),this.uuid=rr(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Qo(s[a].image)):r.push(Qo(s[a]))}else r=Qo(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function Qo(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?aa.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ct("Texture: Unable to serialize Texture."),{})}var Ld=0,tl=new U,Ve=class i extends Pn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=Cn,s=Cn,r=Ue,a=yi,o=ln,l=Ye,c=i.DEFAULT_ANISOTROPY,h=bn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ld++}),this.uuid=rr(),this.name="",this.source=new cs(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Lt(0,0),this.repeat=new Lt(1,1),this.center=new Lt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Nt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(tl).x}get height(){return this.source.getSize(tl).y}get depth(){return this.source.getSize(tl).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){Ct(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Ct(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==zl)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case as:t.x=t.x-Math.floor(t.x);break;case Cn:t.x=t.x<0?0:1;break;case ia:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case as:t.y=t.y-Math.floor(t.y);break;case Cn:t.y=t.y<0?0:1;break;case ia:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Ve.DEFAULT_IMAGE=null;Ve.DEFAULT_MAPPING=zl;Ve.DEFAULT_ANISOTROPY=1;var nc=class nc{constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],h=l[4],d=l[8],u=l[1],f=l[5],p=l[9],y=l[2],x=l[6],m=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-y)<.01&&Math.abs(p-x)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+y)<.1&&Math.abs(p+x)<.1&&Math.abs(c+f+m-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let T=(c+1)/2,v=(f+1)/2,w=(m+1)/2,A=(h+u)/4,E=(d+y)/4,g=(p+x)/4;return T>v&&T>w?T<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(T),s=A/n,r=E/n):v>w?v<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),n=A/s,r=g/s):w<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(w),n=E/r,s=g/r),this.set(n,s,r,e),this}let b=Math.sqrt((x-p)*(x-p)+(d-y)*(d-y)+(u-h)*(u-h));return Math.abs(b)<.001&&(b=1),this.x=(x-p)/b,this.y=(d-y)/b,this.z=(u-h)/b,this.w=Math.acos((c+f+m-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Wt(this.x,t.x,e.x),this.y=Wt(this.y,t.y,e.y),this.z=Wt(this.z,t.z,e.z),this.w=Wt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Wt(this.x,t,e),this.y=Wt(this.y,t,e),this.z=Wt(this.z,t,e),this.w=Wt(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Wt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};nc.prototype.isVector4=!0;var le=nc,oa=class extends Pn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ue,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new le(0,0,t,e),this.scissorTest=!1,this.viewport=new le(0,0,t,e),this.textures=[];let s={width:t,height:e,depth:n.depth},r=new Ve(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:Ue,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new cs(s)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},He=class extends oa{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},Us=class extends Ve{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Ce,this.minFilter=Ce,this.wrapR=Cn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var la=class extends Ve{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Ce,this.minFilter=Ce,this.wrapR=Cn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Ra=class Ra{constructor(t,e,n,s,r,a,o,l,c,h,d,u,f,p,y,x){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,h,d,u,f,p,y,x)}set(t,e,n,s,r,a,o,l,c,h,d,u,f,p,y,x){let m=this.elements;return m[0]=t,m[4]=e,m[8]=n,m[12]=s,m[1]=r,m[5]=a,m[9]=o,m[13]=l,m[2]=c,m[6]=h,m[10]=d,m[14]=u,m[3]=f,m[7]=p,m[11]=y,m[15]=x,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ra().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,s=1/Yi.setFromMatrixColumn(t,0).length(),r=1/Yi.setFromMatrixColumn(t,1).length(),a=1/Yi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(t.order==="XYZ"){let u=a*h,f=a*d,p=o*h,y=o*d;e[0]=l*h,e[4]=-l*d,e[8]=c,e[1]=f+p*c,e[5]=u-y*c,e[9]=-o*l,e[2]=y-u*c,e[6]=p+f*c,e[10]=a*l}else if(t.order==="YXZ"){let u=l*h,f=l*d,p=c*h,y=c*d;e[0]=u+y*o,e[4]=p*o-f,e[8]=a*c,e[1]=a*d,e[5]=a*h,e[9]=-o,e[2]=f*o-p,e[6]=y+u*o,e[10]=a*l}else if(t.order==="ZXY"){let u=l*h,f=l*d,p=c*h,y=c*d;e[0]=u-y*o,e[4]=-a*d,e[8]=p+f*o,e[1]=f+p*o,e[5]=a*h,e[9]=y-u*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let u=a*h,f=a*d,p=o*h,y=o*d;e[0]=l*h,e[4]=p*c-f,e[8]=u*c+y,e[1]=l*d,e[5]=y*c+u,e[9]=f*c-p,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let u=a*l,f=a*c,p=o*l,y=o*c;e[0]=l*h,e[4]=y-u*d,e[8]=p*d+f,e[1]=d,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=f*d+p,e[10]=u-y*d}else if(t.order==="XZY"){let u=a*l,f=a*c,p=o*l,y=o*c;e[0]=l*h,e[4]=-d,e[8]=c*h,e[1]=u*d+y,e[5]=a*h,e[9]=f*d-p,e[2]=p*d-f,e[6]=o*h,e[10]=y*d+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Nd,t,Dd)}lookAt(t,e,n){let s=this.elements;return Ke.subVectors(t,e),Ke.lengthSq()===0&&(Ke.z=1),Ke.normalize(),ii.crossVectors(n,Ke),ii.lengthSq()===0&&(Math.abs(n.z)===1?Ke.x+=1e-4:Ke.z+=1e-4,Ke.normalize(),ii.crossVectors(n,Ke)),ii.normalize(),Er.crossVectors(Ke,ii),s[0]=ii.x,s[4]=Er.x,s[8]=Ke.x,s[1]=ii.y,s[5]=Er.y,s[9]=Ke.y,s[2]=ii.z,s[6]=Er.z,s[10]=Ke.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],d=n[5],u=n[9],f=n[13],p=n[2],y=n[6],x=n[10],m=n[14],b=n[3],T=n[7],v=n[11],w=n[15],A=s[0],E=s[4],g=s[8],M=s[12],R=s[1],I=s[5],P=s[9],N=s[13],k=s[2],F=s[6],H=s[10],W=s[14],Z=s[3],Q=s[7],rt=s[11],dt=s[15];return r[0]=a*A+o*R+l*k+c*Z,r[4]=a*E+o*I+l*F+c*Q,r[8]=a*g+o*P+l*H+c*rt,r[12]=a*M+o*N+l*W+c*dt,r[1]=h*A+d*R+u*k+f*Z,r[5]=h*E+d*I+u*F+f*Q,r[9]=h*g+d*P+u*H+f*rt,r[13]=h*M+d*N+u*W+f*dt,r[2]=p*A+y*R+x*k+m*Z,r[6]=p*E+y*I+x*F+m*Q,r[10]=p*g+y*P+x*H+m*rt,r[14]=p*M+y*N+x*W+m*dt,r[3]=b*A+T*R+v*k+w*Z,r[7]=b*E+T*I+v*F+w*Q,r[11]=b*g+T*P+v*H+w*rt,r[15]=b*M+T*N+v*W+w*dt,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],d=t[6],u=t[10],f=t[14],p=t[3],y=t[7],x=t[11],m=t[15],b=l*f-c*u,T=o*f-c*d,v=o*u-l*d,w=a*f-c*h,A=a*u-l*h,E=a*d-o*h;return e*(y*b-x*T+m*v)-n*(p*b-x*w+m*A)+s*(p*T-y*w+m*E)-r*(p*v-y*A+x*E)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[1],a=t[5],o=t[9],l=t[2],c=t[6],h=t[10];return e*(a*h-o*c)-n*(r*h-o*l)+s*(r*c-a*l)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=t[9],u=t[10],f=t[11],p=t[12],y=t[13],x=t[14],m=t[15],b=e*o-n*a,T=e*l-s*a,v=e*c-r*a,w=n*l-s*o,A=n*c-r*o,E=s*c-r*l,g=h*y-d*p,M=h*x-u*p,R=h*m-f*p,I=d*x-u*y,P=d*m-f*y,N=u*m-f*x,k=b*N-T*P+v*I+w*R-A*M+E*g;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let F=1/k;return t[0]=(o*N-l*P+c*I)*F,t[1]=(s*P-n*N-r*I)*F,t[2]=(y*E-x*A+m*w)*F,t[3]=(u*A-d*E-f*w)*F,t[4]=(l*R-a*N-c*M)*F,t[5]=(e*N-s*R+r*M)*F,t[6]=(x*v-p*E-m*T)*F,t[7]=(h*E-u*v+f*T)*F,t[8]=(a*P-o*R+c*g)*F,t[9]=(n*R-e*P-r*g)*F,t[10]=(p*A-y*v+m*b)*F,t[11]=(d*v-h*A-f*b)*F,t[12]=(o*M-a*I-l*g)*F,t[13]=(e*I-n*M+s*g)*F,t[14]=(y*T-p*w-x*b)*F,t[15]=(h*w-d*T+u*b)*F,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,h=a+a,d=o+o,u=r*c,f=r*h,p=r*d,y=a*h,x=a*d,m=o*d,b=l*c,T=l*h,v=l*d,w=n.x,A=n.y,E=n.z;return s[0]=(1-(y+m))*w,s[1]=(f+v)*w,s[2]=(p-T)*w,s[3]=0,s[4]=(f-v)*A,s[5]=(1-(u+m))*A,s[6]=(x+b)*A,s[7]=0,s[8]=(p+T)*E,s[9]=(x-b)*E,s[10]=(1-(u+y))*E,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let a=Yi.set(s[0],s[1],s[2]).length(),o=Yi.set(s[4],s[5],s[6]).length(),l=Yi.set(s[8],s[9],s[10]).length();r<0&&(a=-a),pn.copy(this);let c=1/a,h=1/o,d=1/l;return pn.elements[0]*=c,pn.elements[1]*=c,pn.elements[2]*=c,pn.elements[4]*=h,pn.elements[5]*=h,pn.elements[6]*=h,pn.elements[8]*=d,pn.elements[9]*=d,pn.elements[10]*=d,e.setFromRotationMatrix(pn),n.x=a,n.y=o,n.z=l,this}makePerspective(t,e,n,s,r,a,o=xn,l=!1){let c=this.elements,h=2*r/(e-t),d=2*r/(n-s),u=(e+t)/(e-t),f=(n+s)/(n-s),p,y;if(l)p=r/(a-r),y=a*r/(a-r);else if(o===xn)p=-(a+r)/(a-r),y=-2*a*r/(a-r);else if(o===os)p=-a/(a-r),y=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=d,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=y,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=xn,l=!1){let c=this.elements,h=2/(e-t),d=2/(n-s),u=-(e+t)/(e-t),f=-(n+s)/(n-s),p,y;if(l)p=1/(a-r),y=a/(a-r);else if(o===xn)p=-2/(a-r),y=-(a+r)/(a-r);else if(o===os)p=-1/(a-r),y=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=d,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=y,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};Ra.prototype.isMatrix4=!0;var Qt=Ra,Yi=new U,pn=new Qt,Nd=new U(0,0,0),Dd=new U(1,1,1),ii=new U,Er=new U,Ke=new U,lh=new Qt,ch=new sn,yn=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],d=s[2],u=s[6],f=s[10];switch(e){case"XYZ":this._y=Math.asin(Wt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Wt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(Wt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Wt(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Wt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-Wt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Ct("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return lh.makeRotationFromQuaternion(t),this.setFromRotationMatrix(lh,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return ch.setFromEuler(this),this.setFromQuaternion(ch,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};yn.DEFAULT_ORDER="XYZ";var Fs=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Ud=0,hh=new U,$i=new sn,Gn=new Qt,Tr=new U,Ts=new U,Fd=new U,Od=new sn,uh=new U(1,0,0),dh=new U(0,1,0),fh=new U(0,0,1),ph={type:"added"},Bd={type:"removed"},Zi={type:"childadded",child:null},el={type:"childremoved",child:null},Fe=class i extends Pn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ud++}),this.uuid=rr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new U,e=new yn,n=new sn,s=new U(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Qt},normalMatrix:{value:new Nt}}),this.matrix=new Qt,this.matrixWorld=new Qt,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Fs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return $i.setFromAxisAngle(t,e),this.quaternion.multiply($i),this}rotateOnWorldAxis(t,e){return $i.setFromAxisAngle(t,e),this.quaternion.premultiply($i),this}rotateX(t){return this.rotateOnAxis(uh,t)}rotateY(t){return this.rotateOnAxis(dh,t)}rotateZ(t){return this.rotateOnAxis(fh,t)}translateOnAxis(t,e){return hh.copy(t).applyQuaternion(this.quaternion),this.position.add(hh.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(uh,t)}translateY(t){return this.translateOnAxis(dh,t)}translateZ(t){return this.translateOnAxis(fh,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Gn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Tr.copy(t):Tr.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Ts.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Gn.lookAt(Ts,Tr,this.up):Gn.lookAt(Tr,Ts,this.up),this.quaternion.setFromRotationMatrix(Gn),s&&(Gn.extractRotation(s.matrixWorld),$i.setFromRotationMatrix(Gn),this.quaternion.premultiply($i.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(It("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(ph),Zi.child=t,this.dispatchEvent(Zi),Zi.child=null):It("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Bd),el.child=t,this.dispatchEvent(el),el.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Gn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Gn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Gn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(ph),Zi.child=t,this.dispatchEvent(Zi),Zi.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ts,t,Fd),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ts,Od,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),this.static!==!1&&(s.static=this.static),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let d=l[c];r(t.shapes,d)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),d=a(t.shapes),u=a(t.skeletons),f=a(t.animations),p=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),f.length>0&&(n.animations=f),p.length>0&&(n.nodes=p)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};Fe.DEFAULT_UP=new U(0,1,0);Fe.DEFAULT_MATRIX_AUTO_UPDATE=!0;Fe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ye=class extends Fe{constructor(){super(),this.isGroup=!0,this.type="Group"}},kd={type:"move"},hs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ye,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ye,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ye,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(let y of t.hand.values()){let x=e.getJointPose(y,n),m=this._getHandJoint(c,y);x!==null&&(m.matrix.fromArray(x.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=x.radius),m.visible=x!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,p=.005;c.inputState.pinching&&u>f+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=f-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(kd)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new ye;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},hu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},si={h:0,s:0,l:0},wr={h:0,s:0,l:0};function nl(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var Tt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ne){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Vt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=Vt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Vt.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=Vt.workingColorSpace){if(t=Cd(t,1),e=Wt(e,0,1),n=Wt(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=nl(a,r,t+1/3),this.g=nl(a,r,t),this.b=nl(a,r,t-1/3)}return Vt.colorSpaceToWorking(this,s),this}setStyle(t,e=Ne){function n(r){r!==void 0&&parseFloat(r)<1&&Ct("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Ct("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);Ct("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ne){let n=hu[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Ct("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=$n(t.r),this.g=$n(t.g),this.b=$n(t.b),this}copyLinearToSRGB(t){return this.r=rs(t.r),this.g=rs(t.g),this.b=rs(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ne){return Vt.workingToColorSpace(ke.copy(this),t),Math.round(Wt(ke.r*255,0,255))*65536+Math.round(Wt(ke.g*255,0,255))*256+Math.round(Wt(ke.b*255,0,255))}getHexString(t=Ne){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Vt.workingColorSpace){Vt.workingToColorSpace(ke.copy(this),e);let n=ke.r,s=ke.g,r=ke.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let d=a-o;switch(c=h<=.5?d/(a+o):d/(2-a-o),a){case n:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-n)/d+2;break;case r:l=(n-s)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Vt.workingColorSpace){return Vt.workingToColorSpace(ke.copy(this),e),t.r=ke.r,t.g=ke.g,t.b=ke.b,t}getStyle(t=Ne){Vt.workingToColorSpace(ke.copy(this),t);let e=ke.r,n=ke.g,s=ke.b;return t!==Ne?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(si),this.setHSL(si.h+t,si.s+e,si.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(si),t.getHSL(wr);let n=Jo(si.h,wr.h,e),s=Jo(si.s,wr.s,e),r=Jo(si.l,wr.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},ke=new Tt;Tt.NAMES=hu;var Di=class extends Fe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new yn,this.environmentIntensity=1,this.environmentRotation=new yn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}},mn=new U,Wn=new U,il=new U,Xn=new U,Ji=new U,Ki=new U,mh=new U,sl=new U,rl=new U,al=new U,ol=new le,ll=new le,cl=new le,ci=class i{constructor(t=new U,e=new U,n=new U){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),mn.subVectors(t,e),s.cross(mn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){mn.subVectors(s,e),Wn.subVectors(n,e),il.subVectors(t,e);let a=mn.dot(mn),o=mn.dot(Wn),l=mn.dot(il),c=Wn.dot(Wn),h=Wn.dot(il),d=a*c-o*o;if(d===0)return r.set(0,0,0),null;let u=1/d,f=(c*l-o*h)*u,p=(a*h-o*l)*u;return r.set(1-f-p,p,f)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Xn)===null?!1:Xn.x>=0&&Xn.y>=0&&Xn.x+Xn.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,Xn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Xn.x),l.addScaledVector(a,Xn.y),l.addScaledVector(o,Xn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return ol.setScalar(0),ll.setScalar(0),cl.setScalar(0),ol.fromBufferAttribute(t,e),ll.fromBufferAttribute(t,n),cl.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(ol,r.x),a.addScaledVector(ll,r.y),a.addScaledVector(cl,r.z),a}static isFrontFacing(t,e,n,s){return mn.subVectors(n,e),Wn.subVectors(t,e),mn.cross(Wn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return mn.subVectors(this.c,this.b),Wn.subVectors(this.a,this.b),mn.cross(Wn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,a,o;Ji.subVectors(s,n),Ki.subVectors(r,n),sl.subVectors(t,n);let l=Ji.dot(sl),c=Ki.dot(sl);if(l<=0&&c<=0)return e.copy(n);rl.subVectors(t,s);let h=Ji.dot(rl),d=Ki.dot(rl);if(h>=0&&d<=h)return e.copy(s);let u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return a=l/(l-h),e.copy(n).addScaledVector(Ji,a);al.subVectors(t,r);let f=Ji.dot(al),p=Ki.dot(al);if(p>=0&&f<=p)return e.copy(r);let y=f*c-l*p;if(y<=0&&c>=0&&p<=0)return o=c/(c-p),e.copy(n).addScaledVector(Ki,o);let x=h*p-f*d;if(x<=0&&d-h>=0&&f-p>=0)return mh.subVectors(r,s),o=(d-h)/(d-h+(f-p)),e.copy(s).addScaledVector(mh,o);let m=1/(x+y+u);return a=y*m,o=u*m,e.copy(n).addScaledVector(Ji,a).addScaledVector(Ki,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Ln=class{constructor(t=new U(1/0,1/0,1/0),e=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(gn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(gn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=gn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,gn):gn.fromBufferAttribute(r,a),gn.applyMatrix4(t.matrixWorld),this.expandByPoint(gn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Ar.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ar.copy(n.boundingBox)),Ar.applyMatrix4(t.matrixWorld),this.union(Ar)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,gn),gn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(ws),Rr.subVectors(this.max,ws),ji.subVectors(t.a,ws),Qi.subVectors(t.b,ws),ts.subVectors(t.c,ws),ri.subVectors(Qi,ji),ai.subVectors(ts,Qi),wi.subVectors(ji,ts);let e=[0,-ri.z,ri.y,0,-ai.z,ai.y,0,-wi.z,wi.y,ri.z,0,-ri.x,ai.z,0,-ai.x,wi.z,0,-wi.x,-ri.y,ri.x,0,-ai.y,ai.x,0,-wi.y,wi.x,0];return!hl(e,ji,Qi,ts,Rr)||(e=[1,0,0,0,1,0,0,0,1],!hl(e,ji,Qi,ts,Rr))?!1:(Cr.crossVectors(ri,ai),e=[Cr.x,Cr.y,Cr.z],hl(e,ji,Qi,ts,Rr))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,gn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(gn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(qn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),qn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),qn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),qn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),qn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),qn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),qn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),qn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(qn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},qn=[new U,new U,new U,new U,new U,new U,new U,new U],gn=new U,Ar=new Ln,ji=new U,Qi=new U,ts=new U,ri=new U,ai=new U,wi=new U,ws=new U,Rr=new U,Cr=new U,Ai=new U;function hl(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Ai.fromArray(i,r);let o=s.x*Math.abs(Ai.x)+s.y*Math.abs(Ai.y)+s.z*Math.abs(Ai.z),l=t.dot(Ai),c=e.dot(Ai),h=n.dot(Ai);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var Me=new U,Ir=new Lt,zd=0,kt=class extends Pn{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:zd++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=El,this.updateRanges=[],this.gpuType=on,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Ir.fromBufferAttribute(this,e),Ir.applyMatrix3(t),this.setXY(e,Ir.x,Ir.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Me.fromBufferAttribute(this,e),Me.applyMatrix3(t),this.setXYZ(e,Me.x,Me.y,Me.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Me.fromBufferAttribute(this,e),Me.applyMatrix4(t),this.setXYZ(e,Me.x,Me.y,Me.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Me.fromBufferAttribute(this,e),Me.applyNormalMatrix(t),this.setXYZ(e,Me.x,Me.y,Me.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Me.fromBufferAttribute(this,e),Me.transformDirection(t),this.setXYZ(e,Me.x,Me.y,Me.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=Es(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Xe(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=Es(e,this.array)),e}setX(t,e){return this.normalized&&(e=Xe(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=Es(e,this.array)),e}setY(t,e){return this.normalized&&(e=Xe(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=Es(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Xe(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=Es(e,this.array)),e}setW(t,e){return this.normalized&&(e=Xe(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Xe(e,this.array),n=Xe(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Xe(e,this.array),n=Xe(n,this.array),s=Xe(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Xe(e,this.array),n=Xe(n,this.array),s=Xe(s,this.array),r=Xe(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==El&&(t.usage=this.usage),t}dispose(){this.dispatchEvent({type:"dispose"})}};var Os=class extends kt{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var Bs=class extends kt{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var ee=class extends kt{constructor(t,e,n){super(new Float32Array(t),e,n)}},Vd=new Ln,As=new U,ul=new U,Jn=class{constructor(t=new U,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Vd.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;As.subVectors(t,this.center);let e=As.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(As,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ul.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(As.copy(t.center).add(ul)),this.expandByPoint(As.copy(t.center).sub(ul))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},Hd=0,nn=new Qt,dl=new Fe,es=new U,je=new Ln,Rs=new Ln,Re=new U,he=class i extends Pn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Hd++}),this.uuid=rr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Ad(t)?Bs:Os)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Nt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return nn.makeRotationFromQuaternion(t),this.applyMatrix4(nn),this}rotateX(t){return nn.makeRotationX(t),this.applyMatrix4(nn),this}rotateY(t){return nn.makeRotationY(t),this.applyMatrix4(nn),this}rotateZ(t){return nn.makeRotationZ(t),this.applyMatrix4(nn),this}translate(t,e,n){return nn.makeTranslation(t,e,n),this.applyMatrix4(nn),this}scale(t,e,n){return nn.makeScale(t,e,n),this.applyMatrix4(nn),this}lookAt(t){return dl.lookAt(t),dl.updateMatrix(),this.applyMatrix4(dl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(es).negate(),this.translate(es.x,es.y,es.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new ee(n,3))}else{let n=Math.min(t.length,e.count);for(let s=0;s<n;s++){let r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Ct("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ln);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){It("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];je.setFromBufferAttribute(r),this.morphTargetsRelative?(Re.addVectors(this.boundingBox.min,je.min),this.boundingBox.expandByPoint(Re),Re.addVectors(this.boundingBox.max,je.max),this.boundingBox.expandByPoint(Re)):(this.boundingBox.expandByPoint(je.min),this.boundingBox.expandByPoint(je.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&It('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Jn);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){It("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new U,1/0);return}if(t){let n=this.boundingSphere.center;if(je.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];Rs.setFromBufferAttribute(o),this.morphTargetsRelative?(Re.addVectors(je.min,Rs.min),je.expandByPoint(Re),Re.addVectors(je.max,Rs.max),je.expandByPoint(Re)):(je.expandByPoint(Rs.min),je.expandByPoint(Rs.max))}je.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)Re.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Re));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Re.fromBufferAttribute(o,c),l&&(es.fromBufferAttribute(t,c),Re.add(es)),s=Math.max(s,n.distanceToSquared(Re))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&It('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){It("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv,a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new kt(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));let o=[],l=[];for(let g=0;g<n.count;g++)o[g]=new U,l[g]=new U;let c=new U,h=new U,d=new U,u=new Lt,f=new Lt,p=new Lt,y=new U,x=new U;function m(g,M,R){c.fromBufferAttribute(n,g),h.fromBufferAttribute(n,M),d.fromBufferAttribute(n,R),u.fromBufferAttribute(r,g),f.fromBufferAttribute(r,M),p.fromBufferAttribute(r,R),h.sub(c),d.sub(c),f.sub(u),p.sub(u);let I=1/(f.x*p.y-p.x*f.y);isFinite(I)&&(y.copy(h).multiplyScalar(p.y).addScaledVector(d,-f.y).multiplyScalar(I),x.copy(d).multiplyScalar(f.x).addScaledVector(h,-p.x).multiplyScalar(I),o[g].add(y),o[M].add(y),o[R].add(y),l[g].add(x),l[M].add(x),l[R].add(x))}let b=this.groups;b.length===0&&(b=[{start:0,count:t.count}]);for(let g=0,M=b.length;g<M;++g){let R=b[g],I=R.start,P=R.count;for(let N=I,k=I+P;N<k;N+=3)m(t.getX(N+0),t.getX(N+1),t.getX(N+2))}let T=new U,v=new U,w=new U,A=new U;function E(g){w.fromBufferAttribute(s,g),A.copy(w);let M=o[g];T.copy(M),T.sub(w.multiplyScalar(w.dot(M))).normalize(),v.crossVectors(A,M);let I=v.dot(l[g])<0?-1:1;a.setXYZW(g,T.x,T.y,T.z,I)}for(let g=0,M=b.length;g<M;++g){let R=b[g],I=R.start,P=R.count;for(let N=I,k=I+P;N<k;N+=3)E(t.getX(N+0)),E(t.getX(N+1)),E(t.getX(N+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new kt(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,f=n.count;u<f;u++)n.setXYZ(u,0,0,0);let s=new U,r=new U,a=new U,o=new U,l=new U,c=new U,h=new U,d=new U;if(t)for(let u=0,f=t.count;u<f;u+=3){let p=t.getX(u+0),y=t.getX(u+1),x=t.getX(u+2);s.fromBufferAttribute(e,p),r.fromBufferAttribute(e,y),a.fromBufferAttribute(e,x),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),o.fromBufferAttribute(n,p),l.fromBufferAttribute(n,y),c.fromBufferAttribute(n,x),o.add(h),l.add(h),c.add(h),n.setXYZ(p,o.x,o.y,o.z),n.setXYZ(y,l.x,l.y,l.z),n.setXYZ(x,c.x,c.y,c.z)}else for(let u=0,f=e.count;u<f;u+=3)s.fromBufferAttribute(e,u+0),r.fromBufferAttribute(e,u+1),a.fromBufferAttribute(e,u+2),h.subVectors(a,r),d.subVectors(s,r),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Re.fromBufferAttribute(t,e),Re.normalize(),t.setXYZ(e,Re.x,Re.y,Re.z)}toNonIndexed(){function t(o,l){let c=o.array,h=o.itemSize,d=o.normalized,u=new c.constructor(l.length*h),f=0,p=0;for(let y=0,x=l.length;y<x;y++){o.isInterleavedBufferAttribute?f=l[y]*o.data.stride+o.offset:f=l[y]*h;for(let m=0;m<h;m++)u[p++]=c[f++]}return new kt(u,h,d)}if(this.index===null)return Ct("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,n);e.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,d=c.length;h<d;h++){let u=c[h],f=t(u,n);l.push(f)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){let f=c[d];h.push(f.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],d=r[c];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let c=0,h=a.length;c<h;c++){let d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Gd=0,Kn=class extends Pn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Gd++}),this.uuid=rr(),this.name="",this.type="Material",this.blending=Li,this.side=Zn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=$r,this.blendDst=Zr,this.blendEquation=hi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Tt(0,0,0),this.blendAlpha=0,this.depthFunc=Ni,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Sl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ii,this.stencilZFail=Ii,this.stencilZPass=Ii,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){Ct(`Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){Ct(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Li&&(n.blending=this.blending),this.side!==Zn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==$r&&(n.blendSrc=this.blendSrc),this.blendDst!==Zr&&(n.blendDst=this.blendDst),this.blendEquation!==hi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ni&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Sl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ii&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ii&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ii&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.allowOverride===!1&&(n.allowOverride=!1),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Tt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Lt().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Lt().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var Yn=new U,fl=new U,Pr=new U,oi=new U,pl=new U,Lr=new U,ml=new U,ks=class{constructor(t=new U,e=new U(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Yn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=Yn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Yn.copy(this.origin).addScaledVector(this.direction,e),Yn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){fl.copy(t).add(e).multiplyScalar(.5),Pr.copy(e).sub(t).normalize(),oi.copy(this.origin).sub(fl);let r=t.distanceTo(e)*.5,a=-this.direction.dot(Pr),o=oi.dot(this.direction),l=-oi.dot(Pr),c=oi.lengthSq(),h=Math.abs(1-a*a),d,u,f,p;if(h>0)if(d=a*l-o,u=a*o-l,p=r*h,d>=0)if(u>=-p)if(u<=p){let y=1/h;d*=y,u*=y,f=d*(d+a*u+2*o)+u*(a*d+u+2*l)+c}else u=r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;else u=-r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;else u<=-p?(d=Math.max(0,-(-a*r+o)),u=d>0?-r:Math.min(Math.max(-r,-l),r),f=-d*d+u*(u+2*l)+c):u<=p?(d=0,u=Math.min(Math.max(-r,-l),r),f=u*(u+2*l)+c):(d=Math.max(0,-(a*r+o)),u=d>0?r:Math.min(Math.max(-r,-l),r),f=-d*d+u*(u+2*l)+c);else u=a>0?-r:r,d=Math.max(0,-(a*u+o)),f=-d*d+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(fl).addScaledVector(Pr,u),f}intersectSphere(t,e){Yn.subVectors(t.center,this.origin);let n=Yn.dot(this.direction),s=Yn.dot(Yn)-n*n,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(n=(t.min.x-u.x)*c,s=(t.max.x-u.x)*c):(n=(t.max.x-u.x)*c,s=(t.min.x-u.x)*c),h>=0?(r=(t.min.y-u.y)*h,a=(t.max.y-u.y)*h):(r=(t.max.y-u.y)*h,a=(t.min.y-u.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),d>=0?(o=(t.min.z-u.z)*d,l=(t.max.z-u.z)*d):(o=(t.max.z-u.z)*d,l=(t.min.z-u.z)*d),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Yn)!==null}intersectTriangle(t,e,n,s,r){pl.subVectors(e,t),Lr.subVectors(n,t),ml.crossVectors(pl,Lr);let a=this.direction.dot(ml),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;oi.subVectors(this.origin,t);let l=o*this.direction.dot(Lr.crossVectors(oi,Lr));if(l<0)return null;let c=o*this.direction.dot(pl.cross(oi));if(c<0||l+c>a)return null;let h=-o*oi.dot(ml);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},rn=class extends Kn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Tt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new yn,this.combine=Nl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},gh=new Qt,Ri=new ks,Nr=new Jn,xh=new U,Dr=new U,Ur=new U,Fr=new U,gl=new U,Or=new U,yh=new U,Br=new U,Ht=class extends Fe{constructor(t=new he,e=new rn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){Or.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],d=r[l];h!==0&&(gl.fromBufferAttribute(d,t),a?Or.addScaledVector(gl,h):Or.addScaledVector(gl.sub(e),h))}e.add(Or)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Nr.copy(n.boundingSphere),Nr.applyMatrix4(r),Ri.copy(t.ray).recast(t.near),!(Nr.containsPoint(Ri.origin)===!1&&(Ri.intersectSphere(Nr,xh)===null||Ri.origin.distanceToSquared(xh)>(t.far-t.near)**2))&&(gh.copy(r).invert(),Ri.copy(t.ray).applyMatrix4(gh),!(n.boundingBox!==null&&Ri.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Ri)))}_computeIntersections(t,e,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,u=r.groups,f=r.drawRange;if(o!==null)if(Array.isArray(a))for(let p=0,y=u.length;p<y;p++){let x=u[p],m=a[x.materialIndex],b=Math.max(x.start,f.start),T=Math.min(o.count,Math.min(x.start+x.count,f.start+f.count));for(let v=b,w=T;v<w;v+=3){let A=o.getX(v),E=o.getX(v+1),g=o.getX(v+2);s=kr(this,m,t,n,c,h,d,A,E,g),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=x.materialIndex,e.push(s))}}else{let p=Math.max(0,f.start),y=Math.min(o.count,f.start+f.count);for(let x=p,m=y;x<m;x+=3){let b=o.getX(x),T=o.getX(x+1),v=o.getX(x+2);s=kr(this,a,t,n,c,h,d,b,T,v),s&&(s.faceIndex=Math.floor(x/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let p=0,y=u.length;p<y;p++){let x=u[p],m=a[x.materialIndex],b=Math.max(x.start,f.start),T=Math.min(l.count,Math.min(x.start+x.count,f.start+f.count));for(let v=b,w=T;v<w;v+=3){let A=v,E=v+1,g=v+2;s=kr(this,m,t,n,c,h,d,A,E,g),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=x.materialIndex,e.push(s))}}else{let p=Math.max(0,f.start),y=Math.min(l.count,f.start+f.count);for(let x=p,m=y;x<m;x+=3){let b=x,T=x+1,v=x+2;s=kr(this,a,t,n,c,h,d,b,T,v),s&&(s.faceIndex=Math.floor(x/3),e.push(s))}}}};function Wd(i,t,e,n,s,r,a,o){let l;if(t.side===Ge?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===Zn,o),l===null)return null;Br.copy(o),Br.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(Br);return c<e.near||c>e.far?null:{distance:c,point:Br.clone(),object:i}}function kr(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,Dr),i.getVertexPosition(l,Ur),i.getVertexPosition(c,Fr);let h=Wd(i,t,e,n,Dr,Ur,Fr,yh);if(h){let d=new U;ci.getBarycoord(yh,Dr,Ur,Fr,d),s&&(h.uv=ci.getInterpolatedAttribute(s,o,l,c,d,new Lt)),r&&(h.uv1=ci.getInterpolatedAttribute(r,o,l,c,d,new Lt)),a&&(h.normal=ci.getInterpolatedAttribute(a,o,l,c,d,new U),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new U,materialIndex:0};ci.getNormal(Dr,Ur,Fr,u.normal),h.face=u,h.barycoord=d}return h}var zs=class extends Ve{constructor(t=null,e=1,n=1,s,r,a,o,l,c=Ce,h=Ce,d,u){super(null,a,o,l,c,h,s,r,d,u),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ui=class extends kt{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){let t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}},ns=new Qt,_h=new Qt,zr=[],vh=new Ln,Xd=new Qt,Cs=new Ht,Is=new Jn,Vs=class extends Ht{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new ui(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Xd)}computeBoundingBox(){let t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Ln),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,ns),vh.copy(t.boundingBox).applyMatrix4(ns),this.boundingBox.union(vh)}computeBoundingSphere(){let t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Jn),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,ns),Is.copy(t.boundingSphere).applyMatrix4(ns),this.boundingSphere.union(Is)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){let n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(t,e){let n=this.matrixWorld,s=this.count;if(Cs.geometry=this.geometry,Cs.material=this.material,Cs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Is.copy(this.boundingSphere),Is.applyMatrix4(n),t.ray.intersectsSphere(Is)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,ns),_h.multiplyMatrices(n,ns),Cs.matrixWorld=_h,Cs.raycast(t,zr);for(let a=0,o=zr.length;a<o;a++){let l=zr[a];l.instanceId=r,l.object=this,e.push(l)}zr.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new ui(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){let n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new zs(new Float32Array(s*this.count),s,this.count,Ua,on));let r=this.morphTexture.source.data.data,a=0;for(let c=0;c<n.length;c++)a+=n[c];let o=this.geometry.morphTargetsRelative?1:1-a,l=s*t;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},xl=new U,qd=new U,Yd=new Nt,Rn=class{constructor(t=new U(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=xl.subVectors(n,e).cross(qd.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let s=t.delta(xl),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(s,a)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Yd.getNormalMatrix(t),s=this.coplanarPoint(xl).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},Ci=new Jn,$d=new Lt(.5,.5),Vr=new U,us=class{constructor(t=new Rn,e=new Rn,n=new Rn,s=new Rn,r=new Rn,a=new Rn){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=xn,n=!1){let s=this.planes,r=t.elements,a=r[0],o=r[1],l=r[2],c=r[3],h=r[4],d=r[5],u=r[6],f=r[7],p=r[8],y=r[9],x=r[10],m=r[11],b=r[12],T=r[13],v=r[14],w=r[15];if(s[0].setComponents(c-a,f-h,m-p,w-b).normalize(),s[1].setComponents(c+a,f+h,m+p,w+b).normalize(),s[2].setComponents(c+o,f+d,m+y,w+T).normalize(),s[3].setComponents(c-o,f-d,m-y,w-T).normalize(),n)s[4].setComponents(l,u,x,v).normalize(),s[5].setComponents(c-l,f-u,m-x,w-v).normalize();else if(s[4].setComponents(c-l,f-u,m-x,w-v).normalize(),e===xn)s[5].setComponents(c+l,f+u,m+x,w+v).normalize();else if(e===os)s[5].setComponents(l,u,x,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Ci.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Ci.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Ci)}intersectsSprite(t){Ci.center.set(0,0,0);let e=$d.distanceTo(t.center);return Ci.radius=.7071067811865476+e,Ci.applyMatrix4(t.matrixWorld),this.intersectsSphere(Ci)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(Vr.x=s.normal.x>0?t.max.x:t.min.x,Vr.y=s.normal.y>0?t.max.y:t.min.y,Vr.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Vr)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var ca=class extends Kn{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Tt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},Mh=new Qt,Tl=new ks,Hr=new Jn,Gr=new U,di=class extends Fe{constructor(t=new he,e=new ca){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Hr.copy(n.boundingSphere),Hr.applyMatrix4(s),Hr.radius+=r,t.ray.intersectsSphere(Hr)===!1)return;Mh.copy(s).invert(),Tl.copy(t.ray).applyMatrix4(Mh);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,d=n.attributes.position;if(c!==null){let u=Math.max(0,a.start),f=Math.min(c.count,a.start+a.count);for(let p=u,y=f;p<y;p++){let x=c.getX(p);Gr.fromBufferAttribute(d,x),bh(Gr,x,l,s,t,e,this)}}else{let u=Math.max(0,a.start),f=Math.min(d.count,a.start+a.count);for(let p=u,y=f;p<y;p++)Gr.fromBufferAttribute(d,p),bh(Gr,p,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function bh(i,t,e,n,s,r,a){let o=Tl.distanceSqToPoint(i);if(o<e){let l=new U;Tl.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}var Hs=class extends Ve{constructor(t=[],e=xi,n,s,r,a,o,l,c,h){super(t,e,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Gs=class extends Ve{constructor(t,e,n,s,r,a,o,l,c){super(t,e,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var jn=class extends Ve{constructor(t,e,n=Mn,s,r,a,o=Ce,l=Ce,c,h=In,d=1){if(h!==In&&h!==_i)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:t,height:e,depth:d};super(u,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new cs(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},ha=class extends jn{constructor(t,e=Mn,n=xi,s,r,a=Ce,o=Ce,l,c=In){let h={width:t,height:t,depth:1},d=[h,h,h,h,h,h];super(t,t,e,n,s,r,a,o,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},Ws=class extends Ve{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},Se=class i extends he{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],d=[],u=0,f=0;p("z","y","x",-1,-1,n,e,t,a,r,0),p("z","y","x",1,-1,n,e,-t,a,r,1),p("x","z","y",1,1,t,n,e,s,a,2),p("x","z","y",1,-1,t,n,-e,s,a,3),p("x","y","z",1,-1,t,e,n,s,r,4),p("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new ee(c,3)),this.setAttribute("normal",new ee(h,3)),this.setAttribute("uv",new ee(d,2));function p(y,x,m,b,T,v,w,A,E,g,M){let R=v/E,I=w/g,P=v/2,N=w/2,k=A/2,F=E+1,H=g+1,W=0,Z=0,Q=new U;for(let rt=0;rt<H;rt++){let dt=rt*I-N;for(let xt=0;xt<F;xt++){let $t=xt*R-P;Q[y]=$t*b,Q[x]=dt*T,Q[m]=k,c.push(Q.x,Q.y,Q.z),Q[y]=0,Q[x]=0,Q[m]=A>0?1:-1,h.push(Q.x,Q.y,Q.z),d.push(xt/E),d.push(1-rt/g),W+=1}}for(let rt=0;rt<g;rt++)for(let dt=0;dt<E;dt++){let xt=u+dt+F*rt,$t=u+dt+F*(rt+1),ue=u+(dt+1)+F*(rt+1),Zt=u+(dt+1)+F*rt;l.push(xt,$t,Zt),l.push($t,ue,Zt),Z+=6}o.addGroup(f,Z,M),f+=Z,u+=W}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},ds=class i extends he{constructor(t=1,e=1,n=4,s=8,r=1){super(),this.type="CapsuleGeometry",this.parameters={radius:t,height:e,capSegments:n,radialSegments:s,heightSegments:r},e=Math.max(0,e),n=Math.max(1,Math.floor(n)),s=Math.max(3,Math.floor(s)),r=Math.max(1,Math.floor(r));let a=[],o=[],l=[],c=[],h=e/2,d=Math.PI/2*t,u=e,f=2*d+u,p=n*2+r,y=s+1,x=new U,m=new U;for(let b=0;b<=p;b++){let T=0,v=0,w=0,A=0;if(b<=n){let M=b/n,R=M*Math.PI/2;v=-h-t*Math.cos(R),w=t*Math.sin(R),A=-t*Math.cos(R),T=M*d}else if(b<=n+r){let M=(b-n)/r;v=-h+M*e,w=t,A=0,T=d+M*u}else{let M=(b-n-r)/n,R=M*Math.PI/2;v=h+t*Math.sin(R),w=t*Math.cos(R),A=t*Math.sin(R),T=d+u+M*d}let E=Math.max(0,Math.min(1,T/f)),g=0;b===0?g=.5/s:b===p&&(g=-.5/s);for(let M=0;M<=s;M++){let R=M/s,I=R*Math.PI*2,P=Math.sin(I),N=Math.cos(I);m.x=-w*N,m.y=v,m.z=w*P,o.push(m.x,m.y,m.z),x.set(-w*N,A,w*P),x.normalize(),l.push(x.x,x.y,x.z),c.push(R+g,E)}if(b>0){let M=(b-1)*y;for(let R=0;R<s;R++){let I=M+R,P=M+R+1,N=b*y+R,k=b*y+R+1;a.push(I,P,N),a.push(P,k,N)}}}this.setIndex(a),this.setAttribute("position",new ee(o,3)),this.setAttribute("normal",new ee(l,3)),this.setAttribute("uv",new ee(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.height,t.capSegments,t.radialSegments,t.heightSegments)}};var Ie=class i extends he{constructor(t=1,e=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],d=[],u=[],f=[],p=0,y=[],x=n/2,m=0;b(),a===!1&&(t>0&&T(!0),e>0&&T(!1)),this.setIndex(h),this.setAttribute("position",new ee(d,3)),this.setAttribute("normal",new ee(u,3)),this.setAttribute("uv",new ee(f,2));function b(){let v=new U,w=new U,A=0,E=(e-t)/n;for(let g=0;g<=r;g++){let M=[],R=g/r,I=R*(e-t)+t;for(let P=0;P<=s;P++){let N=P/s,k=N*l+o,F=Math.sin(k),H=Math.cos(k);w.x=I*F,w.y=-R*n+x,w.z=I*H,d.push(w.x,w.y,w.z),v.set(F,E,H).normalize(),u.push(v.x,v.y,v.z),f.push(N,1-R),M.push(p++)}y.push(M)}for(let g=0;g<s;g++)for(let M=0;M<r;M++){let R=y[M][g],I=y[M+1][g],P=y[M+1][g+1],N=y[M][g+1];(t>0||M!==0)&&(h.push(R,I,N),A+=3),(e>0||M!==r-1)&&(h.push(I,P,N),A+=3)}c.addGroup(m,A,0),m+=A}function T(v){let w=p,A=new Lt,E=new U,g=0,M=v===!0?t:e,R=v===!0?1:-1;for(let P=1;P<=s;P++)d.push(0,x*R,0),u.push(0,R,0),f.push(.5,.5),p++;let I=p;for(let P=0;P<=s;P++){let k=P/s*l+o,F=Math.cos(k),H=Math.sin(k);E.x=M*H,E.y=x*R,E.z=M*F,d.push(E.x,E.y,E.z),u.push(0,R,0),A.x=F*.5+.5,A.y=H*.5*R+.5,f.push(A.x,A.y),p++}for(let P=0;P<s;P++){let N=w+P,k=I+P;v===!0?h.push(k,k+1,N):h.push(k+1,k,N),g+=3}c.addGroup(m,g,v===!0?1:2),m+=g}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Ui=class i extends Ie{constructor(t=1,e=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new i(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},ua=class i extends he{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};let r=[],a=[];o(s),c(n),h(),this.setAttribute("position",new ee(r,3)),this.setAttribute("normal",new ee(r.slice(),3)),this.setAttribute("uv",new ee(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(b){let T=new U,v=new U,w=new U;for(let A=0;A<e.length;A+=3)f(e[A+0],T),f(e[A+1],v),f(e[A+2],w),l(T,v,w,b)}function l(b,T,v,w){let A=w+1,E=[];for(let g=0;g<=A;g++){E[g]=[];let M=b.clone().lerp(v,g/A),R=T.clone().lerp(v,g/A),I=A-g;for(let P=0;P<=I;P++)P===0&&g===A?E[g][P]=M:E[g][P]=M.clone().lerp(R,P/I)}for(let g=0;g<A;g++)for(let M=0;M<2*(A-g)-1;M++){let R=Math.floor(M/2);M%2===0?(u(E[g][R+1]),u(E[g+1][R]),u(E[g][R])):(u(E[g][R+1]),u(E[g+1][R+1]),u(E[g+1][R]))}}function c(b){let T=new U;for(let v=0;v<r.length;v+=3)T.x=r[v+0],T.y=r[v+1],T.z=r[v+2],T.normalize().multiplyScalar(b),r[v+0]=T.x,r[v+1]=T.y,r[v+2]=T.z}function h(){let b=new U;for(let T=0;T<r.length;T+=3){b.x=r[T+0],b.y=r[T+1],b.z=r[T+2];let v=x(b)/2/Math.PI+.5,w=m(b)/Math.PI+.5;a.push(v,1-w)}p(),d()}function d(){for(let b=0;b<a.length;b+=6){let T=a[b+0],v=a[b+2],w=a[b+4],A=Math.max(T,v,w),E=Math.min(T,v,w);A>.9&&E<.1&&(T<.2&&(a[b+0]+=1),v<.2&&(a[b+2]+=1),w<.2&&(a[b+4]+=1))}}function u(b){r.push(b.x,b.y,b.z)}function f(b,T){let v=b*3;T.x=t[v+0],T.y=t[v+1],T.z=t[v+2]}function p(){let b=new U,T=new U,v=new U,w=new U,A=new Lt,E=new Lt,g=new Lt;for(let M=0,R=0;M<r.length;M+=9,R+=6){b.set(r[M+0],r[M+1],r[M+2]),T.set(r[M+3],r[M+4],r[M+5]),v.set(r[M+6],r[M+7],r[M+8]),A.set(a[R+0],a[R+1]),E.set(a[R+2],a[R+3]),g.set(a[R+4],a[R+5]),w.copy(b).add(T).add(v).divideScalar(3);let I=x(w);y(A,R+0,b,I),y(E,R+2,T,I),y(g,R+4,v,I)}}function y(b,T,v,w){w<0&&b.x===1&&(a[T]=b.x-1),v.x===0&&v.z===0&&(a[T]=w/2/Math.PI+.5)}function x(b){return Math.atan2(b.z,-b.x)}function m(b){return Math.atan2(-b.y,Math.sqrt(b.x*b.x+b.z*b.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.vertices,t.indices,t.radius,t.detail)}};var Fi=class i extends ua{constructor(t=1,e=0){let n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new i(t.radius,t.detail)}};var Nn=class i extends he{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,d=t/o,u=e/l,f=[],p=[],y=[],x=[];for(let m=0;m<h;m++){let b=m*u-a;for(let T=0;T<c;T++){let v=T*d-r;p.push(v,-b,0),y.push(0,0,1),x.push(T/o),x.push(1-m/l)}}for(let m=0;m<l;m++)for(let b=0;b<o;b++){let T=b+c*m,v=b+c*(m+1),w=b+1+c*(m+1),A=b+1+c*m;f.push(T,v,A),f.push(v,w,A)}this.setIndex(f),this.setAttribute("position",new ee(p,3)),this.setAttribute("normal",new ee(y,3)),this.setAttribute("uv",new ee(x,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}};var qe=class i extends he{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));let l=Math.min(a+o,Math.PI),c=0,h=[],d=new U,u=new U,f=[],p=[],y=[],x=[];for(let m=0;m<=n;m++){let b=[],T=m/n,v=a+T*o,w=t*Math.cos(v),A=Math.sqrt(t*t-w*w),E=0;m===0&&a===0?E=.5/e:m===n&&l===Math.PI&&(E=-.5/e);for(let g=0;g<=e;g++){let M=g/e,R=s+M*r;d.x=-A*Math.cos(R),d.y=w,d.z=A*Math.sin(R),p.push(d.x,d.y,d.z),u.copy(d).normalize(),y.push(u.x,u.y,u.z),x.push(M+E,1-T),b.push(c++)}h.push(b)}for(let m=0;m<n;m++)for(let b=0;b<e;b++){let T=h[m][b+1],v=h[m][b],w=h[m+1][b],A=h[m+1][b+1];(m!==0||a>0)&&f.push(T,v,A),(m!==n-1||l<Math.PI)&&f.push(v,w,A)}this.setIndex(f),this.setAttribute("position",new ee(p,3)),this.setAttribute("normal",new ee(y,3)),this.setAttribute("uv",new ee(x,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var _n=class i extends he{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r,thetaStart:a,thetaLength:o},n=Math.floor(n),s=Math.floor(s);let l=[],c=[],h=[],d=[],u=new U,f=new U,p=new U;for(let y=0;y<=n;y++){let x=a+y/n*o;for(let m=0;m<=s;m++){let b=m/s*r;f.x=(t+e*Math.cos(x))*Math.cos(b),f.y=(t+e*Math.cos(x))*Math.sin(b),f.z=e*Math.sin(x),c.push(f.x,f.y,f.z),u.x=t*Math.cos(b),u.y=t*Math.sin(b),p.subVectors(f,u).normalize(),h.push(p.x,p.y,p.z),d.push(m/s),d.push(y/n)}}for(let y=1;y<=n;y++)for(let x=1;x<=s;x++){let m=(s+1)*y+x-1,b=(s+1)*(y-1)+x-1,T=(s+1)*(y-1)+x,v=(s+1)*y+x;l.push(m,b,v),l.push(b,T,v)}this.setIndex(l),this.setAttribute("position",new ee(c,3)),this.setAttribute("normal",new ee(h,3)),this.setAttribute("uv",new ee(d,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}};function ki(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];if(Sh(s))s.isRenderTargetTexture?(Ct("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(Sh(s[0])){let r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function ze(i){let t={};for(let e=0;e<i.length;e++){let n=ki(i[e]);for(let s in n)t[s]=n[s]}return t}function Sh(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Zd(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Zl(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Vt.workingColorSpace}var uu={clone:ki,merge:ze},Jd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Kd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,ce=class extends Kn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Jd,this.fragmentShader=Kd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ki(t.uniforms),this.uniformsGroups=Zd(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let n in t.uniforms){let s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=e[s.value]||null;break;case"c":this.uniforms[n].value=new Tt().setHex(s.value);break;case"v2":this.uniforms[n].value=new Lt().fromArray(s.value);break;case"v3":this.uniforms[n].value=new U().fromArray(s.value);break;case"v4":this.uniforms[n].value=new le().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Nt().fromArray(s.value);break;case"m4":this.uniforms[n].value=new Qt().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},da=class extends ce{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},Dn=class extends Kn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Tt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Tt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=go,this.normalScale=new Lt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new yn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}};var fa=class extends Kn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=jh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},pa=class extends Kn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function Wr(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}var fi=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=e[++n],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},ma=class extends fi{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:vl,endingEnd:vl}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case Ml:r=t,o=2*e-n;break;case bl:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case Ml:a=t,l=2*n-e;break;case bl:a=1,l=n+s[1]-s[0];break;default:a=t-1,l=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,f=this._weightNext,p=(n-e)/(s-e),y=p*p,x=y*p,m=-u*x+2*u*y-u*p,b=(1+u)*x+(-1.5-2*u)*y+(-.5+u)*p+1,T=(-1-f)*x+(1.5+f)*y+.5*p,v=f*x-f*y;for(let w=0;w!==o;++w)r[w]=m*a[h+w]+b*a[c+w]+T*a[l+w]+v*a[d+w];return r}},ga=class extends fi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=(n-e)/(s-e),d=1-h;for(let u=0;u!==o;++u)r[u]=a[c+u]*d+a[l+u]*h;return r}},xa=class extends fi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},ya=class extends fi{interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this.inTangents,d=this.outTangents;if(!h||!d){let p=(n-e)/(s-e),y=1-p;for(let x=0;x!==o;++x)r[x]=a[c+x]*y+a[l+x]*p;return r}let u=o*2,f=t-1;for(let p=0;p!==o;++p){let y=a[c+p],x=a[l+p],m=f*u+p*2,b=d[m],T=d[m+1],v=t*u+p*2,w=h[v],A=h[v+1],E=(n-e)/(s-e),g,M,R,I,P;for(let N=0;N<8;N++){g=E*E,M=g*E,R=1-E,I=R*R,P=I*R;let F=P*e+3*I*E*b+3*R*g*w+M*s-n;if(Math.abs(F)<1e-10)break;let H=3*I*(b-e)+6*R*E*(w-b)+3*g*(s-w);if(Math.abs(H)<1e-10)break;E=E-F/H,E=Math.max(0,Math.min(1,E))}r[p]=P*y+3*I*E*T+3*R*g*A+M*x}return r}},Qe=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Wr(e,this.TimeBufferType),this.values=Wr(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Wr(t.times,Array),values:Wr(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new xa(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new ga(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new ma(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new ya(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case Ps:e=this.InterpolantFactoryMethodDiscrete;break;case sa:e=this.InterpolantFactoryMethodLinear;break;case Yr:e=this.InterpolantFactoryMethodSmooth;break;case _l:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return Ct("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ps;case this.InterpolantFactoryMethodLinear:return sa;case this.InterpolantFactoryMethodSmooth:return Yr;case this.InterpolantFactoryMethodBezier:return _l}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(It("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(It("KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){It("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){It("KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(s!==void 0&&Rd(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){It("KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Yr,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=t[o],h=t[o+1];if(c!==h&&(o!==1||c!==t[0]))if(s)l=!0;else{let d=o*n,u=d-n,f=d+n;for(let p=0;p!==n;++p){let y=e[d+p];if(y!==e[u+p]||y!==e[f+p]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let d=o*n,u=a*n;for(let f=0;f!==n;++f)e[u+f]=e[d+f]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)e[l+c]=e[o+c];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};Qe.prototype.ValueTypeName="";Qe.prototype.TimeBufferType=Float32Array;Qe.prototype.ValueBufferType=Float32Array;Qe.prototype.DefaultInterpolation=sa;var pi=class extends Qe{constructor(t,e,n){super(t,e,n)}};pi.prototype.ValueTypeName="bool";pi.prototype.ValueBufferType=Array;pi.prototype.DefaultInterpolation=Ps;pi.prototype.InterpolantFactoryMethodLinear=void 0;pi.prototype.InterpolantFactoryMethodSmooth=void 0;var _a=class extends Qe{constructor(t,e,n,s){super(t,e,n,s)}};_a.prototype.ValueTypeName="color";var va=class extends Qe{constructor(t,e,n,s){super(t,e,n,s)}};va.prototype.ValueTypeName="number";var Ma=class extends fi{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(s-e),c=t*o;for(let h=c+o;c!==h;c+=4)sn.slerpFlat(r,0,a,c-o,a,c,l);return r}},Xs=class extends Qe{constructor(t,e,n,s){super(t,e,n,s)}InterpolantFactoryMethodLinear(t){return new Ma(this.times,this.values,this.getValueSize(),t)}};Xs.prototype.ValueTypeName="quaternion";Xs.prototype.InterpolantFactoryMethodSmooth=void 0;var mi=class extends Qe{constructor(t,e,n){super(t,e,n)}};mi.prototype.ValueTypeName="string";mi.prototype.ValueBufferType=Array;mi.prototype.DefaultInterpolation=Ps;mi.prototype.InterpolantFactoryMethodLinear=void 0;mi.prototype.InterpolantFactoryMethodSmooth=void 0;var ba=class extends Qe{constructor(t,e,n,s){super(t,e,n,s)}};ba.prototype.ValueTypeName="vector";var Sa=class{constructor(t,e,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=c.length;d<u;d+=2){let f=c[d],p=c[d+1];if(f.global&&(f.lastIndex=0),f.test(h))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},du=new Sa,Ea=class{constructor(t){this.manager=t!==void 0?t:du,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Ea.DEFAULT_MATERIAL_NAME="__DEFAULT";var fs=class extends Fe{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Tt(t),this.intensity=e}dispose(){this.dispatchEvent({type:"dispose"})}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}},qs=class extends fs{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Fe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Tt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){let e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}},yl=new Qt,Eh=new U,Th=new U,Ta=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Lt(512,512),this.mapType=Ye,this.map=null,this.mapPass=null,this.matrix=new Qt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new us,this._frameExtents=new Lt(1,1),this._viewportCount=1,this._viewports=[new le(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera,n=this.matrix;Eh.setFromMatrixPosition(t.matrixWorld),e.position.copy(Eh),Th.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Th),e.updateMatrixWorld(),yl.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(yl,e.coordinateSystem,e.reversedDepth),e.coordinateSystem===os||e.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(yl)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}},Xr=new U,qr=new sn,An=new U,Ys=class extends Fe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Qt,this.projectionMatrix=new Qt,this.projectionMatrixInverse=new Qt,this.coordinateSystem=xn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(Xr,qr,An),An.x===1&&An.y===1&&An.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Xr,qr,An.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(Xr,qr,An),An.x===1&&An.y===1&&An.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Xr,qr,An.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},li=new U,wh=new Lt,Ah=new Lt,De=class extends Ys{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=ra*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Zo*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return ra*2*Math.atan(Math.tan(Zo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){li.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(li.x,li.y).multiplyScalar(-t/li.z),li.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(li.x,li.y).multiplyScalar(-t/li.z)}getViewSize(t,e){return this.getViewBounds(t,wh,Ah),e.subVectors(Ah,wh)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(Zo*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};var wl=class extends Ta{constructor(){super(new De(90,1,.5,500)),this.isPointLightShadow=!0}},$s=class extends fs{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new wl}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}},gi=class extends Ys{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Al=class extends Ta{constructor(){super(new gi(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Oi=class extends fs{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Fe.DEFAULT_UP),this.updateMatrix(),this.target=new Fe,this.shadow=new Al}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}};var is=-90,ss=1,wa=class extends Fe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new De(is,ss,t,e);s.layers=this.layers,this.add(s);let r=new De(is,ss,t,e);r.layers=this.layers,this.add(r);let a=new De(is,ss,t,e);a.layers=this.layers,this.add(a);let o=new De(is,ss,t,e);o.layers=this.layers,this.add(o);let l=new De(is,ss,t,e);l.layers=this.layers,this.add(l);let c=new De(is,ss,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(let c of e)this.remove(c);if(t===xn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===os)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,d=t.getRenderTarget(),u=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),p=t.xr.enabled;t.xr.enabled=!1;let y=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let x=!1;t.isWebGLRenderer===!0?x=t.state.buffers.depth.getReversed():x=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),n.texture.generateMipmaps=y,t.setRenderTarget(n,5,s),x&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(d,u,f),t.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Aa=class extends De{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}};var Jl="\\[\\]\\.:\\/",jd=new RegExp("["+Jl+"]","g"),Kl="[^"+Jl+"]",Qd="[^"+Jl.replace("\\.","")+"]",tf=/((?:WC+[\/:])*)/.source.replace("WC",Kl),ef=/(WCOD+)?/.source.replace("WCOD",Qd),nf=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Kl),sf=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Kl),rf=new RegExp("^"+tf+ef+nf+sf+"$"),af=["material","materials","bones","map"],Rl=class{constructor(t,e,n){let s=n||oe.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},oe=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(jd,"")}static parseTrackName(t){let e=rf.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);af.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=n(o.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Ct("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){It("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){It("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){It("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){It("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){It("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){It("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){It("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let a=t[s];if(a===void 0){let c=e.nodeName;It("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){It("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){It("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};oe.Composite=Rl;oe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};oe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};oe.prototype.GetterByBindingType=[oe.prototype._getValue_direct,oe.prototype._getValue_array,oe.prototype._getValue_arrayElement,oe.prototype._getValue_toArray];oe.prototype.SetterByBindingTypeAndVersioning=[[oe.prototype._setValue_direct,oe.prototype._setValue_direct_setNeedsUpdate,oe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[oe.prototype._setValue_array,oe.prototype._setValue_array_setNeedsUpdate,oe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[oe.prototype._setValue_arrayElement,oe.prototype._setValue_arrayElement_setNeedsUpdate,oe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[oe.prototype._setValue_fromArray,oe.prototype._setValue_fromArray_setNeedsUpdate,oe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var ay=new Float32Array(1);var ic=class ic{constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){let r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=s,this}};ic.prototype.isMatrix2=!0;var Cl=ic;function jl(i,t,e,n){let s=of(n);switch(e){case Xl:return i*t;case Ua:return i*t/s.components*s.byteLength;case Fa:return i*t/s.components*s.byteLength;case vi:return i*t*2/s.components*s.byteLength;case Oa:return i*t*2/s.components*s.byteLength;case ql:return i*t*3/s.components*s.byteLength;case ln:return i*t*4/s.components*s.byteLength;case Ba:return i*t*4/s.components*s.byteLength;case Qs:case tr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case er:case nr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case za:case Ha:return Math.max(i,16)*Math.max(t,8)/4;case ka:case Va:return Math.max(i,8)*Math.max(t,8)/2;case Ga:case Wa:case qa:case Ya:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Xa:case ir:case $a:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Za:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ja:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Ka:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case ja:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Qa:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case to:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case eo:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case no:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case io:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case so:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case ro:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case ao:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case oo:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case lo:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case co:case ho:case uo:return Math.ceil(i/4)*Math.ceil(t/4)*16;case fo:case po:return Math.ceil(i/4)*Math.ceil(t/4)*8;case sr:case mo:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function of(i){switch(i){case Ye:case Vl:return{byteLength:1,components:1};case ms:case Hl:case On:return{byteLength:2,components:1};case Na:case Da:return{byteLength:2,components:4};case Mn:case La:case on:return{byteLength:4,components:1};case Gl:case Wl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"185"}}));typeof window<"u"&&(window.__THREE__?Ct("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="185");function Uu(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function pf(i){let t=new WeakMap;function e(o,l){let c=o.array,h=o.usage,d=c.byteLength,u=i.createBuffer();i.bindBuffer(l,u),i.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=i.SHORT;else if(c instanceof Uint32Array)f=i.UNSIGNED_INT;else if(c instanceof Int32Array)f=i.INT;else if(c instanceof Int8Array)f=i.BYTE;else if(c instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,l,c){let h=l.array,d=l.updateRanges;if(i.bindBuffer(c,o),d.length===0)i.bufferSubData(c,0,h);else{d.sort((f,p)=>f.start-p.start);let u=0;for(let f=1;f<d.length;f++){let p=d[u],y=d[f];y.start<=p.start+p.count+1?p.count=Math.max(p.count,y.start+y.count-p.start):(++u,d[u]=y)}d.length=u+1;for(let f=0,p=d.length;f<p;f++){let y=d[f];i.bufferSubData(c,y.start*h.BYTES_PER_ELEMENT,h,y.start,y.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var mf=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,gf=`#ifdef USE_ALPHAHASH
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
#endif`,xf=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,yf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,_f=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,vf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Mf=`#ifdef USE_AOMAP
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
#endif`,bf=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Sf=`#ifdef USE_BATCHING
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
#endif`,Ef=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Tf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,wf=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Af=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Rf=`#ifdef USE_IRIDESCENCE
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
#endif`,Cf=`#ifdef USE_BUMPMAP
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
#endif`,If=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Pf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Lf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Nf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Df=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Uf=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Ff=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Of=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Bf=`#define PI 3.141592653589793
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
} // validated`,kf=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,zf=`vec3 transformedNormal = objectNormal;
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
#endif`,Vf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Hf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Gf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Wf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Xf="gl_FragColor = linearToOutputTexel( gl_FragColor );",qf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Yf=`#ifdef USE_ENVMAP
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
#endif`,$f=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Zf=`#ifdef USE_ENVMAP
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
#endif`,Jf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Kf=`#ifdef USE_ENVMAP
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
#endif`,jf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Qf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,tp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ep=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,np=`#ifdef USE_GRADIENTMAP
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
}`,ip=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,sp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,rp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,ap=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,op=`#ifdef USE_ENVMAP
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
#endif`,lp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,cp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,hp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,up=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,dp=`PhysicalMaterial material;
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
#endif`,fp=`uniform sampler2D dfgLUT;
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
}`,pp=`
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
#endif`,mp=`#if defined( RE_IndirectDiffuse )
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
#endif`,gp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,xp=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,yp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,_p=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,vp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Mp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,bp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Sp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Ep=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Tp=`#if defined( USE_POINTS_UV )
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
#endif`,wp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Ap=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Rp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Cp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ip=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Pp=`#ifdef USE_MORPHTARGETS
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
#endif`,Lp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Np=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Dp=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Up=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Fp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Op=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Bp=`#ifdef USE_NORMALMAP
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
#endif`,kp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,zp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Vp=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Hp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Gp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Wp=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Xp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,qp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Yp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,$p=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Zp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Jp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Kp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,jp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Qp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,tm=`float getShadowMask() {
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
}`,em=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,nm=`#ifdef USE_SKINNING
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
#endif`,im=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,sm=`#ifdef USE_SKINNING
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
#endif`,rm=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,am=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,om=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,lm=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,cm=`#ifdef USE_TRANSMISSION
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
#endif`,hm=`#ifdef USE_TRANSMISSION
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
#endif`,um=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,dm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,fm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,pm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,mm=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,gm=`uniform sampler2D t2D;
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
}`,xm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ym=`#ifdef ENVMAP_TYPE_CUBE
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
}`,_m=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,vm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Mm=`#include <common>
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
}`,bm=`#if DEPTH_PACKING == 3200
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
}`,Sm=`#define DISTANCE
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
}`,Em=`#define DISTANCE
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
}`,Tm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,wm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Am=`uniform float scale;
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
}`,Rm=`uniform vec3 diffuse;
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
}`,Cm=`#include <common>
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
}`,Im=`uniform vec3 diffuse;
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
}`,Pm=`#define LAMBERT
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
}`,Lm=`#define LAMBERT
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
}`,Nm=`#define MATCAP
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
}`,Dm=`#define MATCAP
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
}`,Um=`#define NORMAL
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
}`,Fm=`#define NORMAL
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
}`,Om=`#define PHONG
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
}`,Bm=`#define PHONG
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
}`,km=`#define STANDARD
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
}`,zm=`#define STANDARD
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
}`,Vm=`#define TOON
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
}`,Hm=`#define TOON
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
}`,Gm=`uniform float size;
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
}`,Wm=`uniform vec3 diffuse;
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
}`,Xm=`#include <common>
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
}`,qm=`uniform vec3 color;
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
}`,Ym=`uniform float rotation;
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
}`,$m=`uniform vec3 diffuse;
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
}`,Ot={alphahash_fragment:mf,alphahash_pars_fragment:gf,alphamap_fragment:xf,alphamap_pars_fragment:yf,alphatest_fragment:_f,alphatest_pars_fragment:vf,aomap_fragment:Mf,aomap_pars_fragment:bf,batching_pars_vertex:Sf,batching_vertex:Ef,begin_vertex:Tf,beginnormal_vertex:wf,bsdfs:Af,iridescence_fragment:Rf,bumpmap_pars_fragment:Cf,clipping_planes_fragment:If,clipping_planes_pars_fragment:Pf,clipping_planes_pars_vertex:Lf,clipping_planes_vertex:Nf,color_fragment:Df,color_pars_fragment:Uf,color_pars_vertex:Ff,color_vertex:Of,common:Bf,cube_uv_reflection_fragment:kf,defaultnormal_vertex:zf,displacementmap_pars_vertex:Vf,displacementmap_vertex:Hf,emissivemap_fragment:Gf,emissivemap_pars_fragment:Wf,colorspace_fragment:Xf,colorspace_pars_fragment:qf,envmap_fragment:Yf,envmap_common_pars_fragment:$f,envmap_pars_fragment:Zf,envmap_pars_vertex:Jf,envmap_physical_pars_fragment:op,envmap_vertex:Kf,fog_vertex:jf,fog_pars_vertex:Qf,fog_fragment:tp,fog_pars_fragment:ep,gradientmap_pars_fragment:np,lightmap_pars_fragment:ip,lights_lambert_fragment:sp,lights_lambert_pars_fragment:rp,lights_pars_begin:ap,lights_toon_fragment:lp,lights_toon_pars_fragment:cp,lights_phong_fragment:hp,lights_phong_pars_fragment:up,lights_physical_fragment:dp,lights_physical_pars_fragment:fp,lights_fragment_begin:pp,lights_fragment_maps:mp,lights_fragment_end:gp,lightprobes_pars_fragment:xp,logdepthbuf_fragment:yp,logdepthbuf_pars_fragment:_p,logdepthbuf_pars_vertex:vp,logdepthbuf_vertex:Mp,map_fragment:bp,map_pars_fragment:Sp,map_particle_fragment:Ep,map_particle_pars_fragment:Tp,metalnessmap_fragment:wp,metalnessmap_pars_fragment:Ap,morphinstance_vertex:Rp,morphcolor_vertex:Cp,morphnormal_vertex:Ip,morphtarget_pars_vertex:Pp,morphtarget_vertex:Lp,normal_fragment_begin:Np,normal_fragment_maps:Dp,normal_pars_fragment:Up,normal_pars_vertex:Fp,normal_vertex:Op,normalmap_pars_fragment:Bp,clearcoat_normal_fragment_begin:kp,clearcoat_normal_fragment_maps:zp,clearcoat_pars_fragment:Vp,iridescence_pars_fragment:Hp,opaque_fragment:Gp,packing:Wp,premultiplied_alpha_fragment:Xp,project_vertex:qp,dithering_fragment:Yp,dithering_pars_fragment:$p,roughnessmap_fragment:Zp,roughnessmap_pars_fragment:Jp,shadowmap_pars_fragment:Kp,shadowmap_pars_vertex:jp,shadowmap_vertex:Qp,shadowmask_pars_fragment:tm,skinbase_vertex:em,skinning_pars_vertex:nm,skinning_vertex:im,skinnormal_vertex:sm,specularmap_fragment:rm,specularmap_pars_fragment:am,tonemapping_fragment:om,tonemapping_pars_fragment:lm,transmission_fragment:cm,transmission_pars_fragment:hm,uv_pars_fragment:um,uv_pars_vertex:dm,uv_vertex:fm,worldpos_vertex:pm,background_vert:mm,background_frag:gm,backgroundCube_vert:xm,backgroundCube_frag:ym,cube_vert:_m,cube_frag:vm,depth_vert:Mm,depth_frag:bm,distance_vert:Sm,distance_frag:Em,equirect_vert:Tm,equirect_frag:wm,linedashed_vert:Am,linedashed_frag:Rm,meshbasic_vert:Cm,meshbasic_frag:Im,meshlambert_vert:Pm,meshlambert_frag:Lm,meshmatcap_vert:Nm,meshmatcap_frag:Dm,meshnormal_vert:Um,meshnormal_frag:Fm,meshphong_vert:Om,meshphong_frag:Bm,meshphysical_vert:km,meshphysical_frag:zm,meshtoon_vert:Vm,meshtoon_frag:Hm,points_vert:Gm,points_frag:Wm,shadow_vert:Xm,shadow_frag:qm,sprite_vert:Ym,sprite_frag:$m},ht={common:{diffuse:{value:new Tt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Nt},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Nt}},envmap:{envMap:{value:null},envMapRotation:{value:new Nt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Nt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Nt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Nt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Nt},normalScale:{value:new Lt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Nt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Nt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Nt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Nt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Tt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new U},probesMax:{value:new U},probesResolution:{value:new U}},points:{diffuse:{value:new Tt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0},uvTransform:{value:new Nt}},sprite:{diffuse:{value:new Tt(16777215)},opacity:{value:1},center:{value:new Lt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Nt},alphaMap:{value:null},alphaMapTransform:{value:new Nt},alphaTest:{value:0}}},kn={basic:{uniforms:ze([ht.common,ht.specularmap,ht.envmap,ht.aomap,ht.lightmap,ht.fog]),vertexShader:Ot.meshbasic_vert,fragmentShader:Ot.meshbasic_frag},lambert:{uniforms:ze([ht.common,ht.specularmap,ht.envmap,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.fog,ht.lights,{emissive:{value:new Tt(0)},envMapIntensity:{value:1}}]),vertexShader:Ot.meshlambert_vert,fragmentShader:Ot.meshlambert_frag},phong:{uniforms:ze([ht.common,ht.specularmap,ht.envmap,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.fog,ht.lights,{emissive:{value:new Tt(0)},specular:{value:new Tt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ot.meshphong_vert,fragmentShader:Ot.meshphong_frag},standard:{uniforms:ze([ht.common,ht.envmap,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.roughnessmap,ht.metalnessmap,ht.fog,ht.lights,{emissive:{value:new Tt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ot.meshphysical_vert,fragmentShader:Ot.meshphysical_frag},toon:{uniforms:ze([ht.common,ht.aomap,ht.lightmap,ht.emissivemap,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.gradientmap,ht.fog,ht.lights,{emissive:{value:new Tt(0)}}]),vertexShader:Ot.meshtoon_vert,fragmentShader:Ot.meshtoon_frag},matcap:{uniforms:ze([ht.common,ht.bumpmap,ht.normalmap,ht.displacementmap,ht.fog,{matcap:{value:null}}]),vertexShader:Ot.meshmatcap_vert,fragmentShader:Ot.meshmatcap_frag},points:{uniforms:ze([ht.points,ht.fog]),vertexShader:Ot.points_vert,fragmentShader:Ot.points_frag},dashed:{uniforms:ze([ht.common,ht.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ot.linedashed_vert,fragmentShader:Ot.linedashed_frag},depth:{uniforms:ze([ht.common,ht.displacementmap]),vertexShader:Ot.depth_vert,fragmentShader:Ot.depth_frag},normal:{uniforms:ze([ht.common,ht.bumpmap,ht.normalmap,ht.displacementmap,{opacity:{value:1}}]),vertexShader:Ot.meshnormal_vert,fragmentShader:Ot.meshnormal_frag},sprite:{uniforms:ze([ht.sprite,ht.fog]),vertexShader:Ot.sprite_vert,fragmentShader:Ot.sprite_frag},background:{uniforms:{uvTransform:{value:new Nt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ot.background_vert,fragmentShader:Ot.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Nt}},vertexShader:Ot.backgroundCube_vert,fragmentShader:Ot.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ot.cube_vert,fragmentShader:Ot.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ot.equirect_vert,fragmentShader:Ot.equirect_frag},distance:{uniforms:ze([ht.common,ht.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ot.distance_vert,fragmentShader:Ot.distance_frag},shadow:{uniforms:ze([ht.lights,ht.fog,{color:{value:new Tt(0)},opacity:{value:1}}]),vertexShader:Ot.shadow_vert,fragmentShader:Ot.shadow_frag}};kn.physical={uniforms:ze([kn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Nt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Nt},clearcoatNormalScale:{value:new Lt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Nt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Nt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Nt},sheen:{value:0},sheenColor:{value:new Tt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Nt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Nt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Nt},transmissionSamplerSize:{value:new Lt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Nt},attenuationDistance:{value:0},attenuationColor:{value:new Tt(0)},specularColor:{value:new Tt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Nt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Nt},anisotropyVector:{value:new Lt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Nt}}]),vertexShader:Ot.meshphysical_vert,fragmentShader:Ot.meshphysical_frag};var _o={r:0,b:0,g:0},Zm=new Qt,Fu=new Nt;Fu.set(-1,0,0,0,1,0,0,0,1);function Jm(i,t,e,n,s,r){let a=new Tt(0),o=s===!0?0:1,l,c,h=null,d=0,u=null;function f(b){let T=b.isScene===!0?b.background:null;if(T&&T.isTexture){let v=b.backgroundBlurriness>0;T=t.get(T,v)}return T}function p(b){let T=!1,v=f(b);v===null?x(a,o):v&&v.isColor&&(x(v,1),T=!0);let w=i.xr.getEnvironmentBlendMode();w==="additive"?e.buffers.color.setClear(0,0,0,1,r):w==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||T)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function y(b,T){let v=f(T);v&&(v.isCubeTexture||v.mapping===Ks)?(c===void 0&&(c=new Ht(new Se(1,1,1),new ce({name:"BackgroundCubeMaterial",uniforms:ki(kn.backgroundCube.uniforms),vertexShader:kn.backgroundCube.vertexShader,fragmentShader:kn.backgroundCube.fragmentShader,side:Ge,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(w,A,E){this.matrixWorld.copyPosition(E.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=v,c.material.uniforms.backgroundBlurriness.value=T.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(Zm.makeRotationFromEuler(T.backgroundRotation)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Fu),c.material.toneMapped=Vt.getTransfer(v.colorSpace)!==Kt,(h!==v||d!==v.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,h=v,d=v.version,u=i.toneMapping),c.layers.enableAll(),b.unshift(c,c.geometry,c.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new Ht(new Nn(2,2),new ce({name:"BackgroundMaterial",uniforms:ki(kn.background.uniforms),vertexShader:kn.background.vertexShader,fragmentShader:kn.background.fragmentShader,side:Zn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,l.material.toneMapped=Vt.getTransfer(v.colorSpace)!==Kt,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(h!==v||d!==v.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,h=v,d=v.version,u=i.toneMapping),l.layers.enableAll(),b.unshift(l,l.geometry,l.material,0,0,null))}function x(b,T){b.getRGB(_o,Zl(i)),e.buffers.color.setClear(_o.r,_o.g,_o.b,T,r)}function m(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(b,T=1){a.set(b),o=T,x(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(b){o=b,x(a,o)},render:p,addToRenderList:y,dispose:m}}function Km(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null),r=s,a=!1;function o(I,P,N,k,F){let H=!1,W=d(I,k,N,P);r!==W&&(r=W,c(r.object)),H=f(I,k,N,F),H&&p(I,k,N,F),F!==null&&t.update(F,i.ELEMENT_ARRAY_BUFFER),(H||a)&&(a=!1,v(I,P,N,k),F!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(F).buffer))}function l(){return i.createVertexArray()}function c(I){return i.bindVertexArray(I)}function h(I){return i.deleteVertexArray(I)}function d(I,P,N,k){let F=k.wireframe===!0,H=n[P.id];H===void 0&&(H={},n[P.id]=H);let W=I.isInstancedMesh===!0?I.id:0,Z=H[W];Z===void 0&&(Z={},H[W]=Z);let Q=Z[N.id];Q===void 0&&(Q={},Z[N.id]=Q);let rt=Q[F];return rt===void 0&&(rt=u(l()),Q[F]=rt),rt}function u(I){let P=[],N=[],k=[];for(let F=0;F<e;F++)P[F]=0,N[F]=0,k[F]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:N,attributeDivisors:k,object:I,attributes:{},index:null}}function f(I,P,N,k){let F=r.attributes,H=P.attributes,W=0,Z=N.getAttributes();for(let Q in Z)if(Z[Q].location>=0){let dt=F[Q],xt=H[Q];if(xt===void 0&&(Q==="instanceMatrix"&&I.instanceMatrix&&(xt=I.instanceMatrix),Q==="instanceColor"&&I.instanceColor&&(xt=I.instanceColor)),dt===void 0||dt.attribute!==xt||xt&&dt.data!==xt.data)return!0;W++}return r.attributesNum!==W||r.index!==k}function p(I,P,N,k){let F={},H=P.attributes,W=0,Z=N.getAttributes();for(let Q in Z)if(Z[Q].location>=0){let dt=H[Q];dt===void 0&&(Q==="instanceMatrix"&&I.instanceMatrix&&(dt=I.instanceMatrix),Q==="instanceColor"&&I.instanceColor&&(dt=I.instanceColor));let xt={};xt.attribute=dt,dt&&dt.data&&(xt.data=dt.data),F[Q]=xt,W++}r.attributes=F,r.attributesNum=W,r.index=k}function y(){let I=r.newAttributes;for(let P=0,N=I.length;P<N;P++)I[P]=0}function x(I){m(I,0)}function m(I,P){let N=r.newAttributes,k=r.enabledAttributes,F=r.attributeDivisors;N[I]=1,k[I]===0&&(i.enableVertexAttribArray(I),k[I]=1),F[I]!==P&&(i.vertexAttribDivisor(I,P),F[I]=P)}function b(){let I=r.newAttributes,P=r.enabledAttributes;for(let N=0,k=P.length;N<k;N++)P[N]!==I[N]&&(i.disableVertexAttribArray(N),P[N]=0)}function T(I,P,N,k,F,H,W){W===!0?i.vertexAttribIPointer(I,P,N,F,H):i.vertexAttribPointer(I,P,N,k,F,H)}function v(I,P,N,k){y();let F=k.attributes,H=N.getAttributes(),W=P.defaultAttributeValues;for(let Z in H){let Q=H[Z];if(Q.location>=0){let rt=F[Z];if(rt===void 0&&(Z==="instanceMatrix"&&I.instanceMatrix&&(rt=I.instanceMatrix),Z==="instanceColor"&&I.instanceColor&&(rt=I.instanceColor)),rt!==void 0){let dt=rt.normalized,xt=rt.itemSize,$t=t.get(rt);if($t===void 0)continue;let ue=$t.buffer,Zt=$t.type,K=$t.bytesPerElement,it=Zt===i.INT||Zt===i.UNSIGNED_INT||rt.gpuType===La;if(rt.isInterleavedBufferAttribute){let tt=rt.data,Pt=tt.stride,Dt=rt.offset;if(tt.isInstancedInterleavedBuffer){for(let At=0;At<Q.locationSize;At++)m(Q.location+At,tt.meshPerAttribute);I.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=tt.meshPerAttribute*tt.count)}else for(let At=0;At<Q.locationSize;At++)x(Q.location+At);i.bindBuffer(i.ARRAY_BUFFER,ue);for(let At=0;At<Q.locationSize;At++)T(Q.location+At,xt/Q.locationSize,Zt,dt,Pt*K,(Dt+xt/Q.locationSize*At)*K,it)}else{if(rt.isInstancedBufferAttribute){for(let tt=0;tt<Q.locationSize;tt++)m(Q.location+tt,rt.meshPerAttribute);I.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let tt=0;tt<Q.locationSize;tt++)x(Q.location+tt);i.bindBuffer(i.ARRAY_BUFFER,ue);for(let tt=0;tt<Q.locationSize;tt++)T(Q.location+tt,xt/Q.locationSize,Zt,dt,xt*K,xt/Q.locationSize*tt*K,it)}}else if(W!==void 0){let dt=W[Z];if(dt!==void 0)switch(dt.length){case 2:i.vertexAttrib2fv(Q.location,dt);break;case 3:i.vertexAttrib3fv(Q.location,dt);break;case 4:i.vertexAttrib4fv(Q.location,dt);break;default:i.vertexAttrib1fv(Q.location,dt)}}}}b()}function w(){M();for(let I in n){let P=n[I];for(let N in P){let k=P[N];for(let F in k){let H=k[F];for(let W in H)h(H[W].object),delete H[W];delete k[F]}}delete n[I]}}function A(I){if(n[I.id]===void 0)return;let P=n[I.id];for(let N in P){let k=P[N];for(let F in k){let H=k[F];for(let W in H)h(H[W].object),delete H[W];delete k[F]}}delete n[I.id]}function E(I){for(let P in n){let N=n[P];for(let k in N){let F=N[k];if(F[I.id]===void 0)continue;let H=F[I.id];for(let W in H)h(H[W].object),delete H[W];delete F[I.id]}}}function g(I){for(let P in n){let N=n[P],k=I.isInstancedMesh===!0?I.id:0,F=N[k];if(F!==void 0){for(let H in F){let W=F[H];for(let Z in W)h(W[Z].object),delete W[Z];delete F[H]}delete N[k],Object.keys(N).length===0&&delete n[P]}}}function M(){R(),a=!0,r!==s&&(r=s,c(r.object))}function R(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:M,resetDefaultState:R,dispose:w,releaseStatesOfGeometry:A,releaseStatesOfObject:g,releaseStatesOfProgram:E,initAttributes:y,enableAttribute:x,disableUnusedAttributes:b}}function jm(i,t,e){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),e.update(c,n,1)}function a(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),e.update(c,n,h))}function o(l,c,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let u=0;for(let f=0;f<h;f++)u+=c[f];e.update(u,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function Qm(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let E=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(E.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(E){return!(E!==ln&&n.convert(E)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(E){let g=E===On&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(E!==Ye&&n.convert(E)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&E!==on&&!g)}function l(E){if(E==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";E="mediump"}return E==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp",h=l(c);h!==c&&(Ct("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=e.logarithmicDepthBuffer===!0,u=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&u===!1&&Ct("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),p=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=i.getParameter(i.MAX_TEXTURE_SIZE),x=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),m=i.getParameter(i.MAX_VERTEX_ATTRIBS),b=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),T=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),w=i.getParameter(i.MAX_SAMPLES),A=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:f,maxVertexTextures:p,maxTextureSize:y,maxCubemapSize:x,maxAttributes:m,maxVertexUniforms:b,maxVaryings:T,maxFragmentUniforms:v,maxSamples:w,samples:A}}function t0(i){let t=this,e=null,n=0,s=!1,r=!1,a=new Rn,o=new Nt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){let f=d.length!==0||u||n!==0||s;return s=u,n=d.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,u){e=h(d,u,0)},this.setState=function(d,u,f){let p=d.clippingPlanes,y=d.clipIntersection,x=d.clipShadows,m=i.get(d);if(!s||p===null||p.length===0||r&&!x)r?h(null):c();else{let b=r?0:n,T=b*4,v=m.clippingState||null;l.value=v,v=h(p,u,T,f);for(let w=0;w!==T;++w)v[w]=e[w];m.clippingState=v,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=b}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(d,u,f,p){let y=d!==null?d.length:0,x=null;if(y!==0){if(x=l.value,p!==!0||x===null){let m=f+y*4,b=u.matrixWorldInverse;o.getNormalMatrix(b),(x===null||x.length<m)&&(x=new Float32Array(m));for(let T=0,v=f;T!==y;++T,v+=4)a.copy(d[T]).applyMatrix4(b,o),a.normal.toArray(x,v),x[v+3]=a.constant}l.value=x,l.needsUpdate=!0}return t.numPlanes=y,t.numIntersection=0,x}}var bi=4,fu=[.125,.215,.35,.446,.526,.582],zi=20,e0=256,ar=new gi,pu=new Tt,sc=null,rc=0,ac=0,oc=!1,n0=new U,Mo=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){let{size:a=256,position:o=n0}=r;sc=this._renderer.getRenderTarget(),rc=this._renderer.getActiveCubeFace(),ac=this._renderer.getActiveMipmapLevel(),oc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,n,s,l,o),e>0&&this._blur(l,0,0,e),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=xu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=gu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(sc,rc,ac),this._renderer.xr.enabled=oc,t.scissorTest=!1,xs(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===xi||t.mapping===Bi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),sc=this._renderer.getRenderTarget(),rc=this._renderer.getActiveCubeFace(),ac=this._renderer.getActiveMipmapLevel(),oc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Ue,minFilter:Ue,generateMipmaps:!1,type:On,format:ln,colorSpace:Ls,depthBuffer:!1},s=mu(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=mu(t,e,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=i0(r)),this._blurMaterial=r0(r,t,e),this._ggxMaterial=s0(r,t,e)}return s}_compileMaterial(t){let e=new Ht(new he,t);this._renderer.compile(e,ar)}_sceneToCubeUV(t,e,n,s,r){let l=new De(90,1,e,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,f=d.toneMapping;d.getClearColor(pu),d.toneMapping=vn,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(s),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Ht(new Se,new rn({name:"PMREM.Background",side:Ge,depthWrite:!1,depthTest:!1})));let y=this._backgroundBox,x=y.material,m=!1,b=t.background;b?b.isColor&&(x.color.copy(b),t.background=null,m=!0):(x.color.copy(pu),m=!0);for(let T=0;T<6;T++){let v=T%3;v===0?(l.up.set(0,c[T],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[T],r.y,r.z)):v===1?(l.up.set(0,0,c[T]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[T],r.z)):(l.up.set(0,c[T],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[T]));let w=this._cubeSize;xs(s,v*w,T>2?w:0,w,w),d.setRenderTarget(s),m&&d.render(y,l),d.render(t,l)}d.toneMapping=f,d.autoClear=u,t.background=b}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===xi||t.mapping===Bi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=xu()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=gu());let r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;let o=r.uniforms;o.envMap.value=t;let l=this._cubeSize;xs(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,ar)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(t,r-1,r);e.autoClear=n}_applyGGXFilter(t,e,n){let s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;let l=a.uniforms,c=n/(this._lodMeshes.length-1),h=e/(this._lodMeshes.length-1),d=Math.sqrt(c*c-h*h),u=0+c*1.25,f=d*u,{_lodMax:p}=this,y=this._sizeLods[n],x=3*y*(n>p-bi?n-p+bi:0),m=4*(this._cubeSize-y);l.envMap.value=t.texture,l.roughness.value=f,l.mipInt.value=p-e,xs(r,x,m,3*y,2*y),s.setRenderTarget(r),s.render(o,ar),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=p-n,xs(t,x,m,3*y,2*y),s.setRenderTarget(t),s.render(o,ar)}_blur(t,e,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&It("blur direction must be either latitudinal or longitudinal!");let h=3,d=this._lodMeshes[s];d.material=c;let u=c.uniforms,f=this._sizeLods[n]-1,p=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*zi-1),y=r/p,x=isFinite(r)?1+Math.floor(h*y):zi;x>zi&&Ct(`sigmaRadians, ${r}, is too large and will clip, as it requested ${x} samples when the maximum is set to ${zi}`);let m=[],b=0;for(let E=0;E<zi;++E){let g=E/y,M=Math.exp(-g*g/2);m.push(M),E===0?b+=M:E<x&&(b+=2*M)}for(let E=0;E<m.length;E++)m[E]=m[E]/b;u.envMap.value=t.texture,u.samples.value=x,u.weights.value=m,u.latitudinal.value=a==="latitudinal",o&&(u.poleAxis.value=o);let{_lodMax:T}=this;u.dTheta.value=p,u.mipInt.value=T-n;let v=this._sizeLods[s],w=3*v*(s>T-bi?s-T+bi:0),A=4*(this._cubeSize-v);xs(e,w,A,3*v,2*v),l.setRenderTarget(e),l.render(d,ar)}};function i0(i){let t=[],e=[],n=[],s=i,r=i-bi+1+fu.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);t.push(o);let l=1/o;a>i-bi?l=fu[a-i+bi-1]:a===0&&(l=0),e.push(l);let c=1/(o-2),h=-c,d=1+c,u=[h,h,d,h,d,d,h,h,d,d,h,d],f=6,p=6,y=3,x=2,m=1,b=new Float32Array(y*p*f),T=new Float32Array(x*p*f),v=new Float32Array(m*p*f);for(let A=0;A<f;A++){let E=A%3*2/3-1,g=A>2?0:-1,M=[E,g,0,E+2/3,g,0,E+2/3,g+1,0,E,g,0,E+2/3,g+1,0,E,g+1,0];b.set(M,y*p*A),T.set(u,x*p*A);let R=[A,A,A,A,A,A];v.set(R,m*p*A)}let w=new he;w.setAttribute("position",new kt(b,y)),w.setAttribute("uv",new kt(T,x)),w.setAttribute("faceIndex",new kt(v,m)),n.push(new Ht(w,null)),s>bi&&s--}return{lodMeshes:n,sizeLods:t,sigmas:e}}function mu(i,t,e){let n=new He(i,t,e);return n.texture.mapping=Ks,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function xs(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function s0(i,t,e){return new ce({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:e0,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Eo(),fragmentShader:`

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
		`,blending:Un,depthTest:!1,depthWrite:!1})}function r0(i,t,e){let n=new Float32Array(zi),s=new U(0,1,0);return new ce({name:"SphericalGaussianBlur",defines:{n:zi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Eo(),fragmentShader:`

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
		`,blending:Un,depthTest:!1,depthWrite:!1})}function gu(){return new ce({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Eo(),fragmentShader:`

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
		`,blending:Un,depthTest:!1,depthWrite:!1})}function xu(){return new ce({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Eo(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Un,depthTest:!1,depthWrite:!1})}function Eo(){return`

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
	`}var bo=class extends He{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Hs(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Se(5,5,5),r=new ce({name:"CubemapFromEquirect",uniforms:ki(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ge,blending:Un});r.uniforms.tEquirect.value=e;let a=new Ht(s,r),o=e.minFilter;return e.minFilter===yi&&(e.minFilter=Ue),new wa(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}};function a0(i){let t=new WeakMap,e=new WeakMap,n=null;function s(u,f=!1){return u==null?null:f?a(u):r(u)}function r(u){if(u&&u.isTexture){let f=u.mapping;if(f===Ca||f===Ia)if(t.has(u)){let p=t.get(u).texture;return o(p,u.mapping)}else{let p=u.image;if(p&&p.height>0){let y=new bo(p.height);return y.fromEquirectangularTexture(i,u),t.set(u,y),u.addEventListener("dispose",c),o(y.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){let f=u.mapping,p=f===Ca||f===Ia,y=f===xi||f===Bi;if(p||y){let x=e.get(u),m=x!==void 0?x.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==m)return n===null&&(n=new Mo(i)),x=p?n.fromEquirectangular(u,x):n.fromCubemap(u,x),x.texture.pmremVersion=u.pmremVersion,e.set(u,x),x.texture;if(x!==void 0)return x.texture;{let b=u.image;return p&&b&&b.height>0||y&&b&&l(b)?(n===null&&(n=new Mo(i)),x=p?n.fromEquirectangular(u):n.fromCubemap(u),x.texture.pmremVersion=u.pmremVersion,e.set(u,x),u.addEventListener("dispose",h),x.texture):null}}}return u}function o(u,f){return f===Ca?u.mapping=xi:f===Ia&&(u.mapping=Bi),u}function l(u){let f=0,p=6;for(let y=0;y<p;y++)u[y]!==void 0&&f++;return f===p}function c(u){let f=u.target;f.removeEventListener("dispose",c);let p=t.get(f);p!==void 0&&(t.delete(f),p.dispose())}function h(u){let f=u.target;f.removeEventListener("dispose",h);let p=e.get(f);p!==void 0&&(e.delete(f),p.dispose())}function d(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:d}}function o0(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&Pi("WebGLRenderer: "+n+" extension not supported."),s}}}function l0(i,t,e,n){let s={},r=new WeakMap;function a(d){let u=d.target;u.index!==null&&t.remove(u.index);for(let p in u.attributes)t.remove(u.attributes[p]);u.removeEventListener("dispose",a),delete s[u.id];let f=r.get(u);f&&(t.remove(f),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function o(d,u){return s[u.id]===!0||(u.addEventListener("dispose",a),s[u.id]=!0,e.memory.geometries++),u}function l(d){let u=d.attributes;for(let f in u)t.update(u[f],i.ARRAY_BUFFER)}function c(d){let u=[],f=d.index,p=d.attributes.position,y=0;if(p===void 0)return;if(f!==null){let b=f.array;y=f.version;for(let T=0,v=b.length;T<v;T+=3){let w=b[T+0],A=b[T+1],E=b[T+2];u.push(w,A,A,E,E,w)}}else{let b=p.array;y=p.version;for(let T=0,v=b.length/3-1;T<v;T+=3){let w=T+0,A=T+1,E=T+2;u.push(w,A,A,E,E,w)}}let x=new(p.count>=65535?Bs:Os)(u,1);x.version=y;let m=r.get(d);m&&t.remove(m),r.set(d,x)}function h(d){let u=r.get(d);if(u){let f=d.index;f!==null&&u.version<f.version&&c(d)}else c(d);return r.get(d)}return{get:o,update:l,getWireframeAttribute:h}}function c0(i,t,e){let n;function s(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function l(d,u){i.drawElements(n,u,r,d*a),e.update(u,n,1)}function c(d,u,f){f!==0&&(i.drawElementsInstanced(n,u,r,d*a,f),e.update(u,n,f))}function h(d,u,f){if(f===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,r,d,0,f);let y=0;for(let x=0;x<f;x++)y+=u[x];e.update(y,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function h0(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:It("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function u0(i,t,e){let n=new WeakMap,s=new le;function r(a,o,l){let c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0,u=n.get(o);if(u===void 0||u.count!==d){let M=function(){E.dispose(),n.delete(o),o.removeEventListener("dispose",M)};u!==void 0&&u.texture.dispose();let f=o.morphAttributes.position!==void 0,p=o.morphAttributes.normal!==void 0,y=o.morphAttributes.color!==void 0,x=o.morphAttributes.position||[],m=o.morphAttributes.normal||[],b=o.morphAttributes.color||[],T=0;f===!0&&(T=1),p===!0&&(T=2),y===!0&&(T=3);let v=o.attributes.position.count*T,w=1;v>t.maxTextureSize&&(w=Math.ceil(v/t.maxTextureSize),v=t.maxTextureSize);let A=new Float32Array(v*w*4*d),E=new Us(A,v,w,d);E.type=on,E.needsUpdate=!0;let g=T*4;for(let R=0;R<d;R++){let I=x[R],P=m[R],N=b[R],k=v*w*4*R;for(let F=0;F<I.count;F++){let H=F*g;f===!0&&(s.fromBufferAttribute(I,F),A[k+H+0]=s.x,A[k+H+1]=s.y,A[k+H+2]=s.z,A[k+H+3]=0),p===!0&&(s.fromBufferAttribute(P,F),A[k+H+4]=s.x,A[k+H+5]=s.y,A[k+H+6]=s.z,A[k+H+7]=0),y===!0&&(s.fromBufferAttribute(N,F),A[k+H+8]=s.x,A[k+H+9]=s.y,A[k+H+10]=s.z,A[k+H+11]=N.itemSize===4?s.w:1)}}u={count:d,texture:E,size:new Lt(v,w)},n.set(o,u),o.addEventListener("dispose",M)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let f=0;for(let y=0;y<c.length;y++)f+=c[y];let p=o.morphTargetsRelative?1:1-f;l.getUniforms().setValue(i,"morphTargetBaseInfluence",p),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",u.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function d0(i,t,e,n,s){let r=new WeakMap;function a(c){let h=s.render.frame,d=c.geometry,u=t.get(c,d);if(r.get(u)!==h&&(t.update(u),r.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let f=c.skeleton;r.get(f)!==h&&(f.update(),r.set(f,h))}return u}function o(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:a,dispose:o}}var f0={[Dl]:"LINEAR_TONE_MAPPING",[Ul]:"REINHARD_TONE_MAPPING",[Fl]:"CINEON_TONE_MAPPING",[Js]:"ACES_FILMIC_TONE_MAPPING",[Bl]:"AGX_TONE_MAPPING",[kl]:"NEUTRAL_TONE_MAPPING",[Ol]:"CUSTOM_TONE_MAPPING"};function p0(i,t,e,n,s,r){let a=new He(t,e,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,depthTexture:s?new jn(t,e):void 0}),o=new He(t,e,{type:On,depthBuffer:!1,stencilBuffer:!1}),l=new he;l.setAttribute("position",new ee([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new ee([0,2,0,0,2,0],2));let c=new da({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),h=new Ht(l,c),d=new gi(-1,1,1,-1,0,1),u=null,f=null,p=!1,y,x=null,m=[],b=!1;this.setSize=function(T,v){a.setSize(T,v),o.setSize(T,v);for(let w=0;w<m.length;w++){let A=m[w];A.setSize&&A.setSize(T,v)}},this.setEffects=function(T){m=T,b=m.length>0&&m[0].isRenderPass===!0;let v=a.width,w=a.height;for(let A=0;A<m.length;A++){let E=m[A];E.setSize&&E.setSize(v,w)}},this.begin=function(T,v){if(p||T.toneMapping===vn&&m.length===0)return!1;if(x=v,v!==null){let w=v.width,A=v.height;(a.width!==w||a.height!==A)&&this.setSize(w,A)}return b===!1&&T.setRenderTarget(a),y=T.toneMapping,T.toneMapping=vn,!0},this.hasRenderPass=function(){return b},this.end=function(T,v){T.toneMapping=y,p=!0;let w=a,A=o;for(let E=0;E<m.length;E++){let g=m[E];if(g.enabled!==!1&&(g.render(T,A,w,v),g.needsSwap!==!1)){let M=w;w=A,A=M}}if(u!==T.outputColorSpace||f!==T.toneMapping){u=T.outputColorSpace,f=T.toneMapping,c.defines={},Vt.getTransfer(u)===Kt&&(c.defines.SRGB_TRANSFER="");let E=f0[f];E&&(c.defines[E]=""),c.needsUpdate=!0}c.uniforms.tDiffuse.value=w.texture,T.setRenderTarget(x),T.render(h,d),x=null,p=!1},this.isCompositing=function(){return p},this.dispose=function(){a.depthTexture&&a.depthTexture.dispose(),a.dispose(),o.dispose(),l.dispose(),c.dispose()}}var Ou=new Ve,hc=new jn(1,1),Bu=new Us,ku=new la,zu=new Hs,yu=[],_u=[],vu=new Float32Array(16),Mu=new Float32Array(9),bu=new Float32Array(4);function _s(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=yu[s];if(r===void 0&&(r=new Float32Array(s),yu[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function Ee(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Te(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function To(i,t){let e=_u[t];e===void 0&&(e=new Int32Array(t),_u[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function m0(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function g0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2fv(this.addr,t),Te(e,t)}}function x0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ee(e,t))return;i.uniform3fv(this.addr,t),Te(e,t)}}function y0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4fv(this.addr,t),Te(e,t)}}function _0(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;bu.set(n),i.uniformMatrix2fv(this.addr,!1,bu),Te(e,n)}}function v0(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;Mu.set(n),i.uniformMatrix3fv(this.addr,!1,Mu),Te(e,n)}}function M0(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;vu.set(n),i.uniformMatrix4fv(this.addr,!1,vu),Te(e,n)}}function b0(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function S0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2iv(this.addr,t),Te(e,t)}}function E0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;i.uniform3iv(this.addr,t),Te(e,t)}}function T0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4iv(this.addr,t),Te(e,t)}}function w0(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function A0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2uiv(this.addr,t),Te(e,t)}}function R0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;i.uniform3uiv(this.addr,t),Te(e,t)}}function C0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4uiv(this.addr,t),Te(e,t)}}function I0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(hc.compareFunction=e.isReversedDepthBuffer()?yo:xo,r=hc):r=Ou,e.setTexture2D(t||r,s)}function P0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||ku,s)}function L0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||zu,s)}function N0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Bu,s)}function D0(i){switch(i){case 5126:return m0;case 35664:return g0;case 35665:return x0;case 35666:return y0;case 35674:return _0;case 35675:return v0;case 35676:return M0;case 5124:case 35670:return b0;case 35667:case 35671:return S0;case 35668:case 35672:return E0;case 35669:case 35673:return T0;case 5125:return w0;case 36294:return A0;case 36295:return R0;case 36296:return C0;case 35678:case 36198:case 36298:case 36306:case 35682:return I0;case 35679:case 36299:case 36307:return P0;case 35680:case 36300:case 36308:case 36293:return L0;case 36289:case 36303:case 36311:case 36292:return N0}}function U0(i,t){i.uniform1fv(this.addr,t)}function F0(i,t){let e=_s(t,this.size,2);i.uniform2fv(this.addr,e)}function O0(i,t){let e=_s(t,this.size,3);i.uniform3fv(this.addr,e)}function B0(i,t){let e=_s(t,this.size,4);i.uniform4fv(this.addr,e)}function k0(i,t){let e=_s(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function z0(i,t){let e=_s(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function V0(i,t){let e=_s(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function H0(i,t){i.uniform1iv(this.addr,t)}function G0(i,t){i.uniform2iv(this.addr,t)}function W0(i,t){i.uniform3iv(this.addr,t)}function X0(i,t){i.uniform4iv(this.addr,t)}function q0(i,t){i.uniform1uiv(this.addr,t)}function Y0(i,t){i.uniform2uiv(this.addr,t)}function $0(i,t){i.uniform3uiv(this.addr,t)}function Z0(i,t){i.uniform4uiv(this.addr,t)}function J0(i,t,e){let n=this.cache,s=t.length,r=To(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=hc:a=Ou;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function K0(i,t,e){let n=this.cache,s=t.length,r=To(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||ku,r[a])}function j0(i,t,e){let n=this.cache,s=t.length,r=To(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||zu,r[a])}function Q0(i,t,e){let n=this.cache,s=t.length,r=To(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||Bu,r[a])}function tg(i){switch(i){case 5126:return U0;case 35664:return F0;case 35665:return O0;case 35666:return B0;case 35674:return k0;case 35675:return z0;case 35676:return V0;case 5124:case 35670:return H0;case 35667:case 35671:return G0;case 35668:case 35672:return W0;case 35669:case 35673:return X0;case 5125:return q0;case 36294:return Y0;case 36295:return $0;case 36296:return Z0;case 35678:case 36198:case 36298:case 36306:case 35682:return J0;case 35679:case 36299:case 36307:return K0;case 35680:case 36300:case 36308:case 36293:return j0;case 36289:case 36303:case 36311:case 36292:return Q0}}var uc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=D0(e.type)}},dc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=tg(e.type)}},fc=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],n)}}},lc=/(\w+)(\])?(\[|\.)?/g;function Su(i,t){i.seq.push(t),i.map[t.id]=t}function eg(i,t,e){let n=i.name,s=n.length;for(lc.lastIndex=0;;){let r=lc.exec(n),a=lc.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){Su(e,c===void 0?new uc(o,i,t):new dc(o,i,t));break}else{let d=e.map[o];d===void 0&&(d=new fc(o),Su(e,d)),e=d}}}var ys=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){let o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);eg(o,l,this)}let s=[],r=[];for(let a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&n.push(a)}return n}};function Eu(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var ng=37297,ig=0;function sg(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}var Tu=new Nt;function rg(i){Vt._getMatrix(Tu,Vt.workingColorSpace,i);let t=`mat3( ${Tu.elements.map(e=>e.toFixed(4))} )`;switch(Vt.getTransfer(i)){case Ns:return[t,"LinearTransferOETF"];case Kt:return[t,"sRGBTransferOETF"];default:return Ct("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function wu(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";let a=/ERROR: 0:(\d+)/.exec(r);if(a){let o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+sg(i.getShaderSource(t),o)}else return r}function ag(i,t){let e=rg(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}var og={[Dl]:"Linear",[Ul]:"Reinhard",[Fl]:"Cineon",[Js]:"ACESFilmic",[Bl]:"AgX",[kl]:"Neutral",[Ol]:"Custom"};function lg(i,t){let e=og[t];return e===void 0?(Ct("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var vo=new U;function cg(){Vt.getLuminanceCoefficients(vo);let i=vo.x.toFixed(4),t=vo.y.toFixed(4),e=vo.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function hg(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(lr).join(`
`)}function ug(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function dg(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function lr(i){return i!==""}function Au(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Ru(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var fg=/^[ \t]*#include +<([\w\d./]+)>/gm;function pc(i){return i.replace(fg,mg)}var pg=new Map;function mg(i,t){let e=Ot[t];if(e===void 0){let n=pg.get(t);if(n!==void 0)e=Ot[n],Ct('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return pc(e)}var gg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Cu(i){return i.replace(gg,xg)}function xg(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Iu(i){let t=`precision ${i.precision} float;
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
#define LOW_PRECISION`),t}var yg={[Zs]:"SHADOWMAP_TYPE_PCF",[ps]:"SHADOWMAP_TYPE_VSM"};function _g(i){return yg[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var vg={[xi]:"ENVMAP_TYPE_CUBE",[Bi]:"ENVMAP_TYPE_CUBE",[Ks]:"ENVMAP_TYPE_CUBE_UV"};function Mg(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":vg[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var bg={[Bi]:"ENVMAP_MODE_REFRACTION"};function Sg(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":bg[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var Eg={[Nl]:"ENVMAP_BLENDING_MULTIPLY",[Zh]:"ENVMAP_BLENDING_MIX",[Jh]:"ENVMAP_BLENDING_ADD"};function Tg(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Eg[i.combine]||"ENVMAP_BLENDING_NONE"}function wg(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Ag(i,t,e,n){let s=i.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=_g(e),c=Mg(e),h=Sg(e),d=Tg(e),u=wg(e),f=hg(e),p=ug(r),y=s.createProgram(),x,m,b=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(x=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p].filter(lr).join(`
`),x.length>0&&(x+=`
`),m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p].filter(lr).join(`
`),m.length>0&&(m+=`
`)):(x=[Iu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(lr).join(`
`),m=[Iu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==vn?"#define TONE_MAPPING":"",e.toneMapping!==vn?Ot.tonemapping_pars_fragment:"",e.toneMapping!==vn?lg("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Ot.colorspace_pars_fragment,ag("linearToOutputTexel",e.outputColorSpace),cg(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(lr).join(`
`)),a=pc(a),a=Au(a,e),a=Ru(a,e),o=pc(o),o=Au(o,e),o=Ru(o,e),a=Cu(a),o=Cu(o),e.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,x=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+x,m=["#define varying in",e.glslVersion===Yl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Yl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let T=b+x+a,v=b+m+o,w=Eu(s,s.VERTEX_SHADER,T),A=Eu(s,s.FRAGMENT_SHADER,v);s.attachShader(y,w),s.attachShader(y,A),e.index0AttributeName!==void 0?s.bindAttribLocation(y,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(y,0,"position"),s.linkProgram(y);function E(I){if(i.debug.checkShaderErrors){let P=s.getProgramInfoLog(y)||"",N=s.getShaderInfoLog(w)||"",k=s.getShaderInfoLog(A)||"",F=P.trim(),H=N.trim(),W=k.trim(),Z=!0,Q=!0;if(s.getProgramParameter(y,s.LINK_STATUS)===!1)if(Z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,y,w,A);else{let rt=wu(s,w,"vertex"),dt=wu(s,A,"fragment");It("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(y,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+F+`
`+rt+`
`+dt)}else F!==""?Ct("WebGLProgram: Program Info Log:",F):(H===""||W==="")&&(Q=!1);Q&&(I.diagnostics={runnable:Z,programLog:F,vertexShader:{log:H,prefix:x},fragmentShader:{log:W,prefix:m}})}s.deleteShader(w),s.deleteShader(A),g=new ys(s,y),M=dg(s,y)}let g;this.getUniforms=function(){return g===void 0&&E(this),g};let M;this.getAttributes=function(){return M===void 0&&E(this),M};let R=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return R===!1&&(R=s.getProgramParameter(y,ng)),R},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(y),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=ig++,this.cacheKey=t,this.usedTimes=1,this.program=y,this.vertexShader=w,this.fragmentShader=A,this}var Rg=0,mc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){let s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new gc(t),e.set(t,n)),n}},gc=class{constructor(t){this.id=Rg++,this.code=t,this.usedTimes=0}};function Cg(i){return i===vi||i===ir||i===sr}function Ig(i,t,e,n,s,r){let a=new Fs,o=new mc,l=new Set,c=[],h=new Map,d=n.logarithmicDepthBuffer,u=n.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(g){return l.add(g),g===0?"uv":`uv${g}`}function y(g,M,R,I,P,N){let k=I.fog,F=P.geometry,H=g.isMeshStandardMaterial||g.isMeshLambertMaterial||g.isMeshPhongMaterial?I.environment:null,W=g.isMeshStandardMaterial||g.isMeshLambertMaterial&&!g.envMap||g.isMeshPhongMaterial&&!g.envMap,Z=t.get(g.envMap||H,W),Q=Z&&Z.mapping===Ks?Z.image.height:null,rt=f[g.type];g.precision!==null&&(u=n.getMaxPrecision(g.precision),u!==g.precision&&Ct("WebGLProgram.getParameters:",g.precision,"not supported, using",u,"instead."));let dt=F.morphAttributes.position||F.morphAttributes.normal||F.morphAttributes.color,xt=dt!==void 0?dt.length:0,$t=0;F.morphAttributes.position!==void 0&&($t=1),F.morphAttributes.normal!==void 0&&($t=2),F.morphAttributes.color!==void 0&&($t=3);let ue,Zt,K,it;if(rt){let yt=kn[rt];ue=yt.vertexShader,Zt=yt.fragmentShader}else{ue=g.vertexShader,Zt=g.fragmentShader;let yt=o.getVertexShaderStage(g),fe=o.getFragmentShaderStage(g);o.update(g,yt,fe),K=yt.id,it=fe.id}let tt=i.getRenderTarget(),Pt=i.state.buffers.depth.getReversed(),Dt=P.isInstancedMesh===!0,At=P.isBatchedMesh===!0,me=!!g.map,zt=!!g.matcap,ne=!!Z,Jt=!!g.aoMap,Xt=!!g.lightMap,_e=!!g.bumpMap&&g.wireframe===!1,be=!!g.normalMap,we=!!g.displacementMap,Le=!!g.emissiveMap,de=!!g.metalnessMap,ve=!!g.roughnessMap,D=g.anisotropy>0,We=g.clearcoat>0,jt=g.dispersion>0,C=g.iridescence>0,_=g.sheen>0,B=g.transmission>0,G=D&&!!g.anisotropyMap,q=We&&!!g.clearcoatMap,et=We&&!!g.clearcoatNormalMap,st=We&&!!g.clearcoatRoughnessMap,Y=C&&!!g.iridescenceMap,J=C&&!!g.iridescenceThicknessMap,at=_&&!!g.sheenColorMap,bt=_&&!!g.sheenRoughnessMap,ct=!!g.specularMap,ot=!!g.specularColorMap,wt=!!g.specularIntensityMap,Rt=B&&!!g.transmissionMap,Ut=B&&!!g.thicknessMap,L=!!g.gradientMap,nt=!!g.alphaMap,$=g.alphaTest>0,lt=!!g.alphaHash,pt=!!g.extensions,j=vn;g.toneMapped&&(tt===null||tt.isXRRenderTarget===!0)&&(j=i.toneMapping);let vt={shaderID:rt,shaderType:g.type,shaderName:g.name,vertexShader:ue,fragmentShader:Zt,defines:g.defines,customVertexShaderID:K,customFragmentShaderID:it,isRawShaderMaterial:g.isRawShaderMaterial===!0,glslVersion:g.glslVersion,precision:u,batching:At,batchingColor:At&&P._colorsTexture!==null,instancing:Dt,instancingColor:Dt&&P.instanceColor!==null,instancingMorph:Dt&&P.morphTexture!==null,outputColorSpace:tt===null?i.outputColorSpace:tt.isXRRenderTarget===!0?tt.texture.colorSpace:Vt.workingColorSpace,alphaToCoverage:!!g.alphaToCoverage,map:me,matcap:zt,envMap:ne,envMapMode:ne&&Z.mapping,envMapCubeUVHeight:Q,aoMap:Jt,lightMap:Xt,bumpMap:_e,normalMap:be,displacementMap:we,emissiveMap:Le,normalMapObjectSpace:be&&g.normalMapType===Qh,normalMapTangentSpace:be&&g.normalMapType===go,packedNormalMap:be&&g.normalMapType===go&&Cg(g.normalMap.format),metalnessMap:de,roughnessMap:ve,anisotropy:D,anisotropyMap:G,clearcoat:We,clearcoatMap:q,clearcoatNormalMap:et,clearcoatRoughnessMap:st,dispersion:jt,iridescence:C,iridescenceMap:Y,iridescenceThicknessMap:J,sheen:_,sheenColorMap:at,sheenRoughnessMap:bt,specularMap:ct,specularColorMap:ot,specularIntensityMap:wt,transmission:B,transmissionMap:Rt,thicknessMap:Ut,gradientMap:L,opaque:g.transparent===!1&&g.blending===Li&&g.alphaToCoverage===!1,alphaMap:nt,alphaTest:$,alphaHash:lt,combine:g.combine,mapUv:me&&p(g.map.channel),aoMapUv:Jt&&p(g.aoMap.channel),lightMapUv:Xt&&p(g.lightMap.channel),bumpMapUv:_e&&p(g.bumpMap.channel),normalMapUv:be&&p(g.normalMap.channel),displacementMapUv:we&&p(g.displacementMap.channel),emissiveMapUv:Le&&p(g.emissiveMap.channel),metalnessMapUv:de&&p(g.metalnessMap.channel),roughnessMapUv:ve&&p(g.roughnessMap.channel),anisotropyMapUv:G&&p(g.anisotropyMap.channel),clearcoatMapUv:q&&p(g.clearcoatMap.channel),clearcoatNormalMapUv:et&&p(g.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:st&&p(g.clearcoatRoughnessMap.channel),iridescenceMapUv:Y&&p(g.iridescenceMap.channel),iridescenceThicknessMapUv:J&&p(g.iridescenceThicknessMap.channel),sheenColorMapUv:at&&p(g.sheenColorMap.channel),sheenRoughnessMapUv:bt&&p(g.sheenRoughnessMap.channel),specularMapUv:ct&&p(g.specularMap.channel),specularColorMapUv:ot&&p(g.specularColorMap.channel),specularIntensityMapUv:wt&&p(g.specularIntensityMap.channel),transmissionMapUv:Rt&&p(g.transmissionMap.channel),thicknessMapUv:Ut&&p(g.thicknessMap.channel),alphaMapUv:nt&&p(g.alphaMap.channel),vertexTangents:!!F.attributes.tangent&&(be||D),vertexNormals:!!F.attributes.normal,vertexColors:g.vertexColors,vertexAlphas:g.vertexColors===!0&&!!F.attributes.color&&F.attributes.color.itemSize===4,pointsUvs:P.isPoints===!0&&!!F.attributes.uv&&(me||nt),fog:!!k,useFog:g.fog===!0,fogExp2:!!k&&k.isFogExp2,flatShading:g.wireframe===!1&&(g.flatShading===!0||F.attributes.normal===void 0&&be===!1&&(g.isMeshLambertMaterial||g.isMeshPhongMaterial||g.isMeshStandardMaterial||g.isMeshPhysicalMaterial)),sizeAttenuation:g.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:Pt,skinning:P.isSkinnedMesh===!0,hasPositionAttribute:F.attributes.position!==void 0,morphTargets:F.morphAttributes.position!==void 0,morphNormals:F.morphAttributes.normal!==void 0,morphColors:F.morphAttributes.color!==void 0,morphTargetsCount:xt,morphTextureStride:$t,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numLightProbeGrids:N.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:g.dithering,shadowMapEnabled:i.shadowMap.enabled&&R.length>0,shadowMapType:i.shadowMap.type,toneMapping:j,decodeVideoTexture:me&&g.map.isVideoTexture===!0&&Vt.getTransfer(g.map.colorSpace)===Kt,decodeVideoTextureEmissive:Le&&g.emissiveMap.isVideoTexture===!0&&Vt.getTransfer(g.emissiveMap.colorSpace)===Kt,premultipliedAlpha:g.premultipliedAlpha,doubleSided:g.side===an,flipSided:g.side===Ge,useDepthPacking:g.depthPacking>=0,depthPacking:g.depthPacking||0,index0AttributeName:g.index0AttributeName,extensionClipCullDistance:pt&&g.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(pt&&g.extensions.multiDraw===!0||At)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:g.customProgramCacheKey()};return vt.vertexUv1s=l.has(1),vt.vertexUv2s=l.has(2),vt.vertexUv3s=l.has(3),l.clear(),vt}function x(g){let M=[];if(g.shaderID?M.push(g.shaderID):(M.push(g.customVertexShaderID),M.push(g.customFragmentShaderID)),g.defines!==void 0)for(let R in g.defines)M.push(R),M.push(g.defines[R]);return g.isRawShaderMaterial===!1&&(m(M,g),b(M,g),M.push(i.outputColorSpace)),M.push(g.customProgramCacheKey),M.join()}function m(g,M){g.push(M.precision),g.push(M.outputColorSpace),g.push(M.envMapMode),g.push(M.envMapCubeUVHeight),g.push(M.mapUv),g.push(M.alphaMapUv),g.push(M.lightMapUv),g.push(M.aoMapUv),g.push(M.bumpMapUv),g.push(M.normalMapUv),g.push(M.displacementMapUv),g.push(M.emissiveMapUv),g.push(M.metalnessMapUv),g.push(M.roughnessMapUv),g.push(M.anisotropyMapUv),g.push(M.clearcoatMapUv),g.push(M.clearcoatNormalMapUv),g.push(M.clearcoatRoughnessMapUv),g.push(M.iridescenceMapUv),g.push(M.iridescenceThicknessMapUv),g.push(M.sheenColorMapUv),g.push(M.sheenRoughnessMapUv),g.push(M.specularMapUv),g.push(M.specularColorMapUv),g.push(M.specularIntensityMapUv),g.push(M.transmissionMapUv),g.push(M.thicknessMapUv),g.push(M.combine),g.push(M.fogExp2),g.push(M.sizeAttenuation),g.push(M.morphTargetsCount),g.push(M.morphAttributeCount),g.push(M.numDirLights),g.push(M.numPointLights),g.push(M.numSpotLights),g.push(M.numSpotLightMaps),g.push(M.numHemiLights),g.push(M.numRectAreaLights),g.push(M.numDirLightShadows),g.push(M.numPointLightShadows),g.push(M.numSpotLightShadows),g.push(M.numSpotLightShadowsWithMaps),g.push(M.numLightProbes),g.push(M.shadowMapType),g.push(M.toneMapping),g.push(M.numClippingPlanes),g.push(M.numClipIntersection),g.push(M.depthPacking)}function b(g,M){a.disableAll(),M.instancing&&a.enable(0),M.instancingColor&&a.enable(1),M.instancingMorph&&a.enable(2),M.matcap&&a.enable(3),M.envMap&&a.enable(4),M.normalMapObjectSpace&&a.enable(5),M.normalMapTangentSpace&&a.enable(6),M.clearcoat&&a.enable(7),M.iridescence&&a.enable(8),M.alphaTest&&a.enable(9),M.vertexColors&&a.enable(10),M.vertexAlphas&&a.enable(11),M.vertexUv1s&&a.enable(12),M.vertexUv2s&&a.enable(13),M.vertexUv3s&&a.enable(14),M.vertexTangents&&a.enable(15),M.anisotropy&&a.enable(16),M.alphaHash&&a.enable(17),M.batching&&a.enable(18),M.dispersion&&a.enable(19),M.batchingColor&&a.enable(20),M.gradientMap&&a.enable(21),M.packedNormalMap&&a.enable(22),M.vertexNormals&&a.enable(23),g.push(a.mask),a.disableAll(),M.fog&&a.enable(0),M.useFog&&a.enable(1),M.flatShading&&a.enable(2),M.logarithmicDepthBuffer&&a.enable(3),M.reversedDepthBuffer&&a.enable(4),M.skinning&&a.enable(5),M.morphTargets&&a.enable(6),M.morphNormals&&a.enable(7),M.morphColors&&a.enable(8),M.premultipliedAlpha&&a.enable(9),M.shadowMapEnabled&&a.enable(10),M.doubleSided&&a.enable(11),M.flipSided&&a.enable(12),M.useDepthPacking&&a.enable(13),M.dithering&&a.enable(14),M.transmission&&a.enable(15),M.sheen&&a.enable(16),M.opaque&&a.enable(17),M.pointsUvs&&a.enable(18),M.decodeVideoTexture&&a.enable(19),M.decodeVideoTextureEmissive&&a.enable(20),M.alphaToCoverage&&a.enable(21),M.numLightProbeGrids>0&&a.enable(22),M.hasPositionAttribute&&a.enable(23),g.push(a.mask)}function T(g){let M=f[g.type],R;if(M){let I=kn[M];R=uu.clone(I.uniforms)}else R=g.uniforms;return R}function v(g,M){let R=h.get(M);return R!==void 0?++R.usedTimes:(R=new Ag(i,M,g,s),c.push(R),h.set(M,R)),R}function w(g){if(--g.usedTimes===0){let M=c.indexOf(g);c[M]=c[c.length-1],c.pop(),h.delete(g.cacheKey),g.destroy()}}function A(g){o.remove(g)}function E(){o.dispose()}return{getParameters:y,getProgramCacheKey:x,getUniforms:T,acquireProgram:v,releaseProgram:w,releaseShaderCache:A,programs:c,dispose:E}}function Pg(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function Lg(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function Pu(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Lu(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(u){let f=0;return u.isInstancedMesh&&(f+=2),u.isSkinnedMesh&&(f+=1),f}function o(u,f,p,y,x,m){let b=i[t];return b===void 0?(b={id:u.id,object:u,geometry:f,material:p,materialVariant:a(u),groupOrder:y,renderOrder:u.renderOrder,z:x,group:m},i[t]=b):(b.id=u.id,b.object=u,b.geometry=f,b.material=p,b.materialVariant=a(u),b.groupOrder=y,b.renderOrder=u.renderOrder,b.z=x,b.group=m),t++,b}function l(u,f,p,y,x,m){let b=o(u,f,p,y,x,m);p.transmission>0?n.push(b):p.transparent===!0?s.push(b):e.push(b)}function c(u,f,p,y,x,m){let b=o(u,f,p,y,x,m);p.transmission>0?n.unshift(b):p.transparent===!0?s.unshift(b):e.unshift(b)}function h(u,f,p){e.length>1&&e.sort(u||Lg),n.length>1&&n.sort(f||Pu),s.length>1&&s.sort(f||Pu),p&&(e.reverse(),n.reverse(),s.reverse())}function d(){for(let u=t,f=i.length;u<f;u++){let p=i[u];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:d,sort:h}}function Ng(){let i=new WeakMap;function t(n,s){let r=i.get(n),a;return r===void 0?(a=new Lu,i.set(n,[a])):s>=r.length?(a=new Lu,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function Dg(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new U,color:new Tt};break;case"SpotLight":e={position:new U,direction:new U,color:new Tt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new U,color:new Tt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new U,skyColor:new Tt,groundColor:new Tt};break;case"RectAreaLight":e={color:new Tt,position:new U,halfWidth:new U,halfHeight:new U};break}return i[t.id]=e,e}}}function Ug(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Lt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Lt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Lt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var Fg=0;function Og(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Bg(i){let t=new Dg,e=Ug(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new U);let s=new U,r=new Qt,a=new Qt;function o(c){let h=0,d=0,u=0;for(let M=0;M<9;M++)n.probe[M].set(0,0,0);let f=0,p=0,y=0,x=0,m=0,b=0,T=0,v=0,w=0,A=0,E=0;c.sort(Og);for(let M=0,R=c.length;M<R;M++){let I=c[M],P=I.color,N=I.intensity,k=I.distance,F=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===vi?F=I.shadow.map.texture:F=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)h+=P.r*N,d+=P.g*N,u+=P.b*N;else if(I.isLightProbe){for(let H=0;H<9;H++)n.probe[H].addScaledVector(I.sh.coefficients[H],N);E++}else if(I.isDirectionalLight){let H=t.get(I);if(H.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let W=I.shadow,Z=e.get(I);Z.shadowIntensity=W.intensity,Z.shadowBias=W.bias,Z.shadowNormalBias=W.normalBias,Z.shadowRadius=W.radius,Z.shadowMapSize=W.mapSize,n.directionalShadow[f]=Z,n.directionalShadowMap[f]=F,n.directionalShadowMatrix[f]=I.shadow.matrix,b++}n.directional[f]=H,f++}else if(I.isSpotLight){let H=t.get(I);H.position.setFromMatrixPosition(I.matrixWorld),H.color.copy(P).multiplyScalar(N),H.distance=k,H.coneCos=Math.cos(I.angle),H.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),H.decay=I.decay,n.spot[y]=H;let W=I.shadow;if(I.map&&(n.spotLightMap[w]=I.map,w++,W.updateMatrices(I),I.castShadow&&A++),n.spotLightMatrix[y]=W.matrix,I.castShadow){let Z=e.get(I);Z.shadowIntensity=W.intensity,Z.shadowBias=W.bias,Z.shadowNormalBias=W.normalBias,Z.shadowRadius=W.radius,Z.shadowMapSize=W.mapSize,n.spotShadow[y]=Z,n.spotShadowMap[y]=F,v++}y++}else if(I.isRectAreaLight){let H=t.get(I);H.color.copy(P).multiplyScalar(N),H.halfWidth.set(I.width*.5,0,0),H.halfHeight.set(0,I.height*.5,0),n.rectArea[x]=H,x++}else if(I.isPointLight){let H=t.get(I);if(H.color.copy(I.color).multiplyScalar(I.intensity),H.distance=I.distance,H.decay=I.decay,I.castShadow){let W=I.shadow,Z=e.get(I);Z.shadowIntensity=W.intensity,Z.shadowBias=W.bias,Z.shadowNormalBias=W.normalBias,Z.shadowRadius=W.radius,Z.shadowMapSize=W.mapSize,Z.shadowCameraNear=W.camera.near,Z.shadowCameraFar=W.camera.far,n.pointShadow[p]=Z,n.pointShadowMap[p]=F,n.pointShadowMatrix[p]=I.shadow.matrix,T++}n.point[p]=H,p++}else if(I.isHemisphereLight){let H=t.get(I);H.skyColor.copy(I.color).multiplyScalar(N),H.groundColor.copy(I.groundColor).multiplyScalar(N),n.hemi[m]=H,m++}}x>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ht.LTC_FLOAT_1,n.rectAreaLTC2=ht.LTC_FLOAT_2):(n.rectAreaLTC1=ht.LTC_HALF_1,n.rectAreaLTC2=ht.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;let g=n.hash;(g.directionalLength!==f||g.pointLength!==p||g.spotLength!==y||g.rectAreaLength!==x||g.hemiLength!==m||g.numDirectionalShadows!==b||g.numPointShadows!==T||g.numSpotShadows!==v||g.numSpotMaps!==w||g.numLightProbes!==E)&&(n.directional.length=f,n.spot.length=y,n.rectArea.length=x,n.point.length=p,n.hemi.length=m,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.pointShadow.length=T,n.pointShadowMap.length=T,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=b,n.pointShadowMatrix.length=T,n.spotLightMatrix.length=v+w-A,n.spotLightMap.length=w,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=E,g.directionalLength=f,g.pointLength=p,g.spotLength=y,g.rectAreaLength=x,g.hemiLength=m,g.numDirectionalShadows=b,g.numPointShadows=T,g.numSpotShadows=v,g.numSpotMaps=w,g.numLightProbes=E,n.version=Fg++)}function l(c,h){let d=0,u=0,f=0,p=0,y=0,x=h.matrixWorldInverse;for(let m=0,b=c.length;m<b;m++){let T=c[m];if(T.isDirectionalLight){let v=n.directional[d];v.direction.setFromMatrixPosition(T.matrixWorld),s.setFromMatrixPosition(T.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(x),d++}else if(T.isSpotLight){let v=n.spot[f];v.position.setFromMatrixPosition(T.matrixWorld),v.position.applyMatrix4(x),v.direction.setFromMatrixPosition(T.matrixWorld),s.setFromMatrixPosition(T.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(x),f++}else if(T.isRectAreaLight){let v=n.rectArea[p];v.position.setFromMatrixPosition(T.matrixWorld),v.position.applyMatrix4(x),a.identity(),r.copy(T.matrixWorld),r.premultiply(x),a.extractRotation(r),v.halfWidth.set(T.width*.5,0,0),v.halfHeight.set(0,T.height*.5,0),v.halfWidth.applyMatrix4(a),v.halfHeight.applyMatrix4(a),p++}else if(T.isPointLight){let v=n.point[u];v.position.setFromMatrixPosition(T.matrixWorld),v.position.applyMatrix4(x),u++}else if(T.isHemisphereLight){let v=n.hemi[y];v.direction.setFromMatrixPosition(T.matrixWorld),v.direction.transformDirection(x),y++}}}return{setup:o,setupView:l,state:n}}function Nu(i){let t=new Bg(i),e=[],n=[],s=[];function r(u){d.camera=u,e.length=0,n.length=0,s.length=0}function a(u){e.push(u)}function o(u){n.push(u)}function l(u){s.push(u)}function c(){t.setup(e)}function h(u){t.setupView(e,u)}let d={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:d,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function kg(i){let t=new WeakMap;function e(s,r=0){let a=t.get(s),o;return a===void 0?(o=new Nu(i),t.set(s,[o])):r>=a.length?(o=new Nu(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}var zg=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Vg=`uniform sampler2D shadow_pass;
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
}`,Hg=[new U(1,0,0),new U(-1,0,0),new U(0,1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1)],Gg=[new U(0,-1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1),new U(0,-1,0),new U(0,-1,0)],Du=new Qt,or=new U,cc=new U;function Wg(i,t,e){let n=new us,s=new Lt,r=new Lt,a=new le,o=new fa,l=new pa,c={},h=e.maxTextureSize,d={[Zn]:Ge,[Ge]:Zn,[an]:an},u=new ce({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Lt},radius:{value:4}},vertexShader:zg,fragmentShader:Vg}),f=u.clone();f.defines.HORIZONTAL_PASS=1;let p=new he;p.setAttribute("position",new kt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new Ht(p,u),x=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Zs;let m=this.type;this.render=function(A,E,g){if(x.enabled===!1||x.autoUpdate===!1&&x.needsUpdate===!1||A.length===0)return;this.type===Ih&&(Ct("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=Zs);let M=i.getRenderTarget(),R=i.getActiveCubeFace(),I=i.getActiveMipmapLevel(),P=i.state;P.setBlending(Un),P.buffers.depth.getReversed()===!0?P.buffers.color.setClear(0,0,0,0):P.buffers.color.setClear(1,1,1,1),P.buffers.depth.setTest(!0),P.setScissorTest(!1);let N=m!==this.type;N&&E.traverse(function(k){k.material&&(Array.isArray(k.material)?k.material.forEach(F=>F.needsUpdate=!0):k.material.needsUpdate=!0)});for(let k=0,F=A.length;k<F;k++){let H=A[k],W=H.shadow;if(W===void 0){Ct("WebGLShadowMap:",H,"has no shadow.");continue}if(W.autoUpdate===!1&&W.needsUpdate===!1)continue;s.copy(W.mapSize);let Z=W.getFrameExtents();s.multiply(Z),r.copy(W.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/Z.x),s.x=r.x*Z.x,W.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/Z.y),s.y=r.y*Z.y,W.mapSize.y=r.y));let Q=i.state.buffers.depth.getReversed();if(W.camera._reversedDepth=Q,W.map===null||N===!0){if(W.map!==null&&(W.map.depthTexture!==null&&(W.map.depthTexture.dispose(),W.map.depthTexture=null),W.map.dispose()),this.type===ps){if(H.isPointLight){Ct("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}W.map=new He(s.x,s.y,{format:vi,type:On,minFilter:Ue,magFilter:Ue,generateMipmaps:!1}),W.map.texture.name=H.name+".shadowMap",W.map.depthTexture=new jn(s.x,s.y,on),W.map.depthTexture.name=H.name+".shadowMapDepth",W.map.depthTexture.format=In,W.map.depthTexture.compareFunction=null,W.map.depthTexture.minFilter=Ce,W.map.depthTexture.magFilter=Ce}else H.isPointLight?(W.map=new bo(s.x),W.map.depthTexture=new ha(s.x,Mn)):(W.map=new He(s.x,s.y),W.map.depthTexture=new jn(s.x,s.y,Mn)),W.map.depthTexture.name=H.name+".shadowMap",W.map.depthTexture.format=In,this.type===Zs?(W.map.depthTexture.compareFunction=Q?yo:xo,W.map.depthTexture.minFilter=Ue,W.map.depthTexture.magFilter=Ue):(W.map.depthTexture.compareFunction=null,W.map.depthTexture.minFilter=Ce,W.map.depthTexture.magFilter=Ce);W.camera.updateProjectionMatrix()}let rt=W.map.isWebGLCubeRenderTarget?6:1;for(let dt=0;dt<rt;dt++){if(W.map.isWebGLCubeRenderTarget)i.setRenderTarget(W.map,dt),i.clear();else{dt===0&&(i.setRenderTarget(W.map),i.clear());let xt=W.getViewport(dt);a.set(r.x*xt.x,r.y*xt.y,r.x*xt.z,r.y*xt.w),P.viewport(a)}if(H.isPointLight){let xt=W.camera,$t=W.matrix,ue=H.distance||xt.far;ue!==xt.far&&(xt.far=ue,xt.updateProjectionMatrix()),or.setFromMatrixPosition(H.matrixWorld),xt.position.copy(or),cc.copy(xt.position),cc.add(Hg[dt]),xt.up.copy(Gg[dt]),xt.lookAt(cc),xt.updateMatrixWorld(),$t.makeTranslation(-or.x,-or.y,-or.z),Du.multiplyMatrices(xt.projectionMatrix,xt.matrixWorldInverse),W._frustum.setFromProjectionMatrix(Du,xt.coordinateSystem,xt.reversedDepth)}else W.updateMatrices(H);n=W.getFrustum(),v(E,g,W.camera,H,this.type)}W.isPointLightShadow!==!0&&this.type===ps&&b(W,g),W.needsUpdate=!1}m=this.type,x.needsUpdate=!1,i.setRenderTarget(M,R,I)};function b(A,E){let g=t.update(y);u.defines.VSM_SAMPLES!==A.blurSamples&&(u.defines.VSM_SAMPLES=A.blurSamples,f.defines.VSM_SAMPLES=A.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new He(s.x,s.y,{format:vi,type:On})),u.uniforms.shadow_pass.value=A.map.depthTexture,u.uniforms.resolution.value=A.mapSize,u.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(E,null,g,u,y,null),f.uniforms.shadow_pass.value=A.mapPass.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(E,null,g,f,y,null)}function T(A,E,g,M){let R=null,I=g.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(I!==void 0)R=I;else if(R=g.isPointLight===!0?l:o,i.localClippingEnabled&&E.clipShadows===!0&&Array.isArray(E.clippingPlanes)&&E.clippingPlanes.length!==0||E.displacementMap&&E.displacementScale!==0||E.alphaMap&&E.alphaTest>0||E.map&&E.alphaTest>0||E.alphaToCoverage===!0){let P=R.uuid,N=E.uuid,k=c[P];k===void 0&&(k={},c[P]=k);let F=k[N];F===void 0&&(F=R.clone(),k[N]=F,E.addEventListener("dispose",w)),R=F}if(R.visible=E.visible,R.wireframe=E.wireframe,M===ps?R.side=E.shadowSide!==null?E.shadowSide:E.side:R.side=E.shadowSide!==null?E.shadowSide:d[E.side],R.alphaMap=E.alphaMap,R.alphaTest=E.alphaToCoverage===!0?.5:E.alphaTest,R.map=E.map,R.clipShadows=E.clipShadows,R.clippingPlanes=E.clippingPlanes,R.clipIntersection=E.clipIntersection,R.displacementMap=E.displacementMap,R.displacementScale=E.displacementScale,R.displacementBias=E.displacementBias,R.wireframeLinewidth=E.wireframeLinewidth,R.linewidth=E.linewidth,g.isPointLight===!0&&R.isMeshDistanceMaterial===!0){let P=i.properties.get(R);P.light=g}return R}function v(A,E,g,M,R){if(A.visible===!1)return;if(A.layers.test(E.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&R===ps)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(g.matrixWorldInverse,A.matrixWorld);let N=t.update(A),k=A.material;if(Array.isArray(k)){let F=N.groups;for(let H=0,W=F.length;H<W;H++){let Z=F[H],Q=k[Z.materialIndex];if(Q&&Q.visible){let rt=T(A,Q,M,R);A.onBeforeShadow(i,A,E,g,N,rt,Z),i.renderBufferDirect(g,null,N,rt,A,Z),A.onAfterShadow(i,A,E,g,N,rt,Z)}}}else if(k.visible){let F=T(A,k,M,R);A.onBeforeShadow(i,A,E,g,N,F,null),i.renderBufferDirect(g,null,N,F,A,null),A.onAfterShadow(i,A,E,g,N,F,null)}}let P=A.children;for(let N=0,k=P.length;N<k;N++)v(P[N],E,g,M,R)}function w(A){A.target.removeEventListener("dispose",w);for(let g in c){let M=c[g],R=A.target.uuid;R in M&&(M[R].dispose(),delete M[R])}}}function Xg(i,t){function e(){let L=!1,nt=new le,$=null,lt=new le(0,0,0,0);return{setMask:function(pt){$!==pt&&!L&&(i.colorMask(pt,pt,pt,pt),$=pt)},setLocked:function(pt){L=pt},setClear:function(pt,j,vt,yt,fe){fe===!0&&(pt*=yt,j*=yt,vt*=yt),nt.set(pt,j,vt,yt),lt.equals(nt)===!1&&(i.clearColor(pt,j,vt,yt),lt.copy(nt))},reset:function(){L=!1,$=null,lt.set(-1,0,0,0)}}}function n(){let L=!1,nt=!1,$=null,lt=null,pt=null;return{setReversed:function(j){if(nt!==j){let vt=t.get("EXT_clip_control");j?vt.clipControlEXT(vt.LOWER_LEFT_EXT,vt.ZERO_TO_ONE_EXT):vt.clipControlEXT(vt.LOWER_LEFT_EXT,vt.NEGATIVE_ONE_TO_ONE_EXT),nt=j;let yt=pt;pt=null,this.setClear(yt)}},getReversed:function(){return nt},setTest:function(j){j?tt(i.DEPTH_TEST):Pt(i.DEPTH_TEST)},setMask:function(j){$!==j&&!L&&(i.depthMask(j),$=j)},setFunc:function(j){if(nt&&(j=cu[j]),lt!==j){switch(j){case Jr:i.depthFunc(i.NEVER);break;case Kr:i.depthFunc(i.ALWAYS);break;case jr:i.depthFunc(i.LESS);break;case Ni:i.depthFunc(i.LEQUAL);break;case Qr:i.depthFunc(i.EQUAL);break;case ta:i.depthFunc(i.GEQUAL);break;case ea:i.depthFunc(i.GREATER);break;case na:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}lt=j}},setLocked:function(j){L=j},setClear:function(j){pt!==j&&(pt=j,nt&&(j=1-j),i.clearDepth(j))},reset:function(){L=!1,$=null,lt=null,pt=null,nt=!1}}}function s(){let L=!1,nt=null,$=null,lt=null,pt=null,j=null,vt=null,yt=null,fe=null;return{setTest:function(re){L||(re?tt(i.STENCIL_TEST):Pt(i.STENCIL_TEST))},setMask:function(re){nt!==re&&!L&&(i.stencilMask(re),nt=re)},setFunc:function(re,En,Tn){($!==re||lt!==En||pt!==Tn)&&(i.stencilFunc(re,En,Tn),$=re,lt=En,pt=Tn)},setOp:function(re,En,Tn){(j!==re||vt!==En||yt!==Tn)&&(i.stencilOp(re,En,Tn),j=re,vt=En,yt=Tn)},setLocked:function(re){L=re},setClear:function(re){fe!==re&&(i.clearStencil(re),fe=re)},reset:function(){L=!1,nt=null,$=null,lt=null,pt=null,j=null,vt=null,yt=null,fe=null}}}let r=new e,a=new n,o=new s,l=new WeakMap,c=new WeakMap,h={},d={},u={},f=new WeakMap,p=[],y=null,x=!1,m=null,b=null,T=null,v=null,w=null,A=null,E=null,g=new Tt(0,0,0),M=0,R=!1,I=null,P=null,N=null,k=null,F=null,H=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),W=!1,Z=0,Q=i.getParameter(i.VERSION);Q.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(Q)[1]),W=Z>=1):Q.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(Q)[1]),W=Z>=2);let rt=null,dt={},xt=i.getParameter(i.SCISSOR_BOX),$t=i.getParameter(i.VIEWPORT),ue=new le().fromArray(xt),Zt=new le().fromArray($t);function K(L,nt,$,lt){let pt=new Uint8Array(4),j=i.createTexture();i.bindTexture(L,j),i.texParameteri(L,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(L,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let vt=0;vt<$;vt++)L===i.TEXTURE_3D||L===i.TEXTURE_2D_ARRAY?i.texImage3D(nt,0,i.RGBA,1,1,lt,0,i.RGBA,i.UNSIGNED_BYTE,pt):i.texImage2D(nt+vt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,pt);return j}let it={};it[i.TEXTURE_2D]=K(i.TEXTURE_2D,i.TEXTURE_2D,1),it[i.TEXTURE_CUBE_MAP]=K(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),it[i.TEXTURE_2D_ARRAY]=K(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),it[i.TEXTURE_3D]=K(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),tt(i.DEPTH_TEST),a.setFunc(Ni),_e(!1),be(Il),tt(i.CULL_FACE),Jt(Un);function tt(L){h[L]!==!0&&(i.enable(L),h[L]=!0)}function Pt(L){h[L]!==!1&&(i.disable(L),h[L]=!1)}function Dt(L,nt){return u[L]!==nt?(i.bindFramebuffer(L,nt),u[L]=nt,L===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=nt),L===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=nt),!0):!1}function At(L,nt){let $=p,lt=!1;if(L){$=f.get(nt),$===void 0&&($=[],f.set(nt,$));let pt=L.textures;if($.length!==pt.length||$[0]!==i.COLOR_ATTACHMENT0){for(let j=0,vt=pt.length;j<vt;j++)$[j]=i.COLOR_ATTACHMENT0+j;$.length=pt.length,lt=!0}}else $[0]!==i.BACK&&($[0]=i.BACK,lt=!0);lt&&i.drawBuffers($)}function me(L){return y!==L?(i.useProgram(L),y=L,!0):!1}let zt={[hi]:i.FUNC_ADD,[Lh]:i.FUNC_SUBTRACT,[Nh]:i.FUNC_REVERSE_SUBTRACT};zt[Dh]=i.MIN,zt[Uh]=i.MAX;let ne={[Fh]:i.ZERO,[Oh]:i.ONE,[Bh]:i.SRC_COLOR,[$r]:i.SRC_ALPHA,[Wh]:i.SRC_ALPHA_SATURATE,[Hh]:i.DST_COLOR,[zh]:i.DST_ALPHA,[kh]:i.ONE_MINUS_SRC_COLOR,[Zr]:i.ONE_MINUS_SRC_ALPHA,[Gh]:i.ONE_MINUS_DST_COLOR,[Vh]:i.ONE_MINUS_DST_ALPHA,[Xh]:i.CONSTANT_COLOR,[qh]:i.ONE_MINUS_CONSTANT_COLOR,[Yh]:i.CONSTANT_ALPHA,[$h]:i.ONE_MINUS_CONSTANT_ALPHA};function Jt(L,nt,$,lt,pt,j,vt,yt,fe,re){if(L===Un){x===!0&&(Pt(i.BLEND),x=!1);return}if(x===!1&&(tt(i.BLEND),x=!0),L!==Ph){if(L!==m||re!==R){if((b!==hi||w!==hi)&&(i.blendEquation(i.FUNC_ADD),b=hi,w=hi),re)switch(L){case Li:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Fn:i.blendFunc(i.ONE,i.ONE);break;case Pl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Ll:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:It("WebGLState: Invalid blending: ",L);break}else switch(L){case Li:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Fn:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Pl:It("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Ll:It("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:It("WebGLState: Invalid blending: ",L);break}T=null,v=null,A=null,E=null,g.set(0,0,0),M=0,m=L,R=re}return}pt=pt||nt,j=j||$,vt=vt||lt,(nt!==b||pt!==w)&&(i.blendEquationSeparate(zt[nt],zt[pt]),b=nt,w=pt),($!==T||lt!==v||j!==A||vt!==E)&&(i.blendFuncSeparate(ne[$],ne[lt],ne[j],ne[vt]),T=$,v=lt,A=j,E=vt),(yt.equals(g)===!1||fe!==M)&&(i.blendColor(yt.r,yt.g,yt.b,fe),g.copy(yt),M=fe),m=L,R=!1}function Xt(L,nt){L.side===an?Pt(i.CULL_FACE):tt(i.CULL_FACE);let $=L.side===Ge;nt&&($=!$),_e($),L.blending===Li&&L.transparent===!1?Jt(Un):Jt(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),a.setFunc(L.depthFunc),a.setTest(L.depthTest),a.setMask(L.depthWrite),r.setMask(L.colorWrite);let lt=L.stencilWrite;o.setTest(lt),lt&&(o.setMask(L.stencilWriteMask),o.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),o.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),Le(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?tt(i.SAMPLE_ALPHA_TO_COVERAGE):Pt(i.SAMPLE_ALPHA_TO_COVERAGE)}function _e(L){I!==L&&(L?i.frontFace(i.CW):i.frontFace(i.CCW),I=L)}function be(L){L!==Rh?(tt(i.CULL_FACE),L!==P&&(L===Il?i.cullFace(i.BACK):L===Ch?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Pt(i.CULL_FACE),P=L}function we(L){L!==N&&(W&&i.lineWidth(L),N=L)}function Le(L,nt,$){L?(tt(i.POLYGON_OFFSET_FILL),(k!==nt||F!==$)&&(k=nt,F=$,a.getReversed()&&(nt=-nt),i.polygonOffset(nt,$))):Pt(i.POLYGON_OFFSET_FILL)}function de(L){L?tt(i.SCISSOR_TEST):Pt(i.SCISSOR_TEST)}function ve(L){L===void 0&&(L=i.TEXTURE0+H-1),rt!==L&&(i.activeTexture(L),rt=L)}function D(L,nt,$){$===void 0&&(rt===null?$=i.TEXTURE0+H-1:$=rt);let lt=dt[$];lt===void 0&&(lt={type:void 0,texture:void 0},dt[$]=lt),(lt.type!==L||lt.texture!==nt)&&(rt!==$&&(i.activeTexture($),rt=$),i.bindTexture(L,nt||it[L]),lt.type=L,lt.texture=nt)}function We(){let L=dt[rt];L!==void 0&&L.type!==void 0&&(i.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function jt(){try{i.compressedTexImage2D(...arguments)}catch(L){It("WebGLState:",L)}}function C(){try{i.compressedTexImage3D(...arguments)}catch(L){It("WebGLState:",L)}}function _(){try{i.texSubImage2D(...arguments)}catch(L){It("WebGLState:",L)}}function B(){try{i.texSubImage3D(...arguments)}catch(L){It("WebGLState:",L)}}function G(){try{i.compressedTexSubImage2D(...arguments)}catch(L){It("WebGLState:",L)}}function q(){try{i.compressedTexSubImage3D(...arguments)}catch(L){It("WebGLState:",L)}}function et(){try{i.texStorage2D(...arguments)}catch(L){It("WebGLState:",L)}}function st(){try{i.texStorage3D(...arguments)}catch(L){It("WebGLState:",L)}}function Y(){try{i.texImage2D(...arguments)}catch(L){It("WebGLState:",L)}}function J(){try{i.texImage3D(...arguments)}catch(L){It("WebGLState:",L)}}function at(L){return d[L]!==void 0?d[L]:i.getParameter(L)}function bt(L,nt){d[L]!==nt&&(i.pixelStorei(L,nt),d[L]=nt)}function ct(L){ue.equals(L)===!1&&(i.scissor(L.x,L.y,L.z,L.w),ue.copy(L))}function ot(L){Zt.equals(L)===!1&&(i.viewport(L.x,L.y,L.z,L.w),Zt.copy(L))}function wt(L,nt){let $=c.get(nt);$===void 0&&($=new WeakMap,c.set(nt,$));let lt=$.get(L);lt===void 0&&(lt=i.getUniformBlockIndex(nt,L.name),$.set(L,lt))}function Rt(L,nt){let lt=c.get(nt).get(L);l.get(nt)!==lt&&(i.uniformBlockBinding(nt,lt,L.__bindingPointIndex),l.set(nt,lt))}function Ut(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},d={},rt=null,dt={},u={},f=new WeakMap,p=[],y=null,x=!1,m=null,b=null,T=null,v=null,w=null,A=null,E=null,g=new Tt(0,0,0),M=0,R=!1,I=null,P=null,N=null,k=null,F=null,ue.set(0,0,i.canvas.width,i.canvas.height),Zt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:tt,disable:Pt,bindFramebuffer:Dt,drawBuffers:At,useProgram:me,setBlending:Jt,setMaterial:Xt,setFlipSided:_e,setCullFace:be,setLineWidth:we,setPolygonOffset:Le,setScissorTest:de,activeTexture:ve,bindTexture:D,unbindTexture:We,compressedTexImage2D:jt,compressedTexImage3D:C,texImage2D:Y,texImage3D:J,pixelStorei:bt,getParameter:at,updateUBOMapping:wt,uniformBlockBinding:Rt,texStorage2D:et,texStorage3D:st,texSubImage2D:_,texSubImage3D:B,compressedTexSubImage2D:G,compressedTexSubImage3D:q,scissor:ct,viewport:ot,reset:Ut}}function qg(i,t,e,n,s,r,a){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Lt,h=new WeakMap,d=new Set,u,f=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(C,_){return p?new OffscreenCanvas(C,_):Ds("canvas")}function x(C,_,B){let G=1,q=jt(C);if((q.width>B||q.height>B)&&(G=B/Math.max(q.width,q.height)),G<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let et=Math.floor(G*q.width),st=Math.floor(G*q.height);u===void 0&&(u=y(et,st));let Y=_?y(et,st):u;return Y.width=et,Y.height=st,Y.getContext("2d").drawImage(C,0,0,et,st),Ct("WebGLRenderer: Texture has been resized from ("+q.width+"x"+q.height+") to ("+et+"x"+st+")."),Y}else return"data"in C&&Ct("WebGLRenderer: Image in DataTexture is too big ("+q.width+"x"+q.height+")."),C;return C}function m(C){return C.generateMipmaps}function b(C){i.generateMipmap(C)}function T(C){return C.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?i.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function v(C,_,B,G,q,et=!1){if(C!==null){if(i[C]!==void 0)return i[C];Ct("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let st;G&&(st=t.get("EXT_texture_norm16"),st||Ct("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let Y=_;if(_===i.RED&&(B===i.FLOAT&&(Y=i.R32F),B===i.HALF_FLOAT&&(Y=i.R16F),B===i.UNSIGNED_BYTE&&(Y=i.R8),B===i.UNSIGNED_SHORT&&st&&(Y=st.R16_EXT),B===i.SHORT&&st&&(Y=st.R16_SNORM_EXT)),_===i.RED_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.R8UI),B===i.UNSIGNED_SHORT&&(Y=i.R16UI),B===i.UNSIGNED_INT&&(Y=i.R32UI),B===i.BYTE&&(Y=i.R8I),B===i.SHORT&&(Y=i.R16I),B===i.INT&&(Y=i.R32I)),_===i.RG&&(B===i.FLOAT&&(Y=i.RG32F),B===i.HALF_FLOAT&&(Y=i.RG16F),B===i.UNSIGNED_BYTE&&(Y=i.RG8),B===i.UNSIGNED_SHORT&&st&&(Y=st.RG16_EXT),B===i.SHORT&&st&&(Y=st.RG16_SNORM_EXT)),_===i.RG_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RG8UI),B===i.UNSIGNED_SHORT&&(Y=i.RG16UI),B===i.UNSIGNED_INT&&(Y=i.RG32UI),B===i.BYTE&&(Y=i.RG8I),B===i.SHORT&&(Y=i.RG16I),B===i.INT&&(Y=i.RG32I)),_===i.RGB_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RGB8UI),B===i.UNSIGNED_SHORT&&(Y=i.RGB16UI),B===i.UNSIGNED_INT&&(Y=i.RGB32UI),B===i.BYTE&&(Y=i.RGB8I),B===i.SHORT&&(Y=i.RGB16I),B===i.INT&&(Y=i.RGB32I)),_===i.RGBA_INTEGER&&(B===i.UNSIGNED_BYTE&&(Y=i.RGBA8UI),B===i.UNSIGNED_SHORT&&(Y=i.RGBA16UI),B===i.UNSIGNED_INT&&(Y=i.RGBA32UI),B===i.BYTE&&(Y=i.RGBA8I),B===i.SHORT&&(Y=i.RGBA16I),B===i.INT&&(Y=i.RGBA32I)),_===i.RGB&&(B===i.UNSIGNED_SHORT&&st&&(Y=st.RGB16_EXT),B===i.SHORT&&st&&(Y=st.RGB16_SNORM_EXT),B===i.UNSIGNED_INT_5_9_9_9_REV&&(Y=i.RGB9_E5),B===i.UNSIGNED_INT_10F_11F_11F_REV&&(Y=i.R11F_G11F_B10F)),_===i.RGBA){let J=et?Ns:Vt.getTransfer(q);B===i.FLOAT&&(Y=i.RGBA32F),B===i.HALF_FLOAT&&(Y=i.RGBA16F),B===i.UNSIGNED_BYTE&&(Y=J===Kt?i.SRGB8_ALPHA8:i.RGBA8),B===i.UNSIGNED_SHORT&&st&&(Y=st.RGBA16_EXT),B===i.SHORT&&st&&(Y=st.RGBA16_SNORM_EXT),B===i.UNSIGNED_SHORT_4_4_4_4&&(Y=i.RGBA4),B===i.UNSIGNED_SHORT_5_5_5_1&&(Y=i.RGB5_A1)}return(Y===i.R16F||Y===i.R32F||Y===i.RG16F||Y===i.RG32F||Y===i.RGBA16F||Y===i.RGBA32F)&&t.get("EXT_color_buffer_float"),Y}function w(C,_){let B;return C?_===null||_===Mn||_===gs?B=i.DEPTH24_STENCIL8:_===on?B=i.DEPTH32F_STENCIL8:_===ms&&(B=i.DEPTH24_STENCIL8,Ct("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Mn||_===gs?B=i.DEPTH_COMPONENT24:_===on?B=i.DEPTH_COMPONENT32F:_===ms&&(B=i.DEPTH_COMPONENT16),B}function A(C,_){return m(C)===!0||C.isFramebufferTexture&&C.minFilter!==Ce&&C.minFilter!==Ue?Math.log2(Math.max(_.width,_.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?_.mipmaps.length:1}function E(C){let _=C.target;_.removeEventListener("dispose",E),M(_),_.isVideoTexture&&h.delete(_),_.isHTMLTexture&&d.delete(_)}function g(C){let _=C.target;_.removeEventListener("dispose",g),I(_)}function M(C){let _=n.get(C);if(_.__webglInit===void 0)return;let B=C.source,G=f.get(B);if(G){let q=G[_.__cacheKey];q.usedTimes--,q.usedTimes===0&&R(C),Object.keys(G).length===0&&f.delete(B)}n.remove(C)}function R(C){let _=n.get(C);i.deleteTexture(_.__webglTexture);let B=C.source,G=f.get(B);delete G[_.__cacheKey],a.memory.textures--}function I(C){let _=n.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),n.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let G=0;G<6;G++){if(Array.isArray(_.__webglFramebuffer[G]))for(let q=0;q<_.__webglFramebuffer[G].length;q++)i.deleteFramebuffer(_.__webglFramebuffer[G][q]);else i.deleteFramebuffer(_.__webglFramebuffer[G]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[G])}else{if(Array.isArray(_.__webglFramebuffer))for(let G=0;G<_.__webglFramebuffer.length;G++)i.deleteFramebuffer(_.__webglFramebuffer[G]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let G=0;G<_.__webglColorRenderbuffer.length;G++)_.__webglColorRenderbuffer[G]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[G]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let B=C.textures;for(let G=0,q=B.length;G<q;G++){let et=n.get(B[G]);et.__webglTexture&&(i.deleteTexture(et.__webglTexture),a.memory.textures--),n.remove(B[G])}n.remove(C)}let P=0;function N(){P=0}function k(){return P}function F(C){P=C}function H(){let C=P;return C>=s.maxTextures&&Ct("WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+s.maxTextures),P+=1,C}function W(C){let _=[];return _.push(C.wrapS),_.push(C.wrapT),_.push(C.wrapR||0),_.push(C.magFilter),_.push(C.minFilter),_.push(C.anisotropy),_.push(C.internalFormat),_.push(C.format),_.push(C.type),_.push(C.generateMipmaps),_.push(C.premultiplyAlpha),_.push(C.flipY),_.push(C.unpackAlignment),_.push(C.colorSpace),_.join()}function Z(C,_){let B=n.get(C);if(C.isVideoTexture&&D(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&B.__version!==C.version){let G=C.image;if(G===null)Ct("WebGLRenderer: Texture marked for update but no image data found.");else if(G.complete===!1)Ct("WebGLRenderer: Texture marked for update but image is incomplete");else{Pt(B,C,_);return}}else C.isExternalTexture&&(B.__webglTexture=C.sourceTexture?C.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,B.__webglTexture,i.TEXTURE0+_)}function Q(C,_){let B=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){Pt(B,C,_);return}else C.isExternalTexture&&(B.__webglTexture=C.sourceTexture?C.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,B.__webglTexture,i.TEXTURE0+_)}function rt(C,_){let B=n.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){Pt(B,C,_);return}e.bindTexture(i.TEXTURE_3D,B.__webglTexture,i.TEXTURE0+_)}function dt(C,_){let B=n.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&B.__version!==C.version){Dt(B,C,_);return}e.bindTexture(i.TEXTURE_CUBE_MAP,B.__webglTexture,i.TEXTURE0+_)}let xt={[as]:i.REPEAT,[Cn]:i.CLAMP_TO_EDGE,[ia]:i.MIRRORED_REPEAT},$t={[Ce]:i.NEAREST,[Kh]:i.NEAREST_MIPMAP_NEAREST,[js]:i.NEAREST_MIPMAP_LINEAR,[Ue]:i.LINEAR,[Pa]:i.LINEAR_MIPMAP_NEAREST,[yi]:i.LINEAR_MIPMAP_LINEAR},ue={[tu]:i.NEVER,[ru]:i.ALWAYS,[eu]:i.LESS,[xo]:i.LEQUAL,[nu]:i.EQUAL,[yo]:i.GEQUAL,[iu]:i.GREATER,[su]:i.NOTEQUAL};function Zt(C,_){if(_.type===on&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===Ue||_.magFilter===Pa||_.magFilter===js||_.magFilter===yi||_.minFilter===Ue||_.minFilter===Pa||_.minFilter===js||_.minFilter===yi)&&Ct("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(C,i.TEXTURE_WRAP_S,xt[_.wrapS]),i.texParameteri(C,i.TEXTURE_WRAP_T,xt[_.wrapT]),(C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY)&&i.texParameteri(C,i.TEXTURE_WRAP_R,xt[_.wrapR]),i.texParameteri(C,i.TEXTURE_MAG_FILTER,$t[_.magFilter]),i.texParameteri(C,i.TEXTURE_MIN_FILTER,$t[_.minFilter]),_.compareFunction&&(i.texParameteri(C,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(C,i.TEXTURE_COMPARE_FUNC,ue[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Ce||_.minFilter!==js&&_.minFilter!==yi||_.type===on&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){let B=t.get("EXT_texture_filter_anisotropic");i.texParameterf(C,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function K(C,_){let B=!1;C.__webglInit===void 0&&(C.__webglInit=!0,_.addEventListener("dispose",E));let G=_.source,q=f.get(G);q===void 0&&(q={},f.set(G,q));let et=W(_);if(et!==C.__cacheKey){q[et]===void 0&&(q[et]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,B=!0),q[et].usedTimes++;let st=q[C.__cacheKey];st!==void 0&&(q[C.__cacheKey].usedTimes--,st.usedTimes===0&&R(_)),C.__cacheKey=et,C.__webglTexture=q[et].texture}return B}function it(C,_,B){return Math.floor(Math.floor(C/B)/_)}function tt(C,_,B,G){let et=C.updateRanges;if(et.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,_.width,_.height,B,G,_.data);else{et.sort((bt,ct)=>bt.start-ct.start);let st=0;for(let bt=1;bt<et.length;bt++){let ct=et[st],ot=et[bt],wt=ct.start+ct.count,Rt=it(ot.start,_.width,4),Ut=it(ct.start,_.width,4);ot.start<=wt+1&&Rt===Ut&&it(ot.start+ot.count-1,_.width,4)===Rt?ct.count=Math.max(ct.count,ot.start+ot.count-ct.start):(++st,et[st]=ot)}et.length=st+1;let Y=e.getParameter(i.UNPACK_ROW_LENGTH),J=e.getParameter(i.UNPACK_SKIP_PIXELS),at=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,_.width);for(let bt=0,ct=et.length;bt<ct;bt++){let ot=et[bt],wt=Math.floor(ot.start/4),Rt=Math.ceil(ot.count/4),Ut=wt%_.width,L=Math.floor(wt/_.width),nt=Rt,$=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,Ut),e.pixelStorei(i.UNPACK_SKIP_ROWS,L),e.texSubImage2D(i.TEXTURE_2D,0,Ut,L,nt,$,B,G,_.data)}C.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,Y),e.pixelStorei(i.UNPACK_SKIP_PIXELS,J),e.pixelStorei(i.UNPACK_SKIP_ROWS,at)}}function Pt(C,_,B){let G=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(G=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(G=i.TEXTURE_3D);let q=K(C,_),et=_.source;e.bindTexture(G,C.__webglTexture,i.TEXTURE0+B);let st=n.get(et);if(et.version!==st.__version||q===!0){if(e.activeTexture(i.TEXTURE0+B),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){let $=Vt.getPrimaries(Vt.workingColorSpace),lt=_.colorSpace===bn?null:Vt.getPrimaries(_.colorSpace),pt=_.colorSpace===bn||$===lt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,pt)}e.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment);let J=x(_.image,!1,s.maxTextureSize);J=We(_,J);let at=r.convert(_.format,_.colorSpace),bt=r.convert(_.type),ct=v(_.internalFormat,at,bt,_.normalized,_.colorSpace,_.isVideoTexture);Zt(G,_);let ot,wt=_.mipmaps,Rt=_.isVideoTexture!==!0,Ut=st.__version===void 0||q===!0,L=et.dataReady,nt=A(_,J);if(_.isDepthTexture)ct=w(_.format===_i,_.type),Ut&&(Rt?e.texStorage2D(i.TEXTURE_2D,1,ct,J.width,J.height):e.texImage2D(i.TEXTURE_2D,0,ct,J.width,J.height,0,at,bt,null));else if(_.isDataTexture)if(wt.length>0){Rt&&Ut&&e.texStorage2D(i.TEXTURE_2D,nt,ct,wt[0].width,wt[0].height);for(let $=0,lt=wt.length;$<lt;$++)ot=wt[$],Rt?L&&e.texSubImage2D(i.TEXTURE_2D,$,0,0,ot.width,ot.height,at,bt,ot.data):e.texImage2D(i.TEXTURE_2D,$,ct,ot.width,ot.height,0,at,bt,ot.data);_.generateMipmaps=!1}else Rt?(Ut&&e.texStorage2D(i.TEXTURE_2D,nt,ct,J.width,J.height),L&&tt(_,J,at,bt)):e.texImage2D(i.TEXTURE_2D,0,ct,J.width,J.height,0,at,bt,J.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Rt&&Ut&&e.texStorage3D(i.TEXTURE_2D_ARRAY,nt,ct,wt[0].width,wt[0].height,J.depth);for(let $=0,lt=wt.length;$<lt;$++)if(ot=wt[$],_.format!==ln)if(at!==null)if(Rt){if(L)if(_.layerUpdates.size>0){let pt=jl(ot.width,ot.height,_.format,_.type);for(let j of _.layerUpdates){let vt=ot.data.subarray(j*pt/ot.data.BYTES_PER_ELEMENT,(j+1)*pt/ot.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,j,ot.width,ot.height,1,at,vt)}_.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,0,ot.width,ot.height,J.depth,at,ot.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,$,ct,ot.width,ot.height,J.depth,0,ot.data,0,0);else Ct("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Rt?L&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,$,0,0,0,ot.width,ot.height,J.depth,at,bt,ot.data):e.texImage3D(i.TEXTURE_2D_ARRAY,$,ct,ot.width,ot.height,J.depth,0,at,bt,ot.data)}else{Rt&&Ut&&e.texStorage2D(i.TEXTURE_2D,nt,ct,wt[0].width,wt[0].height);for(let $=0,lt=wt.length;$<lt;$++)ot=wt[$],_.format!==ln?at!==null?Rt?L&&e.compressedTexSubImage2D(i.TEXTURE_2D,$,0,0,ot.width,ot.height,at,ot.data):e.compressedTexImage2D(i.TEXTURE_2D,$,ct,ot.width,ot.height,0,ot.data):Ct("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Rt?L&&e.texSubImage2D(i.TEXTURE_2D,$,0,0,ot.width,ot.height,at,bt,ot.data):e.texImage2D(i.TEXTURE_2D,$,ct,ot.width,ot.height,0,at,bt,ot.data)}else if(_.isDataArrayTexture)if(Rt){if(Ut&&e.texStorage3D(i.TEXTURE_2D_ARRAY,nt,ct,J.width,J.height,J.depth),L)if(_.layerUpdates.size>0){let $=jl(J.width,J.height,_.format,_.type);for(let lt of _.layerUpdates){let pt=J.data.subarray(lt*$/J.data.BYTES_PER_ELEMENT,(lt+1)*$/J.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,lt,J.width,J.height,1,at,bt,pt)}_.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,J.width,J.height,J.depth,at,bt,J.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,ct,J.width,J.height,J.depth,0,at,bt,J.data);else if(_.isData3DTexture)Rt?(Ut&&e.texStorage3D(i.TEXTURE_3D,nt,ct,J.width,J.height,J.depth),L&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,J.width,J.height,J.depth,at,bt,J.data)):e.texImage3D(i.TEXTURE_3D,0,ct,J.width,J.height,J.depth,0,at,bt,J.data);else if(_.isFramebufferTexture){if(Ut)if(Rt)e.texStorage2D(i.TEXTURE_2D,nt,ct,J.width,J.height);else{let $=J.width,lt=J.height;for(let pt=0;pt<nt;pt++)e.texImage2D(i.TEXTURE_2D,pt,ct,$,lt,0,at,bt,null),$>>=1,lt>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in i){let $=i.canvas;if($.hasAttribute("layoutsubtree")||$.setAttribute("layoutsubtree","true"),J.parentNode!==$){$.appendChild(J),d.add(_),$.onpaint=lt=>{let pt=lt.changedElements;for(let j of d)pt.includes(j.image)&&(j.needsUpdate=!0)},$.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,J);else{let pt=i.RGBA,j=i.RGBA,vt=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,pt,j,vt,J)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(wt.length>0){if(Rt&&Ut){let $=jt(wt[0]);e.texStorage2D(i.TEXTURE_2D,nt,ct,$.width,$.height)}for(let $=0,lt=wt.length;$<lt;$++)ot=wt[$],Rt?L&&e.texSubImage2D(i.TEXTURE_2D,$,0,0,at,bt,ot):e.texImage2D(i.TEXTURE_2D,$,ct,at,bt,ot);_.generateMipmaps=!1}else if(Rt){if(Ut){let $=jt(J);e.texStorage2D(i.TEXTURE_2D,nt,ct,$.width,$.height)}L&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,at,bt,J)}else e.texImage2D(i.TEXTURE_2D,0,ct,at,bt,J);m(_)&&b(G),st.__version=et.version,_.onUpdate&&_.onUpdate(_)}C.__version=_.version}function Dt(C,_,B){if(_.image.length!==6)return;let G=K(C,_),q=_.source;e.bindTexture(i.TEXTURE_CUBE_MAP,C.__webglTexture,i.TEXTURE0+B);let et=n.get(q);if(q.version!==et.__version||G===!0){e.activeTexture(i.TEXTURE0+B);let st=Vt.getPrimaries(Vt.workingColorSpace),Y=_.colorSpace===bn?null:Vt.getPrimaries(_.colorSpace),J=_.colorSpace===bn||st===Y?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,J);let at=_.isCompressedTexture||_.image[0].isCompressedTexture,bt=_.image[0]&&_.image[0].isDataTexture,ct=[];for(let j=0;j<6;j++)!at&&!bt?ct[j]=x(_.image[j],!0,s.maxCubemapSize):ct[j]=bt?_.image[j].image:_.image[j],ct[j]=We(_,ct[j]);let ot=ct[0],wt=r.convert(_.format,_.colorSpace),Rt=r.convert(_.type),Ut=v(_.internalFormat,wt,Rt,_.normalized,_.colorSpace),L=_.isVideoTexture!==!0,nt=et.__version===void 0||G===!0,$=q.dataReady,lt=A(_,ot);Zt(i.TEXTURE_CUBE_MAP,_);let pt;if(at){L&&nt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,lt,Ut,ot.width,ot.height);for(let j=0;j<6;j++){pt=ct[j].mipmaps;for(let vt=0;vt<pt.length;vt++){let yt=pt[vt];_.format!==ln?wt!==null?L?$&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,vt,0,0,yt.width,yt.height,wt,yt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,vt,Ut,yt.width,yt.height,0,yt.data):Ct("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):L?$&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,vt,0,0,yt.width,yt.height,wt,Rt,yt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,vt,Ut,yt.width,yt.height,0,wt,Rt,yt.data)}}}else{if(pt=_.mipmaps,L&&nt){pt.length>0&&lt++;let j=jt(ct[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,lt,Ut,j.width,j.height)}for(let j=0;j<6;j++)if(bt){L?$&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,ct[j].width,ct[j].height,wt,Rt,ct[j].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Ut,ct[j].width,ct[j].height,0,wt,Rt,ct[j].data);for(let vt=0;vt<pt.length;vt++){let fe=pt[vt].image[j].image;L?$&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,vt+1,0,0,fe.width,fe.height,wt,Rt,fe.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,vt+1,Ut,fe.width,fe.height,0,wt,Rt,fe.data)}}else{L?$&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,0,0,wt,Rt,ct[j]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,Ut,wt,Rt,ct[j]);for(let vt=0;vt<pt.length;vt++){let yt=pt[vt];L?$&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,vt+1,0,0,wt,Rt,yt.image[j]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+j,vt+1,Ut,wt,Rt,yt.image[j])}}}m(_)&&b(i.TEXTURE_CUBE_MAP),et.__version=q.version,_.onUpdate&&_.onUpdate(_)}C.__version=_.version}function At(C,_,B,G,q,et){let st=r.convert(B.format,B.colorSpace),Y=r.convert(B.type),J=v(B.internalFormat,st,Y,B.normalized,B.colorSpace),at=n.get(_),bt=n.get(B);if(bt.__renderTarget=_,!at.__hasExternalTextures){let ct=Math.max(1,_.width>>et),ot=Math.max(1,_.height>>et);q===i.TEXTURE_3D||q===i.TEXTURE_2D_ARRAY?e.texImage3D(q,et,J,ct,ot,_.depth,0,st,Y,null):e.texImage2D(q,et,J,ct,ot,0,st,Y,null)}e.bindFramebuffer(i.FRAMEBUFFER,C),ve(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,G,q,bt.__webglTexture,0,de(_)):(q===i.TEXTURE_2D||q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,G,q,bt.__webglTexture,et),e.bindFramebuffer(i.FRAMEBUFFER,null)}function me(C,_,B){if(i.bindRenderbuffer(i.RENDERBUFFER,C),_.depthBuffer){let G=_.depthTexture,q=G&&G.isDepthTexture?G.type:null,et=w(_.stencilBuffer,q),st=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;ve(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,de(_),et,_.width,_.height):B?i.renderbufferStorageMultisample(i.RENDERBUFFER,de(_),et,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,et,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,st,i.RENDERBUFFER,C)}else{let G=_.textures;for(let q=0;q<G.length;q++){let et=G[q],st=r.convert(et.format,et.colorSpace),Y=r.convert(et.type),J=v(et.internalFormat,st,Y,et.normalized,et.colorSpace);ve(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,de(_),J,_.width,_.height):B?i.renderbufferStorageMultisample(i.RENDERBUFFER,de(_),J,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,J,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function zt(C,_,B){let G=_.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,C),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let q=n.get(_.depthTexture);if(q.__renderTarget=_,(!q.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),G){if(q.__webglInit===void 0&&(q.__webglInit=!0,_.depthTexture.addEventListener("dispose",E)),q.__webglTexture===void 0){q.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,q.__webglTexture),Zt(i.TEXTURE_CUBE_MAP,_.depthTexture);let at=r.convert(_.depthTexture.format),bt=r.convert(_.depthTexture.type),ct;_.depthTexture.format===In?ct=i.DEPTH_COMPONENT24:_.depthTexture.format===_i&&(ct=i.DEPTH24_STENCIL8);for(let ot=0;ot<6;ot++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ot,0,ct,_.width,_.height,0,at,bt,null)}}else Z(_.depthTexture,0);let et=q.__webglTexture,st=de(_),Y=G?i.TEXTURE_CUBE_MAP_POSITIVE_X+B:i.TEXTURE_2D,J=_.depthTexture.format===_i?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(_.depthTexture.format===In)ve(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,J,Y,et,0,st):i.framebufferTexture2D(i.FRAMEBUFFER,J,Y,et,0);else if(_.depthTexture.format===_i)ve(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,J,Y,et,0,st):i.framebufferTexture2D(i.FRAMEBUFFER,J,Y,et,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ne(C){let _=n.get(C),B=C.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==C.depthTexture){let G=C.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),G){let q=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,G.removeEventListener("dispose",q)};G.addEventListener("dispose",q),_.__depthDisposeCallback=q}_.__boundDepthTexture=G}if(C.depthTexture&&!_.__autoAllocateDepthBuffer)if(B)for(let G=0;G<6;G++)zt(_.__webglFramebuffer[G],C,G);else{let G=C.texture.mipmaps;G&&G.length>0?zt(_.__webglFramebuffer[0],C,0):zt(_.__webglFramebuffer,C,0)}else if(B){_.__webglDepthbuffer=[];for(let G=0;G<6;G++)if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[G]),_.__webglDepthbuffer[G]===void 0)_.__webglDepthbuffer[G]=i.createRenderbuffer(),me(_.__webglDepthbuffer[G],C,!1);else{let q=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,et=_.__webglDepthbuffer[G];i.bindRenderbuffer(i.RENDERBUFFER,et),i.framebufferRenderbuffer(i.FRAMEBUFFER,q,i.RENDERBUFFER,et)}}else{let G=C.texture.mipmaps;if(G&&G.length>0?e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),me(_.__webglDepthbuffer,C,!1);else{let q=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,et=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,et),i.framebufferRenderbuffer(i.FRAMEBUFFER,q,i.RENDERBUFFER,et)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function Jt(C,_,B){let G=n.get(C);_!==void 0&&At(G.__webglFramebuffer,C,C.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),B!==void 0&&ne(C)}function Xt(C){let _=C.texture,B=n.get(C),G=n.get(_);C.addEventListener("dispose",g);let q=C.textures,et=C.isWebGLCubeRenderTarget===!0,st=q.length>1;if(st||(G.__webglTexture===void 0&&(G.__webglTexture=i.createTexture()),G.__version=_.version,a.memory.textures++),et){B.__webglFramebuffer=[];for(let Y=0;Y<6;Y++)if(_.mipmaps&&_.mipmaps.length>0){B.__webglFramebuffer[Y]=[];for(let J=0;J<_.mipmaps.length;J++)B.__webglFramebuffer[Y][J]=i.createFramebuffer()}else B.__webglFramebuffer[Y]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){B.__webglFramebuffer=[];for(let Y=0;Y<_.mipmaps.length;Y++)B.__webglFramebuffer[Y]=i.createFramebuffer()}else B.__webglFramebuffer=i.createFramebuffer();if(st)for(let Y=0,J=q.length;Y<J;Y++){let at=n.get(q[Y]);at.__webglTexture===void 0&&(at.__webglTexture=i.createTexture(),a.memory.textures++)}if(C.samples>0&&ve(C)===!1){B.__webglMultisampledFramebuffer=i.createFramebuffer(),B.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let Y=0;Y<q.length;Y++){let J=q[Y];B.__webglColorRenderbuffer[Y]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,B.__webglColorRenderbuffer[Y]);let at=r.convert(J.format,J.colorSpace),bt=r.convert(J.type),ct=v(J.internalFormat,at,bt,J.normalized,J.colorSpace,C.isXRRenderTarget===!0),ot=de(C);i.renderbufferStorageMultisample(i.RENDERBUFFER,ot,ct,C.width,C.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Y,i.RENDERBUFFER,B.__webglColorRenderbuffer[Y])}i.bindRenderbuffer(i.RENDERBUFFER,null),C.depthBuffer&&(B.__webglDepthRenderbuffer=i.createRenderbuffer(),me(B.__webglDepthRenderbuffer,C,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(et){e.bindTexture(i.TEXTURE_CUBE_MAP,G.__webglTexture),Zt(i.TEXTURE_CUBE_MAP,_);for(let Y=0;Y<6;Y++)if(_.mipmaps&&_.mipmaps.length>0)for(let J=0;J<_.mipmaps.length;J++)At(B.__webglFramebuffer[Y][J],C,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,J);else At(B.__webglFramebuffer[Y],C,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+Y,0);m(_)&&b(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(st){for(let Y=0,J=q.length;Y<J;Y++){let at=q[Y],bt=n.get(at),ct=i.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(ct=C.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ct,bt.__webglTexture),Zt(ct,at),At(B.__webglFramebuffer,C,at,i.COLOR_ATTACHMENT0+Y,ct,0),m(at)&&b(ct)}e.unbindTexture()}else{let Y=i.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(Y=C.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(Y,G.__webglTexture),Zt(Y,_),_.mipmaps&&_.mipmaps.length>0)for(let J=0;J<_.mipmaps.length;J++)At(B.__webglFramebuffer[J],C,_,i.COLOR_ATTACHMENT0,Y,J);else At(B.__webglFramebuffer,C,_,i.COLOR_ATTACHMENT0,Y,0);m(_)&&b(Y),e.unbindTexture()}C.depthBuffer&&ne(C)}function _e(C){let _=C.textures;for(let B=0,G=_.length;B<G;B++){let q=_[B];if(m(q)){let et=T(C),st=n.get(q).__webglTexture;e.bindTexture(et,st),b(et),e.unbindTexture()}}}let be=[],we=[];function Le(C){if(C.samples>0){if(ve(C)===!1){let _=C.textures,B=C.width,G=C.height,q=i.COLOR_BUFFER_BIT,et=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,st=n.get(C),Y=_.length>1;if(Y)for(let at=0;at<_.length;at++)e.bindFramebuffer(i.FRAMEBUFFER,st.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,st.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,st.__webglMultisampledFramebuffer);let J=C.texture.mipmaps;J&&J.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,st.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,st.__webglFramebuffer);for(let at=0;at<_.length;at++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(q|=i.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(q|=i.STENCIL_BUFFER_BIT)),Y){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,st.__webglColorRenderbuffer[at]);let bt=n.get(_[at]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,bt,0)}i.blitFramebuffer(0,0,B,G,0,0,B,G,q,i.NEAREST),l===!0&&(be.length=0,we.length=0,be.push(i.COLOR_ATTACHMENT0+at),C.depthBuffer&&C.resolveDepthBuffer===!1&&(be.push(et),we.push(et),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,we)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,be))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),Y)for(let at=0;at<_.length;at++){e.bindFramebuffer(i.FRAMEBUFFER,st.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.RENDERBUFFER,st.__webglColorRenderbuffer[at]);let bt=n.get(_[at]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,st.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+at,i.TEXTURE_2D,bt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,st.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&l){let _=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function de(C){return Math.min(s.maxSamples,C.samples)}function ve(C){let _=n.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function D(C){let _=a.render.frame;h.get(C)!==_&&(h.set(C,_),C.update())}function We(C,_){let B=C.colorSpace,G=C.format,q=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||B!==Ls&&B!==bn&&(Vt.getTransfer(B)===Kt?(G!==ln||q!==Ye)&&Ct("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):It("WebGLTextures: Unsupported texture color space:",B)),_}function jt(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=H,this.resetTextureUnits=N,this.getTextureUnits=k,this.setTextureUnits=F,this.setTexture2D=Z,this.setTexture2DArray=Q,this.setTexture3D=rt,this.setTextureCube=dt,this.rebindTextures=Jt,this.setupRenderTarget=Xt,this.updateRenderTargetMipmap=_e,this.updateMultisampleRenderTarget=Le,this.setupDepthRenderbuffer=ne,this.setupFrameBufferTexture=At,this.useMultisampledRTT=ve,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function Yg(i,t){function e(n,s=bn){let r,a=Vt.getTransfer(s);if(n===Ye)return i.UNSIGNED_BYTE;if(n===Na)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Da)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Gl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Wl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Vl)return i.BYTE;if(n===Hl)return i.SHORT;if(n===ms)return i.UNSIGNED_SHORT;if(n===La)return i.INT;if(n===Mn)return i.UNSIGNED_INT;if(n===on)return i.FLOAT;if(n===On)return i.HALF_FLOAT;if(n===Xl)return i.ALPHA;if(n===ql)return i.RGB;if(n===ln)return i.RGBA;if(n===In)return i.DEPTH_COMPONENT;if(n===_i)return i.DEPTH_STENCIL;if(n===Ua)return i.RED;if(n===Fa)return i.RED_INTEGER;if(n===vi)return i.RG;if(n===Oa)return i.RG_INTEGER;if(n===Ba)return i.RGBA_INTEGER;if(n===Qs||n===tr||n===er||n===nr)if(a===Kt)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Qs)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===tr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===er)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===nr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Qs)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===tr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===er)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===nr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===ka||n===za||n===Va||n===Ha)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===ka)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===za)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Va)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Ha)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ga||n===Wa||n===Xa||n===qa||n===Ya||n===ir||n===$a)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ga||n===Wa)return a===Kt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Xa)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===qa)return r.COMPRESSED_R11_EAC;if(n===Ya)return r.COMPRESSED_SIGNED_R11_EAC;if(n===ir)return r.COMPRESSED_RG11_EAC;if(n===$a)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Za||n===Ja||n===Ka||n===ja||n===Qa||n===to||n===eo||n===no||n===io||n===so||n===ro||n===ao||n===oo||n===lo)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Za)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Ja)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ka)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ja)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Qa)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===to)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===eo)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===no)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===io)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===so)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ro)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ao)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===oo)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===lo)return a===Kt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===co||n===ho||n===uo)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===co)return a===Kt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ho)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===uo)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===fo||n===po||n===sr||n===mo)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===fo)return r.COMPRESSED_RED_RGTC1_EXT;if(n===po)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===sr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===mo)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===gs?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var $g=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Zg=`
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

}`,xc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new Ws(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new ce({vertexShader:$g,fragmentShader:Zg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Ht(new Nn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},yc=class extends Pn{constructor(t,e){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,d=null,u=null,f=null,p=null,y=typeof XRWebGLBinding<"u",x=new xc,m={},b=e.getContextAttributes(),T=null,v=null,w=[],A=[],E=new Lt,g=null,M=new De;M.viewport=new le;let R=new De;R.viewport=new le;let I=[M,R],P=new Aa,N=null,k=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let it=w[K];return it===void 0&&(it=new hs,w[K]=it),it.getTargetRaySpace()},this.getControllerGrip=function(K){let it=w[K];return it===void 0&&(it=new hs,w[K]=it),it.getGripSpace()},this.getHand=function(K){let it=w[K];return it===void 0&&(it=new hs,w[K]=it),it.getHandSpace()};function F(K){let it=A.indexOf(K.inputSource);if(it===-1)return;let tt=w[it];tt!==void 0&&(tt.update(K.inputSource,K.frame,c||a),tt.dispatchEvent({type:K.type,data:K.inputSource}))}function H(){s.removeEventListener("select",F),s.removeEventListener("selectstart",F),s.removeEventListener("selectend",F),s.removeEventListener("squeeze",F),s.removeEventListener("squeezestart",F),s.removeEventListener("squeezeend",F),s.removeEventListener("end",H),s.removeEventListener("inputsourceschange",W);for(let K=0;K<w.length;K++){let it=A[K];it!==null&&(A[K]=null,w[K].disconnect(it))}N=null,k=null,x.reset();for(let K in m)delete m[K];t.setRenderTarget(T),f=null,u=null,d=null,s=null,v=null,Zt.stop(),n.isPresenting=!1,t.setPixelRatio(g),t.setSize(E.width,E.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,n.isPresenting===!0&&Ct("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){o=K,n.isPresenting===!0&&Ct("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d===null&&y&&(d=new XRWebGLBinding(s,e)),d},this.getFrame=function(){return p},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(T=t.getRenderTarget(),s.addEventListener("select",F),s.addEventListener("selectstart",F),s.addEventListener("selectend",F),s.addEventListener("squeeze",F),s.addEventListener("squeezestart",F),s.addEventListener("squeezeend",F),s.addEventListener("end",H),s.addEventListener("inputsourceschange",W),b.xrCompatible!==!0&&await e.makeXRCompatible(),g=t.getPixelRatio(),t.getSize(E),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let tt=null,Pt=null,Dt=null;b.depth&&(Dt=b.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,tt=b.stencil?_i:In,Pt=b.stencil?gs:Mn);let At={colorFormat:e.RGBA8,depthFormat:Dt,scaleFactor:r};d=this.getBinding(),u=d.createProjectionLayer(At),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),v=new He(u.textureWidth,u.textureHeight,{format:ln,type:Ye,depthTexture:new jn(u.textureWidth,u.textureHeight,Pt,void 0,void 0,void 0,void 0,void 0,void 0,tt),stencilBuffer:b.stencil,colorSpace:t.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1})}else{let tt={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,e,tt),s.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),v=new He(f.framebufferWidth,f.framebufferHeight,{format:ln,type:Ye,colorSpace:t.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Zt.setContext(s),Zt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function W(K){for(let it=0;it<K.removed.length;it++){let tt=K.removed[it],Pt=A.indexOf(tt);Pt>=0&&(A[Pt]=null,w[Pt].disconnect(tt))}for(let it=0;it<K.added.length;it++){let tt=K.added[it],Pt=A.indexOf(tt);if(Pt===-1){for(let At=0;At<w.length;At++)if(At>=A.length){A.push(tt),Pt=At;break}else if(A[At]===null){A[At]=tt,Pt=At;break}if(Pt===-1)break}let Dt=w[Pt];Dt&&Dt.connect(tt)}}let Z=new U,Q=new U;function rt(K,it,tt){Z.setFromMatrixPosition(it.matrixWorld),Q.setFromMatrixPosition(tt.matrixWorld);let Pt=Z.distanceTo(Q),Dt=it.projectionMatrix.elements,At=tt.projectionMatrix.elements,me=Dt[14]/(Dt[10]-1),zt=Dt[14]/(Dt[10]+1),ne=(Dt[9]+1)/Dt[5],Jt=(Dt[9]-1)/Dt[5],Xt=(Dt[8]-1)/Dt[0],_e=(At[8]+1)/At[0],be=me*Xt,we=me*_e,Le=Pt/(-Xt+_e),de=Le*-Xt;if(it.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(de),K.translateZ(Le),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),Dt[10]===-1)K.projectionMatrix.copy(it.projectionMatrix),K.projectionMatrixInverse.copy(it.projectionMatrixInverse);else{let ve=me+Le,D=zt+Le,We=be-de,jt=we+(Pt-de),C=ne*zt/D*ve,_=Jt*zt/D*ve;K.projectionMatrix.makePerspective(We,jt,C,_,ve,D),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function dt(K,it){it===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(it.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let it=K.near,tt=K.far;x.texture!==null&&(x.depthNear>0&&(it=x.depthNear),x.depthFar>0&&(tt=x.depthFar)),P.near=R.near=M.near=it,P.far=R.far=M.far=tt,(N!==P.near||k!==P.far)&&(s.updateRenderState({depthNear:P.near,depthFar:P.far}),N=P.near,k=P.far),P.layers.mask=K.layers.mask|6,M.layers.mask=P.layers.mask&-5,R.layers.mask=P.layers.mask&-3;let Pt=K.parent,Dt=P.cameras;dt(P,Pt);for(let At=0;At<Dt.length;At++)dt(Dt[At],Pt);Dt.length===2?rt(P,M,R):P.projectionMatrix.copy(M.projectionMatrix),xt(K,P,Pt)};function xt(K,it,tt){tt===null?K.matrix.copy(it.matrixWorld):(K.matrix.copy(tt.matrixWorld),K.matrix.invert(),K.matrix.multiply(it.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(it.projectionMatrix),K.projectionMatrixInverse.copy(it.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=ra*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return P},this.getFoveation=function(){if(!(u===null&&f===null))return l},this.setFoveation=function(K){l=K,u!==null&&(u.fixedFoveation=K),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=K)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(P)},this.getCameraTexture=function(K){return m[K]};let $t=null;function ue(K,it){if(h=it.getViewerPose(c||a),p=it,h!==null){let tt=h.views;f!==null&&(t.setRenderTargetFramebuffer(v,f.framebuffer),t.setRenderTarget(v));let Pt=!1;tt.length!==P.cameras.length&&(P.cameras.length=0,Pt=!0);for(let zt=0;zt<tt.length;zt++){let ne=tt[zt],Jt=null;if(f!==null)Jt=f.getViewport(ne);else{let _e=d.getViewSubImage(u,ne);Jt=_e.viewport,zt===0&&(t.setRenderTargetTextures(v,_e.colorTexture,_e.depthStencilTexture),t.setRenderTarget(v))}let Xt=I[zt];Xt===void 0&&(Xt=new De,Xt.layers.enable(zt),Xt.viewport=new le,I[zt]=Xt),Xt.matrix.fromArray(ne.transform.matrix),Xt.matrix.decompose(Xt.position,Xt.quaternion,Xt.scale),Xt.projectionMatrix.fromArray(ne.projectionMatrix),Xt.projectionMatrixInverse.copy(Xt.projectionMatrix).invert(),Xt.viewport.set(Jt.x,Jt.y,Jt.width,Jt.height),zt===0&&(P.matrix.copy(Xt.matrix),P.matrix.decompose(P.position,P.quaternion,P.scale)),Pt===!0&&P.cameras.push(Xt)}let Dt=s.enabledFeatures;if(Dt&&Dt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&y){d=n.getBinding();let zt=d.getDepthInformation(tt[0]);zt&&zt.isValid&&zt.texture&&x.init(zt,s.renderState)}if(Dt&&Dt.includes("camera-access")&&y){t.state.unbindTexture(),d=n.getBinding();for(let zt=0;zt<tt.length;zt++){let ne=tt[zt].camera;if(ne){let Jt=m[ne];Jt||(Jt=new Ws,m[ne]=Jt);let Xt=d.getCameraImage(ne);Jt.sourceTexture=Xt}}}}for(let tt=0;tt<w.length;tt++){let Pt=A[tt],Dt=w[tt];Pt!==null&&Dt!==void 0&&Dt.update(Pt,it,c||a)}$t&&$t(K,it),it.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:it}),p=null}let Zt=new Uu;Zt.setAnimationLoop(ue),this.setAnimationLoop=function(K){$t=K},this.dispose=function(){}}},Jg=new Qt,Vu=new Nt;Vu.set(-1,0,0,0,1,0,0,0,1);function Kg(i,t){function e(x,m){x.matrixAutoUpdate===!0&&x.updateMatrix(),m.value.copy(x.matrix)}function n(x,m){m.color.getRGB(x.fogColor.value,Zl(i)),m.isFog?(x.fogNear.value=m.near,x.fogFar.value=m.far):m.isFogExp2&&(x.fogDensity.value=m.density)}function s(x,m,b,T,v){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?r(x,m):m.isMeshLambertMaterial?(r(x,m),m.envMap&&(x.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(r(x,m),d(x,m)):m.isMeshPhongMaterial?(r(x,m),h(x,m),m.envMap&&(x.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(r(x,m),u(x,m),m.isMeshPhysicalMaterial&&f(x,m,v)):m.isMeshMatcapMaterial?(r(x,m),p(x,m)):m.isMeshDepthMaterial?r(x,m):m.isMeshDistanceMaterial?(r(x,m),y(x,m)):m.isMeshNormalMaterial?r(x,m):m.isLineBasicMaterial?(a(x,m),m.isLineDashedMaterial&&o(x,m)):m.isPointsMaterial?l(x,m,b,T):m.isSpriteMaterial?c(x,m):m.isShadowMaterial?(x.color.value.copy(m.color),x.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(x,m){x.opacity.value=m.opacity,m.color&&x.diffuse.value.copy(m.color),m.emissive&&x.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(x.map.value=m.map,e(m.map,x.mapTransform)),m.alphaMap&&(x.alphaMap.value=m.alphaMap,e(m.alphaMap,x.alphaMapTransform)),m.bumpMap&&(x.bumpMap.value=m.bumpMap,e(m.bumpMap,x.bumpMapTransform),x.bumpScale.value=m.bumpScale,m.side===Ge&&(x.bumpScale.value*=-1)),m.normalMap&&(x.normalMap.value=m.normalMap,e(m.normalMap,x.normalMapTransform),x.normalScale.value.copy(m.normalScale),m.side===Ge&&x.normalScale.value.negate()),m.displacementMap&&(x.displacementMap.value=m.displacementMap,e(m.displacementMap,x.displacementMapTransform),x.displacementScale.value=m.displacementScale,x.displacementBias.value=m.displacementBias),m.emissiveMap&&(x.emissiveMap.value=m.emissiveMap,e(m.emissiveMap,x.emissiveMapTransform)),m.specularMap&&(x.specularMap.value=m.specularMap,e(m.specularMap,x.specularMapTransform)),m.alphaTest>0&&(x.alphaTest.value=m.alphaTest);let b=t.get(m),T=b.envMap,v=b.envMapRotation;T&&(x.envMap.value=T,x.envMapRotation.value.setFromMatrix4(Jg.makeRotationFromEuler(v)).transpose(),T.isCubeTexture&&T.isRenderTargetTexture===!1&&x.envMapRotation.value.premultiply(Vu),x.reflectivity.value=m.reflectivity,x.ior.value=m.ior,x.refractionRatio.value=m.refractionRatio),m.lightMap&&(x.lightMap.value=m.lightMap,x.lightMapIntensity.value=m.lightMapIntensity,e(m.lightMap,x.lightMapTransform)),m.aoMap&&(x.aoMap.value=m.aoMap,x.aoMapIntensity.value=m.aoMapIntensity,e(m.aoMap,x.aoMapTransform))}function a(x,m){x.diffuse.value.copy(m.color),x.opacity.value=m.opacity,m.map&&(x.map.value=m.map,e(m.map,x.mapTransform))}function o(x,m){x.dashSize.value=m.dashSize,x.totalSize.value=m.dashSize+m.gapSize,x.scale.value=m.scale}function l(x,m,b,T){x.diffuse.value.copy(m.color),x.opacity.value=m.opacity,x.size.value=m.size*b,x.scale.value=T*.5,m.map&&(x.map.value=m.map,e(m.map,x.uvTransform)),m.alphaMap&&(x.alphaMap.value=m.alphaMap,e(m.alphaMap,x.alphaMapTransform)),m.alphaTest>0&&(x.alphaTest.value=m.alphaTest)}function c(x,m){x.diffuse.value.copy(m.color),x.opacity.value=m.opacity,x.rotation.value=m.rotation,m.map&&(x.map.value=m.map,e(m.map,x.mapTransform)),m.alphaMap&&(x.alphaMap.value=m.alphaMap,e(m.alphaMap,x.alphaMapTransform)),m.alphaTest>0&&(x.alphaTest.value=m.alphaTest)}function h(x,m){x.specular.value.copy(m.specular),x.shininess.value=Math.max(m.shininess,1e-4)}function d(x,m){m.gradientMap&&(x.gradientMap.value=m.gradientMap)}function u(x,m){x.metalness.value=m.metalness,m.metalnessMap&&(x.metalnessMap.value=m.metalnessMap,e(m.metalnessMap,x.metalnessMapTransform)),x.roughness.value=m.roughness,m.roughnessMap&&(x.roughnessMap.value=m.roughnessMap,e(m.roughnessMap,x.roughnessMapTransform)),m.envMap&&(x.envMapIntensity.value=m.envMapIntensity)}function f(x,m,b){x.ior.value=m.ior,m.sheen>0&&(x.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),x.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(x.sheenColorMap.value=m.sheenColorMap,e(m.sheenColorMap,x.sheenColorMapTransform)),m.sheenRoughnessMap&&(x.sheenRoughnessMap.value=m.sheenRoughnessMap,e(m.sheenRoughnessMap,x.sheenRoughnessMapTransform))),m.clearcoat>0&&(x.clearcoat.value=m.clearcoat,x.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(x.clearcoatMap.value=m.clearcoatMap,e(m.clearcoatMap,x.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(x.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,e(m.clearcoatRoughnessMap,x.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(x.clearcoatNormalMap.value=m.clearcoatNormalMap,e(m.clearcoatNormalMap,x.clearcoatNormalMapTransform),x.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Ge&&x.clearcoatNormalScale.value.negate())),m.dispersion>0&&(x.dispersion.value=m.dispersion),m.iridescence>0&&(x.iridescence.value=m.iridescence,x.iridescenceIOR.value=m.iridescenceIOR,x.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],x.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(x.iridescenceMap.value=m.iridescenceMap,e(m.iridescenceMap,x.iridescenceMapTransform)),m.iridescenceThicknessMap&&(x.iridescenceThicknessMap.value=m.iridescenceThicknessMap,e(m.iridescenceThicknessMap,x.iridescenceThicknessMapTransform))),m.transmission>0&&(x.transmission.value=m.transmission,x.transmissionSamplerMap.value=b.texture,x.transmissionSamplerSize.value.set(b.width,b.height),m.transmissionMap&&(x.transmissionMap.value=m.transmissionMap,e(m.transmissionMap,x.transmissionMapTransform)),x.thickness.value=m.thickness,m.thicknessMap&&(x.thicknessMap.value=m.thicknessMap,e(m.thicknessMap,x.thicknessMapTransform)),x.attenuationDistance.value=m.attenuationDistance,x.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(x.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(x.anisotropyMap.value=m.anisotropyMap,e(m.anisotropyMap,x.anisotropyMapTransform))),x.specularIntensity.value=m.specularIntensity,x.specularColor.value.copy(m.specularColor),m.specularColorMap&&(x.specularColorMap.value=m.specularColorMap,e(m.specularColorMap,x.specularColorMapTransform)),m.specularIntensityMap&&(x.specularIntensityMap.value=m.specularIntensityMap,e(m.specularIntensityMap,x.specularIntensityMapTransform))}function p(x,m){m.matcap&&(x.matcap.value=m.matcap)}function y(x,m){let b=t.get(m).light;x.referencePosition.value.setFromMatrixPosition(b.matrixWorld),x.nearDistance.value=b.shadow.camera.near,x.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function jg(i,t,e,n){let s={},r={},a=[],o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,w){let A=w.program;n.uniformBlockBinding(v,A)}function c(v,w){let A=s[v.id];A===void 0&&(x(v),A=h(v),s[v.id]=A,v.addEventListener("dispose",b));let E=w.program;n.updateUBOMapping(v,E);let g=t.render.frame;r[v.id]!==g&&(u(v),r[v.id]=g)}function h(v){let w=d();v.__bindingPointIndex=w;let A=i.createBuffer(),E=v.__size,g=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,A),i.bufferData(i.UNIFORM_BUFFER,E,g),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,w,A),A}function d(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return It("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(v){let w=s[v.id],A=v.uniforms,E=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let g=0,M=A.length;g<M;g++){let R=A[g];if(Array.isArray(R))for(let I=0,P=R.length;I<P;I++)f(R[I],g,I,E);else f(R,g,0,E)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(v,w,A,E){if(y(v,w,A,E)===!0){let g=v.__offset,M=v.value;if(Array.isArray(M)){let R=0;for(let I=0;I<M.length;I++){let P=M[I],N=m(P);p(P,v.__data,R),typeof P!="number"&&typeof P!="boolean"&&!P.isMatrix3&&!ArrayBuffer.isView(P)&&(R+=N.storage/Float32Array.BYTES_PER_ELEMENT)}}else p(M,v.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,g,v.__data)}}function p(v,w,A){typeof v=="number"||typeof v=="boolean"?w[0]=v:v.isMatrix3?(w[0]=v.elements[0],w[1]=v.elements[1],w[2]=v.elements[2],w[3]=0,w[4]=v.elements[3],w[5]=v.elements[4],w[6]=v.elements[5],w[7]=0,w[8]=v.elements[6],w[9]=v.elements[7],w[10]=v.elements[8],w[11]=0):ArrayBuffer.isView(v)?w.set(new v.constructor(v.buffer,v.byteOffset,w.length)):v.toArray(w,A)}function y(v,w,A,E){let g=v.value,M=w+"_"+A;if(E[M]===void 0)return typeof g=="number"||typeof g=="boolean"?E[M]=g:ArrayBuffer.isView(g)?E[M]=g.slice():E[M]=g.clone(),!0;{let R=E[M];if(typeof g=="number"||typeof g=="boolean"){if(R!==g)return E[M]=g,!0}else{if(ArrayBuffer.isView(g))return!0;if(R.equals(g)===!1)return R.copy(g),!0}}return!1}function x(v){let w=v.uniforms,A=0,E=16;for(let M=0,R=w.length;M<R;M++){let I=Array.isArray(w[M])?w[M]:[w[M]];for(let P=0,N=I.length;P<N;P++){let k=I[P],F=Array.isArray(k.value)?k.value:[k.value];for(let H=0,W=F.length;H<W;H++){let Z=F[H],Q=m(Z),rt=A%E,dt=rt%Q.boundary,xt=rt+dt;A+=dt,xt!==0&&E-xt<Q.storage&&(A+=E-xt),k.__data=new Float32Array(Q.storage/Float32Array.BYTES_PER_ELEMENT),k.__offset=A,A+=Q.storage}}}let g=A%E;return g>0&&(A+=E-g),v.__size=A,v.__cache={},this}function m(v){let w={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(w.boundary=4,w.storage=4):v.isVector2?(w.boundary=8,w.storage=8):v.isVector3||v.isColor?(w.boundary=16,w.storage=12):v.isVector4?(w.boundary=16,w.storage=16):v.isMatrix3?(w.boundary=48,w.storage=48):v.isMatrix4?(w.boundary=64,w.storage=64):v.isTexture?Ct("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(w.boundary=16,w.storage=v.byteLength):Ct("WebGLRenderer: Unsupported uniform value type.",v),w}function b(v){let w=v.target;w.removeEventListener("dispose",b);let A=a.indexOf(w.__bindingPointIndex);a.splice(A,1),i.deleteBuffer(s[w.id]),delete s[w.id],delete r[w.id]}function T(){for(let v in s)i.deleteBuffer(s[v]);a=[],s={},r={}}return{bind:l,update:c,dispose:T}}var Qg=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Bn=null;function tx(){return Bn===null&&(Bn=new zs(Qg,16,16,vi,On),Bn.name="DFG_LUT",Bn.minFilter=Ue,Bn.magFilter=Ue,Bn.wrapS=Cn,Bn.wrapT=Cn,Bn.generateMipmaps=!1,Bn.needsUpdate=!0),Bn}var So=class{constructor(t={}){let{canvas:e=au(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:f=Ye}=t;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=a;let y=f,x=new Set([Ba,Oa,Fa]),m=new Set([Ye,Mn,ms,gs,Na,Da]),b=new Uint32Array(4),T=new Int32Array(4),v=new U,w=null,A=null,E=[],g=[],M=null;this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=vn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let R=this,I=!1,P=null,N=null,k=null,F=null;this._outputColorSpace=Ne;let H=0,W=0,Z=null,Q=-1,rt=null,dt=new le,xt=new le,$t=null,ue=new Tt(0),Zt=0,K=e.width,it=e.height,tt=1,Pt=null,Dt=null,At=new le(0,0,K,it),me=new le(0,0,K,it),zt=!1,ne=new us,Jt=!1,Xt=!1,_e=new Qt,be=new U,we=new le,Le={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},de=!1;function ve(){return Z===null?tt:1}let D=n;function We(S,O){return e.getContext(S,O)}try{let S={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${"185"}`),e.addEventListener("webglcontextlost",fe,!1),e.addEventListener("webglcontextrestored",re,!1),e.addEventListener("webglcontextcreationerror",En,!1),D===null){let O="webgl2";if(D=We(O,S),D===null)throw We(O)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}}catch(S){throw It("WebGLRenderer: "+S.message),S}let jt,C,_,B,G,q,et,st,Y,J,at,bt,ct,ot,wt,Rt,Ut,L,nt,$,lt,pt,j;function vt(){jt=new o0(D),jt.init(),lt=new Yg(D,jt),C=new Qm(D,jt,t,lt),_=new Xg(D,jt),C.reversedDepthBuffer&&u&&_.buffers.depth.setReversed(!0),N=D.createFramebuffer(),k=D.createFramebuffer(),F=D.createFramebuffer(),B=new h0(D),G=new Pg,q=new qg(D,jt,_,G,C,lt,B),et=new a0(R),st=new pf(D),pt=new Km(D,st),Y=new l0(D,st,B,pt),J=new d0(D,Y,st,pt,B),L=new u0(D,C,q),wt=new t0(G),at=new Ig(R,et,jt,C,pt,wt),bt=new Kg(R,G),ct=new Ng,ot=new kg(jt),Ut=new Jm(R,et,_,J,p,l),Rt=new Wg(R,J,C),j=new jg(D,B,C,_),nt=new jm(D,jt,B),$=new c0(D,jt,B),B.programs=at.programs,R.capabilities=C,R.extensions=jt,R.properties=G,R.renderLists=ct,R.shadowMap=Rt,R.state=_,R.info=B}vt(),y!==Ye&&(M=new p0(y,e.width,e.height,o,s,r));let yt=new yc(R,D);this.xr=yt,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){let S=jt.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){let S=jt.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return tt},this.setPixelRatio=function(S){S!==void 0&&(tt=S,this.setSize(K,it,!1))},this.getSize=function(S){return S.set(K,it)},this.setSize=function(S,O,X=!0){if(yt.isPresenting){Ct("WebGLRenderer: Can't change size while VR device is presenting.");return}K=S,it=O,e.width=Math.floor(S*tt),e.height=Math.floor(O*tt),X===!0&&(e.style.width=S+"px",e.style.height=O+"px"),M!==null&&M.setSize(e.width,e.height),this.setViewport(0,0,S,O)},this.getDrawingBufferSize=function(S){return S.set(K*tt,it*tt).floor()},this.setDrawingBufferSize=function(S,O,X){K=S,it=O,tt=X,e.width=Math.floor(S*X),e.height=Math.floor(O*X),this.setViewport(0,0,S,O)},this.setEffects=function(S){if(y===Ye){It("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(S){for(let O=0;O<S.length;O++)if(S[O].isOutputPass===!0){Ct("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}M.setEffects(S||[])},this.getCurrentViewport=function(S){return S.copy(dt)},this.getViewport=function(S){return S.copy(At)},this.setViewport=function(S,O,X,z){S.isVector4?At.set(S.x,S.y,S.z,S.w):At.set(S,O,X,z),_.viewport(dt.copy(At).multiplyScalar(tt).round())},this.getScissor=function(S){return S.copy(me)},this.setScissor=function(S,O,X,z){S.isVector4?me.set(S.x,S.y,S.z,S.w):me.set(S,O,X,z),_.scissor(xt.copy(me).multiplyScalar(tt).round())},this.getScissorTest=function(){return zt},this.setScissorTest=function(S){_.setScissorTest(zt=S)},this.setOpaqueSort=function(S){Pt=S},this.setTransparentSort=function(S){Dt=S},this.getClearColor=function(S){return S.copy(Ut.getClearColor())},this.setClearColor=function(){Ut.setClearColor(...arguments)},this.getClearAlpha=function(){return Ut.getClearAlpha()},this.setClearAlpha=function(){Ut.setClearAlpha(...arguments)},this.clear=function(S=!0,O=!0,X=!0){let z=0;if(S){let V=!1;if(Z!==null){let ft=Z.texture.format;V=x.has(ft)}if(V){let ft=Z.texture.type,gt=m.has(ft),ut=Ut.getClearColor(),_t=Ut.getClearAlpha(),St=ut.r,Ft=ut.g,Bt=ut.b;gt?(b[0]=St,b[1]=Ft,b[2]=Bt,b[3]=_t,D.clearBufferuiv(D.COLOR,0,b)):(T[0]=St,T[1]=Ft,T[2]=Bt,T[3]=_t,D.clearBufferiv(D.COLOR,0,T))}else z|=D.COLOR_BUFFER_BIT}O&&(z|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),X&&(z|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),z!==0&&D.clear(z)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(S){S.setRenderer(this),P=S},this.dispose=function(){e.removeEventListener("webglcontextlost",fe,!1),e.removeEventListener("webglcontextrestored",re,!1),e.removeEventListener("webglcontextcreationerror",En,!1),Ut.dispose(),ct.dispose(),ot.dispose(),G.dispose(),et.dispose(),J.dispose(),pt.dispose(),j.dispose(),at.dispose(),yt.dispose(),yt.removeEventListener("sessionstart",Tc),yt.removeEventListener("sessionend",wc),Ei.stop()};function fe(S){S.preventDefault(),$l("WebGLRenderer: Context Lost."),I=!0}function re(){$l("WebGLRenderer: Context Restored."),I=!1;let S=B.autoReset,O=Rt.enabled,X=Rt.autoUpdate,z=Rt.needsUpdate,V=Rt.type;vt(),B.autoReset=S,Rt.enabled=O,Rt.autoUpdate=X,Rt.needsUpdate=z,Rt.type=V}function En(S){It("WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function Tn(S){let O=S.target;O.removeEventListener("dispose",Tn),rd(O)}function rd(S){ad(S),G.remove(S)}function ad(S){let O=G.get(S).programs;O!==void 0&&(O.forEach(function(X){at.releaseProgram(X)}),S.isShaderMaterial&&at.releaseShaderCache(S))}this.renderBufferDirect=function(S,O,X,z,V,ft){O===null&&(O=Le);let gt=V.isMesh&&V.matrixWorld.determinantAffine()<0,ut=cd(S,O,X,z,V);_.setMaterial(z,gt);let _t=X.index,St=1;if(z.wireframe===!0){if(_t=Y.getWireframeAttribute(X),_t===void 0)return;St=2}let Ft=X.drawRange,Bt=X.attributes.position,Et=Ft.start*St,te=(Ft.start+Ft.count)*St;ft!==null&&(Et=Math.max(Et,ft.start*St),te=Math.min(te,(ft.start+ft.count)*St)),_t!==null?(Et=Math.max(Et,0),te=Math.min(te,_t.count)):Bt!=null&&(Et=Math.max(Et,0),te=Math.min(te,Bt.count));let ge=te-Et;if(ge<0||ge===1/0)return;pt.setup(V,z,ut,X,_t);let pe,ie=nt;if(_t!==null&&(pe=st.get(_t),ie=$,ie.setIndex(pe)),V.isMesh)z.wireframe===!0?(_.setLineWidth(z.wireframeLinewidth*ve()),ie.setMode(D.LINES)):ie.setMode(D.TRIANGLES);else if(V.isLine){let Oe=z.linewidth;Oe===void 0&&(Oe=1),_.setLineWidth(Oe*ve()),V.isLineSegments?ie.setMode(D.LINES):V.isLineLoop?ie.setMode(D.LINE_LOOP):ie.setMode(D.LINE_STRIP)}else V.isPoints?ie.setMode(D.POINTS):V.isSprite&&ie.setMode(D.TRIANGLES);if(V.isBatchedMesh)if(jt.get("WEBGL_multi_draw"))ie.renderMultiDraw(V._multiDrawStarts,V._multiDrawCounts,V._multiDrawCount);else{let Oe=V._multiDrawStarts,mt=V._multiDrawCounts,$e=V._multiDrawCount,qt=_t?st.get(_t).bytesPerElement:1,en=G.get(z).currentProgram.getUniforms();for(let wn=0;wn<$e;wn++)en.setValue(D,"_gl_DrawID",wn),ie.render(Oe[wn]/qt,mt[wn])}else if(V.isInstancedMesh)ie.renderInstances(Et,ge,V.count);else if(X.isInstancedBufferGeometry){let Oe=X._maxInstanceCount!==void 0?X._maxInstanceCount:1/0,mt=Math.min(X.instanceCount,Oe);ie.renderInstances(Et,ge,mt)}else ie.render(Et,ge)};function Ec(S,O,X){S.transparent===!0&&S.side===an&&S.forceSinglePass===!1?(S.side=Ge,S.needsUpdate=!0,mr(S,O,X),S.side=Zn,S.needsUpdate=!0,mr(S,O,X),S.side=an):mr(S,O,X)}this.compile=function(S,O,X=null){X===null&&(X=S),A=ot.get(X),A.init(O),g.push(A),X.traverseVisible(function(V){V.isLight&&V.layers.test(O.layers)&&(A.pushLight(V),V.castShadow&&A.pushShadow(V))}),S!==X&&S.traverseVisible(function(V){V.isLight&&V.layers.test(O.layers)&&(A.pushLight(V),V.castShadow&&A.pushShadow(V))}),A.setupLights();let z=new Set;return S.traverse(function(V){if(!(V.isMesh||V.isPoints||V.isLine||V.isSprite))return;let ft=V.material;if(ft)if(Array.isArray(ft))for(let gt=0;gt<ft.length;gt++){let ut=ft[gt];Ec(ut,X,V),z.add(ut)}else Ec(ft,X,V),z.add(ft)}),A=g.pop(),z},this.compileAsync=function(S,O,X=null){let z=this.compile(S,O,X);return new Promise(V=>{function ft(){if(z.forEach(function(gt){G.get(gt).currentProgram.isReady()&&z.delete(gt)}),z.size===0){V(S);return}setTimeout(ft,10)}jt.get("KHR_parallel_shader_compile")!==null?ft():setTimeout(ft,10)})};let Oo=null;function od(S){Oo&&Oo(S)}function Tc(){Ei.stop()}function wc(){Ei.start()}let Ei=new Uu;Ei.setAnimationLoop(od),typeof self<"u"&&Ei.setContext(self),this.setAnimationLoop=function(S){Oo=S,yt.setAnimationLoop(S),S===null?Ei.stop():Ei.start()},yt.addEventListener("sessionstart",Tc),yt.addEventListener("sessionend",wc),this.render=function(S,O){if(O!==void 0&&O.isCamera!==!0){It("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(I===!0)return;P!==null&&P.renderStart(S,O);let X=yt.enabled===!0&&yt.isPresenting===!0,z=M!==null&&(Z===null||X)&&M.begin(R,Z);if(S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),O.parent===null&&O.matrixWorldAutoUpdate===!0&&O.updateMatrixWorld(),yt.enabled===!0&&yt.isPresenting===!0&&(M===null||M.isCompositing()===!1)&&(yt.cameraAutoUpdate===!0&&yt.updateCamera(O),O=yt.getCamera()),S.isScene===!0&&S.onBeforeRender(R,S,O,Z),A=ot.get(S,g.length),A.init(O),A.state.textureUnits=q.getTextureUnits(),g.push(A),_e.multiplyMatrices(O.projectionMatrix,O.matrixWorldInverse),ne.setFromProjectionMatrix(_e,xn,O.reversedDepth),Xt=this.localClippingEnabled,Jt=wt.init(this.clippingPlanes,Xt),w=ct.get(S,E.length),w.init(),E.push(w),yt.enabled===!0&&yt.isPresenting===!0){let gt=R.xr.getDepthSensingMesh();gt!==null&&Bo(gt,O,-1/0,R.sortObjects)}Bo(S,O,0,R.sortObjects),w.finish(),R.sortObjects===!0&&w.sort(Pt,Dt,O.reversedDepth),de=yt.enabled===!1||yt.isPresenting===!1||yt.hasDepthSensing()===!1,de&&Ut.addToRenderList(w,S),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),Jt===!0&&wt.beginShadows();let V=A.state.shadowsArray;if(Rt.render(V,S,O),Jt===!0&&wt.endShadows(),(z&&M.hasRenderPass())===!1){let gt=w.opaque,ut=w.transmissive;if(A.setupLights(),O.isArrayCamera){let _t=O.cameras;if(ut.length>0)for(let St=0,Ft=_t.length;St<Ft;St++){let Bt=_t[St];Rc(gt,ut,S,Bt)}de&&Ut.render(S);for(let St=0,Ft=_t.length;St<Ft;St++){let Bt=_t[St];Ac(w,S,Bt,Bt.viewport)}}else ut.length>0&&Rc(gt,ut,S,O),de&&Ut.render(S),Ac(w,S,O)}Z!==null&&W===0&&(q.updateMultisampleRenderTarget(Z),q.updateRenderTargetMipmap(Z)),z&&M.end(R),S.isScene===!0&&S.onAfterRender(R,S,O),pt.resetDefaultState(),Q=-1,rt=null,g.pop(),g.length>0?(A=g[g.length-1],q.setTextureUnits(A.state.textureUnits),Jt===!0&&wt.setGlobalState(R.clippingPlanes,A.state.camera)):A=null,E.pop(),E.length>0?w=E[E.length-1]:w=null,P!==null&&P.renderEnd()};function Bo(S,O,X,z){if(S.visible===!1)return;if(S.layers.test(O.layers)){if(S.isGroup)X=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(O);else if(S.isLightProbeGrid)A.pushLightProbeGrid(S);else if(S.isLight)A.pushLight(S),S.castShadow&&A.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||ne.intersectsSprite(S)){z&&we.setFromMatrixPosition(S.matrixWorld).applyMatrix4(_e);let gt=J.update(S),ut=S.material;ut.visible&&w.push(S,gt,ut,X,we.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(!S.frustumCulled||ne.intersectsObject(S))){let gt=J.update(S),ut=S.material;if(z&&(S.boundingSphere!==void 0?(S.boundingSphere===null&&S.computeBoundingSphere(),we.copy(S.boundingSphere.center)):(gt.boundingSphere===null&&gt.computeBoundingSphere(),we.copy(gt.boundingSphere.center)),we.applyMatrix4(S.matrixWorld).applyMatrix4(_e)),Array.isArray(ut)){let _t=gt.groups;for(let St=0,Ft=_t.length;St<Ft;St++){let Bt=_t[St],Et=ut[Bt.materialIndex];Et&&Et.visible&&w.push(S,gt,Et,X,we.z,Bt)}}else ut.visible&&w.push(S,gt,ut,X,we.z,null)}}let ft=S.children;for(let gt=0,ut=ft.length;gt<ut;gt++)Bo(ft[gt],O,X,z)}function Ac(S,O,X,z){let{opaque:V,transmissive:ft,transparent:gt}=S;A.setupLightsView(X),Jt===!0&&wt.setGlobalState(R.clippingPlanes,X),z&&_.viewport(dt.copy(z)),V.length>0&&pr(V,O,X),ft.length>0&&pr(ft,O,X),gt.length>0&&pr(gt,O,X),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function Rc(S,O,X,z){if((X.isScene===!0?X.overrideMaterial:null)!==null)return;if(A.state.transmissionRenderTarget[z.id]===void 0){let Et=jt.has("EXT_color_buffer_half_float")||jt.has("EXT_color_buffer_float");A.state.transmissionRenderTarget[z.id]=new He(1,1,{generateMipmaps:!0,type:Et?On:Ye,minFilter:yi,samples:Math.max(4,C.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Vt.workingColorSpace})}let ft=A.state.transmissionRenderTarget[z.id],gt=z.viewport||dt;ft.setSize(gt.z*R.transmissionResolutionScale,gt.w*R.transmissionResolutionScale);let ut=R.getRenderTarget(),_t=R.getActiveCubeFace(),St=R.getActiveMipmapLevel();R.setRenderTarget(ft),R.getClearColor(ue),Zt=R.getClearAlpha(),Zt<1&&R.setClearColor(16777215,.5),R.clear(),de&&Ut.render(X);let Ft=R.toneMapping;R.toneMapping=vn;let Bt=z.viewport;if(z.viewport!==void 0&&(z.viewport=void 0),A.setupLightsView(z),Jt===!0&&wt.setGlobalState(R.clippingPlanes,z),pr(S,X,z),q.updateMultisampleRenderTarget(ft),q.updateRenderTargetMipmap(ft),jt.has("WEBGL_multisampled_render_to_texture")===!1){let Et=!1;for(let te=0,ge=O.length;te<ge;te++){let pe=O[te],{object:ie,geometry:Oe,material:mt,group:$e}=pe;if(mt.side===an&&ie.layers.test(z.layers)){let qt=mt.side;mt.side=Ge,mt.needsUpdate=!0,Cc(ie,X,z,Oe,mt,$e),mt.side=qt,mt.needsUpdate=!0,Et=!0}}Et===!0&&(q.updateMultisampleRenderTarget(ft),q.updateRenderTargetMipmap(ft))}R.setRenderTarget(ut,_t,St),R.setClearColor(ue,Zt),Bt!==void 0&&(z.viewport=Bt),R.toneMapping=Ft}function pr(S,O,X){let z=O.isScene===!0?O.overrideMaterial:null;for(let V=0,ft=S.length;V<ft;V++){let gt=S[V],{object:ut,geometry:_t,group:St}=gt,Ft=gt.material;Ft.allowOverride===!0&&z!==null&&(Ft=z),ut.layers.test(X.layers)&&Cc(ut,O,X,_t,Ft,St)}}function Cc(S,O,X,z,V,ft){S.onBeforeRender(R,O,X,z,V,ft),S.modelViewMatrix.multiplyMatrices(X.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),V.onBeforeRender(R,O,X,z,S,ft),V.transparent===!0&&V.side===an&&V.forceSinglePass===!1?(V.side=Ge,V.needsUpdate=!0,R.renderBufferDirect(X,O,z,V,S,ft),V.side=Zn,V.needsUpdate=!0,R.renderBufferDirect(X,O,z,V,S,ft),V.side=an):R.renderBufferDirect(X,O,z,V,S,ft),S.onAfterRender(R,O,X,z,V,ft)}function mr(S,O,X){O.isScene!==!0&&(O=Le);let z=G.get(S),V=A.state.lights,ft=A.state.shadowsArray,gt=V.state.version,ut=at.getParameters(S,V.state,ft,O,X,A.state.lightProbeGridArray),_t=at.getProgramCacheKey(ut),St=z.programs;z.environment=S.isMeshStandardMaterial||S.isMeshLambertMaterial||S.isMeshPhongMaterial?O.environment:null,z.fog=O.fog;let Ft=S.isMeshStandardMaterial||S.isMeshLambertMaterial&&!S.envMap||S.isMeshPhongMaterial&&!S.envMap;z.envMap=et.get(S.envMap||z.environment,Ft),z.envMapRotation=z.environment!==null&&S.envMap===null?O.environmentRotation:S.envMapRotation,St===void 0&&(S.addEventListener("dispose",Tn),St=new Map,z.programs=St);let Bt=St.get(_t);if(Bt!==void 0){if(z.currentProgram===Bt&&z.lightsStateVersion===gt)return Pc(S,ut),Bt}else ut.uniforms=at.getUniforms(S),P!==null&&S.isNodeMaterial&&P.build(S,X,ut),S.onBeforeCompile(ut,R),Bt=at.acquireProgram(ut,_t),St.set(_t,Bt),z.uniforms=ut.uniforms;let Et=z.uniforms;return(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Et.clippingPlanes=wt.uniform),Pc(S,ut),z.needsLights=ud(S),z.lightsStateVersion=gt,z.needsLights&&(Et.ambientLightColor.value=V.state.ambient,Et.lightProbe.value=V.state.probe,Et.directionalLights.value=V.state.directional,Et.directionalLightShadows.value=V.state.directionalShadow,Et.spotLights.value=V.state.spot,Et.spotLightShadows.value=V.state.spotShadow,Et.rectAreaLights.value=V.state.rectArea,Et.ltc_1.value=V.state.rectAreaLTC1,Et.ltc_2.value=V.state.rectAreaLTC2,Et.pointLights.value=V.state.point,Et.pointLightShadows.value=V.state.pointShadow,Et.hemisphereLights.value=V.state.hemi,Et.directionalShadowMatrix.value=V.state.directionalShadowMatrix,Et.spotLightMatrix.value=V.state.spotLightMatrix,Et.spotLightMap.value=V.state.spotLightMap,Et.pointShadowMatrix.value=V.state.pointShadowMatrix),z.lightProbeGrid=A.state.lightProbeGridArray.length>0,z.currentProgram=Bt,z.uniformsList=null,Bt}function Ic(S){if(S.uniformsList===null){let O=S.currentProgram.getUniforms();S.uniformsList=ys.seqWithValue(O.seq,S.uniforms)}return S.uniformsList}function Pc(S,O){let X=G.get(S);X.outputColorSpace=O.outputColorSpace,X.batching=O.batching,X.batchingColor=O.batchingColor,X.instancing=O.instancing,X.instancingColor=O.instancingColor,X.instancingMorph=O.instancingMorph,X.skinning=O.skinning,X.morphTargets=O.morphTargets,X.morphNormals=O.morphNormals,X.morphColors=O.morphColors,X.morphTargetsCount=O.morphTargetsCount,X.numClippingPlanes=O.numClippingPlanes,X.numIntersection=O.numClipIntersection,X.vertexAlphas=O.vertexAlphas,X.vertexTangents=O.vertexTangents,X.toneMapping=O.toneMapping}function ld(S,O){if(S.length===0)return null;if(S.length===1)return S[0].texture!==null?S[0]:null;v.setFromMatrixPosition(O.matrixWorld);for(let X=0,z=S.length;X<z;X++){let V=S[X];if(V.texture!==null&&V.boundingBox.containsPoint(v))return V}return null}function cd(S,O,X,z,V){O.isScene!==!0&&(O=Le),q.resetTextureUnits();let ft=O.fog,gt=z.isMeshStandardMaterial||z.isMeshLambertMaterial||z.isMeshPhongMaterial?O.environment:null,ut=Z===null?R.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:Vt.workingColorSpace,_t=z.isMeshStandardMaterial||z.isMeshLambertMaterial&&!z.envMap||z.isMeshPhongMaterial&&!z.envMap,St=et.get(z.envMap||gt,_t),Ft=z.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,Bt=!!X.attributes.tangent&&(!!z.normalMap||z.anisotropy>0),Et=!!X.morphAttributes.position,te=!!X.morphAttributes.normal,ge=!!X.morphAttributes.color,pe=vn;z.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(pe=R.toneMapping);let ie=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,Oe=ie!==void 0?ie.length:0,mt=G.get(z),$e=A.state.lights;if(Jt===!0&&(Xt===!0||S!==rt)){let ae=S===rt&&z.id===Q;wt.setState(z,S,ae)}let qt=!1;z.version===mt.__version?(mt.needsLights&&mt.lightsStateVersion!==$e.state.version||mt.outputColorSpace!==ut||V.isBatchedMesh&&mt.batching===!1||!V.isBatchedMesh&&mt.batching===!0||V.isBatchedMesh&&mt.batchingColor===!0&&V.colorTexture===null||V.isBatchedMesh&&mt.batchingColor===!1&&V.colorTexture!==null||V.isInstancedMesh&&mt.instancing===!1||!V.isInstancedMesh&&mt.instancing===!0||V.isSkinnedMesh&&mt.skinning===!1||!V.isSkinnedMesh&&mt.skinning===!0||V.isInstancedMesh&&mt.instancingColor===!0&&V.instanceColor===null||V.isInstancedMesh&&mt.instancingColor===!1&&V.instanceColor!==null||V.isInstancedMesh&&mt.instancingMorph===!0&&V.morphTexture===null||V.isInstancedMesh&&mt.instancingMorph===!1&&V.morphTexture!==null||mt.envMap!==St||z.fog===!0&&mt.fog!==ft||mt.numClippingPlanes!==void 0&&(mt.numClippingPlanes!==wt.numPlanes||mt.numIntersection!==wt.numIntersection)||mt.vertexAlphas!==Ft||mt.vertexTangents!==Bt||mt.morphTargets!==Et||mt.morphNormals!==te||mt.morphColors!==ge||mt.toneMapping!==pe||mt.morphTargetsCount!==Oe||!!mt.lightProbeGrid!=A.state.lightProbeGridArray.length>0)&&(qt=!0):(qt=!0,mt.__version=z.version);let en=mt.currentProgram;qt===!0&&(en=mr(z,O,V),P&&z.isNodeMaterial&&P.onUpdateProgram(z,en,mt));let wn=!1,Qn=!1,Hi=!1,se=en.getUniforms(),xe=mt.uniforms;if(_.useProgram(en.program)&&(wn=!0,Qn=!0,Hi=!0),z.id!==Q&&(Q=z.id,Qn=!0),mt.needsLights){let ae=ld(A.state.lightProbeGridArray,V);mt.lightProbeGrid!==ae&&(mt.lightProbeGrid=ae,Qn=!0)}if(wn||rt!==S){_.buffers.depth.getReversed()&&S.reversedDepth!==!0&&(S._reversedDepth=!0,S.updateProjectionMatrix()),se.setValue(D,"projectionMatrix",S.projectionMatrix),se.setValue(D,"viewMatrix",S.matrixWorldInverse);let ei=se.map.cameraPosition;ei!==void 0&&ei.setValue(D,be.setFromMatrixPosition(S.matrixWorld)),C.logarithmicDepthBuffer&&se.setValue(D,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),(z.isMeshPhongMaterial||z.isMeshToonMaterial||z.isMeshLambertMaterial||z.isMeshBasicMaterial||z.isMeshStandardMaterial||z.isShaderMaterial)&&se.setValue(D,"isOrthographic",S.isOrthographicCamera===!0),rt!==S&&(rt=S,Qn=!0,Hi=!0)}if(mt.needsLights&&($e.state.directionalShadowMap.length>0&&se.setValue(D,"directionalShadowMap",$e.state.directionalShadowMap,q),$e.state.spotShadowMap.length>0&&se.setValue(D,"spotShadowMap",$e.state.spotShadowMap,q),$e.state.pointShadowMap.length>0&&se.setValue(D,"pointShadowMap",$e.state.pointShadowMap,q)),V.isSkinnedMesh){se.setOptional(D,V,"bindMatrix"),se.setOptional(D,V,"bindMatrixInverse");let ae=V.skeleton;ae&&(ae.boneTexture===null&&ae.computeBoneTexture(),se.setValue(D,"boneTexture",ae.boneTexture,q))}V.isBatchedMesh&&(se.setOptional(D,V,"batchingTexture"),se.setValue(D,"batchingTexture",V._matricesTexture,q),se.setOptional(D,V,"batchingIdTexture"),se.setValue(D,"batchingIdTexture",V._indirectTexture,q),se.setOptional(D,V,"batchingColorTexture"),V._colorsTexture!==null&&se.setValue(D,"batchingColorTexture",V._colorsTexture,q));let ti=X.morphAttributes;if((ti.position!==void 0||ti.normal!==void 0||ti.color!==void 0)&&L.update(V,X,en),(Qn||mt.receiveShadow!==V.receiveShadow)&&(mt.receiveShadow=V.receiveShadow,se.setValue(D,"receiveShadow",V.receiveShadow)),(z.isMeshStandardMaterial||z.isMeshLambertMaterial||z.isMeshPhongMaterial)&&z.envMap===null&&O.environment!==null&&(xe.envMapIntensity.value=O.environmentIntensity),xe.dfgLUT!==void 0&&(xe.dfgLUT.value=tx()),Qn){if(se.setValue(D,"toneMappingExposure",R.toneMappingExposure),mt.needsLights&&hd(xe,Hi),ft&&z.fog===!0&&bt.refreshFogUniforms(xe,ft),bt.refreshMaterialUniforms(xe,z,tt,it,A.state.transmissionRenderTarget[S.id]),mt.needsLights&&mt.lightProbeGrid){let ae=mt.lightProbeGrid;xe.probesSH.value=ae.texture,xe.probesMin.value.copy(ae.boundingBox.min),xe.probesMax.value.copy(ae.boundingBox.max),xe.probesResolution.value.copy(ae.resolution)}ys.upload(D,Ic(mt),xe,q)}if(z.isShaderMaterial&&z.uniformsNeedUpdate===!0&&(ys.upload(D,Ic(mt),xe,q),z.uniformsNeedUpdate=!1),z.isSpriteMaterial&&se.setValue(D,"center",V.center),se.setValue(D,"modelViewMatrix",V.modelViewMatrix),se.setValue(D,"normalMatrix",V.normalMatrix),se.setValue(D,"modelMatrix",V.matrixWorld),z.uniformsGroups!==void 0){let ae=z.uniformsGroups;for(let ei=0,Gi=ae.length;ei<Gi;ei++){let Lc=ae[ei];j.update(Lc,en),j.bind(Lc,en)}}return en}function hd(S,O){S.ambientLightColor.needsUpdate=O,S.lightProbe.needsUpdate=O,S.directionalLights.needsUpdate=O,S.directionalLightShadows.needsUpdate=O,S.pointLights.needsUpdate=O,S.pointLightShadows.needsUpdate=O,S.spotLights.needsUpdate=O,S.spotLightShadows.needsUpdate=O,S.rectAreaLights.needsUpdate=O,S.hemisphereLights.needsUpdate=O}function ud(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return H},this.getActiveMipmapLevel=function(){return W},this.getRenderTarget=function(){return Z},this.setRenderTargetTextures=function(S,O,X){let z=G.get(S);z.__autoAllocateDepthBuffer=S.resolveDepthBuffer===!1,z.__autoAllocateDepthBuffer===!1&&(z.__useRenderToTexture=!1),G.get(S.texture).__webglTexture=O,G.get(S.depthTexture).__webglTexture=z.__autoAllocateDepthBuffer?void 0:X,z.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(S,O){let X=G.get(S);X.__webglFramebuffer=O,X.__useDefaultFramebuffer=O===void 0},this.setRenderTarget=function(S,O=0,X=0){Z=S,H=O,W=X;let z=null,V=!1,ft=!1;if(S){let ut=G.get(S);if(ut.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(D.FRAMEBUFFER,ut.__webglFramebuffer),dt.copy(S.viewport),xt.copy(S.scissor),$t=S.scissorTest,_.viewport(dt),_.scissor(xt),_.setScissorTest($t),Q=-1;return}else if(ut.__webglFramebuffer===void 0)q.setupRenderTarget(S);else if(ut.__hasExternalTextures)q.rebindTextures(S,G.get(S.texture).__webglTexture,G.get(S.depthTexture).__webglTexture);else if(S.depthBuffer){let Ft=S.depthTexture;if(ut.__boundDepthTexture!==Ft){if(Ft!==null&&G.has(Ft)&&(S.width!==Ft.image.width||S.height!==Ft.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");q.setupDepthRenderbuffer(S)}}let _t=S.texture;(_t.isData3DTexture||_t.isDataArrayTexture||_t.isCompressedArrayTexture)&&(ft=!0);let St=G.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(Array.isArray(St[O])?z=St[O][X]:z=St[O],V=!0):S.samples>0&&q.useMultisampledRTT(S)===!1?z=G.get(S).__webglMultisampledFramebuffer:Array.isArray(St)?z=St[X]:z=St,dt.copy(S.viewport),xt.copy(S.scissor),$t=S.scissorTest}else dt.copy(At).multiplyScalar(tt).floor(),xt.copy(me).multiplyScalar(tt).floor(),$t=zt;if(X!==0&&(z=N),_.bindFramebuffer(D.FRAMEBUFFER,z)&&_.drawBuffers(S,z),_.viewport(dt),_.scissor(xt),_.setScissorTest($t),V){let ut=G.get(S.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+O,ut.__webglTexture,X)}else if(ft){let ut=O;for(let _t=0;_t<S.textures.length;_t++){let St=G.get(S.textures[_t]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+_t,St.__webglTexture,X,ut)}}else if(S!==null&&X!==0){let ut=G.get(S.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,ut.__webglTexture,X)}Q=-1},this.readRenderTargetPixels=function(S,O,X,z,V,ft,gt,ut=0){if(!(S&&S.isWebGLRenderTarget)){It("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let _t=G.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&gt!==void 0&&(_t=_t[gt]),_t){_.bindFramebuffer(D.FRAMEBUFFER,_t);try{let St=S.textures[ut],Ft=St.format,Bt=St.type;if(S.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+ut),!C.textureFormatReadable(Ft)){It("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!C.textureTypeReadable(Bt)){It("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}O>=0&&O<=S.width-z&&X>=0&&X<=S.height-V&&D.readPixels(O,X,z,V,lt.convert(Ft),lt.convert(Bt),ft)}finally{let St=Z!==null?G.get(Z).__webglFramebuffer:null;_.bindFramebuffer(D.FRAMEBUFFER,St)}}},this.readRenderTargetPixelsAsync=async function(S,O,X,z,V,ft,gt,ut=0){if(!(S&&S.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let _t=G.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&gt!==void 0&&(_t=_t[gt]),_t)if(O>=0&&O<=S.width-z&&X>=0&&X<=S.height-V){_.bindFramebuffer(D.FRAMEBUFFER,_t);let St=S.textures[ut],Ft=St.format,Bt=St.type;if(S.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+ut),!C.textureFormatReadable(Ft))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!C.textureTypeReadable(Bt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let Et=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,Et),D.bufferData(D.PIXEL_PACK_BUFFER,ft.byteLength,D.STREAM_READ),D.readPixels(O,X,z,V,lt.convert(Ft),lt.convert(Bt),0);let te=Z!==null?G.get(Z).__webglFramebuffer:null;_.bindFramebuffer(D.FRAMEBUFFER,te);let ge=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await lu(D,ge,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,Et),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,ft),D.deleteBuffer(Et),D.deleteSync(ge),ft}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(S,O=null,X=0){let z=Math.pow(2,-X),V=Math.floor(S.image.width*z),ft=Math.floor(S.image.height*z),gt=O!==null?O.x:0,ut=O!==null?O.y:0;q.setTexture2D(S,0),D.copyTexSubImage2D(D.TEXTURE_2D,X,0,0,gt,ut,V,ft),_.unbindTexture()},this.copyTextureToTexture=function(S,O,X=null,z=null,V=0,ft=0){let gt,ut,_t,St,Ft,Bt,Et,te,ge,pe=S.isCompressedTexture?S.mipmaps[ft]:S.image;if(X!==null)gt=X.max.x-X.min.x,ut=X.max.y-X.min.y,_t=X.isBox3?X.max.z-X.min.z:1,St=X.min.x,Ft=X.min.y,Bt=X.isBox3?X.min.z:0;else{let xe=Math.pow(2,-V);gt=Math.floor(pe.width*xe),ut=Math.floor(pe.height*xe),S.isDataArrayTexture?_t=pe.depth:S.isData3DTexture?_t=Math.floor(pe.depth*xe):_t=1,St=0,Ft=0,Bt=0}z!==null?(Et=z.x,te=z.y,ge=z.z):(Et=0,te=0,ge=0);let ie=lt.convert(O.format),Oe=lt.convert(O.type),mt;O.isData3DTexture?(q.setTexture3D(O,0),mt=D.TEXTURE_3D):O.isDataArrayTexture||O.isCompressedArrayTexture?(q.setTexture2DArray(O,0),mt=D.TEXTURE_2D_ARRAY):(q.setTexture2D(O,0),mt=D.TEXTURE_2D),_.activeTexture(D.TEXTURE0),_.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,O.flipY),_.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,O.premultiplyAlpha),_.pixelStorei(D.UNPACK_ALIGNMENT,O.unpackAlignment);let $e=_.getParameter(D.UNPACK_ROW_LENGTH),qt=_.getParameter(D.UNPACK_IMAGE_HEIGHT),en=_.getParameter(D.UNPACK_SKIP_PIXELS),wn=_.getParameter(D.UNPACK_SKIP_ROWS),Qn=_.getParameter(D.UNPACK_SKIP_IMAGES);_.pixelStorei(D.UNPACK_ROW_LENGTH,pe.width),_.pixelStorei(D.UNPACK_IMAGE_HEIGHT,pe.height),_.pixelStorei(D.UNPACK_SKIP_PIXELS,St),_.pixelStorei(D.UNPACK_SKIP_ROWS,Ft),_.pixelStorei(D.UNPACK_SKIP_IMAGES,Bt);let Hi=S.isDataArrayTexture||S.isData3DTexture,se=O.isDataArrayTexture||O.isData3DTexture;if(S.isDepthTexture){let xe=G.get(S),ti=G.get(O),ae=G.get(xe.__renderTarget),ei=G.get(ti.__renderTarget);_.bindFramebuffer(D.READ_FRAMEBUFFER,ae.__webglFramebuffer),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,ei.__webglFramebuffer);for(let Gi=0;Gi<_t;Gi++)Hi&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,G.get(S).__webglTexture,V,Bt+Gi),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,G.get(O).__webglTexture,ft,ge+Gi)),D.blitFramebuffer(St,Ft,gt,ut,Et,te,gt,ut,D.DEPTH_BUFFER_BIT,D.NEAREST);_.bindFramebuffer(D.READ_FRAMEBUFFER,null),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(V!==0||S.isRenderTargetTexture||G.has(S)){let xe=G.get(S),ti=G.get(O);_.bindFramebuffer(D.READ_FRAMEBUFFER,k),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,F);for(let ae=0;ae<_t;ae++)Hi?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,xe.__webglTexture,V,Bt+ae):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,xe.__webglTexture,V),se?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,ti.__webglTexture,ft,ge+ae):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,ti.__webglTexture,ft),V!==0?D.blitFramebuffer(St,Ft,gt,ut,Et,te,gt,ut,D.COLOR_BUFFER_BIT,D.NEAREST):se?D.copyTexSubImage3D(mt,ft,Et,te,ge+ae,St,Ft,gt,ut):D.copyTexSubImage2D(mt,ft,Et,te,St,Ft,gt,ut);_.bindFramebuffer(D.READ_FRAMEBUFFER,null),_.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else se?S.isDataTexture||S.isData3DTexture?D.texSubImage3D(mt,ft,Et,te,ge,gt,ut,_t,ie,Oe,pe.data):O.isCompressedArrayTexture?D.compressedTexSubImage3D(mt,ft,Et,te,ge,gt,ut,_t,ie,pe.data):D.texSubImage3D(mt,ft,Et,te,ge,gt,ut,_t,ie,Oe,pe):S.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,ft,Et,te,gt,ut,ie,Oe,pe.data):S.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,ft,Et,te,pe.width,pe.height,ie,pe.data):D.texSubImage2D(D.TEXTURE_2D,ft,Et,te,gt,ut,ie,Oe,pe);_.pixelStorei(D.UNPACK_ROW_LENGTH,$e),_.pixelStorei(D.UNPACK_IMAGE_HEIGHT,qt),_.pixelStorei(D.UNPACK_SKIP_PIXELS,en),_.pixelStorei(D.UNPACK_SKIP_ROWS,wn),_.pixelStorei(D.UNPACK_SKIP_IMAGES,Qn),ft===0&&O.generateMipmaps&&D.generateMipmap(mt),_.unbindTexture()},this.initRenderTarget=function(S){G.get(S).__webglFramebuffer===void 0&&q.setupRenderTarget(S)},this.initTexture=function(S){S.isCubeTexture?q.setTextureCube(S,0):S.isData3DTexture?q.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?q.setTexture2DArray(S,0):q.setTexture2D(S,0),_.unbindTexture()},this.resetState=function(){H=0,W=0,Z=null,_.reset(),pt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return xn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=Vt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Vt._getUnpackColorSpace()}};function Hu(){let t=document.createElement("canvas");t.width=t.height=512;let e=t.getContext("2d"),n=ni(1234);e.fillStyle="rgb(150,0,0)",e.fillRect(0,0,512,512);let s=[],r=(c,h,d,u,f)=>{if(f>4||d<40&&u<40||f>1&&n()<.22){s.push([c,h,d,u]);return}if(d>u?n()<.8:n()<.2){let p=Math.round(d*(.3+n()*.4)/8)*8;r(c,h,p,u,f+1),r(c+p,h,d-p,u,f+1)}else{let p=Math.round(u*(.3+n()*.4)/8)*8;r(c,h,d,p,f+1),r(c,h+p,d,u-p,f+1)}};r(0,0,512,512,0);for(let[c,h,d,u]of s){let f=105+Math.floor(n()*90);e.fillStyle=`rgb(${f},0,0)`,e.fillRect(c+1,h+1,d-2,u-2);let p=Math.floor(n()*4);for(let y=0;y<p;y++){let x=4+n()*d*.4,m=3+n()*u*.3,b=c+3+n()*Math.max(1,d-x-6),T=h+3+n()*Math.max(1,u-m-6),v=f+(n()<.5?-40:30);e.fillStyle=`rgb(${Math.max(30,Math.min(255,v))},0,0)`,e.fillRect(b,T,x,m)}if(e.fillStyle="rgb(35,0,0)",e.fillRect(c,h,d,1),e.fillRect(c,h,1,u),n()<.18&&d>24&&u>12){let y=Math.floor(u/14),x=3+Math.floor(n()*3);for(let m=0;m<y;m++)if(!(n()<.35))for(let b=c+5;b<c+d-6;b+=x+3)n()<.25||(e.fillStyle=`rgb(20,${150+Math.floor(n()*105)},0)`,e.fillRect(b,h+5+m*14,x,4))}}let a=e.getImageData(0,0,512,512),o=a.data;for(let c=0;c<512;c++)for(let h=0;h<512;h++){let d=(c*512+h)*4;o[d+2]=(h+c)%64<32?255:0}e.putImageData(a,0,0);let l=new Gs(t);return l.wrapS=l.wrapT=as,l.anisotropy=4,l.colorSpace=bn,l}var cn={key:new U(-.45,.65,.62).normalize(),keyColor:new Tt(.62,.72,.9),warm:new U(.7,.45,-.55).normalize(),warmColor:new Tt(1,.42,.16),cool:new U(-.8,.1,-.6).normalize(),coolColor:new Tt(.25,.55,1),ambient:new Tt(.05,.065,.1),fog:new Tt(.02,.035,.07)},ex=`
  attribute vec3 color;
  attribute float aKind;
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
    vec4 mv = viewMatrix * wp;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,nx=`
  uniform sampler2D uTex;
  uniform vec3 uKey, uKeyC, uWarm, uWarmC, uCool, uCoolC, uAmb, uFog;
  uniform float uFogDensity, uTexScale, uWindow, uTime, uRim, uBright;
  uniform vec3 uWinColA, uWinColB;
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
      base = mix(vec3(0.05, 0.1, 0.24) * (0.8 + alb * 0.4), vec3(0.3, 0.35, 0.4), line);
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
`;function cr(i,t={}){return new ce({vertexShader:ex,fragmentShader:nx,uniforms:{uTex:{value:i},uKey:{value:cn.key},uKeyC:{value:cn.keyColor},uWarm:{value:cn.warm},uWarmC:{value:cn.warmColor},uCool:{value:cn.cool},uCoolC:{value:cn.coolColor},uAmb:{value:cn.ambient},uFog:{value:cn.fog.clone()},uFogDensity:{value:t.fog??.006},uTexScale:{value:t.texScale??.11},uWindow:{value:t.window??1.6},uTime:{value:0},uRim:{value:t.rim??.9},uBright:{value:t.bright??1},uWinColA:{value:new Tt(1,.62,.22)},uWinColB:{value:new Tt(.55,.85,1)}}})}var ix=`
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
`,sx=`
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
`,rx=`
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.7, r) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * a, a);
  }
`;function Si(i=!1){return new ce({vertexShader:ix,fragmentShader:i?rx:sx,uniforms:{uTime:{value:0},uScale:{value:400}},transparent:!0,depthWrite:!1,blending:Fn})}function Sn(i,t){let e=i.length,n=new Float32Array(e*3),s=new Float32Array(e*3),r=new Float32Array(e),a=new Float32Array(e),o=new Float32Array(e);i.forEach((h,d)=>{n[d*3]=h.x,n[d*3+1]=h.y,n[d*3+2]=h.z,s[d*3]=h.c[0],s[d*3+1]=h.c[1],s[d*3+2]=h.c[2],r[d]=h.s,a[d]=h.phase||0,o[d]=h.blink||0});let l=new he;l.setAttribute("position",new kt(n,3)),l.setAttribute("color",new kt(s,3)),l.setAttribute("aSize",new kt(r,1)),l.setAttribute("aPhase",new kt(a,1)),l.setAttribute("aBlink",new kt(o,1));let c=new di(l,t);return c.frustumCulled=!1,c}var ax=`
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
`,wo=class{constructor(t){this.renderer=t,this.scene=new Di,this.cam=new gi(0,1,1,0,-1,1),this.mat=new ce({vertexShader:"varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy * 2.0 - 1.0, 0.0, 1.0); }",fragmentShader:ax,uniforms:{uRes:{value:new Lt(1,1)},uTime:{value:0},uCenter:{value:new Lt(.78,.7)},uRadius:{value:.12},uPar:{value:new Lt},uWarm:{value:1},uIntensity:{value:1}},depthTest:!1,depthWrite:!1});let e=new Nn(1,1);e.translate(.5,.5,0),this.scene.add(new Ht(e,this.mat)),this.rt=new He(4,4,{depthBuffer:!1}),this.rt.texture.colorSpace=Ne,this.scale=.5,this.frame=0}setLook(t){let e=this.mat.uniforms;e.uCenter.value.set(t.holeX??.78,t.holeY??.7),e.uRadius.value=.15*(t.hole??1),e.uWarm.value=.75+(t.warm??.5)*.5}resize(t,e,n){let s=Math.max(64,Math.floor(t*n*this.scale)),r=Math.max(36,Math.floor(e*n*this.scale));this.rt.setSize(s,r),this.mat.uniforms.uRes.value.set(s,r)}render(t,e,n){let s=this.mat.uniforms;s.uTime.value=t,s.uPar.value.set(e,n);let r=this.renderer.getRenderTarget();this.renderer.setRenderTarget(this.rt),this.renderer.render(this.scene,this.cam),this.renderer.setRenderTarget(r)}};var Gu=Math.PI*2;function tn(i=60,t=9){return{a:0,v:0,target:0,k:i,d:t}}var ox="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",lx=`
  uniform vec3 uColor; uniform float uPower; uniform float uTime; varying vec2 vUv;
  void main(){
    float y = 1.0 - vUv.y;         // 1 at nozzle, 0 at tip
    float flick = 0.85 + 0.15 * sin(uTime * 70.0 + y * 20.0);
    float core = pow(y, 1.6) * flick;
    float a = core * uPower;
    vec3 c = mix(uColor, vec3(1.0), pow(y, 4.0) * 0.8);
    gl_FragColor = vec4(c * a, a);
  }`;function _c(i){return new ce({vertexShader:ox,fragmentShader:lx,uniforms:{uColor:{value:new Tt(i)},uPower:{value:0},uTime:{value:0}},transparent:!0,depthWrite:!1,blending:Fn,side:an})}var hr=class{constructor(t={}){let e=new Dn({color:t.suit??14673388,roughness:.5,metalness:.05}),n=new Dn({color:2304047,roughness:.7,metalness:.2}),s=new Dn({color:t.accent??16742943,roughness:.45,emissive:new Tt(t.accent??16742943).multiplyScalar(.25)}),r=new Dn({color:726052,roughness:.12,metalness:.9,emissive:new Tt(t.visorGlow??865616)}),a=new rn({color:t.light??6285055});this.mats={suit:e,dark:n,accent:s,visor:r,glow:a};let o=new ye;this.root=o;let l=new ye;o.add(l),this.body=l;let c=(b,T,v,w=0,A=0,E=0)=>{let g=new Ht(T,v);return g.position.set(w,A,E),b.add(g),g},h=new ye;l.add(h),this.torso=h,c(h,new ds(.19,.36,4,12),e,0,.06,0),c(h,new Se(.1,.26,.3),e,.13,.16,0),c(h,new Se(.04,.05,.12),s,.19,.2,.05),c(h,new Ie(.2,.2,.08,14),n,0,-.17,0),c(h,new _n(.15,.03,6,16),n,0,.4,0).rotation.x=Math.PI/2;let d=new ye;d.position.set(0,.56,0),h.add(d),this.head=d,c(d,new qe(.175,18,14),e);let u=c(d,new qe(.165,18,12,-Math.PI*.42,Math.PI*.84,Math.PI*.22,Math.PI*.5),r,.03,0,0);u.rotation.y=Math.PI/2;let f=c(d,new Ie(.008,.012,.32,5),n,-.07,.15,.13);f.rotation.z=.55,this.antTip=c(d,new qe(.022,6,5),new rn({color:t.beacon??16726830}),-.155,.285,.13),c(d,new Se(.08,.06,.05),n,-.02,.05,.17),c(d,new Se(.02,.03,.04),a,.025,.05,.19);let p=new ye;p.position.set(-.27,.12,0),h.add(p),this.pack=p,c(p,new Se(.17,.5,.38),e),c(p,new Se(.03,.4,.06),a,-.09,.02,.12),c(p,new Se(.13,.08,.42),n,0,.21,0);let y=new Ie(.03,.045,.08,8);c(p,y,n,-.02,-.29,.11),c(p,y,n,-.02,-.29,-.11),c(p,new Se(.05,.05,.05),n,0,.27,.19),c(p,new Se(.05,.05,.05),n,0,.27,-.19),this.flameMat=_c(5818623);let x=new Ui(.06,.9,10,1,!0);x.rotateX(Math.PI),x.translate(0,-.45,0),this.flames=[];for(let b of[.11,-.11]){let T=new Ht(x,this.flameMat);T.position.set(-.02,-.33,b),p.add(T),this.flames.push(T)}let m=(b,T,v,w,A,E,g)=>{let M=new ye;M.position.set(T,v,w),b.add(M);let R=new Ht(new ds(E,A,3,8),g);return R.position.y=-A/2-E*.5,M.add(R),M};this.armN=m(h,.02,.33,.25,.24,.07,e),this.foreN=m(this.armN,0,-.34,0,.22,.062,s),c(this.foreN,new qe(.07,8,6),n,0,-.36,0),this.armF=m(h,.02,.33,-.25,.24,.07,e),this.foreF=m(this.armF,0,-.34,0,.22,.062,e),c(this.foreF,new qe(.07,8,6),n,0,-.36,0),this.legN=m(h,0,-.2,.11,.36,.09,e),this.shinN=m(this.legN,0,-.5,0,.34,.08,e),this.legF=m(h,0,-.2,-.11,.36,.09,e),this.shinF=m(this.legF,0,-.5,0,.34,.08,e);for(let b of[this.shinN,this.shinF])c(b,new Se(.17,.14,.13),n,.03,-.5,0),c(b,new Ie(.083,.083,.05,10),n,0,-.08,0);c(h,new _n(.07,.022,5,12),s,-.05,-.12,.2).rotation.y=Math.PI/2,this.root.scale.setScalar(t.scale??1.3),this.j={armN:tn(40,7),armF:tn(40,7),foreN:tn(50,7),foreF:tn(50,7),armNx:tn(40,7),armFx:tn(40,7),legN:tn(45,8),legF:tn(45,8),shinN:tn(55,8),shinF:tn(55,8),spine:tn(35,7),headP:tn(50,8),pack:tn(80,6)},this.visAngle=0,this.visVel=0,this.roll=.55,this.rollVel=0,this.t=Math.random()*10,this.power=0,this.flail=0,this.stretch=0,this.root.traverse(b=>{b.frustumCulled=!1})}kick(t){for(let e of Object.keys(this.j))this.j[e].v+=(Math.random()-.5)*t*14;this.rollVel+=(Math.random()-.5)*t*3,this.flail=Math.min(1.5,this.flail+t*.25)}update(t,e){this.t+=t;let n=this.t,s=e.angle-this.visAngle;for(;s>Math.PI;)s-=Gu;for(;s<-Math.PI;)s+=Gu;let r=e.dead?400:260;this.visVel+=(s*r-this.visVel*30)*t,this.visAngle+=this.visVel*t,this.root.position.set(e.x,e.y,0),this.root.rotation.z=this.visAngle-Math.PI/2,this.power+=((e.thrusting?1:0)-this.power)*Math.min(1,t*18),this.flail*=Math.exp(-t*(e.dead?.2:1.2));let a=this.flail+(e.dead?.8:0)+Math.min(1,Math.abs(e.tumble)*.18),o=.55+Math.sin(n*.37)*.22+e.turning*.35;this.rollVel+=((o-this.roll)*6-this.rollVel*3)*t+e.tumble*t*.4,this.roll+=this.rollVel*t,this.body.rotation.y=this.roll,this.body.rotation.x=Math.sin(n*.29)*.08;let l=this.j,c=e.docked?1:0,h=.35,d=-.35,u=.15,f=-.35,p=0,y=.15;e.thrusting&&(h=-.15,d=-.15,u=-.05,f=-.05,p=-.06,y=.08),e.braking&&(h=1.1,d=-.6,u=.75,f=-1.1,p=.18,y=.35),e.latched&&(h=2.6,d=-.2,u=.4,f=-.6),c&&(h=.2,d=-.4,u=.05,f=-.15,p=0);let x=Math.sin(n*.8);l.armN.target=h+x*.1+Math.sin(n*13)*a*.9,l.armF.target=h*.8-x*.08+Math.sin(n*11+1)*a*.9+(e.latched?-2:0),l.foreN.target=d+Math.sin(n*15)*a*.6,l.foreF.target=d+Math.sin(n*12+2)*a*.6,l.armNx.target=y+Math.sin(n*9)*a*.5,l.armFx.target=-y-Math.sin(n*10)*a*.5,l.legN.target=u+Math.sin(n*.7)*.08+Math.sin(n*12)*a*.7,l.legF.target=u*.7-Math.sin(n*.7+1)*.1+Math.sin(n*10+3)*a*.7,l.shinN.target=f+Math.sin(n*14)*a*.4,l.shinF.target=f*1.2+Math.sin(n*13+1)*a*.4,l.spine.target=p,l.headP.target=(e.braking?.25:0)+Math.sin(n*.5)*.05,l.pack.target=0,e.thrusting&&(l.legN.v-=t*6,l.legF.v-=t*6,l.pack.v+=t*4);for(let b in l){let T=l[b];T.v+=((T.target-T.a)*T.k-T.v*T.d)*t,T.a+=T.v*t}this.armN.rotation.set(l.armNx.a,0,l.armN.a),this.armF.rotation.set(l.armFx.a,0,l.armF.a),this.foreN.rotation.z=Math.min(0,l.foreN.a),this.foreF.rotation.z=Math.min(0,l.foreF.a),this.legN.rotation.z=l.legN.a,this.legF.rotation.z=l.legF.a,this.shinN.rotation.z=Math.min(.05,l.shinN.a),this.shinF.rotation.z=Math.min(.05,l.shinF.a),this.torso.rotation.z=l.spine.a,this.head.rotation.z=l.headP.a,this.pack.rotation.z=l.pack.a*.3;let m=.8+Math.random()*.4;for(let b of this.flames)b.scale.set(1,this.power*m+.001,1);if(this.flameMat.uniforms.uPower.value=this.power,this.flameMat.uniforms.uTime.value=n,this.antTip.visible=n%1.4<.18||!!e.beaconSolid,e.stretch>0){let b=e.stretch;this.root.scale.set(1.3*(1-b*.7),1.3*(1+b*3),1.3*(1-b*.7))}}};var Ao=class{constructor(t=1400){this.max=t,this.n=0;let e=new he;this.pos=new Float32Array(t*3),this.col=new Float32Array(t*3),this.size=new Float32Array(t),e.setAttribute("position",new kt(this.pos,3).setUsage(Mi)),e.setAttribute("color",new kt(this.col,3).setUsage(Mi)),e.setAttribute("aSize",new kt(this.size,1).setUsage(Mi)),e.setAttribute("aPhase",new kt(new Float32Array(t),1)),e.setAttribute("aBlink",new kt(new Float32Array(t),1)),this.geo=e,this.mat=Si(),this.points=new di(e,this.mat),this.points.frustumCulled=!1,this.points.renderOrder=5,this.p=[];for(let n=0;n<t;n++)this.p.push({x:0,y:0,z:0,vx:0,vy:0,vz:0,life:0,max:1,s0:1,s1:1,r:1,g:1,b:1,drag:0})}spawn(t,e,n,s,r,a,o,l,c,h,d,u,f=0){if(this.n>=this.max)return;let p=this.p[this.n++];p.x=t,p.y=e,p.z=n,p.vx=s,p.vy=r,p.vz=a,p.life=o,p.max=o,p.s0=l,p.s1=c,p.r=h,p.g=d,p.b=u,p.drag=f}clear(){this.n=0}update(t,e){let n=0;for(;n<this.n;){let r=this.p[n];if(r.life-=t,r.life<=0){let o=this.p[this.n-1];this.p[this.n-1]=r,this.p[n]=o,this.n--;continue}let a=Math.exp(-r.drag*t);r.vx*=a,r.vy*=a,r.vz*=a,r.x+=r.vx*t,r.y+=r.vy*t,r.z+=r.vz*t,n++}for(let r=0;r<this.n;r++){let a=this.p[r],o=a.life/a.max,l=o<.3?o/.3:1;this.pos[r*3]=a.x,this.pos[r*3+1]=a.y,this.pos[r*3+2]=a.z,this.col[r*3]=a.r*l,this.col[r*3+1]=a.g*l,this.col[r*3+2]=a.b*l,this.size[r]=a.s1+(a.s0-a.s1)*o}this.geo.setDrawRange(0,this.n);let s=this.geo.attributes;s.position.needsUpdate=!0,s.color.needsUpdate=!0,s.aSize.needsUpdate=!0,this.mat.uniforms.uScale.value=e}},Ro=class{constructor(t=64){this.max=t;let e=new he;this.pos=new Float32Array(t*3),this.col=new Float32Array(t*3),this.size=new Float32Array(t),e.setAttribute("position",new kt(this.pos,3).setUsage(Mi)),e.setAttribute("color",new kt(this.col,3).setUsage(Mi)),e.setAttribute("aSize",new kt(this.size,1).setUsage(Mi)),e.setAttribute("aPhase",new kt(new Float32Array(t),1)),e.setAttribute("aBlink",new kt(new Float32Array(t),1)),this.geo=e,this.mat=Si(!0),this.points=new di(e,this.mat),this.points.frustumCulled=!1,this.points.renderOrder=6,this.buf=[]}set(t,e,n,s,r){let a=Math.min(t.length,this.max-1),o=0,l=t[t.length-1],c=l&&l.hit,h=l&&l.danger;for(let u=0;u<a;u++){let f=t[u],p=1-u/Math.max(1,a);this.pos[o*3]=f.x,this.pos[o*3+1]=f.y,this.pos[o*3+2]=.2;let y=.45,x=.85,m=1;s.latched&&(y=.4,x=1,m=.75),h&&u>a*.4?(y=1,x=.25,m=.2):c==="wall"&&u>a*.6&&(y=1,x=.7,m=.25);let b=(.25+p*.75)*s.alpha;this.col[o*3]=y*b,this.col[o*3+1]=x*b,this.col[o*3+2]=m*b,this.size[o]=s.latched?.2+p*.12:.13+p*.08,o++}if(c&&l){this.pos[o*3]=l.x,this.pos[o*3+1]=l.y,this.pos[o*3+2]=.2;let u=h?[1,.2,.15]:c==="rail"?[.3,1,.7]:[1,.7,.25],f=s.alpha*(h?.7+.3*Math.sin(s.t*18):.8);this.col[o*3]=u[0]*f,this.col[o*3+1]=u[1]*f,this.col[o*3+2]=u[2]*f,this.size[o]=h?.75:.5,o++}this.geo.setDrawRange(0,o);let d=this.geo.attributes;d.position.needsUpdate=!0,d.color.needsUpdate=!0,d.aSize.needsUpdate=!0,this.mat.uniforms.uScale.value=r}};function Xu(i,t=!1){let e=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},a={},o=i[0].morphTargetsRelative,l=new he,c=0;for(let h=0;h<i.length;++h){let d=i[h],u=0;if(e!==(d.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in d.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(d.attributes[f]),u++}if(u!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==d.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in d.morphAttributes){if(!s.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;a[f]===void 0&&(a[f]=[]),a[f].push(d.morphAttributes[f])}if(t){let f;if(e)f=d.index.count;else if(d.attributes.position!==void 0)f=d.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,h),c+=f}}if(e){let h=0,d=[];for(let u=0;u<i.length;++u){let f=i[u].index;for(let p=0;p<f.count;++p)d.push(f.getX(p)+h);h+=i[u].attributes.position.count}l.setIndex(d)}for(let h in r){let d=Wu(r[h]);if(!d)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,d)}for(let h in a){let d=a[h][0].length;if(d!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let u=0;u<d;++u){let f=[];for(let y=0;y<a[h].length;++y)f.push(a[h][y][u]);let p=Wu(f);if(!p)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(p)}}}return l}function Wu(i){let t,e,n,s=-1,r=0;for(let c=0;c<i.length;++c){let h=i[c];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=h.gpuType),s!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*e}let a=new t(r),o=new kt(a,e,n),l=0;for(let c=0;c<i.length;++c){let h=i[c];if(h.isInterleavedBufferAttribute){let d=l/e;for(let u=0,f=h.count;u<f;u++)for(let p=0;p<e;p++){let y=h.getComponent(u,p);o.setComponent(u+d,p,y)}}else a.set(h.array,l);l+=h.count*e}return s!==void 0&&(o.gpuType=s),o}var qu={hull:{color:[.4,.43,.48],z0:-5,z1:.8},truss:{color:[.36,.38,.42],z0:-2.2,z1:.8},strut:{color:[.47,.47,.49],z0:-1.8,z1:.8},crate:{color:[.55,.45,.32],z0:-1.6,z1:.8},door:{color:[.5,.5,.5],z0:-1.4,z1:.8,kind:1},frame:{color:[.25,.27,.3],z0:-2,z1:.8},rail:{color:[.33,.36,.4],z0:-.8,z1:.8},hub:{color:[.3,.32,.36],z0:-2.5,z1:1},blade:{color:[.55,.55,.55],z0:-.4,z1:.4,kind:1},shuttle:{color:[.78,.8,.83],z0:-1.4,z1:1.2},debris:{color:[.33,.31,.3],z0:-1.2,z1:1},rock:{color:[.3,.27,.25],z0:-1,z1:1}};function hn(i,t,e=0){i.index&&(i=i.toNonIndexed());let n=i.attributes.position.count,s=new Float32Array(n*3),r=new Float32Array(n);for(let a=0;a<n;a++)s[a*3]=t[0],s[a*3+1]=t[1],s[a*3+2]=t[2],r[a]=e;return i.setAttribute("color",new kt(s,3)),i.setAttribute("aKind",new kt(r,1)),i.attributes.uv||i.setAttribute("uv",new kt(new Float32Array(n*2),2)),i}function Gt(i,t,e,n,s,r,a,o,l=0){let c=new Se(i,t,n-e);return c.translate(0,0,(e+n)/2),c.rotateZ(a),c.translate(s,r,0),hn(c,o,l)}var Co=[1,.62,.2],Io=[.35,.9,1],ur=[1,.18,.12],cx=[.9,.95,1];function Yu(i,t){let e=qu[i.style]||qu.hull,n=[],s=[],r=e.color.map(p=>p*(.9+t()*.18));if(i.type==="circle"){if(i.style==="shuttle"){let p=new qe(i.r,16,12);p.scale(1.25,1,1.2),p.translate(i.lx,i.ly,-.1),n.push(hn(p,r));let y=new qe(i.r*.75,12,8,0,Math.PI,0,Math.PI/2);return y.rotateX(-Math.PI/2+.6),y.translate(i.lx+.2,i.ly+.35,.5),n.push(hn(y,[.05,.08,.12])),s.push({x:i.lx+1.3,y:i.ly,z:.4,c:cx,s:1.6}),{geos:n,lights:s}}if(i.style==="rock"){let p=new Fi(i.r*1.05,1),y=p.attributes.position;for(let x=0;x<y.count;x++){let m=.85+t()*.3;y.setXYZ(x,y.getX(x)*m,y.getY(x)*m,y.getZ(x)*m)}p.computeVertexNormals(),p.translate(i.lx,i.ly,-.2),n.push(hn(p,r))}else{let p=new Ie(i.r,i.r,e.z1-e.z0,24);p.rotateX(Math.PI/2),p.translate(i.lx,i.ly,(e.z0+e.z1)/2),n.push(hn(p,r));let y=new Ie(i.r*.55,i.r*.65,.6,16);y.rotateX(Math.PI/2),y.translate(i.lx,i.ly,e.z1+.3),n.push(hn(y,[.22,.24,.27]));for(let x=0;x<6;x++){let m=x/6*Math.PI*2;s.push({x:i.lx+Math.cos(m)*i.r*.82,y:i.ly+Math.sin(m)*i.r*.82,z:e.z1+.15,c:x%3?Co:ur,s:.45,blink:x%3?0:.8,phase:x/6})}}return{geos:n,lights:s}}let{lx:a,ly:o,w:l,h:c}=i,h=i.lrot||0,d=Math.cos(h),u=Math.sin(h),f=(p,y)=>[a+d*p-u*y,o+u*p+d*y];if(i.style==="truss"&&l>c){let p=Math.min(.55,c*.25);n.push(Gt(l,c*.92,e.z0,-.6,a,o,h,r.map(T=>T*.55)));for(let T of[-1,1]){let[v,w]=f(0,T*(c/2-p/2));n.push(Gt(l,p,-.6,e.z1,v,w,h,r))}let y=Math.max(1.6,c*1.1),x=Math.max(1,Math.floor(l/y)),m=c-p*2,b=Math.hypot(y,m);for(let T=0;T<x;T++){let v=-l/2+(T+.5)*(l/x),[w,A]=f(v,0),E=h+(T%2?1:-1)*Math.atan2(m,l/x);n.push(Gt(Math.min(b,Math.hypot(l/x,m)),p*.45,-.5,e.z1-.15,w,A,E,r.map(g=>g*.9)))}for(let T=-l/2+2;T<l/2-1;T+=6+t()*3)for(let v of[-1,1]){let[w,A]=f(T,v*(c/2-p/2));t()<.55&&s.push({x:w,y:A,z:e.z1+.15,c:Co,s:.42,blink:t()<.1?.6:0,phase:t()})}return{geos:n,lights:s}}if(i.style==="blade"){n.push(Gt(l,c,e.z0,e.z1,a,o,h,r,1));let[p,y]=f(0,0);n.push(Gt(l*.96,.08,e.z1,e.z1+.04,p,y,h,[.4,.55,.8],2));let[x,m]=f(l/2-.2,0);return s.push({x,y:m,z:e.z1+.2,c:ur,s:.8,blink:1.2}),{geos:n,lights:s}}if(n.push(Gt(l,c,e.z0,e.z1,a,o,h,r,e.kind||0)),i.style==="rail"){for(let b of[-1,1]){let[T,v]=f(0,b*(c/2+.02));n.push(Gt(l-1,.1,-.3,e.z1+.05,T,v,h,Io,2))}for(let b=-l/2+1;b<=l/2-1;b+=2.4){let[T,v]=f(b,0);s.push({x:T,y:v,z:e.z1+.15,c:Io,s:.35})}let[p,y]=f(l/2-.3,0),[x,m]=f(-l/2+.3,0);return s.push({x:p,y,z:e.z1+.3,c:ur,s:1,blink:1}),s.push({x,y:m,z:e.z1+.3,c:ur,s:1,blink:1,phase:.5}),{geos:n,lights:s}}if(i.style==="hull"||i.style==="crate"||i.style==="strut"||i.style==="frame"){let p=l>=c,y=p?l:c;if(y>3){for(let m of[-1,1]){let b=(p?c:l)/2-.12,[T,v]=p?f(0,m*b):f(m*b,0),w=p?y-.3:.07,A=p?.07:y-.3;n.push(Gt(w,A,e.z1,e.z1+.03,T,v,h,i.style==="hull"?[.6,.66,.75]:[.5,.5,.5],2))}let x=i.style==="hull"?5+t()*3:3.5;for(let m=-y/2+1.2;m<y/2-.8;m+=x){let b=t()<.5?-1:1,T=(p?c:l)/2-.3,[v,w]=p?f(m,b*T):f(b*T,m);t()<.5&&s.push({x:v,y:w,z:e.z1+.12,c:t()<.82?Co:Io,s:.38,blink:t()<.08?.7:0,phase:t()})}}if(i.style!=="hull"&&y<12){let[x,m]=f(l/2-.25,c/2-.25);s.push({x,y:m,z:e.z1+.15,c:ur,s:.6,blink:.9,phase:t()})}if(i.style==="hull"&&l>6&&c>6)for(let x=0;x<Math.min(6,l*c/40);x++){let m=(t()-.5)*(l-2),b=(t()-.5)*(c-2),[T,v]=f(m,b);n.push(Gt(1+t()*3,.6+t()*1.6,e.z1,e.z1+.18,T,v,h,r.map(w=>w*.8)))}}if(i.style==="shuttle"){let[p,y]=f(0,.25);n.push(Gt(l*.92,.16,e.z1,e.z1+.04,p,y,h,[1,.55,.15],2));let[x,m]=f(-l/2+.9,c/2+.5);n.push(Gt(1.2,1,-.15,.15,x,m,h-.35,[.7,.72,.75]));for(let b of[-.55,.55]){let T=new Ie(.42,.62,1.1,12,1,!0);T.rotateZ(Math.PI/2);let[v,w]=f(-l/2-.45,-.1);T.translate(v,w,b),n.push(hn(T,[.25,.26,.28])),s.push({x:v-.5,y:w,z:b,c:Io,s:2.2})}for(let b=-l/2+.8;b<l/2;b+=1.6){let[T,v]=f(b,-c/2+.25);s.push({x:T,y:v,z:e.z1+.05,c:Co,s:.35,blink:1.6,phase:b*.1})}}return{geos:n,lights:s}}function un(i){return i.length?Xu(i,!1):null}var dr=[1,.62,.2],hx=[.4,.85,1],fr=[1,.2,.12],ux=[.85,.9,1];function Po(i,t,e,n,s,r,a,o=20,l=0){let c=new Ie(i,i,t,o,1,!1);return r==="x"&&c.rotateZ(Math.PI/2),r==="z"&&c.rotateX(Math.PI/2),c.translate(e,n,s),hn(c,a,l)}function $u(i,t,e,n,s,r,a,o,l={}){let c=[.42,.45,.5],h=[.22,.24,.28];for(let d=n;d<s;d+=24){i.push(Po(o,24,d+12,r,a,"x",c)),i.push(Po(o*1.12,1.4,d,r,a,"x",h));for(let u=2;u<22;u+=1.6)e()<.45&&t.push({x:d+u,y:r+o*.35,z:a+o*.94,c:e()<.85?dr:hx,s:.5,blink:-.5,phase:e()})}i.push(Gt(s-n,.8,a-.4,a+.4,(n+s)/2,r+o+2.2,0,h));for(let d=n;d<s;d+=5)i.push(Gt(.35,2.6,a-.2,a+.2,d,r+o+1.1,.5,h));for(let d=n+e()*30;d<s;d+=(l.spacing||46)+e()*30){let u=e();if(u<.4){let f=16+e()*22,p=e()<.7?1:-1;i.push(Gt(1.6,f,a-.8,a+.8,d,r+p*(o+f/2),0,h));let y=7+e()*6,x=3.5+e()*2;for(let m of[-1,1])for(let b=0;b<3;b++)i.push(Gt(y,x,a-.08,a+.08,d+m*(1.5+y/2),r+p*(o+f*(.35+b*.22)),0,[.08,.14,.3],3));t.push({x:d,y:r+p*(o+f+.6),z:a,c:fr,s:1.1,blink:.45,phase:e()})}else if(u<.7){let f=o*(.5+e()*.3),p=10+e()*10,y=e()<.5?1:-1;i.push(Gt(1.2,4,a-.6,a+.6,d,r+y*(o+2),0,h)),i.push(Po(f,p,d,r+y*(o+4+f),a,"x",c));for(let x=-p/2+1;x<p/2;x+=1.4)e()<.5&&t.push({x:d+x,y:r+y*(o+4+f),z:a+f+.1,c:dr,s:.45})}else{let f=24+e()*30;i.push(Gt(.9,f,a-.45,a+.45,d,r+o+f/2,0,h)),i.push(Gt(.25,9,a-.12,a+.12,d+1.2,r+o+f-2,0,h)),t.push({x:d,y:r+o+f+.3,z:a,c:fr,s:1.2,blink:.6,phase:e()}),t.push({x:d+1.2,y:r+o+f+2.6,z:a,c:ux,s:.7,blink:.3,phase:e()})}}}function Zu(i,t,e){let n=ni(e),s=t.bounds,r=[],a=[],o=[],l=[],c=[],h=s.x0-120,d=s.x1+160,u=(s.y0+s.y1)/2;for(let p of t.bodies)if(!p.motion)for(let y of p.shapes)y.type!=="box"||y.w*y.h<30||y.style!=="hull"||Math.min(y.w,y.h)<5||(o.push(Gt(y.w+1.5,y.h+1.5,-18,-5,y.lx,y.ly,0,[.17,.19,.23])),y.w>8&&o.push(Po(Math.min(y.h,8)*.35,y.w*.8,y.lx,y.ly,-21,"x",[.2,.22,.26])));let f=i.look;$u(r,l,n,h,d,u+(f.spineY??13),-62,4.2),$u(a,c,n,h*1.5,d*1.5,u-30,-125,7,{spacing:70});for(let p=h*2;p<d*2;p+=30+n()*40){let y=20+n()*70;a.push(Gt(6+n()*10,y,-235,-225,p,u-50+y/2,0,[.3,.33,.4])),n()<.5&&c.push({x:p,y:u-50+y+1,z:-224,c:fr,s:2.4,blink:.4,phase:n()})}if((f.landmark??(f.final?"ring":"none"))==="ring"){let p=f.ringX??s.x1-20,y=new _n(46,3.4,10,72);y.translate(p,u+2,-95),r.push(hn(y,[.45,.48,.55]));for(let x=0;x<60;x++){let m=x/60*Math.PI*2;l.push({x:p+Math.cos(m)*46,y:u+2+Math.sin(m)*46,z:-91.5,c:x%5===0?fr:dr,s:1.4,blink:x%5===0?.5:0,phase:x/9})}}return{back:un(o),mid:un(r),far:un(a),lights:l,farLights:c}}function Ju(i,t,e=1){let n=ni(t+99),s=i.bounds,r={geos:[],lights:[]},a={geos:[],lights:[]},o=[.035,.045,.06];for(let l=s.x0-30;l<s.x1+40;l+=(18+n()*26)/e){let c=9+n()*3,h=n();if(h<.5){let d=6+n()*12,u=3+n()*3,f=-5.4-n()*.8;a.geos.push(Gt(d,u,c-1,c+1,l,f-u/2,0,o)),a.geos.push(Gt(d*.9,.18,c-.3,c+.3,l,f+.7,0,o));for(let p=-d/2;p<d/2;p+=1.6)a.geos.push(Gt(.12,.7,c-.1,c+.1,l+p,f+.35,0,o));for(let p=0;p<2;p++)a.lights.push({x:l+(n()-.5)*d,y:f-.3,z:c+1.05,c:dr,s:.4,phase:n()})}else if(h<.78){let d=10+n()*16;r.geos.push(Gt(d,1.4+n(),c-1,c+1,l,6.3+n()*.8,(n()-.5)*.2,o)),n()<.6&&r.lights.push({x:l,y:5.6,z:c+1.05,c:fr,s:.45,blink:.6,phase:n()})}else{let d=1.4+n()*2;a.geos.push(Gt(d,40,c-1,c+1,l,6,(n()-.5)*.25,o)),a.lights.push({x:l+d/2+.05,y:(n()-.5)*6,z:c+1.05,c:dr,s:.4})}}return{top:{geo:un(r.geos),lights:r.lights},bot:{geo:un(a.geos),lights:a.lights}}}function Ku(){return new ce({transparent:!0,uniforms:{uPlayer:{value:new Lt(.5,.5)},uGoal:{value:new Lt(-9,-9)},uAspect:{value:1.77}},vertexShader:`
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
      }`})}var td=38,Lo=Math.tan(td/2*Math.PI/180),dx=`
  uniform vec3 uColor; uniform float uTime; uniform float uAlpha; varying vec2 vUv;
  void main(){
    vec2 p = vUv - 0.5; float r = length(p) * 2.0;
    float ring = smoothstep(0.78, 0.86, r) * smoothstep(1.0, 0.9, r);
    float ang = atan(p.y, p.x);
    float dash = step(0.35, fract(ang * 3.0 / 3.14159 + uTime * 0.25));
    float inner = smoothstep(0.62, 0.66, r) * smoothstep(0.7, 0.66, r) * 0.5;
    float a = (ring * (0.5 + 0.5 * dash) + inner) * uAlpha;
    gl_FragColor = vec4(uColor * a, a);
  }`,fx=`
  uniform float uTime; uniform vec3 uColor; varying vec2 vUv;
  void main(){
    vec2 p = (vUv - 0.5) * 2.0; float r = length(p);
    float ang = atan(p.y, p.x);
    float spiral = sin(ang * 3.0 + 6.0 / (r + 0.15) - uTime * 2.0) * 0.5 + 0.5;
    float a = pow(spiral, 3.0) * smoothstep(1.0, 0.25, r) * 0.55 + exp(-r * r * 30.0) * 1.5 + exp(-r * r * 6.0) * 0.4;
    a *= smoothstep(1.0, 0.85, r);
    gl_FragColor = vec4(uColor * a, a);
  }`,px="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }";function ju(i,t){return new ce({vertexShader:px,fragmentShader:i,uniforms:t,transparent:!0,depthWrite:!1,blending:Fn})}var No=class{constructor(t){let e=matchMedia("(pointer: coarse)").matches;this.renderer=new So({canvas:t,antialias:!e,powerPreference:"high-performance"}),this.renderer.outputColorSpace=Ne,this.renderer.toneMapping=Js,this.renderer.toneMappingExposure=1.15,this.maxDpr=e?1.5:2,this.dpr=Math.min(window.devicePixelRatio||1,this.maxDpr),this.scene=new Di,this.camera=new De(td,16/9,.5,900),this.bg=new wo(this.renderer),this.scene.background=this.bg.rt.texture,this.tex=Hu(),this.matPlay=cr(this.tex,{fog:.004,rim:1.2,bright:1.15,window:1.3}),this.matBack=cr(this.tex,{fog:.02,rim:.4,bright:.45,window:.9,texScale:.07}),this.matMid=cr(this.tex,{fog:.0105,rim:.8,bright:.75,window:1.6,texScale:.06}),this.matFar=cr(this.tex,{fog:.0062,rim:.6,bright:.55,window:2,texScale:.03}),this.matBack.uniforms.uFog.value=new Tt(.05,.07,.12),this.matMid.uniforms.uFog.value=new Tt(.13,.16,.25),this.matFar.uniforms.uFog.value=new Tt(.15,.18,.29),this.matFg=Ku(),this.lightMat=Si(),this.farLightMat=Si();let n=new Oi(12571903,2.2);n.position.copy(cn.key).multiplyScalar(10);let s=new Oi(16742970,2.4);s.position.copy(cn.warm).multiplyScalar(10);let r=new Oi(4886783,1.4);r.position.copy(cn.cool).multiplyScalar(10),this.scene.add(n,s,r,new qs(1845828,526348,1.2)),this.thrustLight=new $s(6737151,0,9,1.6),this.scene.add(this.thrustLight),this.particles=new Ao(1600),this.scene.add(this.particles.points),this.drift=new Ro(70),this.scene.add(this.drift.points),this.hero=new hr,this.scene.add(this.hero.root),this.brakeMat=_c(11462911);let a=new Ui(.07,.7,8,1,!0);a.rotateX(Math.PI),a.translate(0,-.35,0),this.brakeFlames=[new Ht(a,this.brakeMat),new Ht(a,this.brakeMat)];for(let o of this.brakeFlames)o.frustumCulled=!1,this.scene.add(o);this.stageGroup=null,this.cam={x:0,y:0,vx:0,vy:0,h:10,hv:0},this.shake=0,this.time=0,this.resize()}resize(){let t=window.innerWidth,e=window.innerHeight;this.renderer.setPixelRatio(this.dpr),this.renderer.setSize(t,e,!1),this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.bg.resize(t,e,this.dpr),this.pxScale=e*this.dpr/(2*Lo),this.matFg.uniforms.uAspect.value=t/e}setQuality(t){this.dpr=Math.min(window.devicePixelRatio||1,[1,1.25,this.maxDpr][t]),this.bg.scale=[.35,.45,.5][t],this.resize()}clearStage(){this.stageGroup&&(this.scene.remove(this.stageGroup),this.stageGroup.traverse(t=>{t.geometry&&!t.userData.shared&&t.geometry.dispose()}),this.stageGroup=null,this.ren&&(this.scene.remove(this.ren.root),this.ren.root.traverse(t=>{t.geometry&&t.geometry.dispose()}),this.ren=null))}loadStage(t,e){this.clearStage();let n=new ye;this.stageGroup=n,this.scene.add(n),this.def=t,this.bg.setLook(t.look);let s=ni(t.num*977),r=e.stage,a=[],o=[];this.movers=[];for(let E of e.bodies){let g=[];for(let M of E.shapes){let R=Yu(M,s);g.push(...R.geos),E.motion?o.push(...R.lights.map(I=>({...I,body:E}))):o.push(...R.lights)}if(E.motion){let M=new ye,R=new Ht(un(g),this.matPlay);R.frustumCulled=!1,M.add(R);let I=o.filter(N=>N.body===E);I.length&&M.add(Sn(I,this.lightMat)),n.add(M);let P={body:E,group:M};if(E.status){let N=E.shapes[0];P.status=Sn([{x:0,y:N.h/2-.6,z:1.2,c:[1,0,0],s:1.4},{x:0,y:-N.h/2+.6,z:1.2,c:[1,0,0],s:1.4},{x:0,y:0,z:1.2,c:[1,0,0],s:1.1}],Si()),M.add(P.status)}this.movers.push(P)}else a.push(...g)}let l=o.filter(E=>!E.body);this.goalVis=[];for(let E of e.goals){if(E.type==="rescue"){this.goalVis.push(null);continue}let g={goal:E,group:new ye},M=ju(dx,{uColor:{value:new Tt(.4,.95,1)},uTime:{value:0},uAlpha:{value:1}}),R=E.shape==="box"?Math.max(E.w,E.h)*.9+1.2:E.r*2+.6,I=new Ht(new Nn(R,R),M);I.position.z=.5,g.ring=I,g.ringMat=M,g.group.add(I);let P=[];if(E.type==="dock"){let N=E.mouth,k=[];if(N.dir==="left"){for(let F of[-1,1])k.push(Gt(.5,.5,-1,1,N.x+.25,N.y+F*2.05,0,[.6,.6,.6],1));k.push(Gt(.2,3.4,-6,0,N.x+3.5,N.y,0,[.25,.85,.55],2));for(let F=0;F<4;F++)for(let H of[-1,1])P.push({x:N.x+.5+F*.9,y:N.y+H*1.75,z:.9,c:[.3,1,.55],s:.45,blink:1.2,phase:F*.15})}else{for(let F of[-1,1])k.push(Gt(.5,.5,-1,1,N.x+F*2.05,N.y-.25,0,[.6,.6,.6],1));k.push(Gt(3.4,.2,-6,0,N.x,N.y-3.5,0,[.25,.85,.55],2));for(let F=0;F<4;F++)for(let H of[-1,1])P.push({x:N.x+H*1.75,y:N.y-.5-F*.9,z:.9,c:[.3,1,.55],s:.45,blink:1.2,phase:F*.15})}a.push(...k)}else{let N=[],k=E.dockAngle??0,F=Math.cos(k),H=Math.sin(k),W=E.x+F*(E.r*.95),Z=E.y+H*(E.r*.95);if(E.label==="HANDHOLD"){N.push(Gt(.25,1.6,-.6,.6,W,Z,k,[.7,.7,.7],1));let Q=new _n(.45,.07,6,16,Math.PI);Q.rotateZ(k+Math.PI/2),Q.translate(W-F*.15,Z-H*.15,.2),N.push(hn(Q,[1,.6,.2],2))}else N.push(Gt(.3,2.2,-.6,.7,W,Z,k,[.3,.32,.36])),N.push(Gt(.08,1.8,.7,.75,W-F*.16,Z-H*.16,k,[.4,.95,1],2));if(E.body){let Q=this.movers.find(dt=>dt.body.tag===E.body),rt=new Ht(un(N),this.matPlay);rt.frustumCulled=!1,Q.group.add(rt),g.onBody=Q}else a.push(...N);P.push({x:W,y:Z,z:.9,c:[1,.65,.2],s:.7,blink:1})}P.length&&n.add(Sn(P,this.lightMat)),n.add(g.group),this.goalVis.push(g)}let c=new Ht(un(a),this.matPlay);c.frustumCulled=!1,n.add(c),l.length&&n.add(Sn(l,this.lightMat)),this.wellVis=(e.wells||[]).map(E=>{let g=ju(fx,{uTime:{value:0},uColor:{value:new Tt(.75,.55,1)}}),M=E.range*1.3,R=new Ht(new Nn(M,M),g);R.position.set(E.x,E.y,-.5),n.add(R);let I=new Ht(new qe(E.core*.8,20,14),new rn({color:327688}));I.position.set(E.x,E.y,0),n.add(I);let P=new _n(E.core*1.15,.07,8,48),N=new Ht(P,new rn({color:15255807,transparent:!0,blending:Fn}));N.position.set(E.x,E.y,.1),n.add(N);let k=[];for(let H=0;H<4;H++){let W=H*Math.PI/2+Math.PI/4;k.push(Gt(.6,.6,-4,-2.5,E.x+Math.cos(W)*E.core*2.6,E.y+Math.sin(W)*E.core*2.6,W,[.3,.3,.35]))}let F=new Ht(un(k),this.matPlay);return n.add(F),{w:E,mat:g,ring:N}}),this.ventVis=(e.vents||[]).map(E=>{let g=[Gt(E.width+1,1.2,-2,.9,E.x+Math.cos(E.dir)*.6,E.y+Math.sin(E.dir)*.6,E.dir+Math.PI/2,[.35,.36,.38],1)],M=new Ht(un(g),this.matPlay);n.add(M);let R=-Math.sin(E.dir),I=Math.cos(E.dir),P=Sn([{x:E.x+R*(E.width/2+.6)+Math.cos(E.dir)*1.3,y:E.y+I*(E.width/2+.6)+Math.sin(E.dir)*1.3,z:1,c:[1,.15,.1],s:1.2},{x:E.x-R*(E.width/2+.6)+Math.cos(E.dir)*1.3,y:E.y-I*(E.width/2+.6)+Math.sin(E.dir)*1.3,z:1,c:[1,.15,.1],s:1.2}],Si());return n.add(P),{v:E,lp:P}}),this.pickVis=e.pickups.map(E=>{let g=new ye,M=new Ht(new Ie(.28,.28,.8,12),new Dn({color:14212580,roughness:.4})),R=new Ht(new Ie(.3,.3,.22,12),new rn({color:5628159}));return g.add(M,R),g.add(Sn([{x:0,y:0,z:.3,c:[.3,.85,1],s:2.4,blink:-3}],this.lightMat)),g.position.set(E.x,E.y,0),n.add(g),{p:E,g}}),e.npc&&(this.ren=new hr({accent:3134648,light:16728128,beacon:16722474,suit:13620958,visorGlow:4198416}),this.scene.add(this.ren.root));let h=Zu(t,r,t.num*131),d=(E,g)=>{if(!E)return;let M=new Ht(E,g);M.frustumCulled=!1,n.add(M)};d(h.back,this.matBack),d(h.mid,this.matMid),d(h.far,this.matFar),n.add(Sn(h.lights,this.lightMat)),n.add(Sn(h.farLights,this.farLightMat));let u=Ju(r,t.num*17,t.look.fgDensity??1);this.fgTop=new ye,this.fgBot=new ye;for(let[E,g]of[[this.fgTop,u.top],[this.fgBot,u.bot]]){if(!g.geo)continue;let M=new Ht(g.geo,this.matFg);if(M.frustumCulled=!1,M.renderOrder=10,E.add(M),g.lights.length){let R=Sn(g.lights,this.lightMat);R.renderOrder=11,E.add(R)}n.add(E)}let f=[],p=r.bounds,y=Math.min(900,Math.floor((p.x1-p.x0)*(p.y1-p.y0)*.06));for(let E=0;E<y;E++){let g=s()<.25;f.push({x:p.x0+s()*(p.x1-p.x0),y:p.y0+s()*(p.y1-p.y0),z:-2.5+s()*5,c:g?[.5,.35,.25]:[.3,.38,.5],s:.05+s()*.07,blink:-(.5+s()),phase:s()})}n.add(Sn(f,this.lightMat));let x=new Fi(1,0),m=Math.round(70*(t.look.debris??1)),b=new Vs(x,this.matFar,m),T=new Qt,v=new sn,w=new yn;this.rocks=[];for(let E=0;E<m;E++){let g={x:r.bounds.x0+s()*(r.bounds.x1-r.bounds.x0+300)-80,y:(s()-.3)*160,z:-160-s()*160,s:.8+s()*3,rx:s()*6,ry:s()*6,w:(s()-.5)*.3};this.rocks.push(g)}b.instanceColor=new ui(new Float32Array(m*3).fill(.32),3),this.rockInst=b,b.frustumCulled=!1,n.add(b),this._m4=T,this._q=v,this._e=w;let A=e.player;this.cam.x=A.x+4,this.cam.y=A.y,this.cam.vx=this.cam.vy=0,this.cam.h=10,this.hero.visAngle=A.angle,this.hero.flail=0,this.particles.clear(),this.shake=0,this.ventEmit=0,this.streak=0}snapCamera(t,e){for(let n=0;n<240;n++)this.updateCamera(t,1/60,e||{showDrift:!0});this.cam.vx=this.cam.vy=0,this.shake=0}rebind(t){let e=t.bodies.filter(s=>s.motion);this.movers.forEach((s,r)=>{s.body=e[r]}),this.goalVis.forEach((s,r)=>{s&&(s.goal=t.goals[r])}),this.wellVis.forEach((s,r)=>{s.w=t.wells[r]}),this.ventVis.forEach((s,r)=>{s.v=t.vents[r]}),this.pickVis.forEach((s,r)=>{s.p=t.pickups[r]});let n=t.player;this.cam.x=n.x+4,this.cam.y=n.y,this.cam.vx=this.cam.vy=0,this.cam.h=10,this.hero.visAngle=n.angle,this.hero.visVel=0,this.hero.flail=0;for(let s in this.hero.j)this.hero.j[s].v=0;this.particles.clear(),this.shake=0}addShake(t){this.shake=Math.min(1.2,this.shake+t)}onEvent(t,e){let n=this.particles,s=e.player;if(t.type==="crash"||t.type==="bump"||t.type==="scrape"){let r=t.type==="crash"?1:t.type==="bump"?Math.min(1,t.strength/3):.25,a=Math.floor(6+r*40);for(let o=0;o<a;o++){let l=Math.atan2(t.ny,t.nx)+(Math.random()-.5)*2.6,c=2+Math.random()*(4+r*10);n.spawn(t.x,t.y,.3,Math.cos(l)*c,Math.sin(l)*c,(Math.random()-.5)*3,.25+Math.random()*.5,.22,.04,1,.65+Math.random()*.3,.3,2.5)}if(t.type==="crash"){for(let o=0;o<26;o++){let l=Math.random()*Math.PI*2,c=Math.random()*3;n.spawn(s.x,s.y,.2,Math.cos(l)*c,Math.sin(l)*c,0,1.2+Math.random(),.15,.9,.85,.92,1,1.2)}this.addShake(.9),this.hero.kick(3)}else t.type==="bump"&&(this.addShake(Math.min(.45,t.strength*.12)),this.hero.kick(t.strength*.8))}else if(t.type==="latch"||t.type==="clunk"){for(let r=0;r<18;r++){let a=Math.random()*Math.PI*2,o=1+Math.random()*3;n.spawn(s.x,s.y,.3,Math.cos(a)*o,Math.sin(a)*o,0,.35,.3,.05,.4,1,.8,3)}this.addShake(t.type==="clunk"?.25:.15),this.hero.kick(1)}else if(t.type==="release")this.addShake(.12);else if(t.type==="slip"||t.type==="shove"){for(let r=0;r<14;r++){let a=Math.random()*Math.PI*2,o=1+Math.random()*2;n.spawn(t.x,t.y,.4,Math.cos(a)*o,Math.sin(a)*o,0,.4,.3,.05,1,.5,.2,2)}this.hero.kick(1.6),this.addShake(.2)}else if(t.type==="capture"||t.type==="rescue"){for(let r=0;r<40;r++){let a=Math.random()*Math.PI*2,o=2+Math.random()*4;n.spawn(t.x,t.y,.4,Math.cos(a)*o,Math.sin(a)*o,0,.6+Math.random()*.4,.3,.05,.35,1,.6,2.2)}this.addShake(.12)}else if(t.type==="pickup")for(let r=0;r<30;r++){let a=Math.random()*Math.PI*2,o=1+Math.random()*4;n.spawn(t.x,t.y,.3,Math.cos(a)*o,Math.sin(a)*o,0,.6,.35,.05,.35,.9,1,2)}else t.type==="fail"&&t.cause==="arc"?(this.addShake(.6),this.hero.kick(4)):t.type==="fail"&&t.cause==="well"&&this.addShake(.5)}frame(t,e,n){this.time+=e;let s=this.time,r=t.player,a=this.particles,o=Math.hypot(r.vx,r.vy),l=t.state==="lost",c=t.state==="won";for(let g of this.movers)if(g.group.position.set(g.body.x,g.body.y,0),g.group.rotation.z=g.body.rot,g.status){let M=g.body.status(t.t),R=Math.sin(s*22)>0?1:.1,I=M===1?[.2,1,.45]:M===2?[1*R,.55*R,.05]:[1,.12,.08],P=g.status.geometry.attributes.color;for(let N=0;N<3;N++)P.setXYZ(N,I[0],I[1],I[2]);P.needsUpdate=!0,g.status.material.uniforms.uScale.value=this.pxScale}let h=0;if(l&&t.cause.kind==="well"){let g=t.cause.well;h=Math.min(1,(t.t-t.endT)*.8),r.x+=(g.x-r.x)*Math.min(1,e*1.6),r.y+=(g.y-r.y)*Math.min(1,e*1.6),r.angle=Math.atan2(g.y-r.y,g.x-r.x)}this.hero.update(e,{x:r.x,y:r.y,angle:r.angle,thrusting:r.thrusting,braking:r.braking,turning:r.turning,tumble:r.tumble,latched:!!r.latch,dead:l,docked:c,stretch:h}),h>0?this.hero.root.scale.multiplyScalar(Math.max(.02,1-Math.max(0,h-.5)*1.9)):this.hero.root.scale.setScalar(1.3);let d=r.angle,u=-Math.cos(d),f=-Math.sin(d);if(r.thrusting){this.thrustLight.intensity=5;for(let g=0;g<3;g++){let M=6+Math.random()*4,R=(Math.random()-.5)*.35,I=u*Math.cos(R)-f*Math.sin(R),P=u*Math.sin(R)+f*Math.cos(R);a.spawn(r.x+u*.9,r.y+f*.9,(Math.random()-.5)*.3,r.vx+I*M,r.vy+P*M,0,.25+Math.random()*.15,.32,.9,.3,.7,1,2)}}else this.thrustLight.intensity*=.8;this.thrustLight.position.set(r.x+u*1.2,r.y+f*1.2,1.5);let p=r.braking&&o>.05;if(this.brakeMat.uniforms.uPower.value+=((p?1:0)-this.brakeMat.uniforms.uPower.value)*Math.min(1,e*20),this.brakeMat.uniforms.uTime.value=s,o>.05){let g=r.vx/o,M=r.vy/o,R=Math.cos(d),I=Math.sin(d),P=-I,N=R;if([-1,1].forEach((k,F)=>{let H=this.brakeFlames[F];H.position.set(r.x+R*.45+P*k*.28,r.y+I*.45+N*k*.28,.25*k),H.rotation.set(0,0,Math.atan2(M,g)+Math.PI/2),H.scale.set(1,.4+Math.random()*.25,1)}),p&&Math.random()<.8){let k=Math.random()<.5?-1:1;a.spawn(r.x+R*.45+P*k*.28,r.y+I*.45+N*k*.28,0,r.vx+g*5,r.vy+M*5,0,.2,.18,.5,.6,.85,1,3)}}l&&t.cause.kind==="impact"&&Math.random()<.5&&a.spawn(r.x,r.y,.2,r.vx+(Math.random()-.5)*2,r.vy+(Math.random()-.5)*2,0,1,.12,.5,.6,.65,.7,.8);for(let g of this.wellVis)if(g.mat.uniforms.uTime.value=s,g.ring.rotation.z=s,Math.random()<.6){let M=Math.random()*Math.PI*2,R=g.w.range*(.5+Math.random()*.4),I=g.w.x+Math.cos(M)*R,P=g.w.y+Math.sin(M)*R,N=Math.sqrt(g.w.gm/R)*.9;a.spawn(I,P,-.2,-Math.sin(M)*N-Math.cos(M)*1.2,Math.cos(M)*N-Math.sin(M)*1.2,0,2.5,.15,.05,.7,.5,1,0)}for(let g of this.ventVis){let M=g.v,R=Fc(M,t.t),I=zo(M,t.t),P=I?1:R>0?Math.sin(s*30)>0?1:.15:.12;g.lp.material.uniforms.uTime.value=s,g.lp.material.uniforms.uScale.value=this.pxScale;let N=g.lp.geometry.attributes.color;for(let k=0;k<2;k++)N.setXYZ(k,P,P*.15,P*.1);if(N.needsUpdate=!0,I){let k=Math.cos(M.dir),F=Math.sin(M.dir);for(let H=0;H<7;H++){let W=(Math.random()-.5)*M.width,Z=14+Math.random()*8;a.spawn(M.x-F*W+k*1,M.y+k*W+F*1,(Math.random()-.5)*2,k*Z+(Math.random()-.5)*2,F*Z,0,.6+Math.random()*.3,.6,2.2,.55,.62,.7,1.4)}}}for(let g of t.fields)if(Math.random()<.9)for(let M=0;M<2;M++){let R=g.x0+Math.random()*(g.x1-g.x0),I=Math.min(g.y1,this.cam.y+16)-Math.random()*30;a.spawn(R,I,-1-Math.random()*3,g.ax*8,g.ay*8,0,1.6,.12,.12,.65,.4,1,0)}if(t.tide){let M=t.tide(this.cam.x,0).ax;for(let R=0;R<3;R++){if(Math.random()>.3+M*.4)continue;let I=this.cam.x-22+Math.random()*40,P=this.cam.y+(Math.random()-.5)*26,N=Math.random()<.5;a.spawn(I,P,-2-Math.random()*6,6+M*10,0,0,1.2,.1,.14,N?1:.4,N?.45:.75,N?.2:1,0)}}for(let g of this.pickVis)g.g.visible=!g.p.taken,g.g.rotation.set(s*.7,0,s*1.1);if(this.ren&&t.npc){let g=t.npc;if(this.ren.update(e,{x:g.x,y:g.y,angle:g.angle,thrusting:!1,braking:!1,turning:0,tumble:g.spin,latched:!1,dead:!1,docked:!1,beaconSolid:!1}),g.carried&&Math.random()<.3){let M=Math.random();a.spawn(r.x+(g.x-r.x)*M,r.y+(g.y-r.y)*M,.2,0,0,0,.15,.12,.05,1,.6,.2,0)}}let y=t.goalIndex;for(let g=0;g<this.goalVis.length;g++){let M=this.goalVis[g];if(!M)continue;M.group.visible=g===y||c;let R=Ze(t,M.goal);M.ring.position.x=R.x,M.ring.position.y=R.y,M.ring.rotation.z=R.rot,M.ringMat.uniforms.uTime.value=s;let I=Math.hypot(r.vx-R.vx,r.vy-R.vy),P=Math.hypot(r.x-R.x,r.y-R.y)<14,N=M.ringMat.uniforms.uColor.value;c?N.setRGB(.3,1,.5):P&&I>M.goal.maxSpeed?N.setRGB(1,.35+.2*Math.sin(s*20),.2):P?N.setRGB(.3,1,.55):N.setRGB(.4,.9,1),M.ringMat.uniforms.uAlpha.value=.7+.3*Math.sin(s*4)}if(t.state==="play"&&n.showDrift){let g=r.latch?7:2.6,M=t.predict(g,r.latch?.11:.065,this._pred||(this._pred=[])),R=r.latch?1:Math.min(1,.25+o*.4);this.drift.set(M,r.x,r.y,{alpha:R,latched:!!r.latch,t:s},this.pxScale),this.drift.points.visible=!0,this.lastPrediction=M}else this.drift.points.visible=!1,this.lastPrediction=null;let x=this.rocks,m=this._m4,b=this._q,T=this._e;for(let g=0;g<x.length;g++){let M=x[g];T.set(M.rx+s*M.w,M.ry+s*M.w*.7,0),b.setFromEuler(T),vc.set(M.x+s*.3,M.y,M.z),Mc.set(M.s,M.s*.8,M.s),m.compose(vc,b,Mc),this.rockInst.setMatrixAt(g,m)}this.rockInst.instanceMatrix.needsUpdate=!0,this.updateCamera(t,e,n);for(let g of[this.matPlay,this.matBack,this.matMid,this.matFar])g.uniforms.uTime.value=s;this.lightMat.uniforms.uTime.value=s,this.lightMat.uniforms.uScale.value=this.pxScale,this.farLightMat.uniforms.uTime.value=s,this.farLightMat.uniforms.uScale.value=this.pxScale;for(let g of this.stageGroup.children)g.isPoints&&g.material!==this.lightMat&&g.material!==this.farLightMat&&g.material.uniforms&&(g.material.uniforms.uTime.value=s,g.material.uniforms.uScale.value=this.pxScale);a.update(e,this.pxScale);let w=(this.cam.h/Lo-10.5)*Lo-6.2;this.fgTop.position.y=this.cam.y*.92+w,this.fgBot.position.y=this.cam.y*.92-w;let A=vc.set(r.x,r.y,0).project(this.camera);this.matFg.uniforms.uPlayer.value.set(A.x*.5+.5,A.y*.5+.5);let E=t.goal?t.goal.type==="rescue"?t.npc:Ze(t,t.goal):null;if(E){let g=Mc.set(E.x,E.y,0).project(this.camera);this.matFg.uniforms.uGoal.value.set(g.x*.5+.5,g.y*.5+.5)}this.bg.render(s,this.cam.x*9e-4,this.cam.y*.0012),this.renderer.render(this.scene,this.camera)}updateCamera(t,e,n){let s=t.player,r=this.cam,a=Math.hypot(s.vx,s.vy),o=s.x+Qu(s.vx*.7,7)+2.5*Math.cos(s.angle)*.4,l=s.y+Qu(s.vy*.5,4.5),c=9.4+Math.min(5,Math.max(0,a-2.5)*.6);s.latch&&(c=14);let h=t.goal;if(h&&h.type!=="rescue"){let b=Ze(t,h),T=Math.hypot(b.x-s.x,b.y-s.y),v=Math.max(0,Math.min(1,(22-T)/14));o+=((s.x+b.x)/2-o)*v*.6,l+=((s.y+b.y)/2-l)*v*.6,c=c*(1-v*.25)+Math.max(8.5,T*.45)*v*.25}c*=n.zoom||1,n.cinematic&&(o=n.cinematic.x,l=n.cinematic.y,c=n.cinematic.h),t.state==="won"&&(c=8);let d=n.cinematic?2:5,u=(o-r.x)*d*d-r.vx*2*d,f=(l-r.y)*d*d-r.vy*2*d;r.vx+=u*e,r.vy+=f*e,r.x+=r.vx*e,r.y+=r.vy*e,r.h+=(c-r.h)*Math.min(1,e*1.6),this.shake*=Math.exp(-e*4.5);let p=this.shake*this.shake*.9,y=(Math.random()-.5)*p,x=(Math.random()-.5)*p,m=r.h/Lo;this.camera.position.set(r.x+y,r.y-1.5+x,m),this.camera.lookAt(r.x+y*.5,r.y+x*.5,0),this.camera.rotation.z+=y*.01}toScreen(t,e,n=0){let s=new U(t,e,n).project(this.camera);return{x:(s.x*.5+.5)*window.innerWidth,y:(-s.y*.5+.5)*window.innerHeight,behind:s.z>1}}},vc=new U,Mc=new U;function Qu(i,t){return i>t?t:i<-t?-t:i}var Do=class{constructor(t){this.keys=new Set,this.touch={left:!1,right:!1,thrust:!1,brake:!1},this.onAction=null,this.any=!1,addEventListener("keydown",o=>{if(o.repeat){ed(o.code)&&o.preventDefault();return}this.keys.add(o.code),this.any=!0,ed(o.code)&&o.preventDefault();let l={KeyR:"retry",Escape:"pause",KeyP:"pause",Enter:"confirm",Space:"space",KeyM:"mute",KeyN:"next"};l[o.code]&&this.onAction&&this.onAction(l[o.code],o)}),addEventListener("keyup",o=>this.keys.delete(o.code)),addEventListener("blur",()=>{this.keys.clear();for(let o in this.touch)this.touch[o]=!1}),this.pads=[...t.querySelectorAll("[data-pad]")];let e=new Map,n=(o,l)=>{for(let c of this.pads){let h=c.getBoundingClientRect(),d=10;if(o>=h.left-d&&o<=h.right+d&&l>=h.top-d&&l<=h.bottom+d)return c.dataset.pad}return null},s=()=>{for(let o in this.touch)this.touch[o]=!1;for(let o of e.values())o&&(this.touch[o]=!0);for(let o of this.pads)o.classList.toggle("on",this.touch[o.dataset.pad])},r=t.querySelector("#touch");r.addEventListener("pointerdown",o=>{let l=n(o.clientX,o.clientY);l&&(o.preventDefault(),this.any=!0,r.setPointerCapture(o.pointerId),e.set(o.pointerId,l),s())}),r.addEventListener("pointermove",o=>{e.has(o.pointerId)&&(e.set(o.pointerId,n(o.clientX,o.clientY)),s())});let a=o=>{e.delete(o.pointerId),s()};r.addEventListener("pointerup",a),r.addEventListener("pointercancel",a)}read(){let t=this.keys,e=t.has("ArrowLeft")||t.has("KeyA")||this.touch.left,n=t.has("ArrowRight")||t.has("KeyD")||this.touch.right;return{turn:(e?1:0)-(n?1:0),thrust:t.has("ArrowUp")||t.has("KeyW")||t.has("Space")||this.touch.thrust,brake:t.has("ArrowDown")||t.has("KeyS")||t.has("ShiftLeft")||t.has("ShiftRight")||this.touch.brake}}};function ed(i){return["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(i)}var Uo=class{constructor(){this.ctx=null,this.muted=!1,this.breathT=0,this.warnT=0}init(){if(this.ctx){this.ctx.state==="suspended"&&this.ctx.resume();return}let t=window.AudioContext||window.webkitAudioContext;if(!t)return;let e=new t;this.ctx=e;let n=e.createDynamicsCompressor();n.threshold.value=-16,n.ratio.value=4,this.master=e.createGain(),this.master.gain.value=this.muted?0:.8,this.master.connect(n).connect(e.destination);let s=e.sampleRate*2,r=e.createBuffer(1,s,e.sampleRate),a=r.getChannelData(0);for(let c=0;c<s;c++)a[c]=Math.random()*2-1;this.noise=r,this.thr=this.loopNoise(420,"lowpass",.9),this.thrHi=this.loopNoise(2400,"bandpass",.6),this.thrRumble=this.osc("sine",52),this.brk=this.loopNoise(2600,"bandpass",2.5);let o=e.createOscillator();o.type="square",o.frequency.value=16;let l=e.createGain();l.gain.value=.5,o.connect(l).connect(this.brk.g.gain),o.start(),this.brkLfo=l,this.amb=this.osc("sawtooth",41,140),this.amb2=this.osc("sawtooth",41.7,140),this.amb.g.gain.value=.02,this.amb2.g.gain.value=.02,this.wellHum=this.osc("sine",38),this.wellHum2=this.osc("triangle",57)}loopNoise(t,e,n){let s=this.ctx,r=s.createBufferSource();r.buffer=this.noise,r.loop=!0;let a=s.createBiquadFilter();a.type=e,a.frequency.value=t,a.Q.value=n;let o=s.createGain();return o.gain.value=0,r.connect(a).connect(o).connect(this.master),r.start(),{src:r,f:a,g:o}}osc(t,e,n){let s=this.ctx,r=s.createOscillator();r.type=t,r.frequency.value=e;let a=s.createGain();if(a.gain.value=0,n){let o=s.createBiquadFilter();o.type="lowpass",o.frequency.value=n,r.connect(o).connect(a)}else r.connect(a);return a.connect(this.master),r.start(),{o:r,g:a}}setMuted(t){this.muted=t,this.master&&this.master.gain.setTargetAtTime(t?0:.8,this.ctx.currentTime,.05)}update(t,e){if(!this.ctx)return;let n=this.ctx.currentTime,s=(a,o,l=.04)=>a.setTargetAtTime(o,n,l);s(this.thr.g.gain,e.thrusting?.5:0,e.thrusting?.02:.06),s(this.thrHi.g.gain,e.thrusting?.07:0),s(this.thrRumble.g.gain,e.thrusting?.25:0),s(this.thr.f.frequency,380+e.speed*18),s(this.brk.g.gain,e.braking?.09:0,.02),s(this.brkLfo.gain,e.braking?.09:0,.02);let r=e.anomaly||0;if(s(this.amb.g.gain,.02+r*.03,.5),s(this.amb2.g.gain,.02+r*.03,.5),s(this.amb.o.frequency,41-r*8,1),s(this.wellHum.g.gain,e.well*.22,.1),s(this.wellHum2.g.gain,e.well*.06,.1),s(this.wellHum.o.frequency,34+e.well*22,.1),e.alive&&(this.breathT-=t,this.breathT<=0)){let a=Math.min(1,e.stress),o=3.6-a*2;this.breathT=o,this.breath(o*.42,.018+a*.02,!0),setTimeout(()=>this.breath(o*.5,.014+a*.018,!1),o*450)}e.danger?(this.warnT-=t,this.warnT<=0&&(this.beep(1046,.07,.05),this.warnT=.22)):this.warnT=0}breath(t,e,n){if(!this.ctx||this.muted)return;let s=this.ctx,r=s.currentTime,a=s.createBufferSource();a.buffer=this.noise;let o=s.createBiquadFilter();o.type="bandpass",o.Q.value=.9,o.frequency.setValueAtTime(n?700:1100,r),o.frequency.linearRampToValueAtTime(n?1200:600,r+t);let l=s.createGain();l.gain.setValueAtTime(0,r),l.gain.linearRampToValueAtTime(e,r+t*.35),l.gain.linearRampToValueAtTime(0,r+t),a.connect(o).connect(l).connect(this.master),a.start(r,Math.random()),a.stop(r+t+.05)}beep(t,e,n,s="sine",r=0){if(!this.ctx)return;let a=this.ctx,o=a.currentTime+r,l=a.createOscillator();l.type=s,l.frequency.value=t;let c=a.createGain();c.gain.setValueAtTime(0,o),c.gain.linearRampToValueAtTime(n,o+.008),c.gain.exponentialRampToValueAtTime(1e-4,o+e),l.connect(c).connect(this.master),l.start(o),l.stop(o+e+.02)}thump(t,e,n,s){if(!this.ctx)return;let r=this.ctx,a=r.currentTime,o=r.createOscillator();o.type="sine",o.frequency.setValueAtTime(t,a),o.frequency.exponentialRampToValueAtTime(e,a+n);let l=r.createGain();l.gain.setValueAtTime(s,a),l.gain.exponentialRampToValueAtTime(1e-4,a+n),o.connect(l).connect(this.master),o.start(a),o.stop(a+n+.02)}burst(t,e,n,s,r=1,a){if(!this.ctx)return;let o=this.ctx,l=o.currentTime,c=o.createBufferSource();c.buffer=this.noise;let h=o.createBiquadFilter();h.type=e,h.frequency.setValueAtTime(t,l),h.Q.value=r,a&&h.frequency.exponentialRampToValueAtTime(a,l+n);let d=o.createGain();d.gain.setValueAtTime(s,l),d.gain.exponentialRampToValueAtTime(1e-4,l+n),c.connect(h).connect(d).connect(this.master),c.start(l,Math.random()),c.stop(l+n+.02)}event(t){if(this.ctx)switch(t.type){case"bump":{let e=Math.min(1,t.strength/3.5);this.thump(110,40,.25,.25+e*.5),this.burst(500,"lowpass",.18,.15+e*.3);break}case"scrape":this.burst(1800,"bandpass",.12,.06,3,900);break;case"crash":this.thump(90,28,.6,1),this.burst(320,"lowpass",.5,.8),this.burst(4200,"bandpass",.35,.25,2,2e3),this.burst(2500,"highpass",1.6,.12,.5),[0,.3,.6].forEach(e=>{this.beep(740,.18,.08,"square",.35+e),this.beep(554,.18,.08,"square",.5+e)});break;case"latch":this.thump(160,55,.22,.6),this.beep(2400,.03,.08,"square");break;case"clunk":this.thump(120,45,.2,.5);break;case"release":this.burst(1200,"bandpass",.15,.1,1.5,3e3),this.beep(880,.06,.04);break;case"capture":this.thump(140,60,.3,.6),this.beep(2600,.04,.08,"square"),this.beep(660,.5,.08,"sine",.1),this.beep(990,.7,.07,"sine",.22),this.beep(1320,.9,.05,"sine",.34);break;case"rescue":this.thump(130,60,.25,.5),this.beep(523,.25,.06,"sine",.05),this.beep(784,.4,.06,"sine",.18);break;case"win":this.burst(3e3,"lowpass",1.4,.2,.7,300);break;case"slip":this.burst(2200,"bandpass",.22,.12,4,700),this.beep(330,.15,.05,"triangle");break;case"shove":this.thump(100,45,.25,.5),this.beep(300,.2,.05,"triangle");break;case"pickup":this.beep(880,.08,.06),this.beep(1320,.12,.06,"sine",.07),this.beep(1760,.2,.05,"sine",.14);break;case"dry":this.beep(220,.25,.08,"square"),this.beep(180,.3,.08,"square",.28);break;case"knocked":this.thump(90,40,.3,.5);break;case"vent":this.burst(600,"lowpass",1.2,.25*(t.vol||1),.8,200);break;case"fail":t.cause==="well"&&(this.thump(200,20,1.5,.6),this.burst(800,"bandpass",1.4,.3,1,60)),t.cause==="arc"&&(this.burst(5e3,"highpass",.5,.4),this.beep(60,.5,.3,"sawtooth")),(t.cause==="void"||t.cause==="missed"||t.cause==="npcvoid")&&this.beep(392,.6,.06,"triangle");break;case"ui":this.beep(1200,.04,.04);break}}};function nd(i,t=0){let e=typeof t=="number"?i.routes[t]:i.routes.find(n=>n.id===t);if(!e)throw new Error(`stage ${i.id} has no route ${t}`);return Gc(e.plan)}var Mt=i=>document.getElementById(i),Fo=i=>{let t=Math.floor(i/60),e=i-t*60;return`${String(t).padStart(2,"0")}:${e.toFixed(1).padStart(4,"0")}`},id=(i,t)=>i[Math.abs(Math.floor(t))%i.length],sd={impact:["SUIT BREACH",["The truss won.","Space is mostly empty. You found the part that isn\u2019t.","Momentum: still undefeated.","That\u2019s one way to stop.","The station is fine. Thanks for asking.","You arrived. All at once."]],well:["SPAGHETTIFIED",["The well said hi.","You are now forty metres tall and two centimetres wide.","Gravity assist: declined.","Too slow, too close. Very, very long now."]],void:["LOST TO THE DARK",["Rescue ETA: four years.","Your beacon will ping forever. Very faithfully.","Bold heading. Wrong universe.","Nothing out there to bounce off. That was the problem."]],horizon:["PAST THE HORIZON",["The anomaly keeps what it takes.","From outside, you\u2019ll be falling forever. Neat.","The pull won the argument."]],missed:["MISSED YOUR RIDE",["The hangar sealed. The shuttle didn\u2019t wait.","Next shuttle: Thursday. Probably.","You and the shuttle were never really on the same page."]],arc:["FRIED",["Live conduit. You found it."]],npcvoid:["REN DRIFTED AWAY",["You bowled Ren into deep space. She saw it coming.","She\u2019ll write. Eventually."]],npcwell:["REN SPAGHETTIFIED",["Ren was very tall for a moment.","That one\u2019s going in the incident report."]]},mx={AIRLOCK:"DOCKED",HANDHOLD:"HOLDING ON","MAG PLATE":"MAG-LOCKED","CARGO CLAMP":"CLAMPED ON",LIFEBOAT:"BOTH OF YOU HOME","HORIZON LOCK":"MADE IT"},bc=class{constructor(){this.key="space-drift-zero/v1",this.data={};try{this.data=JSON.parse(localStorage.getItem(this.key)||"{}")||{}}catch{this.data={}}}get(t){return this.data[t]||null}put(t,e){let n=this.data[t]||{};this.data[t]={best:n.best?Math.min(n.best,e.time):e.time,stars:Math.max(n.stars||0,e.stars),fuel:n.fuel!=null?Math.min(n.fuel,e.fuel):e.fuel};try{localStorage.setItem(this.key,JSON.stringify(this.data))}catch{}}pref(t,e){if(e===void 0)return this.data["_"+t];this.data["_"+t]=e;try{localStorage.setItem(this.key,JSON.stringify(this.data))}catch{}}},Sc=class{constructor(){this.r=new No(Mt("gl")),this.input=new Do(document.body),this.audio=new Uo,this.save=new bc,this.audio.muted=!!this.save.pref("muted"),this.mode="title",this.stageIndex=0,this.attempts=0,this.slow=1,this.hitstop=0,this.acc=0,this.forced=null,this.view={showDrift:!0,cinematic:null,zoom:1},this.hintQ=[],this.isTouch=matchMedia("(pointer: coarse)").matches||"ontouchstart"in window,document.body.classList.toggle("touch",this.isTouch),this.isTouch&&Math.min(innerWidth,innerHeight)<500&&(this.view.zoom=.88),this.input.onAction=(t,e)=>this.action(t,e),document.addEventListener("click",t=>{let e=t.target.closest("[data-act]");e&&(this.audio.init(),this.audio.event({type:"ui"}),this.action(e.dataset.act))}),Mt("btnRetry").addEventListener("click",()=>this.retry()),Mt("btnPause").addEventListener("click",()=>this.togglePause()),Mt("result").addEventListener("pointerdown",t=>{t.target.closest("button")||this.world&&this.world.state==="lost"&&this.resultShown&&this.retry()}),addEventListener("pointerdown",()=>this.audio.init(),{once:!1}),addEventListener("keydown",()=>this.audio.init()),addEventListener("resize",()=>this.r.resize()),document.addEventListener("visibilitychange",()=>{document.hidden&&this.mode==="play"&&this.world.state==="play"&&this.pause(!0)}),this.buildSelect(),this.loadTitleScene(),this.mode="title",this.updateMuteLabel(),this.last=performance.now(),this.fpsT=0,this.fpsN=0,this.quality=2,requestAnimationFrame(t=>this.loop(t))}action(t,e){if(t==="mute"){this.audio.setMuted(!this.audio.muted),this.save.pref("muted",this.audio.muted),this.updateMuteLabel();return}if(this.mode==="title"){t==="play"||t==="confirm"?this.startPlay(this.firstUnfinished()):t==="stages"&&this.showSelect();return}if(this.mode==="select"){(t==="back"||t==="pause")&&this.showTitle();return}if(this.mode==="paused"){t==="resume"||t==="pause"?this.pause(!1):t==="retry"?(this.pause(!1),this.retry()):t==="stages"&&(this.pause(!1),this.showSelect());return}this.mode==="play"&&(t==="retry"?this.retry():t==="pause"?this.togglePause():t==="next"||t==="confirm"?this.world.state==="won"&&this.resultShown?this.next():this.world.state==="lost"&&this.resultShown&&this.retry():t==="space"&&this.world.state==="lost"&&this.resultShown?this.retry():t==="stages"&&this.showSelect())}firstUnfinished(){for(let t=0;t<Je.length;t++)if(!this.save.get(Je[t].id))return t;return 0}showTitle(){this.mode="title",Mt("title").classList.remove("hide"),Mt("select").classList.add("hide"),Mt("result").classList.add("hide"),Mt("hud").classList.remove("on"),Mt("playBtn").firstChild.textContent=this.firstUnfinished()>0?"CONTINUE":"BEGIN EVA",this.loadTitleScene()}loadTitleScene(){if(this.titleLoaded&&this.def===Je[Je.length-1]&&this.preview)return;this.loadStage(Je.length-1,!0),this.titleLoaded=!0;let t=this.world.player;t.x=119,t.y=5,t.vx=t.vy=0,t.angle=.35,this.r.snapCamera(this.world,{cinematic:{x:t.x-5.5,y:t.y+.6,h:7.2}})}showSelect(){this.mode="select",this.buildSelect(),Mt("title").classList.add("hide"),Mt("result").classList.add("hide"),Mt("select").classList.remove("hide"),Mt("hud").classList.remove("on")}buildSelect(){let t=(e,n,s)=>{e.innerHTML="",n.forEach((r,a)=>{let o=this.save.get(r.id),l=document.createElement("button");l.className="stage-card"+(r.experimental?" lab":"");let c=o?"\u2605".repeat(o.stars)+`<i>${"\u2605".repeat(3-o.stars)}</i>`:"<i>\u2605\u2605\u2605</i>";l.innerHTML=`<span class="n">${r.experimental?"LAB":String(r.num).padStart(2,"0")}</span><span class="st">${c}</span><span class="nm">${r.name}</span><span class="ch">${r.chapter}</span><span class="bt">${o?"BEST "+Fo(o.best):"\u2014"}</span>`,l.addEventListener("click",()=>{this.audio.init(),this.startPlay(s+a)}),e.appendChild(l)})};t(Mt("grid"),Je,0),t(Mt("labGrid"),Sr,Je.length)}startPlay(t){Mt("title").classList.add("hide"),Mt("select").classList.add("hide"),this.mode="play",this.attempts=0,this.view.cinematic=null,this.loadStage(t,!1)}loadStage(t,e){this.stageIndex=t;let n=$o[t];this.def=n,this.world=new gr(n),this.r.loadStage(n,this.world),this.preview=e,this.resetAttemptState(),e||this.beginAttempt(!0)}resetAttemptState(){this.resultShown=!1,this.endTimer=0,this.slow=1,this.hitstop=0,this.acc=0,this.closeCall=0,this.hintsShown=new Set,this.hintUntil=0,Mt("result").classList.add("hide"),Mt("crack").style.transition="none",Mt("crack").style.opacity=0,Mt("vignette").style.opacity=0,Mt("hint").classList.remove("on")}beginAttempt(t){this.attempts++,Mt("hud").classList.add("on"),Mt("stNum").textContent=this.def.experimental?"LAB":String(this.def.num).padStart(2,"0"),Mt("stName").textContent=this.def.name,Mt("brNum").textContent=this.def.experimental?`EXPERIMENT \xB7 ${this.def.chapter}`:`STAGE ${String(this.def.num).padStart(2,"0")} \xB7 ${this.def.chapter}`,Mt("brName").textContent=this.def.name,Mt("brText").textContent=this.def.brief;let e=Mt("brief");e.classList.remove("out"),this.briefFading=!1,clearTimeout(this.briefTO),this.briefTO=setTimeout(()=>e.classList.add("out"),t?3200:1400);let n=this.def.hints.find(s=>s.at==="start");n&&this.attempts<=3&&this.showHint(n.text,4,!1,t?2.4:.6)}retry(){this.mode==="paused"&&this.pause(!1),this.autoplan=null,this.mode==="play"&&(this.world.reset(),this.r.rebind(this.world),this.resetAttemptState(),this.beginAttempt(!1))}next(){this.def.experimental?this.showSelect():this.stageIndex+1<Je.length?(this.attempts=0,this.loadStage(this.stageIndex+1,!1)):this.showFinale()}showFinale(){this.mode="select",this.showSelect(),Mt("select").querySelector("h2").textContent="ALL STAGES CLEARED \u2014 CHASE THE STARS"}togglePause(){this.pause(this.mode!=="paused")}pause(t){t&&this.mode==="play"?(this.mode="paused",Mt("pause").classList.remove("hide")):!t&&this.mode==="paused"&&(this.mode="play",Mt("pause").classList.add("hide"),this.last=performance.now())}updateMuteLabel(){Mt("muteBtn").textContent=`SOUND: ${this.audio.muted?"OFF":"ON"}`}showHint(t,e,n,s=0){clearTimeout(this.hintTO),this.isTouch&&(t=t.replace("S CLAMPS.  W LETS GO.","BRAKE CLAMPS.  THRUST LETS GO.").replace("W / \u25B2","THRUST").replace("S / \u25BC","BRAKE").replace("SPACE / R","TAP"));let r=()=>{let a=Mt("hint");a.textContent=t,a.classList.toggle("warn",!!n),a.classList.add("on"),clearTimeout(this.hintTO2),this.hintTO2=setTimeout(()=>a.classList.remove("on"),e*1e3)};s?this.hintTO=setTimeout(r,s*1e3):r()}loop(t){requestAnimationFrame(f=>this.loop(f));let e=Math.min(.05,(t-this.last)/1e3);if(this.last=t,this.mode==="paused"){this.r.frame(this.world,0,this.view);return}this.adaptQuality(e);let n=this.world,s=this.mode==="play",r=s?this.input.read():{turn:0,thrust:!1,brake:!1};this.forced&&(r=this.forced),this.autoplan&&s&&(r=this.autoplan(n)),s&&n.state==="play"&&(r.thrust||r.brake||r.turn||n.started)&&!Mt("brief").classList.contains("out")&&!this.briefFading&&(this.briefFading=!0,clearTimeout(this.briefTO),this.briefTO=setTimeout(()=>Mt("brief").classList.add("out"),500)),this.hitstop>0&&(this.hitstop-=e,e*=.05);let a=e*this.slow;this.slow+=(1-this.slow)*Math.min(1,e*1.5);let o=this.mode==="title"||this.mode==="select";if(!this.manualStep){this.acc+=a;let f=0;for(;this.acc>=Yt.dt&&f<12;)n.step(r),this.acc-=Yt.dt,f++}if(o){let f=n.player,p=t*.001;f.x=119+Math.sin(p*.13)*1.2,f.y=5+Math.sin(p*.19)*.8,f.vx=Math.cos(p*.13)*.16,f.vy=Math.cos(p*.19)*.15,f.angle=.35+Math.sin(p*.21)*.25,f.tumble=0,f.turnRate=0,f.thrusting=Math.sin(p*.9)>.985,f.braking=!1,n.state="play",n.events.length=0}this.drainEvents(),this.view.cinematic=o?{x:n.player.x-5.5+Math.sin(t*7e-5)*1.5,y:n.player.y+.6+Math.sin(t*11e-5)*.6,h:7.2}:null,this.view.showDrift=s,document.body.classList.toggle("playing",this.mode==="play"||this.mode==="paused"),this.r.frame(n,e,this.view),s&&this.updateHud(e);let l=n.player,c=this.r.lastPrediction,h=!!(c&&c.length&&c[c.length-1].danger)&&n.state==="play"&&s;h&&c.length*.065<.7&&(this.closeCall=n.t);let d=0;for(let f of n.wells)d=Math.max(d,1-Math.min(1,Math.hypot(l.x-f.x,l.y-f.y)/f.range));let u=n.tide?Math.min(1,n.tide(l.x,l.y).ax/1.5):Math.min(1,(this.def.num||5)/10);this.audio.update(e,{thrusting:s&&l.thrusting,braking:s&&l.braking,speed:Math.hypot(l.vx,l.vy),well:s?d:0,anomaly:u,alive:s&&n.state!=="lost",stress:Math.hypot(l.vx,l.vy)/8+(h?.6:0)+(l.fuel<15?.3:0),danger:h})}adaptQuality(t){if(this.fpsT+=t,this.fpsN++,this.fpsT>2.5){let e=this.fpsN/this.fpsT;this.fpsT=0,this.fpsN=0,e<42&&this.quality>0?(this.quality--,this.r.setQuality(this.quality)):e>58&&this.quality<2&&this.lowSince&&performance.now()-this.lowSince>2e4&&(this.quality++,this.r.setQuality(this.quality)),e<42&&(this.lowSince=performance.now())}}drainEvents(){let t=this.world;for(let e of t.events)if(this.r.onEvent(e,t),this.mode==="play"&&this.audio.event(e),this.mode==="play")switch(e.type){case"crash":this.hitstop=.11,gx(),xx(.35);break;case"bump":e.strength>2&&(Mt("vignette").style.opacity=.7,setTimeout(()=>Mt("vignette").style.opacity=0,160),this.closeCall=t.t);break;case"slip":this.showHint(`TOO FAST \u2014 ${e.rel.toFixed(1)} m/s  (MAX ${e.limit})`,1.6,!0),this.closeCall=t.t;break;case"shove":this.showHint(`EASY! ${e.rel.toFixed(1)} m/s \u2014 REN NEEDS UNDER ${e.limit}`,2,!0);break;case"capture":this.slow=.3;break;case"rescue":this.slow=.4;break;case"dry":this.showHint("PROPELLANT DRY",2,!0);break;case"latch":this.attempts<=2&&this.showHint("LATCHED \u2014 RIDE IT OUT",1.6);break;case"win":this.endTimer=1.2;break;case"fail":this.endTimer=e.cause==="impact"?1:e.cause==="void"||e.cause==="missed"?1.4:1.2;break}t.events.length=0}updateHud(t){let e=this.world,n=e.player,s=Math.hypot(n.vx,n.vy);Mt("time").textContent=Fo(e.playT);let r=e.goal,a=null,o=s,l=null;r&&(r.type==="rescue"?a={x:e.npc.x,y:e.npc.y,vx:e.npc.vx,vy:e.npc.vy}:a=Ze(e,r),o=Math.hypot(n.vx-a.vx,n.vy-a.vy),l=r.maxSpeed);let c=a?Math.hypot(a.x-n.x,a.y-n.y):0,h=c<18,d=h?o:s;Mt("spdVal").textContent=`${d.toFixed(1)} m/s`;let u=10;Mt("spdFill").style.width=`${Math.min(100,d/u*100)}%`;let f=Mt("spdBar");f.classList.toggle("over",h&&o>l),f.classList.toggle("under",h&&o<=l),Mt("spdVal").className="val "+(h?o>l?"over":"under":"");let p=Mt("spdLimit");if(p.style.display=h?"block":"none",l&&(p.style.left=`${l/u*100}%`),Mt("fuelVal").textContent=`${Math.ceil(n.fuel)}%`,Mt("fuelFill").style.width=`${n.fuel}%`,Mt("fuelBar").classList.toggle("low",n.fuel<20),a&&e.state==="play"){let y=this.r.toScreen(a.x,a.y+(r.type==="rescue"?1.5:r.shape==="box"?r.h/2+1.6:r.r+.8),.5),x=innerWidth,m=innerHeight,b=40,T=y.x>b&&y.x<x-b&&y.y>b&&y.y<m-b&&!y.behind,v=Mt("goalTag");v.style.display=T?"block":"none",T&&(v.style.left=`${y.x}px`,v.style.top=`${y.y}px`,v.firstChild.textContent=r.label,v.lastChild.textContent=h?`${o.toFixed(1)} / ${l} m/s`:`\u2264 ${l} m/s`,v.className=h?o>l?"over":"under":"");let w=Mt("edge");if(w.style.display=T?"none":"block",!T){let A=x/2,E=m/2,g=Math.atan2(y.y-E,y.x-A);y.behind&&(g+=Math.PI);let M=Math.min((x/2-30)/Math.abs(Math.cos(g)||1e-6),(m/2-30)/Math.abs(Math.sin(g)||1e-6));w.style.left=`${A+Math.cos(g)*M-7}px`,w.style.top=`${E+Math.sin(g)*M-8}px`,w.style.transform=`rotate(${g}rad)`}Mt("cmpArrow").style.transform=`rotate(${-Math.atan2(a.y-n.y,a.x-n.x)}rad)`,Mt("cmpDist").textContent=`${c.toFixed(0)} M`}else Mt("goalTag").style.display="none",Mt("edge").style.display="none";if(e.state==="play"&&this.attempts<=3)for(let y of this.def.hints)y.at||this.hintsShown.has(y)||y.when(e)&&(this.hintsShown.add(y),this.showHint(y.text,y.dur||2.2,/TOO|WALL|WARN/.test(y.text)));e.state!=="play"&&!this.resultShown&&(this.endTimer-=t,this.endTimer<=0&&this.showResult())}showResult(){this.resultShown=!0;let t=this.world,e=Mt("card");if(Mt("hint").classList.remove("on"),t.state==="lost"){let n=t.cause.kind;n==="void"&&this.def.look.final&&t.player.x>t.bounds.x1-1&&(n="horizon");let[s,r]=sd[n]||sd.impact,a="";n==="impact"?a=`impact ${t.cause.speed.toFixed(1)} m/s \xB7 suit rated to ${Yt.crashSpeed}`:n==="void"&&(a=`last seen at ${Math.hypot(t.player.vx,t.player.vy).toFixed(1)} m/s`),e.className="card fail",e.innerHTML=`<h1>${s}</h1><p class="sub">${id(r,this.attempts*7+t.t*3)}</p>${a?`<p class="detail">${a}</p>`:""}
        <div class="row"><button class="btn primary" data-act="retry">RETRY<kbd>R</kbd></button><button class="btn" data-act="stages">STAGES</button></div>
        <div class="attempt">ATTEMPT ${this.attempts} \xB7 ${this.isTouch?"TAP":"SPACE / R"} TO GO AGAIN</div>`}else{let n=this.world.goals[this.world.goals.length-1].label,s=t.playT,r=t.stats.fuelUsed,a=this.def.par,o=s<=a.time,l=r<=a.fuel,c=1+(o?1:0)+(l?1:0),h=this.save.get(this.def.id);this.save.put(this.def.id,{time:s,stars:c,fuel:r});let d=!h||s<h.best,u=this._lastCapture||0,f;this.closeCall>0&&t.t-this.closeCall<3?f=id(["Holy\u2014 you actually made it.","That should not have worked. It worked.","Saved it. Barely. Beautifully."],this.attempts):t.player.fuel<4?f="Running on fumes. Counts the same.":u<.45?f=`Feather-soft. ${u.toFixed(2)} m/s.`:u>.8*this.lastLimit?f=`${u.toFixed(1)} m/s \u2014 that was hot.`:f=`Contact at ${u.toFixed(1)} m/s.`;let p=this.def.experimental?"STAGES":this.stageIndex+1<Je.length?"NEXT":"FINISH";e.className="card win",e.innerHTML=`<h1>${mx[n]||"SECURED"}</h1><p class="sub">${f}</p>
        <p class="detail">${Fo(s)}${d?" \xB7 BEST":""} \xB7 ${Math.round(r)}% propellant \xB7 ${this.attempts} ${this.attempts===1?"attempt":"attempts"}</p>
        <div class="stars"><span class="got"><em>\u2605</em>ARRIVED</span><span class="${o?"got":""}"><em>\u2605</em>\u2264 ${Fo(a.time).slice(1)}</span><span class="${l?"got":""}"><em>\u2605</em>\u2264 ${a.fuel}% FUEL</span></div>
        <div class="row"><button class="btn primary" data-act="next">${p}<kbd>\u23CE</kbd></button><button class="btn" data-act="retry">RETRY<kbd>R</kbd></button></div>`}Mt("result").classList.remove("hide")}};function gx(){let i=Mt("crack");i.style.transition="none",i.style.opacity=.75,requestAnimationFrame(()=>{i.style.transition="opacity 2.5s ease-in",i.style.opacity=.3})}function xx(i){let t=Mt("flash");t.style.transition="none",t.style.opacity=i,requestAnimationFrame(()=>{t.style.transition="opacity .45s",t.style.opacity=0})}var Pe=new Sc,yx=Pe.drainEvents.bind(Pe);Pe.drainEvents=function(){for(let i of this.world.events)i.type==="capture"&&(this._lastCapture=i.rel,this.lastLimit=this.world.goal?this.world.goal.maxSpeed:1.5);yx()};window.__sd={game:Pe,STAGES:Je,EXPERIMENTS:Sr,get world(){return Pe.world},force(i){Pe.forced=i},autopilot(i,t=0){Pe.startPlay(i),Pe.autoplan=nd($o[i],t)},stopAuto(){Pe.autoplan=null},start(i){Pe.startPlay(i)},stepSim(i,t){for(let e=0;e<i;e++)Pe.world.step(t||{turn:0,thrust:!1,brake:!1})},pauseSim(i){Pe.manualStep=i},result(){Pe.resultShown||Pe.showResult()},snap(){Pe.view.cinematic=null,Pe.r.snapCamera(Pe.world,Pe.view),document.getElementById("brief").classList.add("out")}};})();
