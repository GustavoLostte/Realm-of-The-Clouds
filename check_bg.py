from PIL import Image

def get_bg(path):
    img = Image.open(path).convert('RGB')
    print(path, img.getpixel((0,0)), img.getpixel((10,10)))

get_bg('/Users/wizzard/.gemini/antigravity-ide/brain/ed15d121-ffd9-4d2f-9e3f-b9f60dcd681a/slime_jelly_1790284154878.jpg')
get_bg('/Users/wizzard/.gemini/antigravity-ide/brain/ed15d121-ffd9-4d2f-9e3f-b9f60dcd681a/bat_wing_1790284169612.jpg')
get_bg('/Users/wizzard/.gemini/antigravity-ide/brain/ed15d121-ffd9-4d2f-9e3f-b9f60dcd681a/skeleton_bone_1790284180688.jpg')
get_bg('/Users/wizzard/.gemini/antigravity-ide/brain/ed15d121-ffd9-4d2f-9e3f-b9f60dcd681a/passive_attack_1790284229011.jpg')
get_bg('/Users/wizzard/.gemini/antigravity-ide/brain/ed15d121-ffd9-4d2f-9e3f-b9f60dcd681a/passive_defense_1790284237702.jpg')
