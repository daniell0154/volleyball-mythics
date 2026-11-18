import {Vector3,MathUtils,type PerspectiveCamera} from "three";
export function visualBallScale(camera:PerspectiveCamera,ball:{x:number;y:number;z:number},height:number,minPixels=12):number{
 const depth=-new Vector3(ball.x,ball.y,ball.z).applyMatrix4(camera.matrixWorldInverse).z;
 return Math.max(1,2*Math.max(.1,depth)*Math.tan(MathUtils.degToRad(camera.fov)/2)*minPixels/Math.max(1,height)/.22);
}
export function ballScreenCue(camera:PerspectiveCamera,ball:{x:number;y:number;z:number},width:number,height:number,margin=0){
 const projected=new Vector3(ball.x,ball.y,ball.z).project(camera);
 const insetX=Math.min(width/2,Math.max(16,margin));
 const insetY=Math.min(height/2,Math.max(16,margin));
 const offscreen=Math.abs(projected.x)>Math.min(.95,1-2*insetX/width)||Math.abs(projected.y)>Math.min(.95,1-2*insetY/height)||projected.z< -1||projected.z>1;
 const behind=projected.z>1?-1:1,x=projected.x*behind,y=projected.y*behind;
 return{x:Math.max(insetX,Math.min(width-insetX,(x+1)*width/2)),y:Math.max(insetY,Math.min(height-insetY,(1-y)*height/2)),offscreen,arrow:['→','↗','↑','↖','←','↙','↓','↘'][(Math.round(Math.atan2(y,x)/(Math.PI/4))+8)%8]??'↑'};
}
