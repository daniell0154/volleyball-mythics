import {Vector3,type PerspectiveCamera} from "three";
import type { CourtInsets } from "../game/presentation.js";
export function visualBallScale(camera:PerspectiveCamera,ball:{x:number;y:number;z:number},height:number,minPixels=12):number{
 const depth=-new Vector3(ball.x,ball.y,ball.z).applyMatrix4(camera.matrixWorldInverse).z;
 return Math.max(1,2*Math.max(.1,depth)*minPixels/(Math.max(1,height)*camera.projectionMatrix.elements[5]!*.22));
}
export function ballScreenCue(camera:PerspectiveCamera,ball:{x:number;y:number;z:number},width:number,height:number,margin=0,insets:CourtInsets={top:0,bottom:0}){
 const projected=new Vector3(ball.x,ball.y,ball.z).project(camera);
 const usableHeight=Math.max(1,height-insets.top-insets.bottom);
 const insetX=Math.min(width/2,Math.max(16,margin,width*.025));
 const insetY=Math.min(usableHeight/2,Math.max(16,margin,usableHeight*.025));
 const top=insets.top+insetY,bottom=height-insets.bottom-insetY;
 const behind=projected.z>1?-1:1,x=projected.x*behind,y=projected.y*behind;
 const screenX=(x+1)*width/2,screenY=(1-y)*height/2;
 const offscreen=screenX<insetX||screenX>width-insetX||screenY<top||screenY>bottom||projected.z< -1||projected.z>1;
 return{x:Math.max(insetX,Math.min(width-insetX,screenX)),y:Math.max(top,Math.min(bottom,screenY)),offscreen,arrow:['→','↗','↑','↖','←','↙','↓','↘'][(Math.round(Math.atan2(y,x)/(Math.PI/4))+8)%8]??'↑'};
}
