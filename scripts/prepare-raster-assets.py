"""Prepare original generated raster game art; retains source attribution manifest."""
from pathlib import Path
from urllib.request import urlretrieve
from PIL import Image, ImageChops, ImageDraw
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/cosmetics'
SOURCE = ROOT / 'asset-sources'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(exist_ok=True)
BASE = 'https://static.prod-images.emergentagent.com/jobs/4590238b-13bc-4e78-ac57-c5f6cdfb4ebb/images/'
FILES = {
    'garden': '5c8fb0aa1a332de43d2b8c801882d9bffc1e9442254c9494d2dd689d8bb85e4b.jpeg',
    'space': '4c243ed2f07999e4e600e14517f32682be277a6dc8ccd42d6033fbdf2250ff49.jpeg',
    'materials': 'd8f329bf4b61d774d4f72cf5a8db47f426f78138448cf83e6e66b758aeb0593d.jpeg',
    'gold-crab': '1e0c053b59759d54fda348755bf788c8197ebb2fb5a99bb611d0d5772b6d4031.jpeg',
    'panda': '77c75b6655eb14a59ffdd32f816d990915938a1dc0c41f5b8031015f38b76410.jpeg',
    'fox': 'ae187dbdd1a889296025f1307e35c045c4999e5cb2572ac0eef55947646ea603.jpeg',
}
IDS = ['beach_ball','beach_hat','camera','coconut','crab','ice_cream','sandal','seagull','seashell','summer_shirt','summer_shorts','sunglasses','swim_ring','tropical_fish','tropical_juice']

def cutout(im, size, hollow=False):
    im = im.convert('RGBA')
    # Flood only connected near-white background; white highlights stay intact.
    rgb = im.convert('RGB')
    mask = Image.new('L', im.size)
    mask.putdata([255 if min(p) > 236 and max(p)-min(p) < 22 else 0 for p in rgb.getdata()])
    ImageDraw.floodfill(mask, (0,0), 128)
    for xy in [(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1)]: ImageDraw.floodfill(mask,xy,128)
    if hollow: ImageDraw.floodfill(mask,(im.width//2,im.height//2),128)
    alpha=mask.point(lambda v: 0 if v==128 else 255)
    im.putalpha(alpha)
    bbox=alpha.getbbox()
    if bbox: im=im.crop(bbox)
    im.thumbnail((int(size*.88),int(size*.88)),Image.Resampling.LANCZOS)
    result=Image.new('RGBA',(size,size));result.alpha_composite(im,((size-im.width)//2,(size-im.height)//2))
    return result

for key, file in FILES.items():
    path=SOURCE/(key+'.jpg')
    if not path.exists(): urlretrieve(BASE+file,path)
    image=Image.open(path).convert('RGB')
    if key in ('garden','space'):
        folder=OUT/key;folder.mkdir(exist_ok=True)
        for i,id in enumerate(IDS):
            x,y=i%4,i//4; w,h=image.size
            tile=image.crop((round(x*w/4)+2,round(y*h/4)+2,round((x+1)*w/4)-2,round((y+1)*h/4)-2))
            cutout(tile,192).save(folder/(id+'.png'),optimize=True)
    elif key=='materials':
        for i,name in enumerate(['block-mint','block-sunset','frame-sunset','frame-aurora']):
            w,h=image.size;x,y=i%2,i//2
            cell=image.crop((x*w//2+3,y*h//2+3,(x+1)*w//2-3,(y+1)*h//2-3))
            result=cutout(cell,256,hollow=i>1)
            if i<2:
                # Tight square crop makes a continuous readable block texture.
                result=result.crop(result.getbbox()).resize((128,128),Image.Resampling.LANCZOS)
            result.save(OUT/(name+'.png'),optimize=True)
    elif key=='gold-crab': cutout(image,256).save(OUT/(key+'.png'),optimize=True)
    else: image.resize((384,384),Image.Resampling.LANCZOS).save(OUT/(key+'.webp'),quality=92)
(SOURCE/'manifest.json').write_text(json.dumps({'provenance':'Original AI-generated raster illustrations, prepared for Connectify; no SVG conversion.','sources':{k:BASE+v for k,v in FILES.items()}},indent=2))
print('Raster assets prepared:', len(list(OUT.rglob('*.png'))), 'PNG and',len(list(OUT.glob('*.webp'))),'WebP')