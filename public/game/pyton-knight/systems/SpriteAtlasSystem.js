/* Runtime asset preparation: preserve the generated sources, key their flat
   backdrop, and normalize frame anchors before Phaser builds animations. */
(function () {
    'use strict';
    const names=['lever_off','lever_on','light_off','light_on','book_closed','book_open','rune_off','rune_on','portal_off','portal_on','ruby','crystal','chest_closed','chest_opening','chest_open','scroll'];
    function canvas (w,h) { const c=document.createElement('canvas');c.width=w;c.height=h;return c; }
    function normalize (image, rows, maxHeight, maxWidth) {
        const source=canvas(image.width,image.height),ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
        const data=ctx.getImageData(0,0,source.width,source.height),pixels=data.data;
        for(let i=0;i<pixels.length;i+=4) if(pixels[i]>140 && pixels[i+2]>140 && Math.min(pixels[i],pixels[i+2])-pixels[i+1]>90) pixels[i+3]=0;
        ctx.putImageData(data,0,0);
        const frames=[]; const xs=[0,320,630,930,1254].map(x=>Math.round(x/1254*image.width));
        const ys=rows.map(y=>Math.round(y/1254*image.height));
        for(let r=0;r<4;r++)for(let c=0;c<4;c++){
            let left=xs[c+1],right=xs[c],top=ys[r+1],bottom=ys[r];
            for(let y=ys[r];y<ys[r+1];y++)for(let x=xs[c];x<xs[c+1];x++) if(pixels[(y*source.width+x)*4+3]) {left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
            if(right<left) throw Error('O atlas contém um quadro vazio.');
            frames.push({left,top,width:right-left+1,height:bottom-top+1});
        }
        const result=canvas(256,256),out=result.getContext('2d');out.imageSmoothingEnabled=false;
        for(let i=0;i<16;i++){
            const f=frames[i];
            // Character frames share scale, so stride and height never pop.
            const scale=maxHeight===50 ? Math.min(50/Math.max(...frames.map(f=>f.height)),42/Math.max(...frames.map(f=>f.width))) : Math.min(maxHeight/f.height,maxWidth/f.width);
            const w=Math.round(f.width*scale),h=Math.round(f.height*scale),x=(i%4)*64+Math.round((64-w)/2),y=Math.floor(i/4)*64+59-h;
            out.drawImage(source,f.left,f.top,f.width,f.height,x,y,w,h);
        }
        return result;
    }
    window.SpriteAtlasSystem={
        names, normalize,
        tileNames:['floor','floor_cracked','floor_rune','bridge'],
        tiles (image) {
            return this.tileNames.map((name,i)=>{const tile=canvas(64,64),ctx=tile.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(image,(i%2)*image.width/2,Math.floor(i/2)*image.height/2,image.width/2,image.height/2,0,0,64,64);return tile;});
        },
        prepare (scene) {
            const guto=normalize(scene.textures.get('v3_guto_source').getSourceImage(),[0,345,630,910,1254],50,42);
            scene.textures.addSpriteSheet('guto_v3',guto,{frameWidth:64,frameHeight:64});
            const props=normalize(scene.textures.get('v3_props_source').getSourceImage(),[0,310,600,910,1254],54,54);
            for(let i=0;i<16;i++) {const frame=canvas(64,64);frame.getContext('2d').drawImage(props,(i%4)*64,Math.floor(i/4)*64,64,64,0,0,64,64);scene.textures.addCanvas(`official_v3_${names[i]}`,frame);}
            this.tiles(scene.textures.get('v3_tiles_source').getSourceImage()).forEach((tile,i)=>scene.textures.addCanvas(`official_v3_${this.tileNames[i]}`,tile));
        }
    };
})();
