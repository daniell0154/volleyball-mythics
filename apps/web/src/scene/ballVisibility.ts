import {Vector3,MathUtils,type PerspectiveCamera} from "three";
export function visualBallScale(camera:PerspectiveCamera,ball:{x:number;y:number;z:number},height:number,minPixels=12):number{
 const depth=-new Vector3(ball.x,ball.y,ball.z).applyMatrix4(camera.matrixWorldInverse).z;
 return Math.max(1,2*Math.max(.1,depth)*Math.tan(MathUtils.degToRad(camera.fov)/2)*minPixels/Math.max(1,height)/.22);
}
export function ballScreenCue(camera:PerspectiveCamera,ball:{x:number;y:number;z:number},width:number,height:number){
 const projected=new Vector3(ball.x,ball.y,ball.z).project(camera);
 const offscreen=Math.abs(projected.x)>.95||Math.abs(projected.y)>.95||projected.z< -1||projected.z>1;
 const behind=projected.z>1?-1:1,x=projected.x*behind,y=projected.y*behind;
 return{x:Math.max(16,Math.min(width-16,(x+1)*width/2)),y:Math.max(16,Math.min(height-16,(1-y)*height/2)),offscreen,arrow:['→','↗','↑','↖','←','↙','↓','↘'][(Math.round(Math.atan2(y,x)/(Math.PI/4))+8)%8]??'↑'};
}
