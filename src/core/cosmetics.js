export const BASE_TILE_IDS = ['beach_ball', 'beach_hat', 'camera', 'coconut', 'crab', 'ice_cream', 'sandal', 'seagull', 'seashell', 'summer_shirt', 'summer_shorts', 'sunglasses', 'swim_ring', 'tropical_fish', 'tropical_juice'];
export const COSMETICS = [
  { id: 'avatar_fox', category: 'avatar', name: 'Rubi si Rubah', price: 250, asset: '/assets/cosmetics/fox.webp', description: 'Teman kecil untuk petualangan besar.' },
  { id: 'avatar_panda', category: 'avatar', name: 'Panda Santai', price: 350, asset: '/assets/cosmetics/panda.webp', description: 'Tenang, fokus, dan menggemaskan.' },
  { id: 'frame_sunset', category: 'frame', name: 'Bingkai Senja', price: 400, value: 'sunset', asset:'/assets/cosmetics/frame-sunset.png', description: 'Bingkai emas dengan permata senja.' },
  { id: 'frame_aurora', category: 'frame', name: 'Bingkai Aurora', price: 650, value: 'aurora', asset:'/assets/cosmetics/frame-aurora.png', description: 'Ukiran kristal biru kehijauan.' },
  { id: 'tiles_garden', category: 'tiles', name: 'Garden Party', price: 500, value: 'garden', description: '15 gambar bunga, daun, dan buah. Onet + Tile Trio.' },
  { id: 'tiles_space', category: 'tiles', name: 'Cosmic Club', price: 650, value: 'space', description: '15 gambar kosmik. Terpisah dari tema.' },
  { id: 'tile_gold_crab', category: 'tile', name: 'Kepiting Emas', price: 150, value: 'crab', asset: '/assets/cosmetics/gold-crab.png', description: 'Satu gambar eksklusif untuk tile kepiting.' },
  { id: 'block_mint', category: 'block', name: 'Mint Jelly', price: 450, value: 'mint', asset:'/assets/cosmetics/block-mint.png', description: 'Balok jelly bergambar, berkilau hijau mint.' },
  { id: 'block_sunset', category: 'block', name: 'Sunset Candy', price: 550, value: 'sunset', asset:'/assets/cosmetics/block-sunset.png', description: 'Balok bergambar permen senja.' },
];
export const COSMETIC_FIELDS = { avatar: 'activeAvatarId', frame: 'activeFrame', tiles: 'activeTilePack', tile: 'activeSingleTile', block: 'activeBlockSkin' };
export const ownsCosmetic = (p, id) => (p.ownedCosmetics || []).includes(id);
export const cosmeticAsset = id => COSMETICS.find(c => c.id === id)?.asset;