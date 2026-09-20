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
  { id: 'avatar_starlight', category: 'avatar', name: 'Rubah Starlight', price: 900, asset: '/assets/premium/cosmetics/avatar-starlight.png', description: 'Penjaga konstelasi dengan tatapan safir.' },
  { id: 'avatar_moon_panda', category: 'avatar', name: 'Panda Moonlit', price: 850, asset: '/assets/premium/cosmetics/avatar-moon-panda.png', description: 'Panda malam yang membawa keberuntungan.' },
  { id: 'frame_constellation', category: 'frame', name: 'Konstelasi Royale', price: 1100, value: 'constellation', asset: '/assets/premium/cosmetics/frame-constellation.png', description: 'Bingkai langit malam dengan ukiran bintang.' },
  { id: 'frame_sapphire', category: 'frame', name: 'Sapphire Halo', price: 1250, value: 'sapphire', asset: '/assets/premium/cosmetics/frame-sapphire.png', description: 'Halo kristal safir untuk profil istimewa.' },
  { id: 'tiles_nocturne', category: 'tiles', name: 'Nocturne Royale', price: 1500, value: 'nocturne', description: 'Paket 15 tile midnight navy dan champagne gold.' },
  { id: 'tiles_royal_garden', category: 'tiles', name: 'Royal Garden', price: 1000, value: 'royal_garden', description: 'Paket tile botani mewah bernuansa permata.' },
  { id: 'tile_sapphire_ball', category: 'tile', name: 'Orb Safir', price: 300, value: 'beach_ball', asset: '/assets/premium/tiles/beach_ball.png', description: 'Bola kristal safir dengan ukiran emas.' },
  { id: 'tile_gilded_camera', category: 'tile', name: 'Kamera Gilded', price: 350, value: 'camera', asset: '/assets/premium/tiles/camera.png', description: 'Kamera vintage berlapis emas champagne.' },
  { id: 'tile_moon_coconut', category: 'tile', name: 'Moon Coconut', price: 300, value: 'coconut', asset: '/assets/premium/tiles/coconut.png', description: 'Minuman malam dengan kilau bintang.' },
  { id: 'tile_jewel_fish', category: 'tile', name: 'Jewel Fish', price: 400, value: 'tropical_fish', asset: '/assets/premium/tiles/tropical_fish.png', description: 'Ikan permata dari laguna tengah malam.' },
  { id: 'tile_royal_shell', category: 'tile', name: 'Royal Shell', price: 325, value: 'seashell', asset: '/assets/premium/tiles/seashell.png', description: 'Kerang mutiara dengan tepian emas.' },
  { id: 'tile_aurora_juice', category: 'tile', name: 'Aurora Juice', price: 375, value: 'tropical_juice', asset: '/assets/premium/tiles/tropical_juice.png', description: 'Minuman tropis berkilau aurora.' },
  { id: 'block_royal', category: 'block', name: 'Royal Glass', price: 1000, value: 'royal', asset: '/assets/premium/cosmetics/block-royal.png', description: 'Skin balok kaca navy dengan tepi champagne.' },
  { id: 'block_aurora', category: 'block', name: 'Aurora Jewel', price: 950, value: 'aurora', asset: '/assets/premium/cosmetics/block-aurora.png', description: 'Balok permata dengan cahaya aurora.' },
  { id: 'block_sapphire', category: 'block', name: 'Sapphire Grid', price: 800, value: 'sapphire', asset: '/assets/premium/cosmetics/block-royal.png', description: 'Grid safir elegan untuk Block Puzzle.' },
];
export const COSMETIC_FIELDS = { avatar: 'activeAvatarId', frame: 'activeFrame', tiles: 'activeTilePack', tile: 'activeSingleTile', block: 'activeBlockSkin' };
export const ownsCosmetic = (p, id) => (p.ownedCosmetics || []).includes(id);
export const cosmeticAsset = id => COSMETICS.find(c => c.id === id)?.asset;
